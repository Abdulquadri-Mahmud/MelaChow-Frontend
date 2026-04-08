"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

import {
  Store,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Clock,
  Utensils,
  Camera,
  FileText,
  Lock,
  Save,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Truck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { updateVendor } from "@/app/lib/vendorProfileApi";
import { useQueryClient } from "@tanstack/react-query";
import PermanentInstallButton from "@/app/components/PermanentInstallButton";

const CLOUDINARY_PRESET = "GrubDash";
const CLOUDINARY_HOST = "https://api.cloudinary.com/v1_1/dypn7gna0/image/upload";

const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_PRESET);
  try {
    const res = await fetch(CLOUDINARY_HOST, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(`Cloudinary upload failed: ${res.status} ${errorData.error?.message || ''}`);
    }

    const data = await res.json();
    return data.secure_url;
  } catch (err) {
    console.error("Cloudinary upload error detailed:", err);
    toast.error(`Image upload failed: ${err.message}`);
    return null;
  }
};

const Section = ({ title, icon: Icon, children, isOpen, onToggle, loading }) => (
  <motion.div
    initial={false}
    className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 overflow-hidden rounded-md"
  >
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-md bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
          <Icon size={16} />
        </div>
        <h3 className="font-black text-slate-900 dark:text-white text-base tracking-tight uppercase leading-none">{title}</h3>
      </div>
      <div className={`text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
        <ChevronDown size={20} />
      </div>
    </button>

    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="p-4 pt-0 border-t border-slate-50 dark:border-slate-800/50">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

const InputGroup = ({ label, icon: Icon, ...props }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
      {Icon && <Icon size={12} />} {label}
    </label>
    <div className="relative group">
      <input
        className={`w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold uppercase tracking-tight rounded-md focus:ring-1 focus:ring-orange-600 focus:border-orange-600 block p-3 transition-all outline-none ${props.disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-slate-300 dark:hover:border-slate-700'}`}
        {...props}
      />
    </div>
  </div>
);

export default function VendorProfilePage({ vendor }) {
  const [basicInfo, setBasicInfo] = useState({ storeName: "", phone: "", email: "", storeDescription: "", password: "" });
  const [address, setAddress] = useState({ street: "", city: "", state: "", postalCode: "" });
  const [cuisineTypes, setCuisineTypes] = useState([]);
  const [openingHours, setOpeningHours] = useState({});
  const [deliverySettings, setDeliverySettings] = useState({
    deliveryManagedBy: "admin",
    flatRateDeliveryFee: 0,
    deliveryRadiusKm: 5
  });
  const [payoutDetails, setPayoutDetails] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
  });
  const [logo, setLogo] = useState("");
  const [openSections, setOpenSections] = useState({ basicInfo: true }); // Default open first section
  const [loadingSection, setLoadingSection] = useState("");

  useEffect(() => {
    if (vendor) {
      setBasicInfo({
        storeName: vendor.storeName || "",
        phone: vendor.phone || "",
        email: vendor.email || "",
        storeDescription: vendor.storeDescription || "",
        password: "",
      });
      setAddress({
        street: vendor.address?.street || "",
        city: vendor.address?.city || "",
        state: vendor.address?.state || "",
        postalCode: vendor.address?.postalCode || "",
      });
      setCuisineTypes(vendor.cuisineTypes || []);
      setOpeningHours(vendor.openingHours || {});
      setDeliverySettings({
        deliveryManagedBy: vendor.deliveryManagedBy || "admin",
        flatRateDeliveryFee: vendor.flatRateDeliveryFee || 0,
        deliveryRadiusKm: vendor.deliveryRadiusKm || 5
      });
      setPayoutDetails({
        bankName: vendor.payoutDetails?.bankName || "",
        accountName: vendor.payoutDetails?.accountName || "",
        accountNumber: vendor.payoutDetails?.accountNumber || "",
      });
      setLogo(vendor.logo || "");
    }
  }, [vendor]);

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const queryClient = useQueryClient();

  const updateSection = async (section, data) => {
    setLoadingSection(section);
    try {
      let payload = {};

      if (section === "basicInfo") {
        payload = {
          storeName: data.storeName,
          phone: data.phone,
          email: data.email,
          storeDescription: data.storeDescription,
        };
        if (data.password) payload.password = data.password;
      } else if (section === "address") {
        payload = { address: { ...data } };
      } else if (section === "cuisineTypes") {
        payload = { cuisineTypes: data };
      } else if (section === "openingHours") {
        payload = { openingHours: data };
      } else if (section === "deliverySettings") {
        payload = {
          deliveryManagedBy: data.deliveryManagedBy,
          flatRateDeliveryFee: Number(data.flatRateDeliveryFee),
          deliveryRadiusKm: Number(data.deliveryRadiusKm)
        };
      } else if (section === "payoutDetails") {
        payload = {
          payoutDetails: {
            bankName: data.bankName,
            accountName: data.accountName,
            accountNumber: data.accountNumber,
          }
        };
      } else if (section === "logo") {
        payload = { logo: data };
      }

      await updateVendor({ id: vendor._id, data: payload });

      // âœ… Invalidate vendor profile query
      queryClient.invalidateQueries({ queryKey: ["vendors"] });

      toast.success(`${section.replace(/([A-Z])/g, ' $1').trim()} updated successfully!`, {
        icon: '✅',
        style: { borderRadius: '10px', background: '#333', color: '#fff' }
      });
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || `Failed to update ${section}`;
      toast.error(errorMessage);
    } finally {
      setLoadingSection("");
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const toastId = toast.loading("Uploading logo...");
    const url = await uploadToCloudinary(file);
    if (url) {
      setLogo(url);
      await updateSection("logo", url);
      toast.success("Logo updated!", { id: toastId });
    } else {
      toast.dismiss(toastId);
    }
  };

  const handleCuisineChange = (index, value) => {
    const newArr = [...cuisineTypes];
    newArr[index] = value;
    setCuisineTypes(newArr);
  };
  const handleAddCuisine = () => setCuisineTypes([...cuisineTypes, ""]);
  const handleRemoveCuisine = (index) => setCuisineTypes(cuisineTypes.filter((_, i) => i !== index));

  const handleOpeningHoursChange = (day, key, value) => {
    setOpeningHours({ ...openingHours, [day]: { ...openingHours[day], [key]: value } });
  };

  if (!vendor) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-4">

      {/* Hero Banner */}
      <div className="relative rounded-md overflow-hidden bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 group">
        <div className="h-40 w-full relative overflow-hidden">
          {/* Background Image (Blurred Logo/Cover) */}
          <div className="absolute inset-0 bg-gray-900">
            <img
              src={logo || "/placeholder.jpg"}
              alt="Cover Background"
              className="w-full h-full object-cover opacity-50 blur-xl scale-110"
            />
          </div>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
        </div>
        <div className="px-6 pb-6 flex flex-col md:flex-row gap-5 -mt-10 relative z-10">
          <div className="relative group">
            <div className="w-24 h-24 rounded-md border-4 border-white dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-800">
              <img src={logo || "/placeholder.jpg"} alt="Logo" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
            </div>
            <label className="absolute bottom-1 right-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-1.5 rounded-md cursor-pointer hover:bg-orange-600 hover:text-white transition-colors">
              <Camera size={14} />
              <input type="file" className="hidden" onChange={handleLogoChange} accept="image/*" />
            </label>
          </div>

          <div className="flex-1 pt-14 md:pt-14">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">{basicInfo.storeName || "My Store"}</h1>
                <p className="text-gray-500 font-medium flex items-center gap-1 mt-1">
                  <MapPin size={14} className="text-orange-500" />
                  {address.city || "City"}, {address.state || "State"}
                </p>
              </div>
            <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border w-fit ${vendor.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-rose-50 text-rose-600 border-rose-200"}`}>
                {vendor.isActive ? "Active" : "In Active"}
              </div>
            </div>

            <div className="flex items-center gap-6 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800/50">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Total Sales</p>
                <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">₦{vendor.totalSales?.toLocaleString() ?? "0"}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Rating</p>
                <div className="flex items-center gap-1">
                  <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{vendor.ratings?.toFixed(1) ?? "New"}</span>
                  <span className="text-orange-600">★</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Joined</p>
                <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">

        {/* Basic Info */}
        <Section
          title="General Information"
          icon={Store}
          isOpen={openSections.basicInfo}
          onToggle={() => toggleSection('basicInfo')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup label="Store Name" name="storeName" value={basicInfo.storeName} onChange={(e) => setBasicInfo({ ...basicInfo, storeName: e.target.value })} icon={Store} />
            <InputGroup label="Phone Number" name="phone" value={basicInfo.phone} onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })} icon={Phone} />
            <InputGroup label="Email Address" value={basicInfo.email} disabled icon={Mail} />
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <FileText size={12} /> Description
              </label>
              <textarea
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-[11px] font-bold uppercase tracking-tight rounded-md focus:ring-1 focus:ring-orange-600 focus:border-orange-600 block p-3 transition-all outline-none h-24 resize-none hover:border-slate-300 dark:hover:border-slate-700"
                value={basicInfo.storeDescription}
                onChange={(e) => setBasicInfo({ ...basicInfo, storeDescription: e.target.value })}
              />
            </div>
            <InputGroup label="New Password (Optional)" type="password" value={basicInfo.password} onChange={(e) => setBasicInfo({ ...basicInfo, password: e.target.value })} icon={Lock} placeholder="Leave blank to keep current" />
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={() => updateSection("basicInfo", basicInfo)} disabled={loadingSection === "basicInfo"} className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-md font-black uppercase text-[10px] tracking-widest hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50">
              {loadingSection === "basicInfo" ? "Saving..." : <><Save size={16} /> Save Changes</>}
            </button>
          </div>
        </Section>

        {/* Address */}
        <Section
          title="Location & Address"
          icon={MapPin}
          isOpen={openSections.address}
          onToggle={() => toggleSection('address')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <InputGroup label="Street Address" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} icon={MapPin} />
            </div>
            <InputGroup label="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
            <InputGroup label="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
            <InputGroup label="Postal Code" value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} />
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={() => updateSection("address", address)} disabled={loadingSection === "address"} className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-md font-black uppercase text-[10px] tracking-widest hover:bg-orange-700 transition-all  Active:scale-95 disabled:opacity-50">
              {loadingSection === "address" ? "Saving..." : <><Save size={16} /> Update Location</>}
            </button>
          </div>
        </Section>

        {/* Cuisine Types */}
        <Section
          title="Cuisines & Tags"
          icon={Utensils}
          isOpen={openSections.cuisineTypes}
          onToggle={() => toggleSection('cuisineTypes')}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {cuisineTypes.map((cuisine, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 pl-3 pr-2 py-1.5 rounded-md group hover:border-orange-500 transition-colors">
                    <input
                      className="bg-transparent outline-none text-xs font-black uppercase tracking-tight w-20 text-slate-700 dark:text-slate-300"
                      value={cuisine}
                      onChange={(e) => handleCuisineChange(idx, e.target.value)}
                    />
                    <button onClick={() => handleRemoveCuisine(idx)} className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-rose-500 hover:text-white transition-colors text-xs font-black">×</button>
                  </div>
              ))}
              <button onClick={handleAddCuisine} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-md text-slate-500 hover:text-orange-600 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all font-black uppercase text-[9px] tracking-widest">
                + Add Cuisine
              </button>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button onClick={() => updateSection("cuisineTypes", cuisineTypes)} disabled={loadingSection === "cuisineTypes"} className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all  Active:scale-95 disabled:opacity-50">
              {loadingSection === "cuisineTypes" ? "Saving..." : <><Save size={18} /> Update Cuisines</>}
            </button>
          </div>
        </Section>

        {/* Opening Hours */}
        <Section
          title="Operating Hours"
          icon={Clock}
          isOpen={openSections.openingHours}
          onToggle={() => toggleSection('openingHours')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
              <div key={day} className="border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="capitalize font-black text-[11px] uppercase tracking-wider text-slate-900 dark:text-white">{day}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 d-block">Open</label>
                    <input type="time" value={openingHours[day]?.open || ""} onChange={(e) => handleOpeningHoursChange(day, "open", e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-md p-2 text-xs outline-none focus:border-orange-500 transition-all font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 d-block">Close</label>
                    <input type="time" value={openingHours[day]?.close || ""} onChange={(e) => handleOpeningHoursChange(day, "close", e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-md p-2 text-xs outline-none focus:border-orange-500 transition-all font-bold" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={() => updateSection("openingHours", openingHours)} disabled={loadingSection === "openingHours"} className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-md font-black uppercase text-[10px] tracking-widest hover:bg-orange-700 transition-all  Active:scale-95 disabled:opacity-50">
              {loadingSection === "openingHours" ? "Saving..." : <><Save size={16} /> Update Hours</>}
            </button>
          </div>
        </Section>

        {/* Delivery Settings */}
        <Section
          title="Delivery Settings"
          icon={Truck}
          isOpen={openSections.deliverySettings}
          onToggle={() => toggleSection('deliverySettings')}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setDeliverySettings({ ...deliverySettings, deliveryManagedBy: "vendor" })}
                className={`flex flex-col items-start p-4 rounded-2xl border-2 transition-all text-left ${deliverySettings.deliveryManagedBy === "vendor" ? "border-orange-600 bg-orange-50" : "border-gray-100 bg-white"}`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <Truck className={deliverySettings.deliveryManagedBy === "vendor" ? "text-orange-600" : "text-gray-400"} size={20} />
                  {deliverySettings.deliveryManagedBy === "vendor" && <div className="w-4 h-4 rounded-full bg-orange-600 flex items-center justify-center"><Save className="text-white" size={10} /></div>}
                </div>
                <p className="text-sm font-bold text-gray-900">Manage my own delivery</p>
                <p className="text-xs text-gray-500 mt-1">You use your own riders for fulfillment</p>
              </button>

              <button
                type="button"
                onClick={() => setDeliverySettings({ ...deliverySettings, deliveryManagedBy: "admin", flatRateDeliveryFee: 0 })}
                className={`flex flex-col items-start p-4 rounded-2xl border-2 transition-all text-left ${deliverySettings.deliveryManagedBy === "admin" ? "border-orange-600 bg-orange-50" : "border-gray-100 bg-white"}`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <Store className={deliverySettings.deliveryManagedBy === "admin" ? "text-orange-600" : "text-gray-400"} size={20} />
                  {deliverySettings.deliveryManagedBy === "admin" && <div className="w-4 h-4 rounded-full bg-orange-600 flex items-center justify-center"><Save className="text-white" size={10} /></div>}
                </div>
                <p className="text-sm font-bold text-gray-900">Use platform delivery</p>
                <p className="text-xs text-gray-500 mt-1">MelaChow handles delivery for you</p>
              </button>
            </div>

            <AnimatePresence>
              {deliverySettings.deliveryManagedBy === "vendor" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Flat Delivery Fee (₦)" type="number" value={deliverySettings.flatRateDeliveryFee} onChange={(e) => setDeliverySettings({ ...deliverySettings, flatRateDeliveryFee: e.target.value })} placeholder="0" />
                  <InputGroup label="Delivery Radius (KM)" type="number" value={deliverySettings.deliveryRadiusKm} onChange={(e) => setDeliverySettings({ ...deliverySettings, deliveryRadiusKm: e.target.value })} placeholder="5" />
                </motion.div>
              )}
            </AnimatePresence>

            {deliverySettings.deliveryManagedBy === "admin" && (
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                <p className="text-xs font-medium text-orange-800 flex items-center gap-2">
                  <Save size={14} /> Platform delivery fees are set by the administrator for your city.
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={() => updateSection("deliverySettings", deliverySettings)} disabled={loadingSection === "deliverySettings"} className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-md font-black uppercase text-[10px] tracking-widest hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50">
              {loadingSection === "deliverySettings" ? "Saving..." : <><Save size={16} /> Update Delivery</>}
            </button>
          </div>
        </Section>

        {/* Payout Details */}
        <Section
          title="Finance Details"
          icon={CreditCard}
          isOpen={openSections.payoutDetails}
          onToggle={() => toggleSection('payoutDetails')}
        >
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
              <h4 className="font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2 uppercase text-xs tracking-wider"><DollarSign size={16} className="text-emerald-500" /> Bank Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <InputGroup label="Bank Name" value={payoutDetails.bankName} onChange={(e) => setPayoutDetails({ ...payoutDetails, bankName: e.target.value })} icon={Store} />
                </div>
                <InputGroup label="Account Name" value={payoutDetails.accountName} onChange={(e) => setPayoutDetails({ ...payoutDetails, accountName: e.target.value })} icon={FileText} />
                <InputGroup label="Account Number" value={payoutDetails.accountNumber} onChange={(e) => setPayoutDetails({ ...payoutDetails, accountNumber: e.target.value })} icon={CreditCard} />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={() => updateSection("payoutDetails", payoutDetails)} disabled={loadingSection === "payoutDetails"} className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-md font-black uppercase text-[10px] tracking-widest hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50">
              {loadingSection === "payoutDetails" ? "Saving..." : <><Save size={16} /> Update Finance</>}
            </button>
          </div>
        </Section>

        {/* PWA Install Section */}
        <div className="mt-8 mb-10">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 text-center">Take your store on the go</p>
          <PermanentInstallButton />
        </div>

      </div>
    </div>
  );
}

