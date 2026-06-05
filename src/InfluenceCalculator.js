import { useState } from 'react'
import { supabase } from './supabaseClient'

function calculateInfluenceStats(data) {
  const {
    instagramFollowers, instagramEngagement, hasInstagram,
    linkedinConnections, linkedinEndorsements, hasLinkedin,
    twitterFollowers, hasTwitter,
    youtubeSubscribers, hasYoutube,
    contentFrequency, yearsActive
  } = data

  // Platform scores
  let instagramScore = 0
  if (hasInstagram) {
    let followerScore = 0
    if (instagramFollowers >= 1000000) followerScore = 100
    else if (instagramFollowers >= 100000) followerScore = 85
    else if (instagramFollowers >= 50000) followerScore = 75
    else if (instagramFollowers >= 10000) followerScore = 60
    else if (instagramFollowers >= 5000) followerScore = 50
    else if (instagramFollowers >= 1000) followerScore = 40
    else if (instagramFollowers >= 500) followerScore = 30
    else followerScore = 20

    const engagementBonus = Math.min(20, instagramEngagement * 2)
    instagramScore = Math.min(100, followerScore + engagementBonus)
  }

  let linkedinScore = 0
  if (hasLinkedin) {
    let connScore = 0
    if (linkedinConnections >= 10000) connScore = 100
    else if (linkedinConnections >= 5000) connScore = 85
    else if (linkedinConnections >= 3000) connScore = 75
    else if (linkedinConnections >= 1000) connScore = 60
    else if (linkedinConnections >= 500) connScore = 50
    else if (linkedinConnections >= 200) connScore = 40
    else connScore = 25

    const endorseBonus = Math.min(15, Math.round(linkedinEndorsements / 10))
    linkedinScore = Math.min(100, connScore + endorseBonus)
  }

  let twitterScore = 0
  if (hasTwitter) {
    if (twitterFollowers >= 1000000) twitterScore = 100
    else if (twitterFollowers >= 100000) twitterScore = 85
    else if (twitterFollowers >= 10000) twitterScore = 70
    else if (twitterFollowers >= 5000) twitterScore = 60
    else if (twitterFollowers >= 1000) twitterScore = 45
    else if (twitterFollowers >= 500) twitterScore = 35
    else twitterScore = 20
  }

  let youtubeScore = 0
  if (hasYoutube) {
    if (youtubeSubscribers >= 1000000) youtubeScore = 100
    else if (youtubeSubscribers >= 100000) youtubeScore = 85
    else if (youtubeSubscribers >= 10000) youtubeScore = 70
    else if (youtubeSubscribers >= 1000) youtubeScore = 55
    else if (youtubeSubscribers >= 500) youtubeScore = 40
    else youtubeScore = 25
  }

  // Consistency bonus
  let consistencyBonus = 0
  if (contentFrequency === 'daily') consistencyBonus = 15
  else if (contentFrequency === 'weekly') consistencyBonus = 10
  else if (contentFrequency === 'monthly') consistencyBonus = 5

  // Years active bonus
  const yearsBonus = Math.min(10, yearsActive * 2)

  // Platform count bonus
  const activePlatforms = [hasInstagram, hasLinkedin, hasTwitter, hasYoutube].filter(Boolean).length
  const platformBonus = activePlatforms * 5

  // Calculate final political stats
  const platformScores = [instagramScore, linkedinScore, twitterScore, youtubeScore].filter(s => s > 0)
  const avgPlatformScore = platformScores.length > 0
    ? platformScores.reduce((a, b) => a + b, 0) / platformScores.length
    : 20

  const influenceScore = Math.min(100, Math.round(avgPlatformScore + consistencyBonus + platformBonus))
  const reachScore = Math.min(100, Math.round((instagramScore * 0.4 + twitterScore * 0.3 + youtubeScore * 0.3) + platformBonus))
  const networkScore = Math.min(100, Math.round(linkedinScore * 0.7 + avgPlatformScore * 0.3 + yearsBonus))
  const authorityScore = Math.min(100, Math.round(avgPlatformScore + yearsBonus + consistencyBonus))
  const reputeScore = Math.min(100, Math.round((influenceScore + networkScore) / 2 + consistencyBonus))
  const alliancesScore = Math.min(100, Math.round(linkedinScore * 0.5 + avgPlatformScore * 0.3 + platformBonus * 2))

  return {
    verified_influence: true,
    political_influence: Math.max(20, influenceScore),
    political_reach: Math.max(20, reachScore),
    political_network: Math.max(20, networkScore),
    political_authority: Math.max(20, authorityScore),
    political_repute: Math.max(20, reputeScore),
    political_alliances: Math.max(20, alliancesScore),
  }
}

const followerRanges = [
  { label: '< 500', value: 250 },
  { label: '500 - 1K', value: 750 },
  { label: '1K - 5K', value: 3000 },
  { label: '5K - 10K', value: 7500 },
  { label: '10K - 50K', value: 30000 },
  { label: '50K - 100K', value: 75000 },
  { label: '100K - 1M', value: 500000 },
  { label: '1M+', value: 1500000 },
]

const linkedinRanges = [
  { label: '< 200', value: 100 },
  { label: '200 - 500', value: 350 },
  { label: '500 - 1K', value: 750 },
  { label: '1K - 3K', value: 2000 },
  { label: '3K - 5K', value: 4000 },
  { label: '5K - 10K', value: 7500 },
  { label: '10K+', value: 15000 },
]

export default function InfluenceCalculator({ profile, onUpdate, onClose }) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState(null)

  const [form, setForm] = useState({
    hasInstagram: false, instagramFollowers: 3000, instagramEngagement: 3,
    hasLinkedin: false, linkedinConnections: 750, linkedinEndorsements: 20,
    hasTwitter: false, twitterFollowers: 3000,
    hasYoutube: false, youtubeSubscribers: 1000,
    contentFrequency: 'weekly', yearsActive: 2,
  })

  function update(key, val) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  function handleCalculate() {
    const result = calculateInfluenceStats(form)
    setStats(result)
    setStep(3)
  }

  async function handleSave() {
    if (!stats) return
    setSaving(true)
    const { data } = await supabase.from('profiles').update(stats).eq('id', profile.id).select().single()
    if (data) onUpdate(data)
    setSaving(false)
    onClose()
  }

  const c = '#a78bfa'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: '#0d1120', border: `1px solid ${c}`, borderRadius: '16px', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #a78bfa, #7c3aed)' }} />
        <div style={{ padding: '1.5rem' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div>
              <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: '14px', color: '#e8eaf0', margin: '0 0 3px', letterSpacing: '2px' }}>
                ⚡ INFLUENCE METER
              </h2>
              <p style={{ fontSize: '11px', color: '#3a4560', margin: 0, letterSpacing: '1px' }}>POLITICAL · POWER STATS</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4a5568', cursor: 'pointer', fontSize: '20px' }}>×</button>
          </div>

          {/* Progress */}
          {step < 3 && (
            <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem' }}>
              {[1, 2].map(s => (
                <div key={s} style={{ flex: 1, height: '3px', borderRadius: '2px', background: s <= step ? c : '#1a2235', transition: 'background 0.3s' }} />
              ))}
            </div>
          )}

          {/* STEP 1 — Social Platforms */}
          {step === 1 && (
            <div>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                Select the platforms you're active on and enter your follower counts:
              </p>

              {/* Instagram */}
              <div style={{ background: '#0a0f1e', border: `1px solid ${form.hasInstagram ? c : '#1a2235'}`, borderRadius: '10px', padding: '12px', marginBottom: '10px', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: form.hasInstagram ? '12px' : '0' }}>
                  <input type="checkbox" id="hasInsta" checked={form.hasInstagram}
                    onChange={e => update('hasInstagram', e.target.checked)}
                    style={{ accentColor: c, width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="hasInsta" style={{ fontSize: '13px', color: '#e8eaf0', fontWeight: '700', cursor: 'pointer', flex: 1 }}>
                    📸 Instagram
                  </label>
                </div>
                {form.hasInstagram && (
                  <div>
                    <p style={{ fontSize: '10px', color: '#4a5568', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700' }}>Followers</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '10px' }}>
                      {followerRanges.map(r => (
                        <button key={r.value} onClick={() => update('instagramFollowers', r.value)} style={{
                          padding: '6px', background: form.instagramFollowers === r.value ? `rgba(167,139,250,0.15)` : '#13161f',
                          border: `1px solid ${form.instagramFollowers === r.value ? c : '#1a2235'}`,
                          borderRadius: '6px', color: form.instagramFollowers === r.value ? c : '#4a5568',
                          fontSize: '10px', fontWeight: '700', cursor: 'pointer',
                          fontFamily: "'Rajdhani', sans-serif", transition: 'all 0.2s'
                        }}>{r.label}</button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <p style={{ fontSize: '10px', color: '#4a5568', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700', margin: 0 }}>Avg Engagement Rate</p>
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '12px', color: c, fontWeight: '700' }}>{form.instagramEngagement}%</span>
                    </div>
                    <input type="range" min="0" max="20" value={form.instagramEngagement}
                      onChange={e => update('instagramEngagement', parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: c, cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#3a4560', marginTop: '2px' }}>
                      <span>0% (low)</span><span>5% (good)</span><span>20% (viral)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Twitter/X */}
              <div style={{ background: '#0a0f1e', border: `1px solid ${form.hasTwitter ? c : '#1a2235'}`, borderRadius: '10px', padding: '12px', marginBottom: '10px', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: form.hasTwitter ? '12px' : '0' }}>
                  <input type="checkbox" id="hasX" checked={form.hasTwitter}
                    onChange={e => update('hasTwitter', e.target.checked)}
                    style={{ accentColor: c, width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="hasX" style={{ fontSize: '13px', color: '#e8eaf0', fontWeight: '700', cursor: 'pointer', flex: 1 }}>
                    𝕏 Twitter / X
                  </label>
                </div>
                {form.hasTwitter && (
                  <div>
                    <p style={{ fontSize: '10px', color: '#4a5568', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700' }}>Followers</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                      {followerRanges.map(r => (
                        <button key={r.value} onClick={() => update('twitterFollowers', r.value)} style={{
                          padding: '6px', background: form.twitterFollowers === r.value ? `rgba(167,139,250,0.15)` : '#13161f',
                          border: `1px solid ${form.twitterFollowers === r.value ? c : '#1a2235'}`,
                          borderRadius: '6px', color: form.twitterFollowers === r.value ? c : '#4a5568',
                          fontSize: '10px', fontWeight: '700', cursor: 'pointer',
                          fontFamily: "'Rajdhani', sans-serif", transition: 'all 0.2s'
                        }}>{r.label}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* YouTube */}
              <div style={{ background: '#0a0f1e', border: `1px solid ${form.hasYoutube ? c : '#1a2235'}`, borderRadius: '10px', padding: '12px', marginBottom: '1.25rem', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: form.hasYoutube ? '12px' : '0' }}>
                  <input type="checkbox" id="hasYT" checked={form.hasYoutube}
                    onChange={e => update('hasYoutube', e.target.checked)}
                    style={{ accentColor: c, width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="hasYT" style={{ fontSize: '13px', color: '#e8eaf0', fontWeight: '700', cursor: 'pointer', flex: 1 }}>
                    ▶️ YouTube
                  </label>
                </div>
                {form.hasYoutube && (
                  <div>
                    <p style={{ fontSize: '10px', color: '#4a5568', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700' }}>Subscribers</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                      {followerRanges.map(r => (
                        <button key={r.value} onClick={() => update('youtubeSubscribers', r.value)} style={{
                          padding: '6px', background: form.youtubeSubscribers === r.value ? `rgba(167,139,250,0.15)` : '#13161f',
                          border: `1px solid ${form.youtubeSubscribers === r.value ? c : '#1a2235'}`,
                          borderRadius: '6px', color: form.youtubeSubscribers === r.value ? c : '#4a5568',
                          fontSize: '10px', fontWeight: '700', cursor: 'pointer',
                          fontFamily: "'Rajdhani', sans-serif", transition: 'all 0.2s'
                        }}>{r.label}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => setStep(2)} style={{
                width: '100%', padding: '12px', background: `linear-gradient(135deg, ${c}, #7c3aed)`,
                border: 'none', borderRadius: '8px', fontFamily: "'Orbitron', monospace",
                fontSize: '12px', fontWeight: '700', color: '#fff', letterSpacing: '1px',
                textTransform: 'uppercase', cursor: 'pointer'
              }}>Next →</button>
            </div>
          )}

          {/* STEP 2 — LinkedIn + Activity */}
          {step === 2 && (
            <div>
              {/* LinkedIn */}
              <div style={{ background: '#0a0f1e', border: `1px solid ${form.hasLinkedin ? c : '#1a2235'}`, borderRadius: '10px', padding: '12px', marginBottom: '1.25rem', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: form.hasLinkedin ? '12px' : '0' }}>
                  <input type="checkbox" id="hasLI" checked={form.hasLinkedin}
                    onChange={e => update('hasLinkedin', e.target.checked)}
                    style={{ accentColor: c, width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="hasLI" style={{ fontSize: '13px', color: '#e8eaf0', fontWeight: '700', cursor: 'pointer', flex: 1 }}>
                    💼 LinkedIn
                  </label>
                </div>
                {form.hasLinkedin && (
                  <div>
                    <p style={{ fontSize: '10px', color: '#4a5568', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700' }}>Connections</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '10px' }}>
                      {linkedinRanges.map(r => (
                        <button key={r.value} onClick={() => update('linkedinConnections', r.value)} style={{
                          padding: '6px', background: form.linkedinConnections === r.value ? `rgba(167,139,250,0.15)` : '#13161f',
                          border: `1px solid ${form.linkedinConnections === r.value ? c : '#1a2235'}`,
                          borderRadius: '6px', color: form.linkedinConnections === r.value ? c : '#4a5568',
                          fontSize: '10px', fontWeight: '700', cursor: 'pointer',
                          fontFamily: "'Rajdhani', sans-serif", transition: 'all 0.2s'
                        }}>{r.label}</button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <p style={{ fontSize: '10px', color: '#4a5568', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700', margin: 0 }}>Skill Endorsements</p>
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '12px', color: c, fontWeight: '700' }}>{form.linkedinEndorsements}</span>
                    </div>
                    <input type="range" min="0" max="150" value={form.linkedinEndorsements}
                      onChange={e => update('linkedinEndorsements', parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: c, cursor: 'pointer' }}
                    />
                  </div>
                )}
              </div>

              {/* Content Frequency */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#6b7280', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '8px' }}>
                  How often do you post content?
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { key: 'daily', label: '🔥 Daily', desc: 'Almost every day' },
                    { key: 'weekly', label: '📅 Weekly', desc: 'A few times a week' },
                    { key: 'monthly', label: '📌 Monthly', desc: 'Once or twice a month' },
                    { key: 'rarely', label: '😴 Rarely', desc: 'Barely post' },
                  ].map(f => (
                    <button key={f.key} onClick={() => update('contentFrequency', f.key)} style={{
                      padding: '9px 14px', background: form.contentFrequency === f.key ? `rgba(167,139,250,0.1)` : '#0a0f1e',
                      border: `1px solid ${form.contentFrequency === f.key ? c : '#1a2235'}`,
                      borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s'
                    }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: form.contentFrequency === f.key ? c : '#e8eaf0', fontFamily: "'Rajdhani', sans-serif" }}>{f.label}</span>
                      <span style={{ fontSize: '11px', color: '#4a5568' }}>{f.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Years Active */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700' }}>Years Active Online</label>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '13px', color: c, fontWeight: '700' }}>{form.yearsActive} yrs</span>
                </div>
                <input type="range" min="0" max="15" value={form.yearsActive}
                  onChange={e => update('yearsActive', parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: c, cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setStep(1)} style={{
                  flex: 1, padding: '11px', background: 'transparent',
                  border: '1px solid #1a2235', borderRadius: '8px', color: '#4a5568',
                  fontFamily: "'Rajdhani', sans-serif", fontSize: '12px', fontWeight: '700',
                  letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer'
                }}>← Back</button>
                <button onClick={handleCalculate} style={{
                  flex: 2, padding: '12px', background: `linear-gradient(135deg, ${c}, #7c3aed)`,
                  border: 'none', borderRadius: '8px', fontFamily: "'Orbitron', monospace",
                  fontSize: '12px', fontWeight: '700', color: '#fff', letterSpacing: '1px',
                  textTransform: 'uppercase', cursor: 'pointer'
                }}>Calculate ⚡</button>
              </div>
            </div>
          )}

          {/* STEP 3 — Results */}
          {step === 3 && stats && (
            <div>
              <div style={{ background: 'rgba(167,139,250,0.08)', border: `1px solid ${c}`, borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', textAlign: 'center' }}>
                  ⚡ Your Political · Power Scores
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[
                    ['Influence', stats.political_influence],
                    ['Reach', stats.political_reach],
                    ['Network', stats.political_network],
                    ['Authority', stats.political_authority],
                    ['Repute', stats.political_repute],
                    ['Alliances', stats.political_alliances],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background: '#0a0f1e', borderRadius: '6px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#4a5568', fontWeight: '700', textTransform: 'uppercase' }}>{label}</span>
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '16px', fontWeight: '700', color: c }}>{val}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '10px', padding: '8px', background: '#0a0f1e', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>Overall Influence Score: </span>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '18px', fontWeight: '900', color: c }}>
                    {Math.round(Object.values(stats).reduce((a, b) => a + b, 0) / 6)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setStep(1)} style={{
                  flex: 1, padding: '11px', background: 'transparent',
                  border: '1px solid #1a2235', borderRadius: '8px', color: '#4a5568',
                  fontFamily: "'Rajdhani', sans-serif", fontSize: '12px', fontWeight: '700',
                  letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer'
                }}>Redo</button>
                <button onClick={handleSave} disabled={saving} style={{
                  flex: 2, padding: '12px', background: `linear-gradient(135deg, ${c}, #7c3aed)`,
                  border: 'none', borderRadius: '8px', fontFamily: "'Orbitron', monospace",
                  fontSize: '12px', fontWeight: '700', color: '#fff', letterSpacing: '1px',
                  textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1
                }}>
                  {saving ? 'SAVING...' : '✅ SAVE TO STATCARD'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
