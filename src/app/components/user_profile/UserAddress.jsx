"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

const UserAddress = () => {
  const [address, setAddress] = useState("");
  const [accuracy, setAccuracy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLocation = async () => {
      if (!navigator.geolocation) {
        setError("Geolocation is not supported by your browser");
        await getIPFallback();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          setAccuracy(accuracy);

          // If accuracy is poor (> 100m), use IP fallback instead
          if (accuracy > 10) {
            console.warn("Low GPS accuracy:", accuracy);
            await getIPFallback();
          } else {
            await getReverseGeocode(latitude, longitude);
          }

          setLoading(false);
        },
        async (err) => {
          console.error("Geolocation error:", err.message);
          setError("Unable to fetch precise location. Using approximate data...");
          await getIPFallback();
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    };

    const getReverseGeocode = async (lat, lon) => {
      try {
        const res = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
        );
        const data = res.data;
        setAddress(data.display_name || "Address not found");
      } catch (err) {
        console.error("Reverse geocoding failed:", err);
        await getIPFallback();
      }
    };

    const getIPFallback = async () => {
      try {
        const res = await axios.get("https://ipapi.co/json/");
        const data = res.data;
        const formatted = `${data.city || ""}, ${data.region || ""}, ${data.country_name || ""}`;
        setAddress(formatted.trim());
      } catch (err) {
        setError("Unable to determine your location");
        console.error("IP lookup failed:", err);
      }
    };

    fetchLocation();
  }, []);

  return (
    <div className="p-4 bg-gray-100 rounded-xl shadow-md text-gray-800 max-w-md mx-auto mt-6">
      <h2 className="text-xl font-semibold mb-2">📍 Your Current Location</h2>

      {loading ? (
        <p>Detecting your location...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <div>
          <p className="font-medium">{address}</p>
          {accuracy && (
            <p className="text-sm text-gray-600 mt-1">
              Accuracy: ±{Math.round(accuracy)} m
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default UserAddress;
