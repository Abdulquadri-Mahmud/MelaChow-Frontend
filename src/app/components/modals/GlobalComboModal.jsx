"use client";

import { useComboModalStore } from "@/app/store/comboModalStore";
import ComboDetailsClient from "@/app/(customer)/combo-details/[comboId]/ComboDetailsClient";
import { AnimatePresence } from "framer-motion";

export default function GlobalComboModal() {
  const { isOpen, comboId, initialData, closeComboModal } = useComboModalStore();

  return (
    <AnimatePresence>
      {isOpen && comboId && (
        <ComboDetailsClient
          isModal={true}
          onClose={closeComboModal}
          comboId={comboId}
          initialData={initialData}
        />
      )}
    </AnimatePresence>
  );
}
