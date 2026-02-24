import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Filter, Search, ShoppingBag, Eye, Truck, CheckCircle, Clock } from 'lucide-react';

import { useAuth } from '@/shared/hooks/use-auth';
import { DEMO_USERS } from '@/demo';

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

    const handleBack = () => (onBack ? onBack() : navigate('/vendor/dashboard'));
    const handleViewOrder = (orderId: string) =>
        (onViewOrder ? onViewOrder(orderId) : navigate('/vendor/orders'));

    // Mock query for orders
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['vendor-orders', user?.id],
        queryFn: async () => {
            return [
                { id: 'ord-123', date: '2025-01-20', customer: DEMO_USERS['demo-client-1'].name, total: 45000, status: 'PENDING' },
                { id: 'ord-124', date: '2025-01-18', customer: DEMO_USERS['demo-client-2'].name, total: 12000, status: 'SHIPPED' },
                { id: 'ord-125', date: '2025-01-15', customer: DEMO_USERS['demo-client-3'].name, total: 5000, status: 'DELIVERED' },
            ];
        },
        enabled: !!user?.id
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock size={12} /> Pending</span>;
            case 'SHIPPED': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Truck size={12} /> Shipped</span>;
            case 'DELIVERED': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle size={12} /> Delivered</span>;
            default: return <span className="px-2 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-bold">{status}</span>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button onClick={handleBack} className="text-sm font-bold text-stone-500 hover:text-stone-800 mb-1">← Dashboard</button>
                    <h1 className="text-3xl font-bold brand-font text-stone-900">Orders</h1>
                    <p className="text-stone-500">Track and fulfill client purchases</p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 flex gap-4 md:items-center flex-col md:flex-row shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search orders..."
                        className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-highlight"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 font-bold text-sm">
                    <Filter size={16} /> Filter
                </button>
            </div>

            {/* Order List */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-stone-50 border-b border-stone-200">
                            <tr>
                                <th className="p-4 font-bold text-stone-600 text-sm uppercase tracking-wider">Order ID</th>
                                <th className="p-4 font-bold text-stone-600 text-sm uppercase tracking-wider">Date</th>
                                <th className="p-4 font-bold text-stone-600 text-sm uppercase tracking-wider">Customer</th>
                                <th className="p-4 font-bold text-stone-600 text-sm uppercase tracking-wider">Status</th>
                                <th className="p-4 font-bold text-stone-600 text-sm uppercase tracking-wider">Total</th>
                                <th className="p-4 font-bold text-stone-600 text-sm uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-stone-400">Loading orders...</td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <ShoppingBag className="text-stone-400" size={32} />
                                        </div>
                                        <p className="text-stone-500 font-medium">No orders found.</p>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order: any) => (
                                    <tr key={order.id} className="hover:bg-stone-50 transition-colors cursor-pointer" onClick={() => handleViewOrder(order.id)}>
                                        <td className="p-4 font-bold text-stone-800">#{order.id.toUpperCase()}</td>
                                        <td className="p-4 text-stone-500 text-sm">{order.date}</td>
                                        <td className="p-4 font-bold text-stone-800 capitalize">{order.customer}</td>
                                        <td className="p-4">{getStatusBadge(order.status)}</td>
                                        <td className="p-4 font-bold text-stone-800">₦{order.total.toLocaleString()}</td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleViewOrder(order.id); }}
                                                className="px-3 py-1.5 border border-stone-200 rounded-lg text-xs font-bold hover:bg-white hover:border-highlight hover:text-highlight transition-colors flex items-center gap-1 ml-auto"
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
