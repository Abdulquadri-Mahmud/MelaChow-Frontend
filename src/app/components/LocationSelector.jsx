"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Loader2, AlertCircle, MapPin, Navigation, Building2, Info } from "lucide-react";
import { LocationService } from "@/app/lib/locationService";
import toast from "react-hot-toast";

/**
 * Debug Information Component (Development Mode Only)
 */
const LocationDebugInfo = ({ debugInfo, isLegacyMode }) => {
  if (process.env.NODE_ENV !== 'development' || !debugInfo) return null;

  return (
    <div className="debug-info bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-xs">
      <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
        <Info size={14} />
        🔧 Debug Info (Dev Mode Only)
      </h4>
      <div className="grid grid-cols-2 gap-2 text-gray-600">
        <p><strong>Mode:</strong> {isLegacyMode ? 'Legacy (String-based)' : 'Database-driven'}</p>
        <p><strong>Total Vendors:</strong> {debugInfo.totalVendors}</p>
        <p><strong>Active Vendors:</strong> {debugInfo.activeVendors}</p>
        <p><strong>Vendors with StateId:</strong> {debugInfo.vendorsWithStateId}</p>
        <p><strong>Total States:</strong> {debugInfo.totalStates}</p>
        <p><strong>Active States:</strong> {debugInfo.activeStates}</p>
      </div>
      {debugInfo.note && (
        <p className="mt-2 text-orange-600 text-xs">
          <strong>Note:</strong> {debugInfo.note}
        </p>
      )}
    </div>
  );
};

/**
 * Legacy Mode Notice Component
 */
const LegacyModeNotice = ({ isLegacyMode }) => {
  if (!isLegacyMode) return null;

  return (
    <div className="legacy-notice bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
      <div className="flex items-center gap-2 text-yellow-800">
        <AlertCircle size={16} />
        <span className="text-sm font-medium">
          ℹ️ Using legacy location data. Some features may be limited.
        </span>
      </div>
    </div>
  );
};

/**
 * Enhanced Location Error State Component
 */
const LocationErrorState = ({ error, onRetry }) => (
  <div className="location-error bg-red-50 border border-red-200 rounded-lg p-4 text-center">
    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
    <h4 className="font-semibold text-red-800 mb-2">⚠️ Unable to Load Locations</h4>
    <p className="text-red-600 text-sm mb-3">{error}</p>
    <button 
      onClick={onRetry}
      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
    >
      Try Again
    </button>
  </div>
);

/**
 * Enhanced Location Loading State Component
 */
const LocationLoadingState = () => (
  <div className="location-loading text-center py-6">
    <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
    <p className="text-gray-500 text-sm">Loading locations...</p>
  </div>
);

/**
 * Reusable Location Selector Component with Enhanced Error Handling & Fallback Strategy
 */
export default function LocationSelector({
  selectedStateId,
  selectedCityId,
  onStateChange,
  onCityChange,
  disabled = false,
  required = false,
  className = "",
  stateLabel = "State",
  cityLabel = "City",
  stateError = null,
  cityError = null,
}) {
  const [locations, setLocations] = useState([]);
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLegacyMode, setIsLegacyMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  // Fetch locations on mount
  useEffect(() => {
    fetchLocations();
  }, []);

  // Update cities when state changes
  useEffect(() => {
    if (selectedStateId) {
      const selectedLocation = locations.find(loc => 
        loc.stateId === selectedStateId || (isLegacyMode && loc.state === selectedStateId)
      );
      setCities(selectedLocation?.cities || []);
    } else {
      setCities([]);
    }
  }, [selectedStateId, locations, isLegacyMode]);

  const fetchLocations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await LocationService.fetchUserLocations();
      
      if (result.success) {
        setLocations(result.locations);
        setIsLegacyMode(result.isLegacyMode || false);
        setDebugInfo(result.debugInfo || null);
        
        if (result.isLegacyMode) {
          toast.success("Locations loaded (legacy mode)", { duration: 3000 });
        }
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch (err) {
      console.error("Error in LocationSelector:", err);
      setError("Failed to load locations");
      toast.error("Failed to load locations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStateChange = (e) => {
    const stateValue = e.target.value;
    
    // Find state name - handle both legacy and new formats
    let stateName = '';
    if (isLegacyMode) {
      stateName = stateValue; // In legacy mode, value is the state name
    } else {
      const selectedLocation = locations.find(loc => loc.stateId === stateValue);
      stateName = selectedLocation?.state || '';
    }
    
    // Call parent handlers
    onStateChange(stateValue, stateName);
  };

  const handleCityChange = (e) => {
    const cityValue = e.target.value;
    
    // Find city name - handle both legacy and new formats
    let cityName = '';
    if (isLegacyMode) {
      cityName = cityValue; // In legacy mode, value is the city name
    } else {
      const selectedCity = cities.find(city => city.cityId === cityValue);
      cityName = selectedCity?.name || '';
    }
    
    // Call parent handler
    onCityChange(cityValue, cityName);
  };

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
        <LocationLoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <LocationErrorState error={error} onRetry={fetchLocations} />
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">No locations available at the moment.</p>
          <p className="text-gray-500 text-xs mt-1">Please contact support for assistance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Debug Info (Development Only) */}
      <LocationDebugInfo debugInfo={debugInfo} isLegacyMode={isLegacyMode} />
      
      {/* Legacy Mode Notice */}
      <LegacyModeNotice isLegacyMode={isLegacyMode} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* State Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {stateLabel} {required && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Navigation className="w-4 h-4" />
            </div>
            <select
              value={selectedStateId}
              onChange={handleStateChange}
              disabled={disabled}
              required={required}
              className={`w-full appearance-none rounded-lg border bg-white py-3 pl-10 pr-10 text-sm outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 disabled:opacity-50 disabled:cursor-not-allowed ${
                stateError 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' 
                  : 'border-gray-300'
              }`}
            >
              <option value="">Select {stateLabel}</option>
              {locations.map((location, index) => (
                <option 
                  key={isLegacyMode ? index : location.stateId} 
                  value={isLegacyMode ? location.state : location.stateId}
                >
                  {location.state}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
          {stateError && (
            <p className="text-red-500 text-xs mt-1">{stateError}</p>
          )}
        </div>

        {/* City Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {cityLabel} {required && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Building2 className="w-4 h-4" />
            </div>
            <select
              value={selectedCityId}
              onChange={handleCityChange}
              disabled={disabled || !selectedStateId}
              required={required}
              className={`w-full appearance-none rounded-lg border bg-white py-3 pl-10 pr-10 text-sm outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 disabled:opacity-50 disabled:cursor-not-allowed ${
                cityError 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' 
                  : 'border-gray-300'
              }`}
            >
              <option value="">
                {!selectedStateId ? `Select ${stateLabel.toLowerCase()} first` : `Select ${cityLabel}`}
              </option>
              {cities.map((city, index) => (
                <option 
                  key={isLegacyMode ? index : city.cityId} 
                  value={isLegacyMode ? city.name : city.cityId}
                >
                  {city.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
          {cityError && (
            <p className="text-red-500 text-xs mt-1">{cityError}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Enhanced Location Selector Hook with Legacy Support
 */
export const useLocationSelector = (initialStateId = "", initialCityId = "") => {
  const [selectedStateId, setSelectedStateId] = useState(initialStateId);
  const [selectedCityId, setSelectedCityId] = useState(initialCityId);
  const [stateName, setStateName] = useState("");
  const [cityName, setCityName] = useState("");
  const [isLegacyMode, setIsLegacyMode] = useState(false);

  const handleStateChange = (stateId, name) => {
    setSelectedStateId(stateId);
    setStateName(name);
    // Reset city when state changes
    setSelectedCityId("");
    setCityName("");
  };

  const handleCityChange = (cityId, name) => {
    setSelectedCityId(cityId);
    setCityName(name);
  };

  const reset = () => {
    setSelectedStateId("");
    setSelectedCityId("");
    setStateName("");
    setCityName("");
  };

  const isValid = selectedStateId && selectedCityId;

  return {
    selectedStateId,
    selectedCityId,
    stateName,
    cityName,
    handleStateChange,
    handleCityChange,
    reset,
    isValid,
    isLegacyMode,
    setIsLegacyMode,
  };
};