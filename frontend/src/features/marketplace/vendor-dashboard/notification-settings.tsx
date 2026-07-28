import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Package, Star, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

interface Preferences {
  emailOrder: boolean;
  pushOrder: boolean;
  emailReviewReceived: boolean;
  pushReviewReceived: boolean;
  emailLowStock: boolean;
  pushLowStock: boolean;
}

interface NotificationSettingsProps {
  activeTab: string;
}

const ROWS: Array<{ key: 'Order' | 'ReviewReceived' | 'LowStock'; icon: React.ElementType; label: string; description: string }> = [
  { key: 'Order', icon: Package, label: 'New Orders', description: 'When a customer places an order' },
  { key: 'ReviewReceived', icon: Star, label: 'Reviews', description: 'When a customer leaves a review on one of your products' },
  { key: 'LowStock', icon: AlertTriangle, label: 'Low Stock Alerts', description: 'Daily digest when a product drops below its low-stock threshold' },
];

// VENDOR_BACKLOG.md VND-004: "Vendor can toggle each notification type
// on/off... choose push only / email only / both." Disputes and withdrawal
// notifications are deliberately not shown here -- they're never gated by
// preference (see the schema comment on NotificationPreferences).
const NotificationSettings: React.FC<NotificationSettingsProps> = ({ activeTab }) => {
  const qc = useQueryClient();
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery<Preferences>({
    queryKey: ['notification-preferences'],
    queryFn: async () => (await api.get('/notifications/preferences')).data,
    enabled: activeTab === 'notifications',
  });

  useEffect(() => {
    if (data) setPrefs(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (next: Preferences) => api.patch('/notifications/preferences', next),
    onSuccess: () => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: ['notification-preferences'] });
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const toggle = (field: keyof Preferences) => {
    if (!prefs) return;
    const next = { ...prefs, [field]: !prefs[field] };
    setPrefs(next);
    saveMutation.mutate(next);
  };

  if (activeTab !== 'notifications') return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Notification Settings</h2>
        <p className="text-muted-foreground">Choose how you want to hear about activity on your shop</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={16} /> Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || !prefs ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <span></span>
                <span className="text-center">Email</span>
                <span className="text-center">Push</span>
              </div>
              {ROWS.map(({ key, icon: Icon, label, description }) => (
                <div key={key} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-start gap-2">
                    <Icon size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs[`email${key}` as keyof Preferences]}
                    onChange={() => toggle(`email${key}` as keyof Preferences)}
                    className="w-4 h-4 accent-primary justify-self-center"
                    aria-label={`${label} email`}
                  />
                  <input
                    type="checkbox"
                    checked={prefs[`push${key}` as keyof Preferences]}
                    onChange={() => toggle(`push${key}` as keyof Preferences)}
                    className="w-4 h-4 accent-primary justify-self-center"
                    aria-label={`${label} push`}
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-2">
                Disputes and payout confirmations are always sent by email and cannot be turned off.
              </p>
              {saved && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 size={14} /> Saved
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;
