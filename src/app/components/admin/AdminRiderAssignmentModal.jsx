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
 * Refined Rider Assignment Modal
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
    if (rider.status !== 'available') return false;
    const name = (rider.name || `${rider.firstname || ''} ${rider.lastname || ''}`).toLowerCase();
    const phone = (rider.phone || '').toLowerCase();
    const s = search.toLowerCase();
    return name.includes(s) || phone.includes(s);
  });

  const formatTime = (dateStr) => {
    if (!dateStr) return 'Active';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Active';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !assigning && onClose()}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="relative w-full max-w-[440px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white shadow-sm">
                        <Truck size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-[14px] font-black text-slate-900 tracking-tight leading-none">Rider Assignment</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Platform Fleet Management</p>
                    </div>
                </div>
                {!assigning && (
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors p-1">
                    <X size={18} />
                  </button>
                )}
            </div>

            {/* Order Context Card */}
            <div className="px-5 py-4 bg-white border-b border-slate-100">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                            <MapPin size={11} className="text-orange-500" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pickup</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-[13px] truncate leading-tight">
                            {orderData?.restaurantName || 'Order Source'}
                        </h4>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5 mb-1">
                            <Clock size={11} className="text-orange-500" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ready At</span>
                        </div>
                        <p className="text-[12px] font-black text-slate-700 leading-tight">
                            {formatTime(orderData?.readyAt)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Selection Engine */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="px-5 py-3 border-b border-slate-50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search available riders..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium focus:bg-white focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/5 transition-all outline-none placeholder:text-slate-400"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="animate-spin text-orange-500" size={24} />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fetching Fleet...</p>
                        </div>
                    ) : filteredRiders.length === 0 ? (
                        <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            <AlertCircle size={20} className="mx-auto text-slate-300 mb-2" />
                            <h5 className="text-[12px] font-black text-slate-900 uppercase">No Units Found</h5>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Check availability or filters</p>
                        </div>
                    ) : (
                        filteredRiders.map((rider) => (
                            <div
                                key={rider._id}
                                onClick={() => setSelectedRiderId(rider._id)}
                                className={`group flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                    selectedRiderId === rider._id
                                        ? 'border-orange-500 bg-orange-50/50 ring-1 ring-orange-500/20'
                                        : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0 transition-colors ${
                                    selectedRiderId === rider._id
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {(rider.name || rider.firstname || '?')[0].toUpperCase()}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <p className="font-bold text-[13px] text-slate-900 truncate leading-tight">
                                            {rider.name || `${rider.firstname || ''} ${rider.lastname || ''}`}
                                        </p>
                                        <div className="flex items-center gap-0.5 text-orange-500">
                                            <Star size={10} fill="currentColor" />
                                            <span className="text-[10px] font-black">{rider.rating || '5.0'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1">
                                            <Navigation size={9} className="text-slate-400" />
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight truncate">
                                                {rider.vehicleType || 'Motorbike'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Phone size={9} className="text-slate-400" />
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                                                {rider.phone}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                                    selectedRiderId === rider._id 
                                    ? 'bg-orange-500 text-white' 
                                    : 'bg-slate-50 text-slate-300'
                                }`}>
                                    <ChevronRight size={14} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-slate-100 flex items-center gap-3 bg-slate-50/30">
                <button
                    disabled={assigning}
                    onClick={onClose}
                    className="flex-1 h-10 rounded-lg border border-slate-200 bg-white text-slate-500 font-black text-[10px] uppercase tracking-wider hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    disabled={!selectedRiderId || assigning}
                    onClick={handleAssign}
                    className={`flex-[1.5] h-10 rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        selectedRiderId 
                        ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/10' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                >
                    {assigning ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <ShieldCheck size={14} />
                    )}
                    {assigning ? 'Assigning...' : 'Dispatch Rider'}
                </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
