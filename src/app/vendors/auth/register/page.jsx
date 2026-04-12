"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApi } from "@/app/context/ApiContext";
import {
  User, Mail, Phone, Lock, Store, FileText, MapPin,
  Clock, CreditCard, ChevronRight, ChevronLeft, Upload,
  CheckCircle2, AlertCircle, X, Loader2, ChevronDown
} from "lucide-react";

/**
 * Cuisine & Tag Options
 */
const CUISINES = ["Rice", "Swallow", "Peppered Chicken Fries", "Pasta", "Snacks", "Drinks"];

const LogoImage = () => (
  <div className="relative group mx-auto mb-2">
    <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full scale-125 transition-transform duration-700" />
    <img
      src="/logo.png"
      alt="MelaChow Logo"
      className="w-[160px] object-contain relative z-10"
    />
  </div>
);

const uploadToCloudinary = async (file) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", "GrubDash");
  try {
    const res = await fetch("https://api.cloudinary.com/v1_1/dypn7gna0/image/upload", {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      throw new Error(`Cloudinary upload failed: ${res.status}`);
    }

    const data = await res.json();
    return data.secure_url;
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return null;
  }
};

// Helper Components - Defined outside to prevent re-creation on every render
const InputWrap = ({ label, icon: Icon, error, children }) => (
  <div className="space-y-1.5 group">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-orange-500 transition-colors" />}
      {children}
    </div>
    {error && <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tight ml-1">{error}</p>}
  </div>
);

const TextInput = ({ path, placeholder, type = "text", icon, error, payload, setField, readOnly = false }) => (
  <InputWrap label={placeholder} icon={icon} error={error}>
    <input
      type={type}
      placeholder={`Enter ${placeholder.toLowerCase()}`}
      value={path.split('.').reduce((o, i) => o[i], payload)}
      onChange={(e) => setField(path, e.target.value)}
      readOnly={readOnly}
      className={`w-full bg-slate-50 dark:bg-slate-800/50  p-3.5 pl-11 rounded-2xl outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium dark:text-white ${readOnly ? 'opacity-70 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`}
    />
  </InputWrap>
);

const SelectInput = ({ path, label, options, icon, error, payload, setField, onChange }) => (
  <InputWrap label={label} icon={icon} error={error}>
    <div className="relative">
      <select
        value={path.split('.').reduce((o, i) => o[i], payload)}
        onChange={(e) => {
          setField(path, e.target.value);
          if (onChange) onChange(e.target.value);
        }}
        className="w-full bg-slate-50 dark:bg-slate-800/50  p-3.5 pl-11 pr-8 rounded-2xl outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium dark:text-white appearance-none"
      >
        <option value="">Select {label}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
    </div>
  </InputWrap>
);

const StepHeader = ({ title, desc }) => (
  <div className="text-center space-y-2 mb-8 mt-2">
    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
      {title.split(' ')[0]} <span className="text-orange-600">{title.split(' ').slice(1).join(' ')}</span>
    </h2>
    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
      {desc}
    </p>
  </div>
);

export default function VendorRegisterPage() {
  const router = useRouter();
  const { baseUrl } = useApi();
  const TOTAL_STEPS = 5;
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState({ open: false, title: "", message: "", type: "info" });

  // Location state management
  const [locations, setLocations] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedStateId, setSelectedStateId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const [previews, setPreviews] = useState({
    logo: null,
  });

  const [files, setFiles] = useState({
    logo: null,
  });

  // Banking state
  const [banks, setBanks] = useState([]);
  const [isVerifyingBank, setIsVerifyingBank] = useState(false);
  const [bankVerified, setBankVerified] = useState(false);

  const [errors, setErrors] = useState({});

  const [payload, setPayload] = useState({
    name: "",
    email: "",
    phone: "",
    // password: "", // Removed
    storeName: "",
    storeDescription: "",
    logo: "",
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      coordinates: { type: "Point", coordinates: [0, 0] },
    },
    cuisineTypes: [],
    openingHours: {
      monday: { open: "09:00", close: "04:00", closed: false },
      tuesday: { open: "09:00", close: "04:00", closed: false },
      wednesday: { open: "09:00", close: "04:00", closed: false },
      thursday: { open: "09:00", close: "04:00", closed: false },
      friday: { open: "09:00", close: "04:00", closed: false },
      saturday: { open: "09:00", close: "04:00", closed: false },
      sunday: { open: "00:00", close: "00:00", closed: true },
    },
    payoutDetails: {
      bankName: "",
      bankCode: "",
      accountName: "",
      accountNumber: "",
      payoutMethod: "paystack",
      payoutEnabled: true,
    },
    deliveryManagedBy: "admin",
    flatRateDeliveryFee: 0,
    metadata: { featured: true },
  });

  // Fetch locations from API
  const fetchLocations = async () => {
    try {
      setIsLoadingLocations(true);
      setLocationError(null);
      const response = await axios.get(`${baseUrl}/user/locations`, {
        withCredentials: true,
      });

      if (response.data.success) {
        setLocations(response.data.locations || []);
      } else {
        setLocationError("Failed to load locations");
      }
    } catch (err) {
      console.error("Error fetching locations:", err);
      setLocationError("Error loading locations. Please refresh.");
    } finally {
      setIsLoadingLocations(false);
    }
  };

  // Handle state selection
  const handleStateChange = (stateId) => {
    setSelectedStateId(stateId);

    // Find selected state's cities
    const selectedLocation = locations.find(loc => loc.stateId === stateId);
    setCities(selectedLocation?.cities || []);
    setSelectedCityId(''); // Reset city selection

    // Update payload with state name
    const stateName = selectedLocation?.state || '';
    setField("address.state", stateName);
    setField("address.city", ""); // Reset city in payload
  };

  // Handle city selection
  const handleCityChange = (cityId) => {
    setSelectedCityId(cityId);

    // Find selected city name
    const selectedCity = cities.find(city => city.cityId === cityId);
    const cityName = selectedCity?.name || '';
    setField("address.city", cityName);
  };

  // Fetch locations when component mounts
  // Fetch Banks
  const fetchBanks = async () => {
    try {
      const response = await axios.get(`${baseUrl}/wallet/public/banks`);
      if (response.data?.banks) {
        setBanks(response.data.banks);
      }
    } catch (err) {
      console.error("Failed to fetch banks:", err);
    }
  };

  // Resolve Bank Account
  const handleVerifyBank = async () => {
    const { accountNumber, bankCode } = payload.payoutDetails;
    if (!accountNumber || !bankCode) {
      setModal({ open: true, title: "Missing Info", message: "Please select a bank and enter account number.", type: "error" });
      return;
    }

    try {
      setIsVerifyingBank(true);
      const res = await axios.get(`${baseUrl}/wallet/public/resolve-account`, {
        params: { account_number: accountNumber, bank_code: bankCode }
      });
      
      if (res.data?.account_name) {
        setField("payoutDetails.accountName", res.data.account_name);
        setBankVerified(true);
      }
    } catch (err) {
      setModal({ 
        open: true, 
        title: "Verification Failed", 
        message: err.response?.data?.message || "Could not verify account. Please check details.", 
        type: "error" 
      });
      setBankVerified(false);
    } finally {
      setIsVerifyingBank(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    // Pre-fetch banks for Step 5
    fetchBanks();
  }, []);

  // Persist form data to session storage
  useEffect(() => {
    const savedData = sessionStorage.getItem("vendor_reg_data");
    const savedStep = sessionStorage.getItem("vendor_reg_step");
    if (savedData) {
      try {
        setPayload(prev => ({ ...prev, ...JSON.parse(savedData) }));
      } catch (e) {
        console.error("Error parsing saved data", e);
      }
    }
    if (savedStep) {
      setStep(Number(savedStep));
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem("vendor_reg_data", JSON.stringify(payload));
    sessionStorage.setItem("vendor_reg_step", step.toString());
  }, [payload, step]);

  const setField = (path, value) => {
    if (!path.includes(".")) {
      setPayload((p) => ({ ...p, [path]: value }));
      return;
    }
    const keys = path.split(".");
    setPayload((p) => {
      const clone = JSON.parse(JSON.stringify(p));
      let cur = clone;
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
      cur[keys[keys.length - 1]] = value;
      return clone;
    });
  };

  const toggleArrayValue = (key, value) => {
    setPayload((p) => {
      const arr = p[key] || [];
      return { ...p, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };

  const handleFileSelect = (fileKey, file) => {
    if (!file) return;
    setFiles((f) => ({ ...f, [fileKey]: file }));
    const url = URL.createObjectURL(file);
    setPreviews((p) => ({ ...p, [fileKey]: url }));
    setErrors((e) => ({ ...e, [fileKey]: "" }));
  };

  const validateStep = async (s = step) => {
    const e = {};
    if (s === 1) {
      if (!payload.name) e.name = "Owner name required";
      if (!payload.email) e.email = "Email required";
      if (!payload.phone) e.phone = "Phone required";
      // if (!payload.password) e.password = "Password required";
    }
    if (s === 2) {
      if (!payload.storeName) e.storeName = "Store name required";
      if (!payload.storeDescription) e.storeDescription = "Store description required";
      if (!files.logo && !payload.logo) e.logo = "Store logo required";
    }
    if (s === 3) {
      if (!payload.address.street) e["address.street"] = "Street required";
      if (!payload.address.city) e["address.city"] = "City required";
      if (!payload.address.state) e["address.state"] = "State required";
      // if (!payload.address.postalCode) e["address.postalCode"] = "Postal required";
    }
    if (s === 4) {
      // Operations step - simplified
      Object.keys(payload.openingHours).forEach((d) => {
        const day = payload.openingHours[d];
        if (!day.closed && (!day.open || !day.close)) e[`openingHours.${d}`] = "Required";
      });
    }
    if (s === 5) {
      if (!payload.payoutDetails.bankName) e["payoutDetails.bankName"] = "Bank name required";
      if (!payload.payoutDetails.accountName) e["payoutDetails.accountName"] = "Account name required";
      if (!payload.payoutDetails.accountNumber) e["payoutDetails.accountNumber"] = "Account number required";
      if (payload.deliveryManagedBy === "vendor") {
        if (!payload.flatRateDeliveryFee || Number(payload.flatRateDeliveryFee) < 0) e.flatRateDeliveryFee = "Delivery fee is required";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = async () => {
    const ok = await validateStep(step);
    if (ok && step < TOTAL_STEPS) setStep((s) => s + 1);
  };
  const goBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    const ok = await validateStep(TOTAL_STEPS);
    if (!ok) {
      setStep(TOTAL_STEPS);
      return;
    }

    setSubmitting(true);
    // 3. Open loading modal with message "Uploading assets..."
    setModal({
      open: true,
      title: "Uploading assets",
      message: "Please wait while we upload your store logo...",
      type: "loading"
    });

    try {
      // 4. Upload logo via uploadToCloudinary if files.logo exists
      let logoUrl = payload.logo || "";
      if (files.logo) {
        logoUrl = await uploadToCloudinary(files.logo);
        if (!logoUrl) {
          setModal({
            open: true,
            title: "Upload Failed",
            message: "Logo upload failed. Please try again.",
            type: "error"
          });
          setSubmitting(false);
          return;
        }
      }

      // 5. Update modal message to "Setting up your store..."
      setModal({
        open: true,
        title: "Creating Store",
        message: "Setting up your store profile...",
        type: "loading"
      });

      // 6. Build fullPayload with all fields as listed
      const fullPayload = {
        // Step 1 - Account
        name: payload.name,
        email: payload.email,
        phone: payload.phone,

        // Step 2 - Store Details
        storeName: payload.storeName,
        storeDescription: payload.storeDescription,
        logo: logoUrl,
        cuisineTypes: payload.cuisineTypes,

        // Step 3 - Address
        address: {
          street: payload.address.street,
          city: payload.address.city,
          state: payload.address.state,
          postalCode: payload.address.postalCode,
        },

        // Step 4 - Operations
        openingHours: payload.openingHours,

        // Step 5 - Payout & Delivery
        payoutDetails: {
          bankName: payload.payoutDetails.bankName,
          bankCode: payload.payoutDetails.bankCode,
          accountName: payload.payoutDetails.accountName,
          accountNumber: payload.payoutDetails.accountNumber,
          payoutMethod: payload.payoutDetails.payoutMethod,
          payoutEnabled: payload.payoutDetails.payoutEnabled,
        },
        deliveryManagedBy: payload.deliveryManagedBy,
        flatRateDeliveryFee: payload.deliveryManagedBy === "vendor"
          ? Number(payload.flatRateDeliveryFee)
          : 0,
      };

      const endpoint = `${baseUrl}/vendor/auth/register`;

      if (process.env.NODE_ENV === 'development') {
        console.log('[VendorRegister] Sending request to:', endpoint);
        console.log('[VendorRegister] Payload:', fullPayload);
      }

      // 7. POST fullPayload to the registration endpoint
      const res = await axios.post(endpoint, fullPayload);

      // 8. On success (status 200 or 201)
      if (res.status === 200 || res.status === 201) {
        setModal({
          open: true,
          title: "Registration Successful",
          message: "Verification code sent! 📩",
          type: "success"
        });

        // Clear sessionStorage keys
        sessionStorage.removeItem("vendor_reg_data");
        sessionStorage.removeItem("vendor_reg_step");

        // After 2 seconds redirect to verify-account page
        setTimeout(() => {
          router.push(`/vendors/auth/verify-account?email=${encodeURIComponent(payload.email)}`);
        }, 2000);
      } else {
        setModal({
          open: true,
          title: "Registration Failed",
          message: res.data?.message || "Server error.",
          type: "error"
        });
      }
    } catch (err) {
      // 9. On error: show error modal with err?.response?.data?.message
      setModal({
        open: true,
        title: "Registration Failed",
        message: err?.response?.data?.message || err.message || "An unexpected error occurred.",
        type: "error"
      });
    } finally {
      // 10. finally: setSubmitting(false)
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-2 overflow-x-hidden relative">
      <div className="w-full max-w-4xl relative z-10 my-8">
        {/* Visual Progress Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 mb-8 md:flex items-center gap-8 hidden">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-3 px-1">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Registration Progress</span>
              <span className="text-xs font-bold text-orange-600">Step {step} of {TOTAL_STEPS}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
              />
            </div>
          </div>
        </div>

        <motion.div
          layout
          className="bg-white dark:bg-slate-900 rounded-3xl p-2 md:p-12"
        >
          <div className="flex flex-col md:hidden items-center mb-8">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full">
              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 1 && (
                <div className="space-y-6">
                  <StepHeader title="Account Information" desc="The keys to your business dashboard" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TextInput path="name" placeholder="Owner Name" icon={User} error={errors.name} payload={payload} setField={setField} />
                    <TextInput path="email" placeholder="Business Email" icon={Mail} type="email" error={errors.email} payload={payload} setField={setField} />
                    <TextInput path="phone" placeholder="Phone Number" icon={Phone} error={errors.phone} payload={payload} setField={setField} />
                    {/* <TextInput path="password" placeholder="Secure Password" icon={Lock} type="password" error={errors.password} payload={payload} setField={setField} /> */}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <StepHeader title="Store Details" desc="Tell your future customers your brand story" />
                  <div className="space-y-6">
                    <TextInput path="storeName" placeholder="Store Name" icon={Store} error={errors.storeName} payload={payload} setField={setField} />
                    <InputWrap label="Store Description" icon={FileText} error={errors.storeDescription}>
                      <textarea
                        value={payload.storeDescription}
                        onChange={(e) => setField("storeDescription", e.target.value)}
                        rows={3}
                        className="w-full bg-slate-50 dark:bg-slate-800/50  p-4 pl-11 rounded-2xl outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium dark:text-white"
                      />
                    </InputWrap>

                    <div className="flex flex-col md:flex-row gap-6 p-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[32px] hover:border-orange-500/30 transition-colors">
                      <div className="flex-1 space-y-2">
                        <h3 className="text-sm font-black uppercase italic tracking-widest text-slate-900 dark:text-white">Store Logo</h3>
                        <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">Recommended: 512x512px, transparent BG</p>
                        <input type="file" accept="image/*" id="logo-up" className="hidden" onChange={(e) => handleFileSelect("logo", e.target.files[0])} />
                        <label htmlFor="logo-up" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase italic tracking-widest cursor-pointer hover:bg-orange-600 transition-colors">
                          <Upload size={14} /> Upload Image
                        </label>
                      </div>
                      <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center border border-slate-100 dark:border-slate-700 overflow-hidden shadow-inner">
                        {previews.logo ? <img src={previews.logo} className="w-full h-full object-cover" /> : <Store className="text-slate-300" size={32} />}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <StepHeader title="Business Location" desc="Where do we send the orders?" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Dynamic State Selection */}
                    <InputWrap label="State" icon={MapPin} error={errors["address.state"]}>
                      <div className="relative">
                        {isLoadingLocations ? (
                          <div className="w-full bg-slate-50 dark:bg-slate-800/50  p-3.5 pl-11 rounded-2xl flex items-center">
                            <Loader2 className="w-4 h-4 animate-spin text-orange-500 mr-2" />
                            <span className="text-sm text-slate-400">Loading locations...</span>
                          </div>
                        ) : locationError ? (
                          <div className="w-full bg-red-50 border border-red-200 p-3.5 pl-11 rounded-2xl flex items-center justify-between">
                            <span className="text-sm text-red-600">{locationError}</span>
                            <button
                              onClick={fetchLocations}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              Retry
                            </button>
                          </div>
                        ) : (
                          <select
                            value={selectedStateId}
                            onChange={(e) => handleStateChange(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/50  p-3.5 pl-11 pr-8 rounded-2xl outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium dark:text-white appearance-none"
                          >
                            <option value="">Select State</option>
                            {locations.map((location) => (
                              <option key={location.stateId} value={location.stateId}>
                                {location.state}
                              </option>
                            ))}
                          </select>
                        )}
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                      </div>
                    </InputWrap>

                    {/* Dynamic City Selection */}
                    <InputWrap label="City" icon={MapPin} error={errors["address.city"]}>
                      <div className="relative">
                        <select
                          value={selectedCityId}
                          onChange={(e) => handleCityChange(e.target.value)}
                          disabled={!selectedStateId}
                          className="w-full bg-slate-50 dark:bg-slate-800/50  p-3.5 pl-11 pr-8 rounded-2xl outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium dark:text-white appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="">
                            {!selectedStateId ? 'Select state first' : 'Select City'}
                          </option>
                          {cities.map((city) => (
                            <option key={city.cityId} value={city.cityId}>
                              {city.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                      </div>
                    </InputWrap>

                    <TextInput path="address.street" placeholder="Street Address" icon={MapPin} error={errors["address.street"]} payload={payload} setField={setField} />

                    {/* <TextInput path="address.postalCode" placeholder="Postal / Zip Code" icon={MapPin} error={errors["address.postalCode"]} payload={payload} setField={setField} /> */}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-8">
                  <StepHeader title="Operations" desc="Define your working hours" />

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Weekly Operating Schedule</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.keys(payload.openingHours).map((day) => {
                        const d = payload.openingHours[day];
                        return (
                          <div key={day} className={`flex items-center gap-3 p-4 rounded-2xl border transition-colors ${d.closed ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 opacity-60' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm'}`}>
                            <div className="w-16 capitalize text-[10px] font-black uppercase italic tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                              <Clock size={12} className="text-orange-500" /> {day.slice(0, 3)}
                            </div>
                            <div className="flex flex-1 items-center gap-2">
                              <input type="time" disabled={d.closed} value={d.open} onChange={(e) => setField(`openingHours.${day}.open`, e.target.value)} className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg text-[10px] font-bold outline-none border border-slate-100 dark:border-slate-700" />
                              <span className="text-slate-300 dark:text-slate-600">-</span>
                              <input type="time" disabled={d.closed} value={d.close} onChange={(e) => setField(`openingHours.${day}.close`, e.target.value)} className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg text-[10px] font-bold outline-none border border-slate-100 dark:border-slate-700" />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" className="hidden" checked={d.closed} onChange={(e) => setField(`openingHours.${day}.closed`, e.target.checked)} />
                              <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${d.closed ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${d.closed ? 'translate-x-4' : ''}`} />
                              </div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-8">
                  <StepHeader title="Payout & Delivery" desc="Final details before we launch your store" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputWrap label="Select Bank" icon={Store} error={errors["payoutDetails.bankName"]}>
                      <div className="relative">
                        <select
                          value={payload.payoutDetails.bankCode}
                          disabled={bankVerified}
                          onChange={(e) => {
                            const selectedBank = banks.find(b => b.code === e.target.value);
                            setField("payoutDetails.bankCode", e.target.value);
                            setField("payoutDetails.bankName", selectedBank ? selectedBank.name : "");
                            setBankVerified(false);
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-800/50  p-3.5 pl-11 pr-8 rounded-2xl outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium dark:text-white appearance-none disabled:opacity-60"
                        >
                          <option value="">Choose your bank</option>
                          {banks.map((bank) => (
                            <option key={bank.id} value={bank.code}>
                              {bank.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                      </div>
                    </InputWrap>

                    <TextInput 
                      path="payoutDetails.accountNumber" 
                      placeholder="Account Number" 
                      icon={CreditCard} 
                      error={errors["payoutDetails.accountNumber"]} 
                      payload={payload} 
                      setField={(path, val) => {
                        setField(path, val);
                        setBankVerified(false);
                      }} 
                    />
                  </div>

                  <div className="relative">
                    <TextInput 
                      path="payoutDetails.accountName" 
                      placeholder="Verified Account Name" 
                      icon={User} 
                      error={errors["payoutDetails.accountName"]} 
                      payload={payload} 
                      setField={setField}
                      readOnly={true}
                    />
                    {!bankVerified ? (
                      <button
                        type="button"
                        onClick={handleVerifyBank}
                        disabled={isVerifyingBank}
                        className="absolute right-2 top-[30px] px-4 py-2 bg-slate-900 dark:bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all disabled:opacity-50"
                      >
                        {isVerifyingBank ? <Loader2 className="animate-spin" size={12} /> : "Verify Account"}
                      </button>
                    ) : (
                      <div className="absolute right-4 top-[38px] text-emerald-500 flex items-center gap-1.5 font-bold text-[9px] uppercase tracking-widest">
                        <CheckCircle2 size={14} /> Verified
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-black uppercase italic tracking-widest text-slate-900 dark:text-white">Delivery Configuration</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setField("deliveryManagedBy", "vendor");
                        }}
                        className={`flex flex-col items-start p-4 rounded-2xl border-2 transition-all text-left ${payload.deliveryManagedBy === "vendor" ? "border-orange-600 bg-orange-50 dark:bg-orange-500/10" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"}`}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <User className={payload.deliveryManagedBy === "vendor" ? "text-orange-600" : "text-slate-400"} size={20} />
                          {payload.deliveryManagedBy === "vendor" && <CheckCircle2 className="text-orange-600" size={16} />}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">I'll manage delivery</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tight">I have my own riders</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setField("deliveryManagedBy", "admin");
                          setField("flatRateDeliveryFee", 0);
                        }}
                        className={`flex flex-col items-start p-4 rounded-2xl border-2 transition-all text-left ${payload.deliveryManagedBy === "admin" ? "border-orange-600 bg-orange-50 dark:bg-orange-500/10" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"}`}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <Store className={payload.deliveryManagedBy === "admin" ? "text-orange-600" : "text-slate-400"} size={20} />
                          {payload.deliveryManagedBy === "admin" && <CheckCircle2 className="text-orange-600" size={16} />}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Use platform delivery</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tight">MelaChow handles delivery</p>
                      </button>
                    </div>

                    <AnimatePresence>
                      {payload.deliveryManagedBy === "vendor" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <TextInput
                            path="flatRateDeliveryFee"
                            placeholder="Flat Rate Delivery Fee (₦)"
                            icon={CreditCard}
                            type="number"
                            error={errors.flatRateDeliveryFee}
                            payload={payload}
                            setField={setField}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>


                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={goBack}
              disabled={step === 1}
              className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase italic tracking-widest transition-all
                                ${step === 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"}`}
            >
              <ChevronLeft size={16} /> Back
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={step < TOTAL_STEPS ? goNext : handleSubmit}
              disabled={submitting}
              className="flex items-center gap-3 px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-[24px] text-[10px] font-black uppercase italic tracking-widest transition-all  disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={16} />
              ) : step < TOTAL_STEPS ? (
                <>Next Step <ChevronRight size={16} /></>
              ) : (
                <>LAUNCH STORE <CheckCircle2 size={16} /></>
              )}
            </motion.button>
          </div>

          <div className="text-center mt-4">
            <Link href="/vendors/auth/login" className="text-[10px] font-black uppercase italic tracking-[0.2em] text-slate-400 hover:text-orange-600 transition-colors underline-offset-4 decoration-orange-600/30">
              Already a Partner? SIGN IN
            </Link>
          </div>
        </motion.div>
      </div >

      {/* Premium Response Modal */}
      < AnimatePresence >
        {
          modal.open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white dark:bg-slate-900 rounded-[40px] p-8 md:p-12 w-full max-w-lg text-center shadow-2xl relative "
              >
                {modal.type === 'loading' ? (
                  <div className="flex flex-col items-center py-6">
                    <div className="w-24 h-24 relative mb-8">
                      <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <Store className="absolute inset-0 m-auto text-orange-500 animate-pulse" size={32} />
                    </div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2 text-slate-900 dark:text-white animate-pulse">
                      {modal.title}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">{modal.message}</p>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setModal({ ...modal, open: false })}
                      className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                    >
                      <X size={24} />
                    </button>

                    <div className="mb-6 flex justify-center">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center ${modal.type === 'success' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500" : "bg-rose-50 dark:bg-rose-500/10 text-rose-500"
                        }`}>
                        {modal.type === 'success' ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
                      </div>
                    </div>

                    <h2 className={`text-2xl font-black uppercase italic tracking-tighter mb-4 ${modal.type === 'success' ? "text-emerald-600" : "text-rose-500"
                      }`}>
                      {modal.title.split(' ')[0]} <span className={modal.type === 'success' ? 'text-slate-900 dark:text-white' : ''}>{modal.title.split(' ').slice(1).join(' ')}</span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed mb-8">{modal.message}</p>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setModal({ ...modal, open: false })}
                        className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-4 rounded-2xl text-[10px] font-black uppercase italic tracking-widest hover:bg-slate-200 transition-all"
                      >
                        Review Details
                      </button>
                      {modal.type === 'success' && (
                        <Link
                          href="/vendors/auth/login"
                          className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl text-[10px] font-black uppercase italic tracking-widest flex items-center justify-center hover:scale-[1.02] shadow-lg transition-all"
                        >
                          GOTO DASHBOARD
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )
        }
      </AnimatePresence >
    </div >
  );
}

