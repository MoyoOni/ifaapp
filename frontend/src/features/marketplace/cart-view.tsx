import React from 'react';
// import { useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, ArrowRight } from 'lucide-react';
import { useCart } from '@/shared/contexts/cart-context';
// import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { useToast } from '@/shared/components/toast';

interface CartViewProps {
  onBack?: () => void;
  onCheckout?: () => void;
}

/**
 * Shopping Cart View Component
 * Displays cart items with quantity management and checkout
 */
const CartView: React.FC<CartViewProps> = ({ onBack, onCheckout }) => {
  const { user } = useAuth();
  const { items: cartItems, removeItem, updateQuantity, totalItems, totalAmount, currency } = useCart();
  // const queryClient = useQueryClient();

  const { info } = useToast();

  const handleCheckout = () => {
    if (!user) {
      info('Please log in to checkout');
      return null;
    }

    if (cartItems.length === 0) {
      info('Your cart is empty');
      return null;
    }

    // Navigate to checkout flow
    if (onCheckout) {
      onCheckout();
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="bg-card rounded-3xl p-12 border border-border shadow-xl">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground">
              <ShoppingCart size={40} />
            </div>
            <h2 className="text-2xl font-bold brand-font mb-3">Your Basket is Empty</h2>
            <p className="text-muted-foreground mb-8">
              Discover sacred artifacts, herbs, and texts in the Ọjà (Marketplace) to begin.
            </p>

            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 px-6 py-3 bg-highlight text-white rounded-xl font-bold hover:bg-yellow-500 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                <ArrowLeft size={18} />
                Return to Marketplace
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-highlight transition-colors text-sm font-bold uppercase tracking-wider mb-2"
            >
              <ArrowLeft size={14} /> Back to Ọjà
            </button>
            <h1 className="text-4xl font-bold brand-font text-foreground">Shopping Basket</h1>
            <p className="text-muted-foreground">{totalItems} item{totalItems !== 1 ? 's' : ''} in your collection</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={`${item.productId}-${item.variantId ?? 'default'}`}
                className="bg-card rounded-2xl p-6 border border-border shadow-sm flex flex-col sm:flex-row items-start gap-6 relative overflow-hidden group"
              >
                {/* Product Image */}
                <div className="w-24 h-24 bg-muted rounded-xl overflow-hidden flex-shrink-0 border border-border">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ShoppingCart size={24} />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 w-full space-y-3">
                  <div className="pr-10">
                    <h3 className="font-bold text-xl text-foreground brand-font">{item.name}</h3>
                    {/* VENDOR_BACKLOG.md VND-007 */}
                    {item.variantLabel && <p className="text-sm text-muted-foreground">{item.variantLabel}</p>}
                    <p className="text-sm font-medium text-muted-foreground">Sold by {item.vendorName}</p>
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-1 border border-border">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                        className="w-8 h-8 flex items-center justify-center bg-card rounded-md text-foreground shadow-sm hover:text-highlight transition-colors"
                        aria-label={`Decrease quantity for ${item.name}`}
                        title="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-bold text-foreground">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                        disabled={item.stock != null && item.quantity >= item.stock}
                        className="w-8 h-8 flex items-center justify-center bg-card rounded-md text-foreground shadow-sm hover:text-highlight transition-colors disabled:opacity-50"
                        aria-label={`Increase quantity for ${item.name}`}
                        title="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <div className="text-xl font-extrabold text-foreground">
                        {item.currency === 'NGN' ? '₦' : '$'}
                        {(item.price * item.quantity).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">
                        {item.currency === 'NGN' ? '₦' : '$'}
                        {item.price.toLocaleString()} each
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeItem(item.productId, item.variantId)}
                  className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-red-500 dark:text-red-400 hover:bg-red-50 dark:bg-red-950/30 rounded-full transition-all"
                  title="Remove item"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl p-6 border border-border shadow-xl sticky top-6">
              <h2 className="text-xl font-bold brand-font text-foreground mb-6 pb-4 border-b border-border">Order Summary</h2>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between text-muted-foreground font-medium">
                  <span>Subtotal ({totalItems} items)</span>
                  <span className="text-foreground font-bold">
                    {currency === 'NGN' ? '₦' : '$'}
                    {totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground font-medium">
                  <span>Shipping Estimate</span>
                  <span className="text-muted-foreground italic">Calculated at checkout</span>
                </div>
                <div className="pt-4 border-t border-border mt-4">
                  <div className="flex items-center justify-between text-2xl font-black text-foreground">
                    <span>Total</span>
                    <span className="text-highlight">
                      {currency === 'NGN' ? '₦' : '$'}
                      {totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-highlight text-white rounded-xl font-bold hover:bg-yellow-500 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                Proceed to Checkout
                <ArrowRight size={20} />
              </button>

              <div className="mt-6 flex justify-center gap-4 opacity-50">
                {/* Trust badges placeholders */}
                <div className="h-6 w-10 bg-muted rounded"></div>
                <div className="h-6 w-10 bg-muted rounded"></div>
                <div className="h-6 w-10 bg-muted rounded"></div>
              </div>

              {!user && (
                <p className="text-xs text-red-400 mt-4 text-center font-bold">
                  * Please log in to complete your order
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartView;
