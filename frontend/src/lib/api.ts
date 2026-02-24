import axios, { AxiosInstance } from 'axios';
import { parseApiError, reportApiError } from '@/shared/utils/api-error';
import { setLogContext } from '@/shared/utils/logger';

const REQUEST_ID_HEADER = 'x-request-id';

function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * API Client
 * Configured for backend communication with authentication.
 * All rejected responses are normalized: error.userMessage and error.isNetworkError are set.
 * Sends x-request-id for tracing; captures response x-request-id into logger context.
 */
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: auth token + request ID for tracing
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

// Response interceptor: capture trace ID for logging, then token refresh / error handling
api.interceptors.response.use(
  (response) => {
    const requestId = response.headers[REQUEST_ID_HEADER];
    if (requestId && typeof requestId === 'string') {
      setLogContext({ traceId: requestId });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken,
          });

          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    // Normalize error for consistent handling: attach userMessage and isNetworkError
    const parsed = parseApiError(error);
    (error as Error & { userMessage?: string; isNetworkError?: boolean }).userMessage =
      parsed.userMessage;
    (error as Error & { isNetworkError?: boolean }).isNetworkError = parsed.isNetworkError;
    reportApiError(error, { endpoint: originalRequest?.url });

    return Promise.reject(error);
  }
);

export default api;
