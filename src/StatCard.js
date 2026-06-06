import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Leaderboard from './Leaderboard'
import GitHubConnect from './GitHubConnect'
import StravaConnect from './StravaConnect'
import FinanceCalculator from './FinanceCalculator'
import InfluenceCalculator from './InfluenceCalculator'

const fontLink = document.createElement('link')
fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap'
fontLink.rel = 'stylesheet'
if (!document.head.querySelector('[href*="Press+Start"]')) document.head.appendChild(fontLink)

const CATS = {
  sports: { label: 'SPORTS', color: '#00e676', badge: 'ATHLETE', emoji: '⚔️', questName: 'The Arena of Might', fields: ['stamina','strength','agility','endurance','speed','recovery'] },
  finance: { label: 'FINANCE', color: '#ffd600', badge: 'MERCHANT', emoji: '💰', questName: 'The Treasury Vault', fields: ['wealth','income','invest','savings','assets','credit'] },
  political: { label: 'POWER', color: '#e040fb', badge: 'WARLORD', emoji: '👑', questName: 'The Hall of Rulers', fields: ['influence','network','repute','reach','alliances','authority'] },
  education: { label: 'KNOWLEDGE', color: '#40c4ff', badge: 'SCHOLAR', emoji: '📜', questName: 'The Arcane Library', fields: ['iq','knowledge','skills','creativity','expertise','learning'] }
}

const PIXEL = "'Press Start 2P', monospace"
const MONO = "'VT323', monospace"

function RetroRadar({ cat, stats }) {
  const c = CATS[cat]
  const fields = c.fields
  const n = fields.length
  const cx = 160, cy = 140, R = 100

  function pt(i, r) {
    const a = (Math.PI * 2 * i / n) - Math.PI / 2
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
  }

  const dataPoints = fields.map((f, i) => pt(i, R * ((stats[`${cat}_${f}`] || 50) / 100)))

  return (
    <svg viewBox="0 0 320 280" style={{ width: '100%', maxWidth: '320px' }}>
      {[0.2,0.4,0.6,0.8,1.0].map((lvl, li) => {
        const pts = fields.map((_, i) => pt(i, R * lvl))
        return <polygon key={li} points={pts.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke={c.color} strokeWidth={li===4?'2':'1'} strokeDasharray={li<4?'4 4':'none'} opacity={li===4?0.5:0.2} />
      })}
      {fields.map((_, i) => { const p2=pt(i,R); return <line key={i} x1={cx} y1={cy} x2={p2.x} y2={p2.y} stroke={c.color} strokeWidth="1" opacity="0.2" strokeDasharray="4 4" /> })}
      <polygon points={dataPoints.map(p=>`${p.x},${p.y}`).join(' ')} fill={`${c.color}25`} stroke={c.color} strokeWidth="3" strokeLinejoin="miter" />
      {dataPoints.map((p,i) => <rect key={i} x={p.x-4} y={p.y-4} width="8" height="8" fill={c.color} />)}
      {fields.map((f,i) => {
        const lp=pt(i,R+18), vp=pt(i,R+32)
        return (
          <g key={i}>
            <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fill={c.color} fontSize="7" fontFamily={PIXEL} opacity="0.7">{f.toUpperCase().slice(0,3)}</text>
            <text x={vp.x} y={vp.y} textAnchor="middle" dominantBaseline="middle" fill={c.color} fontSize="14" fontFamily={MONO} fontWeight="700">{stats[`${cat}_${f}`]||50}</text>
          </g>
        )
      })}
      <rect x={cx-4} y={cy-4} width="8" height="8" fill={c.color} />
    </svg>
  )
}

function EditModal({ stats, onSave, onClose }) {
  const [vals, setVals] = useState({...stats})
  const [activeCat, setActiveCat] = useState('sports')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true); await onSave(vals); setSaving(false); onClose()
  }

  const cat = CATS[activeCat]
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(4,8,20,0.95)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem' }}>
      <div style={{ width:'100%', maxWidth:'440px', background:'#040814', border:`3px solid ${cat.color}`, boxShadow:`6px 6px 0 ${cat.color}60`, maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ background:cat.color, padding:'8px 16px', display:'flex', justifyContent:'space-between' }}>
          <span style={{ fontFamily:PIXEL, fontSize:'10px', color:'#040814' }}>EDIT STATS</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#040814', cursor:'pointer', fontFamily:PIXEL, fontSize:'14px' }}>×</button>
        </div>
        <div style={{ padding:'1.25rem' }}>
          <div style={{ display:'flex', gap:'4px', marginBottom:'1rem', flexWrap:'wrap' }}>
            {Object.entries(CATS).map(([key,c]) => (
              <button key={key} onClick={()=>setActiveCat(key)} style={{ flex:1, minWidth:'70px', padding:'6px 0', background:activeCat===key?c.color:'#040814', border:`2px solid ${c.color}`, color:activeCat===key?'#040814':c.color, fontSize:'7px', cursor:'pointer', fontFamily:PIXEL }}>
                {key.slice(0,3).toUpperCase()}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {cat.fields.map(f => {
              const key=`${activeCat}_${f}`, val=vals[key]!==undefined?vals[key]:50
              return (
                <div key={f}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                    <span style={{ fontFamily:PIXEL, fontSize:'8px', color:cat.color }}>{f.toUpperCase()}</span>
                    <span style={{ fontFamily:MONO, fontSize:'18px', color:cat.color }}>{val}</span>
                  </div>
                  <input type="range" min="0" max="100" value={val} onChange={e=>setVals(prev=>({...prev,[key]:parseInt(e.target.value)}))} style={{ width:'100%', accentColor:cat.color }} />
                </div>
              )
            })}
          </div>
          <button onClick={handleSave} disabled={saving} style={{ width:'100%', marginTop:'1.25rem', padding:'12px', background:saving?'#333':cat.color, border:`3px solid ${cat.color}`, color:'#040814', fontFamily:PIXEL, fontSize:'10px', cursor:saving?'not-allowed':'pointer', boxShadow:saving?'none':`4px 4px 0 ${cat.color}80` }}>
            {saving?'SAVING...':'[ SAVE ]'}
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
  const [hoveredCard, setHoveredCard] = useState(null)
  const [hoveredBtn, setHoveredBtn] = useState(null)

  useEffect(() => {
    async function loadProfile() {
      for (let i=0;i<5;i++) {
        const {data} = await supabase.from('profiles').select('*').eq('id',user.id).single()
        if (data) { setProfile(data); setLoading(false); return }
        if (i<4) await new Promise(r=>setTimeout(r,1000))
      }
      const fallback = user.email.split('@')[0]
      await supabase.from('profiles').upsert({id:user.id,username:fallback,avatar_initials:fallback.slice(0,2).toUpperCase()})
      const {data} = await supabase.from('profiles').select('*').eq('id',user.id).single()
      if (data) setProfile(data)
      setLoading(false)
    }
    loadProfile()
  }, [user.id, user.email])

  async function handleSaveStats(vals) {
    const {data} = await supabase.from('profiles').update(vals).eq('id',user.id).select().single()
    if (data) setProfile(data)
  }

  async function handleLogout() { await supabase.auth.signOut() }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#040814', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontFamily:PIXEL, color:'#00e676', fontSize:'12px' }}>LOADING...</div>
    </div>
  )

  if (!profile) return null
  if (showLeaderboard) return <Leaderboard currentUserId={user.id} onBack={()=>setShowLeaderboard(false)} />

  const avgs = Object.keys(CATS).map(k => Math.round(CATS[k].fields.reduce((a,f)=>a+(profile[`${k}_${f}`]||50),0)/CATS[k].fields.length))
  const overall = Math.round(avgs.reduce((a,b)=>a+b,0)/avgs.length)
  const topIdx = avgs.indexOf(Math.max(...avgs))
  const topNames = ['Sports','Finance','Political','Education']
  const xpPercent = Math.round(((overall-20)/80)*100)
  const cat = CATS[activeCat]
  const catIdx = Object.keys(CATS).indexOf(activeCat)

  const questCards = [
    { key:'sports', icon:'⚔️', name:'Arena of Might', color:CATS.sports.color, avg:avgs[0], verified:profile.verified_strava, action:()=>setShowStrava(true) },
    { key:'finance', icon:'💰', name:'Treasury Vault', color:CATS.finance.color, avg:avgs[1], verified:profile.verified_finance, action:()=>setShowFinance(true) },
    { key:'political', icon:'👑', name:'Hall of Rulers', color:CATS.political.color, avg:avgs[2], verified:profile.verified_influence, action:()=>setShowInfluence(true) },
    { key:'education', icon:'📜', name:'Arcane Library', color:CATS.education.color, avg:avgs[3], verified:profile.verified_github, action:()=>setShowGitHub(true) },
  ]

  const actionBtns = [
    { label:'EDIT STATS', icon:'✏️', color:'#fff', bg:'#1a1a2e', action:()=>setShowEdit(true) },
    { label:'LEADERBOARD', icon:'🏆', color:'#ffd600', bg:'#1a1a00', action:()=>setShowLeaderboard(true) },
    { label:'LOG OUT', icon:'🚪', color:'#ff5252', bg:'#1a0000', action:handleLogout },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#040814', color:'#e8eaf0', fontFamily:MONO, padding:'0 0 3rem' }}>
      <style>{`
        .pixel-btn:hover { transform: translate(-2px,-2px) !important; }
        .quest-card:hover { transform: translate(-3px,-3px) !important; }
      `}</style>

      {/* Scanline overlay */}
      <div style={{ position:'fixed', inset:0, backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.15) 2px,rgba(0,0,0,0.15) 4px)', pointerEvents:'none', zIndex:999, opacity:0.3 }} />

      {/* HERO BANNER */}
      <div style={{ background:'linear-gradient(180deg,#0a1628 0%,#040814 100%)', borderBottom:'4px solid #ffd600', padding:'1.5rem 1rem 0', position:'relative', overflow:'hidden' }}>
        {[...Array(16)].map((_,i) => (
          <div key={i} style={{ position:'absolute', width:'3px', height:'3px', background:'#fff', top:`${10+Math.sin(i)*60}%`, left:`${(i/16)*100}%`, opacity:0.3+((i%3)*0.2) }} />
        ))}
        <div style={{ maxWidth:'520px', margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <div style={{ display:'flex', gap:'6px' }}>
              <div style={{ width:'10px', height:'10px', background:'#ff5252' }} />
              <div style={{ width:'10px', height:'10px', background:'#ffd600' }} />
              <div style={{ width:'10px', height:'10px', background:'#00e676' }} />
            </div>
            <div style={{ fontFamily:PIXEL, fontSize:'8px', color:'#ffd600', letterSpacing:'2px' }}>STAT CARD RPG v2.0</div>
            <div style={{ fontFamily:PIXEL, fontSize:'7px', color:'#444' }}>SAVE #1</div>
          </div>

          {/* Character card */}
          <div style={{ background:'#0a0f1e', border:'3px solid #ffd600', boxShadow:'6px 6px 0 #ffd60040', padding:'1rem', marginBottom:'1rem', display:'flex', gap:'1rem', alignItems:'flex-start' }}>
            {/* Avatar */}
            <div style={{ flexShrink:0 }}>
              <div style={{ width:'60px', height:'60px', background:'#0d1830', border:`3px solid ${cat.color}`, boxShadow:`4px 4px 0 ${cat.color}60`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:PIXEL, fontSize:'16px', color:cat.color, position:'relative' }}>
                {profile.avatar_initials||profile.username?.slice(0,2).toUpperCase()}
                <div style={{ position:'absolute', top:'-3px', left:'-3px', width:'6px', height:'6px', background:'#ffd600' }} />
                <div style={{ position:'absolute', top:'-3px', right:'-3px', width:'6px', height:'6px', background:'#ffd600' }} />
                <div style={{ position:'absolute', bottom:'-3px', left:'-3px', width:'6px', height:'6px', background:'#ffd600' }} />
                <div style={{ position:'absolute', bottom:'-3px', right:'-3px', width:'6px', height:'6px', background:'#ffd600' }} />
              </div>
              <div style={{ marginTop:'6px', textAlign:'center', fontFamily:PIXEL, fontSize:'7px', color:'#ffd600' }}>LV.{Math.floor(overall/10)}</div>
            </div>

            {/* Identity */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:PIXEL, fontSize:'12px', color:'#ffd600', marginBottom:'4px' }}>{profile.username?.toUpperCase()}</div>
              <div style={{ fontFamily:MONO, fontSize:'16px', color:cat.color, marginBottom:'6px' }}>{cat.badge} · {cat.label}</div>
              <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', marginBottom:'8px' }}>
                {profile.verified_github && <span style={{ fontFamily:PIXEL, fontSize:'6px', background:'#003322', border:'2px solid #00e676', padding:'2px 4px', color:'#00e676' }}>GH✓</span>}
                {profile.verified_strava && <span style={{ fontFamily:PIXEL, fontSize:'6px', background:'#220000', border:'2px solid #fc4c02', padding:'2px 4px', color:'#fc4c02' }}>STR✓</span>}
                {profile.verified_finance && <span style={{ fontFamily:PIXEL, fontSize:'6px', background:'#332200', border:'2px solid #ffd600', padding:'2px 4px', color:'#ffd600' }}>FIN✓</span>}
                {profile.verified_influence && <span style={{ fontFamily:PIXEL, fontSize:'6px', background:'#220033', border:'2px solid #e040fb', padding:'2px 4px', color:'#e040fb' }}>INF✓</span>}
              </div>
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'3px' }}>
                  <span style={{ fontFamily:PIXEL, fontSize:'6px', color:'#888' }}>EXP</span>
                  <span style={{ fontFamily:PIXEL, fontSize:'6px', color:'#ffd600' }}>{xpPercent}%</span>
                </div>
                <div style={{ height:'10px', background:'#1a1a2e', border:'2px solid #333' }}>
                  <div style={{ height:'100%', width:`${xpPercent}%`, background:'linear-gradient(90deg,#ffd600,#ffff00)' }} />
                </div>
              </div>
            </div>

            {/* PWR */}
            <div style={{ flexShrink:0, textAlign:'center' }}>
              <div style={{ fontFamily:PIXEL, fontSize:'7px', color:'#888', marginBottom:'2px' }}>PWR</div>
              <div style={{ background:'#0d1830', border:`3px solid ${cat.color}`, boxShadow:`4px 4px 0 ${cat.color}60`, padding:'8px 10px', fontFamily:PIXEL, fontSize:'22px', color:cat.color, lineHeight:1 }}>{overall}</div>
              <div style={{ fontFamily:PIXEL, fontSize:'6px', color:'#ffd600', marginTop:'4px' }}>
                {overall>=85?'LEGENDARY':overall>=70?'GOLD':overall>=55?'SILVER':'BRONZE'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:'520px', margin:'0 auto', padding:'1rem' }}>

        {/* ZONE TABS */}
        <div style={{ fontFamily:PIXEL, fontSize:'7px', color:'#888', marginBottom:'8px', letterSpacing:'2px' }}>▶ SELECT ZONE</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px', marginBottom:'1rem' }}>
          {Object.entries(CATS).map(([key,c]) => (
            <button key={key} onClick={()=>setActiveCat(key)} className="pixel-btn" style={{ padding:'10px 8px', background:activeCat===key?c.color:'#0a0f1e', border:`3px solid ${c.color}`, boxShadow:activeCat===key?`4px 4px 0 ${c.color}80`:`3px 3px 0 ${c.color}40`, color:activeCat===key?'#040814':c.color, fontFamily:PIXEL, fontSize:'7px', cursor:'pointer', transition:'all 0.1s', display:'flex', alignItems:'center', gap:'6px' }}>
              <span style={{ fontSize:'14px' }}>{c.emoji}</span><span>{c.label}</span>
            </button>
          ))}
        </div>

        {/* RADAR */}
        <div style={{ background:'#0a0f1e', border:`3px solid ${cat.color}`, boxShadow:`5px 5px 0 ${cat.color}40`, marginBottom:'1rem', overflow:'hidden' }}>
          <div style={{ background:cat.color, padding:'6px 12px', display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontFamily:PIXEL, fontSize:'7px', color:'#040814' }}>{cat.emoji} {cat.questName.toUpperCase()}</span>
            <span style={{ fontFamily:PIXEL, fontSize:'7px', color:'#040814' }}>AVG: {avgs[catIdx]}</span>
          </div>
          <div style={{ padding:'1rem', display:'flex', justifyContent:'center' }}>
            <RetroRadar cat={activeCat} stats={profile} />
          </div>
        </div>

        {/* QUEST CARDS */}
        <div style={{ fontFamily:PIXEL, fontSize:'7px', color:'#888', marginBottom:'8px', letterSpacing:'2px' }}>▶ QUEST BOARD</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'1rem' }}>
          {questCards.map((q,i) => (
            <div key={q.key} className="quest-card" onClick={q.action}
              onMouseEnter={()=>setHoveredCard(i)} onMouseLeave={()=>setHoveredCard(null)}
              style={{ background:hoveredCard===i?q.color:'#0a0f1e', border:`3px solid ${q.color}`, boxShadow:`5px 5px 0 ${q.color}60`, cursor:'pointer', transition:'all 0.1s', overflow:'hidden' }}>
              <div style={{ background:hoveredCard===i?'#040814':q.color, padding:'10px', textAlign:'center', fontSize:'22px' }}>{q.icon}</div>
              <div style={{ padding:'8px' }}>
                <div style={{ fontFamily:PIXEL, fontSize:'6px', color:hoveredCard===i?'#040814':q.color, marginBottom:'4px', lineHeight:'1.6' }}>{q.name.toUpperCase()}</div>
                <div style={{ height:'6px', background:hoveredCard===i?'#04081440':'#1a1a2e', border:`2px solid ${hoveredCard===i?'#04081460':'#333'}`, marginBottom:'4px' }}>
                  <div style={{ height:'100%', width:`${q.avg}%`, background:hoveredCard===i?'#040814':q.color }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontFamily:PIXEL, fontSize:'5px', color:hoveredCard===i?'#040814':'#555' }}>{q.verified?'✓ VERIFIED':'⚠ SELF'}</span>
                  <span style={{ fontFamily:PIXEL, fontSize:'6px', color:hoveredCard===i?'#040814':q.color }}>{q.avg}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ACTION BUTTONS */}
        <div style={{ fontFamily:PIXEL, fontSize:'7px', color:'#888', marginBottom:'8px', letterSpacing:'2px' }}>▶ ACTIONS</div>
        <div style={{ display:'flex', gap:'8px', marginBottom:'1rem' }}>
          {actionBtns.map((btn,i) => (
            <button key={i} className="pixel-btn" onClick={btn.action}
              onMouseEnter={()=>setHoveredBtn(i)} onMouseLeave={()=>setHoveredBtn(null)}
              style={{ flex:1, padding:'10px 6px', background:hoveredBtn===i?btn.color:btn.bg, border:`3px solid ${btn.color}`, boxShadow:`4px 4px 0 ${btn.color}60`, color:hoveredBtn===i?'#040814':btn.color, fontFamily:PIXEL, fontSize:'6px', cursor:'pointer', transition:'all 0.1s', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
              <span style={{ fontSize:'16px' }}>{btn.icon}</span>
              <span>{btn.label}</span>
            </button>
          ))}
        </div>

        {/* Top category summary */}
        <div style={{ background:'#0a0f1e', border:'3px solid #333', boxShadow:'4px 4px 0 #33333340', padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontFamily:PIXEL, fontSize:'6px', color:'#555', marginBottom:'4px' }}>TOP ZONE</div>
            <div style={{ fontFamily:PIXEL, fontSize:'10px', color:'#ffd600' }}>{topNames[topIdx].toUpperCase()}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:PIXEL, fontSize:'6px', color:'#555', marginBottom:'4px' }}>GLOBAL SCORE</div>
            <div style={{ fontFamily:PIXEL, fontSize:'10px', color:'#00e676' }}>{overall}/100</div>
          </div>
        </div>

        <div style={{ textAlign:'center', marginTop:'1.5rem' }}>
          <div style={{ fontFamily:PIXEL, fontSize:'6px', color:'#222' }}>© STATCARD RPG 2026</div>
          <div style={{ fontFamily:PIXEL, fontSize:'5px', color:'#1a1a1a', marginTop:'4px' }}>INSERT COIN TO CONTINUE ●</div>
        </div>
      </div>

      {showEdit && <EditModal stats={profile} onSave={handleSaveStats} onClose={()=>setShowEdit(false)} />}
      {showGitHub && <GitHubConnect profile={profile} onUpdate={setProfile} onClose={()=>setShowGitHub(false)} />}
      {showStrava && <StravaConnect profile={profile} onUpdate={setProfile} onClose={()=>setShowStrava(false)} />}
      {showFinance && <FinanceCalculator profile={profile} onUpdate={setProfile} onClose={()=>setShowFinance(false)} />}
      {showInfluence && <InfluenceCalculator profile={profile} onUpdate={setProfile} onClose={()=>setShowInfluence(false)} />}
    </div>
  )
}
