import { MessageSquare, MessagesSquare } from 'lucide-react';
import { PausedFeatureNotice } from '@/shared/components/paused-feature-notice';

const COPY = {
  eyebrow: 'Community Focus',
  title: 'Direct Messaging is Currently Paused',
  body: "To foster deeper community connection and reduce noise, we have paused 1:1 direct messaging. Please use the \"Ask a Babalawo\" section in the Forum for specific questions, or reach out to us directly at hello@iluase.com for support.",
  mailtoSubject: 'Feedback: Messaging Pause',
  mailtoBody: 'Hi Team, I have some thoughts on the messaging pause...',
};

// Renders for both /messages and /messages/:otherUserId -- the param is
// intentionally ignored, per product decision: a specific conversation
// link should show this notice in place, not redirect somewhere generic.
export default function MessagesPausedPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <PausedFeatureNotice
          icon={MessageSquare}
          eyebrow={COPY.eyebrow}
          title={COPY.title}
          body={COPY.body}
          mailtoSubject={COPY.mailtoSubject}
          mailtoBody={COPY.mailtoBody}
          secondaryAction={{ label: 'Ask a Babalawo in the Forum', href: '/forum', icon: MessagesSquare }}
        />
      </div>
    </div>
  );
}
