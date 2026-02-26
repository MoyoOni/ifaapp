# Loading Spinner Component Guidelines

This document outlines the usage and best practices for the unified LoadingSpinner component in the Ilé Àṣẹ application.

## Overview

The LoadingSpinner component replaces all duplicate spinner implementations throughout the application. This standardizes the loading experience and reduces code duplication.

## Component API

### Props

- `size`: Controls the size of the spinner
  - `'sm'` (20px) - For inline loading states
  - `'md'` (32px) - For medium loading containers
  - `'lg'` (48px) - For page-level loading states
  - `number` - Custom pixel size

- `variant`: Controls the color variant
  - `'default'` - Uses foreground color
  - `'primary'` - Uses primary brand color
  - `'secondary'` - Uses secondary brand color
  - `'accent'` - Uses accent brand color
  - `'highlight'` - Uses highlight brand color

- `className`: Additional CSS classes to apply
- `label`: Optional accessibility label and visual loading text

## Usage Examples

### Page-Level Loading
```tsx
<LoadingSpinner size="lg" variant="primary" label="Loading content..." />
```

### Inline Loading
```tsx
<LoadingSpinner size="sm" variant="accent" />
```

### Container Loading
```tsx
<div className="flex justify-center items-center h-64">
  <LoadingSpinner size="md" variant="secondary" label="Processing..." />
</div>
```

## Migration Guide

To migrate from custom loading spinners to the unified LoadingSpinner:

1. Import the component: `import LoadingSpinner from '@/components/common/LoadingSpinner';`
2. Replace existing spinner implementations with the LoadingSpinner component
3. Choose appropriate size and variant based on context
4. Optionally add a descriptive label

## Components Updated

The following components have been migrated to use the unified LoadingSpinner:

- App.tsx
- Academy View components
- Admin View components
- Appointment components
- Client hub components
- Forum components
- Message components
- Temple components
- And others...

## Benefits

- Reduced bundle size by eliminating duplicate spinner code
- Consistent loading experience across the application
- Easier maintenance and updates
- Improved accessibility with proper labeling
- Standardized visual design