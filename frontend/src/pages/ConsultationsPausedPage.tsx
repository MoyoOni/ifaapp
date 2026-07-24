import { Calendar, MessagesSquare } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import { UserRole } from '@common';
import { PausedFeatureNotice } from '@/shared/components/paused-feature-notice';

const CLIENT_COPY = {
  eyebrow: 'Coming 2027',
  title: "We're Refining the Consultation Experience",
  body: "To ensure every interaction meets the high standards of Ìlú Àṣẹ, we are currently upgrading our booking and guidance tools. In the meantime, you can connect with verified Elders in the Forum or explore resources in the Marketplace.",
  mailtoSubject: 'Interest: Consultations Launch',
  mailtoBody: 'Hi Team, please notify me when Consultations go live in 2027.',
};

const PRACTITIONER_COPY = {
  eyebrow: 'Platform Update',
  title: 'Consultation Tools Paused Until 2027',
  body: 'We are building a more robust scheduling and earnings engine for our practitioners. Your historical data and past appointments remain fully visible in your Practice Center. New availability settings will return next year.',
  mailtoSubject: 'Practitioner Interest: Consultation Tools',
  mailtoBody: 'Hi Team, I am a practitioner interested in updates regarding the consultation tools.',
};

export default function ConsultationsPausedPage() {
  const { user } = useAuth();
  const copy = user?.role === UserRole.BABALAWO ? PRACTITIONER_COPY : CLIENT_COPY;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <PausedFeatureNotice
          icon={Calendar}
          eyebrow={copy.eyebrow}
          title={copy.title}
          body={copy.body}
          mailtoSubject={copy.mailtoSubject}
          mailtoBody={copy.mailtoBody}
          secondaryAction={
            user?.role !== UserRole.BABALAWO
              ? { label: 'Visit the Forum', href: '/forum', icon: MessagesSquare }
              : undefined
          }
        />
      </div>
    </div>
  );
}
