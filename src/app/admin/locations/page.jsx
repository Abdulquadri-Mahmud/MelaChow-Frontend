"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus, Loader2, CheckCircle2, Clock, Building2, Navigation,
  AlertTriangle, Search, Filter, X, MapPin, Users, Calendar,
  Eye, EyeOff, Edit3, RefreshCw, ChevronRight, Activity, PieChart,
  ChevronDown, Map
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import toast from "react-hot-toast";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";

/* ─────────────────────────────────────────────────────────────────────────────
   SHARED UI COMPONENTS
   ───────────────────────────────────────────────────────────────────────────── */

const StatTile = ({ label, value, bg, text, icon: Icon }) => (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 hover:border-orange-200 transition-all group shadow-sm bg-gradient-to-br from-white to-slate-50/30">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg} ${text} bg-opacity-30 group-hover:bg-opacity-40 transition-colors`}>
            <Icon size={18} />
        </div>
        <div className="min-w-0">
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1 truncate">{label}</p>
            <p className="text-lg font-extrabold text-slate-900 leading-none">{value}</p>
        </div>
    </div>
);

const Th = ({ children, right, center }) => (
    <th className={`px-4 py-3 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.15em] bg-slate-50 border-b border-slate-100 ${right ? "text-right" : ""} ${center ? "text-center" : ""}`}>
        {children}
    </th>
);

const Badge = ({ children, status }) => {
    const variants = {
        active: "bg-emerald-50 text-emerald-700 border-emerald-100",
        inactive: "bg-slate-50 text-slate-500 border-slate-200",
        pending: "bg-amber-50 text-amber-700 border-amber-200"
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest border shadow-sm ${variants[status] || variants.inactive}`}>
            {children}
        </span>
    );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN MANAGEMENT COMPONENT
   ───────────────────────────────────────────────────────────────────────────── */

function AdminLocationManagement() {
  const [activeTab, setActiveTab] = useState('states');
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');

  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [requestSearch, setRequestSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [cityStateFilter, setCityStateFilter] = useState('all');

  const [showStateModal, setShowStateModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [togglingStateIds, setTogglingStateIds] = useState(new Set());
  const [togglingCityIds, setTogglingCityIds] = useState(new Set());

  const [newStateName, setNewStateName] = useState('');
  const [newCityName, setNewCityName] = useState('');
  const [selectedStateId, setSelectedStateId] = useState('');
  const [newPlatformDeliveryFee, setNewPlatformDeliveryFee] = useState(0);
  const [editingCityId, setEditingCityId] = useState(null);

  const [resolveState, setResolveState] = useState('');
  const [resolveCity, setResolveCity] = useState('');
  const [createLocation, setCreateLocation] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statesRes, citiesRes, reqsRes, metricsRes] = await Promise.all([
        adminApi.getAllStates(),
        adminApi.getAllCities(),
        adminApi.getLocationRequests(),
        adminApi.getLocationMetrics()
      ]);
      
      setStates(statesRes.states || []);
      setCities(citiesRes.cities || []);
      setPendingRequests(reqsRes.vendors || []);
      setMetrics(metricsRes.top_cities || []);
      setBackendStatus('available');
    } catch (err) {
      console.error('Initialization error:', err);
      setBackendStatus('error');
      toast.error("Location Registry Offline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateState = async (e) => {
    e.preventDefault();
    if (!newStateName.trim()) return;
    try {
      setLoading(true);
      const data = await adminApi.createState({ name: newStateName.trim() });
      if (data.success) {
        toast.success('Region Added');
        setNewStateName('');
        setShowStateModal(false);
        fetchData();
      }
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const handleCitySubmit = async (e) => {
    e.preventDefault();
    if (!newCityName.trim() || !selectedStateId) return;
    try {
      setLoading(true);
      const payload = { 
        name: newCityName.trim(), 
        stateId: selectedStateId, 
        platformDeliveryFee: Number(newPlatformDeliveryFee) || 0 
      };
      const data = editingCityId
        ? await adminApi.updateCity(editingCityId, payload)
        : await adminApi.createCity(payload);
      if (data.success) {
        toast.success(editingCityId ? 'City Refined' : 'City Established');
        resetCityForm();
        fetchData();
      }
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const resetCityForm = () => {
    setNewCityName('');
    setSelectedStateId('');
    setNewPlatformDeliveryFee(0);
    setEditingCityId(null);
    setShowCityModal(false);
  };

  const toggleStateStatus = async (stateId, newStatus) => {
    if (togglingStateIds.has(stateId)) return;
    setTogglingStateIds(prev => new Set(prev).add(stateId));
    setStates(prev => prev.map(s => s._id === stateId ? { ...s, isActive: newStatus } : s));
    try {
      await adminApi.toggleStateStatus(stateId, newStatus);
      toast.success(newStatus ? 'Region Active' : 'Region Paused');
    } catch (err) {
      setStates(prev => prev.map(s => s._id === stateId ? { ...s, isActive: !newStatus } : s));
      toast.error('Sync Failure');
    } finally {
      setTogglingStateIds(prev => { const n = new Set(prev); n.delete(stateId); return n; });
    }
  };

  const toggleCityStatus = async (cityId, newStatus) => {
    if (togglingCityIds.has(cityId)) return;
    setTogglingCityIds(prev => new Set(prev).add(cityId));
    setCities(prev => prev.map(c => c._id === cityId ? { ...c, isActive: newStatus } : c));
    try {
      await adminApi.toggleCityStatus(cityId, newStatus);
      toast.success(newStatus ? 'City Online' : 'City Paused');
    } catch (err) {
      setCities(prev => prev.map(c => c._id === cityId ? { ...c, isActive: !newStatus } : c));
      toast.error('Sync Failure');
    } finally {
      setTogglingCityIds(prev => { const n = new Set(prev); n.delete(cityId); return n; });
    }
  };

  const handleApproveVendor = async () => {
    if (!selectedVendor || !resolveState.trim() || !resolveCity.trim()) return;
    try {
      setLoading(true);
      const data = await adminApi.approveVendorLocation(selectedVendor._id, {
        state: resolveState.trim(), city: resolveCity.trim(), createLocation
      });
      if (data.success) {
        toast.success('Vector Authorized');
        setSelectedVendor(null);
        setShowRequestModal(false);
        fetchData();
      }
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const filteredStates = useMemo(() => states.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(stateSearch.toLowerCase());
    const matchFilter = stateFilter === 'all' || (stateFilter === 'active' && s.isActive) || (stateFilter === 'inactive' && !s.isActive);
    return matchSearch && matchFilter;
  }), [states, stateSearch, stateFilter]);

  const filteredCities = useMemo(() => cities.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(citySearch.toLowerCase());
    const matchFilter = cityFilter === 'all' || (cityFilter === 'active' && c.isActive) || (cityFilter === 'inactive' && !c.isActive);
    const matchState = cityStateFilter === 'all' || c.stateId?._id === cityStateFilter;
    return matchSearch && matchFilter && matchState;
  }), [cities, citySearch, cityFilter, cityStateFilter]);

  const filteredRequests = useMemo(() => pendingRequests.filter(r =>
    r.storeName?.toLowerCase().includes(requestSearch.toLowerCase()) ||
    r.requestedState?.toLowerCase().includes(requestSearch.toLowerCase()) ||
    r.requestedCity?.toLowerCase().includes(requestSearch.toLowerCase())
  ), [pendingRequests, requestSearch]);

  if (backendStatus === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Synchronizing Geographic Data…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-100 shrink-0">
            <Map size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight leading-tight">Geographic Hub</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="h-0.5 w-6 bg-orange-500 rounded-full" />
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">Global Coverage Control</p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-[0.15em] rounded-xl hover:bg-orange-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Registry Sync
        </button>
      </div>

      {/* Analytics Distribution */}
      <AnimatePresence>
        {metrics?.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col lg:flex-row"
          >
            <div className="p-5 border-r border-slate-100 lg:w-1/3 bg-slate-50/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-extrabold text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity size={14} className="text-orange-500" /> Vendor Density
                </h3>
                <span className="text-[9px] font-extrabold text-orange-600 bg-orange-100 px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm">Hotspots</span>
              </div>
              <div className="space-y-3">
                <StatTile label="Total Nodes" value={states.length} icon={Navigation} bg="bg-blue-100" text="text-blue-600" />
                <StatTile label="Active Cities" value={cities.filter(c => c.isActive).length} icon={Building2} bg="bg-emerald-100" text="text-emerald-600" />
                <StatTile label="Top Territory" value={metrics[0]?.name || "N/A"} icon={PieChart} bg="bg-orange-100" text="text-orange-600" />
              </div>
            </div>
            <div className="p-5 flex-1 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.slice(0, 8)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 800, textTransform: 'uppercase' }} width={80} />
                  <Tooltip 
                    cursor={{ fill: '#fff7ed' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#f48525' }}
                    labelStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}
                  />
                  <Bar dataKey="count" name="Vendors" radius={[0, 4, 4, 0]} barSize={20}>
                    {metrics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#f48525' : '#fbbf24'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs / Content */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex bg-slate-50 border-b border-slate-200 p-1">
          {[
            { key: 'states', label: 'Provinces', count: states.length, icon: Navigation },
            { key: 'cities', label: 'Districts', count: cities.length, icon: Building2 },
            { key: 'requests', label: 'Entrance Requests', count: pendingRequests.length, icon: Clock, warn: pendingRequests.length > 0 }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest transition-all rounded-xl ${activeTab === tab.key
                  ? 'bg-white text-orange-600 shadow-sm border border-orange-100'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                }`}
              >
                <Icon size={14} className={activeTab === tab.key ? "text-orange-500" : "text-slate-400"} />
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-[9px] shadow-inner font-black ${tab.warn ? 'bg-orange-500 text-white animate-pulse' : activeTab === tab.key ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-500'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'states' && (
              <StatesPanel
                key="states"
                states={filteredStates}
                loading={loading}
                onToggleStatus={toggleStateStatus}
                togglingIds={togglingStateIds}
                showModal={showStateModal}
                setShowModal={setShowStateModal}
                newStateName={newStateName}
                setNewStateName={setNewStateName}
                onCreateState={handleCreateState}
                searchTerm={stateSearch}
                setSearchTerm={setStateSearch}
                filter={stateFilter}
                setFilter={setStateFilter}
              />
            )}
            {activeTab === 'cities' && (
              <CitiesPanel
                key="cities"
                cities={filteredCities}
                states={states}
                loading={loading}
                onToggleStatus={toggleCityStatus}
                togglingIds={togglingCityIds}
                showModal={showCityModal}
                setShowModal={(val) => { if (!val) resetCityForm(); else setShowCityModal(true); }}
                newCityName={newCityName}
                setNewCityName={setNewCityName}
                selectedStateId={selectedStateId}
                setSelectedStateId={setSelectedStateId}
                newPlatformDeliveryFee={newPlatformDeliveryFee}
                setNewPlatformDeliveryFee={setNewPlatformDeliveryFee}
                editingCityId={editingCityId}
                onSubmitCity={handleCitySubmit}
                onEditCity={(item) => {
                  setEditingCityId(item._id);
                  setNewCityName(item.name);
                  setSelectedStateId(item.stateId?._id || item.stateId);
                  setNewPlatformDeliveryFee(item.platformDeliveryFee);
                  setShowCityModal(true);
                }}
                searchTerm={citySearch}
                setSearchTerm={setCitySearch}
                filter={cityFilter}
                setFilter={setCityFilter}
                stateFilter={cityStateFilter}
                setStateFilter={setCityStateFilter}
              />
            )}
            {activeTab === 'requests' && (
              <PendingRequestsPanel
                key="requests"
                requests={filteredRequests}
                loading={loading}
                selectedVendor={selectedVendor}
                setSelectedVendor={setSelectedVendor}
                showModal={showRequestModal}
                setShowModal={setShowRequestModal}
                resolveState={resolveState}
                setResolveState={setResolveState}
                resolveCity={resolveCity}
                setResolveCity={setResolveCity}
                createLocation={createLocation}
                setCreateLocation={setCreateLocation}
                onApproveVendor={handleApproveVendor}
                searchTerm={requestSearch}
                setSearchTerm={setRequestSearch}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SUB-PANELS
   ───────────────────────────────────────────────────────────────────────────── */

const StatesPanel = ({ states, loading, onToggleStatus, togglingIds, showModal, setShowModal, newStateName, setNewStateName, onCreateState, searchTerm, setSearchTerm, filter, setFilter }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50 p-4 rounded-xl border border-slate-100">
      <div className="relative flex-1 max-w-sm group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
        <input
          type="text" placeholder="Locate province record…" value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 h-11 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 transition-all font-medium"
        />
      </div>
      <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-xl">
            {['all', 'active', 'inactive'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-widest transition-all ${filter === f ? 'bg-white text-orange-600 shadow-sm border border-orange-100' : 'text-slate-400 hover:text-slate-600'}`}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)}
            className="h-11 px-5 bg-orange-600 text-white text-[10px] font-extrabold uppercase tracking-[0.15em] rounded-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 active:scale-95 flex items-center gap-2">
            <Plus size={16} /> New Region
          </button>
      </div>
    </div>

    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full">
        <thead>
          <tr>
            <Th>Classification</Th>
            <Th center>Districts</Th>
            <Th center>Registry Date</Th>
            <Th center>Status</Th>
            <th className="bg-slate-50 border-b border-slate-100 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 font-medium">
          {states.map(state => (
            <tr key={state._id} className="hover:bg-orange-50/30 transition-all group">
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${state.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Navigation size={15} />
                  </div>
                  <span className="font-extrabold text-sm text-slate-900 uppercase tracking-tight">{state.name}</span>
                </div>
              </td>
              <td className="py-4 px-4 text-center">
                <span className="text-xs font-extrabold text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">{state.cities?.length || 0} Nodes</span>
              </td>
              <td className="py-4 px-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                {new Date(state.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </td>
              <td className="py-4 px-4 text-center">
                <button
                  onClick={() => onToggleStatus(state._id, !state.isActive)}
                  disabled={togglingIds.has(state._id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-extrabold border uppercase tracking-widest transition-all ${state.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 shadow-sm shadow-emerald-50' : 'bg-slate-50 text-slate-400 border-slate-200 shadow-inner'}`}
                >
                  {togglingIds.has(state._id) ? <Loader2 size={12} className="animate-spin text-orange-500" /> : <div className={`w-1.5 h-1.5 rounded-full ${state.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />}
                  {state.isActive ? 'Online' : 'Paused'}
                </button>
              </td>
              <td className="pr-4 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={16} className="text-slate-300 ml-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {states.length === 0 && <EmptyState icon={<Navigation size={24} />} title="No Regions Found" description="Initialize your geography by adding a first state record." />}
    </div>

    {/* Create State Modal */}
    <AnimatePresence>
      {showModal && (
        <Modal title="Establish New Region" onClose={() => setShowModal(false)}>
          <form onSubmit={onCreateState} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">State Nomenclature</label>
              <input type="text" value={newStateName} onChange={(e) => setNewStateName(e.target.value)}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all placeholder:text-slate-400"
                placeholder="e.g. LAGOS" required autoFocus />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 h-11 bg-white border border-slate-200 text-slate-600 text-[10px] font-extrabold uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors">Abort</button>
              <button type="submit" disabled={loading}
                className="flex-1 h-11 bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-xl hover:bg-orange-600 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Create Entry
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AnimatePresence>
  </motion.div>
);

const CitiesPanel = ({ cities, states, loading, onToggleStatus, togglingIds, showModal, setShowModal, newCityName, setNewCityName, selectedStateId, setSelectedStateId, newPlatformDeliveryFee, setNewPlatformDeliveryFee, editingCityId, onSubmitCity, onEditCity, searchTerm, setSearchTerm, filter, setFilter, stateFilter, setStateFilter }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-slate-50/50 p-4 rounded-xl border border-slate-100 shadow-inner">
      <div className="flex flex-1 items-center gap-3 w-full lg:w-auto">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
          <input type="text" placeholder="Locate district record…" value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 h-11 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 transition-all" />
        </div>
        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}
          className="h-11 px-4 border border-slate-200 rounded-xl text-[10px] font-extrabold uppercase tracking-widest text-slate-600 bg-white outline-none focus:border-orange-500 shadow-sm cursor-pointer min-w-[140px]">
          <option value="all">Global (All States)</option>
          {states.map(s => <option key={s._id} value={s._id}>{s.name.toUpperCase()}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-xl">
            {['all', 'active', 'inactive'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-widest transition-all ${filter === f ? 'bg-white text-orange-600 shadow-sm border border-orange-100' : 'text-slate-400 hover:text-slate-600'}`}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)}
            className="h-11 px-5 bg-orange-600 text-white text-[10px] font-extrabold uppercase tracking-[0.15em] rounded-xl hover:bg-orange-700 transition-all shadow-lg active:scale-95 flex items-center gap-2">
            <Plus size={16} /> New District
          </button>
      </div>
    </div>

    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full">
        <thead>
          <tr>
            <Th>Node Identity</Th>
            <Th>Parent Region</Th>
            <Th center>Logistics Base</Th>
            <Th center>Status</Th>
            <Th right>Actions</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 font-medium whitespace-nowrap">
          {cities.map(city => (
            <tr key={city._id} className="hover:bg-orange-50/30 transition-all group">
              <td className="py-4 px-4 font-extrabold text-slate-900 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-slate-100 ${city.isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Building2 size={15} />
                </div>
                <div className="min-w-0">
                  <span className="uppercase tracking-tight block truncate">{city.name}</span>
                  <span className="text-[9px] text-slate-400 font-extrabold tracking-widest uppercase">District Node</span>
                </div>
              </td>
              <td className="py-4 px-4">
                <span className="text-[9px] font-extrabold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">{city.stateId?.name || 'Isolated'}</span>
              </td>
              <td className="py-4 px-4 text-center">
                <span className="text-xs font-black text-slate-900 bg-orange-50 px-3 py-1 rounded-lg border border-orange-100">₦{new Intl.NumberFormat().format(city.platformDeliveryFee || 0)}</span>
              </td>
              <td className="py-4 px-4 text-center">
                <button
                  onClick={() => onToggleStatus(city._id, !city.isActive)}
                  disabled={togglingIds.has(city._id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-extrabold border uppercase tracking-widest transition-all ${city.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 shadow-sm shadow-emerald-50/50' : 'bg-slate-50 text-slate-400 border-slate-200 shadow-inner'}`}
                >
                  {togglingIds.has(city._id) ? <Loader2 size={12} className="animate-spin text-orange-500" /> : <div className={`w-1.5 h-1.5 rounded-full ${city.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />}
                  {city.isActive ? 'Active' : 'Offline'}
                </button>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center justify-end">
                    <button onClick={() => onEditCity(city)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100" title="Refine Metadata">
                      <Edit3 size={15} />
                    </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {cities.length === 0 && <EmptyState icon={<Building2 size={24} />} title="No Districts Found" description="The geography registry is empty for this selection." />}
    </div>

    {/* City Modal */}
    <AnimatePresence>
      {showModal && (
        <Modal title={editingCityId ? 'Refine District Metadata' : 'Establish District Node'} onClose={() => setShowModal(false)}>
          <form onSubmit={onSubmitCity} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Parent Territory</label>
              <select value={selectedStateId} onChange={(e) => setSelectedStateId(e.target.value)}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all cursor-pointer" required>
                <option value="">Select Target Region</option>
                {states.map(s => <option key={s._id} value={s._id}>{s.name.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">District Identifier</label>
              <input type="text" value={newCityName} onChange={(e) => setNewCityName(e.target.value)}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all font-medium"
                placeholder="e.g. IKEJA CENTRAL" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Base Logistics Fee (₦)</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">₦</span>
                <input 
                  type="number" min="0" step="1"
                  onWheel={(e) => e.target.blur()} 
                  value={newPlatformDeliveryFee || 0} 
                  onChange={(e) => setNewPlatformDeliveryFee(e.target.value)}
                  className="w-full h-11 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all" 
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 h-11 bg-white border border-slate-200 text-slate-600 text-[10px] font-extrabold uppercase tracking-widest rounded-xl hover:bg-slate-50 mr-1 transition-colors">Dismiss</button>
              <button type="submit" disabled={loading}
                className="flex-1 h-11 bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-xl hover:bg-orange-600 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : editingCityId ? <Edit3 size={16} /> : <Plus size={16} />}
                {editingCityId ? 'Authorize Update' : 'Initialize Node'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AnimatePresence>
  </motion.div>
);

const PendingRequestsPanel = ({ requests, loading, selectedVendor, setSelectedVendor, showModal, setShowModal, resolveState, setResolveState, resolveCity, setResolveCity, createLocation, setCreateLocation, onApproveVendor, searchTerm, setSearchTerm }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
      <div className="relative max-w-sm flex-1 group">
         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
         <input type="text" placeholder="Scan incoming vectors…" value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 h-11 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 transition-all shadow-sm" />
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[10px] font-extrabold text-orange-600 uppercase tracking-widest">Admission Queue</span>
        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Active Entrance Demands</span>
      </div>
    </div>

    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full">
        <thead>
          <tr>
            <Th>Vector Identity</Th>
            <Th>Target coordinates</Th>
            <Th center>Log Entry</Th>
            <Th right>Operations</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 font-medium whitespace-nowrap">
          {requests.map(vendor => (
            <tr key={vendor._id} className="hover:bg-slate-50 transition-all group">
              <td className="py-4 px-4 font-extrabold text-slate-900 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                  <Users size={15} />
                </div>
                <div>
                  <span className="uppercase tracking-tight block">{vendor.storeName}</span>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Entry Agent</span>
                </div>
              </td>
              <td className="py-4 px-4 uppercase font-bold text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="opacity-60">{vendor.requestedState}</span>
                  <ChevronRight size={12} className="text-orange-500" />
                  <span className="text-slate-900">{vendor.requestedCity}</span>
                </div>
              </td>
              <td className="py-4 px-4 text-center">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">{new Date(vendor.createdAt).toLocaleDateString()}</span>
              </td>
              <td className="py-4 px-4 text-right">
                <button
                  onClick={() => { setSelectedVendor(vendor); setResolveState(vendor.requestedState); setResolveCity(vendor.requestedCity); setShowModal(true); }}
                  className="px-5 py-2 bg-slate-900 text-white text-[9px] font-extrabold uppercase tracking-[0.2em] rounded-xl hover:bg-orange-600 transition-all shadow-lg active:scale-95">
                  Resolution
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {requests.length === 0 && <EmptyState icon={<CheckCircle2 size={24} />} title="Registry Saturated" description="Zero pending entrance requests detected in the queue." success />}
    </div>

    {/* Resolve Modal */}
    <AnimatePresence>
      {showModal && selectedVendor && (
        <Modal title={`Resolution Matrix: ${selectedVendor.storeName}`} onClose={() => { setShowModal(false); setSelectedVendor(null); }}>
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3.5 shadow-inner">
              <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1">Signal Inputs</p>
              <p className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">{selectedVendor.requestedState}, {selectedVendor.requestedCity}</p>
            </div>
            <div className="space-y-4 pt-1">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Authorized Province</label>
                <input type="text" value={resolveState} onChange={(e) => setResolveState(e.target.value)}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-orange-500 transition-all"
                  placeholder={selectedVendor.requestedState} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Authorized District</label>
                <input type="text" value={resolveCity} onChange={(e) => setResolveCity(e.target.value)}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-orange-500 transition-all"
                  placeholder={selectedVendor.requestedCity} />
              </div>
              <label className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-orange-50 transition-all group">
                <div className="relative flex items-center">
                  <input type="checkbox" checked={createLocation} onChange={(e) => setCreateLocation(e.target.checked)}
                    className="w-5 h-5 rounded-lg border-2 border-slate-300 text-orange-600 focus:ring-orange-500 transition-all cursor-pointer" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-900 uppercase tracking-widest block">Auto-Establish Node</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-tighter">Register coordinates if missing in core registry</span>
                </div>
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowModal(false); setSelectedVendor(null); }}
                className="flex-1 h-11 bg-white border border-slate-200 text-slate-600 text-[10px] font-extrabold uppercase tracking-widest rounded-xl hover:bg-slate-50 ml-1">Abort</button>
              <button onClick={onApproveVendor} disabled={loading}
                className="flex-1 h-11 bg-emerald-700 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-xl hover:bg-emerald-800 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Authorize Vector
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AnimatePresence>
  </motion.div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   SHARED UI ELEMENTS (MODAL, EMPTY, ETC)
   ───────────────────────────────────────────────────────────────────────────── */

const EmptyState = ({ icon, title, description, success }) => (
  <div className="text-center py-20 bg-slate-50/30">
    <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm border ${success ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-white text-slate-300 border-slate-100'}`}>
      {icon}
    </div>
    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-1">{title}</h3>
    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60">{description}</p>
  </div>
);

const Modal = ({ title, children, onClose }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4" onClick={onClose}>
    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-white/20">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-orange-500 transition-all shadow-sm">
          <X size={18} />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  </motion.div>
);

export default function AdminLocationPage() {
  return (
    <AdminProtectedRoute>
      <AdminDashboardLayout>
        <AdminLocationManagement />
      </AdminDashboardLayout>
    </AdminProtectedRoute>
  );
}
