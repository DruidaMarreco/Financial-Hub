import { useState } from 'react';
import axios from 'axios';

interface BankConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

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

export function BankConnectionModal({ isOpen, onClose, onSuccess }: BankConnectionModalProps) {
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async (bankId: string) => {
    if (bankId === 'revolut') {
      setLoading(true);
      setError('');

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
          },
        );

        // Redirect to Revolut OAuth
        window.location.href = response.data.auth_url;
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to initiate connection');
        setLoading(false);
      }
    } else {
      setError(`${bankId} coming soon`);
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

        {/* Error Message */}
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
      </div>
    </div>
  );
}
