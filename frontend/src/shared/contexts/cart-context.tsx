import React, { createContext, useContext, useState, useEffect } from 'react';
import { analytics } from '@/lib/analytics';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  image?: string;
  vendorId: string;
  vendorName: string;
  stock?: number;
  // VENDOR_BACKLOG.md VND-007: which specific variant combination (if any)
  // is in this cart line. variantLabel is display-only (e.g. "Yellow /
  // Medium"), built from the variant's attributes at add-to-cart time.
  variantId?: string;
  variantLabel?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  currency: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// VENDOR_BACKLOG.md VND-007: a cart line is identified by (productId,
// variantId), not just productId -- two different variants of the same
// product (e.g. Yellow beads and Blue beads) are different cart lines, not
// one line whose quantity silently merges the two colours together.
const sameLine = (a: { productId: string; variantId?: string }, b: { productId: string; variantId?: string }) =>
  a.productId === b.productId && (a.variantId ?? null) === (b.variantId ?? null);

/**
 * Cart Context Provider
 * Manages shopping cart state with localStorage persistence
 */
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Load from localStorage on init
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cart-items');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  // Persist to localStorage whenever items change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart-items', JSON.stringify(items));
    }
  }, [items]);

  const addItem = (newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    // VENDOR_BACKLOG.md VND-013: previously nothing tracked add-to-cart
    // events at all -- vendors had no view/cart-interest signal, only final
    // sales. Fire-and-forget, same pattern as the onboarding funnel events.
    analytics.track('add_to_cart', {
      data: { productId: newItem.productId, vendorId: newItem.vendorId, quantity: newItem.quantity || 1 },
    });

    setItems((current) => {
      const existingIndex = current.findIndex((item) => sameLine(item, newItem));

      if (existingIndex >= 0) {
        // Update existing item quantity
        const existing = current[existingIndex];
        const updatedQuantity = (existing.quantity || 1) + (newItem.quantity || 1);
        const maxQuantity = existing.stock !== undefined ? Math.min(existing.stock, 10) : 10;
        const finalQuantity = Math.min(updatedQuantity, maxQuantity);

        const updated = [...current];
        updated[existingIndex] = { ...existing, quantity: finalQuantity };
        return updated;
      } else {
        // Add new item
        return [...current, { ...newItem, quantity: newItem.quantity || 1 }];
      }
    });
  };

  const removeItem = (productId: string, variantId?: string) => {
    setItems((current) => current.filter((item) => !sameLine(item, { productId, variantId })));
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }

    setItems((current) =>
      current.map((item) => {
        if (sameLine(item, { productId, variantId })) {
          const maxQuantity = item.stock !== undefined ? Math.min(item.stock, 10) : 10;
          return { ...item, quantity: Math.min(quantity, maxQuantity) };
        }
        return item;
      }),
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate total amount (using first item's currency or default to NGN)
  const currency = items.length > 0 ? items[0].currency : 'NGN';
  const totalAmount = items.reduce((sum, item) => {
    // Only sum items with the same currency as the first item
    if (item.currency === currency) {
      return sum + item.price * item.quantity;
    }
    return sum;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalAmount,
        currency,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
