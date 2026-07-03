# Typography Migration Guidelines

This document outlines the process of migrating hardcoded font classes to design tokens in the Ilé Àṣẹ application.

## Overview

We've replaced hardcoded font-size, font-weight, and line-height classes with design tokens that map to our CSS variables. This ensures consistent typography across the application and makes future updates easier.

## Typography Tokens

### Font Sizes
- `text-xs` → `text-[0.75rem]`
- `text-sm` → `text-[0.875rem]`
- `text-base` → `text-[1rem]`
- `text-lg` → `text-[1.125rem]`
- `text-xl` → `text-[1.25rem]`
- `text-2xl` → `text-[1.5rem]`
- `text-3xl` → `text-[1.875rem]`
- `text-4xl` → `text-[2.25rem]`
- `text-5xl` → `text-[3rem]`

### Font Weights
- `font-thin` → `font-[100]`
- `font-extralight` → `font-[200]`
- `font-light` → `font-[300]`
- `font-normal` → `font-[400]`
- `font-medium` → `font-[500]`
- `font-semibold` → `font-[600]`
- `font-bold` → `font-[700]`
- `font-extrabold` → `font-[800]`
- `font-black` → `font-[900]`

### Line Heights
- `leading-none` → `leading-[1]`
- `leading-tight` → `leading-[1.25]`
- `leading-snug` → `leading-[1.375]`
- `leading-normal` → `leading-[1.5]`
- `leading-relaxed` → `leading-[1.625]`
- `leading-loose` → `leading-[2]`

## Migration Process

The migration involved identifying hardcoded typography classes in components and replacing them with equivalent design token values. For example:

**Before:**
```jsx
<h1 className="text-4xl font-bold text-foreground mb-4">Welcome to Ìlú Àṣẹ</h1>
```

**After:**
```jsx
<h1 className="text-[2.25rem] font-[700] text-foreground mb-4">Welcome to Ìlú Àṣẹ</h1>
```

## Components Updated

The following components had their typography classes updated:

1. App.tsx
2. ErrorBoundary.tsx
3. ModalProvider.tsx
4. ToastProvider.tsx
5. Academy View components
6. Admin Dashboard components
7. Auth components
8. Babalawo components
9. Circle components
10. Temple Management components
11. Appointment components
12. And many more...

## Benefits

- Consistent typography across the application
- Easier updates when design system changes
- Better maintainability
- Improved scalability

## Future Considerations

Consider creating reusable typography components for common patterns to further standardize the design system.