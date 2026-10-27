import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Store, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { isDevModeActive } from '@/shared/utils/dev-mode';
import { parseApiError } from '@/shared/utils/api-error';

// A VENDOR account with no Vendor (shop) profile used to be a dead end: the
// shop is only ever created during onboarding, which used to carry on as if it
// had worked when POST /marketplace/vendors failed, and never shows again once
// onboarding is complete. The vendor pages then rendered an empty, working-
// looking dashboard ("No products listed yet") on top of a shop that didn't
// exist. These pages now show this setup form instead.

export interface MyVendorProfile {
  id: string;
  businessName?: string;
  status?: string;
  [key: string]: unknown;
}

/** The signed-in vendor's shop profile; `needsSetup` when they don't have one yet. */
export function useMyVendorProfile() {
  const { user } = useAuth();
  const query = useQuery<MyVendorProfile>({
    queryKey: ['vendor-profile', user?.id],
    queryFn: async () => (await api.get('/marketplace/vendors/me')).data,
    enabled: !!user?.id && !isDevModeActive(),
    // "No shop yet" won't change by retrying.
    retry: (failureCount, err: any) => err?.response?.status !== 404 && failureCount < 3,
  });
  const needsSetup = (query.error as any)?.response?.status === 404;
  return { ...query, vendor: query.data, needsSetup };
}

export const VendorShopSetup: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [noCounterfeit, setNoCounterfeit] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { mutate: createShop, isPending } = useMutation({
    mutationFn: async () =>
      api.post('/marketplace/vendors', {
        businessName: businessName.trim(),
        description: description.trim() || undefined,
        noCounterfeitSpiritualItems: noCounterfeit,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor-profile', user?.id] }),
    onError: (err) => setFormError(parseApiError(err).userMessage),
  });

  return (
    <div className="max-w-xl mx-auto bg-card border border-border rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-highlight/10 text-highlight">
          <Store size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Set up your shop</h2>
          <p className="text-sm text-muted-foreground">You need a shop profile before you can list items or receive orders.</p>
        </div>
      </div>
      <div className="bg-highlight/10 border border-highlight/30 rounded-xl p-3 text-sm text-foreground">
        Your shop will be reviewed by our admin team before you can list products. This usually takes 1–2 business days.
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setFormError(null);
          if (businessName.trim()) createShop();
        }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <label htmlFor="shop-name" className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Business / Shop Name *</label>
          <input
            id="shop-name"
            type="text"
            required
            maxLength={100}
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Ẹkùn Ifá Sacred Supplies"
            className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="shop-description" className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
            Shop Description <span className="normal-case font-normal">(optional)</span>
          </label>
          <textarea
            id="shop-description"
            rows={3}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell the community what you sell and your connection to the tradition"
            className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-highlight/50 focus:border-highlight resize-none"
          />
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={noCounterfeit}
            onChange={(e) => setNoCounterfeit(e.target.checked)}
            className="w-4 h-4 mt-0.5 accent-primary"
          />
          <span className="text-sm text-muted-foreground">
            I agree not to sell counterfeit spiritual items or items that misrepresent their cultural origin
          </span>
        </label>
        {formError && (
          <div role="alert" className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle size={14} /> {formError}
          </div>
        )}
        <button
          type="submit"
          disabled={isPending || !businessName.trim()}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? <Loader2 size={16} className="animate-spin" /> : <Store size={16} />}
          {isPending ? 'Creating shop…' : 'Create my shop'}
        </button>
      </form>
    </div>
  );
};
