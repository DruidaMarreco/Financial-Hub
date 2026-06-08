import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useAuth } from "../hooks/useAuth";
import Layout from "../components/Layout";

export default function PortfolioPage() {
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!isAuthenticated) return null;

  return (
    <>
      <Head><title>Portfolio - Financial Hub</title></Head>
      <Layout title="Investment Portfolio">
        {/* Asset Allocation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20 animate-in fade-in duration-500">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">💼 Asset Allocation</h3>
            <div className="space-y-4">
              {[
                { icon: "📈", type: "Stocks", value: "$25,000", pct: "50%" },
                { icon: "🏦", type: "Bonds", value: "$15,000", pct: "30%" },
                { icon: "₿", type: "Crypto", value: "$10,000", pct: "20%" },
              ].map((asset, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg hover:shadow-md transition-all cursor-pointer">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{asset.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-900">{asset.type}</p>
                        <p className="text-sm text-gray-600">{asset.value}</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-blue-600">{asset.pct}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600" style={{ width: asset.pct }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20 animate-in fade-in duration-500" style={{ animationDelay: "100ms" }}>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">📊 Performance</h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Value</p>
                <p className="text-3xl font-bold text-gray-900">$50,000</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Gain/Loss</p>
                <p className="text-2xl font-bold text-green-600">+$5,240 (+10.5%)</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">YTD Return</p>
                <p className="text-2xl font-bold text-blue-600">+12.3%</p>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .animate-in { animation: fadeIn 0.3s ease-out; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `}</style>
      </Layout>
    </>
  );
}
