import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { BankConnectionModal } from './BankConnectionModal';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BankConnectionModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('auth_token', 'test-token-123');
  });

  describe('Modal Visibility', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <BankConnectionModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
      render(
        <BankConnectionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      expect(screen.getByText('🏦 Connect Bank Account')).toBeInTheDocument();
    });

    it('should display bank selection options', () => {
      render(
        <BankConnectionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      expect(screen.getByText('🟦 Revolut')).toBeInTheDocument();
      expect(screen.getByText('🏦 Caixa Geral de Depósitos')).toBeInTheDocument();
      expect(screen.getByText('🍽️ Edenred')).toBeInTheDocument();
    });
  });

  describe('Bank Selection', () => {
    it('should show coming soon for CGD bank', async () => {
      render(
        <BankConnectionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      const cgdButton = screen.getByText('🏦 Caixa Geral de Depósitos').closest('button');
      expect(cgdButton).toBeDisabled();
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });

    it('should show coming soon for Edenred bank', async () => {
      render(
        <BankConnectionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      const edenredButton = screen.getByText('🍽️ Edenred').closest('button');
      expect(edenredButton).toBeDisabled();
    });

    it('should allow selection of Revolut', async () => {
      const user = userEvent.setup();
      render(
        <BankConnectionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      const revolutButton = screen.getByText('🟦 Revolut').closest('button');
      await user.click(revolutButton!);

      await waitFor(() => {
        expect(screen.getByText('Connect Revolut')).toBeInTheDocument();
      });
    });
  });

  describe('Revolut OAuth Flow', () => {
    it('should request OAuth URL from backend', async () => {
      const user = userEvent.setup();
      mockedAxios.post.mockResolvedValue({
        data: {
          auth_url: 'https://revolut.com/app/oauth?client_id=test&state=123',
          state: 'test-state-123',
        },
      });

      render(
        <BankConnectionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      const revolutButton = screen.getByText('🟦 Revolut').closest('button');
      await user.click(revolutButton!);

      const connectButton = await screen.findByText('Continue to Revolut');
      await user.click(connectButton);

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.stringContaining('/integrations/revolut/auth-url'),
          expect.any(Object),
          expect.any(Object),
        );
      });
    });

    it('should include auth token in OAuth request', async () => {
      const user = userEvent.setup();
      mockedAxios.post.mockResolvedValue({
        data: {
          auth_url: 'https://revolut.com/app/oauth?client_id=test',
          state: 'test-state',
        },
      });

      render(
        <BankConnectionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      const revolutButton = screen.getByText('🟦 Revolut').closest('button');
      await user.click(revolutButton!);

      const connectButton = await screen.findByText('Continue to Revolut');
      await user.click(connectButton);

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer test-token-123',
            }),
          }),
        );
      });
    });

    it('should handle OAuth error', async () => {
      const user = userEvent.setup();
      mockedAxios.post.mockRejectedValue(
        new Error('OAuth initialization failed'),
      );

      render(
        <BankConnectionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      const revolutButton = screen.getByText('🟦 Revolut').closest('button');
      await user.click(revolutButton!);

      const connectButton = await screen.findByText('Continue to Revolut');
      await user.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to initiate connection/)).toBeInTheDocument();
      });
    });

    it('should show loading state during connection', async () => {
      const user = userEvent.setup();
      mockedAxios.post.mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(() => {
              resolve({
                data: {
                  auth_url: 'https://revolut.com/app/oauth',
                  state: 'test-state',
                },
              });
            }, 100);
          }),
      );

      render(
        <BankConnectionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      const revolutButton = screen.getByText('🟦 Revolut').closest('button');
      await user.click(revolutButton!);

      const connectButton = await screen.findByText('Continue to Revolut');
      await user.click(connectButton);

      // Button should show loading state
      const loadingButton = screen.getByText(/Connecting/);
      expect(loadingButton).toBeInTheDocument();
    });
  });

  describe('Modal Controls', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <BankConnectionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close modal when X button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <BankConnectionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      const xButton = screen.getByText('✕');
      await user.click(xButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should allow going back from bank details', async () => {
      const user = userEvent.setup();
      render(
        <BankConnectionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      const revolutButton = screen.getByText('🟦 Revolut').closest('button');
      await user.click(revolutButton!);

      const backButton = await screen.findByText('← Back');
      await user.click(backButton);

      await waitFor(() => {
        expect(screen.getByText('Select a bank to get started:')).toBeInTheDocument();
      });
    });
  });

  describe('Benefits Display', () => {
    it('should display connection benefits', () => {
      render(
        <BankConnectionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      expect(screen.getByText('Automatic Sync')).toBeInTheDocument();
      expect(screen.getByText('Secure')).toBeInTheDocument();
      expect(screen.getByText('Smart')).toBeInTheDocument();
      expect(screen.getByText('Real-time account updates')).toBeInTheDocument();
      expect(screen.getByText('OAuth authentication')).toBeInTheDocument();
      expect(screen.getByText('Auto-categorization')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(
        <BankConnectionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should allow keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <BankConnectionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      const closeButton = screen.getByText('Close');
      closeButton.focus();

      await user.keyboard('{Enter}');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
