import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit() {
    setLoading(true)
    setError('')
    setMessage('')

    if (mode === 'signup') {
      if (!username.trim()) {
        setError('Username is required')
        setLoading(false)
        return
      }
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }
      if (data.user) {
        // Wait for trigger to auto-create profile row
        await new Promise(r => setTimeout(r, 1500))
        // Update with chosen username
        await supabase.from('profiles').update({
          username: username.trim(),
          avatar_initials: username.trim().slice(0, 2).toUpperCase(),
        }).eq('id', data.user.id)
      }
      setMessage('Account created! You can now log in.')
      setMode('login')
    } else {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
      if (loginError) setError(loginError.message)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#070a12',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Rajdhani', sans-serif", padding: '1rem'
    }}>
      <div style={{
        width: '100%', maxWidth: '400px',
        background: '#0d1120', border: '1px solid #1a2235',
        borderRadius: '16px', overflow: 'hidden'
      }}>
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #00f5a0, #00d9f5, #7c3aed)' }} />
        <div style={{ padding: '2rem' }}>
          <h1 style={{
            fontFamily: "'Orbitron', monospace", fontSize: '20px',
            fontWeight: '900', color: '#00f5a0', margin: '0 0 4px',
            letterSpacing: '2px', textAlign: 'center'
          }}>STATCARD</h1>
          <p style={{ color: '#3a4560', fontSize: '12px', textAlign: 'center', marginBottom: '2rem', letterSpacing: '1px' }}>
            YOUR LIFE. YOUR STATS.
          </p>

          {message && (
            <div style={{ background: 'rgba(0,245,160,0.1)', border: '1px solid #00f5a0', borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem', color: '#00f5a0', fontSize: '13px' }}>
              {message}
            </div>
          )}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem', color: '#ef4444', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {mode === 'signup' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#3a4560', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>Username</label>
              <input
                type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="e.g. SHANKS"
                style={{
                  width: '100%', background: '#0a0f1e', border: '1px solid #1a2235',
                  borderRadius: '8px', padding: '10px 14px', color: '#e8eaf0',
                  fontSize: '14px', fontFamily: "'Rajdhani', sans-serif",
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#3a4560', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com"
              style={{
                width: '100%', background: '#0a0f1e', border: '1px solid #1a2235',
                borderRadius: '8px', padding: '10px 14px', color: '#e8eaf0',
                fontSize: '14px', fontFamily: "'Rajdhani', sans-serif",
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#3a4560', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%', background: '#0a0f1e', border: '1px solid #1a2235',
                borderRadius: '8px', padding: '10px 14px', color: '#e8eaf0',
                fontSize: '14px', fontFamily: "'Rajdhani', sans-serif",
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            onClick={handleSubmit} disabled={loading}
            style={{
              width: '100%', padding: '12px',
              background: 'linear-gradient(135deg, #00f5a0, #00d9f5)',
              border: 'none', borderRadius: '8px',
              fontFamily: "'Orbitron', monospace", fontSize: '13px',
              fontWeight: '700', color: '#070a12', letterSpacing: '2px',
              textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1, marginBottom: '1rem'
            }}
          >
            {loading ? 'LOADING...' : mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#3a4560' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <span
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage('') }}
              style={{ color: '#00f5a0', cursor: 'pointer', fontWeight: '700' }}
            >
              {mode === 'login' ? 'Sign Up' : 'Login'}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
