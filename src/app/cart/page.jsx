"use client";

import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { ArrowLeft, Clock, Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { BiCartAdd } from "react-icons/bi";
import { motion } from "framer-motion";

export default function CartPage() {
  const { cart, increaseQuantity, decreaseQuantity, removeFromCart } = useCart();
  const router = useRouter();

  const totalItems = cart.length;

  // Group items by restaurant
  const groupedCart = cart.reduce((acc, item) => {
    const store = item.storeName || "Unknown Store";
    if (!acc[store]) acc[store] = [];
    acc[store].push(item);
    return acc;
  }, {});

  // Calculate subtotal for all items
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Helper to calculate total delivery fee per restaurant (only once)
  const getDeliveryFee = (items) => {
    if (items.length === 0) return 0;
    return items[0].deliveryFee || 0;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col pb-24">
      {/* Header */}
      <div className="md:p-4 p-3 flex items-center justify-between bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">Your Cart</h2>
        </div>
        <Link href="/cart">
          <motion.div whileHover={{ rotate: 15 }} className="relative">
            <BiCartAdd className="text-gray-700" size={22} />
            <span className="absolute -top-1 -right-1 bg-[#FF6B00] animate-bounce text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {totalItems}
            </span>
          </motion.div>
        </Link>
      </div>

      {/* Cart Items */}
      <div className="flex-1 md:p-4 p-2 pb-20">
        {Object.keys(groupedCart).length === 0 ? (
          <p className="text-gray-500 text-sm text-center mt-12">
            Your cart is empty
          </p>
        ) : (
          Object.entries(groupedCart).map(([storeName, items]) => (
            <div key={storeName} className="mb-4 relative">
              {/* Restaurant Header & Quick Notice */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-800">{storeName}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    You are ordering {items.length} {items.length > 1 ? "items" : "item"} from this restaurant. Only one delivery fee applies.
                  </p>
                </div>
               
              </div>

              {/* Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.foodId + item.variantId}
                    className="bg-white border border-gray-100 rounded-2xl p-2 flex flex-col gap-3 transition relative"
                  >
                    {/* Category */}
                    {item.category && (
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        {item.category}
                      </p>
                    )}

                    <div className="flex gap-3">
                      {/* Image */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-xl object-cover bg-gray-100 flex-shrink-0"
                      />

                      {/* Content */}
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex justify-between items-center flex-wrap">
                          {/* Name & Store */}
                          <div className="flex flex-col">
                            <p className="text-sm text-gray-800 truncate">
                              {item.variantName}
                            </p>
                            <p className="text-xs text-gray-600 truncate">{item.storeName || "Unknown Store"}</p>
                          </div>

                          {/* Delivery Type */}
                          <span className="text-xs text-gray-500">
                            Delivery Fee: ₦{getDeliveryFee(items).toLocaleString()}
                          </span>
                        </div>

                        {/* Price */}
                        <span className="text-sm font-semibold text-orange-600 mt-1">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </span>

                        {/* Estimated Delivery */}
                        {item.estimatedDeliveryTime && (
                          <p className="text-xs absolute top-2 right-2 bg-orange-50 px-2 py-1 rounded text-gray-500 mt-1 inline-flex items-center gap-1 w-fit">
                            <Clock size={12} className="text-orange-500" />
                            {item.estimatedDeliveryTime.min} - {item.estimatedDeliveryTime.max} mins
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls & Remove */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-2 bg-orange-100 rounded-full px-3 py-1">
                        <button
                          onClick={() => decreaseQuantity(item.foodId, item.variantId)}
                          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200"
                        >
                          <Minus size={14} />
                        </button>

                        <span className="text-sm font-medium text-gray-800">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => increaseQuantity(item.foodId, item.variantId)}
                          className="w-6 h-6 flex items-center justify-center rounded-full bg-orange-500 text-white hover:bg-gray-900"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.foodId, item.variantId)}
                        className="ml-auto text-red-400 bg-red-50 p-1 rounded hover:text-red-500 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Checkout Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-18 left-0 right-0 bg-white p-3 shadow-xl rounded-t-2xl border-t">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-600 text-sm">Subtotal</span>
            <span className="font-bold text-lg">₦{subtotal.toLocaleString()}</span>
          </div>

          <button
            onClick={() => router.push("/checkout")}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold text-base active:scale-95 transition-all"
          >
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  );
}
