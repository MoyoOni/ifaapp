import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';

export interface NotificationPreferences {
  id?: string;
  userId: string;
  emailBooking: boolean;
  emailReminder: boolean;
  emailDigest: boolean;
  emailPlan: boolean;
  emailMessages: boolean;
  emailMarketing: boolean;
  pushReminder: boolean;
  pushMessages: boolean;
  pushFollowup: boolean;
  pushForum: boolean;
  pushCircles: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notification-preferences');
      setPreferences(response.data);
    } catch (err) {
      setError('Failed to load notification preferences');
      logger.error('Error fetching notification preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updatedPrefs: Partial<NotificationPreferences>) => {
    try {
      setSaving(true);
      const response = await api.patch('/notification-preferences', updatedPrefs);
      setPreferences(response.data);
      return response.data;
    } catch (err) {
      setError('Failed to update notification preferences');
      logger.error('Error updating notification preferences:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    preferences,
    loading,
    saving,
    error,
    fetchPreferences,
    updatePreferences,
  };
};