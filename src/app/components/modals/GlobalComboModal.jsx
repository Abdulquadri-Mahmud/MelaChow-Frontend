"use client";

import { useComboModalStore } from "@/app/store/comboModalStore";
import ComboDetailsClient from "@/app/(customer)/combo-details/[comboId]/ComboDetailsClient";
import { AnimatePresence } from "framer-motion";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const subscribe = () => () => {};

export default function GlobalComboModal() {
  const { isOpen, comboId, initialData, closeComboModal } = useComboModalStore();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && comboId && (
        <ComboDetailsClient
          key={comboId}
          isModal={true}
          onClose={closeComboModal}
          comboId={comboId}
          initialData={initialData}
        />
      )}
    </AnimatePresence>,
    document.body
  );
}
