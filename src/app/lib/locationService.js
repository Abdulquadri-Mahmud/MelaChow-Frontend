import axios from "axios";

const baseUrl = "https://grub-dash-api.vercel.app/api";

/**
 * Location Service - Centralized location API calls
 */
export class LocationService {
  /**
   * Fetch available locations for users (public endpoint)
   */
  static async fetchUserLocations() {
    try {
      const response = await axios.get(`${baseUrl}/user/locations`, {
        withCredentials: true,
      });
      
      if (response.data.success) {
        return {
          success: true,
          locations: response.data.locations || [],
        };
      } else {
        return {
          success: false,
          error: response.data.message || "Failed to load locations",
        };
      }
    } catch (error) {
      console.error("Error fetching user locations:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Error loading locations",
      };
    }
  }

  /**
   * Admin: Fetch all states
   */
  static async fetchStates() {
    try {
      const response = await axios.get(`${baseUrl}/admin/locations/states`, {
        withCredentials: true,
      });
      
      if (response.data.success) {
        return {
          success: true,
          states: response.data.states || [],
        };
      } else {
        return {
          success: false,
          error: response.data.message || "Failed to load states",
        };
      }
    } catch (error) {
      console.error("Error fetching states:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Error loading states",
      };
    }
  }

  /**
   * Admin: Create new state
   */
  static async createState(name) {
    try {
      const response = await axios.post(
        `${baseUrl}/admin/locations/states`,
        { name: name.trim() },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        return {
          success: true,
          state: response.data.state,
        };
      } else {
        return {
          success: false,
          error: response.data.message || "Failed to create state",
        };
      }
    } catch (error) {
      console.error("Error creating state:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Error creating state",
      };
    }
  }

  /**
   * Admin: Toggle state status
   */
  static async toggleStateStatus(stateId, isActive) {
    try {
      const response = await axios.patch(
        `${baseUrl}/admin/locations/states/${stateId}/activate`,
        { isActive },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        return {
          success: true,
          state: response.data.state,
        };
      } else {
        return {
          success: false,
          error: response.data.message || "Failed to update state status",
        };
      }
    } catch (error) {
      console.error("Error updating state status:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Error updating state status",
      };
    }
  }

  /**
   * Admin: Fetch all cities
   */
  static async fetchCities() {
    try {
      const response = await axios.get(`${baseUrl}/admin/locations/cities`, {
        withCredentials: true,
      });
      
      if (response.data.success) {
        return {
          success: true,
          cities: response.data.cities || [],
        };
      } else {
        return {
          success: false,
          error: response.data.message || "Failed to load cities",
        };
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Error loading cities",
      };
    }
  }

  /**
   * Admin: Create new city
   */
  static async createCity(name, stateId) {
    try {
      const response = await axios.post(
        `${baseUrl}/admin/locations/cities`,
        { name: name.trim(), stateId },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        return {
          success: true,
          city: response.data.city,
        };
      } else {
        return {
          success: false,
          error: response.data.message || "Failed to create city",
        };
      }
    } catch (error) {
      console.error("Error creating city:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Error creating city",
      };
    }
  }

  /**
   * Admin: Toggle city status
   */
  static async toggleCityStatus(cityId, isActive) {
    try {
      const response = await axios.patch(
        `${baseUrl}/admin/locations/cities/${cityId}/activate`,
        { isActive },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        return {
          success: true,
          city: response.data.city,
        };
      } else {
        return {
          success: false,
          error: response.data.message || "Failed to update city status",
        };
      }
    } catch (error) {
      console.error("Error updating city status:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Error updating city status",
      };
    }
  }

  /**
   * Admin: Fetch pending location requests
   */
  static async fetchPendingRequests() {
    try {
      const response = await axios.get(`${baseUrl}/admin/locations/location-requests`, {
        withCredentials: true,
      });
      
      if (response.data.success) {
        return {
          success: true,
          vendors: response.data.vendors || [],
        };
      } else {
        return {
          success: false,
          error: response.data.message || "Failed to load pending requests",
        };
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Error loading pending requests",
      };
    }
  }

  /**
   * Admin: Approve vendor with location resolution
   */
  static async approveVendor(vendorId, state, city, createLocation = false) {
    try {
      const response = await axios.patch(
        `${baseUrl}/admin/vendors/approve?vendorId=${vendorId}`,
        { state: state.trim(), city: city.trim(), createLocation },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        return {
          success: true,
          vendor: response.data.vendor,
        };
      } else {
        return {
          success: false,
          error: response.data.message || "Failed to approve vendor",
        };
      }
    } catch (error) {
      console.error("Error approving vendor:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Error approving vendor",
      };
    }
  }

  /**
   * Helper: Find state and city names from IDs
   */
  static findLocationNames(locations, stateId, cityId) {
    const selectedLocation = locations.find(loc => loc.stateId === stateId);
    if (!selectedLocation) return { stateName: '', cityName: '' };
    
    const selectedCity = selectedLocation.cities.find(city => city.cityId === cityId);
    
    return {
      stateName: selectedLocation.state,
      cityName: selectedCity?.name || '',
    };
  }

  /**
   * Helper: Validate location selection
   */
  static validateLocationSelection(stateId, cityId, addressLine) {
    const errors = [];
    
    if (!stateId) errors.push('Please select a state');
    if (!cityId) errors.push('Please select a city');
    if (!addressLine?.trim()) errors.push('Please enter your address');
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * React Hook for location management
 */
export const useLocationService = () => {
  return {
    fetchUserLocations: LocationService.fetchUserLocations,
    fetchStates: LocationService.fetchStates,
    createState: LocationService.createState,
    toggleStateStatus: LocationService.toggleStateStatus,
    fetchCities: LocationService.fetchCities,
    createCity: LocationService.createCity,
    toggleCityStatus: LocationService.toggleCityStatus,
    fetchPendingRequests: LocationService.fetchPendingRequests,
    approveVendor: LocationService.approveVendor,
    findLocationNames: LocationService.findLocationNames,
    validateLocationSelection: LocationService.validateLocationSelection,
  };
};

export default LocationService;