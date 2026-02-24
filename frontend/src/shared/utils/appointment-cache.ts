/**
 * Appointment Cache Utility
 * Caches appointment details for offline viewing
 */
import { logger } from '@/shared/utils/logger';

const APPOINTMENT_CACHE_KEY = 'ile-ase-appointments';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedAppointment {
  id: string;
  data: any;
  cachedAt: number;
}

/**
 * Cache appointment details
 */
export function cacheAppointment(appointmentId: string, appointmentData: any): void {
  try {
    const cache = getCachedAppointments();
    cache[appointmentId] = {
      id: appointmentId,
      data: appointmentData,
      cachedAt: Date.now(),
    };
    localStorage.setItem(APPOINTMENT_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    logger.error('Failed to cache appointment:', error);
  }
}

/**
 * Get cached appointment
 */
export function getCachedAppointment(appointmentId: string): any | null {
  try {
    const cache = getCachedAppointments();
    const cached = cache[appointmentId];
    
    if (!cached) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - cached.cachedAt > CACHE_TTL) {
      delete cache[appointmentId];
      localStorage.setItem(APPOINTMENT_CACHE_KEY, JSON.stringify(cache));
      return null;
    }

    return cached.data;
  } catch (error) {
    logger.error('Failed to get cached appointment:', error);
    return null;
  }
}

/**
 * Get all cached appointments
 */
function getCachedAppointments(): Record<string, CachedAppointment> {
  try {
    const stored = localStorage.getItem(APPOINTMENT_CACHE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    logger.error('Failed to get cached appointments:', error);
    return {};
  }
}

/**
 * Clear expired appointments
 */
export function clearExpiredAppointments(): void {
  try {
    const cache = getCachedAppointments();
    const now = Date.now();
    let hasChanges = false;

    Object.keys(cache).forEach((id) => {
      if (now - cache[id].cachedAt > CACHE_TTL) {
        delete cache[id];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      localStorage.setItem(APPOINTMENT_CACHE_KEY, JSON.stringify(cache));
    }
  } catch (error) {
    logger.error('Failed to clear expired appointments:', error);
  }
}
