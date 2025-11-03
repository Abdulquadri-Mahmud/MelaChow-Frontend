"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Loader2, Store, MapPin, Star, 
  ShoppingBag, Wallet, Truck, Clock, 
  Utensils, Coffee, Sandwich, Pizza
} from "lucide-react";
import { useVendors } from "@/app/hooks/useVendorQueries";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ✅ Shadcn + Recharts components
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { motion } from "framer-motion";

import { getFoods } from "@/app/utils/vendor/api/vendorFoodApi";
import VendorDashboardHeader from "@/app/components/vendors_component/VendorDashboardHeader";

export default function VendorDashboard() {
  const { vendors, isLoading } = useVendors();
  const [foods, setFoods] = useState([]);

  console.log(foods);

  // ✅ Count foods by category
  
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const res = await getFoods();
        setFoods(res?.data || []);
        
        
      } catch (err) {
        toast.error("Failed to fetch foods");
      }
    };
    fetchFoods();
  }, []);

  const foodsByCategory = foods.reduce((acc, food) => {
    const category = food.category || "Uncategorized";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  // ✅ Format for chart
  const categoryData = Object.entries(foodsByCategory).map(([name, count]) => ({
    name,
    count,
  }));

  // console.log(categoryData);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        <Loader2 className="animate-spin mr-2" />
        Loading vendor dashboard...
      </div>
    );
  }

  const vendor = vendors?.data;

  // Dummy chart data (replace with your API stats if available)
  const salesData = [
    { month: "Jan", sales: 12000 },
    { month: "Feb", sales: 8000 },
    { month: "Mar", sales: 15500 },
    { month: "Apr", sales: 9000 },
    { month: "May", sales: 20000 },
    { month: "Jun", sales: 14000 },
  ];

  const ordersData = [
    { name: "Delivered", value: 75 },
    { name: "Processing", value: 15 },
    { name: "Cancelled", value: 10 },
  ];

  const COLORS = ["#FF6600", "#FFB84C", "#FF4D4D"];

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" />

      {/* Header */}
      <VendorDashboardHeader vendor={vendor}/>

      {/* Stats */}
      <div className="bg-white p-3 rounded-xl grid md:grid-cols-4 grid-cols-2 md:gap-4 gap-2 mb-8">
        <Card className="shadow-md bg-orange-50 border-t-4 border-[#FF6600]">
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Total Foods</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <ShoppingBag className="text-[#FF6600]" />
            <p className="text-2xl font-semibold">{vendor?.foods?.length || 0}</p>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-orange-50 border-t-4 border-[#FF6600]">
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Total Orders</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Truck className="text-[#FF6600]" />
            <p className="text-2xl font-semibold">{vendor?.totalOrders || 0}</p>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-orange-50 border-t-4 border-[#FF6600]">
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Wallet Balance</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Wallet className="text-[#FF6600]" />
            <p className="text-2xl font-semibold">₦{vendor?.wallet?.balance?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-orange-50 border-t-4 border-[#FF6600]">
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Rating</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Star className="text-[#FF6600]" />
            <p className="text-2xl font-semibold">{vendor?.rating || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* 🍱 Foods by Category */}
      <div className="mb-10">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#FF6600] text-lg flex items-center gap-2">
              <Utensils className="text-[#FF6600]" /> Foods by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Category Summary Cards */}
            {categoryData.length > 0 ? (
              <motion.div
                className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { staggerChildren: 0.1 },
                  },
                }}
              >
                {categoryData.map((item, index) => {
                  // Category color palette
                  const COLORS = [
                    "#FF6600", "#FFA559", "#FFC107", "#4CAF50", "#03A9F4",
                    "#E91E63", "#9C27B0", "#00BCD4", "#FF4D4D", "#8BC34A"
                  ];
                  const color = COLORS[index % COLORS.length];

                  // Icon per category
                  const getCategoryIcon = (category) => {
                    const icons = {
                      "Drinks": <Coffee className="text-[#FF6600]" />,
                      "Rice Dishes": <Utensils className="text-[#FF6600]" />,
                      "Snacks": <Sandwich className="text-[#FF6600]" />,
                      "Pizza": <Pizza className="text-[#FF6600]" />,
                      "Shawarma": <Sandwich className="text-[#FF6600]" />,
                      "Grills & Barbecue": <Utensils className="text-[#FF6600]" />,
                      "Desserts": <Star className="text-[#FF6600]" />,
                      "Breakfast": <Coffee className="text-[#FF6600]" />,
                      "Swallow": <Utensils className="text-[#FF6600]" />,
                      "Soups & Stews": <Utensils className="text-[#FF6600]" />,
                      "Beans Dishes": <Utensils className="text-[#FF6600]" />,
                      "Yam Dishes": <Utensils className="text-[#FF6600]" />,
                      "Plantain Dishes": <Utensils className="text-[#FF6600]" />,
                      "Pasta": <Utensils className="text-[#FF6600]" />,
                      "Seafood": <Utensils className="text-[#FF6600]" />,
                      "Vegetarian": <Utensils className="text-[#FF6600]" />,
                      "Salads": <Utensils className="text-[#FF6600]" />,
                      "Small Chops": <Utensils className="text-[#FF6600]" />,
                      "Porridge": <Utensils className="text-[#FF6600]" />,
                      "Native Delicacies": <Utensils className="text-[#FF6600]" />,
                      "Others": <Utensils className="text-[#FF6600]" />,
                    };
                    return icons[category] || <Utensils className="text-[#FF6600]" />;
                  };

                  return (
                    <motion.div
                      key={index}
                      className="p-4 bg-orange-50 rounded-xl border border-orange-200 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
                      whileHover={{ scale: 1.03 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(item.name)}
                          <h3 className="font-semibold text-gray-800 text-sm">
                            {item.name}
                          </h3>
                        </div>
                        <Badge
                          className="bg-[#FF6600]/10 text-[#FF6600] text-xs font-medium rounded-md"
                          variant="outline"
                        >
                          {item.count}
                        </Badge>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <p className="text-gray-500 text-center py-10">
                No foods added yet — your categories will appear here.
              </p>
            )}

            {/* Charts Section */}
            {/* Charts Section */}
            {categoryData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid md:grid-cols-2 gap-6 mt-8"
              >
                {/* 📊 Bar Chart */}
                <Card className="shadow-none border cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-[#FF6600] text-md">
                      Category Distribution (Bar)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData}>
                        <XAxis dataKey="name" stroke="#888" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip cursor={{ fill: "#f9f9f9" }} />
                        <Bar
                          dataKey="count"
                          radius={[6, 6, 0, 0]}
                          animationDuration={800}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell
                              key={`bar-${index}`}
                              fill={COLORS[index % COLORS.length]}
                              onClick={() =>
                                setFilteredCategory(filteredCategory === entry.name ? null : entry.name)
                              }
                              style={{ cursor: "pointer" }}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* 🥧 Pie Chart */}
                <Card className="shadow-none border cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-[#FF6600] text-md">
                      Category Distribution (Pie)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label
                          onClick={(data) =>
                            setFilteredCategory(
                              filteredCategory === data.name ? null : data.name
                            )
                          }
                        >
                          {categoryData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                              style={{ cursor: "pointer" }}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 🧭 Analytics Section */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {/* Sales Overview */}
        <Card className="shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="text-[#FF6600] text-lg">Sales Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <XAxis dataKey="month" stroke="#888" />
                <YAxis />
                <Tooltip cursor={{ fill: "#f9f9f9" }} />
                <Bar dataKey="sales" fill="#FF6600" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders Distribution */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#FF6600] text-lg">Orders Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ordersData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  fill="#FF6600"
                  dataKey="value"
                  label
                >
                  {ordersData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 🏪 Store Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#FF6600] text-lg">Store Details</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-2">
            <p><strong>Cuisine Types:</strong> {vendor?.cuisineTypes?.join(", ") || "N/A"}</p>
            <p><strong>Tags:</strong> {vendor?.tags?.join(", ") || "N/A"}</p>
            <p><strong>Delivery Radius:</strong> {vendor?.deliveryRadiusKm} km</p>
            <p><strong>Accepts Delivery:</strong> {vendor?.acceptsDelivery ? "Yes" : "No"}</p>
            <p><strong>Commission Rate:</strong> {(vendor?.commissionRate * 100).toFixed(0)}%</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#FF6600] text-lg">Store Location</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-2">
            <p className="flex items-center gap-2">
              <MapPin className="text-[#FF6600]" /> {vendor?.fullAddress || "No address provided"}
            </p>
            <p><strong>State:</strong> {vendor?.address?.state}</p>
            <p><strong>City:</strong> {vendor?.address?.city}</p>
            <p><strong>Postal Code:</strong> {vendor?.address?.postalCode}</p>
          </CardContent>
        </Card>
      </div>

      {/* 🕓 Opening Hours */}
      <div className="mt-8">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#FF6600] text-lg flex items-center gap-2">
              <Clock className="text-[#FF6600]" /> Opening Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-gray-700">
            {Object.entries(vendor?.openingHours || {}).map(([day, hours]) => (
              <div
                key={day}
                className={`p-3 border rounded-lg ${
                  hours.closed ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
                }`}
              >
                <p className="font-semibold capitalize">{day}</p>
                {hours.closed ? (
                  <p className="text-red-600 text-sm">Closed</p>
                ) : (
                  <p className="text-gray-600 text-sm">
                    {hours.open} - {hours.close}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
