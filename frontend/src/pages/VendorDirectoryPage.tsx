import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface Vendor {
  id: string;
  businessName: string;
  description: string | null;
  apprenticeshipTier: string;
  user: {
    id: string;
    name: string;
    verified: boolean;
  };
  _count: {
    products: number;
    orders: number;
  };
}

const TIER_LABELS: Record<string, string> = {
  APPRENTICE: 'Apprentice',
  RECOGNIZED_ARTISAN: 'Recognized Artisan',
  MASTER_PRACTITIONER: 'Master Practitioner',
  ELDER_APPROVED: 'Elder Approved',
};

// VENDOR_BACKLOG.md VND-023: this page previously showed four hardcoded mock
// vendors whose "View Profile" button navigated to a userId ('user-1', etc.)
// that never matched a real account -- discovered as a gap while building
// VND-016's new storefront page, which this now links to for real.
const VendorDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ['vendor-directory'],
    queryFn: async () => (await api.get('/marketplace/vendors', { params: { status: 'APPROVED' } })).data,
  });

  const filteredVendors = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return vendors;
    return vendors.filter(
      (vendor) =>
        vendor.businessName.toLowerCase().includes(q) ||
        (vendor.description ?? '').toLowerCase().includes(q)
    );
  }, [vendors, searchQuery]);

  const handleViewVendor = (vendor: Vendor) => {
    navigate(`/vendors/${vendor.user.id}`);
  };

  if (isLoading) {
    return (
      <div className="bg-muted/40 flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-highlight mx-auto mb-4"></div>
          <p className="text-stone-600">Loading sacred merchants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/40">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-highlight/10 rounded-full mb-4">
            <ShoppingCart className="text-highlight" size={20} />
            <span className="font-bold text-highlight uppercase tracking-wider">Sacred Merchants</span>
          </div>

          <h1 className="text-4xl font-bold text-stone-800 dark:text-stone-200 brand-font mb-4">
            Curators of Authentic Spiritual Goods
          </h1>
          <p className="text-xl text-stone-600 max-w-3xl">
            Discover trusted vendors offering genuine traditional artifacts, ceremonial items,
            and spiritual supplies from verified artisans and practitioners.
          </p>
        </div>

        {/* Search */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-stone-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendors by name or description..."
              className="w-full pl-12 pr-4 py-3 bg-muted/40 border border-border rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-stone-600">
            Showing <span className="font-bold text-stone-800 dark:text-stone-200">{filteredVendors.length}</span> of{' '}
            <span className="font-bold text-stone-800 dark:text-stone-200">{vendors.length}</span> merchants
          </p>
        </div>

        {/* Vendor Grid */}
        {filteredVendors.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-12 text-center">
            <ShoppingCart size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-xl font-bold text-stone-800 dark:text-stone-200 mb-2">No merchants found</h3>
            <p className="text-stone-600">Try adjusting your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Vendor Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-highlight/10 rounded-full flex items-center justify-center">
                        <span className="text-highlight font-bold text-lg">
                          {vendor.businessName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-stone-800 dark:text-stone-200">{vendor.businessName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-stone-500 uppercase">
                            {TIER_LABELS[vendor.apprenticeshipTier] ?? vendor.apprenticeshipTier}
                          </span>
                          {vendor.user.verified && (
                            <>
                              <span className="text-stone-400">•</span>
                              <div className="flex items-center gap-1">
                                <CheckCircle className="text-green-500 dark:text-green-400" size={16} />
                                <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase">Verified</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {vendor.description && (
                    <p className="text-stone-600 text-sm mb-4 line-clamp-2">{vendor.description}</p>
                  )}
                </div>

                {/* Vendor Footer */}
                <div className="px-6 py-4 bg-muted/40 border-t border-border/50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-stone-600">
                      {vendor._count.products} {vendor._count.products === 1 ? 'product' : 'products'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleViewVendor(vendor)}
                    className="w-full py-2.5 bg-highlight hover:bg-yellow-600 text-white font-bold rounded-xl transition-colors"
                  >
                    Visit Storefront
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('/marketplace')}
            className="px-8 py-3 bg-stone-800 hover:bg-black text-white font-bold rounded-xl transition-colors shadow-lg"
          >
            View All Products in Marketplace
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorDirectoryPage;
