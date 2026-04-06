// /context-api/CartContext.js
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import showAnimatedToast from "../components/toast/showAnimatedToast";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("melachowCart");
    if (stored) setCart(JSON.parse(stored));
  }, []);

  // Store cart to localStorage
  useEffect(() => {
    localStorage.setItem("melachowCart", JSON.stringify(cart));
  }, [cart]);

  // Add item
  const addToCart = (item) => {
    const exists = cart.some(
      (c) => c.foodId === item.foodId && c.portionId === item.portionId
    );

    if (exists) {
      showAnimatedToast("error", "Item already exists in your cart", "cart-exists");
      return;
    }

    setCart((prev) => [...prev, item]);
    showAnimatedToast("success", "Item added to cart", "cart-add");
  };

  // Add Combo
  const addComboToCart = (comboItem) => {
    const newItem = {
        ...comboItem,
        type:     "combo",
        quantity: comboItem.quantity || 1,
    };
    setCart(prev => [...prev, newItem]);
    showAnimatedToast("success", `${comboItem.name} added to cart`, "cart-add-combo");
  };

  // Increase Quantity
  const increaseQuantity = (foodId, portionId, comboId) => {
    setCart((prev) =>
      prev.map((item) => {
        const isMatch = item.type === "combo"
          ? (item.comboId === comboId || item.variantId === comboId)
          : item.foodId === foodId && item.portionId === portionId;

        return isMatch ? { ...item, quantity: item.quantity + 1 } : item;
      })
    );
    showAnimatedToast("success", "Quantity increased", "cart-qty-inc");
  };

  // Decrease Quantity
  const decreaseQuantity = (foodId, portionId, comboId) => {
    const item = cart.find(i => 
      i.type === "combo"
        ? (i.comboId === comboId || i.variantId === comboId)
        : i.foodId === foodId && i.portionId === portionId
    );

    if (!item) return;

    if (item.quantity > 1) {
      showAnimatedToast("success", "Quantity decreased", "cart-qty-dec");
    } else {
      showAnimatedToast("error", "Item removed from cart", "cart-remove");
    }

    setCart((prev) =>
      prev
        .map((item) => {
          const isMatch = item.type === "combo"
            ? (item.comboId === comboId || item.variantId === comboId)
            : item.foodId === foodId && item.portionId === portionId;
          
          return isMatch ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  // Remove item
  const removeFromCart = (foodId, portionId, comboId) => {
    setCart((prev) =>
      prev.filter((item) => {
        const isMatch = item.type === "combo"
          ? (item.comboId === comboId || item.variantId === comboId)
          : item.foodId === foodId && item.portionId === portionId;
        return !isMatch;
      })
    );
    showAnimatedToast("error", "Item removed from cart", "cart-remove");
  };

  // Update item (for editing options)
  const updateCartItem = (foodId, portionId, updatedItem) => {
    setCart((prev) => {
      // 1. Remove the old item
      const filtered = prev.filter(c => !(c.foodId === foodId && c.portionId === portionId));

      // 2. Check if the updated item already exists in the remaining items
      const existingIndex = filtered.findIndex(c =>
        c.foodId === updatedItem.foodId && c.portionId === updatedItem.portionId
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
        isModalOpen,
        setIsModalOpen,
        addToCart,
        addComboToCart,
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


