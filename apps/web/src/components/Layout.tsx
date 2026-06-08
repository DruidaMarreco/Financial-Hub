import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/accounts', label: 'Accounts', icon: '🏦' },
    { href: '/transactions', label: 'Transactions', icon: '💳' },
    { href: '/analytics', label: 'Analytics', icon: '📈' },
    { href: '/portfolio', label: 'Portfolio', icon: '💰' },
    { href: '/insights', label: 'Insights', icon: '🤖' },
    { href: '/visualizations', label: 'Charts', icon: '📉' },
  ];

  const isActive = (href: string) => router.pathname === href;

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg group-hover:shadow-lg transition-all">
                💰
              </div>
              <div className="hidden sm:block">
                <div className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  Financial Hub
                </div>
                <div className="text-xs text-gray-500">Dashboard</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-transparent bg-clip-text from-blue-600 to-purple-600 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100/50'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{user?.name?.split(' ')[0]}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    router.push('/signin');
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg active:scale-95"
                >
                  Sign Out
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden pb-4 space-y-2 border-t border-gray-100 pt-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-transparent bg-clip-text from-blue-600 to-purple-600'
                      : 'text-gray-700 hover:bg-gray-100/50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  logout();
                  router.push('/signin');
                }}
                className="w-full text-left px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg transition-all text-sm font-semibold mt-2"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {title && (
          <div className="mb-12">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
              {title}
            </h1>
            <p className="text-gray-600">Welcome to your financial dashboard</p>
          </div>
        )}
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/20 backdrop-blur-xl mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                  💰
                </div>
                <span className="font-bold text-gray-900">Financial Hub</span>
              </div>
              <p className="text-sm text-gray-600">Your personal finance aggregation platform</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><span>📊</span> Financial Dashboard</li>
                <li><span>🤖</span> AI Insights</li>
                <li><span>📈</span> Analytics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Security</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>🔒 Encrypted Data</li>
                <li>🔑 Secure Auth</li>
                <li>🛡️ HTTPS</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>📚 Documentation</li>
                <li>💬 Support</li>
                <li>🔧 Settings</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center text-gray-600 text-sm">
            <p>© 2024 Financial Hub. Built with ❤️ for better financial management.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
