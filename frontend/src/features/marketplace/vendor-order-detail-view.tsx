import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Truck, Package, User, MapPin, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { OrderStatus, UserRole } from '@common';
import { DEMO_PRODUCTS, getDemoProductById, getDemoUserById, type DemoUser } from '@/demo';

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

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Order {
  id: string;
  customerId: string;
  vendorId: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
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
  items: OrderItem[];
  customer?: Customer;
}

interface VendorOrderDetailViewProps {
  orderId: string;
  onBack?: () => void;
}

/**
 * Vendor Order Detail View Component
 * Detailed order view with customer info, items, and status update controls
 */
const VendorOrderDetailView: React.FC<VendorOrderDetailViewProps> = ({ orderId, onBack }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [showingTrackingInput, setShowingTrackingInput] = useState(false);

  // Fetch order details
  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['vendor-order-detail', orderId],
    queryFn: async () => {
      try {
        const response = await api.get(`/marketplace/orders/${orderId}`);
        return response.data;
      } catch (error) {
        if (!isDemoMode) throw error;

        logger.warn('Failed to fetch vendor order detail, using demo data');
        const demoClient = getDemoUserById('demo-client-1') || ({ id: 'demo-client-1', name: 'Client', role: UserRole.CLIENT } as DemoUser);
        const demoProduct = getDemoProductById('prod-1')
          || getDemoProductById('prod-2')
          || Object.values(DEMO_PRODUCTS)[0]
          || {
            id: 'prod-1',
            name: 'Demo Product',
            description: 'Demo product',
            price: 0,
            currency: 'NGN',
            stock: 0,
            status: 'ACTIVE',
            vendorId: 'demo-vendor-1',
            images: [],
            category: 'Spiritual Tools',
          };
        return {
          id: orderId,
          customerId: demoClient.id,
          vendorId: demoProduct.vendorId,
          status: OrderStatus.PENDING,
          totalAmount: demoProduct.price,
          currency: demoProduct.currency,
          shippingAddress: '123 Market Road, Lagos',
          createdAt: new Date().toISOString(),
          items: [
            {
              id: 'item-1',
              productId: demoProduct.id,
              quantity: 1,
              price: demoProduct.price,
              product: {
                id: demoProduct.id,
                name: demoProduct.name,
                images: demoProduct.images,
              },
            },
          ],
          customer: {
            id: demoClient.id,
            name: demoClient.name,
            email: demoClient.email || 'client@example.com',
            phone: demoClient.phone,
          },
        };
      }
    },
    enabled: !!orderId,
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      status,
      trackingNum,
      carrierName,
      trackingLink
    }: {
      status: OrderStatus;
      trackingNum?: string;
      carrierName?: string;
      trackingLink?: string;
    }) => {
      const updateData: any = { status };

      // Set timestamps based on status
      if (status === OrderStatus.SHIPPED) {
        updateData.shippedAt = new Date().toISOString();
        if (trackingNum) {
          updateData.trackingNumber = trackingNum;
        }
        if (carrierName) {
          updateData.carrier = carrierName;
        }
        if (trackingLink) {
          updateData.trackingUrl = trackingLink;
        }
      } else if (status === OrderStatus.DELIVERED) {
        updateData.deliveredAt = new Date().toISOString();
      } else if (status === OrderStatus.CANCELLED) {
        updateData.cancelledAt = new Date().toISOString();
      }

      const response = await api.patch(`/marketplace/orders/${orderId}`, updateData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-order-detail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      setShowingTrackingInput(false);
      setTrackingNumber('');
      setCarrier('');
      setTrackingUrl('');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-white p-6 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background text-white p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-muted">Order not found.</p>
          {onBack && (
            <button onClick={onBack} className="mt-6 px-6 py-3 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors">
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  const canMarkShipped = order.status === OrderStatus.PENDING || order.status === OrderStatus.PAID;
  const canMarkDelivered = order.status === OrderStatus.SHIPPED;
  const canCancel = order.status === OrderStatus.PENDING || order.status === OrderStatus.PAID;

  return (
    <div className="min-h-screen bg-background text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="text-highlight hover:opacity-80 transition-opacity"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-4xl font-bold brand-font text-white">Order Details</h1>
            <p className="text-muted">Order #{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <span
            className={`px-4 py-2 rounded-lg text-sm font-bold ${order.status === OrderStatus.DELIVERED
                ? 'bg-primary/20 text-primary border border-primary/30'
                : order.status === OrderStatus.SHIPPED
                  ? 'bg-highlight/20 text-highlight border border-highlight/30'
                  : order.status === OrderStatus.CANCELLED
                    ? 'bg-red-400/20 text-red-400 border border-red-400/30'
                    : 'bg-white/10 text-muted border border-white/20'
              }`}
          >
            {order.status}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <h2 className="text-xl font-bold">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 pb-4 border-b border-white/10 last:border-b-0 last:pb-0 cursor-pointer" onClick={() => navigate(`/marketplace/${item.productId}`)}>
                    {item.product.images && item.product.images[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center">
                        <Package size={24} className="text-muted" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold">{item.product.name}</h3>
                      <p className="text-sm text-muted">
                        Quantity: {item.quantity} × {order.currency === 'NGN' ? '₦' : '$'}
                        {item.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right font-bold">
                      {order.currency === 'NGN' ? '₦' : '$'}
                      {(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-bold text-highlight">
                  {order.currency === 'NGN' ? '₦' : '$'}
                  {order.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Customer Information */}
            {order.customer && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <User size={20} />
                  Customer Information
                </h2>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted">Name:</span>
                    <p className="font-bold">{order.customer.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted">Email:</span>
                    <p className="font-bold">{order.customer.email}</p>
                  </div>
                  {order.customer.phone && (
                    <div>
                      <span className="text-sm text-muted">Phone:</span>
                      <p className="font-bold">{order.customer.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <MapPin size={20} />
                  Shipping Address
                </h2>
                <p className="text-muted">{order.shippingAddress}</p>
              </div>
            )}

            {/* Order Timeline */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <h2 className="text-xl font-bold">Order Timeline</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${order.createdAt ? 'bg-highlight' : 'bg-white/20'}`} />
                  <div>
                    <p className="font-bold text-sm">Order Placed</p>
                    <p className="text-xs text-muted">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
                {order.paidAt && (
                  <div className="flex items-center gap-3">
                    <CheckCircle size={16} className="text-primary" />
                    <div>
                      <p className="font-bold text-sm">Paid</p>
                      <p className="text-xs text-muted">
                        {new Date(order.paidAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {order.shippedAt && (
                  <div className="flex items-center gap-3">
                    <Truck size={16} className="text-highlight" />
                    <div>
                      <p className="font-bold text-sm">Shipped</p>
                      <p className="text-xs text-muted">
                        {new Date(order.shippedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {order.deliveredAt && (
                  <div className="flex items-center gap-3">
                    <CheckCircle size={16} className="text-primary" />
                    <div>
                      <p className="font-bold text-sm">Delivered</p>
                      <p className="text-xs text-muted">
                        {new Date(order.deliveredAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {order.cancelledAt && (
                  <div className="flex items-center gap-3">
                    <XCircle size={16} className="text-red-400" />
                    <div>
                      <p className="font-bold text-sm">Cancelled</p>
                      <p className="text-xs text-muted">
                        {new Date(order.cancelledAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Actions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <h2 className="text-xl font-bold">Order Actions</h2>

              {/* Shipping Tracking Input */}
              {showingTrackingInput && (
                <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-highlight/30">
                  <h3 className="text-sm font-bold text-highlight mb-3">Shipping Tracking Information</h3>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">
                      Tracking Number *
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">
                      Carrier (Optional)
                    </label>
                    <input
                      type="text"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      placeholder="e.g., DHL, FedEx, Nigeria Post"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">
                      Tracking URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      placeholder="https://tracking.example.com/..."
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-highlight"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        updateStatusMutation.mutate({
                          status: OrderStatus.SHIPPED,
                          trackingNum: trackingNumber,
                          carrierName: carrier || undefined,
                          trackingLink: trackingUrl || undefined,
                        });
                      }}
                      disabled={updateStatusMutation.isPending || !trackingNumber.trim()}
                      className="flex-1 px-4 py-2 bg-highlight text-foreground rounded-lg font-bold hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {updateStatusMutation.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Truck size={16} />
                      )}
                      Mark Shipped
                    </button>
                    <button
                      onClick={() => {
                        setShowingTrackingInput(false);
                        setTrackingNumber('');
                        setCarrier('');
                        setTrackingUrl('');
                      }}
                      className="px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {canMarkShipped && !showingTrackingInput && (
                  <button
                    onClick={() => setShowingTrackingInput(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-highlight text-foreground rounded-lg font-bold hover:bg-secondary transition-colors"
                  >
                    <Truck size={20} />
                    Mark as Shipped
                  </button>
                )}

                {canMarkDelivered && (
                  <button
                    onClick={() => updateStatusMutation.mutate({ status: OrderStatus.DELIVERED })}
                    disabled={updateStatusMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg font-bold hover:bg-highlight transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updateStatusMutation.isPending ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <CheckCircle size={20} />
                    )}
                    Mark as Delivered
                  </button>
                )}

                {canCancel && !showingTrackingInput && (
                  <button
                    onClick={() => updateStatusMutation.mutate({ status: OrderStatus.CANCELLED })}
                    disabled={updateStatusMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-400/30 text-red-400 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updateStatusMutation.isPending ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <XCircle size={20} />
                    )}
                    Cancel Order
                  </button>
                )}
              </div>
            </div>

            {/* Order Notes */}
            {order.notes && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-bold mb-2">Notes</h3>
                <p className="text-sm text-muted">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorOrderDetailView;
