import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useAuth } from "../hooks/useAuth";
import Layout from "../components/Layout";

export default function InsightsPage() {
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
      <Head><title>Insights - Financial Hub</title></Head>
      <Layout title="AI-Powered Insights">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { icon: "💡", title: "Spending Alert", desc: "Your groceries spending is 15% above average", color: "from-yellow-50 to-orange-50", border: "border-yellow-200" },
            { icon: "📈", title: "Growth Opportunity", desc: "Your savings rate improved by 8% this month", color: "from-green-50 to-emerald-50", border: "border-green-200" },
            { icon: "🎯", title: "Budget Recommendation", desc: "Set dining budget to $800 based on trends", color: "from-blue-50 to-cyan-50", border: "border-blue-200" },
            { icon: "⚠️", title: "Recurring Expense", desc: "Found 12 recurring subscriptions worth $245/mo", color: "from-red-50 to-pink-50", border: "border-red-200" },
          ].map((insight, idx) => (
            <div key={idx} className={`bg-gradient-to-br ${insight.color} rounded-2xl p-6 border-2 ${insight.border} hover:shadow-lg transition-all cursor-pointer animate-in fade-in duration-500`} style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="flex items-start gap-4">
                <span className="text-3xl">{insight.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{insight.title}</h3>
                  <p className="text-gray-700 text-sm mt-2">{insight.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <style>{`
          .animate-in { animation: fadeIn 0.3s ease-out; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `}</style>
      </Layout>
    </>
  );
}
