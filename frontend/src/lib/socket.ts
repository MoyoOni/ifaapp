import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Returns a lazily-initialised socket connected to the messaging namespace.
 * Reuses the same instance across the app (singleton).
 */
export function getSocket(): Socket {
  if (!socket) {
    const base = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:3000';
    const token = localStorage.getItem('token') ?? '';
    socket = io(`${base}/messaging`, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socket;
}

/** Call this on logout to cleanly disconnect and allow re-connection with new token. */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
