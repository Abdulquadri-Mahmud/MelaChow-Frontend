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
    Layout
} from "lucide-react";
import { motion } from "framer-motion";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";
import toast from "react-hot-toast";

export default function PlatformSettingsPage() {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await adminApi.getPlatformConfig();
            setConfig(res.data);
        } catch (err) {
            toast.error("Failed to load platform settings");
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
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <RefreshCcw className="w-8 h-8 text-orange-500 animate-spin" />
                    </div>
                </AdminDashboardLayout>
            </AdminProtectedRoute>
        );
    }

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="max-w-4xl mx-auto space-y-8 pb-20">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-xl">
                                    <Settings className="text-orange-600" size={24} />
                                </div>
                                Platform Configuration
                            </h1>
                            <p className="text-sm text-slate-500 mt-1 font-medium">Manage global financial levers and service parameters</p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
                        >
                            {saving ? <RefreshCcw size={16} className="animate-spin" /> : <Save size={16} />}
                            Save Changes
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Rider Payout Section */}
                        <Card icon={Bike} title="Logistics & Payouts" color="text-blue-600" bgColor="bg-blue-50">
                            <div className="space-y-4 mt-4">
                                <InputGroup 
                                    label="Rider Fixed Payout" 
                                    value={config.riderFixedPayout}
                                    onChange={(v) => setConfig({ ...config, riderFixedPayout: Number(v) })}
                                    prefix="₦"
                                    help="Fixed amount paid to riders per platform-managed delivery."
                                />
                                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex gap-3">
                                    <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                                        The difference between the customer's delivery fee (e.g. ₦1,000) and this payout (e.g. ₦600) is retained as platform revenue.
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Commission Section */}
                        <Card icon={Percent} title="Vendor Commissions" color="text-purple-600" bgColor="bg-purple-50">
                            <div className="space-y-4 mt-4">
                                <ToggleGroup 
                                    label="Commission Status" 
                                    enabled={config.commissionEnabled}
                                    onChange={(v) => setConfig({ ...config, commissionEnabled: v })}
                                />
                                <InputGroup 
                                    label="Global Commission Rate" 
                                    value={config.commissionRate}
                                    onChange={(v) => setConfig({ ...config, commissionRate: Number(v) })}
                                    suffix="%"
                                    disabled={!config.commissionEnabled}
                                    help="Standard percentage charged on food subtotal for all vendors."
                                />
                            </div>
                        </Card>

                        {/* Service Fee Section */}
                        <Card icon={CreditCard} title="Customer Service Fee" color="text-emerald-600" bgColor="bg-emerald-50">
                            <div className="space-y-4 mt-4">
                                <ToggleGroup 
                                    label="Service Fee Status" 
                                    enabled={config.serviceFeeEnabled}
                                    onChange={(v) => setConfig({ ...config, serviceFeeEnabled: v })}
                                />
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Fee Type</label>
                                        <div className="relative">
                                            <select 
                                                value={config.serviceFeeType}
                                                onChange={(e) => setConfig({ ...config, serviceFeeType: e.target.value })}
                                                disabled={!config.serviceFeeEnabled}
                                                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-bold outline-none focus:border-emerald-500 transition-colors appearance-none"
                                            >
                                                <option value="fixed">Fixed (₦)</option>
                                                <option value="percentage">Percentage (%)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <InputGroup 
                                        label="Fee Value" 
                                        value={config.serviceFeeValue}
                                        onChange={(v) => setConfig({ ...config, serviceFeeValue: Number(v) })}
                                        suffix={config.serviceFeeType === 'percentage' ? '%' : '₦'}
                                        disabled={!config.serviceFeeEnabled}
                                    />
                                </div>

                                <InputGroup 
                                    label="Fee Cap (Maximum)" 
                                    value={config.serviceFeeCap}
                                    onChange={(v) => setConfig({ ...config, serviceFeeCap: Number(v) })}
                                    prefix="₦"
                                    disabled={!config.serviceFeeEnabled || config.serviceFeeType === 'fixed'}
                                    help="Limits the service fee regardless of order size."
                                />

                                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                                    <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                                        Service fees are automatically <strong>skipped</strong> when a delivery promo is active to ensure optimal customer conversion.
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Revenue Preview */}
                        <Card icon={Layout} title="Settlement Preview" color="text-orange-600" bgColor="bg-orange-50">
                            <div className="mt-4 space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Sample Order Subtotal</span>
                                    <span className="text-sm font-black text-slate-900">₦5,000</span>
                                </div>
                                <PreviewRow label="Logistics Spread" value={1000 - config.riderFixedPayout} help="(₦1,000 Delivery - ₦{config.riderFixedPayout} Payout)" />
                                <PreviewRow 
                                    label="Commission Earned" 
                                    value={config.commissionEnabled ? (5000 * config.commissionRate / 100) : 0} 
                                />
                                <PreviewRow 
                                    label="Service Fee" 
                                    value={config.serviceFeeEnabled ? (config.serviceFeeType === 'fixed' ? config.serviceFeeValue : Math.min(5000 * config.serviceFeeValue / 100, config.serviceFeeCap)) : 0} 
                                />
                                <div className="pt-2 mt-2 border-t-2 border-dashed border-slate-200 flex justify-between items-center">
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Total Platform Revenue</span>
                                    <span className="text-lg font-black text-orange-600">
                                        ₦{(
                                            (1000 - config.riderFixedPayout) + 
                                            (config.commissionEnabled ? (5000 * config.commissionRate / 100) : 0) + 
                                            (config.serviceFeeEnabled ? (config.serviceFeeType === 'fixed' ? config.serviceFeeValue : Math.min(5000 * config.serviceFeeValue / 100, config.serviceFeeCap)) : 0)
                                        ).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Safeguard Note */}
                    <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <ShieldCheck size={120} />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                            <div className="w-14 h-14 bg-orange-500/20 border border-orange-500/30 rounded-2xl flex items-center justify-center shrink-0">
                                <ShieldCheck className="text-orange-400" size={32} />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold">System Safeguards Active</h4>
                                <p className="text-slate-400 text-sm mt-1 leading-relaxed max-w-xl">
                                    All financial adjustments made here are recorded in the system audit logs. Changes take effect <strong>immediately</strong> for all new orders created after saving.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}

function Card({ icon: Icon, title, children, color, bgColor }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
        >
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2.5 ${bgColor} rounded-xl group-hover:scale-110 transition-transform`}>
                    <Icon className={color} size={18} />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{title}</h3>
            </div>
            {children}
        </motion.div>
    );
}

function InputGroup({ label, value, onChange, prefix, suffix, disabled, help }) {
    return (
        <div className={`space-y-1.5 ${disabled ? 'opacity-40' : ''}`}>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</label>
            <div className="relative">
                {prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">{prefix}</span>
                )}
                <input 
                    type="number" 
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className={`w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-8' : ''} text-sm font-bold outline-none focus:border-slate-900 transition-colors`}
                />
                {suffix && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">{suffix}</span>
                )}
            </div>
            {help && <p className="text-[9px] text-slate-400 font-medium leading-tight">{help}</p>}
        </div>
    );
}

function ToggleGroup({ label, enabled, onChange }) {
    return (
        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">{label}</span>
            <button 
                onClick={() => onChange(!enabled)}
                className={`w-12 h-6 rounded-full relative transition-all duration-300 ${enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
                <motion.div 
                    animate={{ x: enabled ? 26 : 4 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                />
            </button>
        </div>
    );
}

function PreviewRow({ label, value, help }) {
    return (
        <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-600">{label}</span>
                <span className="text-xs font-black text-slate-900">₦{value.toLocaleString()}</span>
            </div>
            {help && <p className="text-[9px] text-slate-400 italic">{help}</p>}
        </div>
    );
}
