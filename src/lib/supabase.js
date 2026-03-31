// Required environment variables:
// VITE_SUPABASE_URL     — Your Supabase project URL
// VITE_SUPABASE_ANON_KEY — Your Supabase anon/public key
// VITE_API_BASE_URL    — Backend API base (default: https://loan-backend-production-cd45.up.railway.app)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
