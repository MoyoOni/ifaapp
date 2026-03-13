import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-2">
    <h2 className="text-lg font-bold text-stone-800">{title}</h2>
    <div className="text-stone-600 text-sm leading-relaxed space-y-2">{children}</div>
  </section>
);

const PrivacyPage: React.FC = () => {
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
          <h1 className="text-3xl font-bold brand-font text-stone-900">Privacy Policy</h1>
          <p className="text-stone-400 text-sm mt-1">
            Effective date: March 11, 2026 · Last updated: March 11, 2026
          </p>
        </div>

        <p className="text-stone-600 text-sm leading-relaxed">
          Ilé Àṣẹ ("we", "us", "our") respects your privacy. This policy explains what data we
          collect, how we use it, and your rights. We comply with the Nigeria Data Protection
          Regulation (NDPR) and, where applicable, the EU General Data Protection Regulation (GDPR).
        </p>

        <Section title="1. Data We Collect">
          <p>We collect the following categories of personal data:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>
              <strong>Account data:</strong> name, email address, phone number, role, and password
              (stored as a bcrypt hash — never in plain text)
            </li>
            <li>
              <strong>Profile data:</strong> Yoruba name, bio, location, gender, avatar, and
              interests that you choose to provide
            </li>
            <li>
              <strong>Transaction data:</strong> payment history, wallet balances, and order records
              (payment card details are handled exclusively by our payment processors and never stored
              on our servers)
            </li>
            <li>
              <strong>Usage data:</strong> pages visited, actions taken, and error logs (via Sentry),
              collected to maintain service quality
            </li>
            <li>
              <strong>Communications:</strong> messages sent through the Platform's messaging system
            </li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Data">
          <p>We use your personal data to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Provide, operate, and improve the Platform</li>
            <li>Process payments and manage wallet transactions</li>
            <li>Send transactional emails (booking confirmations, email verification, receipts)</li>
            <li>Detect and prevent fraud and abuse</li>
            <li>Comply with legal obligations under Nigerian law</li>
            <li>Respond to support requests</li>
          </ul>
          <p>
            We do <strong>not</strong> sell your personal data to third parties.
          </p>
        </Section>

        <Section title="3. Third-Party Services">
          <p>We share limited data with the following trusted processors:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>
              <strong>Paystack / Flutterwave:</strong> payment processing (they receive payment
              details; we receive only a transaction reference)
            </li>
            <li>
              <strong>SendGrid:</strong> transactional email delivery (email address and name)
            </li>
            <li>
              <strong>Sentry:</strong> error monitoring (anonymised stack traces and session data;
              personally identifiable data is minimised)
            </li>
            <li>
              <strong>Google:</strong> optional Google Sign-In (if you choose this option, Google
              authenticates you and provides your email and name)
            </li>
          </ul>
          <p>
            All processors are contractually bound to use your data only for the purposes we specify.
          </p>
        </Section>

        <Section title="4. Data Retention">
          <p>
            We retain your account data for as long as your account is active. If you delete your
            account, we will delete or anonymise your personal data within 30 days, except where we
            are required to retain it for legal or financial compliance purposes (e.g., transaction
            records may be retained for up to 7 years under Nigerian tax law).
          </p>
        </Section>

        <Section title="5. Your Rights">
          <p>Under the NDPR (and GDPR where applicable), you have the right to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>
              <strong>Access:</strong> request a copy of the personal data we hold about you
            </li>
            <li>
              <strong>Rectification:</strong> correct inaccurate or incomplete data
            </li>
            <li>
              <strong>Erasure:</strong> request deletion of your data ("right to be forgotten")
            </li>
            <li>
              <strong>Portability:</strong> receive your data in a machine-readable format
            </li>
            <li>
              <strong>Objection:</strong> object to processing based on legitimate interests
            </li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{' '}
            <a href="mailto:privacy@ilu-ase.com" className="text-highlight hover:underline">
              privacy@ilu-ase.com
            </a>
            . We will respond within 30 days.
          </p>
        </Section>

        <Section title="6. Security">
          <p>
            We use industry-standard security measures including encrypted connections (HTTPS/TLS),
            bcrypt password hashing, JWT authentication, database encryption at rest, and role-based
            access controls. No system is perfectly secure; please protect your account credentials.
          </p>
        </Section>

        <Section title="7. Cookies">
          <p>
            We use session storage and localStorage to maintain your authentication state and
            preferences (e.g., theme, cart). We do not use third-party advertising cookies.
          </p>
        </Section>

        <Section title="8. Children">
          <p>
            The Platform is intended for users aged 18 and over. We do not knowingly collect data
            from children. If you believe a child has registered, please contact us immediately.
          </p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>
            We may update this policy periodically. We will notify you of material changes via email
            or an in-app notice. The "Last updated" date at the top will always reflect the current
            version.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            For privacy questions, contact our Data Protection Officer at{' '}
            <a href="mailto:privacy@ilu-ase.com" className="text-highlight hover:underline">
              privacy@ilu-ase.com
            </a>
            .
          </p>
        </Section>

        <div className="pt-4 border-t border-stone-100 text-xs text-stone-400 text-center">
          © {new Date().getFullYear()} Ilé Àṣẹ · Digital Sanctuary for Ifá/Isese ·{' '}
          <a href="/terms" className="hover:text-highlight transition-colors">
            Terms of Service
          </a>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
