// /context-api/CartContext.js
"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import showAnimatedToast from "../components/toast/showAnimatedToast";
import { ANALYTICS_EVENTS, trackEvent } from "../lib/analytics/posthog";
import { toNumericAmount } from "../lib/analytics/events";
import {
  getFoodDiscoveryContext,
  getRestaurantDiscoveryContext,
} from "../lib/analytics/discoveryAttribution";

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
  startAnotherPersonPlate: () => {},
  continuePersonPlate: () => {},
  activeMealGroups: {},
  clearCart: () => {},
});

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
      startAnotherPersonPlate: () => {},
      continuePersonPlate: () => {},
      activeMealGroups: {},
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

const getReservedStockQuantity = (items, target) => items.reduce((total, item) => {
  if (getItemType(item) === "combo" || getItemType(target) === "combo") return total;
  const isSameStockItem = normalizeId(item.foodId) === normalizeId(target.foodId)
    && normalizeId(item.portionId) === normalizeId(target.portionId);
  return total + (isSameStockItem ? (Number(item.quantity) || 1) : 0);
}, 0);
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
  const [activeMealGroups, setActiveMealGroups] = useState(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(sessionStorage.getItem("melachowActiveMealGroups") || "{}"); } catch { return {}; }
  });

  const cartRef = useRef(cart);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  const markCartModified = () => {
    try {
      if (typeof window !== "undefined") sessionStorage.setItem("melachow_cart_modified", "1");
    } catch {}
  };

  const getItemUnitPrice = (item) => toNumericAmount(item?.price_naira ?? item?.price ?? 0) ?? 0;

  const summarizeCart = (items, restaurantId) => {
    const scoped = restaurantId
      ? items.filter((entry) => getRestaurantId(entry) === String(restaurantId))
      : items;
    const itemCount = scoped.reduce((sum, entry) => sum + (Number(entry?.quantity) || 1), 0);
    const subtotal = Number(
      scoped
        .reduce((sum, entry) => sum + getItemUnitPrice(entry) * (Number(entry?.quantity) || 1), 0)
        .toFixed(2)
    );
    const hasUnavailableItems = scoped.some(
      (entry) => entry?.is_available === false || entry?.is_in_stock === false
    );
    return {
      item_count: itemCount,
      cart_subtotal: subtotal,
      cart_value: subtotal,
      is_empty: itemCount === 0,
      contains_unavailable_items: hasUnavailableItems,
    };
  };

  const buildItemAnalyticsProps = (item, quantityOverride) => {
    const itemType = getItemType(item);
    const foodItemId =
      itemType === "combo"
        ? normalizeId(item?.comboId || item?.variantId || item?._id)
        : normalizeId(item?.foodId || item?._id);
    const restaurantId = getRestaurantId(item) || undefined;
    const foodCtx = getFoodDiscoveryContext(foodItemId);
    const restaurantCtx = getRestaurantDiscoveryContext(restaurantId);
    const category =
      item?.category ||
      item?.platform_category?.parent?.name ||
      item?.platform_category?.name ||
      foodCtx?.category_name ||
      undefined;

    return {
      food_item_id: foodItemId || undefined,
      food_item_name: item?.name || undefined,
      food_item_category: category,
      item_type: itemType,
      restaurant_id: restaurantId,
      item_price: getItemUnitPrice(item),
      item_availability: item?.is_available !== false && item?.is_in_stock !== false,
      quantity: Number(quantityOverride ?? item?.quantity) || 1,
      item_quantity: Number(quantityOverride ?? item?.quantity) || 1,
      discovery_source: foodCtx?.discovery_source || restaurantCtx?.discovery_source || "direct",
      is_recommended: foodCtx?.is_recommended || undefined,
      is_featured: foodCtx?.is_featured || undefined,
      is_popular: foodCtx?.is_popular || Boolean(item?.is_popular) || undefined,
    };
  };

  // Store cart to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("melachowCart", JSON.stringify(cart));
    }
  }, [cart]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("melachowActiveMealGroups", JSON.stringify(activeMealGroups));
    }
  }, [activeMealGroups]);

  // A person group only belongs to a restaurant while that restaurant still
  // has items in the cart. This also removes stale session state on hydration.
  useEffect(() => {
    const restaurantIdsInCart = new Set(
      cart.map((item) => String(item?.vendorId || item?.restaurantId || "")).filter(Boolean)
    );

    setActiveMealGroups((current) => {
      const staleRestaurantIds = Object.keys(current).filter(
        (restaurantId) => !restaurantIdsInCart.has(restaurantId)
      );
      if (staleRestaurantIds.length === 0) return current;

      const next = { ...current };
      staleRestaurantIds.forEach((restaurantId) => delete next[restaurantId]);
      return next;
    });
  }, [cart]);

  const getRestaurantId = (item) => String(item?.vendorId || item?.restaurantId || "");
  const withActiveMealGroup = (item) => {
    if (!cart.some((cartItem) => getRestaurantId(cartItem) === getRestaurantId(item))) return item;
    const activeMealGroup = activeMealGroups[getRestaurantId(item)];
    return activeMealGroup ? { ...item, meal_group_label: activeMealGroup.label } : item;
  };

  const startAnotherPersonPlate = (restaurantId) => {
    const normalizedRestaurantId = String(restaurantId || "");
    if (!normalizedRestaurantId) return;

    setCart((previousCart) => {
      return previousCart.map((item) => (
        getRestaurantId(item) === normalizedRestaurantId && !String(item.meal_group_label || "").trim()
          ? { ...item, meal_group_label: "Person 1" }
          : item
      ));
    });

    const restaurantItems = cart.filter((item) => getRestaurantId(item) === normalizedRestaurantId);
    const labels = [...new Set(restaurantItems.map((item) => String(item.meal_group_label || "").trim()).filter(Boolean))];
    const hasUnassignedItems = restaurantItems.some((item) => !String(item.meal_group_label || "").trim());
    const number = Math.max(labels.length + (hasUnassignedItems ? 1 : 0), 1) + 1;
    const nextPersonLabel = `Person ${number}`;

    setActiveMealGroups((current) => ({
      ...current,
      [normalizedRestaurantId]: { label: nextPersonLabel },
    }));
    showAnimatedToast(
      "success",
      `${nextPersonLabel} started. Add everything they want to eat.`,
      "cart-person-start"
    );
  };

  const continuePersonPlate = (restaurantId, mealGroupLabel) => {
    const normalizedRestaurantId = String(restaurantId || "");
    const normalizedLabel = String(mealGroupLabel || "").trim().slice(0, 40);
    if (!normalizedRestaurantId || !normalizedLabel) return;

    setCart((previousCart) => previousCart.map((item) => (
      getRestaurantId(item) === normalizedRestaurantId && !String(item.meal_group_label || "").trim()
        ? { ...item, meal_group_label: "Person 1" }
        : item
    )));
    setActiveMealGroups((current) => ({
      ...current,
      [normalizedRestaurantId]: { label: normalizedLabel },
    }));
  };

  // Add item
  const addToCart = (item) => {
    const itemForPlate = withActiveMealGroup(item);
    const prevSnapshot = cartRef.current;
    const existingIdxSnapshot = prevSnapshot.findIndex((cartItem) => isSameItem(cartItem, itemForPlate));
    const existingSnapshot = existingIdxSnapshot > -1 ? prevSnapshot[existingIdxSnapshot] : null;
    const requestedQty = Number(itemForPlate.quantity) || 1;
    const nextQtySnapshot = (Number(existingSnapshot?.quantity) || 0) + requestedQty;
    const limitSnapshot = getQuantityLimit(itemForPlate);
    const exceedsSnapshot =
      limitSnapshot !== null &&
      ((itemForPlate.track_stock === true &&
        getReservedStockQuantity(prevSnapshot, itemForPlate) + requestedQty > limitSnapshot) ||
        nextQtySnapshot > limitSnapshot);

    setCart((prev) => {
      const existingIndex = prev.findIndex((cartItem) => isSameItem(cartItem, itemForPlate));
      const existing = existingIndex > -1 ? prev[existingIndex] : null;
      const nextQuantity = (Number(existing?.quantity) || 0) + (Number(itemForPlate.quantity) || 1);
      const limit = getQuantityLimit(itemForPlate);
      const requestedQuantity = Number(itemForPlate.quantity) || 1;
      const wouldExceedStock = itemForPlate.track_stock === true
        && getReservedStockQuantity(prev, itemForPlate) + requestedQuantity > limit;
      if (limit !== null && (wouldExceedStock || nextQuantity > limit)) {
        showAnimatedToast("error", getLimitMessage(itemForPlate, limit), "cart-stock-limit");
        return prev;
      }

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = { ...existing, ...itemForPlate, cartId: existing.cartId, quantity: nextQuantity };
        return next;
      }
      return [...prev, { ...itemForPlate, quantity: Number(itemForPlate.quantity) || 1, cartId: `${Date.now()}-${Math.random()}` }];
    });

    if (!exceedsSnapshot) {
      markCartModified();
      const restaurantId = getRestaurantId(itemForPlate);
      const nextCartSnapshot =
        existingIdxSnapshot > -1
          ? prevSnapshot.map((entry, idx) =>
              idx === existingIdxSnapshot ? { ...entry, ...itemForPlate, quantity: nextQtySnapshot } : entry
            )
          : [...prevSnapshot, { ...itemForPlate, quantity: requestedQty }];
      const summary = summarizeCart(nextCartSnapshot, restaurantId);
      const itemProps = buildItemAnalyticsProps(itemForPlate, requestedQty);

      if (existingIdxSnapshot > -1) {
        const prevQty = Number(existingSnapshot?.quantity) || 1;
        const qtyProps = {
          ...itemProps,
          ...summary,
          cart_id: existingSnapshot?.cartId,
          previous_quantity: prevQty,
          new_quantity: nextQtySnapshot,
          quantity: nextQtySnapshot,
          item_quantity: nextQtySnapshot,
          delta: requestedQty,
          direction: "increase",
          trigger: "add_to_cart",
          cart_modified: true,
        };
        trackEvent(ANALYTICS_EVENTS.FOOD_ITEM_QUANTITY_UPDATED, qtyProps);
        trackEvent(ANALYTICS_EVENTS.CART_QUANTITY_UPDATED, qtyProps);
      } else {
        const addProps = {
          ...itemProps,
          ...summary,
          cart_modified: true,
        };
        trackEvent(ANALYTICS_EVENTS.FOOD_ITEM_ADDED_TO_CART, addProps);
        trackEvent(ANALYTICS_EVENTS.CART_ITEM_ADDED, addProps);
      }
    }

    showAnimatedToast("success", "Item added to cart", "cart-add");
  };
  // Add Combo
  const addComboToCart = (comboItem) => {
    const itemForPlate = withActiveMealGroup(comboItem);
    const newItem = {
        ...itemForPlate,
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
    showAnimatedToast("success", `${comboItem.name} added to cart`, "cart-add-combo");
    markCartModified();
    const prevSnapshot = cartRef.current;
    const existingIdxSnapshot = prevSnapshot.findIndex((item) => isSameItem(item, newItem));
    const existingSnapshot = existingIdxSnapshot > -1 ? prevSnapshot[existingIdxSnapshot] : null;
    const restaurantId = getRestaurantId(newItem);
    const nextQtySnapshot = (Number(existingSnapshot?.quantity) || 0) + newItem.quantity;
    const nextCartSnapshot =
      existingIdxSnapshot > -1
        ? prevSnapshot.map((entry, idx) =>
            idx === existingIdxSnapshot ? { ...entry, ...newItem, quantity: nextQtySnapshot } : entry
          )
        : [...prevSnapshot, newItem];
    const summary = summarizeCart(nextCartSnapshot, restaurantId);
    const itemProps = buildItemAnalyticsProps(newItem, newItem.quantity);

    if (existingIdxSnapshot > -1) {
      const prevQty = Number(existingSnapshot?.quantity) || 1;
      const qtyProps = {
        ...itemProps,
        ...summary,
        cart_id: existingSnapshot?.cartId,
        previous_quantity: prevQty,
        new_quantity: nextQtySnapshot,
        quantity: nextQtySnapshot,
        item_quantity: nextQtySnapshot,
        delta: newItem.quantity,
        direction: "increase",
        trigger: "add_to_cart",
        cart_modified: true,
      };
      trackEvent(ANALYTICS_EVENTS.FOOD_ITEM_QUANTITY_UPDATED, qtyProps);
      trackEvent(ANALYTICS_EVENTS.CART_QUANTITY_UPDATED, qtyProps);
    } else {
      const addProps = {
        ...itemProps,
        ...summary,
        cart_id: newItem.cartId,
        cart_modified: true,
      };
      trackEvent(ANALYTICS_EVENTS.FOOD_ITEM_ADDED_TO_CART, addProps);
      trackEvent(ANALYTICS_EVENTS.CART_ITEM_ADDED, addProps);
    }
  };

  // Increase Quantity
  const increaseQuantity = (foodId, portionId, comboId, cartId) => {
    const prevSnapshot = cartRef.current;
    const targetSnapshot = prevSnapshot.find((item) => (
      cartId ? item.cartId === cartId : item.type === "combo"
        ? (item.comboId === comboId || item.variantId === comboId)
        : item.foodId === foodId && item.portionId === portionId
    ));
    const limitSnapshot = targetSnapshot ? getQuantityLimit(targetSnapshot) : null;
    const prevQtySnapshot = Number(targetSnapshot?.quantity) || 0;
    const exceedsSnapshot =
      Boolean(targetSnapshot) &&
      limitSnapshot !== null &&
      ((targetSnapshot.track_stock === true &&
        getReservedStockQuantity(prevSnapshot, targetSnapshot) + 1 > limitSnapshot) ||
        prevQtySnapshot + 1 > limitSnapshot);

    setCart((prev) => {
      const target = prev.find((item) => (
        cartId ? item.cartId === cartId : item.type === "combo"
          ? (item.comboId === comboId || item.variantId === comboId)
          : item.foodId === foodId && item.portionId === portionId
      ));
      if (!target) return prev;

      const limit = getQuantityLimit(target);
      const wouldExceedStock = target.track_stock === true
        && getReservedStockQuantity(prev, target) + 1 > limit;
      if (limit !== null && (wouldExceedStock || (Number(target.quantity) || 0) + 1 > limit)) {
        showAnimatedToast("error", getLimitMessage(target, limit), "cart-stock-limit");
        return prev;
      }

      showAnimatedToast("success", "Quantity increased", "cart-qty-inc");
      return prev.map((item) => item.cartId === target.cartId
        ? { ...item, quantity: (Number(item.quantity) || 0) + 1 }
        : item);
    });

    if (targetSnapshot && !exceedsSnapshot) {
      markCartModified();
      const newQty = prevQtySnapshot + 1;
      const restaurantId = getRestaurantId(targetSnapshot);
      const nextCartSnapshot = prevSnapshot.map((item) =>
        item.cartId === targetSnapshot.cartId ? { ...item, quantity: newQty } : item
      );
      const qtyProps = {
        ...buildItemAnalyticsProps(targetSnapshot, newQty),
        ...summarizeCart(nextCartSnapshot, restaurantId),
        cart_id: targetSnapshot.cartId,
        previous_quantity: prevQtySnapshot,
        new_quantity: newQty,
        delta: 1,
        direction: "increase",
        trigger: "quantity_button",
        cart_modified: true,
      };
      trackEvent(ANALYTICS_EVENTS.FOOD_ITEM_QUANTITY_UPDATED, qtyProps);
      trackEvent(ANALYTICS_EVENTS.CART_QUANTITY_UPDATED, qtyProps);
    }
  };
  // Decrease Quantity
  const decreaseQuantity = (foodId, portionId, comboId, cartId) => {
    const prevSnapshot = cartRef.current;
    const targetSnapshot = prevSnapshot.find((item) =>
      cartId
        ? item.cartId === cartId
        : item.type === "combo"
          ? (item.comboId === comboId || item.variantId === comboId)
          : item.foodId === foodId && item.portionId === portionId
    );

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

    if (targetSnapshot) {
      markCartModified();
      const restaurantId = getRestaurantId(targetSnapshot);
      const prevQty = Number(targetSnapshot.quantity) || 1;
      if (prevQty > 1) {
        const newQty = prevQty - 1;
        const nextCartSnapshot = prevSnapshot.map((item) =>
          item.cartId === targetSnapshot.cartId ? { ...item, quantity: newQty } : item
        );
        const qtyProps = {
          ...buildItemAnalyticsProps(targetSnapshot, newQty),
          ...summarizeCart(nextCartSnapshot, restaurantId),
          cart_id: targetSnapshot.cartId,
          previous_quantity: prevQty,
          new_quantity: newQty,
          delta: -1,
          direction: "decrease",
          trigger: "quantity_button",
          cart_modified: true,
        };
        trackEvent(ANALYTICS_EVENTS.FOOD_ITEM_QUANTITY_UPDATED, qtyProps);
        trackEvent(ANALYTICS_EVENTS.CART_QUANTITY_UPDATED, qtyProps);
      } else {
        const nextCartSnapshot = prevSnapshot.filter((item) => item.cartId !== targetSnapshot.cartId);
        const removeProps = {
          ...buildItemAnalyticsProps(targetSnapshot, prevQty),
          ...summarizeCart(nextCartSnapshot, restaurantId),
          cart_id: targetSnapshot.cartId,
          removal_trigger: "decrement_to_zero",
          cart_modified: true,
        };
        trackEvent(ANALYTICS_EVENTS.FOOD_ITEM_REMOVED_FROM_CART, removeProps);
        trackEvent(ANALYTICS_EVENTS.CART_ITEM_REMOVED, removeProps);
      }
    }
  };

  // Remove item
  const removeFromCart = (foodId, portionId, comboId, cartId) => {
    const prevSnapshot = cartRef.current;
    const removedItems = prevSnapshot.filter((item) =>
      cartId
        ? item.cartId === cartId
        : item.type === "combo"
          ? (item.comboId === comboId || item.variantId === comboId)
          : item.foodId === foodId && item.portionId === portionId
    );
    const nextCartSnapshot = prevSnapshot.filter((item) => !removedItems.includes(item));

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

    if (removedItems.length > 0) {
      markCartModified();
      const target = removedItems[0];
      const restaurantId = getRestaurantId(target);
      const removeProps = {
        ...buildItemAnalyticsProps(target, target.quantity),
        ...summarizeCart(nextCartSnapshot, restaurantId),
        cart_id: target.cartId,
        removal_trigger: "remove_button",
        cart_modified: true,
      };
      trackEvent(ANALYTICS_EVENTS.FOOD_ITEM_REMOVED_FROM_CART, removeProps);
      trackEvent(ANALYTICS_EVENTS.CART_ITEM_REMOVED, removeProps);
    }

    showAnimatedToast("error", "Item removed from cart", "cart-remove");
  };

  const removeRestaurantFromCart = (restaurantId) => {
    setCart((prev) =>
      prev.filter((item) => (item.vendorId || item.restaurantId) !== restaurantId)
    );
    setActiveMealGroups((current) => {
      const next = { ...current };
      delete next[String(restaurantId)];
      return next;
    });
  };

  // Update item (for editing options)
  const updateCartItem = (foodId, portionId, updatedItem, cartId) => {
    setCart((prev) => {
      const source = prev.find((item) => item.cartId === cartId);
      if (!source) return prev;

      // 1. Remove the old item by its unique cartId
      const filtered = prev.filter(c => c.cartId !== cartId);
      // Preserve person assignment and checkout metadata that are not part of
      // the customization modal's editable payload.
      const nextItem = {
        ...source,
        ...updatedItem,
        // Editing choices does not recalculate the restaurant delivery fee.
        deliveryFee: source.deliveryFee ?? updatedItem.deliveryFee ?? 0,
        cartId: source.cartId,
      };

      // 2. Check if the updated item (with its new options) already exists elsewhere in the cart
      const existingIndex = filtered.findIndex(c => isSameItem(c, nextItem));

      if (existingIndex > -1) {
        // Merge quantities if an identical item exists
        const newCart = [...filtered];
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          deliveryFee: nextItem.deliveryFee ?? newCart[existingIndex].deliveryFee ?? 0,
          quantity: newCart[existingIndex].quantity + (nextItem.quantity || 1)
        };
        return newCart;
      } else {
        return [...filtered, nextItem];
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
  const clearCart = (options = {}) => {
    const prevSnapshot = cartRef.current;
    const reason = options?.reason || "user_action";
    if (reason !== "order_completed" && prevSnapshot.length > 0) {
      const restaurantIds = [...new Set(prevSnapshot.map(getRestaurantId).filter(Boolean))];
      const summary = summarizeCart(prevSnapshot);
      trackEvent(ANALYTICS_EVENTS.CART_CLEARED, {
        ...summary,
        restaurant_id: restaurantIds[0],
        restaurant_count: restaurantIds.length,
        clear_reason: reason,
      });
    }
    // Remove persisted cart immediately so a fresh add cannot revive an old line.
    if (typeof window !== "undefined") {
      localStorage.removeItem("melachowCart");
      sessionStorage.removeItem("melachow_cart_modified");
    }
    setCart([]);
    setActiveMealGroups({});
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
        startAnotherPersonPlate,
        continuePersonPlate,
        activeMealGroups,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};



