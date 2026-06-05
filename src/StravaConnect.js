import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

const STRAVA_CLIENT_ID = '253698'
const STRAVA_REDIRECT_URI = 'https://statcard-ashen.vercel.app'

function calculateSportsStats(activities) {
  if (!activities || activities.length === 0) return null

  const runs = activities.filter(a => a.type === 'Run' || a.type === 'VirtualRun')
  const rides = activities.filter(a => a.type === 'Ride' || a.type === 'VirtualRide')
  const allCardio = [...runs, ...rides]

  const totalDistance = allCardio.reduce((a, act) => a + (act.distance || 0), 0) / 1000 // km
  const totalElevation = allCardio.reduce((a, act) => a + (act.total_elevation_gain || 0), 0)
  const totalTime = allCardio.reduce((a, act) => a + (act.moving_time || 0), 0) / 3600 // hours
  const activityCount = activities.length

  // Average pace from runs (seconds per km)
  const avgPace = runs.length > 0
    ? runs.reduce((a, r) => a + (r.moving_time / (r.distance / 1000 || 1)), 0) / runs.length
    : 0

  // Score calculations (benchmarks based on typical fitness levels)
  const staminaScore = Math.min(100, Math.round((totalDistance / 200) * 100)) // 200km = 100
  const enduranceScore = Math.min(100, Math.round((totalTime / 50) * 100)) // 50hrs = 100
  const strengthScore = Math.min(100, Math.round((totalElevation / 5000) * 100)) // 5000m elevation = 100
  const speedScore = avgPace > 0 ? Math.min(100, Math.round((600 / avgPace) * 100)) : 50 // 6min/km = 50
  const agilityScore = Math.min(100, Math.round((activityCount / 50) * 100)) // 50 activities = 100
  const recoveryScore = Math.min(100, Math.round(((staminaScore + enduranceScore) / 2)))

  return {
    strava_connected: true,
    verified_strava: true,
    strava_runs: activityCount,
    strava_distance: Math.round(totalDistance),
    strava_elevation: Math.round(totalElevation),
    sports_stamina: Math.max(20, staminaScore),
    sports_endurance: Math.max(20, enduranceScore),
    sports_strength: Math.max(20, strengthScore),
    sports_speed: Math.max(20, speedScore),
    sports_agility: Math.max(20, agilityScore),
    sports_recovery: Math.max(20, recoveryScore),
  }
}

export default function StravaConnect({ profile, onUpdate, onClose }) {
  const [step, setStep] = useState('intro')
  const [stats, setStats] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [athleteName, setAthleteName] = useState('')

  useEffect(() => {
    // Check if returning from Strava OAuth with code in URL
    const code = sessionStorage.getItem('strava_code')
    if (code) {
      sessionStorage.removeItem('strava_code')
      handleStravaCallback(code)
    } else if (profile?.strava_connected) {
      setStep('already')
    }
  }, [])

  async function handleStravaCallback(code) {
    setStep('connecting')
    try {
      // Exchange code for token via Strava API
      const res = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: STRAVA_CLIENT_ID,
          client_secret: '41fc3532e10fd2de53643730db7acf5f3fac2834',
          code,
          grant_type: 'authorization_code'
        })
      })
      const tokenData = await res.json()

      if (!tokenData.access_token) {
        setErrorMsg('Failed to get Strava access token.')
        setStep('error')
        return
      }

      const accessToken = tokenData.access_token
      const athlete = tokenData.athlete
      setAthleteName(`${athlete.firstname} ${athlete.lastname}`)

      // Fetch recent activities
      const activitiesRes = await fetch(
        'https://www.strava.com/api/v3/athlete/activities?per_page=100',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      const activities = await activitiesRes.json()

      const sportsStats = calculateSportsStats(activities)
      if (sportsStats) {
        sportsStats.strava_athlete_id = String(athlete.id)
        setStats(sportsStats)
        setStep('success')
      } else {
        setErrorMsg('No activities found on Strava.')
        setStep('error')
      }
    } catch (e) {
      setErrorMsg('Failed to connect Strava. Try again.')
      setStep('error')
    }
  }

  function handleStravaOAuth() {
    const scope = 'read,activity:read'
    const redirectUri = encodeURIComponent(STRAVA_REDIRECT_URI + '?strava_auth=1')
    const url = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`
    window.location.href = url
  }

  async function handleSave() {
    if (!stats) return
    setLoading(true)
    const { data } = await supabase.from('profiles').update(stats).eq('id', profile.id).select().single()
    if (data) onUpdate(data)
    setLoading(false)
    onClose()
  }

  const c = '#00f5a0'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: '#0d1120', border: `1px solid ${c}`, borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #ff6b00, #fc4c02)' }} />
        <div style={{ padding: '1.5rem' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: '14px', color: '#e8eaf0', margin: '0 0 3px', letterSpacing: '2px' }}>
                🏃 STRAVA CONNECT
              </h2>
              <p style={{ fontSize: '11px', color: '#3a4560', margin: 0, letterSpacing: '1px' }}>SPORTS · HEALTH STATS</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4a5568', cursor: 'pointer', fontSize: '20px' }}>×</button>
          </div>

          {/* INTRO */}
          {step === 'intro' && (
            <div>
              <div style={{ background: '#0a0f1e', border: '1px solid #1a2235', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px', lineHeight: 1.6 }}>
                  Connect Strava to auto-calculate your Sports stats from real activity:
                </p>
                {[
                  ['💨 Speed', 'Avg pace from your runs'],
                  ['🏋️ Strength', 'Elevation climbed'],
                  ['❤️ Stamina', 'Total distance covered'],
                  ['⏱ Endurance', 'Total hours active'],
                  ['🔄 Agility', 'Number of activities'],
                  ['😴 Recovery', 'Overall fitness score'],
                ].map(([label, desc]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: c }}>{label}</span>
                    <span style={{ fontSize: '12px', color: '#4a5568' }}>{desc}</span>
                  </div>
                ))}
              </div>
              <button onClick={handleStravaOAuth} style={{
                width: '100%', padding: '12px', marginBottom: '10px',
                background: 'linear-gradient(135deg, #fc4c02, #ff6b00)',
                border: 'none', borderRadius: '8px',
                fontFamily: "'Orbitron', monospace", fontSize: '12px',
                fontWeight: '700', color: '#fff', letterSpacing: '1px',
                textTransform: 'uppercase', cursor: 'pointer'
              }}>
                🟠 Connect with Strava
              </button>
            </div>
          )}

          {/* CONNECTING */}
          {step === 'connecting' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontFamily: "'Orbitron', monospace", color: '#fc4c02', fontSize: '13px', letterSpacing: '3px', marginBottom: '8px' }}>FETCHING STRAVA DATA...</div>
              <p style={{ color: '#3a4560', fontSize: '12px' }}>Analyzing your activities, pace and elevation</p>
            </div>
          )}

          {/* SUCCESS */}
          {step === 'success' && stats && (
            <div>
              <div style={{ background: 'rgba(252,76,2,0.08)', border: '1px solid #fc4c02', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px' }}>🏃</span>
                  <div>
                    <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '13px', color: '#fc4c02', fontWeight: '700' }}>{athleteName}</div>
                    <div style={{ fontSize: '11px', color: '#4a5568' }}>{stats.strava_runs} activities · {stats.strava_distance}km · {stats.strava_elevation}m elevation</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[
                    ['Stamina', stats.sports_stamina],
                    ['Endurance', stats.sports_endurance],
                    ['Strength', stats.sports_strength],
                    ['Speed', stats.sports_speed],
                    ['Agility', stats.sports_agility],
                    ['Recovery', stats.sports_recovery],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background: '#0a0f1e', borderRadius: '6px', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#4a5568', fontWeight: '700', textTransform: 'uppercase' }}>{label}</span>
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '14px', fontWeight: '700', color: c }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={handleSave} disabled={loading} style={{
                width: '100%', padding: '12px',
                background: 'linear-gradient(135deg, #fc4c02, #ff6b00)',
                border: 'none', borderRadius: '8px',
                fontFamily: "'Orbitron', monospace", fontSize: '12px',
                fontWeight: '700', color: '#fff', letterSpacing: '1px',
                textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1
              }}>
                {loading ? 'SAVING...' : '✅ SAVE TO MY STATCARD'}
              </button>
            </div>
          )}

          {/* ALREADY CONNECTED */}
          {step === 'already' && (
            <div>
              <div style={{ background: 'rgba(252,76,2,0.08)', border: '1px solid #fc4c02', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏃</div>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '13px', color: '#fc4c02', marginBottom: '4px' }}>Strava Connected</div>
                <div style={{ fontSize: '12px', color: '#4a5568' }}>{profile.strava_runs} activities · {profile.strava_distance}km total</div>
              </div>
              <button onClick={handleStravaOAuth} style={{
                width: '100%', padding: '10px',
                background: 'linear-gradient(135deg, #fc4c02, #ff6b00)',
                border: 'none', borderRadius: '8px', color: '#fff',
                fontFamily: "'Rajdhani', sans-serif", fontSize: '12px',
                fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer'
              }}>
                🔄 Reconnect / Update
              </button>
            </div>
          )}

          {/* ERROR */}
          {step === 'error' && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '13px', color: '#ef4444', marginBottom: '1rem' }}>{errorMsg}</div>
              <button onClick={() => setStep('intro')} style={{
                width: '100%', padding: '10px', background: 'transparent',
                border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444',
                fontFamily: "'Rajdhani', sans-serif", fontSize: '12px',
                fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer'
              }}>
                Try Again
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
