"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus, Loader2, CheckCircle2, Clock, Building2, Navigation,
  AlertTriangle, ExternalLink, Code, Database, Search, Filter,
  X, MapPin, TrendingUp, Users, Calendar, Eye, EyeOff, Trash2,
  Edit3, MoreVertical, Download, Upload, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";
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

  // Search and filter states
  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [requestSearch, setRequestSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('all'); // all, active, inactive
  const [cityFilter, setCityFilter] = useState('all');
  const [cityStateFilter, setCityStateFilter] = useState('all'); // filter cities by state

  // Modal states
  const [showStateModal, setShowStateModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(null); // { type: 'state'|'city', id, name }

  // Form states
  const [newStateName, setNewStateName] = useState('');
  const [newCityName, setNewCityName] = useState('');
  const [selectedStateId, setSelectedStateId] = useState('');
  const [newPlatformDeliveryFee, setNewPlatformDeliveryFee] = useState(0);
  const [editingCityId, setEditingCityId] = useState(null);

  const [resolveState, setResolveState] = useState('');
  const [resolveCity, setResolveCity] = useState('');
  const [createLocation, setCreateLocation] = useState(false);

  const baseUrl = "https://grub-dash-api.vercel.app/api";

  useEffect(() => {
    setLoading(true);
    const init = async () => {
      try {
        await Promise.all([
          fetchStates(),
          fetchCities(),
          fetchPendingRequests()
        ]);
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
      if (data.success) {
        setStates(data.states || []);
      }
    } catch (err) {
      console.error('Error fetching states:', err);
    }
  };

  const fetchCities = async () => {
    try {
      const data = await adminApi.getAllCities();
      if (data.success) {
        setCities(data.cities || []);
      }
    } catch (err) {
      console.error('Error fetching cities:', err);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await axios.get(`${baseUrl}/admin/locations/location-requests`, {
        withCredentials: true
      });
      if (response.data.success) {
        setPendingRequests(response.data.vendors || []);
      }
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    }
  };

  const createState = async (e) => {
    e.preventDefault();
    if (!newStateName.trim()) {
      toast.error('Please enter a state name');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${baseUrl}/admin/locations/states`, {
        name: newStateName.trim()
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        toast.success('State created successfully! 🎉');
        setNewStateName('');
        setShowStateModal(false);
        fetchStates();
      } else {
        toast.error(response.data.message || 'Failed to create state');
      }
    } catch (err) {
      console.error('Error creating state:', err);
      toast.error(err.response?.data?.message || 'Error creating state');
    } finally {
      setLoading(false);
    }
  };

  const submitCity = async (e) => {
    e.preventDefault();
    if (!newCityName.trim() || !selectedStateId) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: newCityName.trim(),
        stateId: selectedStateId,
        platformDeliveryFee: Number(newPlatformDeliveryFee) || 0
      };

      if (editingCityId) {
        const response = await axios.patch(`${baseUrl}/admin/locations/cities/${editingCityId}`, payload, {
          withCredentials: true
        });

        if (response.data.success) {
          toast.success('City updated successfully! 🎉');
          resetCityForm();
          fetchCities();
          fetchStates();
        } else {
          toast.error(response.data.message || 'Failed to update city');
        }
      } else {
        const response = await axios.post(`${baseUrl}/admin/locations/cities`, payload, {
          withCredentials: true
        });

        if (response.data.success) {
          toast.success('City created successfully! 🎉');
          resetCityForm();
          fetchCities();
          fetchStates();
        } else {
          toast.error(response.data.message || 'Failed to create city');
        }
      }
    } catch (err) {
      console.error('Error saving city:', err);
      toast.error(err.response?.data?.message || 'Error saving city');
    } finally {
      setLoading(false);
    }
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

  const toggleStateStatus = async (stateId, currentStatus) => {
    if (currentStatus && !confirmDeactivate) {
      const state = states.find(s => s._id === stateId);
      setConfirmDeactivate({ type: 'state', id: stateId, name: state?.name });
      return;
    }

    try {
      const data = await adminApi.toggleStateStatus(stateId, !currentStatus);

      if (data.success) {
        toast.success(`State ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
        fetchStates();
        setConfirmDeactivate(null);
      } else {
        toast.error('Failed to update state status');
      }
    } catch (err) {
      console.error('Error updating state:', err);
      toast.error('Error updating state status');
    }
  };

  const toggleCityStatus = async (cityId, currentStatus) => {
    if (currentStatus && !confirmDeactivate) {
      const city = cities.find(c => c._id === cityId);
      setConfirmDeactivate({ type: 'city', id: cityId, name: city?.name });
      return;
    }

    try {
      const data = await adminApi.toggleCityStatus(cityId, !currentStatus);

      if (data.success) {
        toast.success(`City ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
        fetchCities();
        setConfirmDeactivate(null);
      } else {
        toast.error('Failed to update city status');
      }
    } catch (err) {
      console.error('Error updating city:', err);
      toast.error('Error updating city status');
    }
  };

  const approveVendor = async () => {
    if (!selectedVendor || !resolveState.trim() || !resolveCity.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.patch(`${baseUrl}/admin/vendors/approve?vendorId=${selectedVendor._id}`, {
        state: resolveState.trim(),
        city: resolveCity.trim(),
        createLocation
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        toast.success('Vendor approved successfully! ✅');
        setSelectedVendor(null);
        setResolveState('');
        setResolveCity('');
        setCreateLocation(false);
        setShowRequestModal(false);
        fetchPendingRequests();
      } else {
        toast.error(response.data.message || 'Failed to approve vendor');
      }
    } catch (err) {
      console.error('Error approving vendor:', err);
      toast.error(err.response?.data?.message || 'Error approving vendor');
    } finally {
      setLoading(false);
    }
  };

  // Filtered and searched data
  const filteredStates = useMemo(() => {
    return states.filter(state => {
      const matchesSearch = state.name.toLowerCase().includes(stateSearch.toLowerCase());
      const matchesFilter = stateFilter === 'all' ||
        (stateFilter === 'active' && state.isActive) ||
        (stateFilter === 'inactive' && !state.isActive);
      return matchesSearch && matchesFilter;
    });
  }, [states, stateSearch, stateFilter]);

  const filteredCities = useMemo(() => {
    return cities.filter(city => {
      const matchesSearch = city.name.toLowerCase().includes(citySearch.toLowerCase());
      const matchesFilter = cityFilter === 'all' ||
        (cityFilter === 'active' && city.isActive) ||
        (cityFilter === 'inactive' && !city.isActive);
      const matchesStateFilter = cityStateFilter === 'all' || city.stateId?._id === cityStateFilter;
      return matchesSearch && matchesFilter && matchesStateFilter;
    });
  }, [cities, citySearch, cityFilter, cityStateFilter]);

  const filteredRequests = useMemo(() => {
    return pendingRequests.filter(request => {
      const matchesSearch =
        request.storeName?.toLowerCase().includes(requestSearch.toLowerCase()) ||
        request.requestedState?.toLowerCase().includes(requestSearch.toLowerCase()) ||
        request.requestedCity?.toLowerCase().includes(requestSearch.toLowerCase());
      return matchesSearch;
    });
  }, [pendingRequests, requestSearch]);

  // Statistics
  const stats = useMemo(() => ({
    totalStates: states.length,
    activeStates: states.filter(s => s.isActive).length,
    totalCities: cities.length,
    activeCities: cities.filter(c => c.isActive).length,
    pendingRequests: pendingRequests.length
  }), [states, cities, pendingRequests]);

  // If checking backend status
  if (backendStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Synchronizing Locations...</p>
        </div>
      </div>
    );
  }

  // If unauthorized
  if (backendStatus === 'unauthorized') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/20 to-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mx-auto flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 font-medium">You don't have permission to access location management.</p>
        </motion.div>
      </div>
    );
  }

  // Main interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/10 to-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              Location Management
            </h1>
            <p className="text-gray-600 font-medium">Manage states, cities, and location requests</p>
          </div>

          <button
            onClick={() => {
              fetchStates();
              fetchCities();
              fetchPendingRequests();
              toast.success('Data refreshed!');
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl hover:border-orange-500 hover:text-orange-600 transition-all font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          <StatCard
            icon={<Navigation className="w-5 h-5" />}
            label="Total States"
            value={stats.totalStates}
            color="blue"
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            label="Active States"
            value={stats.activeStates}
            color="green"
          />
          <StatCard
            icon={<Building2 className="w-5 h-5" />}
            label="Total Cities"
            value={stats.totalCities}
            color="purple"
          />
          <StatCard
            icon={<MapPin className="w-5 h-5" />}
            label="Active Cities"
            value={stats.activeCities}
            color="emerald"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Pending"
            value={stats.pendingRequests}
            color="orange"
            highlight={stats.pendingRequests > 0}
          />
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl border border-gray-100 overflow-hidden"
        >
          <div className="flex border-b border-gray-100 overflow-x-auto">
            <TabButton
              active={activeTab === 'states'}
              onClick={() => setActiveTab('states')}
              icon={<Navigation className="w-4 h-4" />}
              label="States"
              count={filteredStates.length}
            />
            <TabButton
              active={activeTab === 'cities'}
              onClick={() => setActiveTab('cities')}
              icon={<Building2 className="w-4 h-4" />}
              label="Cities"
              count={filteredCities.length}
            />
            <TabButton
              active={activeTab === 'requests'}
              onClick={() => setActiveTab('requests')}
              icon={<Clock className="w-4 h-4" />}
              label="Pending Requests"
              count={filteredRequests.length}
              highlight={filteredRequests.length > 0}
            />
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'states' && (
                <StatesPanel
                  states={filteredStates}
                  loading={loading}
                  onToggleStatus={toggleStateStatus}
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
                  cities={filteredCities}
                  states={states}
                  loading={loading}
                  onToggleStatus={toggleCityStatus}
                  showModal={showCityModal}
                  setShowModal={(val) => {
                    if (!val) resetCityForm();
                    else setShowCityModal(true);
                  }}
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
        </motion.div>

        {/* Deactivation Confirmation Modal */}
        <AnimatePresence>
          {confirmDeactivate && (
            <DeactivationConfirmModal
              item={confirmDeactivate}
              onClose={() => setConfirmDeactivate(null)}
              onConfirm={() => {
                if (confirmDeactivate.type === 'state') {
                  toggleStateStatus(confirmDeactivate.id, true);
                } else {
                  toggleCityStatus(confirmDeactivate.id, true);
                }
              }}
              loading={loading}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Stat Card Component
const StatCard = ({ icon, label, value, color, highlight }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    emerald: 'from-emerald-500 to-emerald-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className={`bg-white rounded-2xl p-4 border-2 ${highlight ? 'border-orange-500' : 'border-gray-100'} transition-all`}
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</p>
    </motion.div>
  );
};

// Tab Button Component
const TabButton = ({ active, onClick, icon, label, count, highlight }) => (
  <button
    onClick={onClick}
    className={`relative px-6 py-4 text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${active
      ? 'text-orange-600 bg-orange-50'
      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
  >
    {icon}
    <span>{label}</span>
    {count !== undefined && (
      <span className={`px-2 py-0.5 rounded-full text-xs font-black ${active
        ? 'bg-orange-500 text-white'
        : highlight
          ? 'bg-orange-500 text-white'
          : 'bg-gray-200 text-gray-600'
        }`}>
        {count}
      </span>
    )}
    {active && (
      <motion.div
        layoutId="activeTab"
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-t-full"
      />
    )}
  </button>
);

// States Panel Component
const StatesPanel = ({
  states, loading, onToggleStatus,
  showModal, setShowModal, newStateName, setNewStateName, onCreateState,
  searchTerm, setSearchTerm, filter, setFilter
}) => (
  <motion.div
    key="states"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="space-y-6"
  >
    {/* Toolbar */}
    <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
      <div className="flex-1 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search states..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none transition-all font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-12 pr-10 py-3 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none transition-all font-bold appearance-none cursor-pointer"
          >
            <option value="all">All States</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all font-bold"
      >
        <Plus className="w-5 h-5" />
        Add State
      </button>
    </div>

    {/* States Grid */}
    {loading ? (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    ) : states.length === 0 ? (
      <EmptyState
        icon={<Navigation className="w-12 h-12" />}
        title="No states found"
        description="Get started by creating your first state"
      />
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {states.map((state, index) => (
          <StateCard
            key={state._id}
            state={state}
            index={index}
            onToggleStatus={onToggleStatus}
          />
        ))}
      </div>
    )}

    {/* Create State Modal */}
    <AnimatePresence>
      {showModal && (
        <Modal
          title="Create New State"
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={onCreateState} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">State Name *</label>
              <input
                type="text"
                value={newStateName}
                onChange={(e) => setNewStateName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none transition-all font-medium"
                placeholder="e.g., Lagos"
                required
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create State
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AnimatePresence>
  </motion.div>
);

// State Card Component
const StateCard = ({ state, index, onToggleStatus }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    whileHover={{ y: -4 }}
    className={`group relative bg-white border-2 rounded-2xl p-6 transition-all ${state.isActive
      ? 'border-green-200 hover:border-green-500 hover:shadow-lg hover:shadow-green-500/20'
      : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
      }`}
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${state.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
        }`}>
        <Navigation className="w-6 h-6" />
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-black ${state.isActive
        ? 'bg-green-100 text-green-700'
        : 'bg-gray-100 text-gray-600'
        }`}>
        {state.isActive ? 'Active' : 'Inactive'}
      </span>
    </div>

    <h3 className="text-xl font-black text-gray-900 mb-2">{state.name}</h3>
    <p className="text-sm text-gray-500 font-medium mb-4">
      Created {new Date(state.createdAt).toLocaleDateString()}
    </p>

    <button
      onClick={() => onToggleStatus(state._id, state.isActive)}
      className={`w-full py-2.5 rounded-xl font-bold transition-all ${state.isActive
        ? 'bg-red-50 text-red-600 hover:bg-red-100'
        : 'bg-green-50 text-green-600 hover:bg-green-100'
        }`}
    >
      {state.isActive ? (
        <span className="flex items-center justify-center gap-2">
          <EyeOff className="w-4 h-4" />
          Deactivate
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <Eye className="w-4 h-4" />
          Activate
        </span>
      )}
    </button>
  </motion.div>
);

// Cities Panel Component (similar structure with additional state filter)
const CitiesPanel = ({
  cities, states, loading, onToggleStatus,
  showModal, setShowModal, newCityName, setNewCityName,
  selectedStateId, setSelectedStateId, newPlatformDeliveryFee, setNewPlatformDeliveryFee,
  editingCityId, onSubmitCity, onEditCity,
  searchTerm, setSearchTerm, filter, setFilter, stateFilter, setStateFilter
}) => (
  <motion.div
    key="cities"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="space-y-6"
  >
    {/* Toolbar */}
    <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
      <div className="flex-1 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search cities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none transition-all font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-12 pr-10 py-3 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none transition-all font-bold appearance-none cursor-pointer"
          >
            <option value="all">All Cities</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {/* State Filter */}
        <div className="relative">
          <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="pl-12 pr-10 py-3 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none transition-all font-bold appearance-none cursor-pointer"
          >
            <option value="all">All States</option>
            {states.map(state => (
              <option key={state._id} value={state._id}>{state.name}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all font-bold"
      >
        <Plus className="w-5 h-5" />
        Add City
      </button>
    </div>

    {/* Cities Grid */}
    {loading ? (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    ) : cities.length === 0 ? (
      <EmptyState
        icon={<Building2 className="w-12 h-12" />}
        title="No cities found"
        description="Get started by creating your first city"
      />
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cities.map((city, index) => (
          <CityCard
            key={city._id}
            city={city}
            index={index}
            onToggleStatus={onToggleStatus}
            onEditCity={onEditCity}
          />
        ))}
      </div>
    )}

    {/* Create City Modal */}
    <AnimatePresence>
      {showModal && (
        <Modal
          title={editingCityId ? "Edit City Details" : "Create New City"}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={onSubmitCity} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">State *</label>
              <select
                value={selectedStateId}
                onChange={(e) => setSelectedStateId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none transition-all font-bold appearance-none cursor-pointer"
                required
              >
                <option value="">Select State</option>
                {states.map(state => (
                  <option key={state._id} value={state._id}>{state.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">City Name *</label>
              <input
                type="text"
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none transition-all font-medium"
                placeholder="e.g., Ikeja"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Platform Delivery Fee (₦) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">₦</span>
                <input
                  type="number"
                  value={newPlatformDeliveryFee}
                  onChange={(e) => setNewPlatformDeliveryFee(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none transition-all font-bold"
                  placeholder="0"
                  required
                />
              </div>
              <p className="text-[10px] font-medium text-gray-400 mt-2 ml-1">This rate applies to all admin-managed deliveries in this city.</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all font-bold shadow-lg shadow-orange-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {editingCityId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {editingCityId ? "Update City" : "Create City"}
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AnimatePresence>
  </motion.div>
);

// City Card Component
const CityCard = ({ city, index, onToggleStatus, onEditCity }) => {
  const fmt = (val) => new Intl.NumberFormat().format(val || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className={`group relative bg-white border-2 rounded-2xl p-6 transition-all ${city.isActive
        ? 'border-green-200 hover:border-green-500 hover:shadow-lg hover:shadow-green-500/20'
        : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
        }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${city.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
          }`}>
          <Building2 className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditCity(city)}
            className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors flex items-center justify-center"
          >
            <Edit3 size={16} />
          </button>
          <span className={`px-3 py-1 rounded-full text-xs font-black ${city.isActive
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-600'
            }`}>
            {city.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <h3 className="text-xl font-black text-gray-900 mb-1">{city.name}</h3>
      <p className="text-sm font-bold text-orange-600 mb-3">{city.stateId?.name || 'N/A'}</p>

      <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Platform Rate</span>
          <span className="font-black text-gray-900 text-sm">₦{fmt(city.platformDeliveryFee)}</span>
        </div>
      </div>

      <button
        onClick={() => onToggleStatus(city._id, city.isActive)}
        className={`w-full py-2.5 rounded-xl font-bold transition-all ${city.isActive
          ? 'bg-red-50 text-red-600 hover:bg-red-100'
          : 'bg-green-50 text-green-600 hover:bg-green-100'
          }`}
      >
        {city.isActive ? (
          <span className="flex items-center justify-center gap-2">
            <EyeOff className="w-4 h-4" />
            Deactivate
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Eye className="w-4 h-4" />
            Activate
          </span>
        )}
      </button>
    </motion.div>
  );
};

// Pending Requests Panel Component
const PendingRequestsPanel = ({
  requests, loading, selectedVendor, setSelectedVendor,
  showModal, setShowModal, resolveState, setResolveState,
  resolveCity, setResolveCity, createLocation, setCreateLocation, onApproveVendor,
  searchTerm, setSearchTerm
}) => (
  <motion.div
    key="requests"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="space-y-6"
  >
    {/* Search */}
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        placeholder="Search by store name, state, or city..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none transition-all font-medium"
      />
      {searchTerm && (
        <button
          onClick={() => setSearchTerm('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>

    {/* Requests List */}
    {loading ? (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    ) : requests.length === 0 ? (
      <EmptyState
        icon={<CheckCircle2 className="w-12 h-12" />}
        title="No pending requests"
        description="All location requests have been processed"
        success
      />
    ) : (
      <div className="space-y-4">
        {requests.map((vendor, index) => (
          <RequestCard
            key={vendor._id}
            vendor={vendor}
            index={index}
            onResolve={() => {
              setSelectedVendor(vendor);
              setResolveState(vendor.requestedState);
              setResolveCity(vendor.requestedCity);
              setShowModal(true);
            }}
          />
        ))}
      </div>
    )}

    {/* Resolve Request Modal */}
    <AnimatePresence>
      {showModal && selectedVendor && (
        <Modal
          title={`Resolve Location for ${selectedVendor.storeName}`}
          onClose={() => {
            setShowModal(false);
            setSelectedVendor(null);
            setResolveState('');
            setResolveCity('');
            setCreateLocation(false);
          }}
        >
          <div className="space-y-6">
            <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4">
              <p className="text-sm font-bold text-orange-900 mb-1">Requested Location:</p>
              <p className="text-lg font-black text-orange-600">
                {selectedVendor.requestedState}, {selectedVendor.requestedCity}
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">State *</label>
              <input
                type="text"
                value={resolveState}
                onChange={(e) => setResolveState(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none transition-all font-medium"
                placeholder={selectedVendor.requestedState}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">City *</label>
              <input
                type="text"
                value={resolveCity}
                onChange={(e) => setResolveCity(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none transition-all font-medium"
                placeholder={selectedVendor.requestedCity}
              />
            </div>

            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all">
              <input
                type="checkbox"
                checked={createLocation}
                onChange={(e) => setCreateLocation(e.target.checked)}
                className="w-5 h-5 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
              />
              <span className="text-sm font-bold text-gray-700">
                Create location if it doesn't exist
              </span>
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setSelectedVendor(null);
                  setResolveState('');
                  setResolveCity('');
                  setCreateLocation(false);
                }}
                className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all font-bold"
              >
                Cancel
              </button>
              <button
                onClick={onApproveVendor}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl hover:from-green-600 hover:to-green-700 transition-all font-bold shadow-lg shadow-green-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Vendor
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AnimatePresence>
  </motion.div>
);

// Request Card Component
const RequestCard = ({ vendor, index, onResolve }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    className="bg-white border-2 border-orange-200 rounded-2xl p-6 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/20 transition-all"
  >
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-black text-gray-900 mb-1">{vendor.storeName}</h3>
          <p className="text-sm font-bold text-orange-600 mb-2">
            {vendor.requestedState}, {vendor.requestedCity}
          </p>
          <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(vendor.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <button
        onClick={onResolve}
        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-bold shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
      >
        <CheckCircle2 className="w-4 h-4" />
        Resolve
      </button>
    </div>
  </motion.div>
);

// Deactivation Confirmation Modal Component
const DeactivationConfirmModal = ({ item, onClose, onConfirm, loading }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 20 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl border-2 border-red-50 text-center"
    >
      <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10 text-red-600" />
      </div>

      <h3 className="text-2xl font-black text-gray-900 mb-2">Confirm Deactivation</h3>
      <p className="text-gray-600 font-medium mb-8">
        Are you sure you want to deactivate <span className="font-black text-gray-900">"{item.name}"</span>?
        This will hide it from vendors and users immediately.
      </p>

      <div className="flex flex-col gap-3">
        <button
          onClick={onConfirm}
          disabled={loading}
          className="w-full py-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all font-black shadow-lg shadow-red-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <EyeOff className="w-5 h-5" />}
          Deactivate Now
        </button>
        <button
          onClick={onClose}
          className="w-full py-4 text-gray-500 hover:text-gray-700 transition-all font-bold"
        >
          I changed my mind
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// Empty State Component
const EmptyState = ({ icon, title, description, success }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-20"
  >
    <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${success ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
      }`}>
      {icon}
    </div>
    <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 font-medium">{description}</p>
  </motion.div>
);

// Modal Component
const Modal = ({ title, children, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 20 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-black text-gray-900">{title}</h3>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      {children}
    </motion.div>
  </motion.div>
);

// Main export with proper admin wrappers
export default function AdminLocationPage() {
  return (
    <AdminProtectedRoute>
      <AdminDashboardLayout>
        <AdminLocationManagement />
      </AdminDashboardLayout>
    </AdminProtectedRoute>
  );
}