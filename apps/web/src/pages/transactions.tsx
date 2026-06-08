import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useAuth } from "../hooks/useAuth";
import Layout from "../components/Layout";

export default function TransactionsPage() {
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [loading, isAuthenticated, router]);

  const mockTransactions = [];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!isAuthenticated) return null;

  return (
    <>
      <Head><title>Transactions - Financial Hub</title></Head>
      <Layout title="Transactions">
        {/* Filters */}
        <div className="mb-8 bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">🔍 Search</label>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search transactions..." className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">🏷️ Category</label>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                <option value="all">All</option>
                <option value="food">Food</option>
                <option value="transport">Transport</option>
                <option value="shopping">Shopping</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">📊 Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                <option value="date">Date (Newest)</option>
                <option value="amount">Amount (High to Low)</option>
                <option value="category">Category</option>
              </select>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {mockTransactions.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center hover:border-blue-400 transition-all animate-in fade-in duration-500">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Transactions Yet</h3>
            <p className="text-gray-600">Connect an account to start tracking your transactions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mockTransactions.map((tx, idx) => (
              <div key={idx} className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-white/20 hover:shadow-lg transition-all animate-in fade-in duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{tx.merchant}</p>
                    <p className="text-sm text-gray-600">{tx.category}</p>
                  </div>
                  <p className="text-lg font-bold text-red-600">-${tx.amount}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <style>{`
          .animate-in { animation: fadeIn 0.3s ease-out; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `}</style>
      </Layout>
    </>
  );
}
