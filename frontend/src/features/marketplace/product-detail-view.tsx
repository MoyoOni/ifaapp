import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Package, Store, Star, Plus, Minus, Check, MessageSquare } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';
import { useCart } from '@/shared/contexts/cart-context';
import { DEMO_PRODUCTS, DEMO_USERS } from '@/demo';

interface Product {
  id: string;
  vendorId: string;
  name: string;
  category: string;
  type: string;
  description: string;
  longDescription?: string;
  price: number;
  currency: string;
  stock?: number;
  images: string[];
  provenance?: string;
  usageProtocol?: string;
  verifiedTier: string;
  status: string;
  vendor: {
    id: string;
    businessName: string;
    user: {
      id: string;
      name: string;
      yorubaName?: string;
      verified: boolean;
    };
  };
  reviews: Array<{
    id: string;
    rating: number;
    title?: string;
    content?: string;
    createdAt: string;
    customer: {
      id: string;
      name: string;
      yorubaName?: string;
      verified: boolean;
    };
  }>;
  _count: {
    orders: number;
    reviews: number;
  };
}

interface ProductDetailViewProps {
  productId: string;
  onBack?: () => void;
}

/**
 * Product Detail View Component
 * Product details, reviews, and add to cart
 */
const ProductDetailView: React.FC<ProductDetailViewProps> = ({ productId, onBack }) => {
  const navigate = useNavigate();
  useAuth();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  // Fetch product
  const { data: product, isLoading: productLoading } = useQuery<Product>({
    queryKey: ['marketplace-product', productId],
    queryFn: async () => {
      try {
        const response = await api.get(`/marketplace/products/${productId}`);
        return response.data;
      } catch (error) {
        logger.warn('API fetch failed, falling back to demo data');
        const demoProduct = Object.values(DEMO_PRODUCTS).find((product) => product.id === productId);

        if (demoProduct) {
          const vendor = DEMO_USERS[demoProduct.vendorId as keyof typeof DEMO_USERS];

          return {
            id: demoProduct.id,
            vendorId: demoProduct.vendorId,
            name: demoProduct.name,
            category: demoProduct.category || 'General',
            type: 'PHYSICAL',
            description: demoProduct.description || 'Authentic spiritual item.',
            longDescription: demoProduct.description
              ? `${demoProduct.description}\n\nSourced directly from the artisans of Yorubaland.`
              : undefined,
            price: demoProduct.price,
            currency: demoProduct.currency,
            stock: demoProduct.stock ?? 10,
            images: demoProduct.images?.length ? demoProduct.images : [],
            provenance: 'Osun State, Nigeria',
            verifiedTier: 'COUNCIL_APPROVED',
            status: demoProduct.status,
            vendor: {
              id: demoProduct.vendorId,
              businessName: vendor?.name || 'Sacred Vendor',
              user: {
                id: vendor?.id || demoProduct.vendorId,
                name: vendor?.name || 'Sacred Vendor',
                yorubaName: vendor?.yorubaName,
                verified: (vendor as any)?.verified ?? true,
              },
            },
            reviews: [
              {
                id: 'r1',
                rating: 5,
                title: 'Excellent quality',
                content: 'The energy from this item is palpable. Ase!',
                createdAt: new Date().toISOString(),
                customer: {
                  id: 'c1',
                  name: 'Adewale',
                  yorubaName: 'Ifadayo',
                  verified: true,
                },
              },
            ],
            _count: {
              orders: 12,
              reviews: 1,
            },
          } as Product;
        }
        throw new Error('Product not found in demo data');
      }
    },
    enabled: !!productId,
  });

  const handleAddToCart = () => {
    if (product) {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        currency: product.currency,
        quantity,
        image: product.images?.[0],
        vendorId: product.vendorId,
        vendorName: product.vendor.businessName,
        stock: product.stock,
      });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  if (productLoading) {
    return (
      <div className="min-h-screen bg-background text-white p-6 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-highlight border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background text-white p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-muted">Product not found.</p>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 text-highlight hover:text-secondary transition-colors"
            >
              Back to Marketplace
            </button>
          )}
        </div>
      </div>
    );
  }

  const maxQuantity = (product.stock !== undefined && product.stock !== null) ? Math.min(product.stock, 10) : 10;
  const averageRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 0;

  return (
    <div className="min-h-screen bg-background text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Marketplace
          </button>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative h-96 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted">
                  <Package size={64} />
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden ${selectedImageIndex === index
                      ? 'border-highlight'
                      : 'border-white/10 hover:border-white/20'
                      }`}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title and Vendor */}
            <div>
              <h1 className="text-3xl font-bold brand-font text-white mb-2">{product.name}</h1>
              <div className="flex items-center gap-2 text-muted mb-4">
                <Store size={16} />
                <span>{product.vendor.businessName}</span>
                {product.vendor.user.verified && (
                  <span className="text-xs bg-highlight/20 text-highlight px-2 py-1 rounded">
                    ✓ Verified Vendor
                  </span>
                )}
              </div>
              {product.verifiedTier === 'COUNCIL_APPROVED' && (
                <div className="inline-block bg-highlight/20 text-highlight px-3 py-1 rounded text-sm font-bold mb-4">
                  ✓ Council Approved
                </div>
              )}
            </div>

            {/* Price */}
            <div className="text-4xl font-bold text-highlight">
              {product.currency === 'NGN' ? '₦' : '$'}
              {product.price.toLocaleString()}
            </div>

            {/* Rating */}
            {product.reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={i < Math.round(averageRating) ? 'fill-highlight text-highlight' : 'text-muted'}
                    />
                  ))}
                </div>
                <span className="text-muted">
                  {averageRating.toFixed(1)} ({product.reviews.length} review{product.reviews.length !== 1 ? 's' : ''})
                </span>
              </div>
            )}

            {/* Stock Status */}
            {(product.stock !== undefined && product.stock !== null) && (
              <div className="text-sm">
                {product.stock > 0 ? (
                  <span className="text-primary">✓ {product.stock} in stock</span>
                ) : (
                  <span className="text-red-400">Out of stock</span>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            {product.type === 'PHYSICAL' && (product.stock !== undefined && product.stock !== null) && product.stock > 0 && (
              <div className="flex items-center gap-4">
                <label className="text-sm font-bold text-muted uppercase tracking-widest">
                  Quantity
                </label>
                <div className="flex items-center gap-2 border border-white/10 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="px-4 py-2 min-w-[60px] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity}
                    className="p-2 hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart & Message Vendor Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={
                  (product.stock !== undefined && product.stock !== null && product.stock === 0) ||
                  product.type !== 'PHYSICAL' ||
                  addedToCart
                }
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-highlight text-foreground rounded-xl font-bold hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addedToCart ? (
                  <>
                    <Check size={20} />
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCart size={20} />
                    Add to Cart
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  if (product?.vendor?.user?.id) {
                    navigate(`/messages/${product.vendor.user.id}`);
                  }
                }}
                className="px-6 py-4 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-colors flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Message Vendor
              </button>
            </div>

            {/* Product Details */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-bold">Description</h3>
              <p className="text-muted whitespace-pre-wrap">
                {product.longDescription || product.description}
              </p>

              {product.provenance && (
                <div>
                  <h4 className="text-sm font-bold text-muted uppercase tracking-widest mb-2">
                    Provenance
                  </h4>
                  <p className="text-muted">{product.provenance}</p>
                </div>
              )}

              {product.usageProtocol && (
                <div>
                  <h4 className="text-sm font-bold text-muted uppercase tracking-widest mb-2">
                    Usage Protocol
                  </h4>
                  <p className="text-muted whitespace-pre-wrap">{product.usageProtocol}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold text-muted uppercase tracking-widest mb-2">
                  Product Type
                </h4>
                <p className="text-muted capitalize">{product.type.toLowerCase()}</p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-muted uppercase tracking-widest mb-2">
                  Category
                </h4>
                <p className="text-muted capitalize">{product.category}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {product.reviews.length > 0 && (
          <div className="mt-12 pt-8 border-t border-white/10">
            <h2 className="text-2xl font-bold mb-6">Reviews ({product.reviews.length})</h2>
            <div className="space-y-6">
              {product.reviews.map((review) => (
                <div key={review.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-highlight/20 flex items-center justify-center text-highlight font-bold flex-shrink-0">
                      {(review.customer.yorubaName || review.customer.name)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold">{review.customer.yorubaName || review.customer.name}</span>
                        {review.customer.verified && (
                          <span className="text-xs bg-highlight/20 text-highlight px-2 py-1 rounded">
                            Verified
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={i < review.rating ? 'fill-highlight text-highlight' : 'text-muted'}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-xs text-muted">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                      {review.title && <h4 className="font-bold">{review.title}</h4>}
                      {review.content && <p className="text-muted whitespace-pre-wrap">{review.content}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailView;
