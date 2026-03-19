'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Search, 
  Truck, 
  X, 
  Star, 
  Navigation, 
  Phone, 
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  MapPin,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/app/lib/adminApi';

/**
 * Enhanced Rider Assignment Modal
 * High-performance UI for logistics dispatching
 */
export default function AdminRiderAssignmentModal({
  isOpen,
  onClose,
  orderData,  // { vendorOrderId, restaurantName, readyAt, url }
  onAssigned  // callback after successful assignment
}) {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchAvailableRiders();
      setSelectedRiderId(null);
      setSearch('');
    }
  }, [isOpen]);

  const fetchAvailableRiders = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAvailableRiders();
      setRiders(Array.isArray(response) ? response : (response.data || []));
    } catch (err) {
      console.error('Failed to fetch available riders:', err);
      toast.error('Logistics sync failed - Could not load riders');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedRiderId || !orderData?.vendorOrderId) return;
    try {
      setAssigning(true);
      await adminApi.assignRiderToOrder(
        orderData.vendorOrderId, 
        selectedRiderId
      );
      toast.success('Rider dispatched successfully');
      onAssigned?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Dispatch failed');
    } finally {
      setAssigning(false);
    }
  };

  const filteredRiders = riders.filter(rider => {
    // Strict status check for assignment safety
    if (rider.status !== 'available') return false;

    const name = (rider.name || `${rider.firstname || ''} ${rider.lastname || ''}`).toLowerCase();
    const phone = (rider.phone || '').toLowerCase();
    const s = search.toLowerCase();
    return name.includes(s) || phone.includes(s);
  });

  const formatTime = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          
          {/* High-fidelity Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !assigning && onClose()}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          />
          
          {/* Dynamic Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[500px] bg-white rounded-[48px] shadow-[0_32px_80px_-16px_rgba(15,23,42,0.3)] overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* STICKY HEADER: Order Intelligence */}
            <div className="p-4 pb-6 border-b border-slate-50 flex-shrink-0">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-orange-600 rounded-[20px] flex items-center justify-center text-white shadow-xl shadow-orange-100 ring-8 ring-orange-50/50">
                    <Truck size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Dispatch Center</h3>
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none pt-0.5">Logistics Protocol Active</p>
                    </div>
                  </div>
                </div>
                {!assigning && (
                  <button 
                    onClick={onClose}
                    className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all hover:bg-slate-100 hover:rotate-90"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
              
              <div className="bg-slate-950 rounded-3xl p-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-[40px] translate-x-10 -translate-y-10 group-hover:bg-orange-500/20 transition-all" />
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5 leading-none">
                            <MapPin size={10} className="text-orange-500" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none">Pickup Node</p>
                        </div>
                        <h4 className="text-white font-black text-base tracking-tight leading-none">{orderData?.restaurantName || 'Restaurant Source'}</h4>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-2 mb-1.5 leading-none">
                            <Clock size={10} className="text-orange-500" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none">Wait Time</p>
                        </div>
                        <div className="px-3 py-1 bg-white/5 rounded-xl border border-white/10 text-white text-[10px] font-black uppercase tracking-widest inline-block">
                           {formatTime(orderData?.readyAt)}
                        </div>
                    </div>
                  </div>
              </div>
            </div>

            {/* SCROLLABLE SECTION: Rider Selection */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="px-8 py-6 flex-shrink-0">
                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Find available riders by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl h-16 pl-14 pr-6 text-sm font-bold placeholder:text-slate-400 focus:bg-white focus:border-orange-100 focus:shadow-xl focus:shadow-orange-50/50 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="px-8 pb-4 overflow-y-auto custom-scrollbar flex-1">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <div className="relative">
                                <Loader2 className="animate-spin text-orange-600" size={48} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-orange-600 rounded-full" />
                                </div>
                            </div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Scanning Terminal...</p>
                        </div>
                    ) : filteredRiders.length === 0 ? (
                        <div className="py-16 text-center bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-100 group">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 text-slate-300 group-hover:scale-110 transition-transform">
                                <AlertCircle size={32} />
                            </div>
                            <h5 className="text-sm font-black text-slate-900 uppercase tracking-tighter mb-1">
                                {search ? "Zero Matches Found" : "No Available Units"}
                            </h5>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">
                                {search ? "Try adjusting your search criteria" : "All delivery units are currently deployed"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredRiders.map((rider, idx) => (
                                <motion.div
                                    key={rider._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => setSelectedRiderId(rider._id)}
                                    className={`relative flex items-center gap-5 p-5 rounded-[32px] border-2 cursor-pointer transition-all duration-300 group ${
                                    selectedRiderId === rider._id
                                        ? 'border-orange-600 bg-orange-50/30'
                                        : 'border-slate-50 bg-white hover:border-slate-100 hover:bg-slate-50/50'
                                    }`}
                                >
                                    {/* Selected Highlight Bar */}
                                    {selectedRiderId === rider._id && (
                                        <motion.div 
                                            layoutId="rider-active"
                                            className="absolute left-[-2px] inset-y-6 w-1 rounded-full bg-orange-600" 
                                        />
                                    )}

                                    <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center font-black text-lg flex-shrink-0 transition-transform duration-500 group-hover:scale-105 ${
                                    selectedRiderId === rider._id
                                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-100'
                                        : 'bg-slate-100 text-slate-900 border border-white'
                                    }`}>
                                    {(rider.name || rider.firstname || '?')[0].toUpperCase()}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-black text-base text-slate-900 tracking-tight leading-none group-hover:text-orange-600 transition-colors">
                                                {rider.name || `${rider.firstname || ''} ${rider.lastname || ''}`}
                                            </p>
                                            <div className="flex items-center gap-0.5 text-orange-500">
                                                <Star size={10} fill="currentColor" />
                                                <span className="text-[9px] font-black">{rider.rating || '5.0'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5">
                                                <Navigation size={10} className="text-slate-400" />
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {rider.vehicleType || 'Motorbike'}
                                                </p>
                                            </div>
                                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                                            <div className="flex items-center gap-1.5">
                                                <Phone size={10} className="text-slate-400" />
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {rider.phone}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                        selectedRiderId === rider._id 
                                        ? 'bg-orange-600 text-white rotate-0' 
                                        : 'bg-slate-50 text-slate-300 -rotate-45 group-hover:rotate-0 group-hover:bg-orange-100 group-hover:text-orange-600'
                                    }`}>
                                        <ChevronRight size={18} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* STICKY FOOTER: Action Commitment */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex-shrink-0">
                <div className="grid grid-cols-2 gap-4">
                    <button
                        disabled={assigning}
                        onClick={onClose}
                        className="h-16 rounded-[24px] bg-white border border-slate-200 text-slate-400 font-black text-[11px] uppercase tracking-widest hover:text-slate-900 hover:bg-white hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                        Abort Dispatch
                    </button>
                    <button
                        disabled={!selectedRiderId || assigning}
                        onClick={handleAssign}
                        className={`h-16 rounded-[24px] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl ${
                            selectedRiderId 
                            ? 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        }`}
                    >
                        {assigning ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <ShieldCheck size={18} />
                        )}
                        {assigning ? 'Syncing...' : 'Confirm Dispatch'}
                    </button>
                </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
