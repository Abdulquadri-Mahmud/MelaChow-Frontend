"use client";

import { useState, useEffect } from "react";
import { 
    Settings, 
    Bike, 
    Percent, 
    CreditCard, 
    Save, 
    RefreshCcw, 
    ShieldCheck, 
    AlertCircle,
    Info,
    Layout,
    Zap,
    TrendingUp,
    History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";
import toast from "react-hot-toast";

export default function PlatformSettingsPage() {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [cities, setCities] = useState([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [configRes, citiesRes] = await Promise.all([
                adminApi.getPlatformConfig(),
                adminApi.getAllCities()
            ]);
            setConfig(configRes.data);
            // Filter out inactive cities if needed, but usually we want to guard all possible delivery zones
            setCities(citiesRes.cities || []);
        } catch (err) {
            toast.error("Failed to load platform data");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await adminApi.updatePlatformConfig(config);
            toast.success("Platform settings updated successfully");
        } catch (err) {
            toast.error(err.message || "Failed to update settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminProtectedRoute>
                <AdminDashboardLayout>
                    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                        <RefreshCcw className="w-6 h-6 text-orange-500 animate-spin" />
                        <p className="text-zinc-500 font-black uppercase tracking-widest text-[9px]">Loading Architecture</p>
                    </div>
                </AdminDashboardLayout>
            </AdminProtectedRoute>
        );
    }

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="max-w-5xl mx-auto pb-20 px-4">
                    {/* Compact Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-zinc-950 p-6 rounded-[32px] border border-zinc-800 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />
                        
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-orange-600/20">
                                <Settings className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-white italic uppercase tracking-tight">Financial Levers</h1>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Global Architecture v2.4</p>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSave}
                            disabled={saving}
                            className="relative z-10 bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-orange-600/20 disabled:opacity-50 transition-colors"
                        >
                            {saving ? <RefreshCcw size={14} className="animate-spin text-white" /> : <Zap size={14} className="text-white fill-white" />}
                            <span className="text-[11px] font-black text-white uppercase tracking-widest">Save Model</span>
                        </motion.button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Column: Form Sections */}
                        <div className="lg:col-span-7 space-y-6">
                            
                            {/* Logistics Card */}
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-zinc-900 rounded-[28px] p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                                        <Bike size={20} />
                                    </div>
                                    <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest italic">Rider Payout</h3>
                                </div>

                                {(() => {
                                    const minCityFee = cities.length > 0 
                                        ? Math.min(...cities.map(c => c.platformDeliveryFee || 0))
                                        : null;
                                    
                                    if (minCityFee !== null && config.riderFixedPayout >= minCityFee) {
                                        const problematicCities = cities.filter(c => (c.platformDeliveryFee || 0) <= config.riderFixedPayout);
                                        return (
                                            <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex gap-3 items-start">
                                                <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={16} />
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">Negative Spread Risk</p>
                                                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                                                        Payout (₦{config.riderFixedPayout}) meets or exceeds the fee in {problematicCities.length} city/ies (min: ₦{minCityFee}). 
                                                        Platform will lose money on these deliveries.
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}

                                <div className="space-y-4">
                                    <CompactInput 
                                        label="Fixed Payout" 
                                        value={config.riderFixedPayout}
                                        onChange={(v) => setConfig({ ...config, riderFixedPayout: Number(v) })}
                                        prefix="₦"
                                        help="Per platform-managed delivery."
                                    />
                                    <div className="bg-blue-50/50 dark:bg-blue-500/5 p-3 rounded-2xl border border-blue-100/50 dark:border-blue-500/10 text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-tight leading-tight">
                                        Retain the delta between delivery fee and this payout.
                                    </div>
                                </div>
                            </motion.div>

                            {/* Commission Card */}
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white dark:bg-zinc-900 rounded-[28px] p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500">
                                            <Percent size={20} />
                                        </div>
                                        <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest italic">Commission</h3>
                                    </div>
                                    <CompactToggle 
                                        enabled={config.commissionEnabled}
                                        onChange={(v) => setConfig({ ...config, commissionEnabled: v })}
                                    />
                                </div>

                                <div className={`transition-all duration-300 ${!config.commissionEnabled ? 'opacity-20 blur-[1px] pointer-events-none grayscale' : ''}`}>
                                    <CompactInput 
                                        label="Global Rate" 
                                        value={config.commissionRate}
                                        onChange={(v) => setConfig({ ...config, commissionRate: Number(v) })}
                                        suffix="%"
                                        help="Charged on food subtotal."
                                    />
                                </div>
                            </motion.div>

                            {/* Service Fee Card */}
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white dark:bg-zinc-900 rounded-[28px] p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                                            <CreditCard size={20} />
                                        </div>
                                        <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest italic">Service Fee</h3>
                                    </div>
                                    <CompactToggle 
                                        enabled={config.serviceFeeEnabled}
                                        onChange={(v) => setConfig({ ...config, serviceFeeEnabled: v })}
                                    />
                                </div>

                                <div className={`space-y-4 transition-all duration-300 ${!config.serviceFeeEnabled ? 'opacity-20 blur-[1px] pointer-events-none grayscale' : ''}`}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Method</label>
                                            <div className="flex bg-zinc-50 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                                {['fixed', 'percentage'].map((type) => (
                                                    <button
                                                        key={type}
                                                        onClick={() => setConfig({ ...config, serviceFeeType: type })}
                                                        className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                                                            config.serviceFeeType === type 
                                                            ? 'bg-white dark:bg-zinc-800 text-emerald-500 shadow-sm border border-zinc-100 dark:border-zinc-700' 
                                                            : 'text-zinc-500'
                                                        }`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <CompactInput 
                                            label="Value" 
                                            value={config.serviceFeeValue}
                                            onChange={(v) => setConfig({ ...config, serviceFeeValue: Number(v) })}
                                            suffix={config.serviceFeeType === 'percentage' ? '%' : '₦'}
                                        />
                                    </div>

                                    <AnimatePresence>
                                        {config.serviceFeeType === 'percentage' && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                            >
                                                <CompactInput 
                                                    label="Maximum Ceiling (Cap)" 
                                                    value={config.serviceFeeCap}
                                                    onChange={(v) => setConfig({ ...config, serviceFeeCap: Number(v) })}
                                                    prefix="₦"
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right Column: Mini Preview */}
                        <div className="lg:col-span-5">
                            <div className="sticky top-20 space-y-6">
                                {/* Compact Receipt */}
                                <div className="bg-zinc-950 rounded-[32px] overflow-hidden border border-zinc-800 shadow-2xl">
                                    <div className="bg-zinc-900 p-5 text-center border-b border-zinc-800">
                                        <h3 className="text-white font-black text-[10px] uppercase tracking-widest italic leading-none">Settlement Preview</h3>
                                    </div>

                                    <div className="p-6 space-y-4">
                                        <div className="space-y-3">
                                            <MiniReceiptRow 
                                                label="Logistics" 
                                                value={1000 - config.riderFixedPayout} 
                                                detail="1k Del. - Payout"
                                            />
                                            <MiniReceiptRow 
                                                label="Commission" 
                                                value={config.commissionEnabled ? (5000 * config.commissionRate / 100) : 0} 
                                                detail={`${config.commissionRate}% Marketplace`}
                                            />
                                            <MiniReceiptRow 
                                                label="Service Fee" 
                                                value={config.serviceFeeEnabled ? (config.serviceFeeType === 'fixed' ? config.serviceFeeValue : Math.min(5000 * config.serviceFeeValue / 100, config.serviceFeeCap)) : 0} 
                                                detail={config.serviceFeeType}
                                            />
                                        </div>

                                        <div className="h-px bg-zinc-800 border-t border-dashed border-zinc-700" />

                                        <div className="flex justify-between items-end pt-2">
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Platform Net</span>
                                                <h4 className="text-2xl font-black text-white italic tracking-tighter leading-none">
                                                    ₦{(
                                                        (1000 - config.riderFixedPayout) + 
                                                        (config.commissionEnabled ? (5000 * config.commissionRate / 100) : 0) + 
                                                        (config.serviceFeeEnabled ? (config.serviceFeeType === 'fixed' ? config.serviceFeeValue : Math.min(5000 * config.serviceFeeValue / 100, config.serviceFeeCap)) : 0)
                                                    ).toLocaleString()}
                                                </h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Compact Audit */}
                                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800/50 space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <History size={12} className="text-orange-500" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">System Trace</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="text-zinc-500">Editor</span>
                                        <span className="text-zinc-900 dark:text-white">{config.lastUpdatedBy?.email?.split('@')[0] || 'System'}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="text-zinc-500">Date</span>
                                        <span className="text-zinc-900 dark:text-white">
                                            {config.updatedAt ? new Date(config.updatedAt).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}

function CompactInput({ label, value, onChange, prefix, suffix, help }) {
    return (
        <div className="space-y-1.5 group">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">{label}</label>
            <div className="relative">
                {prefix && (
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-black text-xs tracking-tighter">{prefix}</span>
                )}
                <input 
                    type="number" 
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full h-10 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl px-4 ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-8' : ''} text-[13px] font-black text-zinc-900 dark:text-white outline-none focus:border-orange-500/50 transition-all shadow-sm`}
                />
                {suffix && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 font-black text-xs tracking-tighter">{suffix}</span>
                )}
            </div>
            {help && <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tight italic ml-1">{help}</p>}
        </div>
    );
}

function CompactToggle({ enabled, onChange }) {
    return (
        <button 
            onClick={() => onChange(!enabled)}
            className={`w-10 h-5 rounded-full relative transition-all duration-300 p-0.5 ${
                enabled ? 'bg-orange-600' : 'bg-zinc-200 dark:bg-zinc-800'
            }`}
        >
            <motion.div 
                layout
                animate={{ x: enabled ? 20 : 0 }}
                className="w-4 h-4 bg-white rounded-full shadow-md"
            />
        </button>
    );
}

function MiniReceiptRow({ label, value, detail }) {
    return (
        <div className="flex justify-between items-center group">
            <div className="space-y-0.5">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block leading-none">{label}</span>
                <span className="text-[8px] font-bold text-zinc-600 uppercase italic opacity-60 group-hover:opacity-100 transition-opacity leading-none">
                    {detail}
                </span>
            </div>
            <span className="text-[11px] font-black text-zinc-900 dark:text-white">₦{value.toLocaleString()}</span>
        </div>
    );
}
