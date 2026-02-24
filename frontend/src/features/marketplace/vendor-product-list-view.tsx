import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Package, Search, Filter } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { DEMO_PRODUCTS } from '@/demo';
import { Product } from '@common';

interface VendorProductListViewProps {
    onCreateProduct?: () => void;
    onEditProduct?: (productId: string) => void;
    onBack?: () => void;
    mode?: 'list' | 'create' | 'edit';
}

const VendorProductListView: React.FC<VendorProductListViewProps> = ({
    onCreateProduct,
    onEditProduct,
    onBack,
    mode: _mode = 'list',
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleBack = () => (onBack ? onBack() : navigate('/vendor/dashboard'));
    const handleCreateProduct = () =>
        (onCreateProduct ? onCreateProduct() : navigate('/vendor/inventory'));
    const handleEditProduct = (productId: string) =>
        (onEditProduct ? onEditProduct(productId) : navigate('/vendor/inventory'));

    const { data: products = [], isLoading } = useQuery<Product[]>({
        queryKey: ['vendor-products', user?.id],
        queryFn: async () => {
            try {
                const response = await api.get('/marketplace/products', {
                    params: { vendorId: user?.id }
                });
                return response.data;
            } catch (error) {
                if (!isDemoMode) throw error;

                logger.warn('Failed to fetch vendor products, using demo data');
                return Object.values(DEMO_PRODUCTS)
                    .filter((product) => product.vendorId === user?.id || !user?.id)
                    .map((product) => ({
                        id: product.id,
                        name: product.name,
                        category: product.category,
                        price: product.price,
                        currency: product.currency,
                        stock: product.stock,
                        status: product.status,
                        vendorId: product.vendorId,
                        images: product.images,
                    })) as unknown as Product[];
            }
        },
        enabled: !!user?.id
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button onClick={handleBack} className="text-sm font-bold text-stone-500 hover:text-stone-800 mb-1">← Dashboard</button>
                    <h1 className="text-3xl font-bold brand-font text-stone-900">My Inventory</h1>
                    <p className="text-stone-500">Manage your product listings</p>
                </div>
                <button
                    onClick={handleCreateProduct}
                    className="px-6 py-3 bg-highlight text-white rounded-xl font-bold hover:bg-yellow-500 shadow-lg flex items-center gap-2 transition-all"
                >
                    <Plus size={20} /> Add New Product
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 flex gap-4 md:items-center flex-col md:flex-row shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-highlight"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 font-bold text-sm">
                    <Filter size={16} /> Filter
                </button>
            </div>

            {/* Product List */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-stone-50 border-b border-stone-200">
                            <tr>
                                <th className="p-4 font-bold text-stone-600 text-sm uppercase tracking-wider">Product</th>
                                <th className="p-4 font-bold text-stone-600 text-sm uppercase tracking-wider">Category</th>
                                <th className="p-4 font-bold text-stone-600 text-sm uppercase tracking-wider">Price</th>
                                <th className="p-4 font-bold text-stone-600 text-sm uppercase tracking-wider">Stock</th>
                                <th className="p-4 font-bold text-stone-600 text-sm uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-stone-400">Loading inventory...</td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Package className="text-stone-400" size={32} />
                                        </div>
                                        <p className="text-stone-500 font-medium">No products listed yet.</p>
                                        <button onClick={handleCreateProduct} className="text-highlight font-bold mt-2 hover:underline">Create your first listing</button>
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id} className="hover:bg-stone-50 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-stone-100 rounded-lg overflow-hidden border border-stone-200">
                                                    {(product as any).image ? (
                                                        <img src={(product as any).image} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-stone-300"><Package size={20} /></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-stone-800">{product.name}</p>
                                                    <p className="text-xs text-stone-400">ID: {product.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-stone-500 text-sm">{product.category}</td>
                                        <td className="p-4 font-bold text-stone-800">
                                            {/* Assuming NGN for simplicity or product currency */}
                                            ₦{product.price.toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.stock && product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {product.stock || 0} in stock
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditProduct(product.id)}
                                                    className="p-2 hover:bg-highlight/10 hover:text-highlight rounded-lg transition-colors"
                                                    title="Edit Product"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                                                    title="Delete Product"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
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

export default VendorProductListView;
