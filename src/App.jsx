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
  LifeBuoy,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Moon,
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
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
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
      setUser(me)

      if (me?.isAdmin) {
        const adminSummary = await api('admin/summary', { token }).catch(() => null)
        setPlan([])
        setWeights([])
        setNutrition([])
        setLiftHistory([])
        setAdminData(adminSummary)
        setActivePage('admin')
        return
      }

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
      signOut()
      setNotice(error.message || 'Your session expired. Please log in again.')
    } finally {
      setLoading(false)
    }
  }

  function signIn(nextToken) {
    localStorage.setItem(TOKEN_KEY, nextToken)
    setToken(nextToken)
    setActivePage('dashboard')
  }

  function signOut() {
    localStorage.removeItem(TOKEN_KEY)
    setToken('')
    setUser(null)
    setPlan([])
    setWeights([])
    setNutrition([])
    setLiftHistory([])
    setAdminData(null)
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
              Admin
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
      onLogin(response.token)
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
      <Field label="Admin email" type="email" value={form.email} onChange={(value) => update('email', value)} required />
      <Field label="Password" type="password" value={form.password} onChange={(value) => update('password', value)} required />
      <div className="form-grid two">
        <Field label="Verification code" value={form.verificationCode} onChange={(value) => update('verificationCode', value)} required />
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
      onLogin(response.token)
    } catch (error) {
      setStatus(error.message || 'Login failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <Field label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} required />
      <Field label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} required />
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
      <Field label="Password" type="password" value={form.password} onChange={(value) => update('password', value)} required />
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
        <Field label="Name" value={form.name} onChange={(value) => update('name', value)} required />
        <Field label="Email" type="email" value={form.email} onChange={(value) => update('email', value)} required />
      </div>
      <Field label="Subject" value={form.subject} onChange={(value) => update('subject', value)} required />
      <label className="field">
        <span>Message</span>
        <textarea value={form.message} onChange={(event) => update('message', event.target.value)} rows="5" required />
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
        {!loading && activePage === 'admin' ? <AdminPage data={adminData} onRefresh={onRefresh} token={token} /> : null}
        {!loading && activePage === 'workouts' ? <WorkoutPage plan={plan} /> : null}
        {!loading && activePage === 'nutrition' ? <NutritionPage user={user} nutrition={nutrition} /> : null}
        {!loading && activePage === 'progress' ? <ProgressPage weights={weights} liftHistory={liftHistory} /> : null}
      </section>
    </main>
  )
}

function AdminPage({ data, onRefresh, token }) {
  const [deleteStatus, setDeleteStatus] = useState('')
  const [deletingKey, setDeletingKey] = useState('')

  if (!data) {
    return (
      <section className="loading-panel">
        <ShieldCheck size={28} />
        <h3>Admin data unavailable</h3>
        <p>Refresh the workspace after signing in with an admin account.</p>
      </section>
    )
  }

  const metrics = data.metrics || {}
  const users = Array.isArray(data.users) ? data.users : []
  const tickets = Array.isArray(data.supportTickets) ? data.supportTickets : []
  const crashes = Array.isArray(data.crashReports) ? data.crashReports : []
  const emails = Array.isArray(data.emailLogs) ? data.emailLogs : []

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
        {deleteStatus ? <p className={`form-status ${deleteStatus.includes('deleted') ? 'success' : 'error'}`}>{deleteStatus}</p> : null}
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
      throw new Error(message || `Request failed with ${response.status}`)
    }
    return data
  } finally {
    clearTimeout(timer)
  }
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

function formatDate(value) {
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
