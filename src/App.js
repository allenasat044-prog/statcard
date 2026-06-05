import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import StatCard from './StatCard'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Handle Strava OAuth callback — exchange code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const stravaAuth = params.get('strava_auth')
    const code = params.get('code')
    if (stravaAuth && code) {
      // Store code so StravaConnect can pick it up
      sessionStorage.setItem('strava_code', code)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#070a12',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ fontFamily: "'Orbitron', monospace", color: '#00f5a0', letterSpacing: '3px', fontSize: '13px' }}>
        LOADING...
      </div>
    </div>
  )

  return user ? <StatCard user={user} /> : <Auth />
}
