'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Search, Truck, X } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/app/lib/adminApi';

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
      // Assuming response is the direct data array or has a data property
      // Based on adminApi pattern, handleResponse returns response.data
      setRiders(Array.isArray(response) ? response : (response.data || []));
    } catch (err) {
      console.error('Failed to fetch available riders:', err);
      toast.error('Could not load available riders');
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
      toast.success('Rider assigned successfully');
      onAssigned?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to assign rider');
    } finally {
      setAssigning(false);
    }
  };

  const filteredRiders = riders.filter(rider => {
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
          
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !assigning && onClose()}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
          >
            {/* Header section */}
            <div className="p-8 pb-0">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm border border-orange-100">
                  <Truck size={28} />
                </div>
                {!assigning && (
                  <button 
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
              
              <div className="mt-6">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Assign Delivery Rider
                </h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                  ORDER FOR: {orderData?.restaurantName || 'Restaurant'}
                </p>
              </div>
            </div>

            {/* Order info banner */}
            <div className="mx-8 mt-6">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🍽️</span>
                  <p className="text-xs font-black text-slate-600 uppercase tracking-tighter truncate max-w-[160px]">
                    {orderData?.restaurantName || 'Restaurant'}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-slate-400 bg-white px-3 py-1.5 rounded-xl border border-slate-100">
                  <span className="text-lg">⏱️</span>
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    Ready since {formatTime(orderData?.readyAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Search input */}
            <div className="px-8 mt-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl h-12 pl-12 pr-4 text-sm font-medium focus:bg-white focus:border-orange-200 focus:ring-4 focus:ring-orange-50 outline-none transition-all"
                />
              </div>
            </div>

            {/* Rider list section */}
            <div className="px-8 mt-4 mb-4">
              <div className="max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="animate-spin text-orange-500" size={32} />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Riders...</p>
                  </div>
                ) : filteredRiders.length === 0 ? (
                  <div className="py-10 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                      {search ? "No Matches Found" : "No Available Riders"}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 font-medium">
                      {search ? "Try a different search term" : "All riders are currently on assignment"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredRiders.map(rider => (
                      <div
                        key={rider._id}
                        onClick={() => setSelectedRiderId(rider._id)}
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          selectedRiderId === rider._id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-50 bg-white hover:border-gray-200 hover:bg-gray-50/50'
                        }`}
                      >
                        {/* Rider avatar initials */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 transition-colors ${
                          selectedRiderId === rider._id
                            ? 'bg-orange-500 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {(rider.name || rider.firstname || '?')[0].toUpperCase()}
                        </div>
                        
                        {/* Rider info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-sm text-slate-900 tracking-tight">
                            {rider.name || `${rider.firstname || ''} ${rider.lastname || ''}`}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {rider.phone} · {rider.vehicleType || 'Rider'}
                          </p>
                        </div>
                        
                        {/* Selected indicator */}
                        {selectedRiderId === rider._id && (
                          <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-200"
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </motion.div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer action buttons */}
            <div className="p-8 pt-6 border-t border-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <button
                  disabled={assigning}
                  onClick={onClose}
                  className="h-14 rounded-2xl bg-gray-100 text-gray-500 font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={!selectedRiderId || assigning}
                  onClick={handleAssign}
                  className="h-14 rounded-2xl bg-orange-600 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-orange-100 active:scale-95"
                >
                  {assigning ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Truck size={16} />
                  )}
                  {assigning ? 'Assigning...' : 'Assign Rider'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
