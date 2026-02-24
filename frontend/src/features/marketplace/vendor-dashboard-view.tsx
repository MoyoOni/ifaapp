import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, ShoppingBag, TrendingUp, Plus, Edit, Trash2, ArrowRight, Filter, MessageCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';
import { DEMO_PRODUCTS, DEMO_USERS } from '@/demo';
import { UserRole } from '@common';
import { useNavigate } from 'react-router-dom';

interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  status: string;
  verifiedAt?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  stock?: number;
  status: string;
  category: string;
  images: string[];
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  items: Array<{
    product: {
      name: string;
    };
    quantity: number;
  }>;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: string;
  lastUpdated: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface VendorDashboardViewProps {
  onManageProducts?: () => void;
  onManageOrders?: () => void;
  onEditProduct?: (productId: string) => void;
  onCreateProduct?: () => void;
  onViewOrder?: (orderId: string) => void;
  onManageSupport?: () => void;
  initialTab?: 'overview' | 'inventory' | 'orders' | 'revenue' | 'support';
}

/**
 * Vendor Dashboard View Component
 * Central hub for vendors to manage products, orders, and earnings
 */
const VendorDashboardView: React.FC<VendorDashboardViewProps> = ({
  onManageProducts,
  onManageOrders,
  onEditProduct,
  onCreateProduct,
  onViewOrder,
  onManageSupport,
  initialTab = 'overview'
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'inventory' | 'orders' | 'revenue' | 'support'>(initialTab);

  const handleManageProducts = () => {
    setSelectedTab('inventory');
    if (onManageProducts) onManageProducts();
    else navigate('/vendor/workshop');
  };

  const handleManageOrders = () => {
    setSelectedTab('orders');
    if (onManageOrders) onManageOrders();
    else navigate('/vendor/orders');
  };

  const handleManageSupport = () => {
    setSelectedTab('support');
    if (onManageSupport) onManageSupport();
    else navigate('/vendor/support');
  };

  const handleCreateProduct = () => {
    if (onCreateProduct) onCreateProduct();
    else navigate('/vendor/products/new');
  };

  const handleEditProduct = (productId: string) => {
    if (onEditProduct) onEditProduct(productId);
    else navigate(`/vendor/products/edit/${productId}`);
  };

  const handleViewOrder = (orderId: string) => {
    if (onViewOrder) onViewOrder(orderId);
    else navigate(`/vendor/orders/${orderId}`);
  };

  // Fetch vendor profile with demo fallback
  const { data: vendor } = useQuery<Vendor>({
    queryKey: ['vendor-profile', user?.id],
    queryFn: async () => {
      try {
        const response = await api.get('/marketplace/vendors', {
          params: { userId: user?.id },
        });
        const apiVendor = response.data?.[0] || null;
        if (apiVendor) {
          return apiVendor;
        }
        const demoVendor = DEMO_USERS['demo-vendor-1'];
        if (demoVendor) {
          return {
            id: demoVendor.vendorId || demoVendor.id,
            userId: demoVendor.id,
            businessName: demoVendor.name,
            status: demoVendor.verified ? 'APPROVED' : 'PENDING',
            verifiedAt: demoVendor.verified ? demoVendor.createdAt : undefined,
          };
        }
        return null;
      } catch (e) {
        logger.error('Failed to fetch vendor profile', e);
        const demoVendor = DEMO_USERS['demo-vendor-1'];
        return demoVendor
          ? {
            id: demoVendor.vendorId || demoVendor.id,
            userId: demoVendor.id,
            businessName: demoVendor.name,
            status: demoVendor.verified ? 'APPROVED' : 'PENDING',
            verifiedAt: demoVendor.verified ? demoVendor.createdAt : undefined,
          }
          : null;
      }
    },
    enabled: !!user,
  });

  // Fetch products with demo fallback
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['vendor-products', vendor?.id],
    queryFn: async () => {
      try {
        const response = await api.get('/marketplace/products', {
          params: { vendorId: vendor?.id },
        });
        return response.data || [];
      } catch (e) {
        logger.error('Failed to fetch products', e);
        return Object.values(DEMO_PRODUCTS)
          .filter((product) => product.vendorId === vendor?.id || !vendor?.id)
          .map((product) => ({
            id: product.id,
            name: product.name,
            price: product.price,
            currency: product.currency,
            stock: product.stock,
            status: product.status,
            category: product.category,
            images: product.images,
          }));
      }
    },
    enabled: !!vendor?.id || user?.role === UserRole.VENDOR,
  });

  // Fetch orders with demo fallback
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['vendor-orders', vendor?.id],
    queryFn: async () => {
      try {
        const response = await api.get('/marketplace/orders', {
          params: { vendorId: vendor?.id },
        });
        return response.data || [];
      } catch (e) {
        logger.error('Failed to fetch orders', e);
        return [
          {
            id: 'order-001',
            status: 'PENDING',
            totalAmount: 25000,
            currency: 'NGN',
            createdAt: new Date().toISOString(),
            items: [
              { product: { name: 'Ifa Divination Chain' }, quantity: 1 },
            ],
          },
          {
            id: 'order-002',
            status: 'DELIVERED',
            totalAmount: 12000,
            currency: 'NGN',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            items: [
              { product: { name: 'Sacred Palm Nuts' }, quantity: 2 },
            ],
          },
          {
            id: 'order-003',
            status: 'PAID',
            totalAmount: 5000,
            currency: 'NGN',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            items: [
              { product: { name: 'Ritual Beads' }, quantity: 1 },
            ],
          },
        ];
      }
    },
    enabled: !!vendor?.id || user?.role === UserRole.VENDOR,
  });

  // Mock support tickets data
  const supportTickets: SupportTicket[] = [
    {
      id: 'ticket-001',
      subject: 'Product listing not showing correctly',
      status: 'open',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      lastUpdated: new Date().toISOString(),
      priority: 'high'
    },
    {
      id: 'ticket-002',
      subject: 'Payment not processed for order #abc123',
      status: 'in-progress',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      lastUpdated: new Date(Date.now() - 3600000).toISOString(),
      priority: 'urgent'
    },
    {
      id: 'ticket-003',
      subject: 'Request to update business information',
      status: 'resolved',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      lastUpdated: new Date(Date.now() - 86400000).toISOString(),
      priority: 'medium'
    }
  ];

  // Calculate stats
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === 'ACTIVE').length;
  const pendingOrders = orders.filter((o) => o.status === 'PENDING' || o.status === 'PAID').length;
  const totalRevenue = orders
    .filter((o) => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const openTickets = supportTickets.filter(ticket => ticket.status !== 'resolved').length;

  if (!vendor) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-800 p-4 sm:p-6 flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
            <ShoppingBag size={32} />
          </div>
          <h3 className="text-xl font-bold brand-font">No Store Found</h3>
          <p className="text-stone-500">You don't have a vendor profile yet.</p>
          <p className="text-sm text-stone-400">Apply to become a vendor to access the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold brand-font text-stone-800">Vendor Dashboard</h1>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <p className="text-stone-500 font-medium truncate max-w-[60%]">{vendor.businessName}</p>
              <span className="w-1 h-1 bg-stone-300 rounded-full hidden sm:block"></span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${vendor.status === 'APPROVED'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : vendor.status === 'PENDING'
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-red-100 text-red-700 border border-red-200'
                  }`}
              >
                {vendor.status}
              </span>
            </div>
          </div>
          {/* Add Product Button (Always visible shortcut) */}
          <button
            onClick={handleCreateProduct}
            className="flex items-center justify-center sm:justify-start gap-2 px-4 sm:px-5 py-3 bg-highlight text-white rounded-xl font-bold hover:bg-yellow-500 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus size={20} className="shrink-0" />
            <span>Add Product</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs sm:text-sm font-bold text-stone-400 uppercase tracking-wider">Products</span>
              <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                <Package size={20} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-stone-800">{totalProducts}</div>
            <div className="text-xs text-stone-500 mt-1 font-medium">{activeProducts} active listings</div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs sm:text-sm font-bold text-stone-400 uppercase tracking-wider">Orders</span>
              <div className="p-2 bg-purple-50 text-purple-500 rounded-lg">
                <ShoppingBag size={20} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-stone-800">{orders.length}</div>
            <div className="text-xs text-stone-500 mt-1 font-medium">{pendingOrders} pending</div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            {/* Subtle shine effect */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-highlight/5 rounded-full -mr-8 -mt-8 blur-2xl"></div>

            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="text-xs sm:text-sm font-bold text-stone-400 uppercase tracking-wider">Revenue</span>
              <div className="p-2 bg-green-50 text-green-500 rounded-lg">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-green-700 relative z-10">
              ₦{totalRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-stone-500 mt-1 font-medium relative z-10">Total earned</div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs sm:text-sm font-bold text-stone-400 uppercase tracking-wider">Support Tickets</span>
              <div className={`p-2 rounded-lg ${openTickets > 0 ? 'bg-orange-50 text-orange-500' : 'bg-stone-50 text-stone-400'}`}>
                <MessageCircle size={20} />
              </div>
            </div>
            <div className="text-lg font-bold text-stone-800">{openTickets}</div>
            <div className="text-xs text-stone-500 mt-1 font-medium">{supportTickets.length} total</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-stone-200 overflow-x-auto pb-px">
          <div className="flex items-center gap-4 sm:gap-8 min-w-max">
            {(['overview', 'inventory', 'orders', 'revenue', 'support'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`py-3 px-2 font-bold text-sm transition-all relative whitespace-nowrap ${selectedTab === tab
                  ? 'text-highlight'
                  : 'text-stone-400 hover:text-stone-600'
                  }`}
              >
                {tab === 'inventory' ? 'Inventory' : tab === 'revenue' ? 'Revenue/Analytics' : tab === 'support' ? 'Customer Care' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                {selectedTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-highlight rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {selectedTab === 'overview' && (
            <div className="space-y-6 sm:space-y-8">
              {/* Quick Actions */}
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <button
                  onClick={handleManageProducts}
                  className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Package size={24} />
                    </div>
                    <ArrowRight size={20} className="text-stone-300 group-hover:text-highlight group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-800 mb-1">Manage Products</h3>
                  <p className="text-sm text-stone-500">Add, edit, or remove your product listings</p>
                </button>

                <button
                  onClick={handleManageOrders}
                  className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ShoppingBag size={24} />
                    </div>
                    <ArrowRight size={20} className="text-stone-300 group-hover:text-highlight group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-800 mb-1">Manage Orders</h3>
                  <p className="text-sm text-stone-500">View and process customer orders</p>
                </button>

                <button
                  onClick={handleManageSupport}
                  className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MessageCircle size={24} />
                    </div>
                    <ArrowRight size={20} className="text-stone-300 group-hover:text-highlight group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-800 mb-1">Customer Care</h3>
                  <p className="text-sm text-stone-500">View and respond to support tickets</p>
                </button>
              </div>

              {/* Recent Activity Section */}
              <div className="grid grid-cols-1 gap-6 sm:gap-8">
                {/* Recent Products */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg sm:text-xl font-bold text-stone-800">Recent Products</h2>
                    <button onClick={handleManageProducts} className="text-xs font-bold text-highlight uppercase hover:underline">View All</button>
                  </div>
                  {products.slice(0, 5).length > 0 ? (
                    <div className="space-y-3">
                      {products.slice(0, 5).map((product) => (
                        <div
                          key={product.id}
                          className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm flex items-center gap-4 hover:border-highlight/30 transition-colors"
                        >
                          {product.images && product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-14 h-14 rounded-lg object-cover shadow-sm"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-stone-100 flex items-center justify-center">
                              <Package size={20} className="text-stone-300" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-stone-800 truncate">{product.name}</div>
                            <div className="text-sm text-stone-500 font-medium">
                              {product.currency === 'NGN' ? '₦' : '$'}
                              {product.price.toLocaleString()}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${product.status === 'ACTIVE'
                              ? 'bg-green-50 text-green-600'
                              : 'bg-stone-100 text-stone-500'
                              }`}
                          >
                            {product.status}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProduct(product.id);
                            }}
                            className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors"
                          >
                            <Edit size={16} className="text-stone-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-stone-100 rounded-xl p-8 text-center border border-stone-200 border-dashed">
                      <Package size={32} className="mx-auto mb-2 opacity-30 text-stone-500" />
                      <p className="text-stone-400 font-bold text-sm">No products</p>
                    </div>
                  )}
                </div>

                {/* Recent Orders */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg sm:text-xl font-bold text-stone-800">Recent Orders</h2>
                    <button onClick={handleManageOrders} className="text-xs font-bold text-highlight uppercase hover:underline">View All</button>
                  </div>
                  {orders.slice(0, 5).length > 0 ? (
                    <div className="space-y-3">
                      {orders.slice(0, 5).map((order) => (
                        <div
                          key={order.id}
                          onClick={() => handleViewOrder(order.id)}
                          className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between hover:border-highlight/30 transition-colors gap-3 sm:gap-0 cursor-pointer"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-stone-800 text-sm">Order #{order.id.slice(0, 8)}</div>
                            <div className="text-xs text-stone-400 font-medium mt-1 sm:mt-0">
                              {order.items.length} item{order.items.length !== 1 ? 's' : ''} •{' '}
                              {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right sm:text-right">
                            <div className="font-bold text-stone-800 text-sm">
                              {order.currency === 'NGN' ? '₦' : '$'}
                              {order.totalAmount.toLocaleString()}
                            </div>
                            <span
                              className={`inline-block text-[10px] font-bold uppercase tracking-wider mt-1 sm:mt-0 ${order.status === 'DELIVERED'
                                ? 'text-green-600'
                                : order.status === 'SHIPPED'
                                  ? 'text-blue-500'
                                  : 'text-stone-400'
                                }`}
                            >
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-stone-100 rounded-xl p-8 text-center border border-stone-200 border-dashed">
                      <ShoppingBag size={32} className="mx-auto mb-2 opacity-30 text-stone-500" />
                      <p className="text-stone-400 font-bold text-sm">No orders yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'inventory' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg sm:text-xl font-bold text-stone-800">Your Products</h2>
                <div className="flex gap-3">
                  <div className="relative">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-600 text-sm font-medium">
                      <Filter size={16} />
                      Filter
                    </button>
                  </div>
                  <button
                    onClick={handleCreateProduct}
                    className="flex items-center gap-2 px-4 py-2 bg-highlight text-white rounded-xl font-medium"
                  >
                    <Plus size={16} />
                    Add Product
                  </button>
                </div>
              </div>

              {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-stone-100 group"
                    >
                      <div className="relative aspect-video bg-stone-100 overflow-hidden">
                        {product.images && product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={48} className="text-stone-300" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <span
                            className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm ${product.status === 'ACTIVE'
                              ? 'bg-white text-green-600'
                              : 'bg-stone-200 text-stone-500'
                              }`}
                          >
                            {product.status}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 sm:p-5 space-y-4">
                        <div>
                          <h3 className="font-bold text-stone-800 text-lg line-clamp-1">{product.name}</h3>
                          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mt-1">{product.category}</p>
                        </div>

                        <div className="flex items-end justify-between">
                          <div className="text-xl sm:text-2xl font-bold text-stone-800">
                            <span className="text-sm sm:text-base align-top opacity-60 font-medium mr-0.5">{product.currency === 'NGN' ? '₦' : '$'}</span>
                            {product.price.toLocaleString()}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <button
                            onClick={() => handleEditProduct(product.id)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-sm transition-colors"
                          >
                            <Edit size={16} />
                            Edit
                          </button>
                          <button className="flex items-center justify-center gap-2 px-4 py-2 border border-red-100 text-red-500 hover:bg-red-50 rounded-xl font-bold text-sm transition-colors">
                            <Trash2 size={16} />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl sm:rounded-[2rem] p-6 sm:p-12 text-center border border-stone-100 shadow-sm">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-highlight/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-highlight">
                    <Package size={32} />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-stone-800 mb-2">No Products Yet</h3>
                  <p className="text-stone-500 max-w-xs sm:max-w-md mx-auto mb-6 sm:mb-8">Start your journey by adding your first spiritual product or service to the marketplace.</p>
                  <button
                    onClick={handleCreateProduct}
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-highlight text-white rounded-xl font-bold hover:bg-yellow-500 transition-all shadow-lg"
                  >
                    Add Your First Product
                  </button>
                </div>
              )}
            </div>
          )}

          {selectedTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="text-lg sm:text-xl font-bold text-stone-800">Order History</h2>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => handleViewOrder(order.id)}
                      className="bg-white border border-stone-100 rounded-2xl p-4 sm:p-6 hover:shadow-md hover:border-highlight/30 transition-all cursor-pointer group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 group-hover:bg-highlight/10 group-hover:text-highlight transition-colors">
                            <ShoppingBag size={20} />
                          </div>
                          <div>
                            <div className="font-bold text-stone-800 text-lg">Order #{order.id.slice(0, 8)}</div>
                            <div className="text-sm text-stone-500 font-medium">
                              Placed on {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-3 py-1 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider ${order.status === 'DELIVERED'
                              ? 'bg-green-100 text-green-700'
                              : order.status === 'SHIPPED'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-stone-100 text-stone-500'
                              }`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>

                      <div className="bg-stone-50 rounded-xl p-3 sm:p-4 mb-4 space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between text-sm font-medium text-stone-600">
                            <span>
                              {item.product.name} <span className="text-stone-400">× {item.quantity}</span>
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-stone-400 uppercase tracking-widest">Total Amount</div>
                        <div className="text-lg sm:text-xl font-bold text-stone-800">
                          {order.currency === 'NGN' ? '₦' : '$'}
                          {order.totalAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl sm:rounded-[2rem] p-6 sm:p-12 text-center border border-stone-100 shadow-sm">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-stone-300">
                    <ShoppingBag size={24} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-stone-800 mb-2">No Orders Yet</h3>
                  <p className="text-stone-500">Your orders will appear here once customers start purchasing.</p>
                </div>
              )}
            </div>
          )}

          {selectedTab === 'revenue' && (
            <div className="space-y-6">
              <h2 className="text-lg sm:text-xl font-bold text-stone-800">Financial Overview</h2>
              <div className="bg-white border border-stone-100 rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start gap-4 mb-4 sm:mb-6">
                  <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
                    <TrendingUp size={32} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-stone-400 uppercase tracking-wider">Total Revenue</div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-stone-800 mt-1">
                      ₦{totalRevenue.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="pt-4 sm:pt-6 border-t border-stone-100">
                  <p className="text-sm text-stone-500 font-medium leading-relaxed">
                    This represents your total earnings from delivered orders. Funds are automatically released to your wallet 24 hours after delivery confirmation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'support' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg sm:text-xl font-bold text-stone-800">Customer Care</h2>
                <button className="px-4 py-2 bg-highlight text-white rounded-xl font-bold text-sm">New Ticket</button>
              </div>
              
              {supportTickets.length > 0 ? (
                <div className="space-y-4">
                  {supportTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="bg-white border border-stone-100 rounded-2xl p-4 sm:p-6 hover:shadow-md hover:border-highlight/30 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 group-hover:bg-highlight/10 group-hover:text-highlight transition-colors">
                            <MessageCircle size={20} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-stone-800 text-lg truncate">{ticket.subject}</div>
                            <div className="text-sm text-stone-500 font-medium flex items-center gap-3 mt-1 flex-wrap">
                              <span>Ticket #{ticket.id.slice(-3)}</span>
                              <span>•</span>
                              <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <span
                            className={`px-3 py-1 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider ${
                              ticket.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                              ticket.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}
                          >
                            {ticket.priority}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider ${
                              ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                              ticket.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                              'bg-stone-100 text-stone-500'
                            }`}
                          >
                            {ticket.status.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                        <div className="text-xs font-bold text-stone-400 uppercase tracking-widest">Last Updated</div>
                        <div className="text-sm text-stone-500 font-medium">{new Date(ticket.lastUpdated).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl sm:rounded-[2rem] p-6 sm:p-12 text-center border border-stone-100 shadow-sm">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-stone-300">
                    <MessageCircle size={24} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-stone-800 mb-2">No Support Tickets</h3>
                  <p className="text-stone-500">Your support tickets will appear here once submitted.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorDashboardView;