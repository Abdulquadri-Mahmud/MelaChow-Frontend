"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus, Loader2, CheckCircle2, Clock, Building2, Navigation,
  AlertTriangle, Search, Filter, X, MapPin, Users, Calendar,
  Eye, EyeOff, Edit3, RefreshCw, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";

function AdminLocationManagement() {
  const [activeTab, setActiveTab] = useState('states');
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
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

  useEffect(() => {
    setLoading(true);
    const init = async () => {
      try {
        await Promise.all([fetchStates(), fetchCities(), fetchPendingRequests()]);
        setBackendStatus('available');
      } catch (err) {
        console.error('Initialization error:', err);
        setBackendStatus('error');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchStates = async () => {
    try {
      const data = await adminApi.getAllStates();
      if (data.success) setStates(data.states || []);
    } catch (err) { console.error('Error fetching states:', err); }
  };

  const fetchCities = async () => {
    try {
      const data = await adminApi.getAllCities();
      if (data.success) setCities(data.cities || []);
    } catch (err) { console.error('Error fetching cities:', err); }
  };

  const fetchPendingRequests = async () => {
    try {
      const data = await adminApi.getLocationRequests();
      if (data.success) setPendingRequests(data.vendors || []);
    } catch (err) { console.error('Error fetching pending requests:', err); }
  };

  const createState = async (e) => {
    e.preventDefault();
    if (!newStateName.trim()) { toast.error('Please enter a state name'); return; }
    try {
      setLoading(true);
      const data = await adminApi.createState({ name: newStateName.trim() });
      if (data.success) {
        toast.success('State created');
        setNewStateName('');
        setShowStateModal(false);
        fetchStates();
      } else { toast.error(data.message || 'Failed to create state'); }
    } catch (err) { toast.error(err.message || 'Error creating state'); }
    finally { setLoading(false); }
  };

  const submitCity = async (e) => {
    e.preventDefault();
    if (!newCityName.trim() || !selectedStateId) { toast.error('Please fill in all fields'); return; }
    try {
      setLoading(true);
      const payload = { name: newCityName.trim(), stateId: selectedStateId, platformDeliveryFee: Number(newPlatformDeliveryFee) || 0 };
      const data = editingCityId
        ? await adminApi.updateCity(editingCityId, payload)
        : await adminApi.createCity(payload);
      if (data.success) {
        toast.success(editingCityId ? 'City updated' : 'City created');
        resetCityForm();
        fetchCities();
        fetchStates();
      } else { toast.error(data.message || 'Failed to save city'); }
    } catch (err) { toast.error(err.message || 'Error saving city'); }
    finally { setLoading(false); }
  };

  const handleEditCity = (city) => {
    setEditingCityId(city._id);
    setNewCityName(city.name);
    setSelectedStateId(city.stateId?._id || city.stateId || '');
    setNewPlatformDeliveryFee(city.platformDeliveryFee || 0);
    setShowCityModal(true);
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
    // Optimistic update
    setStates(prev => prev.map(s => s._id === stateId ? { ...s, isActive: newStatus } : s));
    try {
      await adminApi.toggleStateStatus(stateId, newStatus);
      toast.success(newStatus ? 'State activated' : 'State deactivated');
    } catch (err) {
      // Revert
      setStates(prev => prev.map(s => s._id === stateId ? { ...s, isActive: !newStatus } : s));
      toast.error(err.message || 'Error updating state status');
    } finally {
      setTogglingStateIds(prev => { const n = new Set(prev); n.delete(stateId); return n; });
    }
  };

  const toggleCityStatus = async (cityId, newStatus) => {
    if (togglingCityIds.has(cityId)) return;
    setTogglingCityIds(prev => new Set(prev).add(cityId));
    // Optimistic update
    setCities(prev => prev.map(c => c._id === cityId ? { ...c, isActive: newStatus } : c));
    try {
      await adminApi.toggleCityStatus(cityId, newStatus);
      toast.success(newStatus ? 'City activated' : 'City deactivated');
    } catch (err) {
      // Revert
      setCities(prev => prev.map(c => c._id === cityId ? { ...c, isActive: !newStatus } : c));
      toast.error(err.message || 'Error updating city status');
    } finally {
      setTogglingCityIds(prev => { const n = new Set(prev); n.delete(cityId); return n; });
    }
  };

  const approveVendor = async () => {
    if (!selectedVendor || !resolveState.trim() || !resolveCity.trim()) { toast.error('Please fill in all fields'); return; }
    try {
      setLoading(true);
      const data = await adminApi.approveVendorLocation(selectedVendor._id, {
        state: resolveState.trim(), city: resolveCity.trim(), createLocation
      });
      if (data.success) {
        toast.success('Vendor approved ✅');
        setSelectedVendor(null);
        setResolveState(''); setResolveCity(''); setCreateLocation(false);
        setShowRequestModal(false);
        fetchPendingRequests();
      } else { toast.error(data.message || 'Failed to approve vendor'); }
    } catch (err) { toast.error(err.message || 'Error approving vendor'); }
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

  const stats = useMemo(() => ({
    totalStates: states.length,
    activeStates: states.filter(s => s.isActive).length,
    totalCities: cities.length,
    activeCities: cities.filter(c => c.isActive).length,
    pendingRequests: pendingRequests.length
  }), [states, cities, pendingRequests]);

  if (backendStatus === 'checking') {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400 mr-3" />
        <span className="text-slate-500 text-sm font-medium">Loading locations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Location Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage active states, cities, and vendor location requests</p>
        </div>
        <button
          onClick={() => { fetchStates(); fetchCities(); fetchPendingRequests(); toast.success('Refreshed'); }}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total States', value: stats.totalStates, icon: <Navigation size={14} /> },
          { label: 'Active States', value: stats.activeStates, icon: <CheckCircle2 size={14} />, accent: true },
          { label: 'Total Cities', value: stats.totalCities, icon: <Building2 size={14} /> },
          { label: 'Active Cities', value: stats.activeCities, icon: <MapPin size={14} />, accent: true },
          { label: 'Pending', value: stats.pendingRequests, icon: <Clock size={14} />, warn: stats.pendingRequests > 0 },
        ].map((s, i) => (
          <div key={i} className={`bg-white border rounded-lg px-4 py-3 ${s.warn ? 'border-amber-300 bg-amber-50' : 'border-slate-200'}`}>
            <div className={`flex items-center gap-1.5 text-xs font-medium mb-1 ${s.warn ? 'text-amber-600' : 'text-slate-500'}`}>
              {s.icon} {s.label}
            </div>
            <p className={`text-2xl font-bold ${s.warn ? 'text-amber-700' : s.accent ? 'text-emerald-700' : 'text-slate-900'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tab Container */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          {[
            { key: 'states', label: 'States', count: filteredStates.length, icon: <Navigation size={14} /> },
            { key: 'cities', label: 'Cities', count: filteredCities.length, icon: <Building2 size={14} /> },
            { key: 'requests', label: 'Pending Requests', count: filteredRequests.length, icon: <Clock size={14} />, badge: filteredRequests.length > 0 },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === tab.key
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${tab.badge ? 'bg-amber-500 text-white' : activeTab === tab.key ? 'bg-slate-100 text-slate-600' : 'bg-slate-200 text-slate-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4">
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
                onCreateState={createState}
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
                onSubmitCity={submitCity}
                onEditCity={handleEditCity}
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
                onApproveVendor={approveVendor}
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

// ─── States Panel ────────────────────────────────────────────────
const StatesPanel = ({ states, loading, onToggleStatus, togglingIds, showModal, setShowModal, newStateName, setNewStateName, onCreateState, searchTerm, setSearchTerm, filter, setFilter }) => (
  <motion.div key="states" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
    {/* Toolbar */}
    <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text" placeholder="Search states..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 h-9 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-slate-900 transition-colors"
          />
        </div>
        <div className="flex bg-slate-100 p-0.5 rounded-md">
          {['all', 'active', 'inactive'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-xs font-medium capitalize transition-all ${filter === f ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <button onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
        <Plus size={15} /> Add State
      </button>
    </div>

    {/* States Table */}
    {loading ? (
      <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400 mr-2" /><span className="text-slate-500 text-sm">Loading...</span></div>
    ) : states.length === 0 ? (
      <EmptyState icon={<Navigation size={20} />} title="No states found" description="Create your first state to get started" />
    ) : (
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">State</th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cities</th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
              <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {states.map(state => (
              <tr key={state._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${state.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Navigation size={13} />
                    </div>
                    <span className="font-semibold text-sm text-slate-900">{state.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-slate-500">{state.cities?.length ?? '—'}</span>
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => onToggleStatus(state._id, !state.isActive)}
                    disabled={togglingIds.has(state._id)}
                    title={state.isActive ? 'Click to deactivate' : 'Click to activate'}
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-medium transition-all cursor-pointer disabled:cursor-wait ${state.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'}`}
                  >
                    {togglingIds.has(state._id) ? <Loader2 size={10} className="animate-spin" /> : <span className={`w-1.5 h-1.5 rounded-full ${state.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />}
                    {state.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs text-slate-500">{new Date(state.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-xs text-slate-400 italic">Click status to toggle</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {/* Create State Modal */}
    <AnimatePresence>
      {showModal && (
        <Modal title="Add State" onClose={() => setShowModal(false)}>
          <form onSubmit={onCreateState} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">State Name <span className="text-red-500">*</span></label>
              <input type="text" value={newStateName} onChange={(e) => setNewStateName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all"
                placeholder="e.g., Lagos" required autoFocus />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
              <button type="submit" disabled={loading}
                className="flex-1 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Create State
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AnimatePresence>
  </motion.div>
);

// ─── Cities Panel ────────────────────────────────────────────────
const CitiesPanel = ({ cities, states, loading, onToggleStatus, togglingIds, showModal, setShowModal, newCityName, setNewCityName, selectedStateId, setSelectedStateId, newPlatformDeliveryFee, setNewPlatformDeliveryFee, editingCityId, onSubmitCity, onEditCity, searchTerm, setSearchTerm, filter, setFilter, stateFilter, setStateFilter }) => (
  <motion.div key="cities" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
    {/* Toolbar */}
    <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
      <div className="flex flex-wrap flex-1 items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search cities..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 h-9 w-48 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-slate-900 transition-colors" />
        </div>
        <div className="flex bg-slate-100 p-0.5 rounded-md">
          {['all', 'active', 'inactive'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-xs font-medium capitalize transition-all ${filter === f ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
              {f}
            </button>
          ))}
        </div>
        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}
          className="h-9 px-3 border border-slate-200 rounded-md text-sm text-slate-600 bg-white outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer">
          <option value="all">All States</option>
          {states.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>
      <button onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
        <Plus size={15} /> Add City
      </button>
    </div>

    {/* Cities Table */}
    {loading ? (
      <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400 mr-2" /><span className="text-slate-500 text-sm">Loading...</span></div>
    ) : cities.length === 0 ? (
      <EmptyState icon={<Building2 size={20} />} title="No cities found" description="Create your first city to get started" />
    ) : (
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">City</th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">State</th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform Fee</th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cities.map(city => {
              const fmt = (v) => new Intl.NumberFormat().format(v || 0);
              return (
                <tr key={city._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${city.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Building2 size={13} />
                      </div>
                      <span className="font-semibold text-sm text-slate-900">{city.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">{city.stateId?.name || '—'}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm font-semibold text-slate-900">₦{fmt(city.platformDeliveryFee)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onToggleStatus(city._id, !city.isActive)}
                      disabled={togglingIds.has(city._id)}
                      title={city.isActive ? 'Click to deactivate' : 'Click to activate'}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-medium transition-all cursor-pointer disabled:cursor-wait ${city.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'}`}
                    >
                      {togglingIds.has(city._id) ? <Loader2 size={10} className="animate-spin" /> : <span className={`w-1.5 h-1.5 rounded-full ${city.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />}
                      {city.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => onEditCity(city)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                      <Edit3 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}

    {/* City Modal */}
    <AnimatePresence>
      {showModal && (
        <Modal title={editingCityId ? 'Edit City' : 'Add City'} onClose={() => setShowModal(false)}>
          <form onSubmit={onSubmitCity} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">State <span className="text-red-500">*</span></label>
              <select value={selectedStateId} onChange={(e) => setSelectedStateId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-white" required>
                <option value="">Select State</option>
                {states.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City Name <span className="text-red-500">*</span></label>
              <input type="text" value={newCityName} onChange={(e) => setNewCityName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                placeholder="e.g., Ikeja" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Platform Delivery Fee (₦)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₦</span>
                <input type="number" value={newPlatformDeliveryFee} onChange={(e) => setNewPlatformDeliveryFee(e.target.value)}
                  className="w-full pl-7 pr-4 py-2 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900" placeholder="0" />
              </div>
              <p className="text-xs text-slate-400 mt-1">Applies to all admin-managed deliveries in this city.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
              <button type="submit" disabled={loading}
                className="flex-1 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={14} className="animate-spin" /> : editingCityId ? <Edit3 size={14} /> : <Plus size={14} />}
                {editingCityId ? 'Update City' : 'Create City'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AnimatePresence>
  </motion.div>
);

// ─── Pending Requests Panel ───────────────────────────────────────
const PendingRequestsPanel = ({ requests, loading, selectedVendor, setSelectedVendor, showModal, setShowModal, resolveState, setResolveState, resolveCity, setResolveCity, createLocation, setCreateLocation, onApproveVendor, searchTerm, setSearchTerm }) => (
  <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
    <div className="relative max-w-xs">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input type="text" placeholder="Search requests..." value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-9 pr-4 h-9 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-slate-900 transition-colors" />
    </div>

    {loading ? (
      <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400 mr-2" /><span className="text-slate-500 text-sm">Loading...</span></div>
    ) : requests.length === 0 ? (
      <EmptyState icon={<CheckCircle2 size={20} />} title="No pending requests" description="All location requests have been processed" success />
    ) : (
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendor</th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Requested Location</th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map(vendor => (
              <tr key={vendor._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                      <Users size={13} />
                    </div>
                    <span className="font-semibold text-sm text-slate-900">{vendor.storeName}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <span>{vendor.requestedState}</span>
                    <ChevronRight size={12} className="text-slate-400" />
                    <span className="font-medium text-slate-900">{vendor.requestedCity}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs text-slate-400">{new Date(vendor.createdAt).toLocaleDateString()}</span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => { setSelectedVendor(vendor); setResolveState(vendor.requestedState); setResolveCity(vendor.requestedCity); setShowModal(true); }}
                    className="px-3 py-1 bg-slate-900 text-white text-xs font-medium rounded-md hover:bg-slate-800 transition-colors">
                    Resolve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {/* Resolve Modal */}
    <AnimatePresence>
      {showModal && selectedVendor && (
        <Modal title={`Resolve: ${selectedVendor.storeName}`} onClose={() => { setShowModal(false); setSelectedVendor(null); setResolveState(''); setResolveCity(''); setCreateLocation(false); }}>
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
              <p className="text-xs font-medium text-amber-700 mb-0.5">Requested Location</p>
              <p className="text-sm font-semibold text-amber-900">{selectedVendor.requestedState}, {selectedVendor.requestedCity}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">State <span className="text-red-500">*</span></label>
              <input type="text" value={resolveState} onChange={(e) => setResolveState(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-slate-900"
                placeholder={selectedVendor.requestedState} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City <span className="text-red-500">*</span></label>
              <input type="text" value={resolveCity} onChange={(e) => setResolveCity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-slate-900"
                placeholder={selectedVendor.requestedCity} />
            </div>
            <label className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
              <input type="checkbox" checked={createLocation} onChange={(e) => setCreateLocation(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300" />
              <span className="text-sm text-slate-700">Create location if it doesn't exist</span>
            </label>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => { setShowModal(false); setSelectedVendor(null); setResolveState(''); setResolveCity(''); setCreateLocation(false); }}
                className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={onApproveVendor} disabled={loading}
                className="flex-1 py-2 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Approve Vendor
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AnimatePresence>
  </motion.div>
);

// ─── Shared Components ────────────────────────────────────────────
const EmptyState = ({ icon, title, description, success }) => (
  <div className="text-center py-14">
    <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-3 ${success ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
      {icon}
    </div>
    <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
    <p className="text-xs text-slate-500">{description}</p>
  </div>
);

const Modal = ({ title, children, onClose }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
    <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white rounded-xl w-full max-w-md overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">
          <X size={18} />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  </motion.div>
);

const DeactivationConfirmModal = ({ item, onClose, onConfirm, loading }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
    <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white rounded-xl p-6 w-full max-w-sm text-center border border-slate-200">
      <div className="mx-auto w-12 h-12 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">Confirm Deactivation</h3>
      <p className="text-sm text-slate-500 mb-5">
        Are you sure you want to deactivate <span className="font-semibold text-slate-900">"{item.name}"</span>?
        This will hide it from vendors and users immediately.
      </p>
      <div className="flex gap-2">
        <button onClick={onClose}
          className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <EyeOff size={14} />}
          Deactivate
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ─── Export ───────────────────────────────────────────────────────
export default function AdminLocationPage() {
  return (
    <AdminProtectedRoute>
      <AdminDashboardLayout>
        <AdminLocationManagement />
      </AdminDashboardLayout>
    </AdminProtectedRoute>
  );
}
