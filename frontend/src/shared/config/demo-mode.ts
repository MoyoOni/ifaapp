/**
 * PRODUCTION LOCKED: Demo mode is permanently DISABLED
 * In production, API failures are NOT caught by fallback data.
 * All errors propagate immediately to Sentry for monitoring.
 * 
 * This file is kept for reference only. isDemoMode should ALWAYS be false.
 */
export const isDemoMode = false;

// If you're reading this during development and need demo mode:
// - This is PRODUCTION ONLY configuration
// - Return to earlier commits for development demo mode
// - Or create a separate development environment file
