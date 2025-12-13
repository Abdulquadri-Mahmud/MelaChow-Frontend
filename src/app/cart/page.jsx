"use client";

import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { BiCartAdd } from "react-icons/bi";
import { motion } from "framer-motion";

export default function CartPage() {
  const { cart, increaseQuantity, decreaseQuantity, removeFromCart } = useCart();
  const router = useRouter();

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  
  const totalItems = cart.length;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col pb-24">
      {/* Header */}
      <div className="md:p-4 p-3 flex items-center justify-between bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center">
          <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100 transition" aria-label="Go back">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">Your Cart</h2>
        </div>
        <Link href={'/cart'}>
          <motion.div whileHover={{ rotate: 15 }} className="relative">
            <BiCartAdd className="text-gray-700" size={22} />
            <span className="absolute -top-1 -right-1 bg-[#FF6B00] animate-bounce animation-duration-0.1 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold text-md">
              {totalItems}
            </span>
          </motion.div>
        </Link>
      </div>

      {/* Cart Items */}
      <div className="flex-1 md:p-4 p-2">
        <div className="max-h-[65vh] pb-5 scroll overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-sm text-center mt-12">
              Your cart is empty
            </p>
          ) : (
            cart.map((item) => (
              <div
                key={item.foodId + item.variantId}
                className="bg-white border border-gray-100 rounded-2xl p-3 flex gap-3 transition"
              >
                {/* Image */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-14 h-14 rounded-xl object-cover bg-gray-100"
                />

                {/* Content */}
                <div className="flex-1 flex flex-col gap-1">
                  {/* Title & Price */}
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-800 leading-tight">
                        {item.variantName}
                      </p>
                      <p className="text-xs text-gray-500">
                        ₦{item.price.toLocaleString()}
                      </p>
                    </div>

                    <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1">
                      <button
                        onClick={() =>
                          decreaseQuantity(item.foodId, item.variantId)
                        }
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200"
                      >
                        <Minus size={14} />
                      </button>

                      <span className="text-sm font-medium text-gray-800">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          increaseQuantity(item.foodId, item.variantId)
                        }
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-800 text-white hover:bg-gray-900"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() =>
                        removeFromCart(item.foodId, item.variantId)
                      }
                      className="ml-auto text-gray-400 hover:text-red-500 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Floating Checkout Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-14 left-0 right-0 bg-white p-3 shadow-xl rounded-t-2xl border-t">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-600 text-sm">Subtotal</span>
            <span className="font-bold text-lg">₦{subtotal}</span>
          </div>

          {/* Checkout Button */}
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
