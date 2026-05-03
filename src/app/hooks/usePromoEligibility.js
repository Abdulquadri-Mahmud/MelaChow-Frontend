"use client";
import { useQuery } from "@tanstack/react-query";
import { useActivePromos } from "./useActivePromos";

const fetchUserOrders = async () => {
  try {
    const res = await fetch("/api/orders/my-orders", { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch orders");
    return res.json();
  } catch (error) {
    console.error("Promo eligibility check: failed to fetch orders", error);
    return { orders: [] };
  }
};

/**
 * Returns whether the current user qualifies for the platform
 * first-order free delivery promo.
 *
 * eligible:    true only when promo is active AND user has no prior paid orders.
 * isLoading:   true while either query is in flight.
 * platformPromo: the promo data (slots remaining, endsAt) or null.
 */
export const usePromoEligibility = () => {
  const { platformPromo, isLoading: promoLoading } = useActivePromos();

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["user-orders-promo-check"],
    queryFn: fetchUserOrders,
    // Only fetch if promo is active — no point checking orders if no promo
    enabled: !!platformPromo,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: false,
  });

  const hasPriorPaidOrPromoOrder = (ordersData?.orders || []).some(
    (o) =>
      o.paymentStatus === "paid" ||
      (
        o.freeDeliveryPromo?.eligible &&
        !["failed", "refunded"].includes(o.paymentStatus) &&
        o.orderStatus !== "cancelled"
      )
  );

  const eligible =
    !!platformPromo &&
    !hasPriorPaidOrPromoOrder &&
    (platformPromo.slotsRemaining || 0) > 0;

  return {
    eligible,
    platformPromo,
    isLoading: promoLoading || (!!platformPromo && ordersLoading),
  };
};
