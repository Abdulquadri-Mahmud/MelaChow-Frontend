"use client";
import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  User, Mail, Phone, Lock, Store, FileText, MapPin,
  Clock, CreditCard, ChevronRight, ChevronLeft, Upload,
  CheckCircle2, AlertCircle, X, Loader2
} from "lucide-react";

/**
 * Cuisine & Tag Options
 */
const CUISINES = ["Rice", "Swallow", "Peppered Chicken Fries", "Pasta", "Snacks", "Drinks"];
const TAGS = ["Nigerian", "Spicy", "Affordable", "Swallow", "Jollof", "Vegan"];

const LogoImage = () => (
  <div className="relative group mx-auto mb-2">
    <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full scale-125 transition-transform duration-700" />
    <img
      src="/logo.png"
      alt="GrubDash Logo"
      className="w-[160px] object-contain relative z-10"
    />
  </div>
);

const uploadToCloudinary = async (file) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", "GrubDash");
  try {
    const res = await axios.post("https://api.cloudinary.com/v1_1/dypn7gna0/image/upload", fd);
    return res.data.secure_url;
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return null;
  }
};

export default function VendorRegisterPage() {
  const TOTAL_STEPS = 6;
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState({ open: false, title: "", message: "", type: "info" });

  const [previews, setPreviews] = useState({
    logo: null,
    kycFront: null,
    kycBack: null,
    businessDoc: null,
  });

  const [files, setFiles] = useState({
    logo: null,
    kycFront: null,
    kycBack: null,
    businessDoc: null,
  });

  const [errors, setErrors] = useState({});

  const [payload, setPayload] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
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
    kyc: {
      idType: "",
      idNumber: "",
      idFrontUrl: "",
      idBackUrl: "",
      businessRegistrationDoc: "",
    },
    payoutDetails: {
      bankName: "",
      accountName: "",
      accountNumber: "",
      payoutMethod: "paystack",
      payoutEnabled: true,
    },
    acceptsDelivery: true,
    deliveryRadiusKm: 5,
    tags: [],
    metadata: { featured: true },
  });

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
      if (!payload.password) e.password = "Password required";
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
      if (!payload.address.postalCode) e["address.postalCode"] = "Postal required";
    }
    if (s === 4) {
      if (!payload.cuisineTypes || payload.cuisineTypes.length === 0) e.cuisineTypes = "Select cuisine types";
      Object.keys(payload.openingHours).forEach((d) => {
        const day = payload.openingHours[d];
        if (!day.closed && (!day.open || !day.close)) e[`openingHours.${d}`] = "Required";
      });
    }
    if (s === 5) {
      if (!payload.kyc.idType) e["kyc.idType"] = "ID type required";
      if (!payload.kyc.idNumber) e["kyc.idNumber"] = "ID number required";
      if (!files.kycFront && !payload.kyc.idFrontUrl) e.kycFront = "Upload ID front";
      if (!files.kycBack && !payload.kyc.idBackUrl) e.kycBack = "Upload ID back";
      if (!files.businessDoc && !payload.kyc.businessRegistrationDoc) e.businessDoc = "Upload business doc";
    }
    if (s === 6) {
      if (!payload.payoutDetails.bankName) e["payoutDetails.bankName"] = "Bank name required";
      if (!payload.payoutDetails.accountName) e["payoutDetails.accountName"] = "Account name required";
      if (!payload.payoutDetails.accountNumber) e["payoutDetails.accountNumber"] = "Account number required";
      if (!payload.tags || payload.tags.length === 0) e.tags = "Select tags";
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

    try {
      const uploaded = {};
      if (files.logo) uploaded.logo = await uploadToCloudinary(files.logo);
      if (files.kycFront) uploaded.kycFront = await uploadToCloudinary(files.kycFront);
      if (files.kycBack) uploaded.kycBack = await uploadToCloudinary(files.kycBack);
      if (files.businessDoc) uploaded.businessDoc = await uploadToCloudinary(files.businessDoc);

      const finalPayload = JSON.parse(JSON.stringify(payload));
      if (uploaded.logo) finalPayload.logo = uploaded.logo;
      if (uploaded.kycFront) finalPayload.kyc.idFrontUrl = uploaded.kycFront;
      if (uploaded.kycBack) finalPayload.kyc.idBackUrl = uploaded.kycBack;
      if (uploaded.businessDoc) finalPayload.kyc.businessRegistrationDoc = uploaded.businessDoc;

      const res = await axios.post("https://grub-dash-api.vercel.app/api/vendors/create", finalPayload);
      if (res.status === 200 || res.status === 201) {
        setModal({ open: true, title: "Registration Successful", message: res.data?.message || "Account created.", type: "success" });
      } else {
        setModal({ open: true, title: "Registration Failed", message: res.data?.message || "Server error.", type: "error" });
      }
    } catch (err) {
      setModal({ open: true, title: "Registration Failed", message: err?.response?.data?.message || err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const InputWrap = ({ label, icon: Icon, error, children }) => (
    <div className="space-y-1.5 group">
      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 group-focus-within:text-orange-500 transition-colors" />}
        {children}
      </div>
      {error && <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tight ml-1">{error}</p>}
    </div>
  );

  const TextInput = ({ path, placeholder, type = "text", icon, error }) => (
    <InputWrap label={placeholder} icon={icon} error={error}>
      <input
        type={type}
        placeholder={`Enter ${placeholder.toLowerCase()}`}
        value={path.split('.').reduce((o, i) => o[i], payload)}
        onChange={(e) => setField(path, e.target.value)}
        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 p-3.5 pl-11 rounded-2xl outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium dark:text-white"
      />
    </InputWrap>
  );

  const StepHeader = ({ title, desc }) => (
    <div className="text-center space-y-2 mb-8 mt-2">
      <h2 className="text-3xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white leading-none">
        {title.split(' ')[0]} <span className="text-orange-600">{title.split(' ').slice(1).join(' ')}</span>
      </h2>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
        {desc}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-2 overflow-x-hidden relative">
      {/* Decorative Background */}
      <div className="absolute top-[5%] right-[5%] w-64 h-64 bg-orange-500/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[20%] left-[5%] w-96 h-96 bg-orange-600/5 rounded-full blur-[120px] animate-pulse delay-700" />

      <div className="w-full max-w-4xl relative z-10 my-8">
        {/* Visual Progress Bar */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 mb-8 border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 md:flex items-center gap-8 hidden">
          <LogoImage />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-3 px-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Registration Progress</span>
              <span className="text-[10px] font-black uppercase italic tracking-widest text-orange-600">Step {step} of {TOTAL_STEPS}</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full p-0.5 border border-zinc-50 dark:border-zinc-700">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.3)]"
              />
            </div>
          </div>
        </div>

        <motion.div
          layout
          className="bg-white dark:bg-zinc-900 rounded-[40px] shadow-2xl shadow-zinc-200/50 dark:shadow-none border border-zinc-100 dark:border-zinc-800 p-2 md:p-12"
        >
          <div className="flex flex-col md:hidden items-center mb-8">
            <LogoImage />
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full mt-4">
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
                    <TextInput path="name" placeholder="Owner Name" icon={User} error={errors.name} />
                    <TextInput path="email" placeholder="Business Email" icon={Mail} type="email" error={errors.email} />
                    <TextInput path="phone" placeholder="Phone Number" icon={Phone} error={errors.phone} />
                    <TextInput path="password" placeholder="Secure Password" icon={Lock} type="password" error={errors.password} />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <StepHeader title="Store Details" desc="Tell your future customers your brand story" />
                  <div className="space-y-6">
                    <TextInput path="storeName" placeholder="Store Name" icon={Store} error={errors.storeName} />
                    <InputWrap label="Store Description" icon={FileText} error={errors.storeDescription}>
                      <textarea
                        value={payload.storeDescription}
                        onChange={(e) => setField("storeDescription", e.target.value)}
                        rows={3}
                        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 p-4 pl-11 rounded-2xl outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium dark:text-white"
                      />
                    </InputWrap>

                    <div className="flex flex-col md:flex-row gap-6 p-6 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[32px] hover:border-orange-500/30 transition-colors">
                      <div className="flex-1 space-y-2">
                        <h3 className="text-sm font-black uppercase italic tracking-widest text-zinc-900 dark:text-white">Store Logo</h3>
                        <p className="text-[10px] font-bold text-zinc-400 leading-relaxed uppercase tracking-widest">Recommended: 512x512px, transparent BG</p>
                        <input type="file" accept="image/*" id="logo-up" className="hidden" onChange={(e) => handleFileSelect("logo", e.target.files[0])} />
                        <label htmlFor="logo-up" className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-[10px] font-black uppercase italic tracking-widest cursor-pointer hover:bg-orange-600 transition-colors">
                          <Upload size={14} /> Upload Image
                        </label>
                      </div>
                      <div className="w-24 h-24 bg-zinc-50 dark:bg-zinc-800 rounded-3xl flex items-center justify-center border border-zinc-100 dark:border-zinc-700 overflow-hidden shadow-inner">
                        {previews.logo ? <img src={previews.logo} className="w-full h-full object-cover" /> : <Store className="text-zinc-300" size={32} />}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <StepHeader title="Business Location" desc="Where do we send the orders?" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TextInput path="address.street" placeholder="Street Address" icon={MapPin} error={errors["address.street"]} />
                    <TextInput path="address.city" placeholder="City" icon={MapPin} error={errors["address.city"]} />
                    <TextInput path="address.state" placeholder="State/Region" icon={MapPin} error={errors["address.state"]} />
                    <TextInput path="address.postalCode" placeholder="Postal / Zip Code" icon={MapPin} error={errors["address.postalCode"]} />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-8">
                  <StepHeader title="Operations & Cuisine" desc="Define your menu style and working hours" />
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Menu Focus (Select multiple)</label>
                    <div className="flex flex-wrap gap-2.5">
                      {CUISINES.map((c) => {
                        const active = payload.cuisineTypes.includes(c);
                        return (
                          <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            key={c}
                            type="button"
                            onClick={() => toggleArrayValue("cuisineTypes", c)}
                            className={`px-5 py-2.5 rounded-xl border text-[10px] font-black uppercase italic tracking-widest transition-all
                                                            ${active ? "bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-100 dark:border-zinc-700"}`}
                          >
                            {c}
                          </motion.button>
                        );
                      })}
                    </div>
                    {errors.cuisineTypes && <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tight ml-1">{errors.cuisineTypes}</p>}
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Weekly Operating Schedule</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.keys(payload.openingHours).map((day) => {
                        const d = payload.openingHours[day];
                        return (
                          <div key={day} className={`flex items-center gap-3 p-4 rounded-2xl border transition-colors ${d.closed ? 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-100 dark:border-zinc-800 opacity-60' : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 shadow-sm'}`}>
                            <div className="w-16 capitalize text-[10px] font-black uppercase italic tracking-widest text-zinc-900 dark:text-white flex items-center gap-2">
                              <Clock size={12} className="text-orange-500" /> {day.slice(0, 3)}
                            </div>
                            <div className="flex flex-1 items-center gap-2">
                              <input type="time" disabled={d.closed} value={d.open} onChange={(e) => setField(`openingHours.${day}.open`, e.target.value)} className="bg-zinc-50 dark:bg-zinc-800 p-1.5 rounded-lg text-[10px] font-bold outline-none border border-zinc-100 dark:border-zinc-700" />
                              <span className="text-zinc-300 dark:text-zinc-600">-</span>
                              <input type="time" disabled={d.closed} value={d.close} onChange={(e) => setField(`openingHours.${day}.close`, e.target.value)} className="bg-zinc-50 dark:bg-zinc-800 p-1.5 rounded-lg text-[10px] font-bold outline-none border border-zinc-100 dark:border-zinc-700" />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" className="hidden" checked={d.closed} onChange={(e) => setField(`openingHours.${day}.closed`, e.target.checked)} />
                              <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${d.closed ? 'bg-orange-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
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
                  <StepHeader title="KYC Verification" desc="Government compliance & trust markers" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputWrap label="Identity Type" icon={FileText} error={errors["kyc.idType"]}>
                      <select
                        value={payload.kyc.idType}
                        onChange={(e) => setField("kyc.idType", e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 p-3.5 pl-11 rounded-2xl outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium dark:text-white appearance-none"
                      >
                        <option value="">Select Identity Type</option>
                        <option value="NIN">NIN</option>
                        <option value="Driver's License">Driver's License</option>
                        <option value="International Passport">International Passport</option>
                      </select>
                    </InputWrap>
                    <TextInput path="kyc.idNumber" placeholder="ID Number / Reference" icon={FileText} error={errors["kyc.idNumber"]} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[28px] text-center space-y-3">
                      <p className="text-[10px] font-black uppercase italic tracking-widest leading-none">ID Front</p>
                      <div className="w-full aspect-video bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden border border-zinc-100 dark:border-zinc-700">
                        {previews.kycFront ? <img src={previews.kycFront} className="w-full h-full object-cover" /> : <Upload className="text-zinc-200" />}
                      </div>
                      <input type="file" id="idf" className="hidden" accept="image/*" onChange={(e) => handleFileSelect("kycFront", e.target.files[0])} />
                      <label htmlFor="idf" className="inline-block px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-orange-500 hover:text-white transition-all">Choose File</label>
                      {errors.kycFront && <p className="text-[8px] font-bold text-rose-500 uppercase">{errors.kycFront}</p>}
                    </div>
                    <div className="p-4 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[28px] text-center space-y-3">
                      <p className="text-[10px] font-black uppercase italic tracking-widest leading-none">ID Back</p>
                      <div className="w-full aspect-video bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden border border-zinc-100 dark:border-zinc-700">
                        {previews.kycBack ? <img src={previews.kycBack} className="w-full h-full object-cover" /> : <Upload className="text-zinc-200" />}
                      </div>
                      <input type="file" id="idb" className="hidden" accept="image/*" onChange={(e) => handleFileSelect("kycBack", e.target.files[0])} />
                      <label htmlFor="idb" className="inline-block px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-orange-500 hover:text-white transition-all">Choose File</label>
                      {errors.kycBack && <p className="text-[8px] font-bold text-rose-500 uppercase">{errors.kycBack}</p>}
                    </div>
                    <div className="p-4 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[28px] text-center space-y-3">
                      <p className="text-[10px] font-black uppercase italic tracking-widest leading-none">Business Doc</p>
                      <div className="w-full aspect-video bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden border border-zinc-100 dark:border-zinc-700 text-xs">
                        {previews.businessDoc ? (previews.businessDoc.startsWith('blob:') ? 'File Selected' : <img src={previews.businessDoc} className="w-full h-full object-cover" />) : <Upload className="text-zinc-200" />}
                      </div>
                      <input type="file" id="biz" className="hidden" accept="application/pdf,image/*" onChange={(e) => handleFileSelect("businessDoc", e.target.files[0])} />
                      <label htmlFor="biz" className="inline-block px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-orange-500 hover:text-white transition-all">Choose File</label>
                      {errors.businessDoc && <p className="text-[8px] font-bold text-rose-500 uppercase">{errors.businessDoc}</p>}
                    </div>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-8">
                  <StepHeader title="Payout & Delivery" desc="Final details before we launch your store" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TextInput path="payoutDetails.bankName" placeholder="Bank Name" icon={CreditCard} error={errors["payoutDetails.bankName"]} />
                    <TextInput path="payoutDetails.accountName" placeholder="Account Name" icon={User} error={errors["payoutDetails.accountName"]} />
                    <TextInput path="payoutDetails.accountNumber" placeholder="Account Number" icon={CreditCard} error={errors["payoutDetails.accountNumber"]} />
                    <TextInput path="deliveryRadiusKm" placeholder="Delivery Radius (KM)" icon={MapPin} type="number" error={errors.deliveryRadiusKm} />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Business Tags</label>
                    <div className="flex flex-wrap gap-2.5">
                      {TAGS.map((t) => {
                        const active = payload.tags.includes(t);
                        return (
                          <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            key={t}
                            type="button"
                            onClick={() => toggleArrayValue("tags", t)}
                            className={`px-5 py-2.5 rounded-xl border text-[10px] font-black uppercase italic tracking-widest transition-all
                                                            ${active ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xl" : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-100 dark:border-zinc-700"}`}
                          >
                            {t}
                          </motion.button>
                        );
                      })}
                    </div>
                    {errors.tags && <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tight ml-1">{errors.tags}</p>}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-12 pt-10 border-t border-zinc-50 dark:border-zinc-800">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={goBack}
              disabled={step === 1}
              className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase italic tracking-widest transition-all
                                ${step === 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"}`}
            >
              <ChevronLeft size={16} /> Back
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={step < TOTAL_STEPS ? goNext : handleSubmit}
              disabled={submitting}
              className="flex items-center gap-3 px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-[24px] text-[10px] font-black uppercase italic tracking-widest transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50"
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

          <div className="text-center mt-8">
            <Link href="/vendors/auth/login" className="text-[10px] font-black uppercase italic tracking-[0.2em] text-zinc-400 hover:text-orange-600 transition-colors underline-offset-4 decoration-orange-600/30">
              Already a Partner? SIGN IN
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Premium Response Modal */}
      <AnimatePresence>
        {modal.open && (
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
              className="bg-white dark:bg-zinc-900 rounded-[40px] p-8 md:p-12 w-full max-w-lg text-center shadow-2xl relative border border-zinc-100 dark:border-zinc-800"
            >
              <button
                onClick={() => setModal({ ...modal, open: false })}
                className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors"
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
                {modal.title.split(' ')[0]} <span className={modal.type === 'success' ? 'text-zinc-900 dark:text-white' : ''}>{modal.title.split(' ').slice(1).join(' ')}</span>
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest leading-relaxed mb-8">{modal.message}</p>

              <div className="flex gap-3">
                <button
                  onClick={() => setModal({ ...modal, open: false })}
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 py-4 rounded-2xl text-[10px] font-black uppercase italic tracking-widest hover:bg-zinc-200 transition-all"
                >
                  Review Details
                </button>
                {modal.type === 'success' && (
                  <Link
                    href="/vendors/auth/login"
                    className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl text-[10px] font-black uppercase italic tracking-widest flex items-center justify-center hover:scale-[1.02] shadow-lg transition-all"
                  >
                    GOTO DASHBOARD
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
