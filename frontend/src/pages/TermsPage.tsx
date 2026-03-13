import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-2">
    <h2 className="text-lg font-bold text-stone-800">{title}</h2>
    <div className="text-stone-600 text-sm leading-relaxed space-y-2">{children}</div>
  </section>
);

const TermsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-stone-100 shadow-sm p-8 md:p-12 space-y-8">
        {/* Header */}
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-stone-400 hover:text-stone-700 text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="text-3xl font-bold brand-font text-stone-900">Terms of Service</h1>
          <p className="text-stone-400 text-sm mt-1">
            Effective date: March 11, 2026 · Last updated: March 11, 2026
          </p>
        </div>

        <p className="text-stone-600 text-sm leading-relaxed">
          Welcome to <strong>Ilé Àṣẹ</strong> ("the Platform", "we", "us", or "our"). By creating an
          account or using our services you agree to these Terms of Service. Please read them carefully.
          If you do not agree, do not use the Platform.
        </p>

        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using Ilé Àṣẹ you confirm that you are at least 18 years old and have the
            legal capacity to enter into this agreement. If you use the Platform on behalf of an
            organisation, you represent that you have authority to bind that organisation.
          </p>
        </Section>

        <Section title="2. Description of Services">
          <p>
            Ilé Àṣẹ is a digital platform connecting seekers with verified Ifá/Isese practitioners
            (Babalawos), vendors of sacred items, and a broader community of practitioners. Services
            include consultation booking, spiritual guidance plans, a marketplace, community circles,
            forums, and an academy.
          </p>
          <p>
            We are a technology platform and do not ourselves provide spiritual, medical, legal, or
            financial advice. Any guidance received through the Platform is provided by independent
            practitioners.
          </p>
        </Section>

        <Section title="3. User Accounts">
          <p>
            You are responsible for maintaining the confidentiality of your account credentials. You
            must notify us immediately of any unauthorised access. We reserve the right to suspend or
            terminate accounts that violate these Terms.
          </p>
          <p>
            You agree to provide accurate, current, and complete information and to keep your profile
            up to date.
          </p>
        </Section>

        <Section title="4. Payments and Refunds">
          <p>
            Payments for consultations and marketplace purchases are processed through secure third-party
            payment providers (Paystack / Flutterwave). All amounts are displayed in Nigerian Naira (₦)
            unless stated otherwise.
          </p>
          <p>
            Refund eligibility is determined on a case-by-case basis in accordance with our Refund
            Policy. Disputes may be raised through the Platform's dispute resolution process.
          </p>
        </Section>

        <Section title="5. Prohibited Conduct">
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Impersonate any person or misrepresent your qualifications</li>
            <li>Upload harmful, abusive, or illegal content</li>
            <li>Attempt to circumvent Platform fees or payment systems</li>
            <li>Scrape, reverse-engineer, or otherwise misuse the Platform</li>
            <li>Use the Platform for fraudulent, harmful, or deceptive purposes</li>
          </ul>
        </Section>

        <Section title="6. Intellectual Property">
          <p>
            All Platform content (excluding user-submitted content) is owned by or licensed to Ilé Àṣẹ.
            You may not reproduce, distribute, or create derivative works without our written permission.
            You retain ownership of content you submit but grant us a licence to display it on the
            Platform.
          </p>
        </Section>

        <Section title="7. Limitation of Liability">
          <p>
            To the maximum extent permitted by applicable law, Ilé Àṣẹ shall not be liable for
            indirect, incidental, or consequential damages arising from your use of the Platform or
            from practitioner consultations. Our total liability to you shall not exceed the amounts
            paid by you to the Platform in the preceding three months.
          </p>
        </Section>

        <Section title="8. Termination">
          <p>
            We may suspend or terminate your access at any time for breach of these Terms. You may
            close your account at any time by contacting support. Termination does not affect any
            payment obligations already incurred.
          </p>
        </Section>

        <Section title="9. Changes to Terms">
          <p>
            We may update these Terms from time to time. We will notify you of material changes via
            email or an in-app notice. Continued use of the Platform after changes take effect
            constitutes acceptance.
          </p>
        </Section>

        <Section title="10. Governing Law">
          <p>
            These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall
            be subject to the exclusive jurisdiction of the courts of Lagos State, Nigeria.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            Questions about these Terms? Contact us at{' '}
            <a href="mailto:support@ilu-ase.com" className="text-highlight hover:underline">
              support@ilu-ase.com
            </a>
            .
          </p>
        </Section>

        <div className="pt-4 border-t border-stone-100 text-xs text-stone-400 text-center">
          © {new Date().getFullYear()} Ilé Àṣẹ · Digital Sanctuary for Ifá/Isese ·{' '}
          <a href="/privacy" className="hover:text-highlight transition-colors">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
