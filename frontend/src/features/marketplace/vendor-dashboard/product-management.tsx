import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Edit, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';

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

interface ProductManagementProps {
  vendorId: string;
  activeTab: string;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ vendorId, activeTab }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: productsData = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['vendor-products', vendorId],
    queryFn: async () => {
      try {
        const response = await api.get(`/vendors/${vendorId}/products`);
        return response.data;
      } catch (error) {
        throw error;
      }
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await api.delete(`/products/${productId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products', vendorId] });
    },
  });

  if (activeTab !== 'inventory' && activeTab !== 'products') return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Product Management</h2>
          <p className="text-muted-foreground">Manage your products and inventory</p>
        </div>
        <Button 
          onClick={() => navigate('/vendor/products')}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {productsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading products...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productsData?.map((product) => (
            <div key={product.id} className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-foreground text-lg">{product.name}</h3>
                  <p className="text-muted-foreground text-sm">{product.category}</p>
                </div>
                <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                  {product.status}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-foreground">
                  {product.currency} {product.price.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Stock: {product.stock ?? '∞'}
                </p>
              </div>
              
              <div className="mt-6 flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate('/vendor/products')}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => deleteProductMutation.mutate(product.id)}
                  disabled={deleteProductMutation.isPending}
                >
                  {deleteProductMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {productsData.length === 0 && !productsLoading && (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <Package className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No products yet</h3>
          <p className="text-muted-foreground mb-4">Get started by adding your first product</p>
          <Button 
            onClick={() => navigate('/vendor/products')}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;