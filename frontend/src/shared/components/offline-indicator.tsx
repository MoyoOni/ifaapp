import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, AlertCircle } from 'lucide-react';
import { isOnline, onOnlineStatusChange, getQueue } from '../utils/offline-queue';

/**
 * Offline Indicator Component
 * Shows connection status and queued actions count
 */
const OfflineIndicator: React.FC = () => {
  const [online, setOnline] = useState(isOnline());
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    // Listen for online/offline events
    const unsubscribe = onOnlineStatusChange((isOnline) => {
      setOnline(isOnline);
    });

    // Check queued actions periodically
    const checkQueue = () => {
      const queue = getQueue();
      setQueuedCount(queue.length);
    };

    checkQueue();
    const interval = setInterval(checkQueue, 5000); // Check every 5 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (online && queuedCount === 0) {
    return null; // Don't show when online and no queued actions
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 transition-all ${
        online
          ? queuedCount > 0
            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
            : 'bg-green-500/20 text-green-300 border border-green-500/30'
          : 'bg-red-500/20 text-red-300 border border-red-500/30'
      }`}
    >
      {online ? (
        queuedCount > 0 ? (
          <>
            <AlertCircle size={18} />
            <span className="text-sm font-medium">
              Syncing {queuedCount} action{queuedCount !== 1 ? 's' : ''}...
            </span>
          </>
        ) : (
          <>
            <Wifi size={18} />
            <span className="text-sm font-medium">Online</span>
          </>
        )
      ) : (
        <>
          <WifiOff size={18} />
          <span className="text-sm font-medium">
            Offline {queuedCount > 0 && `(${queuedCount} queued)`}
          </span>
        </>
      )}
    </div>
  );
};

export default OfflineIndicator;
