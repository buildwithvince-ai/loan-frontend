import { useState, useEffect, useRef, useCallback } from 'react'
import {
  DndContext,
  closestCorners,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { adminFetch } from '../../pages/admin/AdminDashboard'
import { useAuth } from '../../context/AuthContext'
import { PIPELINE_STAGES } from '../../constants/pipeline'
import KanbanColumn from './KanbanColumn'
import KanbanCard from './KanbanCard'
import TransitionModal from './TransitionModal'
import ReturnModal from './ReturnModal'

const LOCKED_STAGES = ['loan_processing_officer', 'declined']

function groupByStage(apps) {
  const groups = {}
  for (const stage of PIPELINE_STAGES) {
    groups[stage] = []
  }
  for (const app of apps) {
    const stage = app.pipeline_stage || 'sales_officer'
    if (groups[stage]) {
      groups[stage].push(app)
    } else {
      groups['sales_officer'].push(app)
    }
  }
  return groups
}

export default function KanbanBoard({ searchFilter = '', typeFilter = 'all', onCardClick }) {
  const { roles, hasRole, user } = useAuth()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  // Drag state
  const [activeApp, setActiveApp] = useState(null)
  const [pendingTransition, setPendingTransition] = useState(null) // { app, fromStage, toStage }

  // Verifier / approver action state
  const [returnApp, setReturnApp] = useState(null) // app for ReturnModal
  const [soConfirmLoading, setSoConfirmLoading] = useState(null) // app id being confirmed

  const intervalRef = useRef(null)

  const fetchApps = useCallback(async () => {
    try {
      const res = await adminFetch('/applications')
      if (!res.ok) throw new Error('Failed to fetch applications')
      const data = await res.json()
      const list = Array.isArray(data) ? data : data.applications || []
      setApps(list)
      setFetchError(null)
    } catch (err) {
      setFetchError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApps()
    intervalRef.current = setInterval(fetchApps, 30000)
    return () => clearInterval(intervalRef.current)
  }, [fetchApps])

  // Apply client-side filters
  const filteredApps = apps.filter((app) => {
    // Sales-officer-only users see only their own applications
    const elevatedRoles = ['super_admin', 'admin', 'approver', 'verifier', 'ci_officer', 'loan_processing_officer']
    if (hasRole('sales_officer') && !roles.some((r) => elevatedRoles.includes(r)) && user?.id) {
      if (app.assigned_sales_officer !== user.id) return false
    }

    if (typeFilter !== 'all' && app.loan_type !== typeFilter) return false

    if (searchFilter) {
      const q = searchFilter.toLowerCase()
      const name = [
        app.firstName || app.first_name || '',
        app.lastName || app.last_name || '',
      ].join(' ').toLowerCase()
      const phone = (app.mobile || app.phone || '').toLowerCase()
      const ref = (app.reference_id || '').toLowerCase()
      if (!name.includes(q) && !phone.includes(q) && !ref.includes(q)) return false
    }

    return true
  })

  const grouped = groupByStage(filteredApps)

  // DnD sensors — require 8px movement to start drag (prevents accidental drags on click)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  function findAppStage(appId) {
    for (const stage of PIPELINE_STAGES) {
      if (grouped[stage]?.some((a) => String(a.id || a._id || a.reference_id) === String(appId))) {
        return stage
      }
    }
    return null
  }

  function handleDragStart({ active }) {
    const dragged = filteredApps.find(
      (a) => String(a.id || a._id || a.reference_id) === String(active.id)
    )
    setActiveApp(dragged || null)
  }

  function handleDragEnd({ active, over }) {
    setActiveApp(null)
    if (!over) return

    const fromStage = findAppStage(active.id)
    const toStage = over.id // column id === stage key

    if (!fromStage || fromStage === toStage) return

    // Locked columns — cannot drag out
    if (LOCKED_STAGES.includes(fromStage)) return
    // Locked columns — cannot drag into loan_processing_officer directly
    if (toStage === 'loan_processing_officer' && fromStage !== 'approver') return

    const app = filteredApps.find(
      (a) => String(a.id || a._id || a.reference_id) === String(active.id)
    )
    if (!app) return

    // Open transition modal — don't commit yet
    setPendingTransition({ app, fromStage, toStage })
  }

  function handleTransitionConfirm() {
    // Update local state optimistically after API confirmed in modal
    if (!pendingTransition) return
    const { app, toStage } = pendingTransition
    setApps((prev) =>
      prev.map((a) => {
        const id = a.id || a._id || a.reference_id
        const targetId = app.id || app._id || app.reference_id
        if (String(id) === String(targetId)) {
          return { ...a, pipeline_stage: toStage }
        }
        return a
      })
    )
    setPendingTransition(null)
  }

  function handleTransitionCancel() {
    // Simply close modal — no state change, card snaps back automatically
    setPendingTransition(null)
  }

  function handleVerifierAction(app, action) {
    if (action === 'approve') {
      setPendingTransition({ app, fromStage: 'verifier', toStage: 'ci_officer' })
    } else if (action === 'return') {
      setReturnApp(app)
    } else if (action === 'decline') {
      setPendingTransition({ app, fromStage: 'verifier', toStage: 'declined' })
    }
  }

  async function handleRequestSOConfirmation(app) {
    const appId = app.id || app._id
    setSoConfirmLoading(appId)
    try {
      const res = await adminFetch(`/pipeline/${appId}/so-confirmation`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to send confirmation')
      }
      setApps(prev => prev.map(a => {
        if (String(a.id || a._id) === String(appId)) {
          return { ...a, so_confirmation_sent_at: new Date().toISOString() }
        }
        return a
      }))
    } catch (err) {
      alert(err.message)
    } finally {
      setSoConfirmLoading(null)
    }
  }

  function handleReturnConfirm() {
    if (!returnApp) return
    setApps(prev => prev.map(a => {
      if (String(a.id || a._id) === String(returnApp.id || returnApp._id)) {
        return {
          ...a,
          pipeline_stage: 'sales_officer',
          returned_count: (a.returned_count || 0) + 1,
        }
      }
      return a
    }))
    setReturnApp(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 mb-4">{fetchError}</p>
        <button
          onClick={fetchApps}
          className="text-green hover:text-green-hover text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Horizontal scrolling board */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {PIPELINE_STAGES.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                cards={grouped[stage] || []}
                onCardClick={onCardClick}
                onVerifierAction={handleVerifierAction}
                onRequestSOConfirmation={handleRequestSOConfirmation}
                userRoles={roles}
              />
            ))}
          </div>
        </div>

        {/* Drag overlay — floating ghost card */}
        <DragOverlay dropAnimation={null}>
          {activeApp ? (
            <div className="rotate-2 scale-105">
              <KanbanCard
                app={activeApp}
                onCardClick={() => {}}
                isLocked={false}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Transition confirmation modal */}
      {pendingTransition && (
        <TransitionModal
          fromStage={pendingTransition.fromStage}
          toStage={pendingTransition.toStage}
          application={pendingTransition.app}
          onConfirm={handleTransitionConfirm}
          onCancel={handleTransitionCancel}
        />
      )}

      {/* Return modal */}
      {returnApp && (
        <ReturnModal
          application={returnApp}
          onConfirm={handleReturnConfirm}
          onCancel={() => setReturnApp(null)}
        />
      )}
    </>
  )
}
