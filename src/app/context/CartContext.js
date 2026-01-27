// /context-api/CartContext.js
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import showAnimatedToast from "../components/toast/showAnimatedToast";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

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
    const exists = cart.some(
      (c) => c.foodId === item.foodId && c.variantId === item.variantId
    );

    if (exists) {
      showAnimatedToast("error", "Item already exists in your cart", "cart-exists");
      return;
    }

    setCart((prev) => [...prev, item]);
    showAnimatedToast("success", "Item added to cart", "cart-add");
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
    showAnimatedToast("success", "Quantity increased", "cart-qty-inc");
  };

  // Decrease Quantity
  const decreaseQuantity = (foodId, variantId) => {
    const item = cart.find(i => i.foodId === foodId && i.variantId === variantId);

    if (!item) return;

    if (item.quantity > 1) {
      showAnimatedToast("success", "Quantity decreased", "cart-qty-dec");
    } else {
      showAnimatedToast("error", "Item removed from cart", "cart-remove");
    }

    setCart((prev) =>
      prev
        .map((item) =>
          item.foodId === foodId && item.variantId === variantId
            ? { ...item, quantity: Math.max(0, item.quantity - 1) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // Remove item
  const removeFromCart = (foodId, variantId) => {
    setCart((prev) =>
      prev.filter(
        (c) => !(c.foodId === foodId && c.variantId === variantId)
      )
    );
    showAnimatedToast("error", "Item removed from cart", "cart-remove");
  };

  // Update item (for editing options)
  const updateCartItem = (foodId, variantId, updatedItem) => {
    setCart((prev) => {
      // 1. Remove the old item
      const filtered = prev.filter(c => !(c.foodId === foodId && c.variantId === variantId));

      // 2. Check if the updated item already exists in the remaining items
      const existingIndex = filtered.findIndex(c =>
        c.foodId === updatedItem.foodId && c.variantId === updatedItem.variantId
      );

      if (existingIndex > -1) {
        // Merge quantities
        const newCart = [...filtered];
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newCart[existingIndex].quantity + updatedItem.quantity
        };
        return newCart;
      } else {
        // Add updated item
        return [...filtered, updatedItem];
      }
    });
    showAnimatedToast("success", "Cart updated", "cart-update");
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    showAnimatedToast("success", "Cart cleared", "cart-clear");
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        updateCartItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
