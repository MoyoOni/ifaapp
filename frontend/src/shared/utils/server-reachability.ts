import { useSyncExternalStore } from 'react';

// Whether the API server is currently reachable. Distinct from the device
// being offline (offline-indicator.tsx covers navigator.onLine): the device can
// be online while the backend is down or the proxy in front of it errors.
//
// Without this, an outage looked like emptiness rather than a failure: the
// forum said "Quiet in the square. Be the first to speak.", the marketplace
// "No Items Found", and signed-in members were shown as signed out and
// redirected to /login.

let unreachable = false;
const listeners = new Set<() => void>();

export function setServerUnreachable(value: boolean): void {
  if (value === unreachable) return;
  unreachable = value;
  listeners.forEach((listener) => listener());
}

export function isServerUnreachable(): boolean {
  return unreachable;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** No response at all, or the gateway in front of a dead backend answering. */
export function isUnreachableError(error: unknown): boolean {
  const e = error as { response?: { status?: number }; request?: unknown; code?: string } | undefined;
  if (!e) return false;
  const status = e.response?.status;
  if (status === 502 || status === 503 || status === 504) return true;
  return !e.response && (!!e.request || e.code === 'ERR_NETWORK' || e.code === 'ECONNABORTED');
}

export function useServerUnreachable(): boolean {
  return useSyncExternalStore(subscribe, isServerUnreachable, () => false);
}
