import React from 'react';
import { useNavigate } from 'react-router-dom';
import CartView from '@/features/marketplace/cart-view';

const CartPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <CartView
        onBack={() => navigate('/marketplace')}
        onCheckout={() => navigate('/checkout')}
      />
    </div>
  );
};

export default CartPage;