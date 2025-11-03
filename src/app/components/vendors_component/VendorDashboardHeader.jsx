"use client";

import { Store, Star, ShoppingBag, DollarSign, Clock, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function VendorDashboardHeader({ vendor }) {

  return (
    <div className="space-y-6 mb-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <img
            src={vendor?.logo || "/placeholder-logo.png"}
            alt="Vendor Logo"
            className="w-14 h-14 rounded-full object-cover border border-gray-200"
          />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Store className="text-[#FF6600]" /> {vendor?.storeName}
            </h1>

            <div className="flex items-center gap-1 py-2 text-yellow-500">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < Math.round(vendor?.rating ?? 0) ? "currentColor" : "none"}
                    />
                ))}
                <span className="text-sm text-gray-600 ml-1">
                    {vendor?.rating?.toFixed(1) ?? "0.0"}
                </span>
            </div>

            <p className="text-gray-600 mt-1">{vendor?.storeDescription}</p>
            <p className="text-gray-400 text-sm mt-1">
              Joined: {new Date(vendor?.createdAt).toLocaleDateString()} •{" "}
              Location: {vendor?.address?.city}, {vendor?.address?.state}
              <span> • Sales: {vendor?.totalSales ?? 0} </span>
            </p>

            <div className="flex gap-2 mt-3">
              <button className="px-4 py-1.5 bg-[#FF6600] text-white rounded hover:bg-[#e55a00] transition text-sm">
                Edit Store
              </button>
              <button className="px-4 py-1.5 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition text-sm">
                View Orders
              </button>
            </div>
          </div>
        </div>

        <Badge
          variant="outline"
          className={`mt-4 md:mt-0 px-3 py-1 border ${
            vendor?.active ? "border-green-500 text-green-600" : "border-red-500 text-red-600"
          }`}
        >
          {vendor?.active ? "Active" : "Inactive"}
        </Badge>
      </div>
    </div>
  );
}
