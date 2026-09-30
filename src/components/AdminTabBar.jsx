import { useEffect, useRef, useState } from 'react'

// Floating mobile tab bar for the admin shell. One accent thumb slides between
// slots; the bar tucks away while scrolling down and returns on scroll-up.
export default function AdminTabBar({ items, activeIndex, onSelect }) {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    lastY.current = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const delta = y - lastY.current
      if (Math.abs(delta) < 6) return
      setHidden(delta > 0 && y > 80)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`x-tabbar${hidden ? ' is-hidden' : ''}`}
      aria-label="Admin sections"
      style={{ '--n': items.length, '--idx': Math.max(activeIndex, 0) }}
    >
      {activeIndex >= 0 && <span className="x-tabbar-thumb" aria-hidden="true" />}
      {items.map((item, i) => {
        const active = i === activeIndex
        return (
          <button
            key={item.path}
            onClick={() => onSelect(item)}
            aria-current={active ? 'page' : undefined}
            className={`x-tab${active ? ' active' : ''}`}
          >
            <span className="x-tab-icon">{item.icon}</span>
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
