import { useState } from 'react';
import axios from 'axios';

interface BankConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ErrorType = 'api_down' | 'credentials_missing' | 'auth_failed' | 'generic' | null;

const BANKS = [
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
            The backend API needs to be running to connect real bank accounts. OAuth requires the API to exchange tokens securely.
          </p>
          <div className="bg-amber-100 rounded-lg p-3 font-mono text-xs text-amber-900">
            <p className="font-bold mb-1"># Start the API server:</p>
            <p>npm run dev --workspace=apps/api</p>
          </div>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 In the meantime:</strong> You can still add accounts manually using the &quot;Add Manual Account&quot; button, and they'll be tracked in your dashboard.
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-all"
        >
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
            To connect Revolut accounts, you need to register a Revolut Business API application and add your credentials.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="font-bold text-gray-800 mb-1">1. Get Revolut API Access</p>
            <p className="text-gray-600">Visit <span className="font-mono text-blue-600">developer.revolut.com</span> → Create Business Account → Enable Open Banking API</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="font-bold text-gray-800 mb-1">2. Configure .env.local</p>
            <div className="bg-gray-800 text-green-400 rounded p-2 font-mono text-xs mt-1">
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
        <button
          onClick={onClose}
          className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all"
        >
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

  const handleConnect = async (bankId: string) => {
    if (bankId === 'revolut') {
      setLoading(true);
      setError('');
      setErrorType(null);

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const redirectUri = `${window.location.origin}/integrations/revolut/callback`;

        // Get OAuth URL from backend
        const response = await axios.post(
          `${API_URL}/integrations/revolut/auth-url`,
          { redirectUri },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            },
            timeout: 5000,
          },
        );

        // Redirect to Revolut OAuth
        window.location.href = response.data.auth_url;
      } catch (err: any) {
        setLoading(false);

        // Classify the error type for targeted help
        if (!err.response) {
          // Network error — API not reachable
          setErrorType('api_down');
          setError('Cannot reach the API server. Make sure it\'s running on port 3001.');
        } else if (err.response?.status === 500) {
          const msg: string = err.response?.data?.message || '';
          if (msg.toLowerCase().includes('revolut_client_id') || msg.toLowerCase().includes('not configured')) {
            setErrorType('credentials_missing');
            setError('Revolut API credentials are not configured.');
          } else if (err.response?.status === 401 || err.response?.status === 403) {
            setErrorType('auth_failed');
            setError('Authentication failed. Please sign out and back in.');
          } else {
            setErrorType('generic');
            setError(msg || 'An error occurred on the server.');
          }
        } else {
          setErrorType('generic');
          setError(err.response?.data?.message || 'Failed to initiate connection');
        }
      }
    } else {
      setError(`${bankId} integration is coming soon`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🏦 Connect Bank Account</h2>
            <p className="text-gray-600 mt-1">Link your real accounts to sync transactions automatically</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* Setup Guide (for api_down or credentials_missing) */}
        {errorType && (errorType === 'api_down' || errorType === 'credentials_missing') ? (
          <SetupGuide type={errorType} onClose={() => { setErrorType(null); setError(''); }} />
        ) : (
        <>
        {/* Generic Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-semibold flex items-center gap-2">
              <span>⚠️</span> {error}
            </p>
          </div>
        )}

        {/* Bank Selection */}
        {!selectedBank ? (
          <>
            <p className="text-gray-700 mb-4">Select a bank to get started:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {BANKS.map((bank) => (
                <button
                  key={bank.id}
                  onClick={() => !bank.comingSoon && setSelectedBank(bank.id)}
                  disabled={bank.comingSoon || loading}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    bank.comingSoon
                      ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50'
                      : 'border-gray-200 hover:border-blue-400 hover:shadow-lg cursor-pointer'
                  }`}
                >
                  <div className="text-4xl mb-3">{bank.icon}</div>
                  <h3 className="font-semibold text-gray-900">{bank.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{bank.description}</p>
                  {bank.comingSoon && <p className="text-xs text-blue-600 font-semibold mt-2">Coming Soon</p>}
                </button>
              ))}
            </div>

            {/* Benefits */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: '✓', title: 'Automatic Sync', desc: 'Real-time account updates' },
                { icon: '🔒', title: 'Secure', desc: 'OAuth authentication' },
                { icon: '📊', title: 'Smart', desc: 'Auto-categorization' },
              ].map((benefit, i) => (
                <div key={i} className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xl mb-1">{benefit.icon}</p>
                  <p className="font-semibold text-gray-900">{benefit.title}</p>
                  <p className="text-sm text-gray-600">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Revolut Connection Detail */
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🟦</span>
                <div>
                  <h3 className="font-bold text-gray-900">Connect Revolut</h3>
                  <p className="text-sm text-gray-600">Secure OAuth authentication via Revolut</p>
                </div>
              </div>

              <div className="space-y-3 mb-6 text-sm text-gray-700">
                <p>✓ Link your Revolut account securely</p>
                <p>✓ Import real transactions & balances</p>
                <p>✓ Support for all Revolut account types</p>
                <p>✓ Multi-currency support</p>
              </div>

              <button
                onClick={() => handleConnect('revolut')}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white active:scale-95'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </span>
                ) : (
                  'Continue to Revolut'
                )}
              </button>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-900">
                <strong>ℹ️ What happens next:</strong> You'll be redirected to Revolut to securely authenticate.
                After approval, your accounts and transactions will be imported automatically.
              </p>
            </div>

            {/* Back Button */}
            <button
              onClick={() => setSelectedBank(null)}
              disabled={loading}
              className="w-full py-2 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-all disabled:opacity-50"
          >
            Close
          </button>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
