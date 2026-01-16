/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationSettings } from '@/components/pwa/NotificationSettings';

// Mock the usePushNotifications hook
const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();
const mockUsePushNotifications = jest.fn();

jest.mock('@/hooks/usePushNotifications', () => ({
  usePushNotifications: () => mockUsePushNotifications(),
}));

describe('NotificationSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Not Supported', () => {
    it('should show not supported message when push is not available', () => {
      mockUsePushNotifications.mockReturnValue({
        isSupported: false,
        permission: 'default',
        isSubscribed: false,
        isLoading: false,
        error: null,
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
      });

      render(<NotificationSettings />);

      expect(screen.getByText('Notificaciones no disponibles')).toBeInTheDocument();
      expect(
        screen.getByText(/Tu navegador no soporta notificaciones push/)
      ).toBeInTheDocument();
    });

    it('should suggest supported browsers', () => {
      mockUsePushNotifications.mockReturnValue({
        isSupported: false,
        permission: 'default',
        isSubscribed: false,
        isLoading: false,
        error: null,
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
      });

      render(<NotificationSettings />);

      expect(screen.getByText(/Chrome, Firefox, Edge o Safari/)).toBeInTheDocument();
    });
  });

  describe('Permission Denied', () => {
    it('should show blocked message when permission is denied', () => {
      mockUsePushNotifications.mockReturnValue({
        isSupported: true,
        permission: 'denied',
        isSubscribed: false,
        isLoading: false,
        error: null,
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
      });

      render(<NotificationSettings />);

      expect(screen.getByText('Notificaciones bloqueadas')).toBeInTheDocument();
    });

    it('should explain how to enable notifications', () => {
      mockUsePushNotifications.mockReturnValue({
        isSupported: true,
        permission: 'denied',
        isSubscribed: false,
        isLoading: false,
        error: null,
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
      });

      render(<NotificationSettings />);

      expect(
        screen.getByText(/ve a la configuración de tu navegador/)
      ).toBeInTheDocument();
    });
  });

  describe('Not Subscribed', () => {
    it('should show subscribe button when not subscribed', () => {
      mockUsePushNotifications.mockReturnValue({
        isSupported: true,
        permission: 'default',
        isSubscribed: false,
        isLoading: false,
        error: null,
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
      });

      render(<NotificationSettings />);

      expect(screen.getByRole('button', { name: /Activar notificaciones/i })).toBeInTheDocument();
    });

    it('should show explanation text for non-subscribed state', () => {
      mockUsePushNotifications.mockReturnValue({
        isSupported: true,
        permission: 'default',
        isSubscribed: false,
        isLoading: false,
        error: null,
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
      });

      render(<NotificationSettings />);

      expect(
        screen.getByText(/Activa las notificaciones para recibir recordatorios/)
      ).toBeInTheDocument();
    });

    it('should call subscribe when button is clicked', () => {
      mockUsePushNotifications.mockReturnValue({
        isSupported: true,
        permission: 'default',
        isSubscribed: false,
        isLoading: false,
        error: null,
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
      });

      render(<NotificationSettings />);

      const button = screen.getByRole('button', { name: /Activar notificaciones/i });
      fireEvent.click(button);

      expect(mockSubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('Subscribed', () => {
    it('should show unsubscribe button when subscribed', () => {
      mockUsePushNotifications.mockReturnValue({
        isSupported: true,
        permission: 'granted',
        isSubscribed: true,
        isLoading: false,
        error: null,
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
      });

      render(<NotificationSettings />);

      expect(screen.getByRole('button', { name: /Desactivar notificaciones/i })).toBeInTheDocument();
    });

    it('should show subscribed explanation text', () => {
      mockUsePushNotifications.mockReturnValue({
        isSupported: true,
        permission: 'granted',
        isSubscribed: true,
        isLoading: false,
        error: null,
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
      });

      render(<NotificationSettings />);

      expect(
        screen.getByText(/Recibirás notificaciones de citas, recordatorios/)
      ).toBeInTheDocument();
    });

    it('should call unsubscribe when button is clicked', () => {
      mockUsePushNotifications.mockReturnValue({
        isSupported: true,
        permission: 'granted',
        isSubscribed: true,
        isLoading: false,
        error: null,
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
      });

      render(<NotificationSettings />);

      const button = screen.getByRole('button', { name: /Desactivar notificaciones/i });
      fireEvent.click(button);

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading State', () => {
    it('should show loading text when subscribing', () => {
      mockUsePushNotifications.mockReturnValue({
        isSupported: true,
        permission: 'default',
        isSubscribed: false,
        isLoading: true,
        error: null,
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
      });

      render(<NotificationSettings />);

      expect(screen.getByText('Activando...')).toBeInTheDocument();
    });

    it('should show loading text when unsubscribing', () => {
      mockUsePushNotifications.mockReturnValue({
        isSupported: true,
        permission: 'granted',
        isSubscribed: true,
        isLoading: true,
        error: null,
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
      });

      render(<NotificationSettings />);

      expect(screen.getByText('Desactivando...')).toBeInTheDocument();
    });

    it('should disable button when loading', () => {
      mockUsePushNotifications.mockReturnValue({
        isSupported: true,
        permission: 'default',
        isSubscribed: false,
        isLoading: true,
        error: null,
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
      });

      render(<NotificationSettings />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Error State', () => {
    it('should display error message when there is an error', () => {
      mockUsePushNotifications.mockReturnValue({
        isSupported: true,
        permission: 'default',
        isSubscribed: false,
        isLoading: false,
        error: 'Something went wrong',
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
      });

      render(<NotificationSettings />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should still show subscribe button when there is an error', () => {
      mockUsePushNotifications.mockReturnValue({
        isSupported: true,
        permission: 'default',
        isSubscribed: false,
        isLoading: false,
        error: 'Something went wrong',
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
      });

      render(<NotificationSettings />);

      expect(screen.getByRole('button', { name: /Activar notificaciones/i })).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      mockUsePushNotifications.mockReturnValue({
        isSupported: true,
        permission: 'default',
        isSubscribed: false,
        isLoading: false,
        error: null,
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
      });

      const { container } = render(<NotificationSettings className="custom-class" />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('custom-class');
    });
  });

  describe('Title', () => {
    it('should display "Notificaciones push" title', () => {
      mockUsePushNotifications.mockReturnValue({
        isSupported: true,
        permission: 'default',
        isSubscribed: false,
        isLoading: false,
        error: null,
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
      });

      render(<NotificationSettings />);

      expect(screen.getByText('Notificaciones push')).toBeInTheDocument();
    });
  });
});
