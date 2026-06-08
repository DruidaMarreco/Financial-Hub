import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

declare global {
  interface Window {
    Plaid?: any;
  }
}

interface PlaidLinkProps {
  onSuccess?: () => void;
  onExit?: () => void;
}

export function PlaidLink({ onSuccess, onExit }: PlaidLinkProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const initPlaid = async () => {
      try {
        // Load Plaid Script
        const script = document.createElement('script');
        script.src = 'https://cdn.plaid.com/link/v3/stable/link-initialize.js';
        script.async = true;

        script.onload = async () => {
          // Get link token from backend
          const response = await axios.post(
            `${API_URL}/plaid/link-token`,
            {},
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
              },
            },
          );

          const { link_token } = response.data;

          // Initialize Plaid Link
          if (window.Plaid) {
            const handler = window.Plaid.create({
              token: link_token,
              onSuccess: async (public_token: string, metadata: any) => {
                try {
                  // Exchange token on backend
                  await axios.post(
                    `${API_URL}/plaid/exchange-token`,
                    { publicToken: public_token, metadata },
                    {
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                      },
                    },
                  );

                  if (onSuccess) {
                    onSuccess();
                  }
                } catch (err) {
                  setError('Failed to link account. Please try again.');
                }
              },
              onExit: (err: any) => {
                if (err) {
                  setError(err.message || 'Plaid connection cancelled');
                }
                if (onExit) {
                  onExit();
                }
              },
            });

            handler.open();
            setLoading(false);
          }
        };

        document.body.appendChild(script);
      } catch (err: any) {
        setError(err.message || 'Failed to initialize Plaid');
        setLoading(false);
      }
    };

    initPlaid();
  }, [onSuccess, onExit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Initializing Plaid...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  return null;
}
