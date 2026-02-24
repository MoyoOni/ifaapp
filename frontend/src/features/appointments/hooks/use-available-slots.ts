import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';

interface UseAvailableSlotsOptions {
    babalawoId: string;
    date: Date | null;
}

interface UseAvailableSlotsResult {
    slots: string[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

/**
 * Hook to fetch available time slots for a babalawo on a specific date
 * Calls GET /api/appointments/babalawo/:id/available-slots?date=YYYY-MM-DD
 */
export const useAvailableSlots = ({ babalawoId, date }: UseAvailableSlotsOptions): UseAvailableSlotsResult => {
    const [slots, setSlots] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSlots = useCallback(async () => {
        if (!babalawoId || !date) {
            setSlots([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Format date as YYYY-MM-DD
            const dateStr = date.toISOString().split('T')[0];
            const response = await api.get(`/appointments/babalawo/${babalawoId}/available-slots`, {
                params: { date: dateStr },
            });

            const data = response.data;

            // Backend returns array of time strings like ["10:00 AM", "11:00 AM", ...]
            setSlots(Array.isArray(data) ? data : []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            logger.error('Error fetching available slots:', err);

            // Fall back to demo slots if API fails (for demo purposes)
            setSlots(['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM']);
        } finally {
            setLoading(false);
        }
    }, [babalawoId, date]);

    useEffect(() => {
        fetchSlots();
    }, [fetchSlots]);

    return {
        slots,
        loading,
        error,
        refetch: fetchSlots,
    };
};
