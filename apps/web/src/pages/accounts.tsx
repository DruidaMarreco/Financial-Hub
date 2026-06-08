import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useAuth } from "../hooks/useAuth";
import Layout from "../components/Layout";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  institution: string;
  status: string;
}

interface FormData {
  accountName: string;
  bank: string;
  accountType: string;
  balance: string;
  currency: string;
}

export default function AccountsPage() {
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_accounts');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState<FormData>({
    accountName: '',
    bank: 'revolut',
    accountType: 'checking',
    balance: '',
    currency: 'EUR',
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    localStorage.setItem('user_accounts', JSON.stringify(accounts));
  }, [accounts]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountName || !formData.balance) {
      setError("Please fill in all required fields");
      return;
    }

    const newAccount: Account = {
      id: Date.now().toString(),
      name: formData.accountName,
      type: formData.accountType,
      balance: parseFloat(formData.balance),
      currency: formData.currency,
      institution: formData.bank,
      status: "connected",
    };

    setAccounts([...accounts, newAccount]);
    setFormData({
      accountName: '',
      bank: 'revolut',
      accountType: 'checking',
      balance: '',
      currency: 'EUR',
    });
    setShowForm(false);
    setError("");
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts(accounts.filter(acc => acc.id !== id));
    setSelectedAccount(null);
  };

  const bankOptions = [
    { value: 'revolut', label: '🟦 Revolut', emoji: '🟦' },
    { value: 'cgd', label: '🏦 Caixa Geral de Depósitos', emoji: '🏦' },
    { value: 'millennium', label: '🏦 Millennium BCP', emoji: '🏦' },
    { value: 'other', label: '💳 Other Bank', emoji: '💳' },
  ];

  const accountTypes = [
    { value: 'checking', label: 'Checking Account' },
    { value: 'savings', label: 'Savings Account' },
    { value: 'investment', label: 'Investment Account' },
  ];

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <>
      <Head>
        <title>Accounts - Financial Hub</title>
      </Head>

      <Layout title="Connected Accounts">
        {/* Error State */}
        {error && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl shadow-lg">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-semibold text-red-800 text-lg">Error</h3>
                  <p className="text-red-700 mt-1">{error}</p>
                  <button
                    onClick={() => setError("")}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all active:scale-95"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="text-gray-600 text-lg">
                Manage and monitor all your financial accounts in one place
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              + Add Account
            </button>
          </div>
        </div>

        {/* Add Account Form */}
        {showForm && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20 hover:shadow-xl transition-all">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Add Your Account</h3>

              <form onSubmit={handleAddAccount} className="space-y-6">
                {/* Account Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Account Name</label>
                  <input
                    type="text"
                    value={formData.accountName}
                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    placeholder="e.g., My Revolut Account"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Bank Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Bank / Institution</label>
                  <select
                    value={formData.bank}
                    onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  >
                    {bankOptions.map((bank) => (
                      <option key={bank.value} value={bank.value}>{bank.label}</option>
                    ))}
                  </select>
                </div>

                {/* Account Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Account Type</label>
                  <select
                    value={formData.accountType}
                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  >
                    {accountTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Balance */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Current Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                  </select>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all active:scale-95"
                  >
                    Save Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Accounts List or Empty State */}
        {accounts.length === 0 ? (
          <div className="animate-in fade-in duration-500">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center hover:border-blue-400 hover:shadow-lg transition-all">
              <div className="text-6xl mb-4">🏦</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Accounts Added Yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Add your Revolut, Caixa Geral de Depósitos, or other bank accounts to get started
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                Add Your First Account
              </button>

              {/* Supported Banks */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { icon: "🟦", name: "Revolut", desc: "Digital banking & wallet" },
                  { icon: "🏦", name: "Caixa Geral de Depósitos", desc: "Portuguese bank" },
                  { icon: "🏦", name: "Millennium BCP", desc: "Portuguese bank" },
                  { icon: "💳", name: "Any Bank", desc: "Manual entry for any institution" },
                ].map((bank, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-100 hover:shadow-md transition-all"
                  >
                    <div className="text-3xl mb-2">{bank.icon}</div>
                    <h4 className="font-semibold text-gray-900">{bank.name}</h4>
                    <p className="text-sm text-gray-600">{bank.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Card */}
            <div className="mb-8 animate-in fade-in duration-500">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
                <p className="text-white/80 text-lg mb-2">Total Balance</p>
                <h2 className="text-4xl font-bold mb-4">
                  {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </h2>
                <p className="text-white/70">Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Accounts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {accounts.map((account, idx) => (
                <div
                  key={account.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div
                    onClick={() => setSelectedAccount(account)}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-blue-400 hover:shadow-xl transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {account.name}
                        </h3>
                        <p className="text-sm text-gray-600 capitalize">{account.institution}</p>
                      </div>
                      <span className="text-2xl">
                        {bankOptions.find(b => b.value === account.institution)?.emoji || '💳'}
                      </span>
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-gray-600 text-sm mb-1">Balance</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {account.currency}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-600 text-sm mb-1">Type</p>
                        <p className="font-semibold text-gray-900 capitalize">{account.type}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAccount(account);
                        }}
                        className="w-full px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold rounded-lg transition-all active:scale-95"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Details Panel - Animated Slide In */}
        {selectedAccount && (
          <div className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-300" onClick={() => setSelectedAccount(null)}>
            <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl animate-in slide-in-from-right duration-300" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900">Account Details</h3>
                <button
                  onClick={() => setSelectedAccount(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Account Name</p>
                  <p className="text-xl font-bold text-gray-900">{selectedAccount.name}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Institution</p>
                  <p className="text-lg text-gray-900 capitalize">{selectedAccount.institution}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Account Type</p>
                  <p className="text-lg text-gray-900 capitalize">{selectedAccount.type}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Balance</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {selectedAccount.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedAccount.currency}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Status</p>
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold capitalize">
                    {selectedAccount.status}
                  </span>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setSelectedAccount(null)}
                    className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteAccount(selectedAccount.id);
                    }}
                    className="flex-1 px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-all active:scale-95"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Layout>

      <style>{`
        @keyframes slideInFromTop {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInFromRight {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInFromBottom {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: slideInFromTop 0.3s ease-out;
        }
        .slide-in-from-top-2 {
          animation: slideInFromTop 0.3s ease-out !important;
        }
        .slide-in-from-top-4 {
          animation: slideInFromTop 0.4s ease-out !important;
        }
        .slide-in-from-right {
          animation: slideInFromRight 0.3s ease-out !important;
        }
        .slide-in-from-bottom-4 {
          animation: slideInFromBottom 0.4s ease-out !important;
        }
        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
