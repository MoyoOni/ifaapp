import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Users, BookOpen, ShoppingBag, MessageSquare,
  ArrowRight, CheckCircle2, Flame, Globe2, Heart,
  Shield, Sparkles, ChevronRight, MapPin, Clock
} from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Flame,
    colour: 'from-amber-500 to-orange-600',
    title: 'Connect with Your Babalawo',
    body: 'Find verified Ifá priests from your tradition. Book consultations, receive guidance plans, and build a lasting spiritual relationship — all in one sacred space.',
  },
  {
    icon: Building2,
    colour: 'from-emerald-500 to-teal-600',
    title: 'Discover Temples Near You',
    body: 'A growing directory of Ilé Ìjúbà and Ilé Ifá congregations. Filter by tradition, worship day, or location and find your spiritual home.',
  },
  {
    icon: BookOpen,
    colour: 'from-purple-500 to-indigo-600',
    title: 'Learn the Sacred Tradition',
    body: 'Courses taught by practising Babalawos and Ìyánifá. Study Odù Ifá, learn Yorùbá, explore Orìṣà worship at your own pace.',
  },
  {
    icon: ShoppingBag,
    colour: 'from-rose-500 to-pink-600',
    title: 'Sacred Items Marketplace',
    body: 'Sourced from verified vendors across Nigeria and the diaspora. Bead sets, divination tools, ritual herbs, and àṣọ-ọkẹ fabrics — delivered to your door.',
  },
  {
    icon: Users,
    colour: 'from-sky-500 to-blue-600',
    title: 'Community Circles & Forum',
    body: 'Join circles aligned with your path. Discuss traditions, ask questions, share experiences in a respectful community guided by elders.',
  },
  {
    icon: MessageSquare,
    colour: 'from-yellow-500 to-amber-600',
    title: 'Private Spiritual Guidance',
    body: 'Secure end-to-end encrypted messaging with your practitioner. Guidance plans, prescriptions, and follow-ups — in one organised thread.',
  },
];

const roles = [
  {
    title: 'Seekers & Initiates',
    subtitle: 'Your spiritual journey, guided.',
    colour: 'border-primary/30 bg-primary/5',
    badge: 'For Clients',
    badgeColour: 'bg-primary/20 text-primary',
    items: ['Find and book a Babalawo', 'Receive personalised guidance plans', 'Access curated academy courses', 'Join local temple communities', 'Shop sacred items securely'],
  },
  {
    title: 'Babalawos & Ìyánifá',
    subtitle: 'Grow your practice with tools built for you.',
    colour: 'border-highlight/30 bg-highlight/5',
    badge: 'For Practitioners',
    badgeColour: 'bg-highlight/20 text-highlight',
    items: ['Manage your availability and consultations', 'Issue guidance plans and prescriptions', 'Build a verified public profile', 'Receive payments in ₦ or $', 'Connect with your temple network'],
  },
  {
    title: 'Vendors & Artisans',
    subtitle: 'Sell your sacred craft to a global community.',
    colour: 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-900/10',
    badge: 'For Vendors',
    badgeColour: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    items: ['List unlimited sacred products', 'Reach clients across the diaspora', 'Manage orders and inventory', 'Integrated escrow payments', 'Revenue and analytics dashboard'],
  },
];

const steps = [
  { n: '01', title: 'Create Your Account', body: 'Join free. Tell us your role — seeker, practitioner, or vendor — and we personalise everything for you.' },
  { n: '02', title: 'Complete Your Profile', body: 'Add your traditions, interests, and location. Our matching system connects you with the right guides, temples, and community.' },
  { n: '03', title: 'Begin Your Journey', body: 'Book your first consultation, join a circle, browse the academy, or explore the marketplace. Your path is waiting.' },
];

const stats = [
  { value: 'Free', label: 'To Join — Always' },
  { value: '100%', label: 'Verified Practitioners' },
  { value: '6+', label: 'Integrated Features' },
  { value: 'Global', label: 'Diaspora & Homeland' },
];

const testimonials = [
  {
    name: 'Simbi T.',
    location: 'Atlanta, USA',
    text: 'I typed "Ifa priest near me" and got overwhelmed. No way to know who was trained, who was legitimate, who I could actually trust with something this personal. I needed somewhere that had already done that work for me.',
  },
  {
    name: 'Olumide F.',
    location: 'Manchester, UK',
    text: 'My grandmother was a devotee. When she passed, that knowledge went with her. I\'ve spent three years on scattered websites and dead Facebook groups trying to find my way back. I just needed one real place.',
  },
  {
    name: 'Babalawo Adeyemi',
    location: 'Lagos, Nigeria',
    text: 'My clients are in the UK, US, and Canada. I track consultations in WhatsApp, payments by bank transfer, guidance plans in notebooks. It works — but barely. A proper tool built for this would change everything.',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm brand-font">Ì</span>
            </div>
            <span className="font-bold text-lg brand-font text-foreground">Ìlú Àṣẹ</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#community" className="hover:text-foreground transition-colors">Community</a>
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link to="/signup" className="btn-primary text-sm py-2 px-5 rounded-xl">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-20 md:pt-36 md:pb-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-highlight/8 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
            <Sparkles size={12} />
            The Digital Sanctuary for Ifá Tradition
          </div>

          {/* Headline */}
          <h1 className="brand-font text-5xl sm:text-6xl md:text-7xl font-bold leading-tight text-foreground mb-6">
            Where the Ancient<br />
            <span className="text-primary">Tradition Lives</span> Online
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect with verified Babalawos, discover your temple, study the sacred texts, and build your community — wherever in the world you are.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/signup" className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 text-base py-4 px-8 rounded-2xl">
              Begin Your Journey <ArrowRight size={18} />
            </Link>
            <Link to="/babalawo" className="w-full sm:w-auto flex items-center justify-center gap-2 text-base py-4 px-8 rounded-2xl border border-border hover:bg-muted transition-colors font-semibold">
              Find a Babalawo <ChevronRight size={18} />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="brand-font text-3xl md:text-4xl font-bold text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground font-medium mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-full mb-4">Everything in One Place</div>
            <h2 className="brand-font text-4xl md:text-5xl font-bold text-foreground mb-4">
              Built for Every Part of Your Path
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From first consultation to deep initiation, Ìlú Àṣẹ supports every stage of your spiritual journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.colour} flex items-center justify-center mb-4`}>
                  <f.icon size={20} className="text-white" />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who It's For ────────────────────────────────────────────────── */}
      <section id="community" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-full mb-4">For Every Role</div>
            <h2 className="brand-font text-4xl md:text-5xl font-bold text-foreground mb-4">
              One Platform, Three Communities
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Whether you seek guidance, provide it, or create sacred goods — Ìlú Àṣẹ was designed with your role in mind.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {roles.map((r) => (
              <div key={r.title} className={`rounded-2xl border p-8 ${r.colour}`}>
                <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${r.badgeColour}`}>{r.badge}</span>
                <h3 className="font-bold text-foreground text-xl mt-4 mb-1 brand-font">{r.title}</h3>
                <p className="text-muted-foreground text-sm mb-6">{r.subtitle}</p>
                <ul className="space-y-3">
                  {r.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                      <CheckCircle2 size={16} className="text-primary flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className="mt-8 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card hover:bg-muted font-semibold text-sm transition-colors">
                  Get Started <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-full mb-4">Simple to Start</div>
            <h2 className="brand-font text-4xl md:text-5xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Three steps to begin your sacred journey on the platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-px bg-border" />

            {steps.map((s) => (
              <div key={s.n} className="text-center relative">
                <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground brand-font text-2xl font-bold flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/25">
                  {s.n}
                </div>
                <h3 className="font-bold text-foreground text-lg mb-3">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-full mb-4">Why This Exists</div>
            <h2 className="brand-font text-4xl md:text-5xl font-bold text-foreground mb-4">The Gap We're Closing</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Real voices. Real needs. This is why Ìlú Àṣẹ had to be built.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-card border border-border rounded-2xl p-6 flex flex-col">
                <span className="text-3xl text-primary/30 font-serif leading-none mb-3 select-none">"</span>
                <p className="text-foreground text-sm leading-relaxed mb-6 flex-1">{t.text}</p>
                <div>
                  <div className="font-bold text-foreground text-sm">{t.name}</div>
                  <div className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5">
                    <Globe2 size={10} /> {t.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pod Network (Coming Soon) ──────────────────────────────────── */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">
              <Clock size={11} /> Coming 2026
            </div>
            <h2 className="brand-font text-4xl md:text-5xl font-bold text-foreground mb-3">Pod Network</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              One global platform. Rooted in your city.
            </p>
          </div>

          {/* Placeholder pod cards — blurred coming soon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            {[
              { city: 'London', country: 'UK', flag: '🇬🇧', members: 47 },
              { city: 'Lagos', country: 'Nigeria', flag: '🇳🇬', members: 83 },
              { city: 'Atlanta', country: 'USA', flag: '🇺🇸', members: 31 },
            ].map(pod => (
              <div key={pod.city} className="bg-card border border-amber-200 dark:border-amber-800/50 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-3 right-3 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">
                  2026
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{pod.flag}</span>
                  <div>
                    <p className="font-bold text-foreground">{pod.city} Pod</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin size={10} /> {pod.city}, {pod.country}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-foreground font-semibold mb-4">
                  <Users size={13} className="text-primary" />
                  <span className="blur-sm select-none">{pod.members} members</span>
                </div>
                <Link
                  to="/pods"
                  className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  Notify Me <ArrowRight size={11} />
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/pods" className="inline-flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary transition-colors">
              Learn about the Pod Network <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-highlight/10" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-5xl mb-6">🔱</div>
          <h2 className="brand-font text-4xl md:text-5xl font-bold text-foreground mb-4">
            Your Path Is Here. Àṣẹ.
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
            Join a growing community of seekers, practitioners, and culture-keepers dedicated to preserving and living the Ifá tradition.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 text-base py-4 px-10 rounded-2xl">
              Join Free Today <ArrowRight size={18} />
            </Link>
            <Link to="/about" className="w-full sm:w-auto text-base py-4 px-8 rounded-2xl border border-border hover:bg-muted transition-colors font-semibold flex items-center justify-center gap-2">
              <Heart size={16} /> Our Story
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-muted/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-white font-bold text-sm brand-font">Ì</span>
                </div>
                <span className="font-bold text-lg brand-font text-foreground">Ìlú Àṣẹ</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                The Digital Sanctuary for Ifá Spiritual Community. Connecting seekers, practitioners, and tradition-keepers worldwide.
              </p>
              <div className="flex items-center gap-2 mt-6">
                <Shield size={14} className="text-primary" />
                <span className="text-xs text-muted-foreground">All practitioners are verified</span>
              </div>
            </div>

            {/* Platform */}
            <div>
              <h4 className="font-bold text-foreground text-sm uppercase tracking-wider mb-4">Platform</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link to="/babalawo" className="hover:text-foreground transition-colors">Find a Babalawo</Link></li>
                <li><Link to="/client/temples" className="hover:text-foreground transition-colors">Temples</Link></li>
                <li><Link to="/academy" className="hover:text-foreground transition-colors">Academy</Link></li>
                <li><Link to="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link></li>
                <li><Link to="/circles" className="hover:text-foreground transition-colors">Community Circles</Link></li>
                <li><Link to="/pods" className="hover:text-foreground transition-colors">Pod Network</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold text-foreground text-sm uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
                <li><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link to="/donate" className="hover:text-foreground transition-colors">Support Us</Link></li>
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Ìlú Àṣẹ. All rights reserved.</span>
            <span className="flex items-center gap-1">Made with <Heart size={10} className="text-highlight fill-highlight" /> for the diaspora and the homeland</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
