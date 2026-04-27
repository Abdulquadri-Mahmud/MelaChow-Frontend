"use client";

import { useFoodModalStore } from "@/app/store/foodModalStore";
import FoodDetailsClient from "@/app/(customer)/food-details/[foodId]/FoodDetailsClient";
import { AnimatePresence } from "framer-motion";

export default function GlobalFoodModal() {
  const { isOpen, foodId, initialData, closeFoodModal } = useFoodModalStore();

  return (
    <AnimatePresence>
      {isOpen && foodId && (
        <FoodDetailsClient
          isModal={true}
          onClose={closeFoodModal}
          foodId={foodId}
          initialData={initialData}
        />
      )}
    </AnimatePresence>
  );
}
