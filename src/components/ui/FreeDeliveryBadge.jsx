import { Gift } from "lucide-react";

export default function FreeDeliveryBadge({ type = "vendor" }) {
  const label =
    type === "vendor"
      ? `Free Delivery on All Orders`
      : "Free Delivery on All Orders";

  return (
    <p
      className="inline-flex items-center gap-1 px-2 py-1 rounded
                 text-xs font-semibold bg-yellow-50 text-zinc-800 border
                 border-zinc-900"
    >
      <Gift className="w-4 h-4 text-yellow-500" />{label}
    </p>
  );
}
