import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Filter, Search, ShoppingBag, Eye, Truck, CheckCircle, Clock } from 'lucide-react';

import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import VendorOrderDetailPanel from './vendor-order-detail-panel';
import { isDevModeActive } from '@/shared/utils/dev-mode';

interface VendorOrderListViewProps {
    onViewOrder?: (orderId: string) => void;
    onBack?: () => void;
}

const VendorOrderListView: React.FC<VendorOrderListViewProps> = ({
    onViewOrder,
    onBack,
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [detailOrderId, setDetailOrderId] = useState<string | null>(null);

    const handleBack = () => (onBack ? onBack() : navigate('/vendor/dashboard'));
    const handleViewOrder = (orderId: string) => {
        if (onViewOrder) { onViewOrder(orderId); return; }
        setDetailOrderId(orderId);
    };

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['vendor-orders', user?.id],
        queryFn: async () => {
            const res = await api.get('/marketplace/orders', { params: { vendorId: user!.id } });
            return res.data ?? [];
        },
        enabled: !!user?.id && !isDevModeActive(),
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING': return <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock size={12} /> Pending</span>;
            case 'SHIPPED': return <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Truck size={12} /> Shipped</span>;
            case 'DELIVERED': return <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle size={12} /> Delivered</span>;
            default: return <span className="px-2 py-1 bg-muted text-foreground rounded-full text-xs font-bold">{status}</span>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
        {detailOrderId && (
            <VendorOrderDetailPanel
                orderId={detailOrderId}
                onClose={() => setDetailOrderId(null)}
            />
        )}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button onClick={handleBack} className="text-sm font-bold text-muted-foreground hover:text-foreground mb-1">← Dashboard</button>
                    <h1 className="text-3xl font-bold brand-font text-foreground">Orders</h1>
                    <p className="text-muted-foreground">Track and fulfill client purchases</p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-card p-4 rounded-xl border border-border flex gap-4 md:items-center flex-col md:flex-row shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search orders..."
                        className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border text-foreground rounded-lg focus:outline-none focus:border-highlight"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted font-bold text-sm">
                    <Filter size={16} /> Filter
                </button>
            </div>

            {/* Order List */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="p-4 font-bold text-muted-foreground text-sm uppercase tracking-wider">Order ID</th>
                                <th className="p-4 font-bold text-muted-foreground text-sm uppercase tracking-wider">Date</th>
                                <th className="p-4 font-bold text-muted-foreground text-sm uppercase tracking-wider">Customer</th>
                                <th className="p-4 font-bold text-muted-foreground text-sm uppercase tracking-wider">Status</th>
                                <th className="p-4 font-bold text-muted-foreground text-sm uppercase tracking-wider">Total</th>
                                <th className="p-4 font-bold text-muted-foreground text-sm uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">Loading orders...</td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                            <ShoppingBag className="text-muted-foreground" size={32} />
                                        </div>
                                        <p className="text-muted-foreground font-medium">No orders found.</p>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order: any) => (
                                    <tr key={order.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => handleViewOrder(order.id)}>
                                        <td className="p-4 font-bold text-foreground">#{String(order.id).slice(0, 8).toUpperCase()}</td>
                                        <td className="p-4 text-muted-foreground text-sm">{new Date(order.createdAt ?? order.date).toLocaleDateString()}</td>
                                        <td className="p-4 font-bold text-foreground capitalize">{order.buyer?.name ?? order.customer ?? 'Customer'}</td>
                                        <td className="p-4">{getStatusBadge(order.status)}</td>
                                        <td className="p-4 font-bold text-foreground">₦{Number(order.totalAmount ?? order.total ?? 0).toLocaleString()}</td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleViewOrder(order.id); }}
                                                className="px-3 py-1.5 border border-border rounded-lg text-xs font-bold hover:bg-muted hover:border-highlight hover:text-highlight transition-colors flex items-center gap-1 ml-auto"
                                            >
                                                <Eye size={12} /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VendorOrderListView;
