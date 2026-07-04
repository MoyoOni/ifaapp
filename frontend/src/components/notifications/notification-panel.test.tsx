import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationPanel, type Notification } from './notification-panel';

// Mock the NotificationBadge component
vi.mock('./notification-badge', () => ({
  NotificationBadge: ({ count, onClick }: { count: number; onClick: () => void }) => (
    <button onClick={onClick} data-testid="notification-badge">
      Notifications ({count})
    </button>
  )
}));

describe('NotificationPanel', () => {
  const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'New Consultation Request',
      description: 'You have received a new consultation request from John Doe.',
      timestamp: new Date().toISOString(),
      read: false,
      type: 'info'
    },
    {
      id: '2',
      title: 'Appointment Reminder',
      description: 'Your appointment with Sarah is scheduled for tomorrow at 10:00 AM.',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      read: true,
      type: 'warning'
    },
    {
      id: '3',
      title: 'Achievement Unlocked',
      description: 'Congratulations! You have completed 100 consultations.',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      read: false,
      type: 'success',
      actionLabel: 'View Achievement',
      actionUrl: '/achievements/100'
    }
  ];

  const mockOnMarkAsRead = vi.fn();
  const mockOnMarkAllAsRead = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the notification badge', () => {
    render(
      <NotificationPanel 
        notifications={mockNotifications}
        onMarkAsRead={mockOnMarkAsRead}
        onMarkAllAsRead={mockOnMarkAllAsRead}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId('notification-badge')).toBeInTheDocument();
  });

  it('shows unread count correctly', () => {
    render(
      <NotificationPanel 
        notifications={mockNotifications}
        onMarkAsRead={mockOnMarkAsRead}
        onMarkAllAsRead={mockOnMarkAllAsRead}
        onClose={mockOnClose}
      />
    );

    // Click the badge to open the panel
    fireEvent.click(screen.getByTestId('notification-badge'));
    
    // Expect 2 unread notifications
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('renders notifications correctly', () => {
    render(
      <NotificationPanel 
        notifications={mockNotifications}
        onMarkAsRead={mockOnMarkAsRead}
        onMarkAllAsRead={mockOnMarkAllAsRead}
        onClose={mockOnClose}
      />
    );

    // Open the panel by clicking the badge
    fireEvent.click(screen.getByTestId('notification-badge'));

    // Check that notifications are rendered
    expect(screen.getByText('New Consultation Request')).toBeInTheDocument();
    expect(screen.getByText('Appointment Reminder')).toBeInTheDocument();
    expect(screen.getByText('Achievement Unlocked')).toBeInTheDocument();
  });

  it('calls onMarkAsRead when mark as read button is clicked', () => {
    render(
      <NotificationPanel 
        notifications={mockNotifications}
        onMarkAsRead={mockOnMarkAsRead}
        onMarkAllAsRead={mockOnMarkAllAsRead}
        onClose={mockOnClose}
      />
    );

    // Open the panel
    fireEvent.click(screen.getByTestId('notification-badge'));

    // Find and click the mark as read button for the first notification
    const markAsReadButtons = screen.getAllByText('Mark as read');
    fireEvent.click(markAsReadButtons[0]);

    expect(mockOnMarkAsRead).toHaveBeenCalledWith('1');
  });

  it('calls onMarkAllAsRead when mark all as read button is clicked', () => {
    render(
      <NotificationPanel 
        notifications={mockNotifications}
        onMarkAsRead={mockOnMarkAsRead}
        onMarkAllAsRead={mockOnMarkAllAsRead}
        onClose={mockOnClose}
      />
    );

    // Open the panel
    fireEvent.click(screen.getByTestId('notification-badge'));

    // Find and click the mark all as read button
    const markAllAsReadButton = screen.getByText('Mark all as read');
    fireEvent.click(markAllAsReadButton);

    expect(mockOnMarkAllAsRead).toHaveBeenCalled();
  });

  it('closes the panel when close button is clicked', () => {
    render(
      <NotificationPanel 
        notifications={mockNotifications}
        onMarkAsRead={mockOnMarkAsRead}
        onMarkAllAsRead={mockOnMarkAllAsRead}
        onClose={mockOnClose}
      />
    );

    // Open the panel
    fireEvent.click(screen.getByTestId('notification-badge'));

    // Find and click the close button
    const closeButton = screen.getByLabelText('Close notifications');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('renders empty state when no notifications exist', () => {
    render(
      <NotificationPanel 
        notifications={[]}
        onMarkAsRead={mockOnMarkAsRead}
        onMarkAllAsRead={mockOnMarkAllAsRead}
        onClose={mockOnClose}
      />
    );

    // Open the panel
    fireEvent.click(screen.getByTestId('notification-badge'));

    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
  });
});