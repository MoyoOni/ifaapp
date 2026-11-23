import axios, { AxiosInstance } from 'axios';
import { setServerUnreachable, isUnreachableError } from '@/shared/utils/server-reachability';
import { parseApiError, reportApiError } from '@/shared/utils/api-error';
import { setLogContext } from '@/shared/utils/logger';
import { API_BASE_URL, apiUrl } from './api-base';
import { tokenStore, AUTH_TRANSPORT_HEADER, type AuthPayload } from './token-store';

const REQUEST_ID_HEADER = 'x-request-id';

let requestCounter = 0;
function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${(++requestCounter).toString(36)}`;
}

/**
 * API Client
 * Configured for backend communication with authentication.
 * All rejected responses are normalized: error.userMessage and error.isNetworkError are set.
 * Sends x-request-id for tracing; captures response x-request-id into logger context.
 * 
 * PRODUCTION: All API errors are reported to Sentry immediately.
 */
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Website: the session lives in httpOnly cookies (same origin).
  withCredentials: tokenStore.usesCookies,
});

/** Headers that select the auth transport (cookie on the website, Bearer in the app). */
function transportHeaders(): Record<string, string> {
  return tokenStore.usesCookies ? { [AUTH_TRANSPORT_HEADER]: 'cookie' } : {};
}

// Request interceptor: auth token + request ID for tracing
api.interceptors.request.use(
  (config) => {
    const token = tokenStore.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    for (const [name, value] of Object.entries(transportHeaders())) {
      config.headers[name] = value;
    }
    if (!config.headers[REQUEST_ID_HEADER]) {
      config.headers[REQUEST_ID_HEADER] = generateRequestId();
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// The server rotates refresh tokens: every /auth/refresh revokes the one it was
// given and returns a new pair. So (1) BOTH tokens must be stored, otherwise the
// second refresh (about 30 minutes in) sends a revoked token and logs the user
// out, and (2) concurrent 401s must share ONE refresh -- each extra call would
// present the already-spent token and fail, logging the user out. On the
// website the pair rotates inside httpOnly cookies; the same single-flight rule
// applies. Resolves to the new Bearer token, or null in cookie transport.
let refreshInFlight: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = tokenStore.getRefreshToken();
      if (!refreshToken && !tokenStore.usesCookies) throw new Error('No refresh token available');
      const response = await axios.post<AuthPayload>(
        apiUrl('/auth/refresh'),
        refreshToken ? { refreshToken } : {},
        { headers: transportHeaders(), withCredentials: tokenStore.usesCookies },
      );
      tokenStore.saveSession(response.data);
      return tokenStore.getAccessToken();
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

// Response interceptor: capture trace ID for logging, then token refresh / error handling
api.interceptors.response.use(
  (response) => {
    setServerUnreachable(false);
    const requestId = response.headers[REQUEST_ID_HEADER];
    if (requestId && typeof requestId === 'string') {
      setLogContext({ traceId: requestId });
    }
    return response;
  },
  async (error) => {
    // The backend's error filter answers { success, error: { message } }, but
    // ~100 screens read response.data.message, so until November 6, 2026
    // members only ever saw "Request failed with status code 4xx" instead of
    // the reason (a ban, a held erasure, a refused payment). Mirror it.
    const body = error.response?.data;
    const status = error.response?.status ?? 0;
    const deliberate = status < 500 || status === 503;
    if (deliberate && body && typeof body === 'object' && body.message === undefined && typeof body.error?.message === 'string') {
      body.message = body.error.message;
    }
    const originalRequest = error.config;
    // Any answer from the API (even a 4xx) means it's reachable.
    setServerUnreachable(isUnreachableError(error));

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (tokenStore.canRefresh()) {
        try {
          const accessToken = await refreshAccessToken();
          if (accessToken) originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          else delete originalRequest.headers.Authorization;
          return api(originalRequest);
        } catch (refreshError) {
          tokenStore.clear();
          window.location.href = '/login';
        }
      }
    }

    // Normalize error for consistent handling: attach userMessage and isNetworkError
    const parsed = parseApiError(error);
    (error as Error & { userMessage?: string; isNetworkError?: boolean }).userMessage =
      parsed.userMessage;
    (error as Error & { isNetworkError?: boolean }).isNetworkError = parsed.isNetworkError;
    
    // PRODUCTION: Always report API errors to Sentry
    reportApiError(error, { endpoint: originalRequest?.url });

    return Promise.reject(error);
  }
);

export default api;