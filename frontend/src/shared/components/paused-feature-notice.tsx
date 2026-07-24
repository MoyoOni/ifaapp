import { Link } from 'react-router-dom';
import { ArrowRight, Clock, type LucideIcon, X } from 'lucide-react';

// Shared "this feature isn't live yet" notice, styled after the Pods Network
// teaser (frontend/src/pages/PodsPage.tsx) but scaled to render inside the
// authenticated SidebarLayout shell rather than the standalone marketing
// shell. Purely presentational -- callers own any dismissal/localStorage
// state (see PIV-014's use in the Practice Center dashboard).
export interface PausedFeatureNoticeSecondaryAction {
  label: string;
  href: string;
  icon?: LucideIcon;
}

export interface PausedFeatureNoticeProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
  mailtoSubject: string;
  mailtoBody: string;
  secondaryAction?: PausedFeatureNoticeSecondaryAction;
  compact?: boolean;
  onDismiss?: () => void;
}

export function PausedFeatureNotice({
  icon: Icon,
  eyebrow,
  title,
  body,
  mailtoSubject,
  mailtoBody,
  secondaryAction,
  compact = false,
  onDismiss,
}: PausedFeatureNoticeProps) {
  const mailtoHref = `mailto:hello@iluase.com?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`;

  if (compact) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400">
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">{body}</p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notice"
            className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-amber-100 dark:hover:bg-amber-900/60 hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-16 px-4">
      <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
        <Clock size={12} /> {eyebrow}
      </div>
      <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center mx-auto mb-6">
        <Icon size={30} className="text-amber-600 dark:text-amber-400" />
      </div>
      <h1 className="brand-font text-3xl md:text-4xl font-bold text-foreground mb-4">{title}</h1>
      <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-10">
        {body}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        <a
          href={mailtoHref}
          className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl text-sm font-bold"
        >
          Notify Me <ArrowRight size={15} />
        </a>
        {secondaryAction && (
          <Link
            to={secondaryAction.href}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl text-sm font-semibold border border-border hover:bg-muted transition-colors"
          >
            {secondaryAction.icon && <secondaryAction.icon size={15} />}
            {secondaryAction.label}
          </Link>
        )}
      </div>
    </div>
  );
}
