import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yntpctzgxaderribxsbe.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHBjdHpneGFkZXJyaWJ4c2JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5ODQxMzksImV4cCI6MjA5MjU2MDEzOX0.vpXyxCAA3T58ARPm45_YIiX6jB7-P_E2OUSEOPM02y4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
