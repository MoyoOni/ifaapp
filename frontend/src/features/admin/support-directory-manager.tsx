import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';
import { parseApiError } from '@/shared/utils/api-error';
import type { SupportResource } from '@/features/community/support-directory';

interface AdminSupportResource extends SupportResource {
  isActive: boolean;
  sortOrder: number;
}

const EMPTY = { name: '', country: '', helpsWith: '', phone: '', url: '', description: '' };

// FOR-015/FOR-017: admins keep the support directory members see on the
// wellbeing page and the remembrance wall. Only real, checked organisations.
const SupportDirectoryManager: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [form, setForm] = useState(EMPTY);

  const { data: resources = [], isLoading } = useQuery<AdminSupportResource[]>({
    queryKey: ['admin-support-resources'],
    queryFn: async () => (await api.get('/support-resources/all')).data ?? [],
  });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-support-resources'] });
    queryClient.invalidateQueries({ queryKey: ['support-resources'] });
  };

  const create = useMutation({
    mutationFn: () => {
      // Send only filled-in optional fields; empty strings fail validation.
      const body = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v !== ''));
      return api.post('/support-resources', body);
    },
    onSuccess: () => {
      success('Added to the support directory');
      setForm(EMPTY);
      refresh();
    },
    onError: (err) => error(parseApiError(err).userMessage),
  });
  const toggle = useMutation({
    mutationFn: (r: AdminSupportResource) => api.patch(`/support-resources/${r.id}`, { isActive: !r.isActive }),
    onSuccess: refresh,
    onError: (err) => error(parseApiError(err).userMessage),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/support-resources/${id}`),
    onSuccess: refresh,
    onError: (err) => error(parseApiError(err).userMessage),
  });

  const field = (key: keyof typeof EMPTY, label: string, placeholder: string, required = false) => (
    <label className="block text-sm">
      <span className="font-medium text-foreground">
        {label}
        {required && ' *'}
      </span>
      <input
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
    </label>
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Organisations members are pointed to on the wellbeing page and the remembrance wall. Add only services you have
        checked are real and current. Each needs a phone number or a website.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="bg-card border border-border rounded-2xl p-5 grid gap-3 sm:grid-cols-2"
        aria-label="Add a support organisation"
      >
        {field('name', 'Organisation', 'Name of the service', true)}
        {field('country', 'Country', 'e.g. Nigeria, or International', true)}
        {field('helpsWith', 'Helps with', 'e.g. Crisis and suicide prevention', true)}
        {field('phone', 'Phone', '+234 …')}
        {field('url', 'Website', 'https://…')}
        {field('description', 'Note', 'Hours, languages, anything else useful')}
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={create.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
          >
            {create.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add Organisation
          </button>
        </div>
      </form>

      {isLoading ? (
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      ) : resources.length === 0 ? (
        <p className="text-sm text-muted-foreground">No organisations yet. Members are shown only hello@iluase.com.</p>
      ) : (
        <ul className="space-y-3">
          {resources.map((r) => (
            <li key={r.id} className={`bg-card border border-border rounded-xl p-4 ${r.isActive ? '' : 'opacity-60'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">
                    {r.name} <span className="text-xs text-muted-foreground font-normal">· {r.country}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{r.helpsWith}</p>
                  <p className="text-xs text-muted-foreground mt-1">{[r.phone, r.url].filter(Boolean).join(' · ')}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggle.mutate(r)}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted"
                  >
                    {r.isActive ? 'Hide' : 'Show'}
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${r.name}`}
                    onClick={() => window.confirm(`Delete ${r.name}?`) && remove.mutate(r.id)}
                    className="px-2 py-1.5 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SupportDirectoryManager;
