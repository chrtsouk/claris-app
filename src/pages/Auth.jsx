import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES, TOTAL_TOOLS } from '../data/categories'

// ── SHARED FORM COMPONENTS ─────────────────────────────────

function FormInput({ label, type = 'text', value, onChange, placeholder, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 10, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--txt2)' }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 'var(--r)', padding: '10px 14px', fontSize: 13, color: 'var(--txt)', fontFamily: 'inherit', outline: 'none', width: '100%', transition: 'border .15s' }}
        onFocus={e => e.target.style.borderColor = 'var(--bdr2)'}
        onBlur={e => e.target.style.borderColor = 'var(--bdr)'}
      />
    </div>
  )
}

function SocialBtn({ icon, label, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 'var(--r)', border: '1px solid var(--bdr)', background: 'var(--bg3)', fontSize: 12, color: 'var(--txt2)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--bdr2)'; e.currentTarget.style.color = 'var(--txt)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bdr)'; e.currentTarget.style.color = 'var(--txt2)' }}>
      <i className={`ti ${icon}`} style={{ fontSize: 15 }} aria-hidden="true" /> {label}
    </button>
  )
}

function AuthCard({ children, title, sub }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="#0c0c12">
              <rect x="1" y="1" width="6" height="6" rx="1.4"/><rect x="9" y="1" width="6" height="6" rx="1.4"/>
              <rect x="1" y="9" width="6" height="6" rx="1.4"/><rect x="9" y="9" width="6" height="6" rx="1.4"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--txt)' }}>CLARIS</span>
        </div>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 16, padding: '32px 32px 28px' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--txt)', marginBottom: 6 }}>{title}</div>
          <div style={{ fontSize: 13, color: 'var(--txt2)', marginBottom: 24 }}>{sub}</div>
          {children}
        </div>
      </div>
    </div>
  )
}

function ErrorMsg({ msg }) {
  if (!msg) return null
  return (
    <div style={{ background: 'rgba(226,75,74,.08)', border: '1px solid rgba(226,75,74,.2)', borderRadius: 'var(--r)', padding: '10px 14px', fontSize: 12, color: '#e24b4a' }}>
      <i className="ti ti-alert-circle" style={{ marginRight: 6 }} aria-hidden="true" />{msg}
    </div>
  )
}

function PrimaryBtn({ children, onClick, loading, type = 'button' }) {
  return (
    <button type={type} onClick={onClick} disabled={loading}
      style={{ width: '100%', padding: 13, borderRadius: 'var(--r)', background: loading ? 'var(--gold2)' : 'var(--gold)', border: 'none', fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#0c0c12', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '.02em', transition: 'opacity .15s' }}>
      {loading ? <><i className="ti ti-loader-2 animate-pulse" style={{ marginRight: 6 }} aria-hidden="true" />Loading...</> : children}
    </button>
  )
}

function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--bdr)' }} />
      <span style={{ fontSize: 11, color: 'var(--txt3)' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--bdr)' }} />
    </div>
  )
}

// ── SIGN UP PAGE ───────────────────────────────────────────

export function SignUpPage() {
  const { signUp, signInWithGoogle, signInWithApple } = useAuth()
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError('')
    const { error } = await signUp({ email, password, firstName, lastName })
    setLoading(false)
    if (error) setError(error.message)
    else navigate('/subscribe')
  }

  return (
    <AuthCard title="Create your account" sub="Start your 14-day free trial — no credit card required">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <SocialBtn icon="ti-brand-google" label="Google" onClick={() => alert('Google login coming soon. Please use email & password for now.')} />
        <SocialBtn icon="ti-brand-apple" label="Apple" onClick={() => alert('Apple login coming soon. Please use email & password for now.')} />
      </div>
      <Divider label="or with email" />
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <FormInput label="First name" value={firstName} onChange={setFirstName} placeholder="Alex" required />
          <FormInput label="Last name" value={lastName} onChange={setLastName} placeholder="Smith" required />
        </div>
        <FormInput label="Email" type="email" value={email} onChange={setEmail} placeholder="alex@email.com" required />
        <FormInput label="Password" type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" required />
        <ErrorMsg msg={error} />
        <PrimaryBtn type="submit" loading={loading}>Create account & choose plan →</PrimaryBtn>
      </form>
      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--txt3)', marginTop: 16 }}>
        Already have an account? <Link to="/signin" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Sign in</Link>
      </div>
    </AuthCard>
  )
}

// ── SIGN IN PAGE ───────────────────────────────────────────

export function SignInPage() {
  const { signIn, signInWithGoogle, signInWithApple } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [forgotMode, setForgotMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await signIn({ email, password })
    setLoading(false)
    if (error) setError(error.message)
    else navigate('/')
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!email) { setError('Please enter your email address'); return }
    setLoading(true); setError('')
    const { supabase } = await import('../lib/supabase')
    const redirectTo = window.location.origin + '/reset-password'
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    })
    setLoading(false)
    if (error) setError(error.message)
    else setResetSent(true)
  }

  if (forgotMode) return (
    <AuthCard title="Reset password" sub="Enter your email and we'll send you a reset link">
      {resetSent ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(29,158,117,.12)', border: '1px solid rgba(29,158,117,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <i className="ti ti-mail-check" style={{ fontSize: 26, color: '#1d9e75' }} aria-hidden="true" />
          </div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--txt)', marginBottom: 8 }}>Check your inbox</div>
          <div style={{ fontSize: 13, color: 'var(--txt2)', marginBottom: 24 }}>We sent a reset link to <strong style={{ color: 'var(--txt)' }}>{email}</strong></div>
          <button onClick={() => { setForgotMode(false); setResetSent(false) }}
            style={{ fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            ← Back to sign in
          </button>
        </div>
      ) : (
        <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FormInput label="Email" type="email" value={email} onChange={setEmail} placeholder="alex@email.com" required />
          <ErrorMsg msg={error} />
          <PrimaryBtn type="submit" loading={loading}>Send reset link →</PrimaryBtn>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--txt3)' }}>
            <span style={{ color: 'var(--gold)', cursor: 'pointer' }} onClick={() => setForgotMode(false)}>← Back to sign in</span>
          </div>
        </form>
      )}
    </AuthCard>
  )

  return (
    <AuthCard title="Welcome back" sub="Sign in to your CLARIS account">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <SocialBtn icon="ti-brand-google" label="Google" onClick={() => alert('Google login coming soon. Please use email & password for now.')} />
        <SocialBtn icon="ti-brand-apple" label="Apple" onClick={() => alert('Apple login coming soon. Please use email & password for now.')} />
      </div>
      <Divider label="or with email" />
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
        <FormInput label="Email" type="email" value={email} onChange={setEmail} placeholder="alex@email.com" required />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <FormInput label="Password" type="password" value={password} onChange={setPassword} placeholder="Your password" required />
          <div style={{ textAlign: 'right' }}>
            <span onClick={() => setForgotMode(true)} style={{ fontSize: 11, color: 'var(--gold)', cursor: 'pointer', opacity: .8 }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '.8'}>
              Forgot password?
            </span>
          </div>
        </div>
        <ErrorMsg msg={error} />
        <PrimaryBtn type="submit" loading={loading}>Sign in →</PrimaryBtn>
      </form>
      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--txt3)', marginTop: 16 }}>
        Don't have an account? <Link to="/signup" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Create one</Link>
      </div>
    </AuthCard>
  )
}

// ── SUBSCRIBE PAGE ─────────────────────────────────────────

export function SubscribePage() {
  const navigate = useNavigate()
  const [billing, setBilling] = useState('monthly') // monthly | annual
  const monthly = billing === 'monthly'

  const features = [
    `All ${TOTAL_TOOLS.toLocaleString()} professional tools`,
    'All 15 categories & 81 subcategories',
    'iOS, Android, Windows, Mac & Linux',
    'PDF, Excel & CSV export',
    '100% offline access',
    'Regular new tools added',
    'Cancel anytime',
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="#0c0c12">
              <rect x="1" y="1" width="6" height="6" rx="1.4"/><rect x="9" y="1" width="6" height="6" rx="1.4"/>
              <rect x="1" y="9" width="6" height="6" rx="1.4"/><rect x="9" y="9" width="6" height="6" rx="1.4"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--txt)' }}>CLARIS</span>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 16, padding: '32px' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--txt)', marginBottom: 4, textAlign: 'center' }}>
            One price. <span style={{ color: 'var(--gold)' }}>Everything included.</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--txt2)', textAlign: 'center', marginBottom: 24 }}>
            All {TOTAL_TOOLS.toLocaleString()} tools, all platforms, no limits.
          </div>

          {/* Billing toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
            <span style={{ fontSize: 13, color: monthly ? 'var(--txt)' : 'var(--txt3)', fontWeight: monthly ? 500 : 400 }}>Monthly</span>
            <div onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
              style={{ width: 44, height: 24, borderRadius: 12, background: !monthly ? 'var(--gold2)' : 'var(--bg4)', border: '1px solid var(--bdr2)', position: 'relative', cursor: 'pointer', transition: 'background .2s' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: !monthly ? '#0c0c12' : 'var(--txt3)', position: 'absolute', top: 2, left: !monthly ? 22 : 3, transition: 'left .2s' }} />
            </div>
            <span style={{ fontSize: 13, color: !monthly ? 'var(--txt)' : 'var(--txt3)', fontWeight: !monthly ? 500 : 400 }}>
              Annual <span style={{ fontSize: 10, fontWeight: 700, color: '#0c0c12', background: 'var(--gold)', padding: '2px 7px', borderRadius: 20, marginLeft: 4 }}>2 months free</span>
            </span>
          </div>

          {/* Price */}
          <div style={{ background: 'var(--bg3)', border: '2px solid var(--gold)', borderRadius: 14, padding: '20px', textAlign: 'center', marginBottom: 20, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, right: 20, background: 'var(--gold)', color: '#0c0c12', fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: '0 0 8px 8px', letterSpacing: '.06em' }}>FULL ACCESS</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 600, color: 'var(--txt2)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>CLARIS Pro</div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2, marginBottom: 4 }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--gold)', alignSelf: 'flex-start', paddingTop: 8 }}>£</span>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 52, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{monthly ? '10' : '100'}</span>
              <span style={{ fontSize: 14, color: 'var(--txt3)', paddingBottom: 6 }}>/{monthly ? 'month' : 'year'}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--txt3)' }}>
              {monthly ? 'Billed monthly · cancel anytime' : 'That\'s just £8.33/month — saving £20'}
            </div>
          </div>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {features.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12, color: 'var(--txt2)' }}>
                <i className="ti ti-check" style={{ fontSize: 13, color: 'var(--gold)', flexShrink: 0 }} aria-hidden="true" />{f}
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/')}
            style={{ width: '100%', padding: 14, borderRadius: 'var(--r)', background: 'var(--gold)', border: 'none', fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#0c0c12', cursor: 'pointer', letterSpacing: '.02em', marginBottom: 8 }}>
            Start 14-day free trial →
          </button>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--txt3)' }}>No credit card required to start</div>

          {/* Trust */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16 }}>
            {[['ti-shield-check','Secure'], ['ti-refresh','Cancel anytime'], ['ti-clock','14-day trial']].map(([icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--txt3)' }}>
                <i className={`ti ${icon}`} aria-hidden="true" />{label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── ONBOARDING PAGE ────────────────────────────────────────

export function OnboardingPage() {
  const navigate = useNavigate()
  const [slide, setSlide] = useState(0)

  const slides = [
    {
      title: <>Every tool you'll ever <span style={{ color: 'var(--gold)' }}>need</span></>,
      sub: `${TOTAL_TOOLS.toLocaleString()} professional tools across 15 categories — for every stage of life and every income level.`,
      icon: 'ti-apps',
      color: 'var(--gold)',
      stat: TOTAL_TOOLS.toLocaleString(),
      statLbl: 'tools',
    },
    {
      title: <>One library. <span style={{ color: 'var(--gold)' }}>15 categories.</span></>,
      sub: 'Finance, business, investing, real estate, HR, marketing, healthcare and more — all in one place.',
      icon: 'ti-folder',
      color: '#378add',
      stat: '15',
      statLbl: 'categories',
    },
    {
      title: <>Works on <span style={{ color: 'var(--gold)' }}>every</span> device you own</>,
      sub: 'iOS, Android, Windows, Mac and Linux. Fully offline. Export to PDF, Excel or CSV anytime.',
      icon: 'ti-devices',
      color: '#1d9e75',
      stat: '6',
      statLbl: 'platforms',
    },
    {
      title: <>One price. <span style={{ color: 'var(--gold)' }}>Everything included.</span></>,
      sub: '£10/month or £100/year. 14-day free trial. No credit card required. Cancel anytime.',
      icon: 'ti-crown',
      color: 'var(--gold)',
      stat: '£10',
      statLbl: 'per month',
    },
  ]

  const current = slides[slide]
  const isLast = slide === slides.length - 1

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40, justifyContent: 'center' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="#0c0c12">
              <rect x="1" y="1" width="6" height="6" rx="1.4"/><rect x="9" y="1" width="6" height="6" rx="1.4"/>
              <rect x="1" y="9" width="6" height="6" rx="1.4"/><rect x="9" y="9" width="6" height="6" rx="1.4"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--txt)' }}>CLARIS</span>
        </div>

        {/* Slide */}
        <div key={slide} className="animate-fade-up" style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: `rgba(${current.color === 'var(--gold)' ? '201,169,110' : current.color === '#378add' ? '55,138,221' : '29,158,117'},.12)`, border: `1px solid ${current.color === 'var(--gold)' ? 'var(--bdr2)' : current.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <i className={`ti ${current.icon}`} style={{ fontSize: 36, color: current.color }} aria-hidden="true" />
          </div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 700, color: 'var(--txt)', lineHeight: 1.2, marginBottom: 12 }}>{current.title}</div>
          <div style={{ fontSize: 14, color: 'var(--txt2)', lineHeight: 1.65, maxWidth: 340, margin: '0 auto 20px' }}>{current.sub}</div>
          <div style={{ display: 'inline-block', background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, padding: '10px 24px' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 700, color: 'var(--gold)' }}>{current.stat}</div>
            <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{current.statLbl}</div>
          </div>
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
          {slides.map((_, i) => (
            <div key={i} onClick={() => setSlide(i)} style={{ width: i === slide ? 22 : 6, height: 6, borderRadius: 3, background: i === slide ? 'var(--gold)' : 'var(--bg4)', border: `1px solid ${i === slide ? 'var(--gold)' : 'var(--bdr)'}`, cursor: 'pointer', transition: 'all .3s' }} />
          ))}
        </div>

        {/* Buttons */}
        {isLast ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => navigate('/signup')} style={{ width: '100%', padding: 14, borderRadius: 'var(--r)', background: 'var(--gold)', border: 'none', fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#0c0c12', cursor: 'pointer', letterSpacing: '.02em' }}>
              Create account →
            </button>
            <button onClick={() => navigate('/signin')} style={{ width: '100%', padding: 10, borderRadius: 'var(--r)', border: '1px solid var(--bdr)', background: 'transparent', fontSize: 13, color: 'var(--txt2)', cursor: 'pointer', fontFamily: 'inherit' }}>
              I already have an account
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => navigate('/signup')} style={{ flex: 1, padding: 12, borderRadius: 'var(--r)', border: '1px solid var(--bdr)', background: 'transparent', fontSize: 13, color: 'var(--txt2)', cursor: 'pointer', fontFamily: 'inherit' }}>
              Skip
            </button>
            <button onClick={() => setSlide(s => s + 1)} style={{ flex: 2, padding: 12, borderRadius: 'var(--r)', background: 'var(--gold)', border: 'none', fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#0c0c12', cursor: 'pointer', letterSpacing: '.02em' }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── RESET PASSWORD PAGE ────────────────────────────────────────
// User lands here after clicking the email reset link
export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // Supabase puts the token in the URL hash — it handles it automatically
  // We just need to call updateUser with the new password

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true); setError('')

    const { createClient } = await import('@supabase/supabase-js')
    const { supabase } = await import('../lib/supabase')
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) setError(error.message)
    else setDone(true)
  }

  if (done) return (
    <AuthCard title="Password updated!" sub="Your new password has been saved">
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(29,158,117,.12)', border: '1px solid rgba(29,158,117,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <i className="ti ti-check" style={{ fontSize: 28, color: '#1d9e75' }} aria-hidden="true" />
        </div>
        <div style={{ fontSize: 13, color: 'var(--txt2)', marginBottom: 24 }}>Your password has been changed successfully.</div>
        <PrimaryBtn onClick={() => navigate('/')}>Go to dashboard →</PrimaryBtn>
      </div>
    </AuthCard>
  )

  return (
    <AuthCard title="Create new password" sub="Choose a strong password for your CLARIS account">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <FormInput label="New password" type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" required />
        <FormInput label="Confirm new password" type="password" value={confirm} onChange={setConfirm} placeholder="Repeat new password" required />
        <ErrorMsg msg={error} />
        <PrimaryBtn type="submit" loading={loading}>Set new password →</PrimaryBtn>
      </form>
    </AuthCard>
  )
}
