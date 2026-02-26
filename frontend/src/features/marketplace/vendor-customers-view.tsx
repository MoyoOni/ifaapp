import React, { useState } from 'react';
import { Users, MapPin, Calendar, Star, Mail, Phone, Eye, Filter, Search } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { DEMO_USERS } from '@/demo';

interface VendorCustomerInsightsViewProps {
  onBack?: () => void;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  rating: number;
  status: 'active' | 'inactive' | 'vip';
}

const VendorCustomerInsightsView: React.FC<VendorCustomerInsightsViewProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const { data: customers = [
    {
      id: 'customer-1',
      name: 'Adebayo Johnson',
      email: 'adebayo@example.com',
      phone: '+234 801 234 5678',
      location: 'Lagos, Nigeria',
      totalOrders: 12,
      totalSpent: 85000,
      lastOrderDate: '2025-01-15',
      rating: 4.8,
      status: 'active'
    },
    {
      id: 'customer-2',
      name: 'Fatimah Yusuf',
      email: 'fatimah@example.com',
      phone: '+234 802 345 6789',
      location: 'Kano, Nigeria',
      totalOrders: 8,
      totalSpent: 52000,
      lastOrderDate: '2025-01-10',
      rating: 4.9,
      status: 'vip'
    },
    {
      id: 'customer-3',
      name: 'Emeka Okonkwo',
      email: 'emeka@example.com',
      phone: '+234 803 456 7890',
      location: 'Abuja, Nigeria',
      totalOrders: 5,
      totalSpent: 32000,
      lastOrderDate: '2024-12-28',
      rating: 4.5,
      status: 'active'
    },
    {
      id: 'customer-4',
      name: 'Adunni Adeyemi',
      email: 'adunni@example.com',
      phone: '+234 804 567 8901',
      location: 'Ibadan, Nigeria',
      totalOrders: 3,
      totalSpent: 18000,
      lastOrderDate: '2024-11-15',
      rating: 4.2,
      status: 'inactive'
    },
    {
      id: 'customer-5',
      name: 'Chinedu Okafor',
      email: 'chinedu@example.com',
      phone: '+234 805 678 9012',
      location: 'Port Harcourt, Nigeria',
      totalOrders: 15,
      totalSpent: 120000,
      lastOrderDate: '2025-01-18',
      rating: 5.0,
      status: 'vip'
    }
  ] as Customer[], isLoading } = useQuery({
    queryKey: ['vendor-customers', user?.id],
    queryFn: async () => {
      // In a real implementation, this would fetch from the backend
      // For demo purposes, returning mock data
      return [
        {
          id: 'customer-1',
          name: 'Adebayo Johnson',
          email: 'adebayo@example.com',
          phone: '+234 801 234 5678',
          location: 'Lagos, Nigeria',
          totalOrders: 12,
          totalSpent: 85000,
          lastOrderDate: '2025-01-15',
          rating: 4.8,
          status: 'active'
        },
        {
          id: 'customer-2',
          name: 'Fatimah Yusuf',
          email: 'fatimah@example.com',
          phone: '+234 802 345 6789',
          location: 'Kano, Nigeria',
          totalOrders: 8,
          totalSpent: 52000,
          lastOrderDate: '2025-01-10',
          rating: 4.9,
          status: 'vip'
        },
        {
          id: 'customer-3',
          name: 'Emeka Okonkwo',
          email: 'emeka@example.com',
          phone: '+234 803 456 7890',
          location: 'Abuja, Nigeria',
          totalOrders: 5,
          totalSpent: 32000,
          lastOrderDate: '2024-12-28',
          rating: 4.5,
          status: 'active'
        },
        {
          id: 'customer-4',
          name: 'Adunni Adeyemi',
          email: 'adunni@example.com',
          phone: '+234 804 567 8901',
          location: 'Ibadan, Nigeria',
          totalOrders: 3,
          totalSpent: 18000,
          lastOrderDate: '2024-11-15',
          rating: 4.2,
          status: 'inactive'
        },
        {
          id: 'customer-5',
          name: 'Chinedu Okafor',
          email: 'chinedu@example.com',
          phone: '+234 805 678 9012',
          location: 'Port Harcourt, Nigeria',
          totalOrders: 15,
          totalSpent: 120000,
          lastOrderDate: '2025-01-18',
          rating: 5.0,
          status: 'vip'
        }
      ];
    },
    enabled: !!user?.id
  });

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          customer.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'vip') return matchesSearch && customer.status === 'vip';
    if (filter === 'active') return matchesSearch && customer.status === 'active';
    if (filter === 'inactive') return matchesSearch && customer.status === 'inactive';
    
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-stone-200 rounded w-1/4"></div>
            <div className="h-12 bg-stone-200 rounded w-1/2 mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
                  <div className="h-6 bg-stone-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-stone-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-stone-200 rounded w-1/3 mb-4"></div>
                  <div className="h-8 bg-stone-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <button 
            onClick={onBack || (() => window.history.back())}
            className="text-sm font-bold text-stone-500 hover:text-stone-800 mb-2 flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold brand-font text-stone-800">Customer Insights</h1>
              <p className="text-stone-500">Understand your customer base and interactions</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs sm:text-sm font-bold text-stone-400 uppercase tracking-wider">Total Customers</span>
              <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                <Users size={20} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-stone-800">{customers.length}</div>
            <div className="text-xs text-stone-500 mt-1 font-medium">+5 new this month</div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs sm:text-sm font-bold text-stone-400 uppercase tracking-wider">VIP Customers</span>
              <div className="p-2 bg-yellow-50 text-yellow-500 rounded-lg">
                <Star size={20} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-stone-800">
              {customers.filter(c => c.status === 'vip').length}
            </div>
            <div className="text-xs text-stone-500 mt-1 font-medium">Top spenders</div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs sm:text-sm font-bold text-stone-400 uppercase tracking-wider">Avg. Rating</span>
              <div className="p-2 bg-green-50 text-green-500 rounded-lg">
                <Star size={20} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-stone-800">
              {customers.reduce((sum, customer) => sum + customer.rating, 0) / customers.length || 0}.0
            </div>
            <div className="text-xs text-stone-500 mt-1 font-medium">Based on reviews</div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs sm:text-sm font-bold text-stone-400 uppercase tracking-wider">Total Revenue</span>
              <div className="p-2 bg-purple-50 text-purple-500 rounded-lg">
                <Star size={20} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-stone-800">
              ₦{(customers.reduce((sum, customer) => sum + customer.totalSpent, 0)).toLocaleString()}
            </div>
            <div className="text-xs text-stone-500 mt-1 font-medium">From all customers</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-highlight focus:border-highlight"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <select 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value)}
                  className="appearance-none bg-white border border-stone-200 rounded-xl px-4 py-2 pr-8 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-highlight focus:border-highlight"
                >
                  <option value="all">All Statuses</option>
                  <option value="vip">VIP Customers</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Customer List */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="p-4 font-bold text-stone-600 text-sm uppercase tracking-wider">Customer</th>
                  <th className="p-4 font-bold text-stone-600 text-sm uppercase tracking-wider">Location</th>
                  <th className="p-4 font-bold text-stone-600 text-sm uppercase tracking-wider">Orders</th>
                  <th className="p-4 font-bold text-stone-600 text-sm uppercase tracking-wider">Total Spent</th>
                  <th className="p-4 font-bold text-stone-600 text-sm uppercase tracking-wider">Last Order</th>
                  <th className="p-4 font-bold text-stone-600 text-sm uppercase tracking-wider">Rating</th>
                  <th className="p-4 font-bold text-stone-600 text-sm uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="text-stone-400" size={32} />
                      </div>
                      <p className="text-stone-500 font-medium">No customers found.</p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-stone-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-bold">
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-stone-800">{customer.name}</p>
                            <p className="text-xs text-stone-500">{customer.email}</p>
                          </div>
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            customer.status === 'vip' ? 'bg-yellow-100 text-yellow-700' : 
                            customer.status === 'active' ? 'bg-green-100 text-green-700' : 
                            'bg-stone-100 text-stone-500'
                          }`}>
                            {customer.status}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-stone-500 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-stone-400" />
                          {customer.location}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-stone-800">{customer.totalOrders}</td>
                      <td className="p-4 font-bold text-stone-800">₦{customer.totalSpent.toLocaleString()}</td>
                      <td className="p-4 text-stone-500 text-sm">{new Date(customer.lastOrderDate).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Star size={14} className="text-yellow-500 fill-yellow-500" />
                          <span className="font-bold text-stone-800">{customer.rating}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
                          <Eye size={16} className="text-stone-500" />
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
    </div>
  );
};

export default VendorCustomerInsightsView;