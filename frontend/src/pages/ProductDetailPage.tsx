import React from 'react';
import { useParams } from 'react-router-dom';
import ProductDetailView from '@/features/marketplace/product-detail-view';

const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();

  if (!productId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 my-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
          Missing product ID.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ProductDetailView productId={productId} />
    </div>
  );
};

export default ProductDetailPage;