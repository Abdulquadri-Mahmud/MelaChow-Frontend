"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Loader2, CheckCircle2, Clock, Building2,
  Navigation, AlertTriangle, ExternalLink, Code, Database
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";

function AdminLocationManagement() {
  const [activeTab, setActiveTab] = useState('states');
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');

  // Modal states
  const [showStateModal, setShowStateModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  // Form states
  const [newStateName, setNewStateName] = useState('');
  const [newCityName, setNewCityName] = useState('');
  const [selectedStateId, setSelectedStateId] = useState('');
  const [resolveState, setResolveState] = useState('');
  const [resolveCity, setResolveCity] = useState('');
  const [createLocation, setCreateLocation] = useState(false);

  const baseUrl = "https://grub-dash-api.vercel.app/api";

  useEffect(() => {
    checkBackendEndpoints();
  }, []);

  const checkBackendEndpoints = async () => {
    setLoading(true);
    try {
      // Test if the admin location endpoints exist
      const response = await axios.get(`${baseUrl}/admin/locations/states`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setBackendStatus('available');
        fetchStates();
        fetchCities();
        fetchPendingRequests();
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setBackendStatus('not-implemented');
      } else if (err.response?.status === 401) {
        setBackendStatus('unauthorized');
      } else {
        setBackendStatus('error');
      }
      console.error('Backend endpoints not available:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStates = async () => {
    try {
      const response = await axios.get(`${baseUrl}/admin/locations/states`, {
        withCredentials: true
      });
      if (response.data.success) {
        setStates(response.data.states || []);
      }
    } catch (err) {
      console.error('Error fetching states:', err);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await axios.get(`${baseUrl}/admin/locations/cities`, {
        withCredentials: true
      });
      if (response.data.success) {
        setCities(response.data.cities || []);
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
        toast.success('State created successfully!');
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

  const createCity = async (e) => {
    e.preventDefault();
    if (!newCityName.trim() || !selectedStateId) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${baseUrl}/admin/locations/cities`, {
        name: newCityName.trim(),
        stateId: selectedStateId
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        toast.success('City created successfully!');
        setNewCityName('');
        setSelectedStateId('');
        setShowCityModal(false);
        fetchCities();
      } else {
        toast.error(response.data.message || 'Failed to create city');
      }
    } catch (err) {
      console.error('Error creating city:', err);
      toast.error(err.response?.data?.message || 'Error creating city');
    } finally {
      setLoading(false);
    }
  };

  const toggleStateStatus = async (stateId, currentStatus) => {
    try {
      const response = await axios.patch(`${baseUrl}/admin/locations/states/${stateId}/activate`, {
        isActive: !currentStatus
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        toast.success(`State ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
        fetchStates();
      } else {
        toast.error('Failed to update state status');
      }
    } catch (err) {
      console.error('Error updating state:', err);
      toast.error('Error updating state status');
    }
  };

  const toggleCityStatus = async (cityId, currentStatus) => {
    try {
      const response = await axios.patch(`${baseUrl}/admin/locations/cities/${cityId}/activate`, {
        isActive: !currentStatus
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        toast.success(`City ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
        fetchCities();
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
        toast.success('Vendor approved successfully!');
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

  // If backend endpoints are not implemented, show implementation guide
  if (backendStatus === 'not-implemented') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Location Management</h1>
            <p className="text-gray-600">Database-driven location system for managing states and cities</p>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Backend Implementation Required</h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                The admin location management endpoints are not yet implemented on the backend. 
                The frontend is ready and waiting for the backend API endpoints.
              </p>

              {/* Implementation Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mx-auto mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-900 mb-1">Frontend Complete</h3>
                  <p className="text-sm text-green-700">
                    ✅ User address components updated<br/>
                    ✅ Admin location management UI<br/>
                    ✅ Reusable location components<br/>
                    ✅ Dynamic location fetching
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full mx-auto mb-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold text-yellow-900 mb-1">Backend Pending</h3>
                  <p className="text-sm text-yellow-700">
                    ⏳ Admin location endpoints<br/>
                    ⏳ State/city CRUD operations<br/>
                    ⏳ Location request management<br/>
                    ⏳ Database schema updates
                  </p>
                </div>
              </div>

              {/* Required Endpoints */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Required Backend Endpoints
                </h3>
                
                <div className="text-left space-y-2 text-sm font-mono bg-white rounded border p-4">
                  <div className="text-green-600">GET    /api/admin/locations/states</div>
                  <div className="text-blue-600">POST   /api/admin/locations/states</div>
                  <div className="text-orange-600">PATCH  /api/admin/locations/states/:id/activate</div>
                  <div className="text-green-600">GET    /api/admin/locations/cities</div>
                  <div className="text-blue-600">POST   /api/admin/locations/cities</div>
                  <div className="text-orange-600">PATCH  /api/admin/locations/cities/:id/activate</div>
                  <div className="text-green-600">GET    /api/admin/locations/location-requests</div>
                  <div className="text-orange-600">PATCH  /api/admin/vendors/approve?vendorId=...</div>
                </div>
              </div>

              {/* Current Working Features */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Currently Working Features
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="text-left">
                    <h4 className="font-semibold text-blue-900 mb-2">User Components:</h4>
                    <ul className="space-y-1 text-blue-700">
                      <li>✅ Address Modal (dynamic locations)</li>
                      <li>✅ User Address Management</li>
                      <li>✅ Vendor Registration</li>
                      <li>✅ Location Selector Component</li>
                    </ul>
                  </div>
                  
                  <div className="text-left">
                    <h4 className="font-semibold text-blue-900 mb-2">API Integration:</h4>
                    <ul className="space-y-1 text-blue-700">
                      <li>✅ GET /api/user/locations</li>
                      <li>✅ Location Service utilities</li>
                      <li>✅ Error handling & loading states</li>
                      <li>✅ Form validation</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <button
                  onClick={() => window.open('https://github.com/your-repo/backend', '_blank')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Backend Repository
                </button>
                
                <button
                  onClick={checkBackendEndpoints}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Check Backend Status
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If checking backend status
  if (backendStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Checking Backend Status</h2>
          <p className="text-gray-600">Verifying admin location endpoints...</p>
        </div>
      </div>
    );
  }

  // If unauthorized
  if (backendStatus === 'unauthorized') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access location management.</p>
        </div>
      </div>
    );
  }

  // If backend is available, show the full interface (this would be the working version)
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Location Management</h1>
          <p className="text-gray-600">Manage states, cities, and location requests</p>
        </div>

        {/* Success message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">Backend endpoints are available! Location management is ready to use.</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('states')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'states'
                  ? 'border-orange-500 text-orange-600 bg-orange-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                States ({states.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('cities')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'cities'
                  ? 'border-orange-500 text-orange-600 bg-orange-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Cities ({cities.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'requests'
                  ? 'border-orange-500 text-orange-600 bg-orange-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Requests ({pendingRequests.length})
              </div>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'states' && (
              <StatesPanel 
                states={states}
                loading={loading}
                onToggleStatus={toggleStateStatus}
                showModal={showStateModal}
                setShowModal={setShowStateModal}
                newStateName={newStateName}
                setNewStateName={setNewStateName}
                onCreateState={createState}
              />
            )}

            {activeTab === 'cities' && (
              <CitiesPanel 
                cities={cities}
                states={states}
                loading={loading}
                onToggleStatus={toggleCityStatus}
                showModal={showCityModal}
                setShowModal={setShowCityModal}
                newCityName={newCityName}
                setNewCityName={setNewCityName}
                selectedStateId={selectedStateId}
                setSelectedStateId={setSelectedStateId}
                onCreateCity={createCity}
              />
            )}

            {activeTab === 'requests' && (
              <PendingRequestsPanel 
                requests={pendingRequests}
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
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// States Panel Component
const StatesPanel = ({ 
  states, loading, onToggleStatus, 
  showModal, setShowModal, newStateName, setNewStateName, onCreateState 
}) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold text-gray-900">States Management</h2>
      <button
        onClick={() => setShowModal(true)}
        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add State
      </button>
    </div>

    {loading ? (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        <span className="ml-2 text-gray-600">Loading states...</span>
      </div>
    ) : (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {states.map((state) => (
              <tr key={state._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {state.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    state.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {state.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(state.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onToggleStatus(state._id, state.isActive)}
                    className={`${
                      state.isActive 
                        ? 'text-red-600 hover:text-red-900' 
                        : 'text-green-600 hover:text-green-900'
                    } transition-colors`}
                  >
                    {state.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {/* Create State Modal */}
    {showModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Create New State</h3>
          <form onSubmit={onCreateState}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">State Name</label>
              <input
                type="text"
                value={newStateName}
                onChange={(e) => setNewStateName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter state name"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create State'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);

// Cities Panel Component  
const CitiesPanel = ({ 
  cities, states, loading, onToggleStatus,
  showModal, setShowModal, newCityName, setNewCityName,
  selectedStateId, setSelectedStateId, onCreateCity
}) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold text-gray-900">Cities Management</h2>
      <button
        onClick={() => setShowModal(true)}
        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add City
      </button>
    </div>

    {loading ? (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        <span className="ml-2 text-gray-600">Loading cities...</span>
      </div>
    ) : (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cities.map((city) => (
              <tr key={city._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {city.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {city.stateId?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    city.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {city.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(city.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onToggleStatus(city._id, city.isActive)}
                    className={`${
                      city.isActive 
                        ? 'text-red-600 hover:text-red-900' 
                        : 'text-green-600 hover:text-green-900'
                    } transition-colors`}
                  >
                    {city.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {/* Create City Modal */}
    {showModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Create New City</h3>
          <form onSubmit={onCreateCity}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <select
                value={selectedStateId}
                onChange={(e) => setSelectedStateId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              >
                <option value="">Select State</option>
                {states.map((state) => (
                  <option key={state._id} value={state._id}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">City Name</label>
              <input
                type="text"
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter city name"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create City'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);

// Pending Requests Panel Component
const PendingRequestsPanel = ({ 
  requests, loading, selectedVendor, setSelectedVendor,
  showModal, setShowModal, resolveState, setResolveState,
  resolveCity, setResolveCity, createLocation, setCreateLocation, onApproveVendor
}) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold text-gray-900">Pending Location Requests</h2>
    </div>

    {loading ? (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        <span className="ml-2 text-gray-600">Loading requests...</span>
      </div>
    ) : requests.length === 0 ? (
      <div className="text-center py-12">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <p className="text-gray-600">No pending location requests</p>
      </div>
    ) : (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested State</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested City</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((vendor) => (
              <tr key={vendor._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {vendor.storeName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {vendor.requestedState}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {vendor.requestedCity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(vendor.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      setSelectedVendor(vendor);
                      setResolveState(vendor.requestedState);
                      setResolveCity(vendor.requestedCity);
                      setShowModal(true);
                    }}
                    className="text-orange-600 hover:text-orange-900 transition-colors"
                  >
                    Resolve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {/* Resolve Request Modal */}
    {showModal && selectedVendor && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Resolve Location for {selectedVendor.storeName}</h3>
          <p className="text-sm text-gray-600 mb-4">
            Requested: {selectedVendor.requestedState}, {selectedVendor.requestedCity}
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <input
                type="text"
                value={resolveState}
                onChange={(e) => setResolveState(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder={selectedVendor.requestedState}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={resolveCity}
                onChange={(e) => setResolveCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder={selectedVendor.requestedCity}
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="createLocation"
                checked={createLocation}
                onChange={(e) => setCreateLocation(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="createLocation" className="text-sm text-gray-700">
                Create location if it doesn't exist
              </label>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setShowModal(false);
                setSelectedVendor(null);
                setResolveState('');
                setResolveCity('');
                setCreateLocation(false);
              }}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onApproveVendor}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Approving...' : 'Approve Vendor'}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
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