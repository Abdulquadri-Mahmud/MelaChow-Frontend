"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Loader2, AlertCircle, MapPin, Navigation, Building2 } from "lucide-react";
import { LocationService } from "@/app/lib/locationService";
import toast from "react-hot-toast";

/**
 * Reusable Location Selector Component
 * Handles state/city selection with dynamic API data
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

  // Fetch locations on mount
  useEffect(() => {
    fetchLocations();
  }, []);

  // Update cities when state changes
  useEffect(() => {
    if (selectedStateId) {
      const selectedLocation = locations.find(loc => loc.stateId === selectedStateId);
      setCities(selectedLocation?.cities || []);
    } else {
      setCities([]);
    }
  }, [selectedStateId, locations]);

  const fetchLocations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await LocationService.fetchUserLocations();
      
      if (result.success) {
        setLocations(result.locations);
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
    const stateId = e.target.value;
    
    // Find state name
    const selectedLocation = locations.find(loc => loc.stateId === stateId);
    const stateName = selectedLocation?.state || '';
    
    // Call parent handlers
    onStateChange(stateId, stateName);
  };

  const handleCityChange = (e) => {
    const cityId = e.target.value;
    
    // Find city name
    const selectedCity = cities.find(city => city.cityId === cityId);
    const cityName = selectedCity?.name || '';
    
    // Call parent handler
    onCityChange(cityId, cityName);
  };

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">{stateLabel}</label>
          <div className="flex items-center justify-center h-12 bg-gray-50 border border-gray-200 rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin text-orange-500 mr-2" />
            <span className="text-sm text-gray-500">Loading locations...</span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">{cityLabel}</label>
          <div className="h-12 bg-gray-100 border border-gray-200 rounded-lg opacity-50"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 text-sm mb-2">{error}</p>
          <button 
            onClick={fetchLocations}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
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
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
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
            {locations.map((location) => (
              <option key={location.stateId} value={location.stateId}>
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
            {cities.map((city) => (
              <option key={city.cityId} value={city.cityId}>
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
  );
}

/**
 * Simplified Location Selector Hook
 * For easier integration in forms
 */
export const useLocationSelector = (initialStateId = "", initialCityId = "") => {
  const [selectedStateId, setSelectedStateId] = useState(initialStateId);
  const [selectedCityId, setSelectedCityId] = useState(initialCityId);
  const [stateName, setStateName] = useState("");
  const [cityName, setCityName] = useState("");

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
  };
};