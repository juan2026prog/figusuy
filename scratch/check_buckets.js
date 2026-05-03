
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yntpctzgxaderribxsbe.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHBjdHpneGFkZXJyaWJ4c2JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5ODQxMzksImV4cCI6MjA5MjU2MDEzOX0.vpXyxCAA3T58ARPm45_YIiX6jB7-P_E2OUSEOPM02y4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkBuckets() {
  const { data, error } = await supabase.storage.listBuckets()
  if (error) {
    console.error('Error listing buckets:', error)
  } else {
    console.log('Buckets:', data.map(b => b.name))
  }
}

checkBuckets()
