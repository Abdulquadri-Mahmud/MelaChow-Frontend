"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getVendorOrders } from "@/app/lib/vendorApi";
import VendorOrderCard from "@/app/components/order/VendorOrderCard";
import { ChevronLeft, ChevronRight, Package, Search, Filter, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { useVendorStorage } from "@/app/hooks/vendorStorage";
import BackButton from "@/app/components/BackButton";
import RiderAssignmentModal from "../riders/RiderAssignmentModal";

export default function VendorOrdersPage() {
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
    // if (!vendorDetails?.vendor?.id) return; // Removed ID check strictness if cookie is sufficient
    try {
      setIsLoading(true);
      const res = await getVendorOrders();
      const data = res.vendorOrders || res || [];
      const orderData = Array.isArray(data) ? data : [];
      setOrders(orderData);
      setFilteredOrders(orderData);

      // console.log(res.vendorOrders)
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
      result = result.filter(order =>
        order._id.toLowerCase().includes(lowerQuery) ||
        (order.userOrderId?.orderId || "").toLowerCase().includes(lowerQuery) ||
        (order.userOrderId?.userId?.firstname + " " + order.userOrderId?.userId?.lastname).toLowerCase().includes(lowerQuery)
      );
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
    { id: "all", label: "All Orders", icon: Package },
    { id: "pending", label: "Pending", icon: Clock },
    { id: "accepted", label: "Accepted", icon: CheckCircle2 },
    { id: "preparing", label: "Preparing", icon: TrendingUp },
    { id: "ready_for_pickup", label: "Ready", icon: CheckCircle2 },
    { id: "out_for_delivery", label: "In Transit", icon: TrendingUp },
    { id: "delivered", label: "Delivered", icon: CheckCircle2 },
    { id: "completed", label: "Completed", icon: CheckCircle2 },
  ];

  // Calculate stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.orderStatus === 'pending').length,
    active: orders.filter(o => ['accepted', 'preparing', 'ready_for_pickup', 'ready', 'out_for_delivery'].includes(o.orderStatus)).length,
    completed: orders.filter(o => ['delivered', 'completed'].includes(o.orderStatus)).length,
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#0F172A]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 min-h-screen bg-slate-50 dark:bg-[#0F172A]">

      {/* Header with Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <BackButton label="Back" className="mb-2" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Orders</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage and track your customer orders</p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by Order ID or Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#FF6B00] outline-none transition-all shadow-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Total</p>
              <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg">
                <Package size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Pending</p>
              <div className="p-2 bg-amber-100 dark:bg-amber-500/10 rounded-lg">
                <Clock size={16} className="text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pending}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Active</p>
              <div className="p-2 bg-orange-100 dark:bg-orange-500/10 rounded-lg">
                <TrendingUp size={16} className="text-[#FF6B00]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.active}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Completed</p>
              <div className="p-2 bg-green-100 dark:bg-green-500/10 rounded-lg">
                <CheckCircle2 size={16} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.completed}</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-slate-200 dark:border-slate-800"
      >
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-slate-400" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Filter by Status</p>
        </div>
        <div className="flex scroll overflow-x-auto pb-2 gap-2 scrollbar-hide">
          {tabs.map((tab) => {
            const count = tab.id === 'all'
              ? orders.length
              : orders.filter(order => {
                if (tab.id === 'ready_for_pickup') {
                  return order.orderStatus === 'ready_for_pickup' || order.orderStatus === 'ready';
                }
                return order.orderStatus === tab.id;
              }).length;
            const TabIcon = tab.icon;

            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${statusFilter === tab.id
                  ? "bg-[#FF6B00] text-white shadow-lg shadow-orange-500/20"
                  : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
              >
                <TabIcon size={16} />
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusFilter === tab.id
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}>
                  {count}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Orders Grid */}
      <AnimatePresence mode="wait">
        {currentOrders.length > 0 ? (
          <motion.div
            key="orders-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="grid md:grid-cols-3 gap-4">
              {currentOrders.map((order, index) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-6"
              >
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-0">
                  Showing <span className="font-bold text-slate-900 dark:text-white">{indexOfFirstItem + 1}</span> to <span className="font-bold text-slate-900 dark:text-white">{Math.min(indexOfLastItem, filteredOrders.length)}</span> of <span className="font-bold text-slate-900 dark:text-white">{filteredOrders.length}</span> orders
                </p>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400 transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </motion.button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (totalPages > 7 && (page < currentPage - 1 || page > currentPage + 1) && page !== 1 && page !== totalPages) {
                        if (page === currentPage - 2 || page === currentPage + 2) return <span key={page} className="text-slate-400 px-1">...</span>;
                        return null;
                      }

                      return (
                        <motion.button
                          key={page}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handlePageChange(page)}
                          className={`w-10 h-10 rounded-xl text-sm font-bold transition-colors ${currentPage === page
                            ? "bg-[#FF6B00] text-white shadow-lg shadow-orange-500/20"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </motion.button>
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
            className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800"
          >
            <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
              <Package size={48} className="text-slate-400" />
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white mb-2">No orders found</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {statusFilter !== 'all' ? `No ${statusFilter.replace(/_/g, ' ')} orders found.` : "Try adjusting your search or wait for new orders."}
            </p>
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
  );
}
