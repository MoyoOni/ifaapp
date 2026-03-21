import React from 'react';
import { Heart, Globe, BookOpen, Users, ExternalLink, Star } from 'lucide-react';

// ─── Replace these with your actual links ───────────────────────────────────
const KOFI_URL = 'https://ko-fi.com/iluase';         // e.g. https://ko-fi.com/iluase
const PAYPAL_URL = 'https://paypal.me/iluase';       // e.g. https://paypal.me/iluase
// ────────────────────────────────────────────────────────────────────────────

const impacts = [
  { icon: Globe, label: 'Server & hosting costs', description: 'Keeping the platform available 24/7 globally' },
  { icon: BookOpen, label: 'Academy content', description: 'Producing Ifá educational materials and lessons' },
  { icon: Users, label: 'Temple onboarding', description: 'Helping temples and practitioners join for free' },
  { icon: Star, label: 'New features', description: 'Building tools the community actually needs' },
];

const DonatePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-highlight/20 flex items-center justify-center mx-auto mb-6">
            <Heart size={32} className="text-highlight" />
          </div>
          <h1 className="text-4xl font-bold brand-font text-foreground mb-4">
            Support Ìlú Àṣẹ
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Ìlú Àṣẹ is a community-funded platform. We charge no fees to temples or practitioners —
            your support keeps it that way and helps us preserve Ifá knowledge for generations to come.
          </p>
        </div>

        {/* Impact */}
        <div className="bg-card border border-border rounded-3xl p-8 mb-8">
          <h2 className="text-lg font-bold text-foreground mb-5">Your support goes towards</h2>
          <div className="space-y-4">
            {impacts.map(({ icon: Icon, label, description }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-highlight/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={17} className="text-highlight" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{label}</p>
                  <p className="text-muted-foreground text-sm">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Donate buttons */}
        <div className="space-y-4">
          <a
            href={KOFI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-highlight text-stone-900 font-bold text-base rounded-2xl hover:bg-yellow-400 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            <Heart size={20} />
            Support on Ko-fi
            <ExternalLink size={16} className="opacity-60" />
          </a>

          <a
            href={PAYPAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-card text-foreground font-bold text-base rounded-2xl border border-border hover:border-highlight/50 hover:bg-muted/50 transition-all"
          >
            <span className="text-[#003087] font-extrabold text-lg leading-none">Pay</span>
            <span className="text-[#009cde] font-extrabold text-lg leading-none">Pal</span>
            <span className="text-foreground font-bold">· Donate via PayPal</span>
            <ExternalLink size={16} className="opacity-40 ml-auto" />
          </a>
        </div>

        {/* Note */}
        <p className="text-center text-xs text-muted-foreground mt-8 leading-relaxed">
          Every contribution, no matter the size, is deeply appreciated.
          Àṣẹ — so it is, so it shall be. 🙏
        </p>

      </div>
    </div>
  );
};

export default DonatePage;
