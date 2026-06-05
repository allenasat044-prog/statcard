import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rxwyddxmuztnkueycpcd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4d3lkZHhtdXp0bmt1ZXljcGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTc4NjgsImV4cCI6MjA5NTEzMzg2OH0.T3R2RupE9uTFWYMKpxtflq3g5m0j2GMCP5YJKAkQTFs'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
