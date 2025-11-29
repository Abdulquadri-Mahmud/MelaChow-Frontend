"use client";

import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { Minus, Plus, Trash2 } from "lucide-react";

export default function CartPage() {
  const { cart, increaseQuantity, decreaseQuantity, removeFromCart } = useCart();
  const router = useRouter();

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col pb-24">
      {/* Header */}
      <div className="p-4 bg-white shadow-sm sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-gray-900">Your Cart</h2>
      </div>

      {/* Cart Items */}
      <div className="p-4 space-y-4 flex-1">
        {cart.length === 0 ? (
          <p className="text-gray-500 text-center mt-10">Your cart is empty</p>
        ) : (
          cart.map((item) => (
            <div
              key={item.foodId + item.variantId}
              className="bg-white p-4 rounded-2xl shadow-sm flex gap-4"
            >
              {/* Image */}
              <img
                src={item.image}
                alt={item.name}
                className="w-24 h-24 rounded-xl object-cover shadow-sm"
              />

              <div className="flex-1 flex flex-col">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <p className="text-xs text-gray-500">{item.variantName}</p>

                {/* Price */}
                <p className="font-semibold mt-2 text-gray-800">
                  ₦{item.price}
                </p>

                {/* Quantity Control */}
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() =>
                      decreaseQuantity(item.foodId, item.variantId)
                    }
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                  >
                    <Minus size={16} />
                  </button>

                  <span className="font-medium">{item.quantity}</span>

                  <button
                    onClick={() =>
                      increaseQuantity(item.foodId, item.variantId)
                    }
                    className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center"
                  >
                    <Plus size={16} />
                  </button>

                  {/* Remove Button */}
                  <button
                    onClick={() =>
                      removeFromCart(item.foodId, item.variantId)
                    }
                    className="text-red-500 ml-auto hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Checkout Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-14 left-0 right-0 bg-white p-4 shadow-xl rounded-t-2xl border-t">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-600 text-sm">Subtotal</span>
            <span className="font-bold text-lg">₦{subtotal}</span>
          </div>

          {/* Checkout Button */}
          <button
            onClick={() => router.push("/checkout")}
            className="w-full bg-orange-500 text-white py-4 rounded-xl font-semibold text-base active:scale-95 transition-all"
          >
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  );
}
