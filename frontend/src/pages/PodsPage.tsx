import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Heart, ArrowRight, Shield, Sparkles, Globe2, Clock } from 'lucide-react';

const PLACEHOLDER_PODS = [
  { city: 'London', country: 'UK', flag: '🇬🇧', region: 'UK', members: 47, steward: 'Elder Adewale', desc: 'Monthly gatherings in East London. Study groups, naming ceremonies, seasonal festivals.' },
  { city: 'Lagos', country: 'Nigeria', flag: '🇳🇬', region: 'Nigeria', members: 83, steward: 'Baba Ifáṣewun', desc: 'The heartland Pod. Weekly study circles, Odù interpretation, community divination days.' },
  { city: 'Atlanta', country: 'USA', flag: '🇺🇸', region: 'Diaspora', members: 31, steward: 'Ìyánifá Àìná', desc: 'Southeast USA diaspora Pod. Bi-monthly ceremonies, ancestral veneration, youth mentorship.' },
  { city: 'Toronto', country: 'Canada', flag: '🇨🇦', region: 'Diaspora', members: 24, steward: 'TBA', desc: 'Growing Canadian community. Cultural orientation for new initiates in the diaspora.' },
  { city: 'Abuja', country: 'Nigeria', flag: '🇳🇬', region: 'Nigeria', members: 38, steward: 'TBA', desc: 'Federal Capital Territory Pod. Government workers, professionals, and culture-keepers.' },
  { city: 'Brixton', country: 'UK', flag: '🇬🇧', region: 'UK', members: 19, steward: 'TBA', desc: 'South London community — the Caribbean–Yorùbá Ifá crossroads. Unique syncretic heritage.' },
];

const EXPLAINER = [
  { icon: MapPin, colour: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400', title: 'Your City', body: 'Every Pod is anchored to a specific city or borough. Real neighbours. Real gatherings. Not just an online group.' },
  { icon: Users, colour: 'bg-primary/10 text-primary', title: 'Your Steward', body: 'Led by a verified elder or cultural facilitator. A Steward is not a social media admin — they are a community parent.' },
  { icon: Sparkles, colour: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400', title: 'Your Practice', body: 'Monthly study circles, seasonal ceremonies, shared resources. The platform powers it — the Steward makes it human.' },
];

const REGIONS = ['All', 'UK', 'Nigeria', 'Diaspora'];

export default function PodsPage() {
  const [activeRegion, setActiveRegion] = useState('All');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');

  const displayed = activeRegion === 'All' ? PLACEHOLDER_PODS : PLACEHOLDER_PODS.filter(p => p.region === activeRegion);

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const subject = encodeURIComponent(`Pod Waitlist${city ? ` - ${city}` : ''}`);
    const body = encodeURIComponent(`City: ${city || '(not specified)'}\nEmail: ${email}\n\nI'd like to be notified when the Pod Network launches in my city.`);
    window.location.href = `mailto:hello@iluase.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm brand-font">Ì</span>
            </div>
            <span className="font-bold text-lg brand-font text-foreground">Ìlú Àṣẹ</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">About</Link>
            <Link to="/login" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">Sign In</Link>
            <Link to="/signup" className="btn-primary text-sm py-2 px-5 rounded-xl">Get Started</Link>
          </div>
        </div>
      </header>

      <div className="pt-16">
        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="pt-20 pb-16 relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/8 via-transparent to-primary/8" />
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            {/* Coming Soon badge */}
            <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
              <Clock size={12} /> Coming 2026
            </div>
            <div className="text-5xl mb-4">🌍</div>
            <h1 className="brand-font text-4xl md:text-6xl font-bold text-foreground mb-6">
              The Pod Network
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-4">
              One global platform. Rooted in your city.
            </p>
            <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed mb-10">
              Pods are hyperlocal community clusters — groups of 20–80 practitioners in the same city, led by a trusted Steward, gathering monthly, sharing resources, and holding each other.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <a
                href="#waitlist"
                className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 py-4 px-8 rounded-2xl text-base"
              >
                Join the Waitlist <ArrowRight size={16} />
              </a>
              <a
                href={`mailto:hello@iluase.com?subject=Pod Steward Application&body=I'd like to apply to become a Pod Steward for my city.`}
                className="w-full sm:w-auto flex items-center justify-center gap-2 py-4 px-8 rounded-2xl text-base border border-border hover:bg-muted transition-colors font-semibold"
              >
                <Shield size={16} /> Apply as Steward
              </a>
            </div>
          </div>
        </section>

        {/* ── What is a Pod ──────────────────────────────────────────────── */}
        <section className="py-20 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <div className="inline-block text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-full mb-4">How It Works</div>
              <h2 className="brand-font text-3xl md:text-4xl font-bold text-foreground">What is a Pod?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {EXPLAINER.map(e => (
                <div key={e.title} className="bg-card border border-border rounded-2xl p-7 text-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 ${e.colour}`}>
                    <e.icon size={26} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-3">{e.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{e.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pod Grid (Blurred Coming Soon) ────────────────────────────── */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="brand-font text-2xl md:text-3xl font-bold text-foreground">Pods Launching Near You</h2>
                <p className="text-muted-foreground text-sm mt-1">These communities will go live when their Stewards are confirmed.</p>
              </div>
              {/* Region tabs */}
              <div className="flex bg-muted p-1 rounded-xl">
                {REGIONS.map(r => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setActiveRegion(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeRegion === r ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayed.map(pod => (
                <div key={pod.city} className="bg-card border border-amber-200 dark:border-amber-800/50 rounded-2xl overflow-hidden relative">
                  {/* Coming Soon ribbon */}
                  <div className="absolute top-3 right-3 z-10 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Clock size={9} /> Launching 2026
                  </div>
                  <div className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="text-3xl">{pod.flag}</div>
                      <div>
                        <h3 className="font-bold text-foreground text-base">{pod.city} Pod</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin size={11} /> {pod.city}, {pod.country}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{pod.desc}</p>
                    <div className="flex items-center justify-between">
                      {/* Blurred member count */}
                      <div className="flex items-center gap-1.5 text-sm text-foreground font-semibold">
                        <Users size={14} className="text-primary" />
                        <span className="blur-sm select-none">{pod.members} members</span>
                      </div>
                      <a
                        href={`mailto:hello@iluase.com?subject=Pod Waitlist - ${pod.city}&body=City: ${pod.city}\n\nI'd like to be notified when the ${pod.city} Pod launches.`}
                        className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                      >
                        Notify Me <ArrowRight size={11} />
                      </a>
                    </div>
                    {pod.steward !== 'TBA' && (
                      <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                        <Shield size={11} className="text-amber-600" />
                        <span>Steward: <span className="text-foreground font-semibold">{pod.steward}</span></span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Waitlist ──────────────────────────────────────────────────── */}
        <section id="waitlist" className="py-20 bg-muted/30">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <div className="text-4xl mb-4">📍</div>
            <h2 className="brand-font text-3xl md:text-4xl font-bold text-foreground mb-4">Be the First in Your City</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              We're confirming Stewards and building Pod infrastructure. Drop your city and email — we'll reach you when your local Pod is ready.
            </p>
            <form onSubmit={handleWaitlist} className="bg-card border border-border rounded-2xl p-6 sm:p-8 text-left space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Your City</label>
                <input
                  type="text"
                  placeholder="e.g. London, Lagos, Toronto..."
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold">
                Join the Pod Waitlist <ArrowRight size={15} />
              </button>
              <p className="text-xs text-muted-foreground text-center">No spam. One email when your city Pod is ready.</p>
            </form>
          </div>
        </section>

        {/* ── Steward CTA ──────────────────────────────────────────────── */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/8 via-transparent to-amber-500/8" />
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center mx-auto mb-6">
              <Shield size={30} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="brand-font text-3xl md:text-4xl font-bold text-foreground mb-4">Lead Your Community</h2>
            <p className="text-muted-foreground text-lg mb-2 max-w-xl mx-auto leading-relaxed">
              A Pod Steward is more than an organiser. You are the human anchor of your city's Ifá community.
            </p>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed text-sm">
              Stewards receive platform support, a monthly stipend (once the Pod reaches 30 members), and access to the Steward Training programme. You must be a practitioner or advanced initiate with community standing.
            </p>
            <a
              href="mailto:hello@iluase.com?subject=Pod Steward Application&body=Name:%0ACity:%0ATradition/lineage:%0AYears of practice:%0AWhy I want to be a Steward:"
              className="btn-primary inline-flex items-center gap-2 py-4 px-10 rounded-2xl text-base"
            >
              Apply to be a Steward <ArrowRight size={16} />
            </a>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <footer className="border-t border-border bg-muted/30 py-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-xs brand-font">Ì</span>
              </div>
              <span className="font-bold brand-font text-foreground">Ìlú Àṣẹ</span>
            </Link>
            <div className="flex items-center gap-5">
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <Link to="/circles" className="hover:text-foreground transition-colors">Circles</Link>
              <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link to="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
            </div>
            <span className="flex items-center gap-1">Made with <Heart size={10} className="text-highlight fill-highlight" /> for the diaspora</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
