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

export default function AccountsPage() {
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [loading, isAuthenticated, router]);

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

  const mockAccounts: Account[] = [];

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
                  <h3 className="font-semibold text-red-800 text-lg">Connection Error</h3>
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
              + Link New Account
            </button>
          </div>
        </div>

        {/* Add Account Form - Animated */}
        {showForm && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20 hover:shadow-xl transition-all">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Link Your First Account</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: "🏦", name: "Bank Account", desc: "Connect via Plaid" },
                  { icon: "💳", name: "Credit Card", desc: "Coming soon" },
                  { icon: "📈", name: "Investment", desc: "Coming soon" },
                ].map((type, idx) => (
                  <button
                    key={idx}
                    className="group p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all active:scale-95"
                  >
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                      {type.icon}
                    </div>
                    <h4 className="font-semibold text-gray-900">{type.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{type.desc}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="mt-6 w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Accounts List or Empty State */}
        {mockAccounts.length === 0 ? (
          <div className="animate-in fade-in duration-500">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center hover:border-blue-400 hover:shadow-lg transition-all">
              <div className="text-6xl mb-4">🏦</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Accounts Connected Yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Start connecting your financial accounts to get a complete view of your finances
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                Link Your First Account
              </button>

              {/* Feature Cards */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: "✅", title: "Auto-Sync", desc: "Updates automatically" },
                  { icon: "🔒", title: "Secure", desc: "Bank-level encryption" },
                  { icon: "📊", title: "Analytics", desc: "See all your data" },
                ].map((feature, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-100 hover:shadow-md transition-all"
                  >
                    <div className="text-2xl mb-2">{feature.icon}</div>
                    <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                    <p className="text-sm text-gray-600">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockAccounts.map((account, idx) => (
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
                      <p className="text-sm text-gray-600">{account.institution}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      {account.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Balance</p>
                      <p className="text-3xl font-bold text-gray-900">
                        ${account.balance.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600 text-sm mb-1">Type</p>
                      <p className="font-semibold text-gray-900">{account.type}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                    <button className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold rounded-lg transition-all active:scale-95">
                      View Details
                    </button>
                    <button className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all active:scale-95">
                      Disconnect
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Details Panel - Animated Slide In */}
        {selectedAccount && (
          <div className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-300">
            <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl animate-in slide-in-from-right duration-300">
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
                  <p className="text-lg text-gray-900">{selectedAccount.institution}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Balance</p>
                  <p className="text-3xl font-bold text-blue-600">
                    ${selectedAccount.balance.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAccount(null)}
                  className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition-all"
                >
                  Close
                </button>
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
