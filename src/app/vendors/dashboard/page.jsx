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

import { getVendorDetails, getVendorPayoutDetails, getVendorWallet } from "@/app/lib/vendorApi";
import { ConfigureBankModal, WithdrawFundsModal } from "../transactions/components/PayoutModals";
import { useVendorStorage } from "@/app/hooks/vendorStorage";
import { useVendorMenu } from "@/app/hooks/useMenu";
import VendorDashboardSkeleton from "@/app/skeleton/VendorDashboardSkeleton";

export default function VendorDashboard() {
  const [vendorData, setVendorData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [payoutDetails, setPayoutDetails] = useState(null);
  const [liveWalletBalance, setLiveWalletBalance] = useState(0);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const { vendorDetails } = useVendorStorage();

  const vendorId = vendorDetails?.vendor?.id || vendorDetails?._id || vendorDetails?.id;
  const { data: menuData, isLoading: isMenuLoading } = useVendorMenu(vendorId);
  
  const rawFoods = menuData?.data || menuData?.items || menuData || [];
  const foods = Array.isArray(rawFoods) ? rawFoods : [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [vendorRes] = await Promise.all([
          getVendorDetails()
        ]);
        setVendorData(vendorRes.data || vendorRes);

        // Non-blocking: fetch payout details and wallet balance in parallel
        Promise.allSettled([
          getVendorPayoutDetails(),
          getVendorWallet(),
        ]).then(([payoutResult, walletResult]) => {
          if (payoutResult.status === "fulfilled" && payoutResult.value?.success) {
            setPayoutDetails(payoutResult.value.payoutDetails);
          }
          if (walletResult.status === "fulfilled" && walletResult.value?.success) {
            setLiveWalletBalance(walletResult.value.data?.balance || 0);
          }
        });

      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);


  // Derived Values & Calculations
  const calculations = useMemo(() => {
    if (!vendorData) return null;

    const orders = vendorData.vendorOrders || [];
    const transactions = vendorData.wallet?.transactions || [];

    const completedStatuses = ['completed', 'delivered'];
    const completedOrders = orders.filter(o => completedStatuses.includes(o.orderStatus));

    // 1. Basic Stats
    const walletBalance = vendorData.wallet?.balance || 0;

    // Use DERIVED totals from successful orders for accuracy
    const realTotalOrders = completedOrders.length;
    const realTotalSales = completedOrders.reduce((acc, order) => acc + (order.vendorTotal || 0), 0);

    const rating = vendorData.rating || 0;
    const ratingCount = vendorData.ratingCount || 0;
    const isVerified = vendorData.verified;

    // 2. Chart Data - Process Last 7 Days of Transactions
    const processChartData = () => {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const today = new Date();
      
      // Initialize 7 days with zero values
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        return {
          date: d.toISOString().split('T')[0],
          name: days[d.getDay()],
          value: 0
        };
      });

      // Use successful orders for "Sales Performance"
      completedOrders.forEach(order => {
        if (order.createdAt) {
          const orderDate = order.createdAt.split('T')[0];
          const dayEntry = last7Days.find(d => d.date === orderDate);
          if (dayEntry) {
            dayEntry.value += (order.vendorTotal || 0);
          }
        }
      });
      return last7Days;
    };

    // 3. Top Items - Aggregate from Orders
    const processTopItems = () => {
      const itemStats = {};
      
      // Aggregate volume and revenue from successful orders
      completedOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            if (!item || !item.foodId) return;
            const foodId = typeof item.foodId === 'object' ? item.foodId._id : item.foodId;
            if (!itemStats[foodId]) {
              itemStats[foodId] = {
                count: 0,
                revenue: 0,
                // Persist the name/image from the order line-item in case it's deleted from menu
                backupName: item.name,
                backupImage: item.image_url
              };
            }
            itemStats[foodId].count += (item.quantity || 1);
            itemStats[foodId].revenue += (item.vendorEarning || 0);
          });
        }
      });

      const sortedEntries = Object.entries(itemStats).sort(([, a], [, b]) => b.count - a.count);
      const maxCount = sortedEntries.length > 0 ? sortedEntries[0][1].count : 1;

      // Slice top 3 and map to display objects
      const top3 = sortedEntries.slice(0, 3).map(([id, stats]) => {
        const food = foods.find(f => f._id === id);
        const relativePercent = Math.round((stats.count / maxCount) * 100);
        
        return {
          name: food?.name || stats.backupName || "Unknown Item",
          sold: stats.count,
          revenue: stats.revenue,
          image: food?.image || stats.backupImage || "/placeholder-food.png",
          percent: `w-[${relativePercent}%]`,
          percentVal: relativePercent
        };
      });

      return top3;
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
            statusConfig = { status: 'Preparing', color: 'text-orange-500', bgColor: 'bg-orange-500/20', barColor: 'bg-orange-500', progress: 50 };
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
          if (!item || !item.foodId) return null;
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
      sentimentColor = "border-orange-500";
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
    <div className="font-sans text-slate-900 dark:text-white min-h-screen bg-slate-50 dark:bg-slate-900">

      <div className="space-y-4">

        {/* TOP METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <MetricCard
            title="Total Sales"
            value={`₦${totalSales.toLocaleString()}`}
            trend="+12.4%" // Keep mock trend for now or calculate if history available
            sub="All time revenue"
          />
          <div className="bg-white dark:bg-slate-800 p-2.5 rounded-md border border-slate-200 dark:border-slate-700 flex flex-col gap-1">
            <div className="flex justify-between items-start">
              <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider">Total Orders</p>
              <span className="text-blue-500 text-[9px] font-black uppercase tracking-widest bg-blue-500/10 px-1.5 py-0.5 rounded">High Volume</span>
            </div>
            <h3 className="text-xl font-black tracking-tight">{totalOrders}</h3>
            <div className="flex gap-1 mt-0.5">
              <div className="h-0.5 flex-1 bg-orange-500 rounded-full"></div>
              <div className="h-0.5 flex-1 bg-orange-500 rounded-full"></div>
              <div className="h-0.5 flex-1 bg-orange-500/20 rounded-full"></div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-2.5 rounded-md border border-slate-200 dark:border-slate-700 flex flex-col gap-1">
            <div className="flex justify-between items-start">
              <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider">Rating</p>
              <span className="text-orange-500 text-[9px] font-black uppercase tracking-widest bg-orange-500/10 px-1.5 py-0.5 rounded">
                {isVerified ? "Verified" : "Unverified"}
              </span>
            </div>
            <h3 className="text-xl font-black tracking-tight">{rating.toFixed(1)}</h3>
            <div className="flex gap-0.5 mt-0.5 text-orange-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={12} fill={s <= Math.round(rating) ? "currentColor" : "none"} className={s <= Math.round(rating) ? "text-orange-500" : "text-slate-300 dark:text-slate-700"} />
              ))}
            </div>
          </div>
        </div>

        {/* REVENUE COMMAND */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 p-3 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-orange-500/10 to-transparent opacity-50 pointer-events-none"></div>
          <div className="z-10 w-full md:w-auto">
            <h2 className="text-lg font-black mb-0.5 text-slate-900 dark:text-white uppercase tracking-tight">Revenue Hub</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md text-[10px] font-bold uppercase tracking-widest">Automatic Payouts • Instant Withdrawals</p>

            {/* Delivery Mode Visibility */}
            <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900/50 rounded-md border border-slate-100 dark:border-slate-700 w-fit">
              <div className={`w-1.5 h-1.5 rounded-full ${vendorData?.deliveryManagedBy === "vendor" ? "bg-orange-500" : "bg-blue-500"}`} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                {vendorData?.deliveryManagedBy === "vendor"
                  ? `Vendor Delivery • ₦${vendorData?.flatRateDeliveryFee || 0} Rate`
                  : "Platform Managed Delivery"}
              </p>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <div>
                <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest mb-0.5">Available Balance</p>
                <p className="text-2xl font-black text-orange-500">₦{walletBalance.toLocaleString()}</p>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-white/10"></div>
              <div>
                <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest mb-0.5">Pending</p>
                <p className="text-2xl font-black text-slate-400">₦0.00</p>
              </div>
            </div>
          </div>
          <div className="z-10 flex flex-col gap-2 min-w-[220px] w-full md:w-auto">
            <button
              onClick={() => {
                if (!payoutDetails?.payoutEnabled) {
                  setShowBankModal(true);
                } else {
                  setShowWithdrawModal(true);
                }
              }}
              className="w-full bg-orange-600 text-white font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-md transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <CreditCard size={14} />
              {payoutDetails?.payoutEnabled ? "Withdraw Funds" : "Link Bank Account"}
            </button>
            <Link href="/vendors/transactions" className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-md hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              History
            </Link>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">

          {/* LEFT: LIVE ORDERS */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[550px]">
            <div className="p-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
              <h3 className="font-black uppercase tracking-tight text-xs text-slate-900 dark:text-white flex items-center gap-2">
                <span className="size-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                Live Order Flow
              </h3>
              <button className="text-[10px] text-orange-500 font-black uppercase tracking-widest hover:underline">View All</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
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
            <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 md:p-4 p-3 flex flex-col h-[320px]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-black text-xs uppercase tracking-tight text-slate-900 dark:text-white">Sales Performance</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Last 7 Days trend</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-white/5 rounded-md p-0.5">
                  <button className="px-3 py-1 text-[10px] font-black uppercase rounded bg-white dark:bg-white/10 text-orange-500">7D</button>
                  <button className="px-3 py-1 text-[10px] font-black uppercase rounded text-slate-500 dark:text-slate-400">1M</button>
                  <button className="px-3 py-1 text-[10px] font-black uppercase rounded text-slate-500 dark:text-slate-400">3M</button>
                </div>
              </div>
              <div className="flex-1 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      formatter={(value) => [`₦${value.toLocaleString()}`, 'Revenue']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)', background: '#1E293B', color: 'white' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#f97316"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#chartGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* LOWER GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

              {/* TOP ITEMS */}
              <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 p-3">
                <h3 className="font-black uppercase tracking-tight text-[10px] text-slate-500 mb-3">Top Performance</h3>
                <div className="space-y-2.5">
                  {topItems.length > 0 ? topItems.map((item, i) => (
                    <TopItem
                      key={i}
                      name={item.name}
                      sold={item.sold}
                      percent={item.percent}
                      image={item.image}
                    />
                  )) : (
                    <p className="text-xs text-slate-400">No sales data yet.</p>
                  )}
                </div>
              </div>

              {/* SENTIMENT */}
              <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 p-3 flex flex-col">
                <h3 className="font-black uppercase tracking-tight text-[10px] text-slate-500 mb-3">Sentiment</h3>
                <div className="flex-1 flex flex-col justify-center items-center text-center">
                  <div className={`size-14 rounded-full border-2 ${sentimentColor} flex items-center justify-center mb-2`}>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{sentimentPercentage}%</span>
                  </div>
                  <p className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-tight">{sentimentLabel}</p>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-[150px]">
                    {ratingCount > 0
                      ? `Based on ${ratingCount} review${ratingCount !== 1 ? 's' : ''}.`
                      : "No reviews yet."
                    }
                  </p>
                  <Link href={'/vendors/reviews'} className="mt-4 text-[10px] font-black uppercase tracking-widest text-orange-500 hover:bg-orange-500/10 px-4 py-2 rounded-md transition-all border border-orange-500/20">
                    View Feedback
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      <ConfigureBankModal
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
        onSaved={() => {
          setShowBankModal(false);
          getVendorPayoutDetails()
            .then(res => { if (res?.success) setPayoutDetails(res.payoutDetails); })
            .catch(() => {});
        }}
        existingDetails={payoutDetails}
      />

      <WithdrawFundsModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        balance={liveWalletBalance}
        onInitiated={() => {
          setShowWithdrawModal(false);
          getVendorWallet()
            .then(res => { if (res?.success) setLiveWalletBalance(res.data?.balance || 0); })
            .catch(() => {});
        }}
        payoutDetails={payoutDetails}
      />

    </div>
  );
}

// --- SUB COMPONENTS ---

const MetricCard = ({ title, value, trend, sub }) => (
  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-md border border-slate-200 dark:border-white/5 flex flex-col gap-1 transition-all">
    <div className="flex justify-between items-start">
      <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-widest leading-none">{title}</p>
      <span className="text-orange-500 text-[9px] font-black bg-orange-500/10 px-1.5 py-0.5 rounded leading-none">{trend}</span>
    </div>
    <h3 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">{value}</h3>
    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter leading-none opacity-60">{sub}</p>
  </div>
);

const OrderCard = ({ id, name, items, status, progress, color, bgColor, barColor, note, opacity = "" }) => (
  <div className={`p-2.5 rounded-md bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 transition-all hover:border-orange-500/20 ${opacity}`}>
    <div className="flex justify-between items-start mb-2">
      <div>
        <p className="font-black text-xs text-slate-900 dark:text-white leading-none">#{id}</p>
        <p className="text-[11px] font-medium text-slate-500 mt-1">{name} • {items}</p>
      </div>
      <span className={`text-[9px] font-black ${bgColor} ${color} px-1.5 py-0.5 rounded uppercase tracking-tighter`}>{status}</span>
    </div>
    <div className="space-y-1.5">
      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none">
        <span>Status</span>
        <span>{progress}%</span>
      </div>
      <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${progress}%` }}></div>
      </div>
      <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight">{note}</p>
    </div>
  </div>
);

const TopItem = ({ name, sold, percent, image }) => (
  <div className="flex items-center gap-3 group">
    <div className="size-8 rounded-md bg-slate-200 dark:bg-slate-700 bg-cover bg-center" style={{ backgroundImage: `url('${image}')` }}></div>
    <div className="flex-1">
      <div className="flex justify-between mb-1 items-end">
        <span className="text-[11px] font-black tracking-tight text-slate-800 dark:text-slate-200 uppercase leading-none">{name}</span>
        <span className="text-[10px] font-medium text-slate-500 leading-none">{sold} sold</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-orange-500 transition-all duration-1000" 
          style={{ width: `${percent.replace('w-[', '').replace('%]', '')}%` }}
        ></div>
      </div>
    </div>
  </div>
);
