"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  CreditCard,
  TrendingUp,
  Star,
  MoreHorizontal,
  ArrowUpRight,
  Package,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { motion } from "framer-motion";

import { getFoods } from "@/app/lib/vendorFoodApi";
import { getVendorDetails } from "@/app/lib/vendorApi";
import { useVendorStorage } from "@/app/hooks/vendorStorage";
import VendorDashboardSkeleton from "@/app/skeleton/VendorDashboardSkeleton";

export default function VendorDashboard() {
  const [vendorData, setVendorData] = useState(null);
  const [foods, setFoods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { vendorDetails } = useVendorStorage();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // if (!vendorDetails?.vendor?.id) return; // Removed ID check strictness if cookie is enough? 
        // But layout might need vendorDetails for other things. 
        // For data fetching, cookie is source.

        setIsLoading(true);
        const [vendorRes, foodsRes] = await Promise.all([
          getVendorDetails(),
          getFoods()
        ]);
        setVendorData(vendorRes.data || vendorRes);
        setFoods(foodsRes?.data || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); // Run once on mount 
  // If we rely on cookie, we don't strictly *need* `vendorDetails` in dependency if the cookie is set. 
  // But typically `useVendorStorage` implies session state.
  // I will leave it empty dependency or minimal. 
  // Wait, `vendorDetails` might be null initially. 
  // `useVendorStorage` usually hydrates from localStorage.
  // If we are logged in, we have cookie.
  // I will just call fetchData.


  // Derived Values & Calculations
  const calculations = useMemo(() => {
    if (!vendorData) return null;

    const orders = vendorData.vendorOrders || [];
    const transactions = vendorData.wallet?.transactions || [];

    // 1. Basic Stats
    const walletBalance = vendorData.wallet?.balance || 0;

    // Use derived totals if backend summaries are 0 (often the case with fresh/demo data)
    const storedTotalOrders = vendorData.totalOrders || 0;
    const realTotalOrders = storedTotalOrders === 0 && orders.length > 0 ? orders.length : storedTotalOrders;

    const storedTotalSales = vendorData.totalSales || 0;
    const computedTotalSales = orders.reduce((acc, order) => acc + (order.vendorTotal || 0), 0);
    const realTotalSales = storedTotalSales === 0 && computedTotalSales > 0 ? computedTotalSales : storedTotalSales;

    const rating = vendorData.rating || 0;
    const ratingCount = vendorData.ratingCount || 0;
    const isVerified = vendorData.verified;

    // 2. Chart Data - Process Last 7 Days of Transactions
    const processChartData = () => {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const today = new Date();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        return {
          date: d.toISOString().split('T')[0],
          name: days[d.getDay()],
          value: 0
        };
      });

      transactions.forEach(txn => {
        if (txn.type === 'credit' && txn.date) {
          const txnDate = txn.date.split('T')[0];
          const dayEntry = last7Days.find(d => d.date === txnDate);
          if (dayEntry) {
            dayEntry.value += txn.amount;
          }
        }
      });
      return last7Days;
    };

    // 3. Top Items - Aggregate from Orders
    const processTopItems = () => {
      const itemCounts = {};
      orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const foodId = typeof item.foodId === 'object' ? item.foodId._id : item.foodId;
            if (!itemCounts[foodId]) itemCounts[foodId] = 0;
            itemCounts[foodId] += (item.quantity || 1);
          });
        }
      });

      // Map back to food details
      const sortedItems = Object.entries(itemCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([id, count]) => {
          const food = foods.find(f => f._id === id);
          return {
            name: food?.name || "Unknown Item",
            sold: count,
            image: food?.image || "/placeholder-food.png",
            percent: "w-[70%]" // Dynamic width could be calculated relative to max
          };
        });

      return sortedItems.length > 0 ? sortedItems : [];
    };

    // 4. Live Orders Mapping
    const lastOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5) // Recent 5
      .map(order => {
        // Determine status color
        let statusConfig = { status: order.orderStatus, color: "text-slate-500", bgColor: "bg-slate-100", barColor: "bg-slate-300", progress: 0 };

        switch (order.orderStatus) {
          case 'pending':
            statusConfig = { status: 'Pending', color: 'text-amber-500', bgColor: 'bg-amber-400/20', barColor: 'bg-amber-500', progress: 10 };
            break;
          case 'preparing': // Assuming this status exists
          case 'accepted':
            statusConfig = { status: 'Preparing', color: 'text-[#FF6B00]', bgColor: 'bg-[#FF6B00]/20', barColor: 'bg-[#FF6B00]', progress: 50 };
            break;
          case 'ready':
          case 'ready_for_pickup':
            statusConfig = { status: 'Ready', color: 'text-blue-500', bgColor: 'bg-blue-400/20', barColor: 'bg-blue-500', progress: 80 };
            break;
          case 'completed':
          case 'delivered':
            statusConfig = { status: 'Completed', color: 'text-green-500', bgColor: 'bg-green-400/20', barColor: 'bg-green-500', progress: 100 };
            break;
          case 'cancelled':
            statusConfig = { status: 'Cancelled', color: 'text-red-500', bgColor: 'bg-red-400/20', barColor: 'bg-red-500', progress: 0 };
            break;
          default:
          // Keep default
        }

        const userName = order.userOrderId?.userId
          ? `${order.userOrderId.userId.firstname} ${order.userOrderId.userId.lastname}`
          : "Guest Customer";

        // Resolve item names
        const itemNames = order.items?.map(item => {
          const fId = typeof item.foodId === 'object' ? item.foodId._id : item.foodId;
          const food = foods.find(f => f._id === fId);
          return food?.name;
        }).filter(Boolean);

        const itemsSummary = itemNames?.length > 0
          ? `${itemNames[0]}${itemNames.length > 1 ? ` +${itemNames.length - 1}` : ''}`
          : `${order.items?.length || 0} items`;

        const actualOrderId = order._id?.$oid || order._id || "";
        const orderId = order.userOrderId?.orderId || actualOrderId.toString().slice(-6).toUpperCase();
        const note = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return {
          id: orderId,
          name: userName,
          items: itemsSummary,
          ...statusConfig,
          note: `Updated ${note}`
        };
      });

    // 5. Customer Sentiment Calculation
    const sentimentPercentage = rating > 0 ? Math.round((rating / 5) * 100) : 0;
    let sentimentLabel = "No Reviews Yet";
    let sentimentColor = "border-slate-300";

    if (sentimentPercentage >= 90) {
      sentimentLabel = "Highly Positive";
      sentimentColor = "border-[#FF6B00]";
    } else if (sentimentPercentage >= 75) {
      sentimentLabel = "Positive";
      sentimentColor = "border-green-500";
    } else if (sentimentPercentage >= 60) {
      sentimentLabel = "Mostly Positive";
      sentimentColor = "border-blue-500";
    } else if (sentimentPercentage >= 40) {
      sentimentLabel = "Mixed";
      sentimentColor = "border-yellow-500";
    } else if (sentimentPercentage > 0) {
      sentimentLabel = "Needs Improvement";
      sentimentColor = "border-red-500";
    }

    return {
      walletBalance,
      totalSales: realTotalSales,
      totalOrders: realTotalOrders,
      rating,
      ratingCount,
      isVerified,
      chartData: processChartData(),
      topItems: processTopItems(),
      recentOrders: lastOrders,
      sentimentPercentage,
      sentimentLabel,
      sentimentColor,
    };

  }, [vendorData, foods]);

  if (isLoading) return <VendorDashboardSkeleton />;

  // Default values to prevent crash if calculations return null (shouldn't happen if !isLoading)
  const {
    walletBalance,
    totalSales,
    totalOrders,
    rating,
    ratingCount,
    isVerified,
    chartData,
    topItems,
    recentOrders,
    sentimentPercentage,
    sentimentLabel,
    sentimentColor,
  } = calculations || {
    walletBalance: 0, totalSales: 0, totalOrders: 0, rating: 0, ratingCount: 0,
    isVerified: false, chartData: [], topItems: [], recentOrders: [],
    sentimentPercentage: 0, sentimentLabel: "No Reviews Yet", sentimentColor: "border-slate-300"
  };

  return (
    <div className="font-sans text-slate-900 dark:text-white min-h-screen bg-slate-50 dark:bg-[#0F172A]">

      <div className="space-y-4">

        {/* TOP METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Total Sales"
            value={`₦${totalSales.toLocaleString()}`}
            trend="+12.4%" // Keep mock trend for now or calculate if history available
            sub="All time revenue"
          />
          <div className="bg-white dark:bg-[#1E293B] p-3 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Orders</p>
              <span className="text-blue-500 text-xs font-bold bg-blue-500/10 px-2 py-1 rounded-lg">High Volume</span>
            </div>
            <h3 className="text-3xl font-bold tracking-tight">{totalOrders}</h3>
            <div className="flex gap-1 mt-2">
              <div className="h-1 flex-1 bg-[#FF6B00] rounded-full"></div>
              <div className="h-1 flex-1 bg-[#FF6B00] rounded-full"></div>
              <div className="h-1 flex-1 bg-[#FF6B00]/20 rounded-full"></div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1E293B] p-3 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Customer Rating</p>
              <span className="text-[#FF6B00] text-xs font-bold bg-[#FF6B00]/10 px-2 py-1 rounded-lg">
                {isVerified ? "Verified Vendor" : "Unverified"}
              </span>
            </div>
            <h3 className="text-3xl font-bold tracking-tight">{rating.toFixed(1)}</h3>
            <div className="flex gap-0.5 mt-2 text-[#FF6B00]">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={16} fill={s <= Math.round(rating) ? "currentColor" : "none"} className={s <= Math.round(rating) ? "text-[#FF6B00]" : "text-slate-300 dark:text-slate-700"} />
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1">{ratingCount} reviews</p>
          </div>
        </div>

        {/* REVENUE COMMAND */}
        <div className="relative overflow-hidden bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-white/5 p-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#FF6B00]/10 to-transparent opacity-50 pointer-events-none"></div>
          <div className="z-10 w-full md:w-auto">
            <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Revenue Command</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm">Your payout for the last 24 hours is ready. Withdraw funds to your primary bank account instantly.</p>
            <div className="flex items-center gap-4 mt-6">
              <div>
                <p className="text-xs uppercase text-slate-500 font-bold tracking-widest mb-1">Available Balance</p>
                <p className="text-3xl font-bold text-[#FF6B00]">₦{walletBalance.toLocaleString()}</p>
              </div>
              <div className="h-10 w-px bg-slate-200 dark:bg-white/10"></div>
              <div>
                <p className="text-xs uppercase text-slate-500 font-bold tracking-widest mb-1">Pending Clearance</p>
                <p className="text-3xl font-bold text-slate-400">₦0.00</p>
              </div>
            </div>
          </div>
          <div className="z-10 flex flex-col gap-3 min-w-[240px] w-full md:w-auto">
            <button className="w-full bg-[#FF6B00] text-white font-bold py-3 px-6 rounded-xl hover:shadow-[0_0_20px_rgba(255,107,0,0.3)] transition-all flex items-center justify-center gap-2">
              <CreditCard size={20} />
              Withdraw Funds
            </button>
            <Link href="/vendors/transactions" className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-medium py-3 px-6 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              View Transaction History
            </Link>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT: LIVE ORDERS */}
          <div className="lg:col-span-4 bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden flex flex-col h-[600px]">
            <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <span className="size-2 bg-[#FF6B00] rounded-full animate-pulse"></span>
                Live Order Flow
              </h3>
              <button className="text-xs text-[#FF6B00] font-bold hover:underline">View All</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {recentOrders.length > 0 ? (
                recentOrders.map((order, idx) => (
                  <OrderCard
                    key={idx}
                    id={order.id}
                    name={order.name}
                    items={order.items}
                    status={order.status}
                    progress={order.progress}
                    color={order.color}
                    bgColor={order.bgColor}
                    barColor={order.barColor}
                    note={order.note}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Package size={40} className="mb-2 opacity-50" />
                  <p className="text-sm">No recent orders</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: CHART & LISTS */}
          <div className="lg:col-span-8 flex flex-col gap-8">

            {/* CHART */}
            <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-white/5 md:p-6 p-3 flex flex-col h-[340px]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Sales Performance</h3>
                  <p className="text-xs text-slate-400">Weekly sales trend (Last 7 Days)</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-white/5 rounded-lg p-1">
                  <button className="px-3 py-1 text-xs font-bold rounded-md bg-white dark:bg-white/10 text-[#FF6B00]">7D</button>
                  <button className="px-3 py-1 text-xs font-bold rounded-md text-slate-500 dark:text-slate-400">1M</button>
                  <button className="px-3 py-1 text-xs font-bold rounded-md text-slate-500 dark:text-slate-400">3M</button>
                </div>
              </div>
              <div className="flex-1 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      formatter={(value) => [`₦${value.toLocaleString()}`, 'Revenue']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)', background: '#1E293B', color: 'white' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#FF6B00"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#chartGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* LOWER GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* TOP ITEMS */}
              <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-white/5 md:p-6 p-3">
                <h3 className="font-bold text-sm mb-4 text-slate-900 dark:text-white">Top Selling Items</h3>
                <div className="space-y-4">
                  {topItems.length > 0 ? topItems.map((item, i) => (
                    <TopItem
                      key={i}
                      name={item.name}
                      sold={item.sold}
                      percent={item.percent}
                      image={item.image}
                    />
                  )) : (
                    <p className="text-sm text-slate-400">No sales data yet.</p>
                  )}
                </div>
              </div>

              {/* SENTIMENT */}
              <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-white/5 md:p-6 p-3 flex flex-col">
                <h3 className="font-bold text-sm mb-4 text-slate-900 dark:text-white">Customer Sentiment</h3>
                <div className="flex-1 flex flex-col justify-center items-center text-center">
                  <div className={`size-20 rounded-full border-4 ${sentimentColor} flex items-center justify-center mb-3`}>
                    <span className="text-xl font-bold text-slate-900 dark:text-white">{sentimentPercentage}%</span>
                  </div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{sentimentLabel}</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[150px]">
                    {ratingCount > 0
                      ? `Based on ${ratingCount} review${ratingCount !== 1 ? 's' : ''}.`
                      : "No reviews yet."
                    }
                  </p>
                  <Link href={'/vendors/reviews'} className="mt-4 text-xs font-bold text-[#FF6B00] hover:bg-[#FF6B00]/10 px-4 py-2 rounded-lg transition-all border border-[#FF6B00]/20">
                    View Feedback
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

const MetricCard = ({ title, value, trend, sub }) => (
  <div className="bg-white dark:bg-[#1E293B] p-3 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col gap-2">
    <div className="flex justify-between items-start">
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
      <span className="text-[#FF6B00] text-xs font-bold bg-[#FF6B00]/10 px-2 py-1 rounded-lg">{trend}</span>
    </div>
    <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</h3>
    <p className="text-xs text-slate-500 mt-2 italic">{sub}</p>
  </div>
);

const OrderCard = ({ id, name, items, status, progress, color, bgColor, barColor, note, opacity = "" }) => (
  <div className={`p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 ${opacity}`}>
    <div className="flex justify-between items-start mb-3">
      <div>
        <p className="font-bold text-sm text-slate-900 dark:text-white">#{id}</p>
        <p className="text-xs text-slate-400">{name} • {items}</p>
      </div>
      <span className={`text-[10px] font-bold ${bgColor} ${color} px-2 py-0.5 rounded uppercase`}>{status}</span>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-medium text-slate-400">
        <span>Status</span>
        <span>{progress}%</span>
      </div>
      <div className="h-1 bg-[#FF6B00]/10 rounded-full overflow-hidden">
        <div className={`h-full ${barColor}`} style={{ width: `${progress}%` }}></div>
      </div>
      <p className="text-[10px] text-slate-500 mt-1">{note}</p>
    </div>
  </div>
);

const TopItem = ({ name, sold, percent, image }) => (
  <div className="flex items-center gap-4">
    <div className="size-10 rounded-lg bg-slate-200 dark:bg-slate-700 bg-cover bg-center" style={{ backgroundImage: `url('${image}')` }}></div>
    <div className="flex-1">
      <div className="flex justify-between mb-1">
        <span className="text-xs font-bold text-slate-900 dark:text-white">{name}</span>
        <span className="text-xs text-slate-400">{sold} sold</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full bg-[#FF6B00] ${percent}`}></div>
      </div>
    </div>
  </div>
);
