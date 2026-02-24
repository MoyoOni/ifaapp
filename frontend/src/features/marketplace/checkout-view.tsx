import React, { useState, useMemo } from 'react';
import { ArrowLeft, CreditCard, Loader2, MapPin, Truck, CheckCircle2, Store, AlertCircle } from 'lucide-react';
import { useCart } from '@/shared/contexts/cart-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
    const { items, totalAmount, clearCart, currency } = useCart();
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
    });

    const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer' | 'crypto'>('card');

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
                            quantity: item.quantity
                        })),
                        shippingAddress,
                        shippingCost: 0, // Free shipping for now
                        notes: `Payment method: ${paymentMethod}`
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
        <div className="min-h-screen bg-stone-50 text-stone-800 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-white rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-3xl font-bold brand-font">Checkout</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form Area */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Payment Error Alert */}
                        {paymentError && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="font-medium text-red-800">Payment Issue</p>
                                    <p className="text-sm text-red-600">{paymentError}</p>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentError(null)}
                                        className="text-sm text-red-700 underline mt-2"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Steps Indicator */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`flex items-center gap-2 ${step === 'shipping' ? 'text-highlight font-bold' : 'text-stone-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'shipping' ? 'border-highlight bg-highlight/10' : 'border-stone-200'}`}>1</div>
                                <span>Shipping</span>
                            </div>
                            <div className="h-px bg-stone-200 w-12"></div>
                            <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-highlight font-bold' : 'text-stone-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'payment' ? 'border-highlight bg-highlight/10' : 'border-stone-200'}`}>2</div>
                                <span>Payment</span>
                            </div>
                        </div>

                        {step === 'shipping' ? (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 space-y-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <MapPin className="text-highlight" />
                                    Shipping Address
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase text-stone-400">Full Name</label>
                                        <input
                                            type="text"
                                            value={shippingDetails.fullName}
                                            onChange={e => setShippingDetails({ ...shippingDetails, fullName: e.target.value })}
                                            className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:border-highlight"
                                            placeholder="Adewale Adebayo"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase text-stone-400">Phone</label>
                                        <input
                                            type="tel"
                                            value={shippingDetails.phone}
                                            onChange={e => setShippingDetails({ ...shippingDetails, phone: e.target.value })}
                                            className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:border-highlight"
                                            placeholder="+234..."
                                        />
                                    </div>
                                    <div className="col-span-full space-y-1">
                                        <label className="text-xs font-bold uppercase text-stone-400">Address</label>
                                        <input
                                            type="text"
                                            value={shippingDetails.address}
                                            onChange={e => setShippingDetails({ ...shippingDetails, address: e.target.value })}
                                            className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:border-highlight"
                                            placeholder="123 Ifa Street"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase text-stone-400">City</label>
                                        <input
                                            type="text"
                                            value={shippingDetails.city}
                                            onChange={e => setShippingDetails({ ...shippingDetails, city: e.target.value })}
                                            className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:border-highlight"
                                            placeholder="Lagos"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase text-stone-400">State</label>
                                        <input
                                            type="text"
                                            value={shippingDetails.state}
                                            onChange={e => setShippingDetails({ ...shippingDetails, state: e.target.value })}
                                            className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:border-highlight"
                                            placeholder="Lagos State"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        onClick={() => setStep('payment')}
                                        disabled={!shippingDetails.address || !shippingDetails.city}
                                        className="bg-stone-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50"
                                    >
                                        Continue to Payment
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 space-y-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <CreditCard className="text-highlight" />
                                    Payment Method
                                </h2>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => setPaymentMethod('card')}
                                        className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${paymentMethod === 'card' ? 'border-highlight bg-highlight/5 ring-1 ring-highlight' : 'border-stone-200 hover:border-stone-300'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-6 bg-stone-800 rounded"></div>
                                            <span className="font-bold">Card Payment</span>
                                        </div>
                                        {paymentMethod === 'card' && <CheckCircle2 className="text-highlight" size={20} />}
                                    </button>

                                    <button
                                        onClick={() => setPaymentMethod('bank_transfer')}
                                        className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${paymentMethod === 'bank_transfer' ? 'border-highlight bg-highlight/5 ring-1 ring-highlight' : 'border-stone-200 hover:border-stone-300'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-1 bg-stone-100 rounded"><Truck size={16} /></div>
                                            <span className="font-bold">Bank Transfer</span>
                                        </div>
                                        {paymentMethod === 'bank_transfer' && <CheckCircle2 className="text-highlight" size={20} />}
                                    </button>
                                </div>

                                <div className="pt-4 flex items-center justify-between border-t border-stone-100 mt-4">
                                    <button
                                        onClick={() => setStep('shipping')}
                                        className="text-stone-500 font-bold hover:text-stone-800"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handlePlaceOrder}
                                        disabled={loading}
                                        className="bg-highlight text-white px-8 py-3 rounded-xl font-bold hover:bg-yellow-500 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 flex items-center gap-2"
                                    >
                                        {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                                        {loading ? 'Processing...' : `Pay ${currency === 'NGN' ? '₦' : '$'}${totalAmount.toLocaleString()}`}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 sticky top-6">
                            <h3 className="text-lg font-bold brand-font mb-4">Order Summary</h3>

                            {/* Group items by vendor */}
                            <div className="space-y-4 mb-6">
                                {itemsByVendor.map((group) => (
                                    <div key={group.vendorId} className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-stone-400">
                                            <Store size={12} />
                                            {group.vendorName}
                                        </div>
                                        {group.items.map((item) => (
                                            <div key={item.productId} className="flex items-start gap-3 text-sm pl-4">
                                                <div className="w-10 h-10 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0">
                                                    {item.image && <img src={item.image} className="w-full h-full object-cover" alt={item.name} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium line-clamp-1">{item.name}</p>
                                                    <p className="text-stone-400 text-xs">Qty: {item.quantity}</p>
                                                </div>
                                                <div className="font-bold text-sm">
                                                    {currency === 'NGN' ? '₦' : '$'}{(item.price * item.quantity).toLocaleString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            {itemsByVendor.length > 1 && (
                                <p className="text-xs text-stone-400 mb-4 bg-stone-50 p-2 rounded-lg">
                                    Your order will be split into {itemsByVendor.length} separate orders from different vendors.
                                </p>
                            )}

                            <div className="border-t border-stone-100 pt-4 space-y-2">
                                <div className="flex justify-between text-stone-500">
                                    <span>Subtotal</span>
                                    <span>{currency === 'NGN' ? '₦' : '$'}{totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-stone-500">
                                    <span>Shipping</span>
                                    <span>Free</span>
                                </div>
                                <div className="flex justify-between font-bold text-xl text-stone-800 pt-2">
                                    <span>Total</span>
                                    <span>{currency === 'NGN' ? '₦' : '$'}{totalAmount.toLocaleString()}</span>
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
                amount={totalAmount}
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
