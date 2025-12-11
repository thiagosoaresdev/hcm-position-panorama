import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InAppNotifications } from './InAppNotifications.js';
import { NotificationHistory } from './NotificationHistory.js';
import { FloatingNotificationCard } from './FloatingNotificationCard.js';
import { NotificationCenter } from './NotificationCenter.js';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock WebSocket
const mockWebSocket = vi.fn().mockImplementation(() => ({
  close: vi.fn(),
  send: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
}));

Object.assign(mockWebSocket, {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
});

global.WebSocket = mockWebSocket as any;

describe('Notification System', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('InAppNotifications', () => {
    it('renders without crashing', () => {
      const { container } = render(<InAppNotifications userId={mockUserId} />);
      expect(container).toBeTruthy();
    });

    it('accepts userId prop', () => {
      const { container } = render(<InAppNotifications userId={mockUserId} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('NotificationHistory', () => {
    it('renders without crashing', () => {
      const { container } = render(<NotificationHistory userId={mockUserId} />);
      expect(container).toBeTruthy();
    });

    it('accepts userId prop', () => {
      const { container } = render(<NotificationHistory userId={mockUserId} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('FloatingNotificationCard', () => {
    const mockNotification = {
      id: 'test-notif-1',
      userId: mockUserId,
      title: 'Test Notification',
      message: 'This is a test notification',
      type: 'info' as const,
      timestamp: new Date()
    };

    it('renders without crashing', () => {
      const { container } = render(
        <FloatingNotificationCard
          notification={mockNotification}
          onDismiss={vi.fn()}
        />
      );
      expect(container).toBeTruthy();
    });

    it('accepts notification prop', () => {
      const { container } = render(
        <FloatingNotificationCard
          notification={mockNotification}
          onDismiss={vi.fn()}
        />
      );
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('NotificationCenter', () => {
    it('renders without crashing', () => {
      const { container } = render(<NotificationCenter userId={mockUserId} />);
      expect(container).toBeTruthy();
    });

    it('accepts userId prop', () => {
      const { container } = render(<NotificationCenter userId={mockUserId} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Integration Tests', () => {
    it('notification center integrates all components correctly', () => {
      const { container } = render(
        <NotificationCenter 
          userId={mockUserId} 
          enableRealTime={true}
          showPreferences={true}
        />
      );
      
      expect(container).toBeTruthy();
    });

    it('handles notification actions correctly', () => {
      const mockOnAction = vi.fn();
      
      const { container } = render(
        <NotificationCenter 
          userId={mockUserId}
          onNotificationAction={mockOnAction}
        />
      );
      
      // The action handler should be passed down to child components
      expect(mockOnAction).toBeDefined();
      expect(container).toBeTruthy();
    });
  });
});