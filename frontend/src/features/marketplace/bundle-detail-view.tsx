import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, MessageSquareText, Check } from 'lucide-react';
import { FeatureHeader } from '@/shared/components/feature-header';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { useCart } from '@/shared/contexts/cart-context';
import { useToast } from '@/shared/components/toast';

interface BundleProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  vendorId: string;
  vendor: { businessName: string };
}

interface Bundle {
  id: string;
  name: string;
  description?: string;
  items: Array<{ productId: string; quantity: number; product: BundleProduct }>;
  totalPrice: number;
  available: boolean;
  ritualGuide?: string;
  guideSourceUrl?: string;
  supportThreadId?: string;
  reflectionThreadId?: string;
}

interface BundleDetailViewProps {
  bundleId: string;
}

// SHOP_BACKLOG.md MSP-019: Ritual Readiness Kits -- customer-facing detail
// view for an approved bundle, distinct from the compact homepage card.
const BundleDetailView: React.FC<BundleDetailViewProps> = ({ bundleId }) => {
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { success, error } = useToast();
  const [added, setAdded] = useState(false);
  const [showCustomizeForm, setShowCustomizeForm] = useState(false);
  const [haveItems, setHaveItems] = useState('');
  const [needItems, setNeedItems] = useState('');
  const queryClient = useQueryClient();

  const { data: bundle, isLoading } = useQuery<Bundle>({
    queryKey: ['marketplace-bundle', bundleId],
    queryFn: async () => (await api.get(`/marketplace/bundles/${bundleId}`)).data,
    enabled: !!bundleId,
  });

  const requestCustomization = useMutation({
    mutationFn: () =>
      api.post(`/marketplace/bundles/${bundleId}/customization-request`, { haveItems, needItems }),
    onSuccess: () => {
      success('Sent! The vendor will follow up.');
      setShowCustomizeForm(false);
      setHaveItems('');
      setNeedItems('');
      queryClient.invalidateQueries({ queryKey: ['marketplace-bundle', bundleId] });
    },
    onError: (err: any) => error(err?.response?.data?.error?.userMessage || 'Could not send request'),
  });

  const handleAddToCart = () => {
    if (!bundle) return;
    bundle.items.forEach((item) => {
      addItem({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        currency: item.product.currency,
        quantity: item.quantity,
        vendorId: item.product.vendorId,
        vendorName: item.product.vendor.businessName,
      });
    });
    setAdded(true);
  };

  if (isLoading) return <p className="text-sm text-muted-foreground py-6">Loading kit...</p>;
  if (!bundle) return <p className="text-sm text-muted-foreground py-6">Kit not found.</p>;

  return (
    <div className="py-6 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <FeatureHeader
        feature="marketplace"
        title={bundle.name}
        subtitle={bundle.description || 'A curated ritual readiness kit'}
        icon={Sparkles}
      />

      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h3 className="font-bold text-foreground mb-3">What's Included</h3>
        <ul className="space-y-2 mb-4">
          {bundle.items.map((item) => (
            <li key={item.productId} className="flex justify-between text-sm">
              <span className="text-foreground">
                {item.product.name} &times; {item.quantity}
              </span>
              <span className="text-muted-foreground">{item.product.vendor.businessName}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-xl font-bold text-primary">₦{bundle.totalPrice.toLocaleString()}</span>
          <button
            type="button"
            disabled={!bundle.available}
            onClick={handleAddToCart}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              !bundle.available
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : added
                  ? 'bg-primary/20 text-primary'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {!bundle.available ? 'Unavailable' : added ? <span className="flex items-center gap-1"><Check size={14} /> Added</span> : 'Add Kit to Cart'}
          </button>
        </div>
      </div>

      {bundle.ritualGuide && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h3 className="font-bold text-foreground mb-2">Ritual Guide</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{bundle.ritualGuide}</p>
          {bundle.guideSourceUrl && (
            <a
              href={bundle.guideSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-highlight text-xs font-medium hover:underline mt-3 inline-block"
            >
              Listen / view elder guidance →
            </a>
          )}
        </div>
      )}

      {(bundle.supportThreadId || bundle.reflectionThreadId) && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h3 className="font-bold text-foreground mb-3">Community</h3>
          <div className="flex flex-col gap-2">
            {bundle.supportThreadId && (
              <Link
                to={`/forum/${bundle.supportThreadId}`}
                className="inline-flex items-center gap-2 text-sm text-highlight hover:underline"
              >
                <MessageSquareText size={16} /> Ask questions before/during your ritual <ArrowRight size={12} />
              </Link>
            )}
            {bundle.reflectionThreadId && (
              <Link
                to={`/forum/${bundle.reflectionThreadId}`}
                className="inline-flex items-center gap-2 text-sm text-highlight hover:underline"
              >
                <MessageSquareText size={16} /> Share your reflection after <ArrowRight size={12} />
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-bold text-foreground mb-2">Need It Adjusted?</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Already have some of these items? Tell the vendor what you have and what you still need.
        </p>
        {!isAuthenticated ? (
          <p className="text-sm text-muted-foreground italic">Sign in to request a customization.</p>
        ) : !showCustomizeForm ? (
          <button
            type="button"
            onClick={() => setShowCustomizeForm(true)}
            className="text-sm font-medium text-highlight hover:underline"
          >
            Request customization
          </button>
        ) : (
          <div className="space-y-2">
            <input
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
              placeholder="I already have..."
              value={haveItems}
              onChange={(e) => setHaveItems(e.target.value)}
            />
            <input
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
              placeholder="I still need..."
              value={needItems}
              onChange={(e) => setNeedItems(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => requestCustomization.mutate()}
                disabled={!haveItems.trim() || !needItems.trim() || requestCustomization.isPending}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Send Request
              </button>
              <button
                type="button"
                onClick={() => setShowCustomizeForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BundleDetailView;
