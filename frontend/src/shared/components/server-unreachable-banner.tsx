import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CloudOff, RefreshCw } from 'lucide-react';
import { useServerUnreachable } from '@/shared/utils/server-reachability';

// Shown on every page while the API can't be reached, so an outage doesn't
// pass for "no content" (empty forum, "No Items Found") or for being signed out.
const ServerUnreachableBanner: React.FC = () => {
  const unreachable = useServerUnreachable();
  const queryClient = useQueryClient();
  const [retrying, setRetrying] = useState(false);

  if (!unreachable) return null;

  const retry = async () => {
    setRetrying(true);
    try {
      await queryClient.refetchQueries({ type: 'active' });
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div role="alert" className="sticky top-0 z-[60] bg-warning/15 border-b border-warning/40 text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-3 text-sm">
        <CloudOff size={18} className="text-warning shrink-0" />
        <p className="flex-1">
          <span className="font-semibold">We can't reach Ìlú Àṣẹ right now.</span>{' '}
          Some things may look empty or out of date until the connection is back.
        </p>
        <button
          type="button"
          onClick={retry}
          disabled={retrying}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning/20 hover:bg-warning/30 font-semibold disabled:opacity-60"
        >
          <RefreshCw size={14} className={retrying ? 'animate-spin' : ''} />
          {retrying ? 'Retrying…' : 'Retry'}
        </button>
      </div>
    </div>
  );
};

export default ServerUnreachableBanner;
