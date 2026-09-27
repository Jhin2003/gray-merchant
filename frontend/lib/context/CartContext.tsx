"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Listing } from "@/lib/types";

type CartItem = {
  listing: Listing;
  quantity: number;
};

interface CartContextType {
  cart: CartItem[];
  addToCart: (listing: Listing) => void;
  removeFromCart: (listingId: number) => void;
  updateQuantity: (listingId: number, newQuantity: number) => void;
  clearCart: () => void; // <-- Add this
  totalItems: number;

  subtotal: number; // <-- 1. Add this here
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from LocalStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    setIsLoaded(true);
  }, []);

  // Save cart to LocalStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

const addToCart = (listing: Listing) => {
  setCart((prevCart) => {
    const existingItem = prevCart.find(
      (item) => item.listing.id === listing.id,
    );

    // 1. Get the max available stock from the listing
    // (Replace .quantity with .stock if that's what your Listing type uses)
    const availableStock = listing.stock; 

    if (existingItem) {
      // 2. Prevent adding more if cart quantity already meets or exceeds stock
      if (existingItem.quantity >= availableStock) {
        console.warn("Cannot add more: Stock limit reached");
        return prevCart;
      }

      return prevCart.map((item) =>
        item.listing.id === listing.id
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      );
    }

    // 3. Prevent adding if item is completely out of stock
    if (availableStock <= 0) {
      return prevCart;
    }

    return [...prevCart, { listing, quantity: 1 }];
  });
};

  const removeFromCart = (listingId: number) => {
    setCart((prev) => prev.filter((item) => item.listing.id !== listingId));
  };

  const updateQuantity = (listingId: number, newQuantity: number) => {
    setCart((prevCart) => {
      // If quantity goes to 0, remove the item
      if (newQuantity <= 0) {
        return prevCart.filter((item) => item.listing.id !== listingId);
      }
      // Otherwise, update the quantity
      return prevCart.map((item) =>
        item.listing.id === listingId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => {
    // Note: Wrapping in Number() just in case your API returns price as a string
    return total + (Number(item.listing.price) * item.quantity);
  }, 0);


// Add this below your other functions
  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );

  
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
