import React, { createContext, useContext, useReducer, useEffect } from 'react';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  thumbnail?: string;
  attributes?: Record<string, string>;
}

interface CartState {
  items: CartItem[];
  itemCount: number;
  total: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_ITEMS'; payload: CartItem[] };

const CART_STORAGE_KEY = 'ilaase-cart-data';
const CART_EXPIRY_DAYS = 7;

const calculateCartTotals = (items: CartItem[]): { itemCount: number; total: number } => {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  return { itemCount, total };
};

const isCartExpired = (storedData: any): boolean => {
  if (!storedData.timestamp) return true;
  
  const storedTime = new Date(storedData.timestamp).getTime();
  const now = new Date().getTime();
  const expiryTime = CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // Convert days to milliseconds
  
  return (now - storedTime) > expiryTime;
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'SET_ITEMS':
      return {
        items: action.payload,
        ...calculateCartTotals(action.payload)
      };
      
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(item => item.id === action.payload.id);
      
      let newItems: CartItem[];
      if (existingItemIndex >= 0) {
        // Update quantity if item already exists
        newItems = [...state.items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + action.payload.quantity
        };
      } else {
        // Add new item
        newItems = [...state.items, action.payload];
      }
      
      return {
        items: newItems,
        ...calculateCartTotals(newItems)
      };
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload.id);
      return {
        items: newItems,
        ...calculateCartTotals(newItems)
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item => {
        if (item.id === action.payload.id) {
          // If quantity becomes 0 or less, remove the item
          if (action.payload.quantity <= 0) {
            return null;
          }
          return { ...item, quantity: action.payload.quantity };
        }
        return item;
      }).filter(Boolean) as CartItem[];
      
      return {
        items: newItems,
        ...calculateCartTotals(newItems)
      };
    }
    
    case 'CLEAR_CART':
      return {
        items: [],
        itemCount: 0,
        total: 0
      };
      
    default:
      return state;
  }
};

interface CartContextType extends CartState {
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    itemCount: 0,
    total: 0
  });

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(CART_STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        if (!isCartExpired(parsedData)) {
          dispatch({ type: 'SET_ITEMS', payload: parsedData.items || [] });
        } else {
          // Clear expired cart data
          localStorage.removeItem(CART_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to initialize cart from localStorage:', error);
      // Clear any corrupted data
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      const dataToStore = {
        items: state.items,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [state.items]);

  const addItem = (item: CartItem) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider value={{
      ...state,
      addItem,
      removeItem,
      updateQuantity,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};