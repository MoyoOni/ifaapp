import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Package, Search, Filter } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/shared/hooks/use-auth';
import { Product } from '@common';
import VendorProductForm from './vendor-product-form';
import { getCategoryBySlug } from './marketplace-categories';
import { useToast } from '@/shared/components/toast';
import { isDevModeActive } from '@/shared/utils/dev-mode';

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
    const queryClient = useQueryClient();
    const toast = useToast();
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

    const handleBack = () => (onBack ? onBack() : navigate('/vendor/dashboard'));
    const handleCreateProduct = () => {
        if (onCreateProduct) { onCreateProduct(); return; }
        setShowAddForm(true);
    };
    const handleEditProduct = (product: Product) => {
        if (onEditProduct) { onEditProduct(product.id); return; }
        setEditingProduct(product);
    };

    const deleteMutation = useMutation({
        mutationFn: async (productId: string) => {
            await api.delete(`/marketplace/products/${productId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
            queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
            toast.success('Product deleted');
            setDeletingProductId(null);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to delete product');
            setDeletingProductId(null);
        },
    });

    const { data: products = [], isLoading } = useQuery<Product[]>({
        queryKey: ['vendor-products', user?.id],
        queryFn: async () => {
            try {
                const response = await api.get('/marketplace/products', {
                    params: { vendorId: user?.id }
                });
                return response.data;
            } catch (error) {
                throw error;
            }
        },
        enabled: !!user?.id && !isDevModeActive(),
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
        {showAddForm && (
            <VendorProductForm
                onClose={() => setShowAddForm(false)}
                onSuccess={() => setShowAddForm(false)}
            />
        )}
        {editingProduct && (
            <VendorProductForm
                initialData={editingProduct as any}
                onClose={() => setEditingProduct(null)}
                onSuccess={() => setEditingProduct(null)}
            />
        )}
        {deletingProductId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm p-6 space-y-4">
                    <h3 className="text-lg font-bold text-foreground">Delete Product?</h3>
                    <p className="text-muted-foreground text-sm">This action cannot be undone. The listing will be permanently removed.</p>
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setDeletingProductId(null)}
                            className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-bold hover:bg-muted transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => deleteMutation.mutate(deletingProductId)}
                            disabled={deleteMutation.isPending}
                            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        )}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button onClick={handleBack} className="text-sm font-bold text-muted-foreground hover:text-foreground mb-1">← Dashboard</button>
                    <h1 className="text-3xl font-bold brand-font text-foreground">My Inventory</h1>
                    <p className="text-muted-foreground">Manage your product listings</p>
                </div>
                <button
                    onClick={handleCreateProduct}
                    className="px-6 py-3 bg-highlight text-white rounded-xl font-bold hover:bg-yellow-500 shadow-lg flex items-center gap-2 transition-all"
                >
                    <Plus size={20} /> Add New Product
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-card p-4 rounded-xl border border-border flex gap-4 md:items-center flex-col md:flex-row shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border text-foreground rounded-lg focus:outline-none focus:border-highlight"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted font-bold text-sm">
                    <Filter size={16} /> Filter
                </button>
            </div>

            {/* Product List */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="p-4 font-bold text-muted-foreground text-sm uppercase tracking-wider">Product</th>
                                <th className="p-4 font-bold text-muted-foreground text-sm uppercase tracking-wider">Category</th>
                                <th className="p-4 font-bold text-muted-foreground text-sm uppercase tracking-wider">Price</th>
                                <th className="p-4 font-bold text-muted-foreground text-sm uppercase tracking-wider">Stock</th>
                                <th className="p-4 font-bold text-muted-foreground text-sm uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">Loading inventory...</td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Package className="text-muted-foreground" size={32} />
                                        </div>
                                        <p className="text-muted-foreground font-medium">No products listed yet.</p>
                                        <button onClick={handleCreateProduct} className="text-highlight font-bold mt-2 hover:underline">Create your first listing</button>
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden border border-border">
                                                    {(product as any).image ? (
                                                        <img src={(product as any).image} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package size={20} /></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground">{product.name}</p>
                                                    <p className="text-xs text-muted-foreground">ID: {product.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-muted-foreground text-sm">
                                            {(() => {
                                                const cat = getCategoryBySlug(product.category);
                                                return cat ? `${cat.icon} ${cat.label}` : product.category;
                                            })()}
                                        </td>
                                        <td className="p-4 font-bold text-foreground">
                                            {/* Assuming NGN for simplicity or product currency */}
                                            ₦{product.price.toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.stock && product.stock > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                                {product.stock || 0} in stock
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEditProduct(product)}
                                                    className="p-2 hover:bg-highlight/10 hover:text-highlight rounded-lg transition-colors"
                                                    title="Edit Product"
                                                    aria-label="Edit product"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingProductId(product.id)}
                                                    className="p-2 hover:bg-red-50 dark:bg-red-950/30 hover:text-red-500 dark:text-red-400 rounded-lg transition-colors"
                                                    title="Delete Product"
                                                    aria-label="Delete product"
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

