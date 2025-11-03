"use client";
import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

/**
 * Put your cuisine + tag options here (adjust as needed)
 */
const CUISINES = ["Rice", "Swallow", "Peppered Chicken Fries", "Pasta", "Snacks", "Drinks"];
const TAGS = ["Nigerian", "Spicy", "Affordable", "Swallow", "Jollof", "Vegan"];

/**
 * Cloudinary upload helper (uses your upload preset 'GrubDash')
 */

const LogoImage = () => (
  <img
    src="/logo.png"
    alt="GrubDash Logo"
    className="w-[170px] object-contain"
  />
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
  const [modal, setModal] = useState({ open: false, title: "", message: "" });

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

  // The payload-stable state that will be submitted (matches your payload)
  const [payload, setPayload] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    storeName: "",
    storeDescription: "",
    logo: "", // will be url after cloudinary upload
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      coordinates: { type: "Point", coordinates: [0, 0] }, // [lon, lat]
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

  /* ------------------------- helpers ------------------------- */

  const setField = (path, value) => {
    // path: "name" or "address.street" or "openingHours.monday.open" etc.
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

    // preview
    if (file.type === "application/pdf") {
      const url = URL.createObjectURL(file);
      setPreviews((p) => ({ ...p, [fileKey]: url }));
    } else {
      const url = URL.createObjectURL(file);
      setPreviews((p) => ({ ...p, [fileKey]: url }));
    }
    // clear error for that field
    setErrors((e) => ({ ...e, [fileKey]: "" }));
  };

  /* ------------------------- validation ------------------------- */

  const validateStep = async (s = step) => {
    // Returns true if valid
    const e = {}; 
    if (s === 1) {
      if (!payload.name) e.name = "Owner / contact name required";
      if (!payload.email) e.email = "Email required";
      if (!payload.phone) e.phone = "Phone required";
      if (!payload.password) e.password = "Password required";
    }
    if (s === 2) {
      if (!payload.storeName) e.storeName = "Store name required";
      if (!payload.storeDescription) e.storeDescription = "Store description required";
      // require logo file or already uploaded url
      if (!files.logo && !payload.logo) e.logo = "Store logo required";
    }
    if (s === 3) {
      if (!payload.address.street) e["address.street"] = "Street required";
      if (!payload.address.city) e["address.city"] = "City required";
      if (!payload.address.state) e["address.state"] = "State required";
      if (!payload.address.postalCode) e["address.postalCode"] = "Postal / ZIP required";
      // coordinates: require both lon & lat
    //   const [lon, lat] = payload.address.coordinates.coordinates;
    //   if (!lon || !lat) e["address.coordinates"] = "Longitude and latitude required";
    }
    if (s === 4) {
      if (!payload.cuisineTypes || payload.cuisineTypes.length === 0) e.cuisineTypes = "Select at least one cuisine type";
      // openingHours - basic check: each day has open/close unless closed true
      Object.keys(payload.openingHours).forEach((d) => {
        const day = payload.openingHours[d];
        if (!day.closed && (!day.open || !day.close)) {
          e[`openingHours.${d}`] = `${d} needs open & close times or mark closed`;
        }
      });
    }
    if (s === 5) {
      if (!payload.kyc.idType) e["kyc.idType"] = "ID type required";
      if (!payload.kyc.idNumber) e["kyc.idNumber"] = "ID number required";
      if (!files.kycFront && !payload.kyc.idFrontUrl) e.kycFront = "Upload ID front";
      if (!files.kycBack && !payload.kyc.idBackUrl) e.kycBack = "Upload ID back";
      if (!files.businessDoc && !payload.kyc.businessRegistrationDoc) e.businessDoc = "Upload business registration document";
    }
    if (s === 6) {
      if (!payload.payoutDetails.bankName) e["payoutDetails.bankName"] = "Bank name required";
      if (!payload.payoutDetails.accountName) e["payoutDetails.accountName"] = "Account name required";
      if (!payload.payoutDetails.accountNumber) e["payoutDetails.accountNumber"] = "Account number required";
      if (!payload.deliveryRadiusKm && payload.acceptsDelivery) e.deliveryRadiusKm = "Delivery radius required";
      if (!payload.tags || payload.tags.length === 0) e.tags = "Select at least one tag";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ------------------------- navigation ------------------------- */

  const goNext = async () => {
    const ok = await validateStep(step);
    if (!ok) return;
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  };
  const goBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  /* ------------------------- submit ------------------------- */

  const handleSubmit = async () => {
    // final validation for last step
    const ok = await validateStep(TOTAL_STEPS);
    if (!ok) {
      setStep(TOTAL_STEPS);
      return;
    }
    setSubmitting(true);

    try {
      // Upload pending files (logo, kyc front/back, business doc) if provided
      const uploaded = {};

      if (files.logo) {
        const url = await uploadToCloudinary(files.logo);
        if (!url) throw new Error("Logo upload failed");
        uploaded.logo = url;
      }
      if (files.kycFront) {
        const url = await uploadToCloudinary(files.kycFront);
        if (!url) throw new Error("KYC front upload failed");
        uploaded.kycFront = url;
      }
      if (files.kycBack) {
        const url = await uploadToCloudinary(files.kycBack);
        if (!url) throw new Error("KYC back upload failed");
        uploaded.kycBack = url;
      }
      if (files.businessDoc) {
        // business doc may be pdf or image
        const url = await uploadToCloudinary(files.businessDoc);
        if (!url) throw new Error("Business doc upload failed");
        uploaded.businessDoc = url;
      }

      // Merge uploaded URLs into finalPayload (prefer existing payload urls if provided)
      const finalPayload = JSON.parse(JSON.stringify(payload));
      if (uploaded.logo) finalPayload.logo = uploaded.logo;
      if (uploaded.kycFront) finalPayload.kyc.idFrontUrl = uploaded.kycFront;
      if (uploaded.kycBack) finalPayload.kyc.idBackUrl = uploaded.kycBack;
      if (uploaded.businessDoc) finalPayload.kyc.businessRegistrationDoc = uploaded.businessDoc;

      // Ensure payoutMethod & payoutEnabled, acceptsDelivery etc. (already in state, but ensure default)
      finalPayload.payoutDetails = {
        ...finalPayload.payoutDetails,
        payoutMethod: finalPayload.payoutDetails.payoutMethod || "paystack",
        payoutEnabled: finalPayload.payoutDetails.payoutEnabled === undefined ? true : finalPayload.payoutDetails.payoutEnabled,
      };
      finalPayload.acceptsDelivery = !!finalPayload.acceptsDelivery;
      finalPayload.deliveryRadiusKm = finalPayload.deliveryRadiusKm || 5;
      finalPayload.metadata = finalPayload.metadata || { featured: true };

    //   console.log(finalPayload);
      // POST to API
      const res = await axios.post("https://grub-dash-api.vercel.app/api/vendors/create", finalPayload, {
        headers: { "Content-Type": "application/json" },
      });
      
    //   console.log(res.data);

      if (res.status === 200 || res.status === 201) {
        // success — show a success modal then optionally redirect
        setModal({ open: true, title: "Registration Successful", message: `${res.data?.message || "Your vendor account has been created. Check email for verification next steps."}` });
        // optionally reset form or redirect
      } else {
        // show server error in modal
        setModal({ open: true, title: "Registration Failed", message: res.data?.message || "Server returned an error." });
      }
    } catch (err) {
      console.error("Submission error:", err);
      setModal({ open: true, title: "Registration Failed", message: (err?.response?.data?.message) || err.message || "Network or upload error" });
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------------- small UI components ------------------------- */

  const StepHeader = ({ title, desc }) => (
    <div className="mb-4 text-center">
      <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
      {desc && <p className="text-sm  text-gray-600 mt-1">{desc}</p>}
    </div>
  );

  /* ------------------------- render ------------------------- */

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center md:p-6 p-3">
      <div className="w-full max-w-4xl">
        {/* Top header */}
        <div className=" gap-4 mb-3 bg-white py-2 px-4 rounded-xl">
            <div className="flex justify-center">
                <LogoImage/>
            </div>
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-800">Vendor Registration</h1>
                <p className="text-sm text-gray-600">Complete these steps to create your vendor account</p>
            </div>
            {/* Progress bar */}
            <div className="mt-2">
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div className="h-2 bg-orange-500 transition-all" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
                </div>
                <p className="text-right text-sm text-gray-600 mt-1">Step {step} of {TOTAL_STEPS}</p>
            </div>
        </div>


        {/* Card */}
        <div className="bg-white rounded-xl shadow md:p-6 p-4">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <StepHeader title="Account Information" desc="Your contact & login details" />
                <div className="grid grid-cols-2 md:grid-cols-2 md:gap-4 gap-2">
                  <div>
                    <label className="block text-sm text-gray-700">Owner / Contact Name *</label>
                    <input value={payload.name} onChange={(e) => setField("name", e.target.value)} className="mt-1 p-2 border border-gray-100 rounded w-full" />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700">Email *</label>
                    <input type="email" value={payload.email} onChange={(e) => setField("email", e.target.value)} className="mt-1 p-2 border border-gray-100 rounded w-full" />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700">Phone *</label>
                    <input type="phone" value={payload.phone} onChange={(e) => setField("phone", e.target.value)} className="mt-1 p-2 border border-gray-100 rounded w-full" />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700">Password *</label>
                    <input type="password" value={payload.password} onChange={(e) => setField("password", e.target.value)} className="mt-1 p-2 border border-gray-100 rounded w-full" />
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <StepHeader title="Store Details" desc="How your store will appear on GrubDash" />
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700">Store Name *</label>
                    <input placeholder="GrubDash Restaurant" value={payload.storeName} onChange={(e) => setField("storeName", e.target.value)} className="mt-1 p-2 border border-gray-100 outline-0 rounded w-full" />
                    {errors.storeName && <p className="text-red-500 text-sm mt-1">{errors.storeName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700">Store Description *</label>
                    <textarea placeholder="Delicious Nigerian dishes with home vibes" value={payload.storeDescription} onChange={(e) => setField("storeDescription", e.target.value)} rows={3} className="mt-1 p-2 border border-gray-100 outline-0 rounded w-full" />
                    {errors.storeDescription && <p className="text-red-500 text-sm mt-1">{errors.storeDescription}</p>}
                  </div>

                  <div className="w-full flex justify-between">
                    <div className="">
                        <label className="block text-sm text-gray-700">Store Logo (upload) *</label>
                        <input type="file" accept="image/*" onChange={(e) => handleFileSelect("logo", e.target.files[0])} className="mt-1 border border-gray-100 outline-0 text-sm p-3 rounded" />
                    </div>
                    <div className="">
                        {previews.logo && <img src={previews.logo} alt="logo preview" className="w-20 h-20 object-contain rounded" />}
                        {/* if already have url in state show it */}
                        {payload.logo && !previews.logo && <img src={payload.logo} alt="logo url" className="mt-2 w-20 h-20 object-contain rounded" />}
                    </div>
                    {errors.logo && <p className="text-red-500 text-sm mt-1">{errors.logo}</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <StepHeader title="Address" desc="Where your store is located (coordinates required)" />
                <div className="grid grid-cols-2 md:grid-cols-2 md:gap-4 gap-2">
                  <div>
                    <label className="block text-sm text-gray-700">Street *</label>
                    <input placeholder="E.g Akin Ogunlewe Str" value={payload.address.street} onChange={(e) => setField("address.street", e.target.value)} className="mt-1 p-2 border border border-gray-100 outline-0 rounded w-full" />
                    {errors["address.street"] && <p className="text-red-500 text-sm mt-1">{errors["address.street"]}</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700">City *</label>
                    <input placeholder="E.g Ikorodu" value={payload.address.city} onChange={(e) => setField("address.city", e.target.value)} className="mt-1 p-2 border border border-gray-100 outline-0 rounded w-full" />
                    {errors["address.city"] && <p className="text-red-500 text-sm mt-1">{errors["address.city"]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700">State *</label>
                    <input placeholder="E.g Lagos" value={payload.address.state} onChange={(e) => setField("address.state", e.target.value)} className="mt-1 p-2 border border border-gray-100 outline-0 rounded w-full" />
                    {errors["address.state"] && <p className="text-red-500 text-sm mt-1">{errors["address.state"]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700">Postal Code *</label>
                    <input placeholder="E.g 101010" value={payload.address.postalCode} onChange={(e) => setField("address.postalCode", e.target.value)} className="mt-1 p-2 border border border-gray-100 outline-0 rounded w-full" />
                    {errors["address.postalCode"] && <p className="text-red-500 text-sm mt-1">{errors["address.postalCode"]}</p>}
                  </div>

                  {/* <div>
                    <label className="block text-sm text-gray-700">Longitude (coordinates[0]) *</label>
                    <input value={payload.address.coordinates.coordinates[0]} onChange={(e) => setField("address.coordinates.coordinates.0", e.target.value)} className="mt-1 p-2 border border border-gray-100 outline-0 rounded w-full" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700">Latitude (coordinates[1]) *</label>
                    <input value={payload.address.coordinates.coordinates[1]} onChange={(e) => setField("address.coordinates.coordinates.1", e.target.value)} className="mt-1 p-2 border border border-gray-100 outline-0 rounded w-full" />
                  </div> */}

                  {errors["address.coordinates"] && <p className="text-red-500 text-sm mt-1 col-span-2">{errors["address.coordinates"]}</p>}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <StepHeader title="Cuisine & Opening Hours" desc="Select cuisine types and set opening hours" />
                <div className="mb-4">
                  <p className="text-sm text-gray-700 mb-2">Cuisine Types *</p>
                  <div className="flex flex-wrap gap-2">
                    {CUISINES.map((c) => {
                      const active = payload.cuisineTypes.includes(c);
                      return (
                        <button key={c} type="button" onClick={() => toggleArrayValue("cuisineTypes", c)}
                          className={`px-3 py-1 rounded-full border ${active ? "bg-orange-500 text-white" : "bg-white text-gray-800 border-gray-300"}`}>
                          {c}
                        </button>
                      );
                    })}
                  </div>
                  {errors.cuisineTypes && <p className="text-red-500 text-sm mt-2">{errors.cuisineTypes}</p>}
                </div>

                <div>
                  <p className="text-sm text-gray-700 mb-2">Opening Hours (set times or mark closed)</p>
                  <div className="space-y-2 grid gricol2">
                    {Object.keys(payload.openingHours).map((day) => {
                      const d = payload.openingHours[day];
                      return (
                        <div key={day} className="flex items-center gap-3">
                          <div className="w-24 capitalize text-sm text-gray-700">{day}</div>
                          <input type="time" value={d.open} onChange={(e) => setField(`openingHours.${day}.open`, e.target.value)} className="p-1 border rounded" />
                          <input type="time" value={d.close} onChange={(e) => setField(`openingHours.${day}.close`, e.target.value)} className="p-1 border rounded" />
                          <label className="flex items-center gap-1 text-sm text-gray-700">
                            <input type="checkbox" checked={d.closed} onChange={(e) => setField(`openingHours.${day}.closed`, e.target.checked)} />
                            Closed
                          </label>
                          {errors[`openingHours.${day}`] && <p className="text-red-500 text-xs">{errors[`openingHours.${day}`]}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div key="s5" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <StepHeader title="KYC (IDs & Business Doc)" desc="Upload ID front/back and business registration doc" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700">ID Type *</label>
                    <select value={payload.kyc.idType} onChange={(e) => setField("kyc.idType", e.target.value)} className="mt-1 p-2 border border-gray-100 outline-0 text-sm rounded w-full">
                      <option value="">Select ID Type</option>
                      <option value="NIN">NIN</option>
                      <option value="Driver's License">Driver's License</option>
                      <option value="International Passport">International Passport</option>
                    </select>
                    {errors["kyc.idType"] && <p className="text-red-500 text-sm mt-1">{errors["kyc.idType"]}</p>}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700">ID Number *</label>
                    <input value={payload.kyc.idNumber} onChange={(e) => setField("kyc.idNumber", e.target.value)} className="mt-1 p-2 border border-gray-100 outline-0 text-sm rounded w-full" />
                    {errors["kyc.idNumber"] && <p className="text-red-500 text-sm mt-1">{errors["kyc.idNumber"]}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="">
                        <label className="block text-sm text-gray-700">Upload ID Front *</label>
                        <input type="file" accept="image/*" onChange={(e) => handleFileSelect("kycFront", e.target.files[0])} className=" rounded mt-1 border border-gray-100 w-[95%] p-2" />
                        {previews.kycFront && <img src={previews.kycFront} alt="kyc front" className="mt-2 w-20 h-20 object-contain rounded" />}
                        {errors.kycFront && <p className="text-red-500 text-sm mt-1">{errors.kycFront}</p>}
                    </div>

                    <div className="">
                        <label className="block text-sm text-gray-700">Upload ID Back *</label>
                        <input type="file" accept="image/*" onChange={(e) => handleFileSelect("kycBack", e.target.files[0])} className=" rounded mt-1 border border-gray-100 w-[95%] p-2" />
                        {previews.kycBack && <img src={previews.kycBack} alt="kyc back" className="mt-2 w-20 h-20 object-contain rounded" />}
                        {errors.kycBack && <p className="text-red-500 text-sm mt-1">{errors.kycBack}</p>}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-700">Business Registration Document (pdf/image) *</label>
                    <input type="file" accept="application/pdf,image/*" onChange={(e) => handleFileSelect("businessDoc", e.target.files[0])} className=" rounded mt-1 border border-gray-100 p-2 w-full" />
                    {previews.businessDoc && previews.businessDoc.endsWith(".pdf") ? (
                      // embed pdf preview
                      <embed src={previews.businessDoc} className="mt-2 w-full h-40 rounded" />
                    ) : (
                      previews.businessDoc && <img src={previews.businessDoc} alt="doc" className="mt-2 w-36 h-36 object-cover rounded" />
                    )}
                    {errors.businessDoc && <p className="text-red-500 text-sm mt-1">{errors.businessDoc}</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 6 && (
              <motion.div key="s6" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <StepHeader title="Payout, Delivery & Tags" desc="Bank details, delivery options and tags" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-sm text-gray-700">Bank Name *</label>
                        <input value={payload.payoutDetails.bankName} onChange={(e) => setField("payoutDetails.bankName", e.target.value)} className="mt-1 p-2 border border border-gray-100 outline-0 rounded w-full" />
                        {errors["payoutDetails.bankName"] && <p className="text-red-500 text-sm mt-1">{errors["payoutDetails.bankName"]}</p>}
                    </div>

                    <div>
                        <label className="block text-sm text-gray-700">Account Name *</label>
                        <input value={payload.payoutDetails.accountName} onChange={(e) => setField("payoutDetails.accountName", e.target.value)} className="mt-1 p-2 border border border-gray-100 outline-0 rounded w-full" />
                        {errors["payoutDetails.accountName"] && <p className="text-red-500 text-sm mt-1">{errors["payoutDetails.accountName"]}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-sm text-gray-700">Account Number *</label>
                        <input value={payload.payoutDetails.accountNumber} onChange={(e) => setField("payoutDetails.accountNumber", e.target.value)} className="mt-1 p-2 border border border-gray-100 outline-0 rounded w-full" />
                        {errors["payoutDetails.accountNumber"] && <p className="text-red-500 text-sm mt-1">{errors["payoutDetails.accountNumber"]}</p>}
                    </div>

                    <div>
                        <label className="block text-sm text-gray-700">Payout Method</label>
                        <select value={payload.payoutDetails.payoutMethod} onChange={(e) => setField("payoutDetails.payoutMethod", e.target.value)} className="mt-1 p-2 border border border-gray-100 outline-0 rounded w-full">
                        <option value="paystack">Paystack</option>
                        </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-3 border border-gray-100 px-3 rounded">
                        <label className="text-sm text-gray-700">Accepts Delivery</label>
                        <input type="checkbox" checked={payload.acceptsDelivery} onChange={(e) => setField("acceptsDelivery", e.target.checked)} />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-700">Delivery Radius (km)</label>
                        <input type="number" value={payload.deliveryRadiusKm} onChange={(e) => setField("deliveryRadiusKm", Number(e.target.value))} className="mt-1 p-2 border border border-gray-100 outline-0 rounded w-full" />
                        {errors.deliveryRadiusKm && <p className="text-red-500 text-sm mt-1">{errors.deliveryRadiusKm}</p>}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-700 mb-2">Select Tags *</p>
                    <div className="flex flex-wrap gap-2">
                      {TAGS.map((t) => {
                        const active = payload.tags.includes(t);
                        return (
                          <button key={t} type="button" onClick={() => toggleArrayValue("tags", t)}
                            className={`px-3 py-1 rounded-full border ${active ? "bg-orange-500 text-white" : "bg-gray-50 cursor-pointer text-gray-800 border-gray-300"}`}>
                            {t}
                          </button>
                        );
                      })}
                    </div>
                    {errors.tags && <p className="text-red-500 text-sm mt-2">{errors.tags}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={payload.metadata?.featured} onChange={(e) => setField("metadata.featured", e.target.checked)} />
                      <span className="text-sm text-gray-700">Mark as featured (metadata.featured)</span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* nav */}
          <div className="flex items-center justify-between mt-6">
            <div>
              <button onClick={goBack} disabled={step === 1} className={`px-4 py-2 rounded ${step === 1 ? "bg-gray-200 text-gray-400" : "bg-white text-gray-800 border"}`}>
                Back
              </button>
            </div>

            <div className="flex items-center gap-3">
              {step < TOTAL_STEPS ? (
                <button onClick={goNext} className="px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600">Next</button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600">
                  {submitting ? "Submitting..." : "Submit Registration"}
                </button>
              )}
            </div>
          </div>
          <p className="text-start text-gray-500 text-sm mt-3">
            Already a vendor?{" "}
            <Link
              href="/vendors/auth/login"
              className="text-[#FF6B00] font-medium hover:underline"
            >
              Sign in to your dashboard
            </Link>
          </p>
        </div>

        {/* modal */}
        {modal.open && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{modal.title}</h3>
              <p className="text-gray-600">{modal.message}</p>
              <div className="mt-4 text-right">
                <button onClick={() => setModal({ open: false, title: "", message: "" })} className="px-4 py-2 rounded bg-orange-500 text-white">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
