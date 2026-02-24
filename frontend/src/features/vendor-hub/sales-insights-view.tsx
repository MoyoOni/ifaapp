import React, { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users, Calendar, Filter, PieChart as PieChartIcon } from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Pie, PieChart, Cell } from 'recharts';

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
}

interface ProductPerformance {
  name: string;
  sales: number;
  revenue: number;
}

interface CategoryPerformance {
  name: string;
  value: number;
}

const SalesInsightsView: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  
  // Mock sales data
  const salesData: SalesData[] = [
    { date: 'Jan', revenue: 400000, orders: 45, customers: 32 },
    { date: 'Feb', revenue: 300000, orders: 38, customers: 28 },
    { date: 'Mar', revenue: 200000, orders: 22, customers: 18 },
    { date: 'Apr', revenue: 278000, orders: 31, customers: 25 },
    { date: 'May', revenue: 189000, orders: 25, customers: 20 },
    { date: 'Jun', revenue: 239000, orders: 30, customers: 24 },
  ];
  
  // Mock product performance
  const productPerformance: ProductPerformance[] = [
    { name: 'Ifa Divination Chain', sales: 24, revenue: 600000 },
    { name: 'Palm Nut Set', sales: 18, revenue: 270000 },
    { name: 'Adire Fabric', sales: 32, revenue: 256000 },
    { name: 'Oracle Pendant', sales: 15, revenue: 180000 },
    { name: 'Ceremonial Bowl', sales: 8, revenue: 120000 },
  ];
  
  // Mock category distribution
  const categoryData: CategoryPerformance[] = [
    { name: 'Ritual Items', value: 45 },
    { name: 'Clothing', value: 25 },
    { name: 'Jewelry', value: 20 },
    { name: 'Books', value: 10 },
  ];
  
  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
  
  // Calculate metrics
  const totalRevenue = salesData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = salesData.reduce((sum, item) => sum + item.orders, 0);
  const totalCustomers = salesData.reduce((sum, item) => sum + item.customers, 0);
  const avgOrderValue = totalRevenue / totalOrders || 0;
  
  // Growth calculation (comparing last two months)
  const currentMonthRevenue = salesData[salesData.length - 1].revenue;
  const previousMonthRevenue = salesData[salesData.length - 2].revenue;
  const revenueGrowth = calculateGrowth(currentMonthRevenue, previousMonthRevenue);
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-stone-900">
            Sales Insights
          </h1>
          <p className="text-stone-600">
            Analyze your sales performance and customer trends
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <button className="p-2 border border-stone-300 rounded-xl hover:bg-stone-50">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm">Total Revenue</p>
              <h3 className="text-2xl font-bold text-stone-900">{formatCurrency(totalRevenue)}</h3>
              <div className={`flex items-center text-sm mt-1 ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {revenueGrowth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span className="ml-1">{Math.abs(revenueGrowth).toFixed(1)}% from previous</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-xl text-green-700">
              <DollarSign size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm">Total Orders</p>
              <h3 className="text-2xl font-bold text-stone-900">{totalOrders}</h3>
              <div className="text-stone-500 text-sm mt-1">+12% from previous</div>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl text-blue-700">
              <ShoppingCart size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm">Customers</p>
              <h3 className="text-2xl font-bold text-stone-900">{totalCustomers}</h3>
              <div className="text-stone-500 text-sm mt-1">+8% from previous</div>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl text-purple-700">
              <Users size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm">Avg. Order Value</p>
              <h3 className="text-2xl font-bold text-stone-900">{formatCurrency(avgOrderValue)}</h3>
              <div className="text-stone-500 text-sm mt-1">+5% from previous</div>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl text-amber-700">
              <Package size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-stone-900">Revenue Trend</h2>
            <BarChart3 size={20} className="text-stone-500" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `₦${value / 1000}k`} />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-stone-900">Category Distribution</h2>
            <PieChartIcon size={20} className="text-stone-500" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {categoryData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Product Performance Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900">Top Performing Products</h2>
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <Calendar size={16} />
              Last 30 days
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50">
              <tr>
                <th className="text-left py-3 px-4 font-bold text-stone-600">Product</th>
                <th className="text-left py-3 px-4 font-bold text-stone-600">Units Sold</th>
                <th className="text-left py-3 px-4 font-bold text-stone-600">Revenue</th>
                <th className="text-left py-3 px-4 font-bold text-stone-600">Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              {productPerformance.map((product, index) => (
                <tr key={index} className="border-b border-stone-100 hover:bg-stone-50">
                  <td className="py-3 px-4 font-medium">{product.name}</td>
                  <td className="py-3 px-4">{product.sales}</td>
                  <td className="py-3 px-4 font-bold text-stone-900">{formatCurrency(product.revenue)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-16 bg-stone-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(product.sales / 35) * 100}%` }} // Assuming max is 35
                        ></div>
                      </div>
                      <span>{((product.sales / 35) * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100">
        <h2 className="text-lg font-bold text-stone-900 mb-3 flex items-center gap-2">
          <TrendingUp className="text-green-600" size={20} /> Recommendations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl">
            <h3 className="font-bold text-stone-800 mb-1">Boost Popular Items</h3>
            <p className="text-sm text-stone-600">Promote Ifa Divination Chains which have highest sales</p>
          </div>
          <div className="bg-white p-4 rounded-xl">
            <h3 className="font-bold text-stone-800 mb-1">Increase Pricing</h3>
            <p className="text-sm text-stone-600">Consider raising prices for Palm Nut Sets due to demand</p>
          </div>
          <div className="bg-white p-4 rounded-xl">
            <h3 className="font-bold text-stone-800 mb-1">Expand Inventory</h3>
            <p className="text-sm text-stone-600">Replenish stocks for high-demand items</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesInsightsView;