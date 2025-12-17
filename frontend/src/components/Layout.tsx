import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  CheckSquare,
  Ticket,
  UserCog,
  Moon,
  Sun,
  LogOut,
  FileText,
  Settings as SettingsIcon,
  Menu,
  X,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const inactivityTimerRef = useRef<number | null>(null);
  const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) return;

    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];

    const resetTimer = () => {
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = window.setTimeout(() => {
        setMobileMenuOpen(false);
        logout();
        alert('Session expirée pour inactivité (10 minutes). Veuillez vous reconnecter.');
        navigate('/login');
      }, INACTIVITY_LIMIT);
    };

    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [logout, navigate, user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FolderKanban, label: 'Projects', path: '/projects' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: CheckSquare, label: 'CheckList', path: '/checklist' },
    { icon: Ticket, label: 'Tickets', path: '/tickets' },
    { icon: FileText, label: 'Rapports', path: '/reports' },
    { icon: SettingsIcon, label: 'Paramètres', path: '/settings' },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ icon: UserCog, label: 'Users', path: '/users' });
  }

  const brand = (
    <div
      className="text-xl font-bold"
      style={{
        fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        letterSpacing: '-0.5px',
      }}
    >
      <span className="text-[#06b6d4]">W</span>
      <span className="text-gray-900 dark:text-white">eboost</span>
      <span className="text-[#06b6d4]">.</span>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar - Fixed at top */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-14 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
          aria-label="Ouvrir le menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="flex-1 flex justify-center">{brand}</div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
            aria-label="Basculer le mode"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
            aria-label="Déconnexion"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Layout Container */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full">
        <div className="flex flex-col lg:flex-row h-full min-h-screen">
          {/* Sidebar - Hidden on mobile when closed */}
          <aside
            className={`fixed lg:relative top-14 lg:top-0 left-0 z-[60] lg:z-auto w-64 h-[calc(100vh-56px)] lg:h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform lg:transform-none transition-transform duration-300 ease-in-out flex-shrink-0 ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
          >
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 hidden lg:block">
                <div className="flex items-center mb-2">{brand}</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Websites Manager</p>
              </div>

              <nav className="flex-1 px-4 pb-4 space-y-2 overflow-y-auto lg:pt-4" style={{ paddingTop: '2rem' }}>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hidden lg:inline-flex flex-shrink-0 ml-2"
                  >
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                  </button>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut size={18} />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main content area */}
          <main className="flex-1 pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8 overflow-y-auto min-h-screen lg:min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
