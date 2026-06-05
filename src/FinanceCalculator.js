import { useState } from 'react'
import { supabase } from './supabaseClient'

function calculateFinanceStats(data) {
  const {
    monthlyIncome, savingsRate, hasInvestments,
    hasProperty, hasVehicle, hasEmergencyFund,
    debtLevel, investmentValue, propertyValue
  } = data

  // Income score (based on monthly income in INR)
  // 10k = 20, 50k = 50, 1L = 70, 5L = 90, 10L+ = 100
  let incomeScore = 20
  if (monthlyIncome >= 1000000) incomeScore = 100
  else if (monthlyIncome >= 500000) incomeScore = 90
  else if (monthlyIncome >= 200000) incomeScore = 80
  else if (monthlyIncome >= 100000) incomeScore = 70
  else if (monthlyIncome >= 50000) incomeScore = 60
  else if (monthlyIncome >= 30000) incomeScore = 50
  else if (monthlyIncome >= 20000) incomeScore = 40
  else if (monthlyIncome >= 10000) incomeScore = 30

  // Savings score (% of income saved)
  let savingsScore = 20
  if (savingsRate >= 50) savingsScore = 100
  else if (savingsRate >= 40) savingsScore = 85
  else if (savingsRate >= 30) savingsScore = 75
  else if (savingsRate >= 20) savingsScore = 60
  else if (savingsRate >= 10) savingsScore = 45
  else if (savingsRate >= 5) savingsScore = 35

  // Investment score
  let investScore = 20
  if (hasInvestments) {
    if (investmentValue >= 10000000) investScore = 100
    else if (investmentValue >= 5000000) investScore = 85
    else if (investmentValue >= 1000000) investScore = 70
    else if (investmentValue >= 500000) investScore = 60
    else if (investmentValue >= 100000) investScore = 50
    else investScore = 40
  }

  // Assets score (property + vehicle)
  let assetsScore = 20
  if (hasProperty) assetsScore += 40
  if (hasVehicle) assetsScore += 15
  if (hasEmergencyFund) assetsScore += 15
  if (propertyValue >= 10000000) assetsScore = Math.min(100, assetsScore + 20)
  assetsScore = Math.min(100, assetsScore)

  // Wealth score (overall net worth estimate)
  const netWorthEstimate = (propertyValue || 0) + (investmentValue || 0) + (monthlyIncome * 12 * (savingsRate / 100))
  let wealthScore = 20
  if (netWorthEstimate >= 100000000) wealthScore = 100
  else if (netWorthEstimate >= 50000000) wealthScore = 90
  else if (netWorthEstimate >= 10000000) wealthScore = 80
  else if (netWorthEstimate >= 5000000) wealthScore = 70
  else if (netWorthEstimate >= 1000000) wealthScore = 60
  else if (netWorthEstimate >= 500000) wealthScore = 50
  else if (netWorthEstimate >= 100000) wealthScore = 40
  else if (netWorthEstimate >= 50000) wealthScore = 30

  // Credit score (based on debt level and savings habit)
  let creditScore = 50
  if (debtLevel === 'none') creditScore = 90
  else if (debtLevel === 'low') creditScore = 75
  else if (debtLevel === 'medium') creditScore = 55
  else if (debtLevel === 'high') creditScore = 30

  if (hasEmergencyFund) creditScore = Math.min(100, creditScore + 10)

  return {
    finance_connected: true,
    verified_finance: true,
    finance_monthly_income: monthlyIncome,
    finance_savings_rate: savingsRate,
    finance_has_investments: hasInvestments,
    finance_has_property: hasProperty,
    finance_has_vehicle: hasVehicle,
    finance_wealth: Math.max(20, wealthScore),
    finance_income: Math.max(20, incomeScore),
    finance_invest: Math.max(20, investScore),
    finance_savings: Math.max(20, savingsScore),
    finance_assets: Math.max(20, assetsScore),
    finance_credit: Math.max(20, creditScore),
  }
}

const incomeRanges = [
  { label: 'Under ₹10k/mo', value: 8000 },
  { label: '₹10k - ₹20k', value: 15000 },
  { label: '₹20k - ₹30k', value: 25000 },
  { label: '₹30k - ₹50k', value: 40000 },
  { label: '₹50k - ₹1L', value: 75000 },
  { label: '₹1L - ₹2L', value: 150000 },
  { label: '₹2L - ₹5L', value: 350000 },
  { label: '₹5L+/mo', value: 600000 },
]

const investmentRanges = [
  { label: 'Under ₹1L', value: 50000 },
  { label: '₹1L - ₹5L', value: 300000 },
  { label: '₹5L - ₹10L', value: 750000 },
  { label: '₹10L - ₹50L', value: 3000000 },
  { label: '₹50L - ₹1Cr', value: 7500000 },
  { label: '₹1Cr+', value: 15000000 },
]

const propertyRanges = [
  { label: 'Under ₹20L', value: 1500000 },
  { label: '₹20L - ₹50L', value: 3500000 },
  { label: '₹50L - ₹1Cr', value: 7500000 },
  { label: '₹1Cr - ₹3Cr', value: 20000000 },
  { label: '₹3Cr+', value: 40000000 },
]

export default function FinanceCalculator({ profile, onUpdate, onClose }) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState(null)

  const [form, setForm] = useState({
    monthlyIncome: 40000,
    savingsRate: 20,
    hasInvestments: false,
    investmentValue: 300000,
    hasProperty: false,
    propertyValue: 3500000,
    hasVehicle: false,
    hasEmergencyFund: false,
    debtLevel: 'low',
  })

  function update(key, val) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  function handleCalculate() {
    const result = calculateFinanceStats(form)
    setStats(result)
    setStep(4)
  }

  async function handleSave() {
    if (!stats) return
    setSaving(true)
    const { data } = await supabase.from('profiles').update(stats).eq('id', profile.id).select().single()
    if (data) onUpdate(data)
    setSaving(false)
    onClose()
  }

  const c = '#facc15'

  const stepTitles = ['', 'Income & Savings', 'Assets & Investments', 'Debt & Safety Net', 'Your Finance Stats']

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: '#0d1120', border: `1px solid ${c}`, borderRadius: '16px', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #facc15, #f59e0b)' }} />
        <div style={{ padding: '1.5rem' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div>
              <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: '14px', color: '#e8eaf0', margin: '0 0 3px', letterSpacing: '2px' }}>
                💰 FINANCE CALCULATOR
              </h2>
              <p style={{ fontSize: '11px', color: '#3a4560', margin: 0, letterSpacing: '1px' }}>{stepTitles[step]}</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4a5568', cursor: 'pointer', fontSize: '20px' }}>×</button>
          </div>

          {/* Progress bar */}
          {step < 4 && (
            <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem' }}>
              {[1,2,3].map(s => (
                <div key={s} style={{ flex: 1, height: '3px', borderRadius: '2px', background: s <= step ? c : '#1a2235', transition: 'background 0.3s' }} />
              ))}
            </div>
          )}

          {/* STEP 1 — Income & Savings */}
          {step === 1 && (
            <div>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                All info is private — only your scores are shown publicly, never actual numbers.
              </p>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#6b7280', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '8px' }}>
                  Monthly Income
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {incomeRanges.map(r => (
                    <button key={r.value} onClick={() => update('monthlyIncome', r.value)} style={{
                      padding: '8px', background: form.monthlyIncome === r.value ? 'rgba(250,204,21,0.15)' : '#0a0f1e',
                      border: `1px solid ${form.monthlyIncome === r.value ? c : '#1a2235'}`,
                      borderRadius: '8px', color: form.monthlyIncome === r.value ? c : '#4a5568',
                      fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                      fontFamily: "'Rajdhani', sans-serif", transition: 'all 0.2s'
                    }}>{r.label}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700' }}>
                    Savings Rate
                  </label>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '14px', fontWeight: '700', color: c }}>{form.savingsRate}%</span>
                </div>
                <input type="range" min="0" max="80" value={form.savingsRate}
                  onChange={e => update('savingsRate', parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: c, cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#3a4560', marginTop: '4px' }}>
                  <span>0% (none)</span><span>20% (good)</span><span>50%+ (great)</span>
                </div>
              </div>

              <button onClick={() => setStep(2)} style={{
                width: '100%', padding: '12px', background: `linear-gradient(135deg, ${c}, #f59e0b)`,
                border: 'none', borderRadius: '8px', fontFamily: "'Orbitron', monospace",
                fontSize: '12px', fontWeight: '700', color: '#070a12', letterSpacing: '1px',
                textTransform: 'uppercase', cursor: 'pointer'
              }}>Next →</button>
            </div>
          )}

          {/* STEP 2 — Assets & Investments */}
          {step === 2 && (
            <div>
              {/* Investments */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <input type="checkbox" id="hasInv" checked={form.hasInvestments}
                    onChange={e => update('hasInvestments', e.target.checked)}
                    style={{ accentColor: c, width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="hasInv" style={{ fontSize: '13px', color: '#e8eaf0', fontWeight: '700', cursor: 'pointer' }}>
                    I have investments (stocks, MF, crypto, FD)
                  </label>
                </div>
                {form.hasInvestments && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginLeft: '26px' }}>
                    {investmentRanges.map(r => (
                      <button key={r.value} onClick={() => update('investmentValue', r.value)} style={{
                        padding: '7px', background: form.investmentValue === r.value ? 'rgba(250,204,21,0.15)' : '#0a0f1e',
                        border: `1px solid ${form.investmentValue === r.value ? c : '#1a2235'}`,
                        borderRadius: '8px', color: form.investmentValue === r.value ? c : '#4a5568',
                        fontSize: '10px', fontWeight: '700', cursor: 'pointer',
                        fontFamily: "'Rajdhani', sans-serif", transition: 'all 0.2s'
                      }}>{r.label}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Property */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <input type="checkbox" id="hasProp" checked={form.hasProperty}
                    onChange={e => update('hasProperty', e.target.checked)}
                    style={{ accentColor: c, width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="hasProp" style={{ fontSize: '13px', color: '#e8eaf0', fontWeight: '700', cursor: 'pointer' }}>
                    I own property / real estate
                  </label>
                </div>
                {form.hasProperty && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginLeft: '26px' }}>
                    {propertyRanges.map(r => (
                      <button key={r.value} onClick={() => update('propertyValue', r.value)} style={{
                        padding: '7px', background: form.propertyValue === r.value ? 'rgba(250,204,21,0.15)' : '#0a0f1e',
                        border: `1px solid ${form.propertyValue === r.value ? c : '#1a2235'}`,
                        borderRadius: '8px', color: form.propertyValue === r.value ? c : '#4a5568',
                        fontSize: '10px', fontWeight: '700', cursor: 'pointer',
                        fontFamily: "'Rajdhani', sans-serif", transition: 'all 0.2s'
                      }}>{r.label}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Vehicle */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" id="hasVeh" checked={form.hasVehicle}
                    onChange={e => update('hasVehicle', e.target.checked)}
                    style={{ accentColor: c, width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="hasVeh" style={{ fontSize: '13px', color: '#e8eaf0', fontWeight: '700', cursor: 'pointer' }}>
                    I own a vehicle (car / bike)
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setStep(1)} style={{
                  flex: 1, padding: '11px', background: 'transparent',
                  border: '1px solid #1a2235', borderRadius: '8px', color: '#4a5568',
                  fontFamily: "'Rajdhani', sans-serif", fontSize: '12px', fontWeight: '700',
                  letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer'
                }}>← Back</button>
                <button onClick={() => setStep(3)} style={{
                  flex: 2, padding: '12px', background: `linear-gradient(135deg, ${c}, #f59e0b)`,
                  border: 'none', borderRadius: '8px', fontFamily: "'Orbitron', monospace",
                  fontSize: '12px', fontWeight: '700', color: '#070a12', letterSpacing: '1px',
                  textTransform: 'uppercase', cursor: 'pointer'
                }}>Next →</button>
              </div>
            </div>
          )}

          {/* STEP 3 — Debt & Safety Net */}
          {step === 3 && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#6b7280', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '8px' }}>
                  Current Debt Level
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { key: 'none', label: '🟢 No debt', desc: 'Debt free' },
                    { key: 'low', label: '🟡 Low debt', desc: 'Small loans / EMIs' },
                    { key: 'medium', label: '🟠 Medium debt', desc: 'Home loan / car loan' },
                    { key: 'high', label: '🔴 High debt', desc: 'Multiple loans / credit cards' },
                  ].map(d => (
                    <button key={d.key} onClick={() => update('debtLevel', d.key)} style={{
                      padding: '10px 14px', background: form.debtLevel === d.key ? 'rgba(250,204,21,0.1)' : '#0a0f1e',
                      border: `1px solid ${form.debtLevel === d.key ? c : '#1a2235'}`,
                      borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      transition: 'all 0.2s'
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: form.debtLevel === d.key ? c : '#e8eaf0', fontFamily: "'Rajdhani', sans-serif" }}>{d.label}</span>
                      <span style={{ fontSize: '11px', color: '#4a5568' }}>{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" id="hasEmerg" checked={form.hasEmergencyFund}
                    onChange={e => update('hasEmergencyFund', e.target.checked)}
                    style={{ accentColor: c, width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="hasEmerg" style={{ fontSize: '13px', color: '#e8eaf0', fontWeight: '700', cursor: 'pointer' }}>
                    I have an emergency fund (3-6 months expenses)
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setStep(2)} style={{
                  flex: 1, padding: '11px', background: 'transparent',
                  border: '1px solid #1a2235', borderRadius: '8px', color: '#4a5568',
                  fontFamily: "'Rajdhani', sans-serif", fontSize: '12px', fontWeight: '700',
                  letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer'
                }}>← Back</button>
                <button onClick={handleCalculate} style={{
                  flex: 2, padding: '12px', background: `linear-gradient(135deg, ${c}, #f59e0b)`,
                  border: 'none', borderRadius: '8px', fontFamily: "'Orbitron', monospace",
                  fontSize: '12px', fontWeight: '700', color: '#070a12', letterSpacing: '1px',
                  textTransform: 'uppercase', cursor: 'pointer'
                }}>Calculate 🧮</button>
              </div>
            </div>
          )}

          {/* STEP 4 — Results */}
          {step === 4 && stats && (
            <div>
              <div style={{ background: 'rgba(250,204,21,0.08)', border: `1px solid ${c}`, borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', textAlign: 'center' }}>
                  🔒 Private inputs · Only scores shown publicly
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[
                    ['Wealth', stats.finance_wealth],
                    ['Income', stats.finance_income],
                    ['Investments', stats.finance_invest],
                    ['Savings', stats.finance_savings],
                    ['Assets', stats.finance_assets],
                    ['Credit', stats.finance_credit],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background: '#0a0f1e', borderRadius: '6px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#4a5568', fontWeight: '700', textTransform: 'uppercase' }}>{label}</span>
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '16px', fontWeight: '700', color: c }}>{val}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '10px', padding: '8px', background: '#0a0f1e', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>Overall Finance Score: </span>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '18px', fontWeight: '900', color: c }}>
                    {Math.round(Object.values(stats).filter(v => typeof v === 'number' && v >= 20 && v <= 100).reduce((a, b) => a + b, 0) / 6)}
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
                  flex: 2, padding: '12px', background: `linear-gradient(135deg, ${c}, #f59e0b)`,
                  border: 'none', borderRadius: '8px', fontFamily: "'Orbitron', monospace",
                  fontSize: '12px', fontWeight: '700', color: '#070a12', letterSpacing: '1px',
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
