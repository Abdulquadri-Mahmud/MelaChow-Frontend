import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const isVendorOpen = (openingHours) => {
  if (!openingHours) return false;
  const now      = new Date();
  const dayName  = now.toLocaleDateString("en-US",
    { weekday: "long" }).toLowerCase();
  const hours    = openingHours[dayName];
  if (!hours?.open || !hours?.close) return false;
  const [oH, oM]  = hours.open.split(":").map(Number);
  const [cH, cM]  = hours.close.split(":").map(Number);
  const nowMins   = now.getHours() * 60 + now.getMinutes();
  const openMins  = oH * 60 + oM;
  const closeMins = cH * 60 + cM;
  return nowMins >= openMins && nowMins < closeMins;
};

/**
 * Generates a full descriptive sentence of the order items.
 * @param {Object} order - The order object
 * @param {Object} options - Formatting options
 * @param {boolean} options.includeCustomerName - Whether to start with "This customer (Name) ordered for..."
 * @param {string} options.prefix - Custom prefix (e.g. "You ordered for")
 * @returns {string}
 */
export function generateOrderItemsStatement(order, { includeCustomerName = false, prefix = "" } = {}) {
  const items = order.items || order.userOrderId?.items || [];
  if (!items.length) return "No items recorded in this order.";
  const joinList = (parts) => parts.length < 2 ? (parts[0] || "") : parts.length === 2 ? parts.join(" and ") : `${parts.slice(0, -1).join(", ")}, and ${parts.at(-1)}`;
  const lines = items.map((item) => {
    const quantity = Number(item.quantity) || 1;
    const portionQuantity = Number(item.portion_quantity) || 1;
    const portionLabel = item.portion_label || item.metadata?.portion_label || "portion";
    const itemName = item.name || item.variant?.name || "item";
    const options = item.selected_options || item.metadata?.selected_options || [];
    const choices = joinList(options.map((option) => `${Number(option.quantity) || 1} ${option.label || option.name}`).filter(Boolean));
    const packText = `${quantity} ${quantity === 1 ? "pack" : "packs"} of ${itemName}`;
    const contents = `${portionQuantity} ${portionLabel}${choices ? `, with ${choices}` : ""}`;
    return quantity === 1 ? `${packText}, making ${contents}` : `${packText}, each with ${contents}. Quantity: ${quantity}`;
  });
  const fullList = joinList(lines);
  if (includeCustomerName) {
    const user = order.userId || order.userOrderId?.userId;
    const name = user ? `${user.firstname || ""} ${user.lastname || ""}`.trim() : "";
    return `${name || "This customer"} ordered ${fullList}.`;
  }
  return `${prefix ? `${prefix} ` : ""}${fullList}.`;
}
