import React, { useState, useMemo } from 'react';
import { ArrowLeft, CreditCard, Loader2, MapPin, Truck, CheckCircle2, Store, AlertCircle, Sparkles, Gift } from 'lucide-react';
import { useSubscription } from '@/features/subscription/use-subscription';
import { useCart } from '@/shared/contexts/cart-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';
import { Currency, PaymentPurpose } from '@common';
import PaymentModal from '@/features/payments/payment-modal';

interface CheckoutViewProps {
    onBack: () => void;
    onSuccess: (orderId: string) => void;
}

const CheckoutView: React.FC<CheckoutViewProps> = ({ onBack, onSuccess }) => {
    const { user } = useAuth();
    const { isDevoted } = useSubscription();
    const { items, totalAmount, clearCart, currency } = useCart();
    const freeDeliveryEligible = totalAmount >= 100_000;
    const queryClient = useQueryClient();
    const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
    const [loading, setLoading] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pendingOrderIds, setPendingOrderIds] = useState<string[]>([]);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    // Map cart currency to Currency enum
    const paymentCurrency = currency === 'NGN' ? Currency.NGN : Currency.USD;

    // Group items by vendor for multi-vendor order support
    const itemsByVendor = useMemo(() => {
        const grouped: Record<string, { vendorId: string; vendorName: string; items: typeof items; subtotal: number }> = {};
        items.forEach(item => {
            if (!grouped[item.vendorId]) {
                grouped[item.vendorId] = {
                    vendorId: item.vendorId,
                    vendorName: item.vendorName,
                    items: [],
                    subtotal: 0
                };
            }
            grouped[item.vendorId].items.push(item);
            grouped[item.vendorId].subtotal += item.price * item.quantity;
        });
        return Object.values(grouped);
    }, [items]);

    // Form States
    const [shippingDetails, setShippingDetails] = useState({
        fullName: user?.name || '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        country: 'Nigeria',
    });

    // VENDOR_BACKLOG.md VND-011: real per-vendor shipping quote, replacing the
    // previously hardcoded `shippingCost: 0` -- each vendor may have their
    // own zones/rates, so this is a quote per vendor group, summed for the
    // order total.
    const { data: shippingQuotes = {} } = useQuery<Record<string, { cost: number; zoneName: string | null; processingTime: string | null }>>({
        queryKey: ['shipping-quotes', shippingDetails.country, itemsByVendor.map(g => g.vendorId).join(',')],
        queryFn: async () => {
            const entries = await Promise.all(
                itemsByVendor.map(async (group) => {
                    try {
                        const res = await api.post(`/marketplace/vendors/${group.vendorId}/shipping-quote`, {
                            country: shippingDetails.country,
                            items: group.items.map(item => ({ productId: item.productId, quantity: item.quantity })),
                        });
                        return [group.vendorId, res.data] as const;
                    } catch {
                        return [group.vendorId, { cost: 0, zoneName: null, processingTime: null }] as const;
                    }
                })
            );
            return Object.fromEntries(entries);
        },
        enabled: itemsByVendor.length > 0 && !!shippingDetails.country,
    });

    // VENDOR_BACKLOG.md VND-020: per-vendor promo code input + live preview,
    // using the exact same calculation createOrder() applies server-side
    // (previewPromotion calls the same calculateBestPromotion() helper) so
    // this can never show a discount the backend wouldn't actually honor.
    const [promoCodes, setPromoCodes] = useState<Record<string, string>>({});
    const [appliedPromoCodes, setAppliedPromoCodes] = useState<Record<string, string>>({});

    const { data: promotionPreviews = {} } = useQuery<Record<string, { promotionId: string | null; discountAmount: number }>>({
        queryKey: ['promotion-previews', itemsByVendor.map(g => g.vendorId).join(','), JSON.stringify(appliedPromoCodes)],
        queryFn: async () => {
            const entries = await Promise.all(
                itemsByVendor.map(async (group) => {
                    try {
                        const res = await api.post(`/marketplace/vendors/${group.vendorId}/promotions/preview`, {
                            items: group.items.map(item => ({ productId: item.productId, quantity: item.quantity })),
                            promoCode: appliedPromoCodes[group.vendorId] || undefined,
                        });
                        return [group.vendorId, res.data] as const;
                    } catch {
                        return [group.vendorId, { promotionId: null, discountAmount: 0 }] as const;
                    }
                })
            );
            return Object.fromEntries(entries);
        },
        enabled: itemsByVendor.length > 0,
    });
    const totalDiscount = itemsByVendor.reduce((sum, group) => sum + (promotionPreviews[group.vendorId]?.discountAmount ?? 0), 0);
    const discountedItemsTotal = Math.max(0, totalAmount - totalDiscount);

    // Mirrors the backend's own Devoted-free-delivery rule (createOrder in
    // marketplace.service.ts) so the total shown here matches what's
    // actually charged, rather than displaying a shipping fee that a
    // Devoted member on a ≥₦100,000 order won't actually be billed for.
    const devotedFreeDeliveryApplies = isDevoted && freeDeliveryEligible;
    const totalShippingCost = devotedFreeDeliveryApplies
        ? 0
        : itemsByVendor.reduce((sum, group) => sum + (shippingQuotes[group.vendorId]?.cost ?? 0), 0);
    // Backend (marketplace.service.ts createOrder) adds 7.5% VAT on top of
    // (items - discount + shipping) for every order's authoritative
    // `totalAmount` -- this was never reflected in what checkout actually
    // displayed/charged even before shipping was real, a separate
    // pre-existing gap fixed alongside this one since it's the same total
    // calculation. Discount is applied to the item subtotal before VAT,
    // same order of operations as createOrder().
    const vatAmount = (discountedItemsTotal + totalShippingCost) * 0.075;
    const grandTotal = Math.round(discountedItemsTotal + totalShippingCost + vatAmount);

    const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer' | 'crypto'>('card');

    // SHOP_BACKLOG.md MSP-024: gifting, via the existing checkout flow
    const [isGift, setIsGift] = useState(false);
    const [giftRecipientEmail, setGiftRecipientEmail] = useState('');
    const [giftMessage, setGiftMessage] = useState('');
    const [dedicatedTo, setDedicatedTo] = useState('');

    const buildDemoOrderIds = () => itemsByVendor.map((group) => `demo-order-${group.vendorId}-${Date.now()}`);

    // Submit Order Mutation - creates separate orders per vendor
    const createOrderMutation = useMutation({
        mutationFn: async (orderData: {
            shippingAddress: string;
            vendorGroups: typeof itemsByVendor;
        }) => {
            const shippingAddress = orderData.shippingAddress;
            try {
                const orderPromises = orderData.vendorGroups.map(group =>
                    api.post('/marketplace/orders', {
                        vendorId: group.vendorId,
                        items: group.items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            // VENDOR_BACKLOG.md VND-007
                            variantId: item.variantId,
                        })),
                        shippingAddress,
                        shippingCountry: shippingDetails.country,
                        // Server recomputes this authoritatively when the vendor has
                        // shipping zones configured (VENDOR_BACKLOG.md VND-011) --
                        // this is only used as a fallback for vendors who haven't.
                        shippingCost: devotedFreeDeliveryApplies ? 0 : (shippingQuotes[group.vendorId]?.cost ?? 0),
                        // VENDOR_BACKLOG.md VND-020
                        promoCode: appliedPromoCodes[group.vendorId] || undefined,
                        notes: `Payment method: ${paymentMethod}`,
                        isGift: isGift || undefined,
                        giftRecipientEmail: isGift && giftRecipientEmail ? giftRecipientEmail : undefined,
                        giftMessage: isGift && giftMessage ? giftMessage : undefined,
                        dedicatedTo: dedicatedTo || undefined,
                    })
                );

                const results = await Promise.all(orderPromises);
                const orderIds = results.map(r => r.data.id);
                return {
                    id: orderIds.length === 1 ? orderIds[0] : orderIds.join(','),
                    orderIds,
                    count: orderIds.length,
                    isDemo: false
                };
            } catch (error) {
                logger.warn('Failed to create marketplace order, using demo fallback', error);
                const orderIds = buildDemoOrderIds();
                return {
                    id: orderIds.length === 1 ? orderIds[0] : orderIds.join(','),
                    orderIds,
                    count: orderIds.length,
                    isDemo: true
                };
            }
        },
        onSuccess: (data) => {
            // Store order IDs and show payment modal
            setPendingOrderIds(data.orderIds);
            setLoading(false);
            if (data.isDemo) {
                handlePaymentSuccess(`DEMO-${Date.now()}`);
                return;
            }
            setShowPaymentModal(true);
        },
        onError: (error: any) => {
            setLoading(false);
            const message = error?.response?.data?.message || 'Failed to place order. Please try again.';
            setPaymentError(message);
        }
    });

    // Handle successful payment - clear cart and navigate to success
    const handlePaymentSuccess = (reference: string) => {
        logger.log('Payment successful:', reference);
        clearCart();
        queryClient.invalidateQueries({ queryKey: ['marketplace-orders'] });
        // Store reference for order tracking
        const orderId = pendingOrderIds.join(',');
        onSuccess(orderId);
    };

    // Handle payment error
    const handlePaymentError = (error: string) => {
        setPaymentError(error);
        setShowPaymentModal(false);
    };

    // Handle payment modal close without completing
    const handlePaymentModalClose = () => {
        setShowPaymentModal(false);
        // Orders are created but unpaid - user can retry or view in order history
        setPaymentError('Payment was not completed. Your order has been saved - you can complete payment from your order history.');
    };

    const handlePlaceOrder = () => {
        setLoading(true);
        const shippingAddress = [
            shippingDetails.fullName,
            shippingDetails.address,
            `${shippingDetails.city}, ${shippingDetails.state} ${shippingDetails.zipCode}`,
            shippingDetails.country,
            shippingDetails.phone
        ].filter(Boolean).join('\n');

        createOrderMutation.mutate({
            shippingAddress,
            vendorGroups: itemsByVendor
        });
    };

    if (items.length === 0) {
        onBack();
        return null;
    }

    return (
        <div className="min-h-screen bg-background p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                        aria-label="Go back"
                        title="Go back"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-3xl font-bold brand-font text-foreground">Checkout</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form Area */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Payment Error Alert */}
                        {paymentError && (
                            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 flex items-start gap-3">
                                <AlertCircle className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="font-medium text-red-800 dark:text-red-400">Payment Issue</p>
                                    <p className="text-sm text-red-600 dark:text-red-400">{paymentError}</p>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentError(null)}
                                        className="text-sm text-red-700 dark:text-red-400 underline mt-2"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Steps Indicator */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`flex items-center gap-2 ${step === 'shipping' ? 'text-highlight font-bold' : 'text-muted-foreground'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'shipping' ? 'border-highlight bg-highlight/10' : 'border-border'}`}>1</div>
                                <span>Shipping</span>
                            </div>
                            <div className="h-px bg-border w-12"></div>
                            <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-highlight font-bold' : 'text-muted-foreground'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'payment' ? 'border-highlight bg-highlight/10' : 'border-border'}`}>2</div>
                                <span>Payment</span>
                            </div>
                        </div>

                        {step === 'shipping' ? (
                            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border space-y-4">
                                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                    <MapPin className="text-highlight" />
                                    Shipping Address
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase text-muted-foreground">Full Name</label>
                                        <input
                                            type="text"
                                            value={shippingDetails.fullName}
                                            onChange={e => setShippingDetails({ ...shippingDetails, fullName: e.target.value })}
                                            className="w-full p-3 bg-muted/50 rounded-xl border border-border focus:outline-none focus:border-highlight text-foreground"
                                            placeholder="Adewale Adebayo"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase text-muted-foreground">Phone</label>
                                        <input
                                            type="tel"
                                            value={shippingDetails.phone}
                                            onChange={e => setShippingDetails({ ...shippingDetails, phone: e.target.value })}
                                            className="w-full p-3 bg-muted/50 rounded-xl border border-border focus:outline-none focus:border-highlight text-foreground"
                                            placeholder="+234..."
                                        />
                                    </div>
                                    <div className="col-span-full space-y-1">
                                        <label className="text-xs font-bold uppercase text-muted-foreground">Address</label>
                                        <input
                                            type="text"
                                            value={shippingDetails.address}
                                            onChange={e => setShippingDetails({ ...shippingDetails, address: e.target.value })}
                                            className="w-full p-3 bg-muted/50 rounded-xl border border-border focus:outline-none focus:border-highlight text-foreground"
                                            placeholder="123 Ifa Street"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase text-muted-foreground">City</label>
                                        <input
                                            type="text"
                                            value={shippingDetails.city}
                                            onChange={e => setShippingDetails({ ...shippingDetails, city: e.target.value })}
                                            className="w-full p-3 bg-muted/50 rounded-xl border border-border focus:outline-none focus:border-highlight text-foreground"
                                            placeholder="Lagos"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase text-muted-foreground">State</label>
                                        <input
                                            type="text"
                                            value={shippingDetails.state}
                                            onChange={e => setShippingDetails({ ...shippingDetails, state: e.target.value })}
                                            className="w-full p-3 bg-muted/50 rounded-xl border border-border focus:outline-none focus:border-highlight text-foreground"
                                            placeholder="Lagos State"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase text-muted-foreground">Country</label>
                                        <input
                                            type="text"
                                            value={shippingDetails.country}
                                            onChange={e => setShippingDetails({ ...shippingDetails, country: e.target.value })}
                                            className="w-full p-3 bg-muted/50 rounded-xl border border-border focus:outline-none focus:border-highlight text-foreground"
                                            placeholder="Nigeria"
                                        />
                                    </div>
                                </div>

                                {/* SHOP_BACKLOG.md MSP-024: gifting */}
                                <div className="pt-4 border-t border-border space-y-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isGift}
                                            onChange={e => setIsGift(e.target.checked)}
                                        />
                                        <span className="font-bold text-foreground flex items-center gap-1.5">
                                            <Gift size={16} className="text-highlight" /> Send this as a gift
                                        </span>
                                    </label>
                                    {isGift && (
                                        <div className="pl-6 space-y-3">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold uppercase text-muted-foreground">Recipient's Email</label>
                                                <input
                                                    type="email"
                                                    value={giftRecipientEmail}
                                                    onChange={e => setGiftRecipientEmail(e.target.value)}
                                                    className="w-full p-3 bg-muted/50 rounded-xl border border-border focus:outline-none focus:border-highlight text-foreground"
                                                    placeholder="recipient@example.com"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold uppercase text-muted-foreground">Gift Message (optional)</label>
                                                <textarea
                                                    value={giftMessage}
                                                    onChange={e => setGiftMessage(e.target.value)}
                                                    rows={2}
                                                    className="w-full p-3 bg-muted/50 rounded-xl border border-border focus:outline-none focus:border-highlight text-foreground resize-none"
                                                    placeholder="A note for the recipient..."
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase text-muted-foreground">Dedicate This Purchase (optional)</label>
                                        <input
                                            type="text"
                                            value={dedicatedTo}
                                            onChange={e => setDedicatedTo(e.target.value)}
                                            className="w-full p-3 bg-muted/50 rounded-xl border border-border focus:outline-none focus:border-highlight text-foreground"
                                            placeholder="e.g. my ancestors, Ọ̀rúnmìlà"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        onClick={() => setStep('payment')}
                                        disabled={!shippingDetails.address || !shippingDetails.city}
                                        className="bg-foreground text-background px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-colors disabled:opacity-50"
                                    >
                                        Continue to Payment
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border space-y-6">
                                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                    <CreditCard className="text-highlight" />
                                    Payment Method
                                </h2>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => setPaymentMethod('card')}
                                        className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${paymentMethod === 'card' ? 'border-highlight bg-highlight/5 ring-1 ring-highlight' : 'border-border hover:border-muted-foreground'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-6 bg-foreground rounded"></div>
                                            <span className="font-bold text-foreground">Card Payment</span>
                                        </div>
                                        {paymentMethod === 'card' && <CheckCircle2 className="text-highlight" size={20} />}
                                    </button>

                                    <button
                                        onClick={() => setPaymentMethod('bank_transfer')}
                                        className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${paymentMethod === 'bank_transfer' ? 'border-highlight bg-highlight/5 ring-1 ring-highlight' : 'border-border hover:border-muted-foreground'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-1 bg-muted rounded"><Truck size={16} /></div>
                                            <span className="font-bold text-foreground">Bank Transfer</span>
                                        </div>
                                        {paymentMethod === 'bank_transfer' && <CheckCircle2 className="text-highlight" size={20} />}
                                    </button>
                                </div>

                                <div className="pt-4 flex items-center justify-between border-t border-border mt-4">
                                    <button
                                        onClick={() => setStep('shipping')}
                                        className="text-muted-foreground font-bold hover:text-foreground"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handlePlaceOrder}
                                        disabled={loading}
                                        className="bg-highlight text-white px-8 py-3 rounded-xl font-bold hover:bg-yellow-500 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 flex items-center gap-2"
                                    >
                                        {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                                        {loading ? 'Processing...' : `Pay ${currency === 'NGN' ? '₦' : '$'}${grandTotal.toLocaleString()}`}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border sticky top-6">
                            <h3 className="text-lg font-bold brand-font text-foreground mb-4">Order Summary</h3>

                            {/* Group items by vendor */}
                            <div className="space-y-4 mb-6">
                                {itemsByVendor.map((group) => (
                                    <div key={group.vendorId} className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                                            <Store size={12} />
                                            {group.vendorName}
                                        </div>
                                        {group.items.map((item) => (
                                            <div key={`${item.productId}-${item.variantId ?? 'default'}`} className="flex items-start gap-3 text-sm pl-4">
                                                <div className="w-10 h-10 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                                    {item.image && <img src={item.image} className="w-full h-full object-cover" alt={item.name} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-foreground line-clamp-1">{item.name}</p>
                                                    {item.variantLabel && <p className="text-muted-foreground text-xs">{item.variantLabel}</p>}
                                                    <p className="text-muted-foreground text-xs">Qty: {item.quantity}</p>
                                                </div>
                                                <div className="font-bold text-sm">
                                                    {currency === 'NGN' ? '₦' : '$'}{(item.price * item.quantity).toLocaleString()}
                                                </div>
                                            </div>
                                        ))}
                                        {/* VENDOR_BACKLOG.md VND-020: per-vendor promo code */}
                                        <div className="pl-4 flex gap-2 items-center">
                                            <input
                                                type="text"
                                                placeholder="Promo code"
                                                value={promoCodes[group.vendorId] ?? ''}
                                                onChange={(e) => setPromoCodes((prev) => ({ ...prev, [group.vendorId]: e.target.value }))}
                                                className="flex-1 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-foreground"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setAppliedPromoCodes((prev) => ({ ...prev, [group.vendorId]: promoCodes[group.vendorId] ?? '' }))}
                                                className="px-3 py-1.5 border border-border rounded-lg text-xs font-bold hover:bg-muted transition-colors"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                        {(promotionPreviews[group.vendorId]?.discountAmount ?? 0) > 0 && (
                                            <p className="pl-4 text-xs font-bold text-green-600">
                                                Discount applied: -{currency === 'NGN' ? '₦' : '$'}{promotionPreviews[group.vendorId]!.discountAmount.toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {itemsByVendor.length > 1 && (
                                <p className="text-xs text-muted-foreground mb-4 bg-muted/50 p-2 rounded-lg">
                                    Your order will be split into {itemsByVendor.length} separate orders from different vendors.
                                </p>
                            )}

                            {/* Free delivery banner */}
                            {freeDeliveryEligible && isDevoted && (
                                <div className="flex items-center gap-2 p-3 mb-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm">
                                    <Sparkles size={14} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                    <span className="text-amber-800 dark:text-amber-300 font-semibold">Free local delivery applied — Devoted member benefit</span>
                                </div>
                            )}
                            {freeDeliveryEligible && !isDevoted && (
                                <div className="flex items-center gap-2 p-3 mb-3 bg-muted/50 border border-border rounded-xl text-sm cursor-pointer hover:bg-muted transition-colors" onClick={() => window.location.href = '/pricing'}>
                                    <Truck size={14} className="text-muted-foreground flex-shrink-0" />
                                    <span className="text-muted-foreground">Devoted members get <strong>free local delivery</strong> on this order. <span className="text-primary underline">Upgrade</span></span>
                                </div>
                            )}

                            <div className="border-t border-border pt-4 space-y-2">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>{currency === 'NGN' ? '₦' : '$'}{totalAmount.toLocaleString()}</span>
                                </div>
                                {totalDiscount > 0 && (
                                    <div className="flex justify-between text-green-600 font-semibold">
                                        <span>Discount</span>
                                        <span>-{currency === 'NGN' ? '₦' : '$'}{totalDiscount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Shipping</span>
                                    <span>
                                        {devotedFreeDeliveryApplies ? (
                                            <span className="text-amber-600 dark:text-amber-400 font-semibold">Free</span>
                                        ) : totalShippingCost > 0 ? (
                                            `${currency === 'NGN' ? '₦' : '$'}${totalShippingCost.toLocaleString()}`
                                        ) : (
                                            'Free'
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>VAT (7.5%)</span>
                                    <span>{currency === 'NGN' ? '₦' : '$'}{Math.round(vatAmount).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between font-bold text-xl text-foreground pt-2">
                                    <span>Total</span>
                                    <span>{currency === 'NGN' ? '₦' : '$'}{grandTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={handlePaymentModalClose}
                amount={grandTotal}
                currency={paymentCurrency}
                purpose={PaymentPurpose.MARKETPLACE_ORDER}
                relatedId={pendingOrderIds.join(',')}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
            />
        </div>
    );
};

export default CheckoutView;

