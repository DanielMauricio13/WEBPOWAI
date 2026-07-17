import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowRight,
  BarChart3,
  BellRing,
  CheckCircle2,
  Dumbbell,
  Flame,
  HeartPulse,
  Image,
  LifeBuoy,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Moon,
  Plus,
  RefreshCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Trash2,
  Utensils,
  Users,
  X,
} from 'lucide-react'
import './index.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'https://powai-ea13190d89b9.herokuapp.com/'
const TOKEN_KEY = 'powai.web.jwt'
const TOKEN_EXPIRES_KEY = 'powai.web.jwt.expiresAt'

const registerDefaults = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  age: 25,
  gender: 'Male',
  weight: 180,
  weightUnit: 'lb',
  height: 0,
  heightUnit: 'cm',
  heightFt: 5,
  heightIn: 10,
  goal: 'Build muscle',
  bodyStructure: 'Mesomorph',
  whereWork: 'Gym',
  level: 'Beginner',
  numDays: 4,
  numHours: '1.25',
}

const demoPlan = [
  {
    day: 1,
    muscle_group: 'Push strength',
    exercises: [
      { name: 'Bench Press', reps: '8-10', sets: 4, calories_burned: 72 },
      { name: 'Incline Dumbbell Press', reps: '10-12', sets: 3, calories_burned: 48 },
      { name: 'Cable Triceps Pressdown', reps: '12-15', sets: 3, calories_burned: 36 },
    ],
  },
  {
    day: 2,
    muscle_group: 'Lower body',
    exercises: [
      { name: 'Back Squat', reps: '6-8', sets: 4, calories_burned: 88 },
      { name: 'Romanian Deadlift', reps: '8-10', sets: 3, calories_burned: 64 },
      { name: 'Walking Lunge', reps: '10 each', sets: 3, calories_burned: 58 },
    ],
  },
  {
    day: 3,
    muscle_group: 'Pull and core',
    exercises: [
      { name: 'Lat Pulldown', reps: '8-12', sets: 4, calories_burned: 60 },
      { name: 'Seated Row', reps: '10-12', sets: 3, calories_burned: 44 },
      { name: 'Hanging Knee Raise', reps: '12-15', sets: 3, calories_burned: 32 },
    ],
  },
]

function App() {
  const [token, setToken] = useState(readStoredToken)
  const [user, setUser] = useState(null)
  const [plan, setPlan] = useState([])
  const [weights, setWeights] = useState([])
  const [nutrition, setNutrition] = useState([])
  const [liftHistory, setLiftHistory] = useState([])
  const [adminData, setAdminData] = useState(null)
  const [activePage, setActivePage] = useState('dashboard')
  const [authMode, setAuthMode] = useState('login')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(Boolean(token))
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!token) return
    loadWorkspace()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function loadWorkspace() {
    setLoading(true)
    setNotice('')
    try {
      const me = await api('users/me', { token })
      let adminSummary = null

      try {
        adminSummary = await api('admin/summary', { token })
      } catch (error) {
        // Public user responses no longer expose isAdmin. A forbidden response
        // from the protected admin route is the authoritative non-admin signal.
        if (error.status !== 403) throw error
      }

      if (adminSummary) {
        setUser({ ...me, isAdmin: true })
        setPlan([])
        setWeights([])
        setNutrition([])
        setLiftHistory([])
        setAdminData(adminSummary)
        setActivePage('admin')
        return
      }

      setUser({ ...me, isAdmin: false })

      const [training, weightRows, nutritionRows, setRows] = await Promise.all([
        api('training/userExcersises', { token }).catch(() => null),
        api('weights', { token }).catch(() => []),
        api('daily-nutrition', { token }).catch(() => []),
        api('exercise-set-weights', { token }).catch(() => []),
      ])
      setPlan(normalizePlan(training))
      setWeights(Array.isArray(weightRows) ? weightRows : [])
      setNutrition(Array.isArray(nutritionRows) ? nutritionRows : [])
      setLiftHistory(Array.isArray(setRows) ? setRows : [])
      setAdminData(null)
    } catch (error) {
      clearSession()
      setNotice(error.message || 'Your session expired. Please log in again.')
    } finally {
      setLoading(false)
    }
  }

  function signIn(session) {
    const nextToken = typeof session === 'string' ? session : session?.token
    if (!nextToken) {
      setNotice('The server did not return a valid session. Please try again.')
      return
    }
    localStorage.setItem(TOKEN_KEY, nextToken)
    if (session?.expiresAt) localStorage.setItem(TOKEN_EXPIRES_KEY, session.expiresAt)
    else localStorage.removeItem(TOKEN_EXPIRES_KEY)
    setToken(nextToken)
    setActivePage('dashboard')
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRES_KEY)
    setToken('')
    setUser(null)
    setPlan([])
    setWeights([])
    setNutrition([])
    setLiftHistory([])
    setAdminData(null)
    setActivePage('dashboard')
  }

  async function signOut() {
    const tokenToRevoke = token
    clearSession()
    if (tokenToRevoke) {
      await api('logout', { method: 'POST', token: tokenToRevoke }).catch(() => null)
    }
  }

  if (!token) {
    return (
      <PublicSite
        authMode={authMode}
        setAuthMode={setAuthMode}
        notice={notice}
        onLogin={signIn}
      />
    )
  }

  return (
    <AuthenticatedApp
      activePage={activePage}
      adminData={adminData}
      drawerOpen={drawerOpen}
      liftHistory={liftHistory}
      loading={loading}
      nutrition={nutrition}
      onRefresh={loadWorkspace}
      onSignOut={signOut}
      plan={plan}
      setActivePage={setActivePage}
      setDrawerOpen={setDrawerOpen}
      token={token}
      user={user}
      weights={weights}
    />
  )
}

function PublicSite({ authMode, setAuthMode, notice, onLogin }) {
  const [supportStatus, setSupportStatus] = useState('')

  useEffect(() => {
    function scrollToHash() {
      const id = window.location.hash.replace('#', '')
      if (!id) return
      window.requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ block: 'start' })
      })
    }

    scrollToHash()
    window.addEventListener('hashchange', scrollToHash)
    return () => window.removeEventListener('hashchange', scrollToHash)
  }, [])

  return (
    <main className="site">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="PowAI home">
          <img src="/powai-app-icon.png" alt="" />
          <span>PowAI</span>
        </a>
        <nav className="top-nav" aria-label="Main navigation">
          <a href="#training">Training</a>
          <a href="#nutrition">Nutrition</a>
          <a href="#privacy">Privacy</a>
          <a href="#support">Support</a>
        </nav>
        <a className="header-cta" href="#access">
          <LockKeyhole size={17} />
          Try PowAI
        </a>
      </header>

      <section className="hero-section" id="top" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">AI fitness companion for iOS and web</p>
          <h1 id="hero-title">PowAI</h1>
          <p>
            Personalized training plans, nutrition targets, lift progress, body weight trends,
            smart alarms, and recovery tools shaped around your fitness goals.
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#access">
              Start your plan
              <ArrowRight size={18} />
            </a>
            <a className="secondary-action" href="#training">Explore features</a>
          </div>
        </div>

        <div className="hero-device" aria-label="PowAI product preview">
          <div className="phone-frame">
            <div className="phone-status">
              <span>9:41</span>
              <HeartPulse size={16} />
            </div>
            <div className="phone-title">
              <span>Today</span>
              <strong>Push strength</strong>
            </div>
            <div className="workout-stack">
              {demoPlan[0].exercises.map((exercise) => (
                <div className="workout-row" key={exercise.name}>
                  <span>{exercise.sets}x</span>
                  <div>
                    <strong>{exercise.name}</strong>
                    <small>{exercise.reps} reps</small>
                  </div>
                  <b>{exercise.calories_burned}</b>
                </div>
              ))}
            </div>
            <div className="macro-strip">
              <MetricPill label="Protein" value="150g" />
              <MetricPill label="Calories" value="2200" />
              <MetricPill label="Water" value="3.0L" />
            </div>
          </div>
        </div>
      </section>

      <section className="feature-band" id="training">
        <SectionTitle
          icon={Dumbbell}
          label="Training"
          title="Workout plans built around your real routine"
          text="PowAI uses your goal, body structure, training location, experience, available days, and session length to shape a plan that feels personal."
        />
        <div className="feature-grid">
          <FeatureCard icon={Sparkles} title="AI generated plans" text="Create a profile and PowAI turns your goals, schedule, level, and location into a personal training plan." />
          <FeatureCard icon={TimerReset} title="Session-aware volume" text="Plans are presented by day with sets, reps, exercise names, and calorie estimates." />
          <FeatureCard icon={BellRing} title="Alarm-first lifestyle" text="The site includes the product story around alarms and recovery without pretending those iOS-only features run in a browser." />
        </div>
      </section>

      <section className="split-band" id="nutrition">
        <div>
          <SectionTitle
            icon={Utensils}
            label="Nutrition"
            title="Macros, meals, and progress in one account"
            text="PowAI brings your plan, macro targets, body weight, lift history, and nutrition progress into one clear account experience."
          />
          <div className="check-list">
            <span><CheckCircle2 size={18} /> Smart food estimates for quick macro logging</span>
            <span><CheckCircle2 size={18} /> Daily macro targets from the user profile</span>
            <span><CheckCircle2 size={18} /> Lift and weight charts ready for logged-in accounts</span>
          </div>
        </div>
        <div className="nutrition-visual">
          <img src="/body-type.jpeg" alt="PowAI body type onboarding visual" />
          <div className="visual-caption">
            <strong>Onboarding context</strong>
            <span>Body type, goal, location, level, and schedule shape each plan.</span>
          </div>
        </div>
      </section>

      <section className="access-band" id="access">
        <div className="access-copy">
          <SectionTitle
            icon={LockKeyhole}
            label="Try it"
            title="Create your PowAI profile"
            text="Log in with an existing PowAI account or create a trial profile to generate your first plan."
          />
          {notice ? <p className="notice">{notice}</p> : null}
        </div>
        <div className="auth-panel">
          <div className="segmented" role="tablist" aria-label="Authentication mode">
            <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')} type="button">
              Login
            </button>
            <button className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')} type="button">
              Register
            </button>
            <button className={authMode === 'admin' ? 'active' : ''} onClick={() => setAuthMode('admin')} type="button">
              Admin setup
            </button>
          </div>
          {authMode === 'login' ? <LoginForm onLogin={onLogin} /> : null}
          {authMode === 'register' ? <RegisterForm setAuthMode={setAuthMode} /> : null}
          {authMode === 'admin' ? <AdminRegisterForm onLogin={onLogin} /> : null}
        </div>
      </section>

      <PrivacySection />

      <section className="support-band" id="support">
        <SectionTitle
          icon={LifeBuoy}
          label="Support"
          title="Questions, feedback, or account help"
          text="Send a note and the PowAI team can follow up with you."
        />
        <SupportForm status={supportStatus} setStatus={setSupportStatus} />
      </section>

      <footer className="site-footer">
        <span>PowAI for focused training</span>
        <a href="#privacy">Privacy Policy</a>
      </footer>
    </main>
  )
}

function AdminRegisterForm({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '', verificationCode: '' })
  const [status, setStatus] = useState('')
  const [requesting, setRequesting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function requestCode() {
    setRequesting(true)
    setStatus('')
    try {
      await api('admin/request-code', { method: 'POST', body: { email: form.email } })
      setStatus('Verification code sent to PowAI support.')
    } catch (error) {
      setStatus(error.message || 'Could not send verification code.')
    } finally {
      setRequesting(false)
    }
  }

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setStatus('')
    try {
      const response = await api('admin/register', { method: 'POST', body: form })
      onLogin(response)
    } catch (error) {
      setStatus(error.message || 'Admin registration failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const success = status.includes('sent')

  return (
    <form className="form-stack" onSubmit={submit}>
      <p className="form-helper">
        Initial setup only. Existing administrators should use the Login tab with their normal email and password.
      </p>
      <Field label="Admin email" type="email" value={form.email} onChange={(value) => update('email', value)} required />
      <Field label="Password" type="password" value={form.password} onChange={(value) => update('password', value)} minLength="10" maxLength="128" required />
      <div className="form-grid two">
        <Field label="Verification code" value={form.verificationCode} onChange={(value) => update('verificationCode', value)} inputMode="numeric" maxLength="6" minLength="6" pattern="[0-9]{6}" required />
        <button className="secondary-action wide" disabled={requesting || !form.email} onClick={requestCode} type="button">
          {requesting ? <Loader2 className="spin" size={18} /> : <Mail size={18} />}
          Send code
        </button>
      </div>
      {status ? <p className={`form-status ${success ? 'success' : 'error'}`}>{status}</p> : null}
      <button className="primary-action wide" disabled={submitting} type="submit">
        {submitting ? <Loader2 className="spin" size={18} /> : <ShieldCheck size={18} />}
        Create admin account
      </button>
    </form>
  )
}

function LoginForm({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setStatus('')
    try {
      const response = await api('login', { method: 'POST', body: form })
      onLogin(response)
    } catch (error) {
      setStatus(error.message || 'Login failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <Field label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} required />
      <Field label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} maxLength="128" required />
      {status ? <p className="form-status error">{status}</p> : null}
      <button className="primary-action wide" disabled={submitting} type="submit">
        {submitting ? <Loader2 className="spin" size={18} /> : <LockKeyhole size={18} />}
        Sign in
      </button>
    </form>
  )
}

function RegisterForm({ setAuthMode }) {
  const [form, setForm] = useState(registerDefaults)
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setStatus('')
    try {
      await api('ai/register', {
        method: 'POST',
        body: {
          ...form,
          age: Number(form.age),
          weight: Number(form.weight),
          height: Number(form.height),
          heightFt: Number(form.heightFt),
          heightIn: Number(form.heightIn),
          numDays: Number(form.numDays),
          numHours: String(form.numHours),
        },
        timeout: 90000,
      })
      setStatus('Account created. Log in to load your plan.')
      setAuthMode('login')
    } catch (error) {
      setStatus(error.message || 'Registration failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="form-grid two">
        <Field label="First name" value={form.firstName} onChange={(value) => update('firstName', value)} required />
        <Field label="Last name" value={form.lastName} onChange={(value) => update('lastName', value)} required />
      </div>
      <Field label="Email" type="email" value={form.email} onChange={(value) => update('email', value)} required />
      <Field label="Password" type="password" value={form.password} onChange={(value) => update('password', value)} minLength="10" maxLength="128" required />
      <div className="form-grid three">
        <Field label="Age" type="number" value={form.age} onChange={(value) => update('age', value)} required />
        <SelectField label="Gender" value={form.gender} onChange={(value) => update('gender', value)} options={['Male', 'Female', 'Other']} />
        <SelectField label="Level" value={form.level} onChange={(value) => update('level', value)} options={['Beginner', 'Medium', 'Expert']} />
      </div>
      <div className="form-grid three">
        <Field label="Weight" type="number" value={form.weight} onChange={(value) => update('weight', value)} required />
        <SelectField label="Weight unit" value={form.weightUnit} onChange={(value) => update('weightUnit', value)} options={['lb', 'kg']} />
        <SelectField label="Body type" value={form.bodyStructure} onChange={(value) => update('bodyStructure', value)} options={['Ectomorph', 'Mesomorph', 'Endomorph']} />
      </div>
      <div className="form-grid three">
        <Field label="Height ft" type="number" value={form.heightFt} onChange={(value) => update('heightFt', value)} required />
        <Field label="Height in" type="number" value={form.heightIn} onChange={(value) => update('heightIn', value)} required />
        <SelectField label="Location" value={form.whereWork} onChange={(value) => update('whereWork', value)} options={['Gym', 'Home', 'Park']} />
      </div>
      <div className="form-grid three">
        <SelectField label="Goal" value={form.goal} onChange={(value) => update('goal', value)} options={['Build muscle', 'Lose weight', 'Improve endurance', 'Get stronger']} />
        <Field label="Days/week" type="number" value={form.numDays} onChange={(value) => update('numDays', value)} required />
        <Field label="Hours/session" value={form.numHours} onChange={(value) => update('numHours', value)} required />
      </div>
      {status ? <p className={`form-status ${status.includes('created') ? 'success' : 'error'}`}>{status}</p> : null}
      <button className="primary-action wide" disabled={submitting} type="submit">
        {submitting ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
        Create AI plan
      </button>
    </form>
  )
}

function SupportForm({ status, setStatus }) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setStatus('')
    try {
      await api('support/ticket', { method: 'POST', body: form })
      setForm({ name: '', email: '', subject: '', message: '' })
      setStatus('Ticket sent.')
    } catch (error) {
      setStatus(error.message || 'Could not send ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  return (
    <form className="support-form" onSubmit={submit}>
      <div className="form-grid two">
        <Field label="Name" value={form.name} onChange={(value) => update('name', value)} maxLength="100" required />
        <Field label="Email" type="email" value={form.email} onChange={(value) => update('email', value)} required />
      </div>
      <Field label="Subject" value={form.subject} onChange={(value) => update('subject', value)} maxLength="200" required />
      <label className="field">
        <span>Message</span>
        <textarea value={form.message} onChange={(event) => update('message', event.target.value)} maxLength="5000" rows="5" required />
      </label>
      {status ? <p className={`form-status ${status.includes('sent') ? 'success' : 'error'}`}>{status}</p> : null}
      <button className="primary-action wide" disabled={submitting} type="submit">
        {submitting ? <Loader2 className="spin" size={18} /> : <MessageSquare size={18} />}
        Send support ticket
      </button>
    </form>
  )
}

function PrivacySection() {
  return (
    <section className="privacy-band" id="privacy">
      <SectionTitle
        icon={ShieldCheck}
        label="Privacy"
        title="PowAI Privacy Policy"
        text="Last updated June 23, 2026. PowAI uses personal data to provide training, nutrition, progress, reminders, social features, account support, and app safety."
      />

      <div className="privacy-grid">
        <article className="privacy-card large">
          <h3>Data PowAI May Collect</h3>
          <p>
            Depending on the features you use, PowAI may collect account details, profile and
            onboarding answers, workout plans, exercise logs, set weights, body weight history,
            nutrition targets, food entries, barcode or food-photo analysis inputs, favorite foods,
            meal ideas, alarm and schedule preferences, friend connections, shared workout activity,
            challenge activity, support requests, notification tokens, and basic device or app data
            needed to operate the service.
          </p>
        </article>

        <article className="privacy-card">
          <h3>Health and Fitness</h3>
          <p>
            Workout, weight, calorie, macro, and optional heart-rate-related information is used to
            personalize plans, display progress, support workout sessions, and improve your fitness
            experience. PowAI does not sell health or fitness data.
          </p>
        </article>

        <article className="privacy-card">
          <h3>Food and Photos</h3>
          <p>
            Food text, serving details, barcode lookups, and food photos may be processed to estimate
            calories, protein, carbohydrates, sugars, and meal details. Only submit photos you want
            analyzed for nutrition.
          </p>
        </article>

        <article className="privacy-card">
          <h3>Social Features</h3>
          <p>
            If you use friend, sharing, or challenge features, PowAI may process friend requests,
            connections, shared items, challenge participation, and workout activity needed to show
            those features.
          </p>
        </article>

        <article className="privacy-card">
          <h3>Reminders and Notifications</h3>
          <p>
            Alarm settings, schedule preferences, recurrence details, reminder choices, and push
            notification tokens may be used to send workout, alarm, recovery, or account-related
            notifications.
          </p>
        </article>

        <article className="privacy-card">
          <h3>Third-Party Services</h3>
          <p>
            PowAI may use service providers for AI generation and analysis, email delivery, barcode
            nutrition information, Apple platform services, push notifications, hosting, storage,
            security, and app operations. These providers process data only as needed to support the
            requested feature or operate the service.
          </p>
        </article>

        <article className="privacy-card">
          <h3>How Data Is Used</h3>
          <p>
            Data is used for app functionality, personalization, account authentication, customer
            support, safety, debugging, service reliability, and legal compliance. PowAI is not
            designed to track users across other companies' apps or websites for advertising.
          </p>
        </article>

        <article className="privacy-card">
          <h3>Your Choices</h3>
          <p>
            You can update profile information in the app, choose which optional permissions to grant,
            manage notifications in iOS settings, and request account deletion or support help through
            the app or this website.
          </p>
        </article>

        <article className="privacy-card">
          <h3>Retention and Deletion</h3>
          <p>
            PowAI keeps account data while your account is active or as needed to provide the service.
            When you delete your account, PowAI deletes account-related app data from active service
            systems, except where limited retention is required for security, troubleshooting, legal,
            or backup purposes.
          </p>
        </article>
      </div>

      <div className="privacy-summary">
        <h3>App Privacy Summary</h3>
        <div className="privacy-list">
          <span><strong>Data linked to you:</strong> contact info, account identifiers, profile details, fitness and workout data, nutrition and food data, body weight, social activity, schedule/reminder data, support messages, and notification/device identifiers.</span>
          <span><strong>Possible sensitive data:</strong> health and fitness information, food photos or user-provided images, and optional heart-rate-related workout information when enabled.</span>
          <span><strong>Primary purposes:</strong> app functionality, personalization, account management, notifications, customer support, safety, and service improvement.</span>
          <span><strong>Tracking:</strong> PowAI does not sell personal data and is not designed to track users across third-party apps or websites for advertising.</span>
        </div>
      </div>
    </section>
  )
}

function AuthenticatedApp({
  activePage,
  adminData,
  drawerOpen,
  liftHistory,
  loading,
  nutrition,
  onRefresh,
  onSignOut,
  plan,
  setActivePage,
  setDrawerOpen,
  token,
  user,
  weights,
}) {
  const nav = [
    ['dashboard', BarChart3, 'Dashboard'],
    ['workouts', Dumbbell, 'Workouts'],
    ['nutrition', Utensils, 'Nutrition'],
    ['progress', Scale, 'Progress'],
  ]
  const visibleNav = user?.isAdmin ? [['admin', ShieldCheck, 'Admin']] : nav

  return (
    <main className="app-shell">
      <aside className={`sidebar ${drawerOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/powai-app-icon.png" alt="" />
          <div>
            <strong>PowAI</strong>
            <span>{user?.email || 'PowAI account'}</span>
          </div>
          <button className="icon-button close-drawer" onClick={() => setDrawerOpen(false)} type="button" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <nav className="side-nav" aria-label="App navigation">
          {visibleNav.map(([key, Icon, label]) => (
            <button
              className={activePage === key ? 'active' : ''}
              key={key}
              onClick={() => {
                setActivePage(key)
                setDrawerOpen(false)
              }}
              type="button"
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="secondary-action wide" onClick={onRefresh} disabled={loading} type="button">
            <RefreshCcw size={17} />
            Refresh
          </button>
          <button className="logout-button" onClick={onSignOut} type="button">
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="workspace-header">
          <button className="icon-button menu-button" onClick={() => setDrawerOpen(true)} type="button" aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div>
            <span>{user?.isAdmin ? 'Admin access' : 'Account synced'}</span>
            <h2>{pageTitle(activePage)}</h2>
          </div>
          <button className="secondary-action" onClick={onRefresh} disabled={loading} type="button">
            {loading ? <Loader2 className="spin" size={17} /> : <RefreshCcw size={17} />}
            Refresh
          </button>
        </header>

        {loading ? <LoadingPanel /> : null}
        {!loading && activePage === 'dashboard' ? <Dashboard user={user} plan={plan} weights={weights} nutrition={nutrition} liftHistory={liftHistory} /> : null}
        {!loading && activePage === 'admin' ? (
          <AdminPage
            currentUserID={user?.id}
            data={adminData}
            onRefresh={onRefresh}
            onSignOut={onSignOut}
            token={token}
          />
        ) : null}
        {!loading && activePage === 'workouts' ? <WorkoutPage plan={plan} /> : null}
        {!loading && activePage === 'nutrition' ? <NutritionPage user={user} nutrition={nutrition} /> : null}
        {!loading && activePage === 'progress' ? <ProgressPage weights={weights} liftHistory={liftHistory} /> : null}
      </section>
    </main>
  )
}

function AdminPage({ currentUserID, data, onRefresh, onSignOut, token }) {
  const [deleteStatus, setDeleteStatus] = useState('')
  const [deletingKey, setDeletingKey] = useState('')
  const [adminTab, setAdminTab] = useState('overview')
  const [selectedUserID, setSelectedUserID] = useState('')
  const [userDetail, setUserDetail] = useState(null)
  const [workoutJson, setWorkoutJson] = useState('')
  const [routineJson, setRoutineJson] = useState('')
  const [accessForm, setAccessForm] = useState({
    membershipStatus: 'active',
    membershipPlan: '',
    membershipExpiresAt: '',
    isAdmin: false,
  })
  const [imageRows, setImageRows] = useState([])
  const [imageTotal, setImageTotal] = useState(0)
  const [imageHasMore, setImageHasMore] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [imageForm, setImageForm] = useState({ exerciseName: '', muscleCategory: '' })
  const [exerciseForm, setExerciseForm] = useState({
    exerciseName: '',
    muscleCategory: '',
    muscle: '',
    expectedCaloriesBurned: 50,
    descriptionEnglish: '',
    descriptionSpanish: '',
    generateImage: true,
  })

  const metrics = data?.metrics || {}
  const users = Array.isArray(data?.users) ? data.users : []
  const tickets = Array.isArray(data?.supportTickets) ? data.supportTickets : []
  const crashes = Array.isArray(data?.crashReports) ? data.crashReports : []
  const emails = Array.isArray(data?.emailLogs) ? data.emailLogs : []
  const exercises = Array.isArray(data?.exercises) ? data.exercises : []
  const selectedUser = userDetail?.user || null
  const selectedWorkoutPlan = parseTrainingJSON(workoutJson)
  const selectedRoutinePlan = parseTrainingJSON(routineJson)
  const selectedWorkoutDays = selectedWorkoutPlan.workout_plan || []
  const selectedRoutineDays = selectedRoutinePlan.workout_plan || []

  useEffect(() => {
    if (data && adminTab === 'exercises' && !imageRows.length && !imageLoading) {
      loadImagePage(0, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminTab])

  if (!data) {
    return (
      <section className="loading-panel">
        <ShieldCheck size={28} />
        <h3>Admin data unavailable</h3>
        <p>Refresh the workspace after signing in with an admin account.</p>
      </section>
    )
  }

  async function loadImagePage(offset = 0, replace = false) {
    setImageLoading(true)
    setDeleteStatus('')
    try {
      const page = await api(`admin/exercise-images?limit=10&offset=${offset}`, { token })
      const nextItems = Array.isArray(page?.items) ? page.items : []
      setImageRows((current) => (replace ? nextItems : [...current, ...nextItems]))
      setImageTotal(page?.total ?? nextItems.length)
      setImageHasMore(Boolean(page?.hasMore))
    } catch (error) {
      setDeleteStatus(error.message || 'Could not load exercise images.')
    } finally {
      setImageLoading(false)
    }
  }

  async function loadUserDetail(userID) {
    if (!userID) return
    setSelectedUserID(userID)
    setDeletingKey(`user-load-${userID}`)
    setDeleteStatus('')
    try {
      const detail = await api(`admin/users/${userID}`, { token })
      setUserDetail(detail)
      setWorkoutJson(JSON.stringify(detail?.training?.userExcersises || { workout_plan: [] }, null, 2))
      setRoutineJson(detail?.routine?.routineTraining ? JSON.stringify(detail.routine.routineTraining, null, 2) : '')
      setAccessForm(accessFormForUser(detail?.user))
      setAdminTab('users')
    } catch (error) {
      setDeleteStatus(error.message || 'Could not load user details.')
    } finally {
      setDeletingKey('')
    }
  }

  async function saveUserWorkout() {
    if (!selectedUserID) return
    setDeletingKey('user-workout-save')
    setDeleteStatus('')
    try {
      const parsed = JSON.parse(workoutJson)
      const training = await api(`admin/users/${selectedUserID}/workout`, {
        method: 'PUT',
        token,
        body: { userExcersises: parsed },
        timeout: 90000,
      })
      setWorkoutJson(JSON.stringify(training?.userExcersises || parsed, null, 2))
      setDeleteStatus('User workout saved.')
      await onRefresh()
    } catch (error) {
      setDeleteStatus(error.message || 'Could not save user workout.')
    } finally {
      setDeletingKey('')
    }
  }

  async function saveUserRoutine() {
    if (!selectedUserID) return
    setDeletingKey('user-routine-save')
    setDeleteStatus('')
    try {
      const parsed = JSON.parse(routineJson)
      const routine = await api(`admin/users/${selectedUserID}/routine`, {
        method: 'PUT',
        token,
        body: { routineTraining: parsed },
      })
      setRoutineJson(JSON.stringify(routine?.routineTraining || parsed, null, 2))
      setDeleteStatus('User routine saved.')
      await onRefresh()
    } catch (error) {
      setDeleteStatus(error.message || 'Could not save user routine.')
    } finally {
      setDeletingKey('')
    }
  }

  function editTrainingPlan(kind, mutator) {
    const currentJson = kind === 'routine' ? routineJson : workoutJson
    const setter = kind === 'routine' ? setRoutineJson : setWorkoutJson
    const emptyPlan = { workout_plan: [] }

    try {
      const parsed = currentJson ? JSON.parse(currentJson) : emptyPlan
      const next = JSON.parse(JSON.stringify({
        ...emptyPlan,
        ...parsed,
        workout_plan: Array.isArray(parsed.workout_plan) ? parsed.workout_plan : [],
      }))
      mutator(next.workout_plan)
      setter(JSON.stringify(next, null, 2))
      setDeleteStatus(`Unsaved ${kind} changes.`)
    } catch {
      setDeleteStatus(`Fix the ${kind} JSON before using visual edits.`)
    }
  }

  function addTrainingDay(kind) {
    editTrainingPlan(kind, (days) => {
      const nextDay = days.reduce((max, day) => Math.max(max, Number(day.day) || 0), 0) + 1
      days.push({ day: nextDay, muscle_group: 'New day', exercises: [] })
    })
  }

  function deleteTrainingDay(kind, dayIndex) {
    if (!window.confirm('Delete this day?')) return
    editTrainingPlan(kind, (days) => {
      days.splice(dayIndex, 1)
    })
  }

  function updateTrainingDay(kind, dayIndex, key, value) {
    editTrainingPlan(kind, (days) => {
      days[dayIndex] = { ...days[dayIndex], [key]: key === 'day' ? Number(value) : value }
    })
  }

  function addTrainingExercise(kind, dayIndex) {
    editTrainingPlan(kind, (days) => {
      const exercisesForDay = Array.isArray(days[dayIndex]?.exercises) ? days[dayIndex].exercises : []
      const exercise = {
        name: 'New exercise',
        reps: '8-12',
        sets: 3,
        calories_burned: 50,
        loggedSets: [],
      }
      if (kind === 'routine') {
        exercise.weight = 0
        exercise.unit = 'lb'
      }
      days[dayIndex].exercises = [...exercisesForDay, exercise]
    })
  }

  function deleteTrainingExercise(kind, dayIndex, exerciseIndex) {
    if (!window.confirm('Delete this exercise?')) return
    editTrainingPlan(kind, (days) => {
      const exercisesForDay = Array.isArray(days[dayIndex]?.exercises) ? days[dayIndex].exercises : []
      exercisesForDay.splice(exerciseIndex, 1)
      days[dayIndex].exercises = exercisesForDay
    })
  }

  function updateTrainingExercise(kind, dayIndex, exerciseIndex, key, value) {
    editTrainingPlan(kind, (days) => {
      const exercisesForDay = Array.isArray(days[dayIndex]?.exercises) ? days[dayIndex].exercises : []
      const numericKeys = new Set(['sets', 'calories_burned', 'weight'])
      exercisesForDay[exerciseIndex] = {
        ...exercisesForDay[exerciseIndex],
        [key]: numericKeys.has(key) ? Number(value) : value,
      }
      days[dayIndex].exercises = exercisesForDay
    })
  }

  async function deleteSelectedUser() {
    if (!selectedUserID || !userDetail?.user) return
    const email = userDetail.user.email || 'this user'
    if (!window.confirm(`Delete ${email} and all account data? This cannot be undone.`)) return

    setDeletingKey('user-delete')
    setDeleteStatus('')
    try {
      await api(`admin/users/${selectedUserID}`, { method: 'DELETE', token })
      setSelectedUserID('')
      setUserDetail(null)
      setWorkoutJson('')
      setRoutineJson('')
      setDeleteStatus('User account deleted.')
      await onRefresh()
    } catch (error) {
      setDeleteStatus(error.message || 'Could not delete user account.')
    } finally {
      setDeletingKey('')
    }
  }

  async function updateUserAccess(event) {
    event.preventDefault()
    if (!selectedUserID || !selectedUser) return

    const isCurrentUser = selectedUserID === currentUserID
    const roleChanged = accessForm.isAdmin !== Boolean(selectedUser.isAdmin)
    const action = roleChanged ? (accessForm.isAdmin ? 'grant administrator access' : 'remove administrator access') : 'update account access'
    const sessionWarning = isCurrentUser ? ' This will sign you out because the backend revokes sessions after access changes.' : ''
    if (!window.confirm(`Are you sure you want to ${action} for ${selectedUser.email || 'this user'}?${sessionWarning}`)) return

    setDeletingKey('user-access-save')
    setDeleteStatus('')
    try {
      const body = {
        membershipStatus: accessForm.membershipStatus,
        membershipPlan: accessForm.membershipPlan.trim() || selectedUser.membershipPlan || undefined,
        membershipExpiresAt: accessForm.membershipExpiresAt ? new Date(accessForm.membershipExpiresAt).toISOString() : undefined,
        isAdmin: accessForm.isAdmin,
      }
      const updated = await api(`admin/users/${selectedUserID}/access`, {
        method: 'PUT',
        token,
        body,
      })
      setUserDetail((current) => current ? { ...current, user: { ...current.user, ...updated } } : current)
      setAccessForm(accessFormForUser({ ...selectedUser, ...updated }))

      if (isCurrentUser) {
        await onSignOut()
        return
      }

      setDeleteStatus('User access saved and existing sessions revoked.')
      await onRefresh()
    } catch (error) {
      setDeleteStatus(error.message || 'Could not update user access.')
    } finally {
      setDeletingKey('')
    }
  }

  async function revokeUserSessions() {
    if (!selectedUserID || !selectedUser) return
    const isCurrentUser = selectedUserID === currentUserID
    if (!window.confirm(`Revoke every session for ${selectedUser.email || 'this user'}?${isCurrentUser ? ' You will be signed out.' : ''}`)) return

    setDeletingKey('user-sessions-revoke')
    setDeleteStatus('')
    try {
      await api(`admin/users/${selectedUserID}/revoke-sessions`, { method: 'POST', token })
      if (isCurrentUser) {
        await onSignOut()
        return
      }
      setDeleteStatus('All user sessions revoked.')
    } catch (error) {
      setDeleteStatus(error.message || 'Could not revoke user sessions.')
    } finally {
      setDeletingKey('')
    }
  }

  async function deleteAdminRecord(type, id) {
    if (!id) return
    const label = type === 'crash' ? 'crash report' : 'email log'
    if (!window.confirm(`Delete this ${label}?`)) return

    const path = type === 'crash' ? `admin/crash-reports/${id}` : `admin/email-logs/${id}`
    const key = `${type}-${id}`
    setDeletingKey(key)
    setDeleteStatus('')
    try {
      await api(path, { method: 'DELETE', token })
      setDeleteStatus(`${label[0].toUpperCase()}${label.slice(1)} deleted.`)
      await onRefresh()
    } catch (error) {
      setDeleteStatus(error.message || `Could not delete ${label}.`)
    } finally {
      setDeletingKey('')
    }
  }

  async function deleteAllAdminRecords(type) {
    const label = type === 'crash' ? 'crash reports' : 'email logs'
    const count = type === 'crash' ? crashes.length : emails.length
    if (!count) return
    if (!window.confirm(`Delete all ${label}? This cannot be undone.`)) return

    const path = type === 'crash' ? 'admin/crash-reports' : 'admin/email-logs'
    setDeletingKey(`${type}-all`)
    setDeleteStatus('')
    try {
      await api(path, { method: 'DELETE', token })
      setDeleteStatus(`All ${label} deleted.`)
      await onRefresh()
    } catch (error) {
      setDeleteStatus(error.message || `Could not delete all ${label}.`)
    } finally {
      setDeletingKey('')
    }
  }

  async function deleteExerciseImage(id) {
    if (!id || !window.confirm('Delete this exercise image?')) return

    setDeletingKey(`image-${id}`)
    setDeleteStatus('')
    try {
      await api(`admin/exercise-images/${id}`, { method: 'DELETE', token })
      setDeleteStatus('Exercise image deleted.')
      await loadImagePage(0, true)
      await onRefresh()
    } catch (error) {
      setDeleteStatus(error.message || 'Could not delete exercise image.')
    } finally {
      setDeletingKey('')
    }
  }

  async function regenerateExerciseImage(event) {
    event.preventDefault()
    setDeletingKey('image-regenerate')
    setDeleteStatus('')
    try {
      await api('admin/exercise-images/regenerate', {
        method: 'POST',
        token,
        body: {
          exerciseName: imageForm.exerciseName,
          muscleCategory: imageForm.muscleCategory || null,
        },
        timeout: 90000,
      })
      setDeleteStatus('Exercise image regenerated.')
      setImageForm({ exerciseName: '', muscleCategory: '' })
      await loadImagePage(0, true)
      await onRefresh()
    } catch (error) {
      setDeleteStatus(error.message || 'Could not regenerate exercise image.')
    } finally {
      setDeletingKey('')
    }
  }

  async function createCustomExercise(event) {
    event.preventDefault()
    setDeletingKey('exercise-create')
    setDeleteStatus('')
    try {
      await api('admin/exercises', {
        method: 'POST',
        token,
        body: {
          ...exerciseForm,
          expectedCaloriesBurned: Number(exerciseForm.expectedCaloriesBurned),
        },
        timeout: 90000,
      })
      setExerciseForm({
        exerciseName: '',
        muscleCategory: '',
        muscle: '',
        expectedCaloriesBurned: 50,
        descriptionEnglish: '',
        descriptionSpanish: '',
        generateImage: true,
      })
      setDeleteStatus('Custom exercise created.')
      if (exerciseForm.generateImage) await loadImagePage(0, true)
      await onRefresh()
    } catch (error) {
      setDeleteStatus(error.message || 'Could not create custom exercise.')
    } finally {
      setDeletingKey('')
    }
  }

  return (
    <div className="workspace-grid">
      <section className="summary-panel wide-panel">
        <div>
          <p className="eyebrow">Admin console</p>
          <h3>PowAI operations</h3>
          <p>Users, support messages, crash reports, and outbound email activity from the backend.</p>
        </div>
        <div className="hero-metrics">
          <MetricPill label="Users" value={metrics.users ?? users.length} />
          <MetricPill label="Crashes" value={metrics.crashReports ?? crashes.length} />
          <MetricPill label="Emails" value={metrics.emails ?? emails.length} />
        </div>
      </section>

      <StatCard icon={Users} label="Admin users" value={metrics.admins ?? '--'} detail="Accounts with admin privileges" />
      <StatCard icon={LifeBuoy} label="Tickets" value={metrics.supportTickets ?? tickets.length} detail="Support tickets received" />
      <StatCard icon={Activity} label="Crash reports" value={metrics.crashReports ?? crashes.length} detail="Runtime and client reports" />
      <StatCard icon={Mail} label="Emails sent" value={metrics.emails ?? emails.length} detail="Logged outbound emails" />
      <StatCard icon={Image} label="Exercise images" value={metrics.exerciseImages ?? imageTotal} detail="Generated training images" />
      <StatCard icon={Dumbbell} label="Exercises" value={metrics.exercises ?? exercises.length} detail="Exercise library entries" />

      {deleteStatus ? (
        <section className={`admin-status form-status ${deleteStatus.includes('deleted') || deleteStatus.includes('created') || deleteStatus.includes('regenerated') || deleteStatus.includes('saved') || deleteStatus.includes('Unsaved') ? 'success' : 'error'}`}>
          {deleteStatus}
        </section>
      ) : null}

      <section className="admin-tabs wide-panel" aria-label="Admin sections">
        <button className={adminTab === 'overview' ? 'active' : ''} onClick={() => setAdminTab('overview')} type="button">
          <BarChart3 size={17} />
          Overview
        </button>
        <button className={adminTab === 'users' ? 'active' : ''} onClick={() => setAdminTab('users')} type="button">
          <Users size={17} />
          Users
        </button>
        <button className={adminTab === 'exercises' ? 'active' : ''} onClick={() => setAdminTab('exercises')} type="button">
          <Dumbbell size={17} />
          Exercises
        </button>
      </section>

      {adminTab === 'overview' ? (
        <>
      <section className="data-panel">
        <PanelHeader icon={Users} title="Users" subtitle={`${users.length} accounts`} />
        <Rows
          empty="No users returned yet."
          rows={users.slice(0, 12).map((entry) => ({
            title: entry.email || 'No email',
            meta: `${entry.firstName || 'PowAI'} ${entry.lastName || 'user'} · ${entry.membershipStatus || 'unknown'}`,
            value: entry.isAdmin ? 'Admin' : entry.membershipPlan || 'User',
          }))}
        />
      </section>

      <section className="data-panel">
        <PanelHeader icon={LifeBuoy} title="Support tickets" subtitle={`${tickets.length} latest`} />
        <Rows
          empty="No support tickets returned yet."
          rows={tickets.slice(0, 10).map((entry) => ({
            title: entry.subject || 'Support ticket',
            meta: `${entry.email || 'No email'} · ${formatDate(entry.createdAt)}`,
            value: entry.name || 'User',
          }))}
        />
      </section>

      <section className="data-panel">
        <div className="admin-panel-heading">
          <PanelHeader icon={Activity} title="Crash reports" subtitle={`${crashes.length} latest`} />
          <button
            className="secondary-action danger-action"
            disabled={!crashes.length || deletingKey === 'crash-all'}
            onClick={() => deleteAllAdminRecords('crash')}
            type="button"
          >
            {deletingKey === 'crash-all' ? <Loader2 className="spin" size={17} /> : <Trash2 size={17} />}
            Delete all
          </button>
        </div>
        <AdminRows
          empty="No crash reports returned yet."
          rows={crashes.slice(0, 10).map((entry) => ({
            id: entry.id,
            title: entry.subject || entry.source || 'Crash report',
            meta: `${entry.email || 'No user email'} · ${entry.path || entry.source || 'client'} · ${formatDate(entry.createdAt)}`,
            value: entry.statusCode || entry.method || 'Report',
            deleting: deletingKey === `crash-${entry.id}`,
            onDelete: () => deleteAdminRecord('crash', entry.id),
          }))}
        />
      </section>

      <section className="data-panel">
        <div className="admin-panel-heading">
          <PanelHeader icon={Mail} title="Email logs" subtitle={`${emails.length} latest`} />
          <button
            className="secondary-action danger-action"
            disabled={!emails.length || deletingKey === 'email-all'}
            onClick={() => deleteAllAdminRecords('email')}
            type="button"
          >
            {deletingKey === 'email-all' ? <Loader2 className="spin" size={17} /> : <Trash2 size={17} />}
            Delete all
          </button>
        </div>
        <AdminRows
          empty="No email logs returned yet."
          rows={emails.slice(0, 10).map((entry) => ({
            id: entry.id,
            title: entry.subject || 'Email',
            meta: `${entry.recipient || 'recipient'} · ${formatDate(entry.createdAt)}`,
            value: entry.status || 'sent',
            deleting: deletingKey === `email-${entry.id}`,
            onDelete: () => deleteAdminRecord('email', entry.id),
          }))}
        />
      </section>
        </>
      ) : null}

      {adminTab === 'users' ? (
        <>
          <section className="data-panel">
            <PanelHeader icon={Users} title="Manage users" subtitle={`${users.length} accounts`} />
            <div className="rows">
              {users.map((entry) => (
                <div className="history-row admin-row" key={entry.id || entry.email}>
                  <div>
                    <strong>{entry.email || 'No email'}</strong>
                    <small>{entry.firstName || 'PowAI'} {entry.lastName || 'user'} · {entry.membershipStatus || 'unknown'}</small>
                  </div>
                  <b>{entry.isAdmin ? 'Admin' : entry.membershipPlan || 'User'}</b>
                  <button
                    className="secondary-action"
                    disabled={!entry.id || deletingKey === `user-load-${entry.id}`}
                    onClick={() => loadUserDetail(entry.id)}
                    type="button"
                  >
                    {deletingKey === `user-load-${entry.id}` ? <Loader2 className="spin" size={17} /> : <Users size={17} />}
                    Manage
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="data-panel">
            <PanelHeader icon={ShieldCheck} title="User profile" subtitle={selectedUser?.email || 'Select a user'} />
            {selectedUser ? (
              <div className="admin-detail-stack">
                <div className="admin-profile-hero">
                  <div>
                    <strong>{selectedUser.firstName || 'PowAI'} {selectedUser.lastName || 'user'}</strong>
                    <span>{selectedUser.email || 'No email'}</span>
                  </div>
                  <b>{selectedUser.isAdmin ? 'Admin' : selectedUser.membershipStatus || 'User'}</b>
                </div>
                <div className="admin-info-grid">
                  <InfoItem label="Goal" value={selectedUser.goal} />
                  <InfoItem label="Gender" value={selectedUser.gender} />
                  <InfoItem label="Age" value={selectedUser.age} />
                  <InfoItem label="Weight" value={selectedUser.weight} />
                  <InfoItem label="Body type" value={selectedUser.bodyStructure} />
                  <InfoItem label="Height" value={formatHeight(selectedUser)} />
                  <InfoItem label="Days/week" value={selectedUser.numDays} />
                  <InfoItem label="Hours/session" value={selectedUser.numHours} />
                </div>
                <div className="admin-info-grid">
                  <InfoItem label="Calories" value={selectedUser.dailyCalories} />
                  <InfoItem label="Protein" value={selectedUser.dailyProtein ? `${selectedUser.dailyProtein}g` : ''} />
                  <InfoItem label="Carbs" value={selectedUser.carbs ? `${selectedUser.carbs}g` : ''} />
                  <InfoItem label="Sugars" value={selectedUser.sugars ? `${selectedUser.sugars}g` : ''} />
                  <InfoItem label="Burn target" value={selectedUser.burnCalories} />
                  <InfoItem label="Water" value={selectedUser.water ? `${selectedUser.water}L` : ''} />
                </div>
                <div className="admin-info-grid">
                  <InfoItem label="Plan" value={selectedUser.membershipPlan} />
                  <InfoItem label="Platform" value={selectedUser.membershipPlatform} />
                  <InfoItem label="Started" value={formatDate(selectedUser.membershipStartedAt)} />
                  <InfoItem label="Expires" value={formatDate(selectedUser.membershipExpiresAt)} />
                  <InfoItem label="APNS" value={selectedUser.hasAPNSToken ? 'Registered' : 'Missing'} />
                  <InfoItem label="APNS env" value={selectedUser.apnsEnvironment} />
                </div>
                <div className="admin-info-grid">
                  <InfoItem label="Apple product" value={selectedUser.appleProductID} />
                  <InfoItem label="Original transaction" value={selectedUser.appleOriginalTransactionID} />
                  <InfoItem label="Latest transaction" value={selectedUser.appleLatestTransactionID} />
                  <InfoItem label="Token updated" value={formatDate(selectedUser.apnsTokenUpdatedAt)} />
                </div>
              </div>
            ) : (
              <p className="empty-state">Select a user to see profile, membership, nutrition, and device data.</p>
            )}
          </section>

          <section className="data-panel">
            <PanelHeader icon={BarChart3} title="Training summary" subtitle={selectedUser?.email || 'Select a user'} />
            {selectedUser ? (
              <div className="admin-info-grid">
                <InfoItem label="Workout days" value={selectedWorkoutDays.length} />
                <InfoItem label="Workout exercises" value={selectedWorkoutDays.reduce((sum, day) => sum + (Array.isArray(day.exercises) ? day.exercises.length : 0), 0)} />
                <InfoItem label="Routine days" value={selectedRoutineDays.length} />
                <InfoItem label="Routine exercises" value={selectedRoutineDays.reduce((sum, day) => sum + (Array.isArray(day.exercises) ? day.exercises.length : 0), 0)} />
              </div>
            ) : (
              <p className="empty-state">Select a user to see workout and routine totals.</p>
            )}
          </section>

          <section className="data-panel">
            <PanelHeader
              icon={Dumbbell}
              title="Workout control"
              subtitle={userDetail?.user?.email || 'Select a user'}
            />
            {userDetail ? (
              <div className="form-stack">
                <TrainingPlanEditor
                  days={selectedWorkoutDays}
                  kind="workout"
                  onAddDay={() => addTrainingDay('workout')}
                  onAddExercise={(dayIndex) => addTrainingExercise('workout', dayIndex)}
                  onDeleteDay={(dayIndex) => deleteTrainingDay('workout', dayIndex)}
                  onDeleteExercise={(dayIndex, exerciseIndex) => deleteTrainingExercise('workout', dayIndex, exerciseIndex)}
                  onUpdateDay={(dayIndex, key, value) => updateTrainingDay('workout', dayIndex, key, value)}
                  onUpdateExercise={(dayIndex, exerciseIndex, key, value) => updateTrainingExercise('workout', dayIndex, exerciseIndex, key, value)}
                />
                <label className="field">
                  <span>Generated workout JSON</span>
                  <textarea className="code-editor" value={workoutJson} onChange={(event) => setWorkoutJson(event.target.value)} rows="14" />
                </label>
                <button className="primary-action wide" disabled={deletingKey === 'user-workout-save'} onClick={saveUserWorkout} type="button">
                  {deletingKey === 'user-workout-save' ? <Loader2 className="spin" size={17} /> : <Dumbbell size={17} />}
                  Save workout
                </button>
              </div>
            ) : (
              <p className="empty-state">Select a user to view and edit their workout.</p>
            )}
          </section>

          <section className="data-panel">
            <PanelHeader
              icon={TimerReset}
              title="Routine control"
              subtitle={userDetail?.routine ? 'Saved routine' : 'No routine loaded'}
            />
            {userDetail ? (
              <div className="form-stack">
                {routineJson ? (
                  <>
                    <TrainingPlanEditor
                      days={selectedRoutineDays}
                      kind="routine"
                      onAddDay={() => addTrainingDay('routine')}
                      onAddExercise={(dayIndex) => addTrainingExercise('routine', dayIndex)}
                      onDeleteDay={(dayIndex) => deleteTrainingDay('routine', dayIndex)}
                      onDeleteExercise={(dayIndex, exerciseIndex) => deleteTrainingExercise('routine', dayIndex, exerciseIndex)}
                      onUpdateDay={(dayIndex, key, value) => updateTrainingDay('routine', dayIndex, key, value)}
                      onUpdateExercise={(dayIndex, exerciseIndex, key, value) => updateTrainingExercise('routine', dayIndex, exerciseIndex, key, value)}
                    />
                    <label className="field">
                      <span>Routine JSON</span>
                      <textarea className="code-editor" value={routineJson} onChange={(event) => setRoutineJson(event.target.value)} rows="14" />
                    </label>
                    <button className="secondary-action wide" disabled={deletingKey === 'user-routine-save'} onClick={saveUserRoutine} type="button">
                      {deletingKey === 'user-routine-save' ? <Loader2 className="spin" size={17} /> : <TimerReset size={17} />}
                      Save routine
                    </button>
                  </>
                ) : (
                  <>
                    <p className="empty-state">No routine record was returned for this user.</p>
                    <button
                      className="secondary-action wide"
                      onClick={() => {
                        setRoutineJson(JSON.stringify({ workout_plan: [] }, null, 2))
                        setDeleteStatus('Unsaved routine changes.')
                      }}
                      type="button"
                    >
                      <Plus size={17} />
                      Create empty routine
                    </button>
                  </>
                )}
              </div>
            ) : (
              <p className="empty-state">Select a user to view and edit their routine.</p>
            )}
          </section>

          <section className="data-panel">
            <PanelHeader icon={ShieldCheck} title="Account access" subtitle={userDetail?.user?.email || 'Select a user'} />
            {userDetail ? (
              <form className="form-stack" onSubmit={updateUserAccess}>
                <Rows
                  empty="No user loaded."
                  rows={[
                    {
                      title: userDetail.user.email || 'No email',
                      meta: `${userDetail.user.firstName || 'PowAI'} ${userDetail.user.lastName || 'user'} · ${userDetail.user.membershipStatus || 'unknown'}`,
                      value: userDetail.user.isAdmin ? 'Admin' : 'User',
                    },
                  ]}
                />
                <div className="form-grid two">
                  <SelectField
                    label="Membership status"
                    value={accessForm.membershipStatus}
                    onChange={(membershipStatus) => setAccessForm({ ...accessForm, membershipStatus })}
                    options={['active', 'trial', 'expired', 'blocked', 'disabled', 'suspended', 'banned']}
                  />
                  <Field
                    label="Membership plan"
                    value={accessForm.membershipPlan}
                    onChange={(membershipPlan) => setAccessForm({ ...accessForm, membershipPlan })}
                    maxLength="80"
                  />
                </div>
                <Field
                  label="Membership expiration"
                  type="datetime-local"
                  value={accessForm.membershipExpiresAt}
                  onChange={(membershipExpiresAt) => setAccessForm({ ...accessForm, membershipExpiresAt })}
                />
                <label className="toggle-row">
                  <input
                    checked={accessForm.isAdmin}
                    onChange={(event) => setAccessForm({ ...accessForm, isAdmin: event.target.checked })}
                    type="checkbox"
                  />
                  <span>Administrator access</span>
                </label>
                <p className="form-helper">Saving access changes revokes this user&apos;s existing sessions.</p>
                <button className="primary-action wide" disabled={deletingKey === 'user-access-save'} type="submit">
                  {deletingKey === 'user-access-save' ? <Loader2 className="spin" size={17} /> : <ShieldCheck size={17} />}
                  Save account access
                </button>
                <button
                  className="secondary-action danger-action wide"
                  disabled={deletingKey === 'user-sessions-revoke'}
                  onClick={revokeUserSessions}
                  type="button"
                >
                  {deletingKey === 'user-sessions-revoke' ? <Loader2 className="spin" size={17} /> : <LogOut size={17} />}
                  Revoke all sessions
                </button>
                <button className="secondary-action danger-action wide" disabled={userDetail.user.isAdmin || deletingKey === 'user-delete'} onClick={deleteSelectedUser} type="button">
                  {deletingKey === 'user-delete' ? <Loader2 className="spin" size={17} /> : <Trash2 size={17} />}
                  Delete user account
                </button>
              </form>
            ) : (
              <p className="empty-state">Select a user to manage access, sessions, or account deletion.</p>
            )}
          </section>
        </>
      ) : null}

      {adminTab === 'exercises' ? (
        <>
      <section className="data-panel">
        <PanelHeader icon={Image} title="Exercise images" subtitle={`${imageRows.length} of ${imageTotal || metrics.exerciseImages || 0} loaded`} />
        <form className="form-stack admin-tool-form" onSubmit={regenerateExerciseImage}>
          <div className="form-grid two">
            <label className="field">
              <span>Exercise name</span>
              <input
                list="admin-exercise-options"
                value={imageForm.exerciseName}
                onChange={(event) => setImageForm({ ...imageForm, exerciseName: event.target.value })}
                required
              />
            </label>
            <Field
              label="Muscle category"
              value={imageForm.muscleCategory}
              onChange={(value) => setImageForm({ ...imageForm, muscleCategory: value })}
            />
          </div>
          <button className="secondary-action wide" disabled={deletingKey === 'image-regenerate'} type="submit">
            {deletingKey === 'image-regenerate' ? <Loader2 className="spin" size={17} /> : <Sparkles size={17} />}
            Regenerate with ChatGPT
          </button>
        </form>
        <datalist id="admin-exercise-options">
          {exercises.map((exercise) => (
            <option key={exercise.id || exercise.exerciseName} value={exercise.exerciseName} />
          ))}
        </datalist>
        <ImageRows
          empty="No exercise images returned yet."
          rows={imageRows.map((entry) => ({
            id: entry.id,
            title: entry.filename,
            meta: `${Math.round((entry.byteSize || 0) / 1024)} KB`,
            imageUrl: apiUrl(`images/imageName?name=${encodeURIComponent(entry.filename)}`),
            deleting: deletingKey === `image-${entry.id}`,
            onDelete: () => deleteExerciseImage(entry.id),
          }))}
        />
        {imageHasMore ? (
          <button className="secondary-action wide admin-load-more" disabled={imageLoading} onClick={() => loadImagePage(imageRows.length)} type="button">
            {imageLoading ? <Loader2 className="spin" size={17} /> : <RefreshCcw size={17} />}
            Load 10 more
          </button>
        ) : null}
      </section>

      <section className="data-panel">
        <PanelHeader icon={Dumbbell} title="Create exercise" subtitle="Add a custom library entry" />
        <form className="form-stack" onSubmit={createCustomExercise}>
          <div className="form-grid two">
            <Field
              label="Exercise name"
              value={exerciseForm.exerciseName}
              onChange={(value) => setExerciseForm({ ...exerciseForm, exerciseName: value })}
              required
            />
            <Field
              label="Muscle category"
              value={exerciseForm.muscleCategory}
              onChange={(value) => setExerciseForm({ ...exerciseForm, muscleCategory: value })}
              required
            />
          </div>
          <div className="form-grid two">
            <Field
              label="Muscle"
              value={exerciseForm.muscle}
              onChange={(value) => setExerciseForm({ ...exerciseForm, muscle: value })}
              required
            />
            <Field
              label="Calories"
              type="number"
              value={exerciseForm.expectedCaloriesBurned}
              onChange={(value) => setExerciseForm({ ...exerciseForm, expectedCaloriesBurned: value })}
              required
            />
          </div>
          <label className="field">
            <span>English description</span>
            <textarea
              value={exerciseForm.descriptionEnglish}
              onChange={(event) => setExerciseForm({ ...exerciseForm, descriptionEnglish: event.target.value })}
              rows="3"
            />
          </label>
          <label className="field">
            <span>Spanish description</span>
            <textarea
              value={exerciseForm.descriptionSpanish}
              onChange={(event) => setExerciseForm({ ...exerciseForm, descriptionSpanish: event.target.value })}
              rows="3"
            />
          </label>
          <label className="toggle-row">
            <input
              checked={exerciseForm.generateImage}
              onChange={(event) => setExerciseForm({ ...exerciseForm, generateImage: event.target.checked })}
              type="checkbox"
            />
            <span>Generate exercise, muscle, and category images</span>
          </label>
          <button className="primary-action wide" disabled={deletingKey === 'exercise-create'} type="submit">
            {deletingKey === 'exercise-create' ? <Loader2 className="spin" size={17} /> : <Dumbbell size={17} />}
            Add exercise
          </button>
        </form>
      </section>
        </>
      ) : null}
    </div>
  )
}

function AdminRows({ empty, rows }) {
  if (!rows.length) return <p className="empty-state">{empty}</p>
  return (
    <div className="rows">
      {rows.map((row, index) => (
        <div className="history-row admin-row" key={`${row.id || row.title}-${index}`}>
          <div>
            <strong>{formatDate(row.title)}</strong>
            <small>{row.meta}</small>
          </div>
          <b>{row.value}</b>
          <button
            className="icon-button danger-button"
            disabled={row.deleting}
            onClick={row.onDelete}
            type="button"
            aria-label={`Delete ${row.title}`}
            title="Delete"
          >
            {row.deleting ? <Loader2 className="spin" size={17} /> : <Trash2 size={17} />}
          </button>
        </div>
      ))}
    </div>
  )
}

function InfoItem({ label, value }) {
  const display = value === undefined || value === null || value === '' ? '--' : value
  return (
    <div className="info-item">
      <span>{label}</span>
      <strong>{display}</strong>
    </div>
  )
}

function TrainingPlanEditor({
  days,
  kind,
  onAddDay,
  onAddExercise,
  onDeleteDay,
  onDeleteExercise,
  onUpdateDay,
  onUpdateExercise,
}) {
  const planDays = Array.isArray(days) ? days : []
  return (
    <div className="plan-editor">
      <div className="admin-panel-heading">
        <div>
          <h4>{kind === 'routine' ? 'Routine days' : 'Workout days'}</h4>
          <p>{planDays.length} days loaded</p>
        </div>
        <button className="secondary-action" onClick={onAddDay} type="button">
          <Plus size={17} />
          Add day
        </button>
      </div>
      {!planDays.length ? <p className="empty-state">No days yet.</p> : null}
      {planDays.map((day, dayIndex) => {
        const exercisesForDay = Array.isArray(day.exercises) ? day.exercises : []
        return (
          <article className="plan-day-card" key={`${kind}-${day.day}-${dayIndex}`}>
            <div className="plan-day-header">
              <div className="form-grid two">
                <Field
                  label="Day"
                  type="number"
                  value={day.day || dayIndex + 1}
                  onChange={(value) => onUpdateDay(dayIndex, 'day', value)}
                />
                <Field
                  label="Muscle group"
                  value={day.muscle_group || ''}
                  onChange={(value) => onUpdateDay(dayIndex, 'muscle_group', value)}
                />
              </div>
              <button className="icon-button danger-button" onClick={() => onDeleteDay(dayIndex)} type="button" aria-label="Delete day" title="Delete day">
                <Trash2 size={17} />
              </button>
            </div>

            <div className="plan-exercise-list">
              {exercisesForDay.map((exercise, exerciseIndex) => (
                <div className="plan-exercise-editor" key={`${exercise.name}-${exerciseIndex}`}>
                  <div className="form-grid three">
                    <Field
                      label="Exercise"
                      value={exercise.name || ''}
                      onChange={(value) => onUpdateExercise(dayIndex, exerciseIndex, 'name', value)}
                    />
                    <Field
                      label="Reps"
                      value={exercise.reps || ''}
                      onChange={(value) => onUpdateExercise(dayIndex, exerciseIndex, 'reps', value)}
                    />
                    <Field
                      label="Sets"
                      type="number"
                      value={exercise.sets || 0}
                      onChange={(value) => onUpdateExercise(dayIndex, exerciseIndex, 'sets', value)}
                    />
                  </div>
                  <div className="form-grid three">
                    <Field
                      label="Calories"
                      type="number"
                      value={exercise.calories_burned || 0}
                      onChange={(value) => onUpdateExercise(dayIndex, exerciseIndex, 'calories_burned', value)}
                    />
                    {kind === 'routine' ? (
                      <>
                        <Field
                          label="Weight"
                          type="number"
                          value={exercise.weight || 0}
                          onChange={(value) => onUpdateExercise(dayIndex, exerciseIndex, 'weight', value)}
                        />
                        <SelectField
                          label="Unit"
                          value={exercise.unit || 'lb'}
                          onChange={(value) => onUpdateExercise(dayIndex, exerciseIndex, 'unit', value)}
                          options={['lb', 'kg']}
                        />
                      </>
                    ) : (
                      <>
                        <Field
                          label="English note"
                          value={exercise.descriptionEng || ''}
                          onChange={(value) => onUpdateExercise(dayIndex, exerciseIndex, 'descriptionEng', value)}
                        />
                        <Field
                          label="Spanish note"
                          value={exercise.descriptionEsp || ''}
                          onChange={(value) => onUpdateExercise(dayIndex, exerciseIndex, 'descriptionEsp', value)}
                        />
                      </>
                    )}
                  </div>
                  {kind === 'routine' ? (
                    <div className="form-grid two">
                      <Field
                        label="English note"
                        value={exercise.descriptionEng || ''}
                        onChange={(value) => onUpdateExercise(dayIndex, exerciseIndex, 'descriptionEng', value)}
                      />
                      <Field
                        label="Spanish note"
                        value={exercise.descriptionEsp || ''}
                        onChange={(value) => onUpdateExercise(dayIndex, exerciseIndex, 'descriptionEsp', value)}
                      />
                    </div>
                  ) : null}
                  <button className="secondary-action danger-action wide" onClick={() => onDeleteExercise(dayIndex, exerciseIndex)} type="button">
                    <Trash2 size={17} />
                    Delete exercise
                  </button>
                </div>
              ))}
            </div>

            <button className="secondary-action wide" onClick={() => onAddExercise(dayIndex)} type="button">
              <Plus size={17} />
              Add exercise
            </button>
          </article>
        )
      })}
    </div>
  )
}

function ImageRows({ empty, rows }) {
  if (!rows.length) return <p className="empty-state">{empty}</p>
  return (
    <div className="image-list">
      {rows.map((row, index) => (
        <div className="image-row" key={`${row.id || row.title}-${index}`}>
          <img src={row.imageUrl} alt="" />
          <div>
            <strong>{row.title}</strong>
            <small>{row.meta}</small>
          </div>
          <button
            className="icon-button danger-button"
            disabled={row.deleting}
            onClick={row.onDelete}
            type="button"
            aria-label={`Delete ${row.title}`}
            title="Delete"
          >
            {row.deleting ? <Loader2 className="spin" size={17} /> : <Trash2 size={17} />}
          </button>
        </div>
      ))}
    </div>
  )
}

function Dashboard({ liftHistory, nutrition, plan, user, weights }) {
  const nextDay = plan[0] || demoPlan[0]
  const latestWeight = latestValue(weights, ['weight', 'value', 'bodyWeight'])
  const loggedSets = liftHistory.length

  return (
    <div className="workspace-grid">
      <section className="summary-panel wide-panel">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h3>{user ? `${user.firstName} ${user.lastName}` : 'PowAI athlete'}</h3>
          <p>
            {user?.goal || 'Training'} plan, {user?.numDays || plan.length || 4} days per week,
            {user?.numHours ? ` ${user.numHours} hours` : ' session-based'} workouts.
          </p>
        </div>
        <div className="hero-metrics">
          <MetricPill label="Calories" value={user?.DailyCalories || '--'} />
          <MetricPill label="Protein" value={user?.DailyProtein ? `${user.DailyProtein}g` : '--'} />
          <MetricPill label="Water" value={user?.water ? `${user.water}L` : '--'} />
        </div>
      </section>

      <StatCard icon={Dumbbell} label="Workout days" value={plan.length || demoPlan.length} detail="Your current weekly plan" />
      <StatCard icon={Scale} label="Latest weight" value={latestWeight || '--'} detail="Most recent body-weight entry" />
      <StatCard icon={Activity} label="Logged sets" value={loggedSets || '--'} detail="Strength history entries" />
      <StatCard icon={Utensils} label="Nutrition rows" value={nutrition.length || '--'} detail="Saved daily nutrition logs" />

      <section className="data-panel">
        <PanelHeader icon={Flame} title="Next workout" subtitle={nextDay.muscle_group || 'Generated plan'} />
        <WorkoutList day={nextDay} compact />
      </section>
      <section className="data-panel">
        <PanelHeader icon={HeartPulse} title="Daily targets" subtitle="Profile nutrition" />
        <MacroBars user={user} />
      </section>
    </div>
  )
}

function WorkoutPage({ plan }) {
  const days = plan.length ? plan : demoPlan

  return (
    <div className="page-stack">
      {days.map((day) => (
        <section className="data-panel" key={`${day.day}-${day.muscle_group}`}>
          <PanelHeader icon={Dumbbell} title={`Day ${day.day || ''}`} subtitle={day.muscle_group || 'Workout'} />
          <WorkoutList day={day} />
        </section>
      ))}
    </div>
  )
}

function NutritionPage({ nutrition, user }) {
  return (
    <div className="workspace-grid two-cols">
      <section className="data-panel">
        <PanelHeader icon={Utensils} title="Targets" subtitle="Personalized macro goals" />
        <MacroBars user={user} />
      </section>
      <section className="data-panel">
        <PanelHeader icon={Moon} title="Daily history" subtitle={`${nutrition.length} saved entries`} />
        <Rows
          empty="No daily nutrition rows returned yet."
          rows={nutrition.slice(0, 8).map((entry) => ({
            title: entry.date || entry.dayMarker || entry.createdAt || 'Nutrition entry',
            meta: `${entry.calories || entry.Calories || 0} calories`,
            value: `${entry.protein || entry.Protein || 0}g protein`,
          }))}
        />
      </section>
    </div>
  )
}

function ProgressPage({ liftHistory, weights }) {
  return (
    <div className="workspace-grid two-cols">
      <section className="data-panel">
        <PanelHeader icon={Scale} title="Body weight" subtitle={`${weights.length} entries`} />
        <Rows
          empty="No body weight entries returned yet."
          rows={weights.slice(0, 10).map((entry) => ({
            title: entry.date || entry.createdAt || 'Weight entry',
            meta: entry.email || 'PowAI account',
            value: latestValue([entry], ['weight', 'value', 'bodyWeight']) || '--',
          }))}
        />
      </section>
      <section className="data-panel">
        <PanelHeader icon={Activity} title="Lift history" subtitle={`${liftHistory.length} set entries`} />
        <Rows
          empty="No lift history entries returned yet."
          rows={liftHistory.slice(0, 10).map((entry) => ({
            title: entry.exerciseName || entry.exercise || entry.name || 'Exercise',
            meta: `Set ${entry.setNumber || entry.set || '--'} on ${entry.date || entry.createdAt || 'recent date'}`,
            value: `${entry.weight || entry.weightAmount || '--'} lb`,
          }))}
        />
      </section>
    </div>
  )
}

function WorkoutList({ compact = false, day }) {
  const exercises = Array.isArray(day?.exercises) ? day.exercises : []
  return (
    <div className={compact ? 'exercise-list compact' : 'exercise-list'}>
      {exercises.map((exercise) => (
        <div className="exercise-item" key={`${day?.day}-${exercise.name}`}>
          <span>{exercise.sets || '--'}x</span>
          <div>
            <strong>{exercise.name}</strong>
            <small>{exercise.reps || 'Planned reps'}</small>
          </div>
          <b>{exercise.calories_burned || exercise.calories || 0}</b>
        </div>
      ))}
    </div>
  )
}

function MacroBars({ user }) {
  const macros = [
    ['Calories', user?.DailyCalories || 2200, 3000],
    ['Protein', user?.DailyProtein || 150, 220],
    ['Carbs', user?.carbs || 250, 360],
    ['Sugars', user?.sugars || 40, 90],
  ]

  return (
    <div className="macro-bars">
      {macros.map(([label, value, max]) => (
        <div className="macro-bar" key={label}>
          <div>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
          <meter min="0" max={max} value={value} aria-label={`${label} target`} />
        </div>
      ))}
    </div>
  )
}

function Rows({ empty, rows }) {
  if (!rows.length) return <p className="empty-state">{empty}</p>
  return (
    <div className="rows">
      {rows.map((row, index) => (
        <div className="history-row" key={`${row.title}-${index}`}>
          <div>
            <strong>{formatDate(row.title)}</strong>
            <small>{row.meta}</small>
          </div>
          <b>{row.value}</b>
        </div>
      ))}
    </div>
  )
}

function Field({ label, onChange, type = 'text', value, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} {...props} />
    </label>
  )
}

function SelectField({ label, onChange, options, value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function FeatureCard({ icon: Icon, title, text }) {
  return (
    <article className="feature-card">
      <Icon size={22} />
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  )
}

function SectionTitle({ icon: Icon, label, text, title }) {
  return (
    <div className="section-title">
      <p className="eyebrow"><Icon size={16} /> {label}</p>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  )
}

function PanelHeader({ icon: Icon, subtitle, title }) {
  return (
    <div className="panel-header">
      <Icon size={20} />
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
    </div>
  )
}

function MetricPill({ label, value }) {
  return (
    <div className="metric-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function StatCard({ detail, icon: Icon, label, value }) {
  return (
    <article className="stat-card">
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}

function LoadingPanel() {
  return (
    <section className="loading-panel">
      <Loader2 className="spin" size={28} />
      <h3>Loading PowAI workspace</h3>
      <p>Fetching your profile, workout plan, nutrition history, and progress data.</p>
    </section>
  )
}

async function api(path, { body, method = 'GET', timeout = 30000, token } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    const response = await fetch(apiUrl(path), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    const text = await response.text()
    const data = text ? safeJson(text) : null
    if (!response.ok) {
      const message = typeof data === 'object' ? data.reason || data.message : data
      throw new ApiError(message || `Request failed with ${response.status}`, response.status, data)
    }
    return data
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('The request timed out. Please try again.')
    throw error
  } finally {
    clearTimeout(timer)
  }
}

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

function readStoredToken() {
  const storedToken = localStorage.getItem(TOKEN_KEY) || ''
  const expiresAt = localStorage.getItem(TOKEN_EXPIRES_KEY)
  if (storedToken && expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRES_KEY)
    return ''
  }
  return storedToken
}

function accessFormForUser(user) {
  return {
    membershipStatus: user?.membershipStatus || 'active',
    membershipPlan: user?.membershipPlan || '',
    membershipExpiresAt: toDateTimeLocal(user?.membershipExpiresAt),
    isAdmin: Boolean(user?.isAdmin),
  }
}

function toDateTimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function apiUrl(path) {
  return `${API_BASE.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

function normalizePlan(payload) {
  const candidate =
    payload?.userExcersises?.workout_plan ||
    payload?.userExercises?.workout_plan ||
    payload?.workout_plan ||
    payload?.training?.userExcersises?.workout_plan ||
    payload

  return Array.isArray(candidate) ? candidate : []
}

function parseTrainingJSON(value) {
  if (!value) return { workout_plan: [] }
  try {
    const parsed = JSON.parse(value)
    return {
      ...parsed,
      workout_plan: Array.isArray(parsed?.workout_plan) ? parsed.workout_plan : [],
    }
  } catch {
    return { workout_plan: [] }
  }
}

function safeJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function latestValue(rows, keys) {
  const row = Array.isArray(rows) && rows.length ? rows[0] : null
  if (!row) return ''
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key]
  }
  return ''
}

function formatHeight(user) {
  if (!user) return ''
  if (user.height) return `${user.height} cm`
  if (user.heightFt || user.heightInc) return `${user.heightFt || 0} ft ${user.heightInc || 0} in`
  return ''
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function pageTitle(page) {
  return {
    admin: 'Admin',
    dashboard: 'Dashboard',
    workouts: 'Workout plan',
    nutrition: 'Nutrition',
    progress: 'Progress',
  }[page]
}

export default App
