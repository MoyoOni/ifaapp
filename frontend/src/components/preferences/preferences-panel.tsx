import React from 'react';
import { usePreferences } from '../../contexts/preferences-context';

interface PreferencesPanelProps {
  onSave?: () => void;
  onCancel?: () => void;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={checked ? 'Enabled' : 'Disabled'}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
        checked ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

const selectClass = 'w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';
const labelClass = 'block text-sm font-medium text-foreground mb-1.5';
const descClass = 'text-xs text-muted-foreground';

const PreferencesPanel: React.FC<PreferencesPanelProps> = ({ onSave, onCancel }) => {
  const prefs = usePreferences();

  const handleSave = () => {
    prefs.savePreferences();
    onSave?.();
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-5 text-foreground">Preferences</h2>
      <div className="space-y-6">

        <div>
          <label htmlFor="pref-language" className={labelClass}>Language</label>
          <select
            id="pref-language"
            value={prefs.language}
            onChange={e => prefs.updateLanguage(e.target.value)}
            className={selectClass}
          >
            <option value="en-US">English</option>
            <option value="yo">Yoruba</option>
            <option value="fr">French</option>
          </select>
        </div>

        <div>
          <label htmlFor="pref-dateFormat" className={labelClass}>Date Format</label>
          <select
            id="pref-dateFormat"
            value={prefs.dateFormat}
            onChange={e => prefs.updateDateFormat(e.target.value)}
            className={selectClass}
          >
            <option value="MM/dd/yyyy">MM/DD/YYYY</option>
            <option value="dd/MM/yyyy">DD/MM/YYYY</option>
            <option value="yyyy-MM-dd">YYYY-MM-DD</option>
          </select>
        </div>

        <div>
          <label htmlFor="pref-timeFormat" className={labelClass}>Time Format</label>
          <select
            id="pref-timeFormat"
            value={prefs.timeFormat}
            onChange={e => prefs.updateTimeFormat(e.target.value)}
            className={selectClass}
          >
            <option value="h:mm a">12-hour</option>
            <option value="HH:mm">24-hour</option>
          </select>
        </div>

        <div className="space-y-4">
          <p className={labelClass}>Notifications & Privacy</p>

          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Email Notifications</p>
            <Toggle checked={prefs.notifications.email} onChange={() => prefs.toggleEmailNotifications()} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Public Profile</p>
              <p className={descClass}>Allow others to view your profile</p>
            </div>
            <Toggle checked={prefs.privacy.showProfilePublicly} onChange={() => prefs.toggleShowProfilePublicly()} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Allow Messaging</p>
              <p className={descClass}>Allow others to send you messages</p>
            </div>
            <Toggle checked={prefs.privacy.allowMessaging} onChange={() => prefs.toggleAllowMessaging()} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Show Online Status</p>
              <p className={descClass}>Show others when you are online</p>
            </div>
            <Toggle checked={prefs.privacy.showOnlineStatus} onChange={() => prefs.toggleShowOnlineStatus()} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => { prefs.resetPreferences(); onCancel?.(); }}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesPanel;
