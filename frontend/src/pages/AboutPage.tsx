import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Globe2, Shield, BookOpen, Users, Flame, ArrowRight } from 'lucide-react';

const values = [
  {
    icon: Shield,
    colour: 'bg-primary/10 text-primary',
    title: 'Àṣà — Cultural Integrity',
    body: 'Every feature is designed with the tradition in mind, not borrowed from generic tech. Ifá names, Yorùbá terms, correct protocols — we build with practitioners, not around them.',
  },
  {
    icon: Globe2,
    colour: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    title: 'Ilú — Community First',
    body: 'The diaspora deserves the same access to authentic tradition as those in the homeland. Ìlú Àṣẹ was built to bridge that distance without compromising depth.',
  },
  {
    icon: Shield,
    colour: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    title: 'Ìdájọ — Verified Trust',
    body: 'Every Babalawo and Ìyánifá goes through a verification process before being listed. We protect seekers from exploitation while uplifting legitimate practitioners.',
  },
  {
    icon: BookOpen,
    colour: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    title: 'Ìmọ̀ — Living Knowledge',
    body: 'The tradition is not a museum exhibit. Our Academy brings living teachers to learners worldwide, preserving oral tradition in a digital-age format.',
  },
  {
    icon: Heart,
    colour: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    title: 'Ìfẹ́ — Built with Love',
    body: 'This platform is a labour of devotion. We are practitioners, children of practitioners, and allies who believe this tradition deserves world-class digital infrastructure.',
  },
  {
    icon: Flame,
    colour: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    title: 'Àṣẹ — Sacred Power',
    body: 'We take seriously the sacred nature of what is exchanged here — consultations, guidance, ritual items. Privacy, security, and reverence are non-negotiable.',
  },
];

const AboutPage: React.FC = () => {
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
      <section className="pt-28 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-highlight/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-5xl mb-6">🌍</div>
          <h1 className="brand-font text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            We are Building the<br />
            <span className="text-primary">Sacred Digital Home</span><br />
            for the Ifá Tradition
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Ìlú Àṣẹ — "City of Sacred Power" — is a platform created by and for the global Ifá and Yorùbá spiritual community.
            We believe ancient wisdom deserves modern infrastructure.
          </p>
        </div>
      </section>

      {/* ── Story ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-full mb-6">Our Story</div>
              <h2 className="brand-font text-3xl md:text-4xl font-bold text-foreground mb-6 leading-tight">
                Born from a Real Problem
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Millions of people in the global African diaspora maintain a deep connection to Ifá tradition — yet finding a trusted Babalawo, connecting with a local temple, or accessing authentic learning materials remains needlessly difficult.
                </p>
                <p>
                  Meanwhile, practitioners who have dedicated decades to the tradition lack the digital tools to reach the seekers who need them. Sacred vendors sell hand-beaded items on general-purpose marketplaces next to plastic toys.
                </p>
                <p>
                  Ìlú Àṣẹ was founded to solve this. Not a side project — a purposeful platform built with the gravity the tradition deserves.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Platform Focus', value: 'Ifá & Yorùbá Tradition' },
                { label: 'Community', value: 'Global Diaspora + Homeland' },
                { label: 'Verification', value: 'Every Practitioner Vetted' },
                { label: 'Languages', value: 'English & Yorùbá' },
              ].map((s) => (
                <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
                  <div className="font-bold text-foreground text-lg brand-font">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission ─────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-block text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-full mb-6">Our Mission</div>
          <blockquote className="brand-font text-3xl md:text-4xl font-bold text-foreground leading-snug mb-8">
            "To preserve, protect, and amplify the Ifá tradition by building the most trusted digital infrastructure for its global community."
          </blockquote>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We measure success not in metrics, but in meaningful connections — a seeker finding the right guide, a practitioner reaching the diaspora, a temple welcoming its next initiate.
          </p>
        </div>
      </section>

      {/* ── Values ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-full mb-4">Our Values</div>
            <h2 className="brand-font text-3xl md:text-4xl font-bold text-foreground">What Guides Every Decision</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-card border border-border rounded-2xl p-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${v.colour}`}>
                  <v.icon size={18} />
                </div>
                <h3 className="font-bold text-foreground mb-2">{v.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pod Network ─────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-4xl mb-4">🌍</div>
          <h2 className="brand-font text-2xl md:text-3xl font-bold text-foreground mb-4">The Pod Network</h2>
          <p className="text-muted-foreground leading-relaxed text-base max-w-2xl mx-auto">
            The Pod Network is how Ìlú Àṣẹ becomes local. Every major city will have a Pod — a small group of practitioners led by a trusted Steward, meeting monthly, sharing resources, and supporting each other offline. Pods are the bridge between the global platform and your real neighbourhood. They are coming in 2026.
          </p>
          <Link to="/pods" className="inline-flex items-center gap-2 mt-6 text-sm font-bold text-primary hover:underline">
            Learn about Pods <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── Who Builds It ───────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-block text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-full mb-6">The Team</div>
          <h2 className="brand-font text-3xl md:text-4xl font-bold text-foreground mb-6">Built by Believers</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            Our team includes practitioners, initiates, culture bearers, and technologists united by a single purpose: to give this tradition the platform it deserves.
          </p>
          <div className="bg-card border border-border rounded-2xl p-8 max-w-2xl mx-auto">
            <div className="flex flex-col items-center gap-4">
              <Users size={40} className="text-primary" />
              <p className="text-foreground font-medium">
                We are a small, devoted team. If you share our mission and want to contribute — as a developer, practitioner, or cultural advisor — we would love to hear from you.
              </p>
              <a href="mailto:hello@iluase.com" className="btn-primary flex items-center gap-2 mt-2 rounded-xl py-3 px-6 text-sm">
                Reach Out <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-5xl mb-6">🔱</div>
          <h2 className="brand-font text-3xl md:text-4xl font-bold text-foreground mb-4">Join the Community</h2>
          <p className="text-muted-foreground text-lg mb-8">Be part of a growing global network rooted in one of humanity's oldest and most profound spiritual traditions.</p>
          <Link to="/signup" className="btn-primary inline-flex items-center gap-2 py-4 px-10 rounded-2xl text-base">
            Create Your Account <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Ìlú Àṣẹ. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
