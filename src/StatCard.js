import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Leaderboard from './Leaderboard'
import GitHubConnect from './GitHubConnect'
import StravaConnect from './StravaConnect'
import FinanceCalculator from './FinanceCalculator'
import InfluenceCalculator from './InfluenceCalculator'

const CATS = {
  sports: {
    label: 'Sports · Health', color: '#00f5a0', fill: 'rgba(0,245,160,0.18)',
    grid: 'rgba(0,245,160,0.12)', badge: 'ATHLETE',
    fields: ['stamina','strength','agility','endurance','speed','recovery']
  },
  finance: {
    label: 'Finance · Money', color: '#facc15', fill: 'rgba(250,204,21,0.18)',
    grid: 'rgba(250,204,21,0.12)', badge: 'HUSTLER',
    fields: ['wealth','income','invest','savings','assets','credit']
  },
  political: {
    label: 'Political · Power', color: '#a78bfa', fill: 'rgba(167,139,250,0.18)',
    grid: 'rgba(167,139,250,0.12)', badge: 'NETWORKER',
    fields: ['influence','network','repute','reach','alliances','authority']
  },
  education: {
    label: 'Education · Expertise', color: '#38bdf8', fill: 'rgba(56,189,248,0.18)',
    grid: 'rgba(56,189,248,0.12)', badge: 'SCHOLAR',
    fields: ['iq','knowledge','skills','creativity','expertise','learning']
  }
}

function RadarChart({ cat, stats }) {
  const cx = 180, cy = 148, R = 108
  const fields = CATS[cat].fields
  const n = fields.length
  const c = CATS[cat]

  function pt(i, r) {
    const a = (Math.PI * 2 * i / n) - Math.PI / 2
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
  }

  const levels = [0.2, 0.4, 0.6, 0.8, 1.0]

  return (
    <svg viewBox="0 0 360 300" style={{ width: '100%', maxWidth: '360px' }}>
      {levels.map((lvl, li) => {
        const pts = fields.map((_, i) => pt(i, R * lvl))
        return <polygon key={li} points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={c.grid} strokeWidth="1" />
      })}
      {fields.map((_, i) => {
        const p2 = pt(i, R)
        return <line key={i} x1={cx} y1={cy} x2={p2.x} y2={p2.y} stroke={c.grid} strokeWidth="1" />
      })}
      <polygon
        points={fields.map((f, i) => { const p = pt(i, R * ((stats[`${cat}_${f}`] || 50) / 100)); return `${p.x},${p.y}` }).join(' ')}
        fill={c.fill} stroke={c.color} strokeWidth="2.5"
      />
      {fields.map((f, i) => {
        const p = pt(i, R * ((stats[`${cat}_${f}`] || 50) / 100))
        return <circle key={i} cx={p.x} cy={p.y} r="4" fill={c.color} />
      })}
      {fields.map((f, i) => {
        const lp = pt(i, R + 20)
        const vp = pt(i, R + 36)
        return (
          <g key={i}>
            <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fill="#4a5568" fontSize="8.5" fontFamily="Rajdhani,sans-serif" fontWeight="700" letterSpacing="1">
              {f.toUpperCase()}
            </text>
            <text x={vp.x} y={vp.y} textAnchor="middle" dominantBaseline="middle" fill={c.color} fontSize="13" fontFamily="Orbitron,monospace" fontWeight="700">
              {stats[`${cat}_${f}`] || 50}
            </text>
          </g>
        )
      })}
      <circle cx={cx} cy={cy} r="3" fill={c.color} />
    </svg>
  )
}

function EditModal({ stats, onSave, onClose }) {
  const [vals, setVals] = useState({ ...stats })
  const [activeCat, setActiveCat] = useState('sports')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(vals)
    setSaving(false)
    onClose()
  }

  const cat = CATS[activeCat]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: '#0d1120', border: '1px solid #1a2235', borderRadius: '16px', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #00f5a0, #00d9f5, #7c3aed)' }} />
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: '14px', color: '#e8eaf0', margin: 0, letterSpacing: '2px' }}>EDIT STATS</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4a5568', cursor: 'pointer', fontSize: '20px' }}>×</button>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {Object.entries(CATS).map(([key, c]) => (
              <button key={key} onClick={() => setActiveCat(key)} style={{
                flex: 1, minWidth: '80px', padding: '7px 0',
                background: activeCat === key ? 'rgba(0,0,0,0.3)' : 'transparent',
                border: `1px solid ${activeCat === key ? c.color : '#1a2235'}`,
                borderRadius: '8px', color: activeCat === key ? c.color : '#3a4560',
                fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px',
                textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif"
              }}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {cat.fields.map(f => {
              const key = `${activeCat}_${f}`
              const val = vals[key] !== undefined ? vals[key] : 50
              return (
                <div key={f}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700' }}>{f.toUpperCase()}</label>
                    <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '13px', fontWeight: '700', color: cat.color }}>{val}</span>
                  </div>
                  <input type="range" min="0" max="100" value={val}
                    onChange={e => setVals(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                    style={{ width: '100%', accentColor: cat.color, cursor: 'pointer' }}
                  />
                </div>
              )
            })}
          </div>
          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', marginTop: '1.5rem', padding: '12px',
            background: 'linear-gradient(135deg, #00f5a0, #00d9f5)',
            border: 'none', borderRadius: '8px',
            fontFamily: "'Orbitron', monospace", fontSize: '13px',
            fontWeight: '700', color: '#070a12', letterSpacing: '2px',
            textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1
          }}>
            {saving ? 'SAVING...' : 'SAVE STATS'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function StatCard({ user }) {
  const [profile, setProfile] = useState(null)
  const [activeCat, setActiveCat] = useState('sports')
  const [showEdit, setShowEdit] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showGitHub, setShowGitHub] = useState(false)
  const [showStrava, setShowStrava] = useState(false)
  const [showFinance, setShowFinance] = useState(false)
  const [showInfluence, setShowInfluence] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProfile() {
      // Try up to 5 times with delay (in case trigger hasn't run yet)
      for (let i = 0; i < 5; i++) {
        const { data, error: err } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) {
          setProfile(data)
          setLoading(false)
          return
        }
        if (i < 4) await new Promise(r => setTimeout(r, 1000))
      }
      // If still no profile, create one
      const fallbackUsername = user.email.split('@')[0]
      await supabase.from('profiles').upsert({
        id: user.id,
        username: fallbackUsername,
        avatar_initials: fallbackUsername.slice(0, 2).toUpperCase()
      })
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setProfile(data)
      else setError('Could not load profile. Please refresh.')
      setLoading(false)
    }
    loadProfile()
  }, [user.id, user.email])

  async function handleSaveStats(vals) {
    const { data } = await supabase.from('profiles').update(vals).eq('id', user.id).select().single()
    if (data) setProfile(data)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#070a12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: "'Orbitron', monospace", color: '#00f5a0', letterSpacing: '3px', fontSize: '13px' }}>LOADING...</div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#070a12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ color: '#ef4444', fontFamily: "'Rajdhani', sans-serif", fontSize: '14px' }}>{error}</div>
      <button onClick={() => window.location.reload()} style={{ background: '#00f5a0', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: "'Orbitron', monospace", fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>REFRESH</button>
    </div>
  )

  if (!profile) return null

  if (showLeaderboard) return <Leaderboard currentUserId={user.id} onBack={() => setShowLeaderboard(false)} />

  const avgs = Object.keys(CATS).map(k =>
    Math.round(CATS[k].fields.reduce((a, f) => a + (profile[`${k}_${f}`] || 50), 0) / CATS[k].fields.length)
  )
  const overall = Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length)
  const topIdx = avgs.indexOf(Math.max(...avgs))
  const topNames = ['Sports', 'Finance', 'Political', 'Education']
  const cat = CATS[activeCat]

  return (
    <div style={{ minHeight: '100vh', background: '#070a12', padding: '1.5rem 1rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', fontFamily: "'Rajdhani', sans-serif" }}>

      {/* Header */}
      <div style={{ width: '100%', maxWidth: '500px', background: '#0d1120', border: '1px solid #1a2235', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #00f5a0, #00d9f5, #7c3aed)' }} />
        <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#0a0f1e', border: `2px solid ${cat.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Orbitron', monospace", fontSize: '18px', fontWeight: '700', color: cat.color, flexShrink: 0, transition: 'all 0.3s' }}>
            {profile.avatar_initials || profile.username?.slice(0,2).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: "'Orbitron', monospace", fontSize: '15px', fontWeight: '700', color: '#e8eaf0', letterSpacing: '1px', margin: '0 0 4px' }}>
              {(profile.username || 'PLAYER')?.toUpperCase()}
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#0f1928', border: `1px solid ${cat.color}`, borderRadius: '20px', padding: '2px 10px', fontSize: '10px', fontWeight: '700', color: cat.color, letterSpacing: '1.5px', textTransform: 'uppercase', transition: 'all 0.3s' }}>
              ● {cat.badge}
            </div>
            <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
              {profile.verified_github && <span title="GitHub Verified" style={{ fontSize: '11px', background: 'rgba(56,189,248,0.15)', border: '1px solid #38bdf8', borderRadius: '6px', padding: '1px 6px', color: '#38bdf8', fontWeight: '700' }}>✅ GitHub</span>}
              {profile.verified_strava && <span title="Strava Verified" style={{ fontSize: '11px', background: 'rgba(252,76,2,0.15)', border: '1px solid #fc4c02', borderRadius: '6px', padding: '1px 6px', color: '#fc4c02', fontWeight: '700' }}>✅ Strava</span>}
              {profile.verified_finance && <span title="Finance Verified" style={{ fontSize: '11px', background: 'rgba(250,204,21,0.15)', border: '1px solid #facc15', borderRadius: '6px', padding: '1px 6px', color: '#facc15', fontWeight: '700' }}>✅ Finance</span>}
              {profile.verified_influence && <span title="Influence Verified" style={{ fontSize: '11px', background: 'rgba(167,139,250,0.15)', border: '1px solid #a78bfa', borderRadius: '6px', padding: '1px 6px', color: '#a78bfa', fontWeight: '700' }}>✅ Influence</span>}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: '#3a4560', fontFamily: "'Orbitron', monospace", letterSpacing: '2px', textTransform: 'uppercase' }}>PWR</div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '32px', fontWeight: '900', color: cat.color, lineHeight: 1, transition: 'color 0.3s' }}>{overall}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', width: '100%', maxWidth: '500px' }}>
        {Object.entries(CATS).map(([key, c]) => (
          <button key={key} onClick={() => setActiveCat(key)} style={{
            flex: 1, padding: '8px 0', background: activeCat === key ? 'rgba(0,0,0,0.3)' : '#0d1120',
            border: `1px solid ${activeCat === key ? c.color : '#1a2235'}`,
            borderRadius: '8px', fontFamily: "'Rajdhani', sans-serif",
            fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px',
            textTransform: 'uppercase', cursor: 'pointer',
            color: activeCat === key ? c.color : '#3a4560', transition: 'all 0.2s'
          }}>
            {key === 'sports' ? '🏃' : key === 'finance' ? '💰' : key === 'political' ? '⚡' : '🎓'} {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      {/* Radar */}
      <div style={{ width: '100%', maxWidth: '500px', background: '#0d1120', border: '1px solid #1a2235', borderRadius: '14px', padding: '1rem 0.5rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '11px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: cat.color, marginBottom: '0.5rem', transition: 'color 0.3s' }}>
          {cat.label}
        </div>
        <RadarChart cat={activeCat} stats={profile} />
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '500px' }}>
        <div style={{ flex: 1, background: '#0d1120', border: '1px solid #1a2235', borderRadius: '10px', padding: '10px 14px' }}>
          <div style={{ fontSize: '9px', color: '#3a4560', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'Orbitron', monospace" }}>Top Category</div>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '20px', fontWeight: '900', color: '#facc15' }}>{topNames[topIdx]}</div>
          <div style={{ background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.3)', borderRadius: '6px', padding: '3px 10px', fontSize: '11px', fontWeight: '700', color: '#facc15', letterSpacing: '1px', textTransform: 'uppercase', display: 'inline-block', marginTop: '4px' }}>
            Avg {Math.max(...avgs)}
          </div>
        </div>
        <div style={{ flex: 1, background: '#0d1120', border: '1px solid #1a2235', borderRadius: '10px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button onClick={() => setShowEdit(true)} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid #2a3347', borderRadius: '8px', color: '#6b7280', fontFamily: "'Rajdhani', sans-serif", fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}>
            ✏️ Edit Stats
          </button>
          <button onClick={() => setShowGitHub(true)} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid #38bdf8', borderRadius: '8px', color: '#38bdf8', fontFamily: "'Rajdhani', sans-serif", fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}>
            🐙 GitHub Stats
          </button>
          <button onClick={() => setShowStrava(true)} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid #fc4c02', borderRadius: '8px', color: '#fc4c02', fontFamily: "'Rajdhani', sans-serif", fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}>
            🏃 Strava Stats
          </button>
          <button onClick={() => setShowFinance(true)} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid #facc15', borderRadius: '8px', color: '#facc15', fontFamily: "'Rajdhani', sans-serif", fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}>
            💰 Finance Stats
          </button>
          <button onClick={() => setShowInfluence(true)} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid #a78bfa', borderRadius: '8px', color: '#a78bfa', fontFamily: "'Rajdhani', sans-serif", fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}>
            ⚡ Influence Meter
          </button>
          <button onClick={() => setShowLeaderboard(true)} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid #facc15', borderRadius: '8px', color: '#facc15', fontFamily: "'Rajdhani', sans-serif", fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}>
            🏆 Leaderboard
          </button>
          <button onClick={handleLogout} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid #1a2235', borderRadius: '8px', color: '#3a4560', fontFamily: "'Rajdhani', sans-serif", fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      {showEdit && <EditModal stats={profile} onSave={handleSaveStats} onClose={() => setShowEdit(false)} />}
      {showGitHub && <GitHubConnect profile={profile} onUpdate={setProfile} onClose={() => setShowGitHub(false)} />}
      {showStrava && <StravaConnect profile={profile} onUpdate={setProfile} onClose={() => setShowStrava(false)} />}
      {showFinance && <FinanceCalculator profile={profile} onUpdate={setProfile} onClose={() => setShowFinance(false)} />}
      {showInfluence && <InfluenceCalculator profile={profile} onUpdate={setProfile} onClose={() => setShowInfluence(false)} />}
    </div>
  )
}
