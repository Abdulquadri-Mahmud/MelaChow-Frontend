// /context-api/CartContext.js
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import showAnimatedToast from "../components/toast/showAnimatedToast";

const CartContext = createContext({
  cart: [],
  cartItemCount: 0,
  addToCart: () => {},
  addComboToCart: () => {},
  increaseQuantity: () => {},
  decreaseQuantity: () => {},
  removeFromCart: () => {},
  removeRestaurantFromCart: () => {},
  updateCartItem: () => {},
  clearCart: () => {},
});

const proceedToCartAction = {
  label: "Proceed to cart / checkout",
  href: "/orders?activeTab=cart",
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    return {
      cart: [],
      cartItemCount: 0,
      addToCart: () => {},
      addComboToCart: () => {},
      increaseQuantity: () => {},
      decreaseQuantity: () => {},
      removeFromCart: () => {},
      removeRestaurantFromCart: () => {},
      updateCartItem: () => {},
      clearCart: () => {},
    };
  }
  return context;
};

const normalizeId = (value) => String(value?._id || value?.id || value || "");

const getItemType = (item) =>
  item?.type || (item?.comboId || item?.variantId ? "combo" : "item");

const getOptionsSignature = (item) =>
  (item?.selected_options || [])
    .map((option) => ({
      id: normalizeId(option.option_id || option._id || option.label),
      quantity: Number(option.quantity) || 1,
    }))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((option) => `${option.id}:${option.quantity}`)
    .join("|");

// Helper to compare if two items are functionally identical
const isSameItem = (a, b) => {
  if (!a || !b) return false;
  const typeA = getItemType(a);
  const typeB = getItemType(b);
  if (typeA !== typeB) return false;

  if (typeA === "combo") {
    return (
      normalizeId(a.comboId || a.variantId) === normalizeId(b.comboId || b.variantId)
      && getOptionsSignature(a) === getOptionsSignature(b)
    );
  }

  return (
    normalizeId(a.foodId) === normalizeId(b.foodId)
    && normalizeId(a.portionId) === normalizeId(b.portionId)
    && (Number(a.portion_quantity) || 1) === (Number(b.portion_quantity) || 1)
    && getOptionsSignature(a) === getOptionsSignature(b)
  );
};

const mergeDuplicateCartItems = (items) =>
  items.reduce((merged, item) => {
    const existingIndex = merged.findIndex((existing) => isSameItem(existing, item));
    if (existingIndex === -1) {
      return [...merged, item];
    }

    const next = [...merged];
    const existing = next[existingIndex];
    next[existingIndex] = {
      ...existing,
      ...item,
      cartId: existing.cartId,
      quantity: (Number(existing.quantity) || 1) + (Number(item.quantity) || 1),
    };
    return next;
  }, []);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    if (typeof window === "undefined") return [];

    const stored = localStorage.getItem("melachowCart");
    if (!stored) return [];

    try {
      const parsed = JSON.parse(stored);
      return mergeDuplicateCartItems(parsed.map(item => ({
        ...item,
        cartId: item.cartId || `${Date.now()}-${Math.random()}`
      })));
    } catch {
      return [];
    }
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Store cart to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("melachowCart", JSON.stringify(cart));
    }
  }, [cart]);

  // Add item
  const addToCart = (item) => {
    showAnimatedToast("success", "Item added to cart", "cart-add", proceedToCartAction);
    setCart((prev) => {
      const existingIndex = prev.findIndex(c => isSameItem(c, item));

      if (existingIndex > -1) {
        const newCart = [...prev];
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          ...item,
          cartId: newCart[existingIndex].cartId,
          quantity: (Number(newCart[existingIndex].quantity) || 1) + (Number(item.quantity) || 1)
        };
        return newCart;
      }

      return [...prev, { ...item, cartId: `${Date.now()}-${Math.random()}` }];
    });
  };

  // Add Combo
  const addComboToCart = (comboItem) => {
    showAnimatedToast("success", `${comboItem.name} added to cart`, "cart-add-combo", proceedToCartAction);
    const newItem = {
        ...comboItem,
        type:     "combo",
        quantity: Number(comboItem.quantity) || 1,
        cartId:   `${Date.now()}-${Math.random()}`
    };
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => isSameItem(item, newItem));
      if (existingIndex === -1) {
        return [...prev, newItem];
      }

      const next = [...prev];
      next[existingIndex] = {
        ...next[existingIndex],
        ...newItem,
        cartId: next[existingIndex].cartId,
        quantity: (Number(next[existingIndex].quantity) || 1) + newItem.quantity,
      };
      return next;
    });
  };

  // Increase Quantity
  const increaseQuantity = (foodId, portionId, comboId, cartId) => {
    setCart((prev) =>
      prev.map((item) => {
        const isMatch = cartId 
          ? item.cartId === cartId 
          : item.type === "combo"
            ? (item.comboId === comboId || item.variantId === comboId)
            : item.foodId === foodId && item.portionId === portionId;

        return isMatch ? { ...item, quantity: item.quantity + 1 } : item;
      })
    );
    showAnimatedToast("success", "Quantity increased", "cart-qty-inc");
  };

  // Decrease Quantity
  const decreaseQuantity = (foodId, portionId, comboId, cartId) => {
    setCart((prev) => {
      const itemToUpdate = prev.find(item => 
        cartId 
          ? item.cartId === cartId 
          : item.type === "combo"
            ? (item.comboId === comboId || item.variantId === comboId)
            : item.foodId === foodId && item.portionId === portionId
      );

      if (!itemToUpdate) return prev;

      if (itemToUpdate.quantity > 1) {
        showAnimatedToast("success", "Quantity decreased", "cart-qty-dec");
        return prev.map(item => 
          item.cartId === itemToUpdate.cartId 
            ? { ...item, quantity: item.quantity - 1 } 
            : item
        );
      } else {
        showAnimatedToast("error", "Item removed from cart", "cart-remove");
        return prev.filter(item => item.cartId !== itemToUpdate.cartId);
      }
    });
  };

  // Remove item
  const removeFromCart = (foodId, portionId, comboId, cartId) => {
    setCart((prev) =>
      prev.filter((item) => {
        const isMatch = cartId 
          ? item.cartId === cartId
          : item.type === "combo"
            ? (item.comboId === comboId || item.variantId === comboId)
            : item.foodId === foodId && item.portionId === portionId;
        return !isMatch;
      })
    );
    showAnimatedToast("error", "Item removed from cart", "cart-remove");
  };

  const removeRestaurantFromCart = (restaurantId) => {
    setCart((prev) =>
      prev.filter((item) => (item.vendorId || item.restaurantId) !== restaurantId)
    );
  };

  // Update item (for editing options)
  const updateCartItem = (foodId, portionId, updatedItem, cartId) => {
    setCart((prev) => {
      // 1. Remove the old item by its unique cartId
      const filtered = prev.filter(c => c.cartId !== cartId);

      // 2. Check if the updated item (with its new options) already exists elsewhere in the cart
      const existingIndex = filtered.findIndex(c => isSameItem(c, updatedItem));

      if (existingIndex > -1) {
        // Merge quantities if an identical item exists
        const newCart = [...filtered];
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newCart[existingIndex].quantity + (updatedItem.quantity || 1)
        };
        return newCart;
      } else {
        // Otherwise add the updated item as a new entry (reusing the same cartId is fine)
        return [...filtered, { ...updatedItem, cartId: cartId || `${Date.now()}-${Math.random()}` }];
      }
    });
    showAnimatedToast("success", "Cart updated", "cart-update");
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    showAnimatedToast("success", "Cart cleared", "cart-clear");
  };

  const cartItemCount = cart.reduce(
    (total, item) => total + (Number(item.quantity) || 1),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItemCount,
        isModalOpen,
        setIsModalOpen,
        addToCart,
        addComboToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        removeRestaurantFromCart,
        updateCartItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};



