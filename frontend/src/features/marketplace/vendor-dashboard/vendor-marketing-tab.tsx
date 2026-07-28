import React, { useState } from 'react';
import { Link as LinkIcon, Check, Share2 } from 'lucide-react';
import ReferralPanel from '@/features/devoted/referral-panel';

interface VendorMarketingTabProps {
  activeTab: string;
  storefrontUrl: string;
}

// VENDOR_BACKLOG.md VND-021
const VendorMarketingTab: React.FC<VendorMarketingTabProps> = ({ activeTab, storefrontUrl }) => {
  const [copied, setCopied] = useState(false);

  if (activeTab !== 'marketing') return null;

  const copyLink = () => {
    navigator.clipboard.writeText(storefrontUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Marketing & Sharing</h2>
        <p className="text-muted-foreground">Bring your existing audience to your Ìlú Àṣẹ storefront</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="font-bold text-foreground flex items-center gap-2"><LinkIcon size={16} /> Your Storefront Link</h3>
        <div className="flex gap-2">
          <div className="flex-1 bg-muted/60 border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground font-mono truncate">
            {storefrontUrl}
          </div>
          <button
            type="button"
            onClick={copyLink}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-highlight text-foreground text-sm font-bold hover:bg-secondary transition-colors flex-shrink-0"
          >
            {copied ? <Check size={14} /> : <LinkIcon size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-2">
        <h3 className="font-bold text-foreground flex items-center gap-2"><Share2 size={16} /> Share a Product</h3>
        <p className="text-sm text-muted-foreground">
          Every product page has a "Create Social Post" button that generates a ready-to-share image (name, price, your shop name) sized for Instagram, WhatsApp, and Twitter — plus a one-click copy link.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <ReferralPanel />
      </div>
    </div>
  );
};

export default VendorMarketingTab;
