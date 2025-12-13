// /context-api/CartContext.js
"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Toast queue to avoid duplicates
  const toastQueue = useRef(null);

  // Run toast AFTER cart updates
  useEffect(() => {
    if (toastQueue.current) {
      toastQueue.current(); // fire the toast
      toastQueue.current = null; // reset
    }
  }, [cart]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("grubdashCart");
    if (stored) setCart(JSON.parse(stored));
  }, []);

  // Store cart to localStorage
  useEffect(() => {
    localStorage.setItem("grubdashCart", JSON.stringify(cart));
  }, [cart]);

  // Add item
  const addToCart = (item) => {
    setCart((prev) => {
      const exists = prev.some(
        (c) => c.foodId === item.foodId && c.variantId === item.variantId
      );

      if (exists) {
        toastQueue.current = () =>
          toast.error("Item already exists in your cart");
        return prev;
      }

      toastQueue.current = () => toast.success("Item added to cart");
      return [...prev, item];
    });
  };

  // Increase Quantity
  const increaseQuantity = (foodId, variantId) => {
    toastQueue.current = () => toast.success("Quantity increased");

    setCart((prev) =>
      prev.map((item) =>
        item.foodId === foodId && item.variantId === variantId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  // Decrease Quantity
  const decreaseQuantity = (foodId, variantId) => {
    toastQueue.current = () => toast.success("Quantity decreased");

    setCart((prev) =>
      prev
        .map((item) =>
          item.foodId === foodId && item.variantId === variantId
            ? { ...item, quantity: Math.max(1, item.quantity - 1) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // Remove item
  const removeFromCart = (foodId, variantId) => {
    toastQueue.current = () => toast.error("Item removed from cart");

    setCart((prev) =>
      prev.filter(
        (c) => !(c.foodId === foodId && c.variantId === variantId)
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    toastQueue.current = () => toast.success("Cart cleared");
    setCart([]);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
