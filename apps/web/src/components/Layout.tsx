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
    { href: '/dashboard', label: '📊 Dashboard' },
    { href: '/accounts', label: '🏦 Accounts' },
    { href: '/transactions', label: '💳 Transactions' },
    { href: '/analytics', label: '📈 Analytics' },
    { href: '/portfolio', label: '💰 Portfolio' },
    { href: '/insights', label: '🤖 Insights' },
    { href: '/visualizations', label: '📉 Charts' },
  ];

  const isActive = (href: string) => router.pathname === href;

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-600">💰</span>
              <span className="text-xl font-bold text-gray-900 hidden sm:inline">Financial Hub</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 text-sm">
                <span className="text-gray-700">{user?.name}</span>
                <button
                  onClick={() => {
                    logout();
                    router.push('/signin');
                  }}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  logout();
                  router.push('/signin');
                }}
                className="w-full text-left px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {title && <h1 className="text-3xl font-bold text-gray-900 mb-8">{title}</h1>}
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600 text-sm">
          <p>© 2024 Financial Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
