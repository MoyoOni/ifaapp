import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, ShoppingCart, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import _api from '@/lib/api';

interface Vendor {
  id: string;
  userId: string;
  shopName: string;
  description: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  location: string;
  specialties: string[];
  productCount: number;
  avatar?: string;
}

const VendorDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  // Mock vendor data since we don't have the actual API endpoint
  const mockVendors: Vendor[] = [
    {
      id: '1',
      userId: 'user-1',
      shopName: 'Sacred Artifacts House',
      description: 'Authentic traditional items crafted with ancestral blessings',
      rating: 4.8,
      reviewCount: 127,
      verified: true,
      location: 'Lagos, Nigeria',
      specialties: ['Artifacts', 'Clothing', 'Herbs'],
      productCount: 42,
      avatar: undefined
    },
    {
      id: '2',
      userId: 'user-2',
      shopName: 'Yoruba Wisdom Crafts',
      description: 'Handmade ceremonial items and spiritual tools',
      rating: 4.9,
      reviewCount: 89,
      verified: true,
      location: 'Ibadan, Nigeria',
      specialties: ['Tools', 'Artifacts', 'Books'],
      productCount: 28,
      avatar: undefined
    },
    {
      id: '3',
      userId: 'user-3',
      shopName: 'Ancestral Blessings Store',
      description: 'Traditional clothing and ritual garments',
      rating: 4.6,
      reviewCount: 64,
      verified: false,
      location: 'Abuja, Nigeria',
      specialties: ['Clothing', 'Accessories'],
      productCount: 15,
      avatar: undefined
    },
    {
      id: '4',
      userId: 'user-4',
      shopName: 'Divine Herbs & Remedies',
      description: 'Medicinal herbs and traditional healing supplies',
      rating: 4.7,
      reviewCount: 203,
      verified: true,
      location: 'Port Harcourt, Nigeria',
      specialties: ['Herbs', 'Remedies', 'Supplements'],
      productCount: 56,
      avatar: undefined
    }
  ];

  // Simulate API call with mock data
  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ['vendors'],
    queryFn: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      return mockVendors;
    }
  });

  // Filter vendors based on search and filters
  const filteredVendors = useMemo(() => {
    return vendors.filter(vendor => {
      const matchesSearch = vendor.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           vendor.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           vendor.specialties.some(specialty => 
                             specialty.toLowerCase().includes(searchQuery.toLowerCase())
                           );
      
      const matchesSpecialty = selectedSpecialty === 'all' || 
                              vendor.specialties.includes(selectedSpecialty);
      
      const matchesVerified = !showVerifiedOnly || vendor.verified;
      
      return matchesSearch && matchesSpecialty && matchesVerified;
    });
  }, [vendors, searchQuery, selectedSpecialty, showVerifiedOnly]);

  // Get all unique specialties for filter dropdown
  const allSpecialties = useMemo(() => {
    const specialties = new Set<string>();
    vendors.forEach(vendor => {
      vendor.specialties.forEach(specialty => specialties.add(specialty));
    });
    return ['all', ...Array.from(specialties).sort()];
  }, [vendors]);

  const handleViewVendor = (vendor: Vendor) => {
    navigate(`/profile/${vendor.userId}`);
  };

  const handleViewProducts = (vendor: Vendor) => {
    navigate(`/marketplace?vendor=${vendor.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-highlight mx-auto mb-4"></div>
          <p className="text-stone-600">Loading sacred merchants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-highlight/10 rounded-full mb-4">
            <ShoppingCart className="text-highlight" size={20} />
            <span className="font-bold text-highlight uppercase tracking-wider">Sacred Merchants</span>
          </div>
          
          <h1 className="text-4xl font-bold text-stone-800 brand-font mb-4">
            Curators of Authentic Spiritual Goods
          </h1>
          <p className="text-xl text-stone-600 max-w-3xl">
            Discover trusted vendors offering genuine traditional artifacts, ceremonial items, 
            and spiritual supplies from verified artisans and practitioners.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-stone-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendors, specialties, or locations..."
                className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
              />
            </div>

            {/* Specialty Filter */}
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
            >
              {allSpecialties.map(specialty => (
                <option key={specialty} value={specialty}>
                  {specialty === 'all' ? 'All Specialties' : specialty}
                </option>
              ))}
            </select>

            {/* Verified Filter */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="verified-filter"
                checked={showVerifiedOnly}
                onChange={(e) => setShowVerifiedOnly(e.target.checked)}
                className="w-5 h-5 text-highlight rounded focus:ring-highlight border-stone-300"
              />
              <label htmlFor="verified-filter" className="text-stone-700 font-medium">
                Verified Only
              </label>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-stone-600">
            Showing <span className="font-bold text-stone-800">{filteredVendors.length}</span> of{' '}
            <span className="font-bold text-stone-800">{vendors.length}</span> merchants
          </p>
        </div>

        {/* Vendor Grid */}
        {filteredVendors.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-12 text-center">
            <ShoppingCart size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-xl font-bold text-stone-800 mb-2">No merchants found</h3>
            <p className="text-stone-600">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Vendor Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-highlight/10 rounded-full flex items-center justify-center">
                        <span className="text-highlight font-bold text-lg">
                          {vendor.shopName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-stone-800">{vendor.shopName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="text-yellow-500 fill-current" size={16} />
                            <span className="text-sm font-bold text-stone-700">{vendor.rating}</span>
                          </div>
                          <span className="text-stone-400">•</span>
                          <span className="text-sm text-stone-500">{vendor.reviewCount} reviews</span>
                          {vendor.verified && (
                            <>
                              <span className="text-stone-400">•</span>
                              <div className="flex items-center gap-1">
                                <CheckCircle className="text-green-500" size={16} />
                                <span className="text-xs font-bold text-green-600 uppercase">Verified</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-stone-600 text-sm mb-4 line-clamp-2">{vendor.description}</p>

                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="text-stone-400" size={16} />
                    <span className="text-sm text-stone-600">{vendor.location}</span>
                  </div>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {vendor.specialties.slice(0, 3).map((specialty) => (
                      <span
                        key={specialty}
                        className="px-2 py-1 bg-stone-100 text-stone-700 text-xs font-bold rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                    {vendor.specialties.length > 3 && (
                      <span className="px-2 py-1 bg-stone-100 text-stone-500 text-xs font-bold rounded-full">
                        +{vendor.specialties.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Vendor Footer */}
                <div className="px-6 py-4 bg-stone-50 border-t border-stone-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-stone-600">
                      {vendor.productCount} {vendor.productCount === 1 ? 'product' : 'products'}
                    </span>
                    <button
                      onClick={() => handleViewVendor(vendor)}
                      className="text-sm font-bold text-highlight hover:text-yellow-700 transition-colors"
                    >
                      View Profile
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handleViewProducts(vendor)}
                    className="w-full py-2.5 bg-highlight hover:bg-yellow-600 text-white font-bold rounded-xl transition-colors"
                  >
                    Browse Products
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