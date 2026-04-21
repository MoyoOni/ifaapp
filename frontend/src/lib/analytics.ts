import api from './api';

interface TrackPayload {
  event: string;
  userId?: string;
  role?: string;
  data?: Record<string, unknown>;
}

export const analytics = {
  track(event: string, props?: Omit<TrackPayload, 'event'>) {
    api.post('/analytics/events', { event, ...props }).catch(() => {});
  },
};
