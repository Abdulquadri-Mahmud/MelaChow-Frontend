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
  setItemMealGroup: () => {},
  splitCartItem: () => {},
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
      setItemMealGroup: () => {},
      splitCartItem: () => {},
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

const getQuantityLimit = (item) => {
  if (item?.track_stock === true) return Math.max(0, Number(item.stock_quantity) || 0);
  const maxQuantity = Number(item?.max_quantity);
  return maxQuantity > 0 ? maxQuantity : null;
};

const getLimitMessage = (item, limit) =>
  item?.track_stock === true
    ? `Only ${limit} ${item.portion_label || item.name} available.`
    : `Only ${limit} ${item.portion_label || item.name} can be ordered at once.`;
// Helper to compare if two items are functionally identical
const isSameItem = (a, b) => {
  if (!a || !b) return false;
  const typeA = getItemType(a);
  const typeB = getItemType(b);
  if (typeA !== typeB) return false;

  if (typeA === "combo") {
    return (
      normalizeId(a.comboId || a.variantId) === normalizeId(b.comboId || b.variantId)
      && (a.meal_group_label || "") === (b.meal_group_label || "")
      && getOptionsSignature(a) === getOptionsSignature(b)
    );
  }

  return (
    normalizeId(a.foodId) === normalizeId(b.foodId)
    && normalizeId(a.portionId) === normalizeId(b.portionId)
    && (Number(a.portion_quantity) || 1) === (Number(b.portion_quantity) || 1)
    && (a.meal_group_label || "") === (b.meal_group_label || "")
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
    setCart((prev) => {
      const existingIndex = prev.findIndex((cartItem) => isSameItem(cartItem, item));
      const existing = existingIndex > -1 ? prev[existingIndex] : null;
      const nextQuantity = (Number(existing?.quantity) || 0) + (Number(item.quantity) || 1);
      const limit = getQuantityLimit(item);
      if (limit !== null && nextQuantity > limit) {
        showAnimatedToast("error", getLimitMessage(item, limit), "cart-stock-limit");
        return prev;
      }

      showAnimatedToast("success", "Item added to cart", "cart-add", proceedToCartAction);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = { ...existing, ...item, cartId: existing.cartId, quantity: nextQuantity };
        return next;
      }
      return [...prev, { ...item, quantity: Number(item.quantity) || 1, cartId: `${Date.now()}-${Math.random()}` }];
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
    setCart((prev) => prev.map((item) => {
      const isMatch = cartId ? item.cartId === cartId : item.type === "combo" ? (item.comboId === comboId || item.variantId === comboId) : item.foodId === foodId && item.portionId === portionId;
      if (!isMatch) return item;
      const limit = getQuantityLimit(item);
      const nextQuantity = (Number(item.quantity) || 0) + 1;
      if (limit !== null && nextQuantity > limit) {
        showAnimatedToast("error", getLimitMessage(item, limit), "cart-stock-limit");
        return item;
      }
      showAnimatedToast("success", "Quantity increased", "cart-qty-inc");
      return { ...item, quantity: nextQuantity };
    }));
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

  const setItemMealGroup = (cartId, mealGroupLabel) => {
    const normalizedLabel = String(mealGroupLabel || "").trim().slice(0, 40);
    setCart((prev) => mergeDuplicateCartItems(prev.map((item) => (
      item.cartId === cartId ? { ...item, meal_group_label: normalizedLabel } : item
    ))));
  };
  const splitCartItem = (cartId) => {
    setCart((prev) => {
      const source = prev.find((item) => item.cartId === cartId);
      if (!source || (Number(source.quantity) || 0) < 2) return prev;
      return prev.flatMap((item) => item.cartId !== cartId ? [item] : [
        { ...item, quantity: (Number(item.quantity) || 1) - 1 },
        { ...item, quantity: 1, meal_group_label: "", cartId: `${Date.now()}-${Math.random()}` },
      ]);
    });
  };

  // Clear cart
  const clearCart = () => {
    // Remove persisted cart immediately so a fresh add cannot revive an old line.
    if (typeof window !== "undefined") localStorage.removeItem("melachowCart");
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
        setItemMealGroup,
        splitCartItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};



