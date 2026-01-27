"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook for cart validation before checkout
 * 
 * Validates cart items to ensure they meet all requirements for order creation.
 * Checks for missing variants, required choices, and valid quantities.
 * 
 * @param {Array<Object>} cartItems - Cart items to validate
 * @returns {Object} Validation utilities and state
 * 
 * @example
 * const { validateCart, validationErrors, isValid } = useCartValidation(cart);
 * 
 * if (!validateCart()) {
 *   console.error(validationErrors);
 * }
 */
export function useCartValidation(cartItems) {
    const [validationErrors, setValidationErrors] = useState([]);
    const [isValid, setIsValid] = useState(true);

    /**
     * Validate all cart items
     * @returns {boolean} True if cart is valid, false otherwise
     */
    const validateCart = () => {
        const errors = [];

        // Check if cart is empty
        if (!cartItems || cartItems.length === 0) {
            errors.push({
                type: "empty_cart",
                message: "Your cart is empty"
            });
            setValidationErrors(errors);
            setIsValid(false);
            return false;
        }

        cartItems.forEach((item, index) => {
            // Check if variant is selected (if item has variants)
            if (item.variants && item.variants.length > 0 && !item.selectedVariant) {
                errors.push({
                    itemIndex: index,
                    itemName: item.name,
                    field: "variant",
                    message: "Please select a portion size"
                });
            }

            // Check if required choices are selected
            if (item.choiceGroups) {
                item.choiceGroups.forEach(group => {
                    const selectedCount = item.selectedChoices?.filter(
                        c => c.group === group.name
                    ).length || 0;

                    if (group.minSelect && selectedCount < group.minSelect) {
                        errors.push({
                            itemIndex: index,
                            itemName: item.name,
                            field: "choices",
                            message: `Please select at least ${group.minSelect} ${group.name}`
                        });
                    }

                    if (group.maxSelect && selectedCount > group.maxSelect) {
                        errors.push({
                            itemIndex: index,
                            itemName: item.name,
                            field: "choices",
                            message: `You can only select up to ${group.maxSelect} ${group.name}`
                        });
                    }
                });
            }

            // Check quantity
            if (!item.quantity || item.quantity < 1) {
                errors.push({
                    itemIndex: index,
                    itemName: item.name,
                    field: "quantity",
                    message: "Quantity must be at least 1"
                });
            }

            // Check if item has required fields
            if (!item.foodId) {
                errors.push({
                    itemIndex: index,
                    itemName: item.name,
                    field: "foodId",
                    message: "Missing food ID - please re-add this item"
                });
            }

            if (!item.restaurantId) {
                errors.push({
                    itemIndex: index,
                    itemName: item.name,
                    field: "restaurantId",
                    message: "Missing restaurant ID - please re-add this item"
                });
            }

            if (!item.price || item.price <= 0) {
                errors.push({
                    itemIndex: index,
                    itemName: item.name,
                    field: "price",
                    message: "Invalid price - please re-add this item"
                });
            }
        });

        setValidationErrors(errors);
        setIsValid(errors.length === 0);
        return errors.length === 0;
    };

    // Auto-validate when cart changes
    useEffect(() => {
        if (cartItems && cartItems.length > 0) {
            validateCart();
        }
    }, [cartItems]);

    return {
        validateCart,
        validationErrors,
        isValid,
        hasErrors: validationErrors.length > 0
    };
}

/**
 * Cart Validation Display Component
 * 
 * Displays validation errors in a user-friendly format
 * 
 * @param {Object} props
 * @param {Array} props.errors - Validation errors to display
 * @param {Function} props.onFixItem - Callback to navigate to item for fixing
 * @returns {JSX.Element|null}
 */
export function CartValidationErrors({ errors, onFixItem }) {
    if (!errors || errors.length === 0) return null;

    return (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                    <svg
                        className="w-5 h-5 text-yellow-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>

                <div className="flex-1">
                    <h4 className="text-sm font-bold text-yellow-800 mb-2">
                        Please fix the following issues before checkout:
                    </h4>

                    <ul className="space-y-2">
                        {errors.map((error, index) => (
                            <li
                                key={index}
                                className="text-xs text-yellow-700 flex items-start gap-2"
                            >
                                <span className="flex-shrink-0 mt-0.5">•</span>
                                <div className="flex-1">
                                    {error.itemName && (
                                        <span className="font-semibold">{error.itemName}: </span>
                                    )}
                                    <span>{error.message}</span>
                                </div>
                                {onFixItem && error.itemIndex !== undefined && (
                                    <button
                                        onClick={() => onFixItem(error.itemIndex)}
                                        className="text-yellow-800 hover:text-yellow-900 font-semibold underline"
                                    >
                                        Fix
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
