import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';

export default function RevolutCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [accountsCount, setAccountsCount] = useState(0);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { code } = router.query;

        if (!code) {
          setStatus('error');
          setMessage('No authorization code received from Revolut');
          return;
        }

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        // Call backend to exchange code for tokens and sync accounts
        const response = await axios.get(
          `${API_URL}/integrations/revolut/callback?code=${code}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            },
          },
        );

        setAccountsCount(response.data.accounts_synced || 0);
        setStatus('success');
        setMessage('✅ Revolut connected successfully!');

        // Redirect to accounts page after 2 seconds
        setTimeout(() => {
          router.push('/accounts');
        }, 2000);
      } catch (error: any) {
        setStatus('error');
        setMessage(
          error.response?.data?.message || 'Failed to connect Revolut account. Please try again.',
        );
      }
    };

    if (router.isReady && router.query.code) {
      handleCallback();
    }
  }, [router.isReady, router.query.code, router]);

  return (
    <>
      <Head>
        <title>Connecting Revolut...</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {status === 'loading' && (
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 text-center shadow-2xl">
              <div className="inline-block">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Connecting Revolut...</h2>
              <p className="text-gray-600">Authenticating and syncing your accounts</p>
            </div>
          )}

          {status === 'success' && (
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 text-center shadow-2xl animate-in fade-in duration-500">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Connection Successful!</h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-700 font-semibold">
                  🎉 {accountsCount} account{accountsCount !== 1 ? 's' : ''} synced
                </p>
                <p className="text-sm text-green-600 mt-1">Your transactions are being imported...</p>
              </div>
              <p className="text-sm text-gray-500">Redirecting to accounts page...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 text-center shadow-2xl animate-in fade-in duration-500">
              <div className="text-5xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Connection Failed</h2>
              <p className="text-red-600 font-semibold mb-6">{message}</p>

              <div className="space-y-3">
                <button
                  onClick={() => router.push('/accounts')}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all active:scale-95"
                >
                  Back to Accounts
                </button>
                <button
                  onClick={() => router.push('/accounts')}
                  className="w-full py-3 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all"
                >
                  Try Again
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
                <p className="text-sm text-blue-900">
                  <strong>Need help?</strong>
                  <br />
                  Make sure you have:
                  <br />
                  • Revolut app installed or account ready
                  <br />
                  • Two-factor authentication enabled
                  <br />
                  • Latest browser version
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
