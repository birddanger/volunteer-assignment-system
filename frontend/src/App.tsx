import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './hooks/useAuth';
import { useI18n } from './i18n';
import './index.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VolunteerDashboardPage from './pages/VolunteerDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import EventSetupPage from './pages/EventSetupPage';
import CalendarPage from './pages/CalendarPage';
import VolunteerProfilePage from './pages/VolunteerProfilePage';
import NotificationCenter from './components/NotificationCenter';
import CompetitionSchedulePage from './pages/CompetitionSchedulePage';

// ---------- Dark mode hook ----------
function useDarkMode() {
  const [dark, setDark] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('darkMode') === 'true';
  });

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('darkMode', String(dark));
  }, [dark]);

  return { dark, toggleDark: () => setDark(d => !d) };
}

const DarkModeContext = React.createContext<{ dark: boolean; toggleDark: () => void }>({ dark: false, toggleDark: () => {} });

function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const value = useDarkMode();
  return React.createElement(DarkModeContext.Provider, { value }, children);
}

function useDarkModeContext() {
  return React.useContext(DarkModeContext);
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Uncaught error:', error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md p-8 bg-white rounded-lg shadow-lg text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">{this.state.error.message}</p>
            <button
              onClick={() => {
                this.setState({ error: null });
                window.location.href = '/';
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function LanguageToggle() {
  const { language, toggleLanguage } = useI18n();
  return (
    <button
      onClick={toggleLanguage}
      className="px-2 py-1 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      title={language === 'en' ? 'Vaihda suomeksi' : 'Switch to English'}
    >
      {language === 'en' ? '🇫🇮 FI' : '🇬🇧 EN'}
    </button>
  );
}

function DarkModeToggle() {
  const { dark, toggleDark } = useDarkModeContext();
  return (
    <button
      onClick={toggleDark}
      className="px-2 py-1 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  );
}

function Navigation() {
  const { user, logout } = useAuth();
  const { t } = useI18n();

  return (
    <nav className="bg-white dark:bg-gray-800 shadow print:hidden">
      <div className="container max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600">
          {t.nav.appName}
        </Link>
        <div className="flex gap-4 items-center">
          <DarkModeToggle />
          <LanguageToggle />
          {user ? (
            <>
              <NotificationCenter />
              <span className="text-gray-700 dark:text-gray-300">{user.first_name} {user.last_name}</span>
              <Link to="/profile" className="text-blue-600 dark:text-blue-400 hover:underline">{t.nav.profile}</Link>
              <Link to="/competition" className="text-blue-600 dark:text-blue-400 hover:underline">{t.nav.competition}</Link>
              <Link to="/calendar" className="text-blue-600 dark:text-blue-400 hover:underline">{t.nav.calendar}</Link>
              {user.is_organizer && (
                <>
                  <Link to="/setup" className="text-blue-600 dark:text-blue-400 hover:underline">{t.nav.setup}</Link>
                  <Link to="/admin" className="text-blue-600 dark:text-blue-400 hover:underline">{t.nav.dashboard}</Link>
                </>
              )}
              {!user.is_organizer && (
                <Link to="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline">{t.nav.myTasks}</Link>
              )}
              <button
                onClick={logout}
                className="btn-secondary"
              >
                {t.nav.logout}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">{t.nav.login}</Link>
              <Link to="/register" className="btn-primary">{t.nav.register}</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function ProtectedRoute({ children, requireOrganizer = false }: { children: React.ReactNode; requireOrganizer?: boolean }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requireOrganizer && !user.is_organizer) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
      <DarkModeProvider>
      <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <Navigation />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <VolunteerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/setup"
            element={
              <ProtectedRoute requireOrganizer={true}>
                <EventSetupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireOrganizer={true}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/competition"
            element={
              <ProtectedRoute>
                <CompetitionSchedulePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <VolunteerProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
      </ErrorBoundary>
      </DarkModeProvider>
      </AuthProvider>
    </Router>
  );
}
