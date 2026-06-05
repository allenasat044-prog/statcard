import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

async function fetchGitHubStats(username, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  // Fetch user profile
  const userRes = await fetch(`https://api.github.com/users/${username}`, { headers })
  const userData = await userRes.json()

  // Fetch repos
  const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers })
  const repos = await reposRes.json()

  if (!Array.isArray(repos)) return null

  // Calculate stats
  const totalStars = repos.reduce((a, r) => a + (r.stargazers_count || 0), 0)
  const totalForks = repos.reduce((a, r) => a + (r.forks_count || 0), 0)
  const publicRepos = userData.public_repos || repos.length

  // Get unique languages
  const languages = [...new Set(repos.map(r => r.language).filter(Boolean))]

  // Fetch recent commits (events API)
  const eventsRes = await fetch(`https://api.github.com/users/${username}/events?per_page=100`, { headers })
  const events = await eventsRes.json()
  const pushEvents = Array.isArray(events) ? events.filter(e => e.type === 'PushEvent') : []
  const recentCommits = pushEvents.reduce((a, e) => a + (e.payload?.commits?.length || 0), 0)

  // Calculate education scores (all out of 100)
  const skillsScore = Math.min(100, Math.round((languages.length / 10) * 100))
  const expertiseScore = Math.min(100, Math.round((publicRepos / 50) * 100))
  const creativityScore = Math.min(100, Math.round(((totalStars + totalForks) / 100) * 100))
  const learningScore = Math.min(100, Math.round((recentCommits / 50) * 100))
  const knowledgeScore = Math.min(100, Math.round(((skillsScore + expertiseScore) / 2)))
  const iqScore = Math.min(100, Math.round(((skillsScore + expertiseScore + creativityScore + learningScore) / 4)))

  return {
    github_username: username,
    github_connected: true,
    verified_github: true,
    github_repos: publicRepos,
    github_stars: totalStars,
    github_commits: recentCommits,
    github_languages: languages.slice(0, 8).join(', '),
    education_skills: Math.max(30, skillsScore),
    education_expertise: Math.max(30, expertiseScore),
    education_creativity: Math.max(30, creativityScore),
    education_learning: Math.max(30, learningScore),
    education_knowledge: Math.max(30, knowledgeScore),
    education_iq: Math.max(30, iqScore),
  }
}

export default function GitHubConnect({ profile, onUpdate, onClose }) {
  const [step, setStep] = useState('intro') // intro, connecting, success, error, manual
  const [manualUsername, setManualUsername] = useState('')
  const [stats, setStats] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  // Check if coming back from GitHub OAuth
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.provider_token && session?.user?.user_metadata?.user_name) {
        const githubUsername = session.user.user_metadata.user_name
        setStep('connecting')
        try {
          const ghStats = await fetchGitHubStats(githubUsername, session.provider_token)
          if (ghStats) {
            setStats(ghStats)
            setStep('success')
          } else {
            setErrorMsg('Could not fetch GitHub data.')
            setStep('error')
          }
        } catch (e) {
          setErrorMsg('Failed to connect GitHub.')
          setStep('error')
        }
      }
    }
    if (profile?.github_connected) {
      setStep('already')
    } else {
      checkSession()
    }
  }, [profile])

  async function handleOAuthConnect() {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        scopes: 'read:user public_repo',
        redirectTo: window.location.href
      }
    })
  }

  async function handleManualConnect() {
    if (!manualUsername.trim()) return
    setLoading(true)
    setErrorMsg('')
    try {
      const ghStats = await fetchGitHubStats(manualUsername.trim(), null)
      if (ghStats) {
        setStats(ghStats)
        setStep('success')
      } else {
        setErrorMsg('GitHub username not found.')
      }
    } catch (e) {
      setErrorMsg('Could not fetch GitHub data. Check the username.')
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!stats) return
    setLoading(true)
    const { data } = await supabase.from('profiles').update(stats).eq('id', profile.id).select().single()
    if (data) onUpdate(data)
    setLoading(false)
    onClose()
  }

  const c = '#38bdf8'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: '#0d1120', border: `1px solid ${c}`, borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ height: '4px', background: `linear-gradient(90deg, ${c}, #7c3aed)` }} />
        <div style={{ padding: '1.5rem' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: '14px', color: '#e8eaf0', margin: '0 0 3px', letterSpacing: '2px' }}>
                🎓 GITHUB CONNECT
              </h2>
              <p style={{ fontSize: '11px', color: '#3a4560', margin: 0, letterSpacing: '1px' }}>EDUCATION · EXPERTISE STATS</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4a5568', cursor: 'pointer', fontSize: '20px' }}>×</button>
          </div>

          {/* INTRO */}
          {step === 'intro' && (
            <div>
              <div style={{ background: '#0a0f1e', border: '1px solid #1a2235', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px', lineHeight: 1.6 }}>
                  Connect your GitHub to auto-calculate your Education stats based on real activity:
                </p>
                {[
                  ['🛠 Skills', 'Languages you know'],
                  ['📦 Expertise', 'Number of repos'],
                  ['⭐ Creativity', 'Stars & forks earned'],
                  ['🔥 Learning', 'Recent commit activity'],
                ].map(([label, desc]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: c }}>{label}</span>
                    <span style={{ fontSize: '12px', color: '#4a5568' }}>{desc}</span>
                  </div>
                ))}
              </div>
              <button onClick={handleOAuthConnect} style={{
                width: '100%', padding: '12px', marginBottom: '10px',
                background: `linear-gradient(135deg, ${c}, #7c3aed)`,
                border: 'none', borderRadius: '8px',
                fontFamily: "'Orbitron', monospace", fontSize: '12px',
                fontWeight: '700', color: '#fff', letterSpacing: '1px',
                textTransform: 'uppercase', cursor: 'pointer'
              }}>
                🐙 Connect with GitHub
              </button>
              <button onClick={() => setStep('manual')} style={{
                width: '100%', padding: '10px', background: 'transparent',
                border: '1px solid #1a2235', borderRadius: '8px',
                color: '#4a5568', fontFamily: "'Rajdhani', sans-serif",
                fontSize: '12px', fontWeight: '700', letterSpacing: '1px',
                textTransform: 'uppercase', cursor: 'pointer'
              }}>
                Enter username manually
              </button>
            </div>
          )}

          {/* MANUAL */}
          {step === 'manual' && (
            <div>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1rem' }}>Enter your GitHub username to pull public stats:</p>
              <input
                type="text" value={manualUsername}
                onChange={e => setManualUsername(e.target.value)}
                placeholder="e.g. torvalds"
                onKeyDown={e => e.key === 'Enter' && handleManualConnect()}
                style={{
                  width: '100%', background: '#0a0f1e', border: `1px solid ${c}`,
                  borderRadius: '8px', padding: '10px 14px', color: '#e8eaf0',
                  fontSize: '14px', fontFamily: "'Rajdhani', sans-serif",
                  outline: 'none', boxSizing: 'border-box', marginBottom: '10px'
                }}
              />
              {errorMsg && <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '10px' }}>{errorMsg}</p>}
              <button onClick={handleManualConnect} disabled={loading} style={{
                width: '100%', padding: '12px', background: `linear-gradient(135deg, ${c}, #7c3aed)`,
                border: 'none', borderRadius: '8px', fontFamily: "'Orbitron', monospace",
                fontSize: '12px', fontWeight: '700', color: '#fff', letterSpacing: '1px',
                textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1
              }}>
                {loading ? 'FETCHING...' : 'FETCH STATS'}
              </button>
            </div>
          )}

          {/* CONNECTING */}
          {step === 'connecting' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontFamily: "'Orbitron', monospace", color: c, fontSize: '13px', letterSpacing: '3px', marginBottom: '8px' }}>FETCHING GITHUB DATA...</div>
              <p style={{ color: '#3a4560', fontSize: '12px' }}>Analyzing your repos, commits and languages</p>
            </div>
          )}

          {/* SUCCESS */}
          {step === 'success' && stats && (
            <div>
              <div style={{ background: 'rgba(56,189,248,0.08)', border: `1px solid ${c}`, borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '18px' }}>🐙</span>
                  <div>
                    <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '13px', color: c, fontWeight: '700' }}>@{stats.github_username}</div>
                    <div style={{ fontSize: '11px', color: '#4a5568' }}>{stats.github_repos} repos · {stats.github_stars} stars · {stats.github_commits} recent commits</div>
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#4a5568', marginBottom: '10px' }}>
                  Languages: <span style={{ color: c }}>{stats.github_languages || 'N/A'}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[
                    ['Skills', stats.education_skills],
                    ['Expertise', stats.education_expertise],
                    ['Creativity', stats.education_creativity],
                    ['Learning', stats.education_learning],
                    ['Knowledge', stats.education_knowledge],
                    ['IQ Score', stats.education_iq],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background: '#0a0f1e', borderRadius: '6px', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#4a5568', fontWeight: '700', textTransform: 'uppercase' }}>{label}</span>
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '14px', fontWeight: '700', color: c }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={handleSave} disabled={loading} style={{
                width: '100%', padding: '12px', background: `linear-gradient(135deg, ${c}, #7c3aed)`,
                border: 'none', borderRadius: '8px', fontFamily: "'Orbitron', monospace",
                fontSize: '12px', fontWeight: '700', color: '#fff', letterSpacing: '1px',
                textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1
              }}>
                {loading ? 'SAVING...' : '✅ SAVE TO MY STATCARD'}
              </button>
            </div>
          )}

          {/* ALREADY CONNECTED */}
          {step === 'already' && (
            <div>
              <div style={{ background: 'rgba(56,189,248,0.08)', border: `1px solid ${c}`, borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🐙</div>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '13px', color: c, marginBottom: '4px' }}>@{profile.github_username}</div>
                <div style={{ fontSize: '12px', color: '#4a5568' }}>GitHub already connected</div>
                <div style={{ fontSize: '11px', color: '#3a4560', marginTop: '6px' }}>{profile.github_repos} repos · {profile.github_stars} stars</div>
              </div>
              <button onClick={() => setStep('manual')} style={{
                width: '100%', padding: '10px', background: 'transparent',
                border: `1px solid ${c}`, borderRadius: '8px', color: c,
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
              <button onClick={() => setStep('manual')} style={{
                width: '100%', padding: '10px', background: 'transparent',
                border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444',
                fontFamily: "'Rajdhani', sans-serif", fontSize: '12px',
                fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer'
              }}>
                Try Manual Entry
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
