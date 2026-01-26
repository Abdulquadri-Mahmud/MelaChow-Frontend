/**
 * Order Transformation Utilities for V2 API
 * 
 * This module provides functions to transform cart data into the format
 * required by the Order Creation V2 API.
 */

/**
 * Group cart items by restaurant
 * 
 * @param {Array<Object>} cartItems - Array of cart items
 * @returns {Object} Items grouped by restaurant ID with delivery fees
 * 
 * @example
 * const grouped = groupItemsByRestaurant(cartItems);
 * // { "restaurantId1": { items: [...], deliveryFee: 700 } }
 */
const groupItemsByRestaurant = (cartItems) => {
    return cartItems.reduce((acc, item) => {
        const restaurantId = item.restaurantId;

        if (!acc[restaurantId]) {
            acc[restaurantId] = {
                items: [],
                deliveryFee: Number(item.deliveryFee || 0),
                restaurantName: item.storeName || "Unknown Store"
            };
        }

        acc[restaurantId].items.push(item);
        return acc;
    }, {});
};

/**
 * Transform cart items to V2 order format
 * 
 * This function converts the frontend cart structure into the payload
 * format required by the Order Creation V2 API. It handles:
 * - Item transformation with variants and metadata
 * - Delivery fee calculation per vendor
 * - Address formatting
 * - Notes and customizations
 * 
 * @param {Array<Object>} cartItems - Items from cart state
 * @param {Object} deliveryAddress - User's delivery address
 * @param {string} deliveryAddress.addressLine - Full address line
 * @param {string} deliveryAddress.city - City name
 * @param {string} deliveryAddress.state - State name
 * @param {string} deliveryAddress.phone - Address phone number
 * @param {string} deliveryAddress.label - Address label (e.g., "Home", "Work")
 * @param {string} phone - User's primary phone number
 * @param {Object} notes - Optional notes per restaurant (keyed by storeName)
 * @returns {Object} V2 order payload ready for API submission
 * 
 * @example
 * const payload = transformCartToOrderV2(
 *   cartItems,
 *   { 
 *     addressLine: "123 Main St",
 *     city: "Lagos", 
 *     state: "Lagos",
 *     phone: "+2348012345678",
 *     label: "Home"
 *   },
 *   "+2348012345678",
 *   { "Restaurant A": "Extra spicy please" }
 * );
 */
export const transformCartToOrderV2 = (cartItems, deliveryAddress, phone, notes = {}) => {
    // Group items by restaurant to calculate delivery fees
    const itemsByRestaurant = groupItemsByRestaurant(cartItems);

    // Transform items to V2 format
    const items = cartItems.map(item => {
        // Get the note for this item's restaurant
        const restaurantNote = notes[item.storeName] || "";

        return {
            foodId: item.foodId,
            restaurantId: item.restaurantId,
            variant: {
                name: item.variantName || item.name || "Standard",
                price: Number(item.price),
                image: item.image || ""
            },
            quantity: Number(item.quantity),
            note: restaurantNote,
            metadata: {
                // Include any custom metadata from the cart item
                ...(item.metadata || {}),
                // Add variant ID if available
                variantId: item.variantId,
                // Add any other relevant data
                storeName: item.storeName,
                estimatedDeliveryTime: item.estimatedDeliveryTime
            }
        };
    });

    // Calculate delivery fees per vendor
    const vendorDeliveryFees = Object.keys(itemsByRestaurant).map(restaurantId => ({
        restaurantId,
        deliveryFee: Number(itemsByRestaurant[restaurantId].deliveryFee || 0)
    }));

    // Format delivery address
    const formattedAddress = {
        addressLine: deliveryAddress.addressLine,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        phone: deliveryAddress.phone || phone,
        label: deliveryAddress.label || "Home"
    };

    return {
        items,
        vendorDeliveryFees,
        deliveryAddress: formattedAddress,
        phone
    };
};

/**
 * Validate cart items before checkout
 * 
 * Checks for common issues that would prevent order creation:
 * - Empty cart
 * - Missing required fields
 * - Invalid quantities
 * 
 * @param {Array<Object>} cartItems - Cart items to validate
 * @returns {Object} Validation result with isValid flag and errors array
 * 
 * @example
 * const validation = validateCartItems(cartItems);
 * if (!validation.isValid) {
 *   console.error(validation.errors);
 * }
 */
export const validateCartItems = (cartItems) => {
    const errors = [];

    // Check if cart is empty
    if (!cartItems || cartItems.length === 0) {
        errors.push({
            type: "empty_cart",
            message: "Your cart is empty"
        });
        return { isValid: false, errors };
    }

    // Validate each item
    cartItems.forEach((item, index) => {
        // Check required fields
        if (!item.foodId) {
            errors.push({
                type: "missing_field",
                itemIndex: index,
                itemName: item.name || "Unknown item",
                message: "Missing food ID"
            });
        }

        if (!item.restaurantId) {
            errors.push({
                type: "missing_field",
                itemIndex: index,
                itemName: item.name || "Unknown item",
                message: "Missing restaurant ID"
            });
        }

        // Check quantity
        if (!item.quantity || item.quantity < 1) {
            errors.push({
                type: "invalid_quantity",
                itemIndex: index,
                itemName: item.name || "Unknown item",
                message: "Quantity must be at least 1"
            });
        }

        // Check price
        if (!item.price || item.price <= 0) {
            errors.push({
                type: "invalid_price",
                itemIndex: index,
                itemName: item.name || "Unknown item",
                message: "Invalid price"
            });
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Calculate order totals from cart items
 * 
 * @param {Array<Object>} cartItems - Cart items
 * @returns {Object} Calculated totals (subtotal, deliveryFee, total)
 * 
 * @example
 * const totals = calculateOrderTotals(cartItems);
 * console.log(totals.total); // 7700
 */
export const calculateOrderTotals = (cartItems) => {
    // Calculate subtotal
    const subtotal = cartItems.reduce((sum, item) => {
        return sum + (Number(item.price) * Number(item.quantity));
    }, 0);

    // Calculate delivery fees (one per restaurant)
    const restaurantDeliveryMap = {};
    cartItems.forEach(item => {
        if (!restaurantDeliveryMap[item.restaurantId]) {
            restaurantDeliveryMap[item.restaurantId] = Number(item.deliveryFee || 0);
        }
    });

    const deliveryFee = Object.values(restaurantDeliveryMap).reduce(
        (sum, fee) => sum + fee,
        0
    );

    const total = subtotal + deliveryFee;

    return {
        subtotal,
        deliveryFee,
        total,
        restaurantCount: Object.keys(restaurantDeliveryMap).length
    };
};
