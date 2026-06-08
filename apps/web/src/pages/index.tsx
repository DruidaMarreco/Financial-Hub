import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Financial Hub</title>
        <meta name="description" content="Your comprehensive financial data hub" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">Financial Hub</h1>
            <p className="text-xl text-gray-600 mb-8">
              Your comprehensive platform for aggregating and managing financial data
            </p>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-lg mb-2">Aggregate</h3>
                <p className="text-gray-600">Connect all your financial accounts in one place</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-lg mb-2">Analyze</h3>
                <p className="text-gray-600">Get insights into your financial health</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-lg mb-2">Track</h3>
                <p className="text-gray-600">Monitor portfolios and transactions in real-time</p>
              </div>
            </div>

            <p className="text-gray-500 mt-12">Coming soon...</p>
          </div>
        </div>
      </main>
    </>
  );
}
