import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

const CATS = {
  sports: { label: 'Sports', color: '#00f5a0', fields: ['stamina','strength','agility','endurance','speed','recovery'] },
  finance: { label: 'Finance', color: '#facc15', fields: ['wealth','income','invest','savings','assets','credit'] },
  political: { label: 'Political', color: '#a78bfa', fields: ['influence','network','repute','reach','alliances','authority'] },
  education: { label: 'Education', color: '#38bdf8', fields: ['iq','knowledge','skills','creativity','expertise','learning'] }
}

function getOverall(p) {
  const avgs = Object.keys(CATS).map(k =>
    CATS[k].fields.reduce((a, f) => a + (p[`${k}_${f}`] || 50), 0) / CATS[k].fields.length
  )
  return Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length)
}

function getCatAvg(p, cat) {
  return Math.round(CATS[cat].fields.reduce((a, f) => a + (p[`${cat}_${f}`] || 50), 0) / CATS[cat].fields.length)
}

function getTopCat(p) {
  const avgs = Object.keys(CATS).map(k => ({ key: k, avg: getCatAvg(p, k) }))
  return avgs.reduce((a, b) => a.avg > b.avg ? a : b)
}

function getTier(score) {
  if (score >= 85) return { label: 'LEGENDARY', color: '#ff6b35', bg: 'rgba(255,107,53,0.1)' }
  if (score >= 70) return { label: 'GOLD', color: '#facc15', bg: 'rgba(250,204,21,0.1)' }
  if (score >= 55) return { label: 'SILVER', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' }
  return { label: 'BRONZE', color: '#cd7c3b', bg: 'rgba(205,124,59,0.1)' }
}

function getVerifiedCount(p) {
  return [p.verified_github, p.verified_strava, p.verified_finance, p.verified_influence].filter(Boolean).length
}

function MiniRadar({ p, cat, size = 48 }) {
  const c = CATS[cat]
  const n = c.fields.length
  const cx = size / 2, cy = size / 2, R = size / 2 - 4

  function pt(i, r) {
    const a = (Math.PI * 2 * i / n) - Math.PI / 2
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
  }

  const gridPts = c.fields.map((_, i) => pt(i, R))
  const dataPts = c.fields.map((f, i) => pt(i, R * ((p[`${cat}_${f}`] || 50) / 100)))

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon points={gridPts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={c.color} strokeWidth="0.5" opacity="0.3" />
      <polygon points={dataPts.map(p => `${p.x},${p.y}`).join(' ')} fill={c.color} fillOpacity="0.2" stroke={c.color} strokeWidth="1" />
    </svg>
  )
}

export default function Leaderboard({ currentUserId, onBack }) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('overall')
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('profiles').select('*')
      if (data) {
        const ranked = data
          .map(p => ({ ...p, _overall: getOverall(p), _topCat: getTopCat(p) }))
          .sort((a, b) => b._overall - a._overall)
        setPlayers(ranked)
      }
      setLoading(false)
    }
    load()
  }, [])

  const sorted = [...players]
    .filter(p => !showVerifiedOnly || getVerifiedCount(p) > 0)
    .sort((a, b) => {
      if (filter === 'overall') return b._overall - a._overall
      return getCatAvg(b, filter) - getCatAvg(a, filter)
    })

  const myRank = sorted.findIndex(p => p.id === currentUserId) + 1
  const myPercentile = sorted.length > 1 ? Math.round((1 - (myRank - 1) / sorted.length) * 100) : 100

  const filters = [
    { key: 'overall', label: 'Overall', color: '#00f5a0' },
    { key: 'sports', label: '🏃', color: '#00f5a0' },
    { key: 'finance', label: '💰', color: '#facc15' },
    { key: 'political', label: '⚡', color: '#a78bfa' },
    { key: 'education', label: '🎓', color: '#38bdf8' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#070a12', padding: '1.5rem 1rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', fontFamily: "'Rajdhani', sans-serif" }}>

      {/* Header */}
      <div style={{ width: '100%', maxWidth: '500px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={onBack} style={{ background: '#0d1120', border: '1px solid #1a2235', borderRadius: '8px', padding: '8px 14px', color: '#6b7280', cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif", fontSize: '13px', fontWeight: '700' }}>← Back</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: '16px', fontWeight: '900', color: '#e8eaf0', margin: 0, letterSpacing: '2px' }}>LEADERBOARD</h1>
          <p style={{ color: '#3a4560', fontSize: '11px', margin: 0, letterSpacing: '1px' }}>{sorted.length} PLAYERS RANKED</p>
        </div>
      </div>

      {/* My rank banner */}
      {myRank > 0 && (
        <div style={{ width: '100%', maxWidth: '500px', background: 'rgba(0,245,160,0.05)', border: '1px solid rgba(0,245,160,0.3)', borderRadius: '10px', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '10px', color: '#3a4560', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'Orbitron', monospace" }}>Your Rank</div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '22px', fontWeight: '900', color: '#00f5a0' }}>#{myRank}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#3a4560', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'Orbitron', monospace" }}>Percentile</div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '22px', fontWeight: '900', color: '#facc15' }}>Top {100 - myPercentile + 1}%</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#3a4560', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'Orbitron', monospace" }}>Verified</div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '22px', fontWeight: '900', color: '#38bdf8' }}>
              {getVerifiedCount(players.find(p => p.id === currentUserId) || {})}/4
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ width: '100%', maxWidth: '500px', display: 'flex', gap: '6px', alignItems: 'center' }}>
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            flex: 1, padding: '7px 4px',
            background: filter === f.key ? 'rgba(0,0,0,0.3)' : '#0d1120',
            border: `1px solid ${filter === f.key ? f.color : '#1a2235'}`,
            borderRadius: '8px', color: filter === f.key ? f.color : '#3a4560',
            fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px',
            textTransform: 'uppercase', cursor: 'pointer',
            fontFamily: "'Rajdhani', sans-serif", transition: 'all 0.2s'
          }}>{f.label}</button>
        ))}
        <button onClick={() => setShowVerifiedOnly(!showVerifiedOnly)} style={{
          padding: '7px 10px',
          background: showVerifiedOnly ? 'rgba(0,245,160,0.1)' : '#0d1120',
          border: `1px solid ${showVerifiedOnly ? '#00f5a0' : '#1a2235'}`,
          borderRadius: '8px', color: showVerifiedOnly ? '#00f5a0' : '#3a4560',
          fontSize: '11px', fontWeight: '700', cursor: 'pointer',
          fontFamily: "'Rajdhani', sans-serif", transition: 'all 0.2s',
          whiteSpace: 'nowrap'
        }}>✅ Only</button>
      </div>

      {/* List */}
      <div style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', fontFamily: "'Orbitron', monospace", color: '#00f5a0', fontSize: '12px', letterSpacing: '3px' }}>LOADING...</div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#3a4560', fontSize: '14px' }}>No players found</div>
        ) : sorted.map((p, i) => {
          const score = filter === 'overall' ? p._overall : getCatAvg(p, filter)
          const tier = getTier(score)
          const topCat = p._topCat
          const isMe = p.id === currentUserId
          const displayCat = filter === 'overall' ? topCat.key : filter
          const catColor = CATS[displayCat].color
          const verifiedCount = getVerifiedCount(p)

          return (
            <div key={p.id} style={{
              background: isMe ? 'rgba(0,245,160,0.05)' : '#0d1120',
              border: `1px solid ${isMe ? '#00f5a0' : '#1a2235'}`,
              borderRadius: '12px', padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              {/* Rank */}
              <div style={{ width: '32px', textAlign: 'center', flexShrink: 0 }}>
                {i === 0 ? <span style={{ fontSize: '18px' }}>🥇</span>
                  : i === 1 ? <span style={{ fontSize: '18px' }}>🥈</span>
                  : i === 2 ? <span style={{ fontSize: '18px' }}>🥉</span>
                  : <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '12px', fontWeight: '700', color: '#3a4560' }}>#{i + 1}</span>}
              </div>

              {/* Mini Radar */}
              <div style={{ flexShrink: 0 }}>
                <MiniRadar p={p} cat={displayCat} size={44} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '11px', fontWeight: '700', color: '#e8eaf0', letterSpacing: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.username?.toUpperCase()}
                  </span>
                  {isMe && <span style={{ background: 'rgba(0,245,160,0.15)', border: '1px solid #00f5a0', borderRadius: '10px', padding: '1px 6px', fontSize: '9px', fontWeight: '700', color: '#00f5a0', letterSpacing: '1px' }}>YOU</span>}
                  {verifiedCount > 0 && <span style={{ fontSize: '9px', color: '#00f5a0', fontWeight: '700' }}>✅{verifiedCount}</span>}
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '10px', color: catColor, fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    {filter === 'overall' ? CATS[topCat.key].label : CATS[filter].label}
                  </span>
                  <span style={{ fontSize: '10px', color: tier.color, fontWeight: '700' }}>· {tier.label}</span>
                </div>
              </div>

              {/* Score */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '22px', fontWeight: '900', color: catColor, lineHeight: 1 }}>{score}</div>
                <div style={{ background: tier.bg, border: `1px solid ${tier.color}`, borderRadius: '4px', padding: '1px 6px', display: 'inline-block', marginTop: '2px' }}>
                  <span style={{ fontSize: '9px', fontWeight: '700', color: tier.color, letterSpacing: '1px' }}>{tier.label}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
