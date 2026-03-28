"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getVendorOrders } from "@/app/lib/vendorApi";
import VendorOrderCard from "@/app/components/order/VendorOrderCard";
import { ChevronLeft, ChevronRight, Package, Search, Filter, TrendingUp, Clock, CheckCircle2, Hash } from "lucide-react";
import { useVendorStorage } from "@/app/hooks/vendorStorage";
import RiderAssignmentModal from "../riders/RiderAssignmentModal";

export default function VendorOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { vendorDetails } = useVendorStorage();

  const [assignmentModal, setAssignmentModal] = useState({ isOpen: false, orderId: null });

  const itemsPerPage = 6;

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await getVendorOrders();
      const data = res.vendorOrders || res.data || res || [];
      const orderData = Array.isArray(data) ? data : [];
      setOrders(orderData);
      setFilteredOrders(orderData);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Combined Search & Status Filter
  useEffect(() => {
    let result = orders;

    // 1. Filter by Status
    if (statusFilter !== "all") {
      result = result.filter(order => {
        if (statusFilter === 'ready_for_pickup') {
          return order.orderStatus === 'ready_for_pickup' || order.orderStatus === 'ready';
        }
        return order.orderStatus === statusFilter;
      });
    }

    // 2. Filter by Search Query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(order => {
        const orderId = (order._id?.$oid || order._id || "").toString().toLowerCase();
        const userOrderId = (order.userOrderId?.orderId || "").toLowerCase();
        const customerName = (order.userOrderId?.userId?.firstname + " " + order.userOrderId?.userId?.lastname).toLowerCase();
        return orderId.includes(lowerQuery) || userOrderId.includes(lowerQuery) || customerName.includes(lowerQuery);
      });
    }

    setFilteredOrders(result);
    setCurrentPage(1);
  }, [searchQuery, statusFilter, orders]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const tabs = [
    { id: "all", label: "All Logs", icon: Package },
    { id: "pending", label: "Pending", icon: Clock },
    { id: "accepted", label: "Accepted", icon: CheckCircle2 },
    { id: "preparing", label: "Preparing", icon: TrendingUp },
    { id: "ready_for_pickup", label: "Ready", icon: CheckCircle2 },
    { id: "out_for_delivery", label: "In Transit", icon: TrendingUp },
    { id: "delivered", label: "Delivered", icon: CheckCircle2 },
    { id: "completed", label: "Completed", icon: CheckCircle2 },
  ];

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.orderStatus === 'pending').length,
    active: orders.filter(o => ['accepted', 'preparing', 'ready_for_pickup', 'ready', 'out_for_delivery'].includes(o.orderStatus)).length,
    completed: orders.filter(o => ['delivered', 'completed'].includes(o.orderStatus)).length,
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-orange-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Transaction Logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <div className="max-w-7xl mx-auto space-y-4 px-4 sm:px-6 lg:px-8 py-8">

        {/* Header Section */}
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-md p-6 border border-slate-100 dark:border-slate-800 shadow-none"
        >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <button 
                            onClick={() => router.back()}
                            className="p-2 bg-slate-50 dark:bg-slate-800 rounded-md text-slate-400 hover:text-slate-900 transition-all border border-slate-100 dark:border-slate-700 active:scale-95"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">Order Logs</h1>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operational History & Transaction Manifest</p>
                </div>
                
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="SEARCH HASH / CUSTOMER NAME..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-md text-[10px] font-black uppercase tracking-widest outline-none focus:border-orange-600 transition-all text-slate-900 dark:text-white"
                    />
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                {[
                    { label: "Total Logs", value: stats.total, icon: Package, color: "text-blue-600", bg: "bg-blue-600/10" },
                    { label: "Pnd. Verify", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-600/10" },
                    { label: "Active Prep", value: stats.active, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-600/10" },
                    { label: "Dispatched", value: stats.completed, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-600/10" },
                ].map((s, idx) => (
                    <div key={idx} className="flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{s.label}</span>
                            <div className={`p-1.5 ${s.bg} ${s.color} rounded-md border border-current/10`}>
                                <s.icon size={12} strokeWidth={3} />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{s.value}</p>
                    </div>
                ))}
            </div>
        </motion.div>

        {/* Classification Filter Tabs */}
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-md p-3 border border-slate-100 dark:border-slate-800 shadow-none"
        >
            <div className="flex items-center gap-2 mb-3 px-2">
                <Filter size={12} className="text-slate-400" />
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none">Operational Classification</p>
            </div>
            <div className="flex overflow-x-auto pb-1 gap-2 no-scrollbar scroll-smooth">
                {tabs.map((tab) => {
                    const count = tab.id === 'all' 
                        ? orders.length 
                        : orders.filter(o => tab.id === 'ready_for_pickup' ? (o.orderStatus === 'ready' || o.orderStatus === 'ready_for_pickup') : o.orderStatus === tab.id).length;
                    
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`flex-shrink-0 px-4 py-2 rounded-md transition-all active:scale-95 flex items-center gap-3 border ${statusFilter === tab.id
                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-none"
                                : "bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            }`}
                        >
                            <tab.icon size={12} strokeWidth={3} />
                            <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{tab.label}</span>
                            <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black ${statusFilter === tab.id ? "bg-orange-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>
        </motion.div>

        {/* Results Manifest */}
        <AnimatePresence mode="wait">
            {currentOrders.length > 0 ? (
                <motion.div
                    key="orders-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {currentOrders.map((order, index) => (
                            <motion.div
                                key={order._id?.$oid || order._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <VendorOrderCard 
                                    order={order}
                                    onAssign={(orderId) => setAssignmentModal({ isOpen: true, orderId })}
                                />
                            </motion.div>
                        ))}
                    </div>

                    {/* Industrial Pagination */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-100 dark:border-slate-800 shadow-none">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 sm:mb-0">
                                Manifest Position: {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length} records
                            </p>
                            
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-md border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-orange-600 disabled:opacity-30 transition-all active:scale-95 bg-white dark:bg-slate-950"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                
                                <div className="flex gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                        const isCurrent = currentPage === page;
                                        if (totalPages > 5 && (page < currentPage - 1 || page > currentPage + 1) && page !== 1 && page !== totalPages) {
                                            if (page === currentPage - 2 || page === currentPage + 2) return <span key={page} className="px-1 text-slate-300">...</span>;
                                            return null;
                                        }
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`w-8 h-8 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${isCurrent 
                                                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" 
                                                    : "bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700 hover:text-orange-600"
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-md border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-orange-600 disabled:opacity-30 transition-all active:scale-95 bg-white dark:bg-slate-950"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-100 dark:border-slate-800 border-dashed py-32 flex flex-col items-center justify-center text-center px-6">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-md mb-6">
                        <Package size={48} className="text-slate-200" strokeWidth={1} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">No Matching Manifests</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 max-w-xs leading-relaxed">System scan complete. No transaction records matching current classification or search parameters detected.</p>
                </div>
            )}
        </AnimatePresence>

        <RiderAssignmentModal
            isOpen={assignmentModal.isOpen}
            onClose={() => setAssignmentModal({ isOpen: false, orderId: null })}
            orderId={assignmentModal.orderId}
            vendorId={vendorDetails?.vendor?._id || vendorDetails?.vendor?.id}
            onAssigned={() => fetchOrders()}
        />

      </div>
    </div>
  );
}
