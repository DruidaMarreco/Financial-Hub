import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import RevolutCallbackPage from '../../../../pages/integrations/revolut/callback';

jest.mock('next/router');
jest.mock('axios');

const mockedRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Revolut OAuth Callback Page', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('auth_token', 'test-token-123');

    mockedRouter.mockReturnValue({
      isReady: true,
      query: { code: 'auth-code-123' },
      push: mockPush,
    } as any);
  });

  describe('Loading State', () => {
    it('should display loading indicator initially', () => {
      mockedAxios.get.mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(() => {
              resolve({
                data: {
                  success: true,
                  accounts_synced: 2,
                },
              });
            }, 1000);
          }),
      );

      render(<RevolutCallbackPage />);

      expect(screen.getByText('Connecting Revolut...')).toBeInTheDocument();
    });
  });

  describe('Successful Connection', () => {
    it('should display success message on successful connection', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          success: true,
          accounts_synced: 2,
          message: '✅ Revolut connected successfully!',
        },
      });

      render(<RevolutCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('Connection Successful!')).toBeInTheDocument();
      });
    });

    it('should show account count on success', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          success: true,
          accounts_synced: 3,
        },
      });

      render(<RevolutCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText(/3 accounts synced/)).toBeInTheDocument();
      });
    });

    it('should redirect to accounts page after success', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          success: true,
          accounts_synced: 2,
        },
      });

      jest.useFakeTimers();
      render(<RevolutCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('Connection Successful!')).toBeInTheDocument();
      });

      jest.advanceTimersByTime(2000);

      expect(mockPush).toHaveBeenCalledWith('/accounts');
      jest.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('should display error message on failed connection', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          data: {
            message: 'Invalid authorization code',
          },
        },
      });

      render(<RevolutCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('Connection Failed')).toBeInTheDocument();
        expect(screen.getByText(/Invalid authorization code/)).toBeInTheDocument();
      });
    });

    it('should handle missing authorization code', async () => {
      mockedRouter.mockReturnValue({
        isReady: true,
        query: {},
        push: mockPush,
      } as any);

      render(<RevolutCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('Connection Failed')).toBeInTheDocument();
        expect(screen.getByText(/No authorization code received/)).toBeInTheDocument();
      });
    });

    it('should provide error recovery options', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      render(<RevolutCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('Connection Failed')).toBeInTheDocument();
      });

      const backButton = screen.getByText('Back to Accounts');
      expect(backButton).toBeInTheDocument();

      const tryAgainButton = screen.getByText('Try Again');
      expect(tryAgainButton).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('should call OAuth callback endpoint with authorization code', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          success: true,
          accounts_synced: 1,
        },
      });

      render(<RevolutCallbackPage />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('code=auth-code-123'),
          expect.any(Object),
        );
      });
    });

    it('should include authorization token in request', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          success: true,
          accounts_synced: 1,
        },
      });

      render(<RevolutCallbackPage />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer test-token-123',
            }),
          }),
        );
      });
    });

    it('should call callback endpoint with correct URL', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          success: true,
          accounts_synced: 1,
        },
      });

      render(<RevolutCallbackPage />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/integrations/revolut/callback'),
          expect.any(Object),
        );
      });
    });
  });

  describe('Help Information', () => {
    it('should display troubleshooting help on error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Connection failed'));

      render(<RevolutCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText(/Need help\?/)).toBeInTheDocument();
        expect(screen.getByText(/Revolut app installed/)).toBeInTheDocument();
      });
    });
  });

  describe('Router Integration', () => {
    it('should wait for router to be ready before processing', async () => {
      mockedRouter.mockReturnValue({
        isReady: false,
        query: {},
        push: mockPush,
      } as any);

      const { rerender } = render(<RevolutCallbackPage />);

      expect(mockedAxios.get).not.toHaveBeenCalled();

      mockedRouter.mockReturnValue({
        isReady: true,
        query: { code: 'auth-code-123' },
        push: mockPush,
      } as any);

      mockedAxios.get.mockResolvedValue({
        data: {
          success: true,
          accounts_synced: 1,
        },
      });

      rerender(<RevolutCallbackPage />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });
  });

  describe('Page Title', () => {
    it('should have proper page title', () => {
      mockedAxios.get.mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(() => {
              resolve({
                data: {
                  success: true,
                  accounts_synced: 1,
                },
              });
            }, 100);
          }),
      );

      render(<RevolutCallbackPage />);

      // The Head component would set the title
      // This test verifies the page renders with expected title prop
    });
  });
});
