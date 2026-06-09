import { useState } from 'react';
import axios from 'axios';
import { generateDemoData } from '../utils/demoData';

interface BankConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ErrorType = 'api_down' | 'credentials_missing' | 'auth_failed' | 'generic' | null;

const BANKS = [
  {
    id: 'demo',
    name: '🎮 Demo Bank',
    description: '90 days of sample data — no setup needed',
    color: 'from-green-500 to-teal-500',
    icon: '🎮',
  },
  {
    id: 'revolut',
    name: '🟦 Revolut',
    description: 'Digital banking & payments',
    color: 'from-blue-600 to-cyan-600',
    icon: '🟦',
  },
  {
    id: 'cgd',
    name: '🏦 Caixa Geral de Depósitos',
    description: 'Portuguese bank accounts',
    color: 'from-yellow-600 to-orange-600',
    icon: '🏦',
    comingSoon: true,
  },
  {
    id: 'edenred',
    name: '🍽️ Edenred',
    description: 'Meal card balance & transactions',
    color: 'from-green-600 to-emerald-600',
    icon: '🍽️',
    comingSoon: true,
  },
];

function SetupGuide({ type, onClose }: { type: ErrorType; onClose: () => void }) {
  if (type === 'api_down') {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⚠️</span>
            <h3 className="font-bold text-amber-900">API Server Not Running</h3>
          </div>
          <p className="text-sm text-amber-800 mb-3">
            The backend API needs to be running to connect real bank accounts via OAuth.
          </p>
          <div className="bg-amber-100 rounded-lg p-3 font-mono text-xs text-amber-900">
            <p className="font-bold mb-1"># Start the API server:</p>
            <p>npm run dev --workspace=apps/api</p>
          </div>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Try Demo Bank instead</strong> — it imports 90 days of sample data instantly with no API needed.
          </p>
        </div>
        <button onClick={onClose} className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-all">
          Got it
        </button>
      </div>
    );
  }

  if (type === 'credentials_missing') {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🔑</span>
            <h3 className="font-bold text-purple-900">Revolut API Credentials Required</h3>
          </div>
          <p className="text-sm text-purple-800 mb-3">
            Register a Revolut Business API application and add credentials to connect real accounts.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="font-bold text-gray-800 mb-1">1. Get Revolut API Access</p>
            <p className="text-gray-600">Visit <span className="font-mono text-blue-600">developer.revolut.com</span> → Enable Open Banking API</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="font-bold text-gray-800 mb-1">2. Configure apps/api/.env.local</p>
            <div className="bg-gray-800 text-green-400 rounded p-2 font-mono text-xs mt-1 space-y-0.5">
              <p>REVOLUT_CLIENT_ID=your_client_id</p>
              <p>REVOLUT_CLIENT_SECRET=your_secret</p>
              <p>REVOLUT_REDIRECT_URI=http://localhost:3000/integrations/revolut/callback</p>
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="font-bold text-gray-800 mb-1">3. Restart the API</p>
            <div className="bg-gray-800 text-green-400 rounded p-2 font-mono text-xs mt-1">
              <p>npm run dev</p>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all">
          Close Setup Guide
        </button>
      </div>
    );
  }

  return null;
}

export function BankConnectionModal({ isOpen, onClose, onSuccess }: BankConnectionModalProps) {
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleDemoConnect = () => {
    setLoading(true);
    const demoAccounts = generateDemoData();
    const existing: Array<{ id: string }> = JSON.parse(localStorage.getItem('user_accounts') || '[]');
    const existingIds = new Set(existing.map((a) => a.id));
    const merged = [...existing, ...demoAccounts.filter((a) => !existingIds.has(a.id))];
    localStorage.setItem('user_accounts', JSON.stringify(merged));
    setShowSuccess(true);
    setLoading(false);
    setTimeout(() => onSuccess(), 1500);
  };

  const handleConnect = async (bankId: string) => {
    if (bankId === 'revolut') {
      setLoading(true);
      setError('');
      setErrorType(null);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const redirectUri = `${window.location.origin}/integrations/revolut/callback`;
        const response = await axios.post(
          `${API_URL}/integrations/revolut/auth-url`,
          { redirectUri },
          { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }, timeout: 5000 },
        );
        window.location.href = response.data.auth_url;
      } catch (err: unknown) {
        setLoading(false);
        const axiosErr = err as { response?: { status?: number; data?: { message?: string } }; code?: string };
        if (!axiosErr.response) {
          setErrorType('api_down');
          setError("Cannot reach the API server. Make sure it's running on port 3001.");
        } else if (axiosErr.response.status === 500) {
          const msg = axiosErr.response.data?.message || '';
          if (msg.toLowerCase().includes('revolut_client_id') || msg.toLowerCase().includes('not configured')) {
            setErrorType('credentials_missing');
            setError('Revolut API credentials are not configured.');
          } else {
            setErrorType('generic');
            setError(msg || 'Server error. Check API logs.');
          }
        } else if (axiosErr.response.status === 401 || axiosErr.response.status === 403) {
          setErrorType('auth_failed');
          setError('Authentication failed. Please sign out and back in.');
        } else {
          setErrorType('generic');
          setError(axiosErr.response.data?.message || 'Failed to initiate connection');
        }
      }
    } else {
      setError(`${bankId} integration is coming soon`);
    }
  };

  const resetState = () => {
    setSelectedBank(null);
    setError('');
    setErrorType(null);
    setShowSuccess(false);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🏦 Connect Bank Account</h2>
            <p className="text-gray-600 mt-1">Link your accounts to sync transactions automatically</p>
          </div>
          <button onClick={() => { resetState(); onClose(); }} className="text-gray-400 hover:text-gray-600 text-2xl" disabled={loading}>✕</button>
        </div>

        {/* Success overlay */}
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
              <span className="text-5xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Demo Bank Connected!</h2>
            <p className="text-gray-700 mb-1">3 accounts imported with 90 days of transaction history.</p>
            <p className="text-gray-500 mb-6 text-sm">Redirecting to your accounts...</p>
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : errorType && (errorType === 'api_down' || errorType === 'credentials_missing') ? (
          <SetupGuide type={errorType} onClose={() => { setErrorType(null); setError(''); }} />
        ) : (
          <>
            {/* Generic error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-semibold flex items-center gap-2">
                  <span>⚠️</span> {error}
                </p>
              </div>
            )}

            {/* Bank selection grid */}
            {!selectedBank ? (
              <>
                <p className="text-gray-700 mb-4 font-medium">Select a connection type:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {BANKS.map((bank) => (
                    <button
                      key={bank.id}
                      onClick={() => !bank.comingSoon && setSelectedBank(bank.id)}
                      disabled={!!bank.comingSoon || loading}
                      className={`p-5 rounded-xl border-2 transition-all text-left ${
                        bank.comingSoon
                          ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50'
                          : 'border-gray-200 hover:border-blue-400 hover:shadow-lg cursor-pointer hover:-translate-y-0.5'
                      }`}
                    >
                      <div className="text-3xl mb-2">{bank.icon}</div>
                      <h3 className="font-semibold text-gray-900">{bank.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{bank.description}</p>
                      {bank.comingSoon && <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-semibold">Coming Soon</span>}
                    </button>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[
                    { icon: '✓', title: 'Automatic', desc: 'Real-time updates' },
                    { icon: '🔒', title: 'Secure', desc: 'OAuth or local-only' },
                    { icon: '📊', title: 'Smart', desc: 'Auto-categorization' },
                  ].map((b, i) => (
                    <div key={i} className="p-3 bg-blue-50 rounded-lg text-center">
                      <p className="text-lg mb-1">{b.icon}</p>
                      <p className="font-semibold text-gray-900 text-sm">{b.title}</p>
                      <p className="text-xs text-gray-600">{b.desc}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : selectedBank === 'demo' ? (
              /* Demo Bank detail */
              <div className="space-y-5">
                <div className="p-6 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">🎮</span>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">Demo Bank Connection</h3>
                      <p className="text-sm text-gray-600">Instant — no API, no credentials needed</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 mb-2">Will import 3 accounts:</p>
                  <ul className="space-y-1.5 mb-5 text-sm text-gray-700 ml-1">
                    <li className="flex items-center gap-2"><span>🟦</span> My Revolut — <span className="font-semibold">€2,450.80</span></li>
                    <li className="flex items-center gap-2"><span>🏦</span> Savings Account — <span className="font-semibold">€8,200.00</span></li>
                    <li className="flex items-center gap-2"><span>🍽️</span> Sodexo Meal Card — <span className="font-semibold">€135.50</span></li>
                  </ul>
                  <div className="p-3 bg-green-100 rounded-lg mb-5 text-xs text-green-900">
                    <strong>ℹ️ Local-only</strong> — data is stored in your browser's localStorage. No account needed.
                  </div>
                  <button
                    onClick={handleDemoConnect}
                    disabled={loading}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                      loading ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white active:scale-95 shadow-md'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Importing...
                      </span>
                    ) : '🎮 Connect Demo Bank'}
                  </button>
                </div>
                <button onClick={() => setSelectedBank(null)} disabled={loading} className="w-full py-2 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-all disabled:opacity-50">
                  ← Back
                </button>
              </div>
            ) : (
              /* Revolut detail */
              <div className="space-y-5">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">🟦</span>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">Connect Revolut</h3>
                      <p className="text-sm text-gray-600">Secure OAuth — requires running API + credentials</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 mb-5 text-sm text-gray-700">
                    <li>✓ Import real transactions & balances</li>
                    <li>✓ All Revolut account types (EUR, GBP, USD…)</li>
                    <li>✓ Transactions auto-categorized</li>
                    <li>✓ Token encrypted at rest</li>
                  </ul>
                  <button
                    onClick={() => handleConnect('revolut')}
                    disabled={loading}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                      loading ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white active:scale-95'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Connecting...
                      </span>
                    ) : 'Continue to Revolut →'}
                  </button>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                  <strong>ℹ️ What happens next:</strong> You'll be redirected to Revolut to authenticate. After approval, your accounts and transactions sync automatically.
                </div>
                <button onClick={() => setSelectedBank(null)} disabled={loading} className="w-full py-2 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-all disabled:opacity-50">
                  ← Back
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 pt-5 border-t border-gray-200">
              <button onClick={() => { resetState(); onClose(); }} disabled={loading} className="w-full py-2 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-all disabled:opacity-50">
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
