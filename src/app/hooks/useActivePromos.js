import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchActivePromos = async () => {
  const res = await axios.get("/api/promos/active", {
    withCredentials: true,
    timeout: 10000,
    headers: {
      "Cache-Control": "no-cache",
    },
  });
  if (!res.data || !res.data.success) throw new Error("Failed to fetch promos");
  return res.data;
};

/**
 * Returns currently active promos for banner rendering.
 * Cached for 5 minutes — promo state rarely changes mid-session.
 * Returns { platformPromo, vendorPromoCount, hasAnyPromo }.
 */
export const useActivePromos = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["active-promos"],
    queryFn: fetchActivePromos,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: false,
  });

  const payload = data?.data || data || {};
  const platformPromo    = payload.platformPromo    || payload.promo || null;
  const vendorPromoCount = payload.vendorPromoCount || payload.vendorPromosCount || 0;
  const hasAnyPromo = !!platformPromo || vendorPromoCount > 0;

  return { platformPromo, vendorPromoCount, hasAnyPromo, isLoading };
};
