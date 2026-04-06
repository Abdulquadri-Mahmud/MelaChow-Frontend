"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getVendorOrders } from "@/app/lib/vendorApi";
import VendorOrderCard from "@/app/components/order/VendorOrderCard";
import { ChevronLeft, ChevronRight, Package, Search, Filter, TrendingUp, Clock, CheckCircle2, Hash, RotateCw } from "lucide-react";
import { useVendorStorage } from "@/app/hooks/vendorStorage";
import RiderAssignmentModal from "../riders/RiderAssignmentModal";

export default function VendorOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { vendorDetails } = useVendorStorage();

  const [assignmentModal, setAssignmentModal] = useState({ isOpen: false, orderId: null });

  const itemsPerPage = 6;

  const fetchOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      const res = await getVendorOrders();
      const data = res.vendorOrders || res.data || res || [];
      const orderData = Array.isArray(data) ? data : [];
      setOrders(orderData);
      setFilteredOrders(orderData);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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
    <div className="min-h-screen bg-slate-100 p-2 rounded-md dark:bg-slate-950 font-sans">
      <div className="max-w-7xl mx-auto space-y-4">

        {/* Hero Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800"
        >
          {/* Top Row: Back Button & Title & Refresh */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.back()}
                className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-orange-600 dark:hover:text-orange-500 transition-all border border-slate-200 dark:border-slate-700 active:scale-90 shrink-0"
              >
                <ChevronLeft size={18} />
              </motion.button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                  Order Logs
                </h1>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fetchOrders(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 p-2 px-4 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 rounded-lg font-black text-[10px] uppercase tracking-widest border border-orange-200 dark:border-orange-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <RotateCw size={14} className={isRefreshing ? "animate-spin" : ""} strokeWidth={2.5}/>
              Refresh
            </motion.button>
          </div>


          {/* Second Row: Subtitle & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Real-time transaction manifest & operational history
            </p>

            {/* Search Bar */}
            <div className="relative w-full sm:max-w-sm">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <motion.input 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                placeholder="Search by ID or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold uppercase tracking-wider outline-none focus:border-orange-600 dark:focus:border-orange-500 transition-colors text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
            {[
              { label: "Total Orders", value: stats.total, icon: Package, gradient: "from-blue-500 to-blue-600", light: "text-blue-600", lightBg: "bg-blue-50 dark:bg-blue-500/10" },
              { label: "Awaiting", value: stats.pending, icon: Clock, gradient: "from-amber-500 to-amber-600", light: "text-amber-600", lightBg: "bg-amber-50 dark:bg-amber-500/10" },
              { label: "In Progress", value: stats.active, icon: TrendingUp, gradient: "from-orange-500 to-orange-600", light: "text-orange-600", lightBg: "bg-orange-50 dark:bg-orange-500/10" },
              { label: "Completed", value: stats.completed, icon: CheckCircle2, gradient: "from-emerald-500 to-emerald-600", light: "text-emerald-600", lightBg: "bg-emerald-50 dark:bg-emerald-500/10" },
            ].map((s, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-3 rounded-lg ${s.lightBg} border border-slate-200 dark:border-slate-700`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className={`text-[9px] font-black uppercase tracking-wider ${s.light} opacity-75`}>{s.label}</p>
                  </div>
                  <motion.div 
                    className={`p-2 bg-linear-to-br ${s.gradient} rounded-lg text-white`}
                    whileHover={{ scale: 1.1 }}
                  >
                    <s.icon size={14} strokeWidth={2.5} />
                  </motion.div>
                </div>
                <p className={`text-3xl font-black ${s.light} tabular-nums`}>{s.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center gap-2 mb-4 px-1">
            <Filter size={14} className="text-orange-600" />
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Filter by status</p>
            <div className="ml-auto text-[9px] font-bold text-slate-400 dark:text-slate-500">
              {filteredOrders.length} results
            </div>
          </div>
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide scroll-smooth">
            {tabs.map((tab) => {
              const count = tab.id === 'all' 
                ? orders.length 
                : orders.filter(o => tab.id === 'ready_for_pickup' ? (o.orderStatus === 'ready' || o.orderStatus === 'ready_for_pickup') : o.orderStatus === tab.id).length;
              
              const isActive = statusFilter === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`shrink-0 px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 border font-black text-[10px] uppercase tracking-wider whitespace-nowrap ${
                    isActive
                      ? "bg-linear-to-r from-orange-600 to-orange-700 text-white border-transparent"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-orange-400 dark:hover:border-orange-500"
                  }`}
                >
                  <tab.icon size={13} strokeWidth={2.5} />
                  {tab.label}
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`px-2 py-0.5 rounded-md text-[8px] font-black ${
                      isActive ? "bg-orange-900 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {count}
                  </motion.span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Orders Grid & Results */}
        <AnimatePresence mode="wait">
          {currentOrders.length > 0 ? (
            <motion.div
              key="orders-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentOrders.map((order, index) => (
                  <motion.div
                    key={order._id?.$oid || order._id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                  >
                    <VendorOrderCard 
                      order={order}
                      onAssign={(orderId) => setAssignmentModal({ isOpen: true, orderId })}
                      onRefresh={fetchOrders}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Smart Pagination */}
              {totalPages > 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                    
                    {/* Result Counter */}
                    <div className="text-center sm:text-left">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        Showing <span className="text-orange-600 dark:text-orange-500">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredOrders.length)}</span> of <span className="font-black text-slate-900 dark:text-white">{filteredOrders.length}</span>
                      </p>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-500 hover:border-orange-600 dark:hover:border-orange-500 disabled:opacity-25 disabled:cursor-not-allowed transition-all bg-white dark:bg-slate-800 font-bold"
                      >
                        <ChevronLeft size={16} />
                      </motion.button>

                      {/* Page Numbers */}
                      <div className="flex gap-1.5">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          const isCurrent = currentPage === page;
                          const isVisible = Math.abs(page - currentPage) <= 1 || page === 1 || page === totalPages;

                          if (!isVisible) return null;

                          if ((page === 2 && currentPage > 3) || (page === totalPages - 1 && currentPage < totalPages - 2)) {
                            return <span key={`ellipsis-${page}`} className="px-1 text-slate-300">...</span>;
                          }

                          return (
                            <motion.button
                              key={page}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handlePageChange(page)}
                              className={`w-9 h-9 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                                isCurrent
                                  ? "bg-linear-to-r from-orange-600 to-orange-700 text-white border-transparent"
                                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500"
                              }`}
                            >
                              {page}
                            </motion.button>
                          );
                        })}
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-500 hover:border-orange-600 dark:hover:border-orange-500 disabled:opacity-25 disabled:cursor-not-allowed transition-all bg-white dark:bg-slate-800 font-bold"
                      >
                        <ChevronRight size={16} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 py-24 flex flex-col items-center justify-center text-center px-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full mb-6"
              >
                <Package size={56} className="text-slate-300 dark:text-slate-600" strokeWidth={1} />
              </motion.div>
              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2"
              >
                No Orders Found
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed"
              >
                {searchQuery 
                  ? `No orders match your search for "${searchQuery}"` 
                  : `No ${statusFilter !== 'all' ? `${statusFilter.replace(/_/g, ' ')} ` : ''}orders at the moment`}
              </motion.p>
            </motion.div>
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
