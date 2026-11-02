import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';
import { parseApiError } from '@/shared/utils/api-error';

type PrefKey = 'emailOrder' | 'pushOrder' | 'pushForum' | 'emailPlan' | 'emailMarketing';
type Preferences = Record<PrefKey, boolean>;

// Each toggle here changes what the platform actually sends: these are the
// NotificationPreferences fields NotificationService checks before emailing
// or pushing (November 2, 2026). The page used to offer SMS, consultation
// reminders, "community updates" and marketing switches that were saved
// nowhere and changed nothing.
const ROWS: Array<{ key: PrefKey; label: string; description: string }> = [
  { key: 'emailOrder', label: 'Order updates by email', description: 'Payment, shipping and delivery of your orders.' },
  { key: 'pushOrder', label: 'Order updates on your device', description: 'The same updates as push notifications.' },
  { key: 'pushForum', label: 'Forum replies and mentions', description: 'When someone replies to you or mentions you.' },
  { key: 'emailPlan', label: 'Guidance plan updates by email', description: 'When your babalawo updates or completes a plan.' },
  {
    key: 'emailMarketing',
    label: 'News and announcements',
    description: 'Occasional emails from Ìlú Àṣẹ about events and new features. Off unless you turn it on.',
  },
];

const Toggle: React.FC<{ label: string; description: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({
  label,
  description,
  checked,
  onChange,
  disabled,
}) => (
  <label className="flex items-center justify-between gap-4 p-4 bg-muted/40 rounded-xl">
    <span>
      <span className="font-medium text-foreground">{label}</span>
      <span className="block text-xs text-muted-foreground mt-0.5">{description}</span>
    </span>
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className="w-5 h-5 text-highlight rounded focus:ring-highlight shrink-0"
    />
  </label>
);

export const NotificationSettingsSection: React.FC<{ forumDigestOptIn: boolean; userId?: string }> = ({ forumDigestOptIn, userId }) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: prefs } = useQuery<Preferences>({
    queryKey: ['notification-preferences'],
    queryFn: async () => (await api.get('/notifications/preferences')).data,
  });

  // Local state drives the checkboxes so a click shows at once; a failed
  // save puts the box back.
  const [values, setValues] = useState<Partial<Preferences>>({});
  useEffect(() => {
    if (prefs) setValues(prefs);
  }, [prefs]);

  const savePref = useMutation({
    mutationFn: (patch: Partial<Preferences>) => api.patch('/notifications/preferences', patch),
    onError: (err, patch) => {
      setValues((v) => Object.fromEntries(Object.entries({ ...v, ...patch }).map(([k, val]) => [k, k in patch ? !val : val])));
      toast.error(parseApiError(err).userMessage);
    },
    onSuccess: (_res, patch) => {
      queryClient.setQueryData(['notification-preferences'], (old: Preferences | undefined) => (old ? { ...old, ...patch } : old));
      toast.success('Saved');
    },
  });
  const change = (key: PrefKey, on: boolean) => {
    setValues((v) => ({ ...v, [key]: on }));
    savePref.mutate({ [key]: on });
  };

  const [digest, setDigest] = useState(forumDigestOptIn);
  useEffect(() => setDigest(forumDigestOptIn), [forumDigestOptIn]);

  // The weekly forum digest is its own opt-in on the account (User.forumDigestOptIn).
  const saveDigest = useMutation({
    mutationFn: (on: boolean) => api.post('/gdpr/consent-preferences', { forumDigest: on }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings', userId] });
      toast.success('Saved');
    },
    onError: (err, on) => {
      setDigest(!on);
      toast.error(parseApiError(err).userMessage);
    },
  });

  return (
    <div className="space-y-3">
      {ROWS.map(({ key, label, description }) => (
        <Toggle
          key={key}
          label={label}
          description={description}
          checked={!!values[key]}
          disabled={!prefs}
          onChange={(v) => change(key, v)}
        />
      ))}
      <Toggle
        label="Weekly forum digest"
        description="A weekly email of the conversations you may have missed."
        checked={digest}
        onChange={(v) => {
          setDigest(v);
          saveDigest.mutate(v);
        }}
      />
    </div>
  );
};

/** WhatsApp alerts are only offered when the platform can send them. */
export const useWhatsAppAvailable = () =>
  useQuery<{ whatsapp: boolean }>({
    queryKey: ['notification-channels'],
    queryFn: async () => (await api.get('/notifications/preferences/channels')).data,
    staleTime: 60 * 60 * 1000,
  }).data?.whatsapp ?? false;
