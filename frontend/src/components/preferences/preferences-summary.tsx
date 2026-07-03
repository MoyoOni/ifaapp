import React from 'react';
import { usePreferences } from '../../contexts/preferences-context';

const PreferencesSummary: React.FC = () => {
  const { theme, notifications, privacy, accessibility } = usePreferences();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Current Preferences</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Theme</h3>
          <p className="capitalize text-blue-600 dark:text-blue-400">{theme}</p>
        </div>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Notifications</h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>Email: {notifications.email ? 'On' : 'Off'}</li>
            <li>Push: {notifications.push ? 'On' : 'Off'}</li>
            <li>SMS: {notifications.sms ? 'On' : 'Off'}</li>
          </ul>
        </div>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Privacy</h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>Profile Public: {privacy.showProfilePublicly ? 'Yes' : 'No'}</li>
            <li>Show Status: {privacy.showOnlineStatus ? 'Yes' : 'No'}</li>
            <li>Direct Msg: {privacy.allowMessaging ? 'Allowed' : 'Blocked'}</li>
          </ul>
        </div>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Accessibility</h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>Contrast: {accessibility.highContrast ? 'High' : 'Normal'}</li>
            <li>Font Size: {accessibility.fontSize}</li>
            <li>Motion: {accessibility.reduceMotion ? 'Reduced' : 'Normal'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PreferencesSummary;