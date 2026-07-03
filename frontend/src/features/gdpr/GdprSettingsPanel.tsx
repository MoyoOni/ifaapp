import React, { useState } from 'react';
import { Download, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import { useToast } from '@/shared/components/toast';
import api from '@/lib/api';

interface ConsentPreferences {
  marketingEmails: boolean;
  dataProcessing: boolean;
  forumDigest: boolean;
}

interface User {
  id?: string;
  forumDigestOptIn?: boolean;
}

export const GdprSettingsPanel: React.FC = () => {
  const { user } = useAuth() as { user: User | null };
  const { success, error } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  // Since we only have forumDigestOptIn in the schema, we'll only use that
  const [consentPrefs, setConsentPrefs] = useState<ConsentPreferences>({
    marketingEmails: true, // Default value since it doesn't exist in schema
    dataProcessing: true,  // Default value since it doesn't exist in schema
    forumDigest: user?.forumDigestOptIn ?? true, // Use the actual value from user
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  const handleExportData = async () => {
    try {
      const response = await api.get('/gdpr/data-export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${user?.id}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success('Data export downloaded successfully');
    } catch (err) {
      console.error('Export error:', err);
      error('Failed to export data. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone and all your personal data will be permanently removed.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const { data } = await api.delete('/gdpr/delete-account');
      success(data.message || 'Account deletion initiated');
    } catch (err) {
      console.error('Deletion error:', err);
      error('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      await api.post('/gdpr/consent-preferences', { forumDigest: consentPrefs.forumDigest });
      success('Preferences updated successfully');
    } catch (err) {
      console.error('Update error:', err);
      error('Failed to update preferences. Please try again.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handlePrefChange = (pref: keyof ConsentPreferences, value: boolean) => {
    setConsentPrefs(prev => ({
      ...prev,
      [pref]: value
    }));
  };

  return (
    <div className="space-y-8">
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Download className="w-5 h-5" /> Data Portability
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          You have the right to receive your personal data in a structured, commonly used format.
        </p>
        <button
          onClick={handleExportData}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          <Download size={16} />
          Export My Data
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" /> Right to Erasure
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          You can request deletion of your personal data, subject to certain legal exceptions.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={isDeleting}
          className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Trash2 size={16} />
          {isDeleting ? 'Deleting...' : 'Delete My Account'}
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" /> Consent Preferences
        </h3>
        <p className="text-muted-foreground text-sm mb-6">
          Manage your consent preferences for data processing and communications.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Marketing Emails</p>
              <p className="text-sm text-muted-foreground">Receive promotional emails and updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={consentPrefs.marketingEmails}
                onChange={(e) => handlePrefChange('marketingEmails', e.target.checked)}
                className="sr-only peer"
                disabled // Disable since field doesn't exist in schema
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 rounded disabled:opacity-50"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Data Processing</p>
              <p className="text-sm text-muted-foreground">Allow processing of personal data for service provision</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={consentPrefs.dataProcessing}
                onChange={(e) => handlePrefChange('dataProcessing', e.target.checked)}
                className="sr-only peer"
                disabled // Disable since field doesn't exist in schema
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 rounded disabled:opacity-50"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Forum Digest</p>
              <p className="text-sm text-muted-foreground">Receive weekly forum activity summaries</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={consentPrefs.forumDigest}
                onChange={(e) => handlePrefChange('forumDigest', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 rounded"></div>
            </label>
          </div>
        </div>

        <button
          onClick={handleSavePreferences}
          disabled={savingPrefs}
          className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {savingPrefs ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};