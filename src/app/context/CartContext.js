// /context-api/CartContext.js
"use client";

import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("grubdashCart");
    if (stored) setCart(JSON.parse(stored));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("grubdashCart", JSON.stringify(cart));
  }, [cart]);

  // Add to cart
  const addToCart = (item) => {
    setCart((prev) => {
      const index = prev.findIndex(
        (c) => c.foodId === item.foodId && c.variantId === item.variantId
      );

      if (index !== -1) {
        const updated = [...prev];
        updated[index].quantity += item.quantity;
        return updated;
      }

      return [...prev, item];
    });
  };

  // Increase Quantity
  const increaseQuantity = (foodId, variantId) => {
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

  const removeFromCart = (foodId, variantId) => {
    setCart((prev) =>
      prev.filter(
        (c) => !(c.foodId === foodId && c.variantId === variantId)
      )
    );
  };

  const clearCart = () => setCart([]);

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
