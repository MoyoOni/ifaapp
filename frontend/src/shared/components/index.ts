/**
 * Shared Components
 *
 * Central export for all reusable UI components.
 */

// Loading states
export { LoadingSpinner, PageLoading, CardLoading } from './loading-spinner';
export type { LoadingSpinnerProps } from './loading-spinner';

// Alerts and notifications
export { ErrorAlert, FieldError } from './error-alert';
export type { ErrorAlertProps, AlertVariant } from './error-alert';

export { ToastProvider, useToast } from './toast';
export type { Toast, ToastType } from './toast';

// Empty states
export { EmptyState, NoSearchResults, NoCircles, NoEvents, NoProducts } from './empty-state';
export type { EmptyStateProps } from './empty-state';

// Form components
export { FormField, SubmitButton } from './form-field';
export type { FormFieldProps, SubmitButtonProps } from './form-field';

// Existing components (re-export default exports as named)
export { default as VerificationBadge } from './verification-badge';
export { default as YorubaInputHelper } from './yoruba-input-helper';
export { default as OfflineIndicator } from './offline-indicator';
export { default as LowDataModeToggle, isLowDataMode } from './low-data-mode-toggle';
export { DevRoleSwitcher } from './dev-role-switcher';
export { default as NarratorControl } from './narrator-control';
export { LanguageSwitcher } from './language-switcher';
export { SidebarLayout } from './sidebar-layout';
export { default as BabalawoProfileModal } from './babalawo-profile-modal';
export { MaskedValue } from './masked-value';
