import { useEffect, useRef } from 'react';
import api from '@/lib/api';
import { useToast } from '@/shared/components/toast';

/**
 * Polls for new orders every 30 seconds and shows a toast when new ones arrive.
 * Only active when the vendor is logged in and vendorId is known.
 */
export function useNewOrderNotifications(vendorId: string | undefined) {
  const toast = useToast();
  // Track the timestamp of the last known order to detect new ones
  const sinceRef = useRef<string>(new Date().toISOString());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!vendorId) return;

    const poll = async () => {
      try {
        const since = sinceRef.current;
        const res = await api.get('/marketplace/orders', {
          params: { vendorId, since },
        });
        const orders: Array<{ id: string; createdAt: string; totalAmount?: number }> =
          res.data?.orders ?? res.data ?? [];

        const newOrders = orders.filter(o => new Date(o.createdAt) > new Date(since));

        if (newOrders.length > 0) {
          // Advance the cursor to the most recent order
          const latest = newOrders.reduce((max, o) =>
            new Date(o.createdAt) > new Date(max) ? o.createdAt : max,
            since,
          );
          sinceRef.current = latest;

          if (newOrders.length === 1) {
            toast.success('You have a new order!', 'New Order');
          } else {
            toast.success(`${newOrders.length} new orders have arrived.`, 'New Orders');
          }
        }
      } catch {
        // Silently ignore network errors — don't spam the user
      }
    };

    // Poll every 30 seconds
    timerRef.current = setInterval(poll, 30_000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [vendorId]); // eslint-disable-line react-hooks/exhaustive-deps
}
