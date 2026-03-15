"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useCreateComboStore = create(
    persist(
        (set, get) => ({
            // ─── Step 1 ────────────────────────────────────────────────────────
            name: "",
            description: "",
            image_url: null,
            price_naira: "",
            is_available: true,

            // ─── Step 2 ────────────────────────────────────────────────────────
            components: [],

            // ─── Step 3 ────────────────────────────────────────────────────────
            swap_groups: [],

            // ─── Meta ──────────────────────────────────────────────────────────
            currentStep: 1,
            isSubmitting: false,
            createdVariantId: null,

            // ─── Actions ───────────────────────────────────────────────────────
            setField: (key, value) => set((state) => ({ ...state, [key]: value })),

            addComponent: (item) => {
                const existing = get().components.find((c) => c.menu_item_id === item.menu_item_id);
                if (existing) {
                    set((state) => ({
                        components: state.components.map((c) =>
                            c.menu_item_id === item.menu_item_id
                                ? { ...c, quantity: Math.min(10, c.quantity + 1) }
                                : c
                        ),
                    }));
                } else {
                    set((state) => ({
                        components: [
                            ...state.components,
                            {
                                tempId: Date.now().toString(),
                                menu_item_id: item.menu_item_id,
                                menu_item_name: item.menu_item_name,
                                menu_item_image: item.menu_item_image,
                                menu_item_section: item.menu_item_section || null,
                                unit_price_naira: item.unit_price_naira,
                                quantity: 1,
                                choice_group_count: item.choice_group_count || 0,
                            }
                        ],
                    }));
                }
            },

            updateComponent: (tempId, updates) =>
                set((state) => ({
                    components: state.components.map((c) =>
                        c.tempId === tempId ? { ...c, ...updates } : c
                    ),
                })),

            removeComponent: (tempId) =>
                set((state) => ({
                    components: state.components.filter((c) => c.tempId !== tempId),
                    // Also remove any swap groups tied to this component
                    swap_groups: state.swap_groups.filter((sg) => sg.component_tempId !== tempId),
                })),

            addSwapGroup: (group) =>
                set((state) => ({
                    swap_groups: [...state.swap_groups, group],
                })),

            updateSwapGroup: (tempId, updates) =>
                set((state) => ({
                    swap_groups: state.swap_groups.map((sg) =>
                        sg.tempId === tempId ? { ...sg, ...updates } : sg
                    ),
                })),

            removeSwapGroup: (tempId) =>
                set((state) => ({
                    swap_groups: state.swap_groups.filter((sg) => sg.tempId !== tempId),
                })),

            addSwapOption: (groupTempId, option) =>
                set((state) => ({
                    swap_groups: state.swap_groups.map((sg) =>
                        sg.tempId === groupTempId
                            ? { ...sg, options: [...sg.options, { ...option, tempId: Date.now().toString() }] }
                            : sg
                    ),
                })),

            removeSwapOption: (groupTempId, optionTempId) =>
                set((state) => ({
                    swap_groups: state.swap_groups.map((sg) =>
                        sg.tempId === groupTempId
                            ? { ...sg, options: sg.options.filter((o) => o.tempId !== optionTempId) }
                            : sg
                    ),
                })),

            setStep: (n) => set({ currentStep: n }),

            reset: () =>
                set({
                    name: "",
                    description: "",
                    image_url: null,
                    price_naira: "",
                    is_available: true,
                    components: [],
                    swap_groups: [],
                    currentStep: 1,
                    isSubmitting: false,
                    createdVariantId: null,
                }),
        }),
        {
            name: "gd_create_combo_wizard",
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);
