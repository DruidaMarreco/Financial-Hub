import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';

export default function VisualizationsPage() {
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/signin');
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Charts & Visualizations - Financial Hub</title>
      </Head>

      <Layout title="Charts & Visualizations">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Coming soon cards */}
          {[
            {
              icon: '📈',
              title: 'Spending Trends',
              description: 'Track your spending patterns over time with interactive line charts',
              status: 'Coming Soon'
            },
            {
              icon: '🥧',
              title: 'Category Breakdown',
              description: 'Visualize your expenses by category with pie charts',
              status: 'Coming Soon'
            },
            {
              icon: '🔥',
              title: 'Spending Heatmap',
              description: 'See which times of month you spend the most',
              status: 'Coming Soon'
            },
            {
              icon: '📊',
              title: 'Net Worth Growth',
              description: 'Watch your net worth increase over time',
              status: 'Coming Soon'
            },
          ].map((chart, idx) => (
            <div key={idx} className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20 hover:shadow-xl transition-all">
              <div className="text-4xl mb-4">{chart.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{chart.title}</h3>
              <p className="text-gray-600 mb-4">{chart.description}</p>
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                {chart.status}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">📊 Interactive Charts Coming Soon</h3>
          <p className="text-gray-700 mb-4">
            We're building beautiful, interactive visualizations using advanced charting libraries to help you better understand your financial data.
          </p>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center gap-3">
              <span className="text-blue-600">✓</span>
              Real-time data visualization
            </li>
            <li className="flex items-center gap-3">
              <span className="text-blue-600">✓</span>
              Interactive filters and date ranges
            </li>
            <li className="flex items-center gap-3">
              <span className="text-blue-600">✓</span>
              Export charts as images or PDFs
            </li>
            <li className="flex items-center gap-3">
              <span className="text-blue-600">✓</span>
              Custom chart configurations
            </li>
          </ul>
        </div>
      </Layout>
    </>
  );
}
