import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product, CartItem, Shop } from '../data/dummyData';

interface CartContextType {
  cartItems: CartItem[];
  selectedShop: Shop | null;
  setSelectedShop: (shop: Shop | null) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems((prevItems) => {
      // Check if same product with same weight exists
      const weightInKg = product.weightInKg || 1.0;
      const existingItem = prevItems.find(
        (item) => 
          item.product.id === product.id && 
          (item.product.weightInKg || 1.0) === weightInKg
      );
      
      if (existingItem) {
        // If item with same weight exists, increase quantity
        return prevItems.map((item) =>
          item.product.id === product.id && (item.product.weightInKg || 1.0) === weightInKg
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // If item doesn't exist or has different weight, add new item
        return [...prevItems, { product, quantity }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setSelectedShop(null);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      // Calculate price based on weight
      const weightInKg = item.product.weightInKg || 1.0;
      const pricePerKg = item.product.pricePerKg || item.product.price;
      const basePrice = pricePerKg * weightInKg;
      const itemPrice = basePrice * item.quantity;
      return total + itemPrice;
    }, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        selectedShop,
        setSelectedShop,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

