import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Heart, Shield, Building2, Users, Zap, Star, Loader2, Crown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';

const seekerFeatures = [
  'Browse the Babalawo directory',
  'Discover temples near you',
  'Join Community Circles',
  'Access the public Forum',
  'Browse Academy previews',
  'View the Marketplace',
  'Basic messaging',
];

const devotedFeatures = [
  'Everything in Seeker',
  'Book unlimited consultations',
  'Receive detailed guidance plans',
  'Selected premium Academy courses',
  'Unlimited private messaging',
  'Free local delivery on marketplace orders above ₦100,000',
  'Priority customer support',
  'Early access to new features',
];

const practitionerFeatures = [
  'Verified Babalawo / Ìyánifá profile',
  'Manage availability & bookings',
  'Issue guidance plans & prescriptions',
  'Receive Paystack (₦) or Flutterwave ($) payments',
  'Client roster management',
  'Temple connection tools',
  'Revenue analytics dashboard',
  'Dedicated practice support',
];

const vendorFeatures = [
  'Unlimited product listings',
  'Full order & inventory management',
  'Integrated escrow payments',
  'Revenue analytics',
  'Verified vendor badge',
  'Access to global buyer community',
];

const templeFeatures = [
  'Verified temple listing',
  'Member management tools',
  'Events calendar',
  'Community circle hosting',
  'Donation collection tools',
  'Dedicated community manager',
  'Custom temple page',
];

const faqs = [
  { q: 'Is the Seeker plan really free forever?', a: 'Yes — no credit card required, no trial period. Seekers always have full free access to explore the community, browse practitioners, and discover temples.' },
  { q: 'What does the Devoted plan include?', a: 'Devoted members can book unlimited consultations, receive private guidance plans, access selected premium Academy courses, message practitioners without limits, and get free local delivery on marketplace orders above ₦100,000.' },
  { q: 'Why is the Practitioner plan free?', a: 'We believe practitioners should earn from their gift, not pay to offer it. Babalawos and Ìyánifá join and list for free — they earn directly from consultations and guidance plans.' },
  { q: 'What is the commission rate for practitioners?', a: 'Practitioners keep 90% of every consultation fee. The 10% platform fee covers payment processing, security infrastructure, and ongoing platform development.' },
  { q: 'What currency are prices shown in?', a: 'Prices are shown in Nigerian Naira (₦). International payments are also accepted in USD via Flutterwave. All transactions are fully secured.' },
  { q: 'How does practitioner verification work?', a: 'Practitioners submit credentials, references from elders, and undergo a review by our cultural advisory team. Verification typically takes 3–7 working days.' },
  { q: 'Can I cancel my Devoted plan?', a: 'Yes. Plans can be cancelled from your settings at any time. No lock-in, no cancellation fees.' },
];

const PricingPage: React.FC = () => {
  const [devotedPeriod, setDevotedPeriod] = useState<'quarterly' | 'annual'>('quarterly');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: publicStats } = useQuery<{ devotedCount: number; totalUsers: number }>({
    queryKey: ['subscription-public-stats'],
    queryFn: () => api.get('/subscriptions/public-stats').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const handleDevotedCheckout = async () => {
    if (!user) {
      navigate('/signup?next=/pricing');
      return;
    }
    try {
      setIsCheckingOut(true);
      const { data } = await api.post('/subscriptions/initiate', {
        plan: devotedPeriod === 'quarterly' ? 'QUARTERLY' : 'ANNUAL',
      });
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      logger.error('Checkout failed', err);
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm brand-font">Ì</span>
            </div>
            <span className="font-bold text-lg brand-font text-foreground">Ìlú Àṣẹ</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Sign In</Link>
            <Link to="/signup" className="btn-primary text-sm py-2 px-5 rounded-xl">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/3 w-80 h-80 bg-primary/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-highlight/6 rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="inline-block text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-full mb-6">Transparent Pricing</div>
          <h1 className="brand-font text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
            Simple Plans for Every Path
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Seekers always join free. Practitioners list free and earn. No hidden fees — just fair pricing rooted in the tradition.
          </p>
        </div>
      </section>

      {/* ── Main Three Plans ────────────────────────────────────────────── */}
      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

            {/* ── Seeker (Free) ── */}
            <div className="bg-card border border-border rounded-2xl p-8 flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Heart size={18} />
              </div>
              <h3 className="brand-font text-xl font-bold text-foreground mb-1">Seeker</h3>
              <p className="text-muted-foreground text-xs mb-6">For spiritual seekers and initiates</p>
              <div className="mb-8">
                <div className="text-3xl font-bold text-foreground brand-font">Always Free</div>
                <div className="text-xs text-muted-foreground mt-1">No credit card required</div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {seekerFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-foreground">
                    <CheckCircle2 size={15} className="text-primary flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border hover:bg-muted text-foreground font-semibold text-sm transition-all"
              >
                Join Free <ArrowRight size={14} />
              </Link>
            </div>

            {/* ── Devoted (Paid) — highlighted ── */}
            <div className="relative bg-primary/5 border border-primary rounded-2xl p-8 flex flex-col shadow-xl shadow-primary/10 scale-[1.02]">
              {/* Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow flex items-center gap-1">
                  <Star size={10} /> Most Popular
                </span>
              </div>

              <div className="w-10 h-10 rounded-xl bg-highlight/10 text-highlight flex items-center justify-center mb-4">
                <Zap size={18} />
              </div>
              <h3 className="brand-font text-xl font-bold text-foreground mb-1">Devoted</h3>
              <p className="text-muted-foreground text-xs mb-3">For serious seekers on the path</p>

              {/* Social proof */}
              {publicStats && publicStats.devotedCount > 0 && (
                <div className="flex items-center gap-1.5 mb-4 text-xs text-amber-700 dark:text-amber-400 font-semibold">
                  <Crown size={12} />
                  {publicStats.devotedCount.toLocaleString()} {publicStats.devotedCount === 1 ? 'member' : 'members'} already Devoted
                </div>
              )}

              {/* Period toggle */}
              <div className="inline-flex items-center gap-1 bg-muted rounded-xl p-1 mb-5 self-start">
                <button
                  type="button"
                  onClick={() => setDevotedPeriod('quarterly')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${devotedPeriod === 'quarterly' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  3 Months
                </button>
                <button
                  type="button"
                  onClick={() => setDevotedPeriod('annual')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${devotedPeriod === 'annual' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  1 Year
                </button>
              </div>

              <div className="mb-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-muted-foreground text-sm">₦</span>
                  <span className="text-4xl font-bold text-foreground brand-font">
                    {devotedPeriod === 'quarterly' ? '25,000' : '100,000'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {devotedPeriod === 'quarterly'
                    ? 'billed once for 3 months'
                    : 'billed once per year — save ₦0k vs quarterly'}
                </div>
                {devotedPeriod === 'annual' && (
                  <div className="text-xs font-bold text-primary mt-1">Same rate — pay once, focus on the path</div>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1 mt-6">
                {devotedFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-foreground">
                    <CheckCircle2 size={15} className="text-primary flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={handleDevotedCheckout}
                disabled={isCheckingOut}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl btn-primary font-semibold text-sm transition-all disabled:opacity-70"
              >
                {isCheckingOut ? (
                  <><Loader2 size={16} className="animate-spin" /> Redirecting to Paystack…</>
                ) : (
                  <>Start Your Journey <ArrowRight size={14} /></>
                )}
              </button>
            </div>

            {/* ── Practitioner (Free) ── */}
            <div className="bg-card border border-border rounded-2xl p-8 flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 flex items-center justify-center mb-4">
                <Shield size={18} />
              </div>
              <h3 className="brand-font text-xl font-bold text-foreground mb-1">Practitioner</h3>
              <p className="text-muted-foreground text-xs mb-6">For Babalawos, Ìyánifá & teachers</p>
              <div className="mb-8">
                <div className="text-3xl font-bold text-foreground brand-font">Free to List</div>
                <div className="text-xs text-muted-foreground mt-1">Earn directly from your practice — keep 90%</div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {practitionerFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-foreground">
                    <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border hover:bg-muted text-foreground font-semibold text-sm transition-all"
              >
                Apply as Practitioner <ArrowRight size={14} />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── Commission callout ───────────────────────────────────────────── */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="bg-card border border-border rounded-2xl p-8">
            <Users size={32} className="text-primary mx-auto mb-4" />
            <h3 className="brand-font text-2xl font-bold text-foreground mb-3">Practitioners Keep 90%</h3>
            <p className="text-muted-foreground leading-relaxed">
              Babalawos and Ìyánifá keep 90% of every consultation fee. The 10% platform fee covers payment processing,
              security infrastructure, and continuous platform development. We believe in fair economics for spiritual labour.
            </p>
          </div>
        </div>
      </section>

      {/* ── Vendor & Temple ─────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="brand-font text-3xl md:text-4xl font-bold text-foreground mb-3">For Vendors & Temples</h2>
            <p className="text-muted-foreground text-lg">Specialist plans for sacred commerce and congregational communities.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vendor */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 flex items-center justify-center mb-4">
                <Heart size={18} />
              </div>
              <h3 className="brand-font text-xl font-bold text-foreground mb-1">Sacred Vendor</h3>
              <p className="text-muted-foreground text-xs mb-4">For artisans and sacred goods suppliers</p>
              <div className="mb-2">
                <span className="text-2xl font-bold text-foreground brand-font">Pricing coming soon</span>
                <p className="text-xs text-muted-foreground mt-1">Reach out to discuss your store needs</p>
              </div>
              <ul className="space-y-3 my-6">
                {vendorFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-foreground">
                    <CheckCircle2 size={15} className="text-primary flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border hover:bg-muted font-semibold text-sm transition-colors">
                Open Your Shop <ArrowRight size={14} />
              </Link>
            </div>

            {/* Temple */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 flex items-center justify-center mb-4">
                <Building2 size={18} />
              </div>
              <h3 className="brand-font text-xl font-bold text-foreground mb-1">Temple / Ilé Ifá</h3>
              <p className="text-muted-foreground text-xs mb-4">For congregations and spiritual houses</p>
              <div className="mb-2">
                <span className="text-2xl font-bold text-foreground brand-font">Contact Us</span>
                <p className="text-xs text-muted-foreground mt-1">Many features are free for verified congregations</p>
              </div>
              <ul className="space-y-3 my-6">
                {templeFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-foreground">
                    <CheckCircle2 size={15} className="text-primary flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <a href="mailto:temples@iluase.com" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border hover:bg-muted font-semibold text-sm transition-colors">
                Register Your Temple <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQs ────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-full mb-4">FAQs</div>
            <h2 className="brand-font text-3xl md:text-4xl font-bold text-foreground">Common Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-card border border-border rounded-2xl p-6">
                <h4 className="font-bold text-foreground mb-2">{faq.q}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-4xl mb-6">🔱</div>
          <h2 className="brand-font text-3xl md:text-4xl font-bold text-foreground mb-4">Start Free. Upgrade When Ready.</h2>
          <p className="text-muted-foreground text-lg mb-8">The Seeker plan costs nothing and gives you full access to explore the community.</p>
          <Link to="/signup" className="btn-primary inline-flex items-center gap-2 py-4 px-10 rounded-2xl text-base">
            Create Free Account <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Ìlú Àṣẹ. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage;
