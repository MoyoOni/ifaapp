# Alert/Modal Migration Guidelines

This document outlines how to replace browser `alert()` and `confirm()` calls with proper Toast and Modal components in the Ilé Àṣẹ application.

## Overview

We've replaced all browser alert/confirm dialogs with better UX alternatives:
- `alert()` calls → Toast notifications
- `confirm()` calls → Confirmation modals

## Toast Component

### Usage

```tsx
import { useToast } from '@/components/common/ToastProvider';

const MyComponent = () => {
  const { showToast } = useToast();
  
  const handleClick = () => {
    showToast('Operation successful!', 'success');
  };
  
  return <button onClick={handleClick}>Show Toast</button>;
};
```

### Toast Types

- `'success'` - For successful operations
- `'error'` - For error messages
- `'info'` - For informational messages
- `'warning'` - For warnings

## Modal Component

### Usage

```tsx
import { useModal } from '@/components/common/ModalProvider';

const MyComponent = () => {
  const { showModal } = useModal();
  
  const handleClick = () => {
    showModal({
      title: 'Confirm Action',
      message: 'Are you sure you want to perform this action?',
      confirmText: 'Yes',
      cancelText: 'No',
      onConfirm: () => {
        // Handle confirmation
      },
      onCancel: () => {
        // Handle cancellation (optional)
      }
    });
  };
  
  return <button onClick={handleClick}>Show Modal</button>;
};
```

## Migration Process

### Replacing alert()

**Before:**
```ts
alert('Something happened!');
```

**After:**
```ts
import { useToast } from '@/components/common/ToastProvider';
const { showToast } = useToast();
showToast('Something happened!', 'info');
```

### Replacing confirm()

**Before:**
```ts
if (confirm('Are you sure?')) {
  // proceed
}
```

**After:**
```ts
import { useModal } from '@/components/common/ModalProvider';
const { showModal } = useModal();

showModal({
  title: 'Confirm Action',
  message: 'Are you sure?',
  onConfirm: () => {
    // proceed
  }
});
```

## Components Updated

The following components had their alert/confirm calls replaced:

### Alert replacements:
1. Academy Course Detail View
2. Admin Dashboard View
3. Advisory Board Voting View
4. Vendor Review View
5. Babalawo Invite Client View
6. Circle Detail View
7. Client Wallet View
8. Event Detail View
9. Create Thread Form
10. Marketplace Cart View
11. Prescription Approval View
12. Wallet Dashboard View

### Confirm replacements:
1. Circle Management View
2. Temple Management View
3. Forum Thread View
4. Temple Management View (babalawo removal)
5. Settings Page (logout and delete account)
6. Masked Value Component

## Benefits

- Better user experience with non-blocking notifications
- Consistent UI that matches the application design
- Accessibility improvements
- Better control over message presentation
- Improved styling consistency