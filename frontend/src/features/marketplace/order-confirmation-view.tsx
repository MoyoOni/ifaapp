import React from 'react';
import { CheckCircle, ShoppingBag, Home } from 'lucide-react';

interface OrderConfirmationViewProps {
    orderId: string;
    onContinueShopping: () => void;
    onViewOrder?: (id: string) => void;
}

const OrderConfirmationView: React.FC<OrderConfirmationViewProps> = ({
    orderId,
    onContinueShopping,
    // onViewOrder
}) => {
    return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 animate-in zoom-in duration-500">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-stone-100 text-center relative overflow-hidden">

                {/* Confetti / Decoration Background */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-highlight via-yellow-400 to-highlight"></div>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-50 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-green-50 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <CheckCircle size={48} strokeWidth={3} />
                    </div>

                    <h1 className="text-3xl font-bold brand-font text-stone-800 mb-2">Order Confirmed!</h1>
                    <p className="text-stone-500 mb-6">
                        A dupe! Your order has been successfully placed. We've sent a confirmation email to your inbox.
                    </p>

                    <div className="bg-stone-50 rounded-xl p-4 mb-8 border border-stone-100">
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Order ID</p>
                        <p className="text-xl font-mono font-bold text-stone-800">{orderId}</p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={onContinueShopping}
                            className="w-full py-3.5 bg-highlight text-white rounded-xl font-bold hover:bg-yellow-500 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                            <ShoppingBag size={18} />
                            Continue Shopping
                        </button>

                        <button
                            onClick={() => window.location.reload()} // Quick hack to home, or use callback
                            className="w-full py-3.5 bg-transparent text-stone-500 hover:text-stone-800 font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            <Home size={18} />
                            Return Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmationView;
