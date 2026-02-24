import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, CheckCircle, Clock, XCircle, Truck, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import DisputeFilingForm from '../disputes/dispute-filing-form';
import { DEMO_PRODUCTS, DEMO_USERS } from '@/demo';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    images: string[];
  };
}

interface Order {
  id: string;
  customerId: string;
  vendorId: string;
  status: string;
  totalAmount: number;
  currency: string;
  taxAmount?: number;
  shippingCost?: number;
  shippingAddress?: string;
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
  paymentMethod?: string;
  paymentId?: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  notes?: string;
  createdAt: string;
  vendor: {
    id: string;
    businessName: string;
  };
  items: OrderItem[];
}

interface OrderHistoryViewProps {
  onBack?: () => void;
}

/**
 * Order History View Component
 * Displays customer order history with status tracking
 */
const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [selectedOrderForDispute, setSelectedOrderForDispute] = useState<Order | null>(null);

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['marketplace-orders', user?.id],
    queryFn: async () => {
      try {
        const response = await api.get('/marketplace/orders', {
          params: { customerId: user?.id },
        });
        return response.data;
      } catch (error) {
        if (!isDemoMode) throw error;

        logger.warn('Failed to fetch order history, using demo data');
        const demoCustomer = DEMO_USERS['demo-client-1'];
        const demoVendor = DEMO_USERS['demo-vendor-1'];
        const demoProducts = Object.values(DEMO_PRODUCTS);

        return [
          {
            id: 'order-demo-1',
            customerId: demoCustomer.id,
            vendorId: demoVendor.id,
            status: 'DELIVERED',
            totalAmount: demoProducts[0]?.price || 25000,
            currency: demoProducts[0]?.currency || 'NGN',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            vendor: {
              id: demoVendor.id,
              businessName: demoVendor.name,
            },
            items: demoProducts.slice(0, 2).map((product, index) => ({
              id: `item-${index + 1}`,
              productId: product.id,
              quantity: 1,
              price: product.price,
              product: {
                id: product.id,
                name: product.name,
                images: product.images,
              },
            })),
          },
          {
            id: 'order-demo-2',
            customerId: demoCustomer.id,
            vendorId: demoVendor.id,
            status: 'SHIPPED',
            totalAmount: demoProducts[1]?.price || 12000,
            currency: demoProducts[1]?.currency || 'NGN',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            vendor: {
              id: demoVendor.id,
              businessName: demoVendor.name,
            },
            items: demoProducts.slice(1, 2).map((product, index) => ({
              id: `item-${index + 3}`,
              productId: product.id,
              quantity: 1,
              price: product.price,
              product: {
                id: product.id,
                name: product.name,
                images: product.images,
              },
            })),
          },
        ];
      }
    },
    enabled: !!user,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle size={20} className="text-primary" />;
      case 'SHIPPED':
        return <Truck size={20} className="text-highlight" />;
      case 'DELIVERED':
        return <CheckCircle size={20} className="text-highlight" />;
      case 'CANCELLED':
        return <XCircle size={20} className="text-red-400" />;
      default:
        return <Clock size={20} className="text-muted" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'SHIPPED':
        return 'bg-highlight/20 text-highlight border-highlight/30';
      case 'DELIVERED':
        return 'bg-highlight/20 text-highlight border-highlight/30';
      case 'CANCELLED':
        return 'bg-red-400/20 text-red-400 border-red-400/30';
      default:
        return 'bg-white/10 text-muted border-white/10';
    }
  };

  if (ordersLoading) {
    return (
      <div className="min-h-screen bg-background text-white p-6 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        )}

        <div>
          <h1 className="text-4xl font-bold brand-font text-white mb-2">Order History</h1>
          <p className="text-muted">View and track your orders</p>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <Package size={64} className="mx-auto mb-4 opacity-50" />
            <p className="text-xl mb-2">No orders yet</p>
            <p className="text-sm">Your completed orders will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4"
              >
                {/* Order Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">Order #{order.id.slice(0, 8)}</h3>
                      <span
                        className={`px-3 py-1 rounded-lg border text-sm font-bold flex items-center gap-2 ${getStatusColor(
                          order.status,
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </div>
                    <div className="text-sm text-muted">
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                    {order.vendor && (
                      <div className="text-sm text-muted mt-1">
                        Vendor: {order.vendor.businessName}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-highlight">
                      {order.currency === 'NGN' ? '₦' : '$'}
                      {order.totalAmount.toLocaleString()}
                    </div>
                    {order.shippingCost && (
                      <div className="text-xs text-muted mt-1">
                        Shipping: {order.currency === 'NGN' ? '₦' : '$'}
                        {order.shippingCost.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="pt-4 border-t border-white/10">
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-lg overflow-hidden flex-shrink-0">
                          {item.product.images && item.product.images[0] ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted">
                              <Package size={24} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold">{item.product.name}</div>
                          <div className="text-sm text-muted">
                            Quantity: {item.quantity} × {order.currency === 'NGN' ? '₦' : '$'}
                            {item.price.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right font-bold">
                          {order.currency === 'NGN' ? '₦' : '$'}
                          {(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Timeline */}
                <div className="pt-4 border-t border-white/10">
                  <div className="space-y-2 text-sm">
                    {order.paidAt && (
                      <div className="flex items-center gap-2 text-muted">
                        <CheckCircle size={16} className="text-primary" />
                        <span>Paid on {new Date(order.paidAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {order.shippedAt && (
                      <div className="flex items-center gap-2 text-muted">
                        <Truck size={16} className="text-highlight" />
                        <span>Shipped on {new Date(order.shippedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {order.deliveredAt && (
                      <div className="flex items-center gap-2 text-highlight">
                        <CheckCircle size={16} />
                        <span>Delivered on {new Date(order.deliveredAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {order.cancelledAt && (
                      <div className="flex items-center gap-2 text-red-400">
                        <XCircle size={16} />
                        <span>Cancelled on {new Date(order.cancelledAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                {order.shippingAddress && (
                  <div className="pt-4 border-t border-white/10">
                    <div className="text-sm">
                      <div className="text-muted mb-1">Shipping Address:</div>
                      <div className="text-white">{order.shippingAddress}</div>
                    </div>
                  </div>
                )}

                {/* Tracking Information */}
                {order.trackingNumber && (
                  <div className="pt-4 border-t border-white/10">
                    <div className="text-sm">
                      <div className="text-muted mb-2">Tracking Information:</div>
                      <div className="space-y-1">
                        <div className="text-white font-bold">{order.trackingNumber}</div>
                        {order.carrier && (
                          <div className="text-muted text-xs">Carrier: {order.carrier}</div>
                        )}
                        {order.trackingUrl && (
                          <a
                            href={order.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-highlight hover:underline text-xs"
                          >
                            Track Package →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* File Dispute Button */}
                {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                  <div className="pt-4 border-t border-white/10">
                    <button
                      onClick={() => {
                        setSelectedOrderForDispute(order);
                        setShowDisputeForm(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-400/30 text-red-400 rounded-lg hover:bg-red-400/10 transition-colors text-sm font-medium"
                    >
                      <AlertTriangle size={16} />
                      File a Dispute
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Dispute Filing Modal */}
        {showDisputeForm && selectedOrderForDispute && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
            <div className="bg-background rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar relative">
              <DisputeFilingForm
                orderId={selectedOrderForDispute.id}
                respondentId={selectedOrderForDispute.vendorId || selectedOrderForDispute.vendor.id}
                respondentName={selectedOrderForDispute.vendor?.businessName}
                onSuccess={() => {
                  setShowDisputeForm(false);
                  setSelectedOrderForDispute(null);
                  alert('Dispute filed successfully! It will be reviewed by our team.');
                }}
                onCancel={() => {
                  setShowDisputeForm(false);
                  setSelectedOrderForDispute(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryView;
