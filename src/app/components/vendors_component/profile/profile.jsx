"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import {
  CheckCircle,
  BadgeCheck,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Clock,
  Utensils,
  Store,
  Star,
  Camera,
  FileText,
  Lock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { updateVendor } from "@/app/utils/vendor/api/vendorProfileApi";
import ScrollToTopButton from "../../ScrollToTopButton";

const CLOUDINARY_PRESET = "GrubDash";
const CLOUDINARY_HOST = "https://api.cloudinary.com/v1_1/dypn7gna0/image/upload";

const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_PRESET);
  try {
    const res = await axios.post(CLOUDINARY_HOST, formData);
    return res.data.secure_url;
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    toast.error("Image upload failed!");
    return null;
  }
};

export default function VendorProfilePage({ vendor }) {
  const [basicInfo, setBasicInfo] = useState({ storeName: "", phone: "", email: "", storeDescription: "", password: "" });
  const [address, setAddress] = useState({ street: "", city: "", state: "", postalCode: "" });
  const [cuisineTypes, setCuisineTypes] = useState([]);
  const [openingHours, setOpeningHours] = useState({});
  const [payoutDetails, setPayoutDetails] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
    acceptsDelivery: false,
    deliveryRadiusKm: 0,
  });
  const [tags, setTags] = useState([]);
  const [logo, setLogo] = useState("");
  const [kyc, setKyc] = useState({
    idType: "NIN",
    idNumber: "",
    idFrontUrl: "",
    idBackUrl: "",
    businessRegistrationDoc: "",
  });
  const [collapsed, setCollapsed] = useState({});
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
      setPayoutDetails({
        bankName: vendor.payoutDetails?.bankName || "",
        accountName: vendor.payoutDetails?.accountName || "",
        accountNumber: vendor.payoutDetails?.accountNumber || "",
        acceptsDelivery: vendor.acceptsDelivery || false,
        deliveryRadiusKm: vendor.deliveryRadiusKm || 0,
      });
      setTags(vendor.tags || []);
      setLogo(vendor.logo || "");
      setKyc({
        idType: vendor.kyc?.idType || "NIN",
        idNumber: vendor.kyc?.idNumber || "",
        idFrontUrl: vendor.kyc?.idFrontUrl || "",
        idBackUrl: vendor.kyc?.idBackUrl || "",
        businessRegistrationDoc: vendor.kyc?.businessRegistrationDoc || "",
      });
    }
  }, [vendor]);

  const toggleCollapse = (section) => setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }));

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
      } else if (section === "payoutDetails") {
        payload = {
          payoutDetails: {
            bankName: data.bankName,
            accountName: data.accountName,
            accountNumber: data.accountNumber,
          },
          acceptsDelivery: data.acceptsDelivery,
          deliveryRadiusKm: data.deliveryRadiusKm,
        };
      } else if (section === "tags") {
        payload = { tags: data };
      } else if (section === "logo") {
        payload = { logo: data };
      } else if (section === "kyc") {
        payload = { kyc: data };
      }

      await updateVendor({ id: vendor._id, data: payload });
      toast.success(`${section} updated successfully!`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to update ${section}`);
    } finally {
      setLoadingSection("");
    }
  };

  const handleFileChange = async (fileKey, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await uploadToCloudinary(file);
    if (url) {
      setKyc({ ...kyc, [fileKey]: url });
      updateSection("kyc", { ...kyc, [fileKey]: url });
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await uploadToCloudinary(file);
    if (url) {
      setLogo(url);
      updateSection("logo", url);
    }
  };

  const handleCuisineChange = (index, value) => {
    const newArr = [...cuisineTypes];
    newArr[index] = value;
    setCuisineTypes(newArr);
  };
  const handleAddCuisine = () => setCuisineTypes([...cuisineTypes, ""]);
  const handleRemoveCuisine = (index) => setCuisineTypes(cuisineTypes.filter((_, i) => i !== index));

  const handleTagChange = (index, value) => {
    const newArr = [...tags];
    newArr[index] = value;
    setTags(newArr);
  };
  const handleAddTag = () => setTags([...tags, ""]);
  const handleRemoveTag = (index) => setTags(tags.filter((_, i) => i !== index));

  const handleOpeningHoursChange = (day, key, value) => {
    setOpeningHours({ ...openingHours, [day]: { ...openingHours[day], [key]: value } });
  };

  return (
    <div className="max-w-7xl mx-auto min-h-screen space-y-6 relative pb-8">
      <Toaster />

      {/* Header */}
      <div className="bg-white p-3 rounded-2xl flex flex-col sm:flex-row items-start md:items-center gap-6">
        <div className="relative">
          <Avatar className="w-24 h-24 border-2 border-orange-500 cursor-pointer">
            <AvatarImage src={logo} />
            <AvatarFallback>
              <Store className="text-orange-500" />
            </AvatarFallback>
          </Avatar>
          <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 cursor-pointer border border-gray-300 hover:bg-gray-100">
            <Camera size={18} />
            <input type="file" className="hidden" onChange={handleLogoChange} />
          </label>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Store className="text-[#FF6600]" /> {basicInfo.storeName}
          </h1>
          <div className="flex items-center gap-1 py-2 text-yellow-500">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} fill={i < Math.round(vendor?.rating ?? 0) ? "currentColor" : "none"} />
            ))}
            <span className="text-sm text-gray-600 ml-1">{vendor?.rating?.toFixed(1) ?? "0.0"}</span>
          </div>
          <p className="text-gray-600 mt-1">{vendor?.storeDescription}</p>
          <p className="text-gray-400 text-sm mt-1">
            Joined: {new Date(vendor?.createdAt).toLocaleDateString()} • Location: {vendor?.address?.city}, {vendor?.address?.state} • Sales: {vendor?.totalSales ?? 0}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`md:block hidden mt-4 md:mt-0 px-3 py-1 border ${vendor?.active ? "border-green-500 text-green-600" : "border-red-500 text-red-600"}`}
        >
          {vendor?.active ? "Active" : "Inactive"}
        </Badge>

        <Badge
          variant="outline"
          className={`md:hidden block absolute top-2 right-5 mt-4 md:mt-0 px-3 py-1 border ${vendor?.active ? "border-green-500 text-green-600" : "border-red-500 text-red-600"}`}
        >
          {vendor?.active ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Basic Info + Password */}
      <Card className="p-0 pb-4 border-0">
        <CardHeader className="bg-orange-100 w- p-3 rounded-tl-xl rounded-tr-2xl flex justify-between items-center cursor-pointer" onClick={() => toggleCollapse("basicInfo")}>
          <CardTitle className="flex items-center gap-2">
            <Store className="text-orange-500" /> Basic Info
          </CardTitle>
          <span>{collapsed.basicInfo ? "+" : "-"}</span>
        </CardHeader>
        {!collapsed.basicInfo && (
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2"><Store className="text-orange-500" /> Store Name</label>
                <input type="text" value={basicInfo.storeName} onChange={(e) => setBasicInfo({ ...basicInfo, storeName: e.target.value })} className="border p-2 rounded w-full" />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2"><Phone className="text-orange-500" /> Phone</label>
                <input type="text" value={basicInfo.phone} onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })} className="border p-2 rounded w-full" />
              </div>
            </div>
            
            
            <label className="flex items-center gap-2"><Mail className="text-orange-500" /> Email</label>
            <input type="email" value={basicInfo.email} disabled className="border p-2 rounded w-full bg-gray-100 cursor-not-allowed" />

            <label className="flex items-center gap-2"><FileText className="text-orange-500" /> Store Description</label>
            <textarea value={basicInfo.storeDescription} onChange={(e) => setBasicInfo({ ...basicInfo, storeDescription: e.target.value })} className="border p-2 rounded w-full" />

            <label className="flex items-center gap-2"><Lock className="text-orange-500" /> Password</label>
            <input type="password" value={basicInfo.password} onChange={(e) => setBasicInfo({ ...basicInfo, password: e.target.value })} className="border p-2 rounded w-full" />

            <button onClick={() => updateSection("basicInfo", basicInfo)} disabled={loadingSection === "basicInfo"} className="rounded-tl-2xl rounded-br-2xl bg-orange-500 text-white px-4 py-2 rounded">
              {loadingSection === "basicInfo" ? "Updating..." : "Update Basic Info"}
            </button>
          </CardContent>
        )}
      </Card>

      {/* Address Section */}
      <Card className="p-0 pb-4 border-0">
        <CardHeader className="bg-orange-100 w- p-3 rounded-tl-xl rounded-tr-2xl flex justify-between items-center cursor-pointer" onClick={() => toggleCollapse("address")}>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="text-orange-500" /> Address
          </CardTitle>
          <span>{collapsed.address ? "+" : "-"}</span>
        </CardHeader>
        {!collapsed.address && (
          <CardContent className="space-y-2">
            {["street", "city", "state", "postalCode"].map((field) => (
              <div key={field}>
                <label className="flex items-center gap-2">
                  <MapPin className="text-orange-500" /> {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  type="text"
                  value={address[field]}
                  onChange={(e) => setAddress({ ...address, [field]: e.target.value })}
                  className="border p-2 rounded w-full mb-2"
                />
              </div>
            ))}
            <button
              onClick={() => updateSection("address", address)}
              disabled={loadingSection === "address"}
              className="rounded-tl-2xl rounded-br-2xl bg-orange-500 text-white px-4 py-2 rounded"
            >
              {loadingSection === "address" ? "Updating..." : "Update Address"}
            </button>
          </CardContent>
        )}
      </Card>

      {/* Cuisine Types */}
      <Card className="p-0 pb-4 border-0">
        <CardHeader className="bg-orange-100 w- p-3 rounded-tl-xl rounded-tr-2xl flex justify-between items-center cursor-pointer" onClick={() => toggleCollapse("cuisineTypes")}>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="text-orange-500" /> Cuisine Types
          </CardTitle>
          <span>{collapsed.cuisineTypes ? "+" : "-"}</span>
        </CardHeader>
        {!collapsed.cuisineTypes && (
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {cuisineTypes.map((cuisine, idx) => (
                <div key={idx} className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded">
                  <input
                    type="text"
                    value={cuisine}
                    onChange={(e) => handleCuisineChange(idx, e.target.value)}
                    className="border p-1 rounded"
                  />
                  <button onClick={() => handleRemoveCuisine(idx)} className="text-red-500 font-bold">×</button>
                </div>
              ))}
              <button onClick={handleAddCuisine} className="px-2 py-1 bg-orange-500 text-white rounded">+ Add</button>
            </div>
            <button
              onClick={() => updateSection("cuisineTypes", cuisineTypes)}
              disabled={loadingSection === "cuisineTypes"}
              className="rounded-tl-2xl rounded-br-2xl bg-orange-500 text-white px-4 py-2 rounded"
            >
              {loadingSection === "cuisineTypes" ? "Updating..." : "Update Cuisine Types"}
            </button>
          </CardContent>
        )}
      </Card>

      {/* Opening Hours */}
      <Card className="p-0 pb-4 border-0">
        <CardHeader className="bg-orange-100 w- p-3 rounded-tl-xl rounded-tr-2xl flex justify-between items-center cursor-pointer" onClick={() => toggleCollapse("openingHours")}>
          <CardTitle className="flex items-center gap-2">
            <Clock className="text-orange-500" /> Opening Hours
          </CardTitle>
          <span>{collapsed.openingHours ? "+" : "-"}</span>
        </CardHeader>
        {!collapsed.openingHours && (
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(openingHours).map((day) => (
              <div key={day} className="border rounded p-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="capitalize font-medium">{day}</span>
                </div>
                <div className="flex gap-2">
                  <label className="flex flex-col flex-1">
                    Open
                    <input
                      type="time"
                      value={openingHours[day].open}
                      onChange={(e) => handleOpeningHoursChange(day, "open", e.target.value)}
                      className="border p-1 rounded w-full"
                    />
                  </label>
                  <label className="flex flex-col flex-1">
                    Close
                    <input
                      type="time"
                      value={openingHours[day].close}
                      onChange={(e) => handleOpeningHoursChange(day, "close", e.target.value)}
                      className="border p-1 rounded w-full"
                    />
                  </label>
                </div>
              </div>
            ))}
            <button
              onClick={() => updateSection("openingHours", openingHours)}
              disabled={loadingSection === "openingHours"}
              className="rounded-tl-2xl rounded-br-2xl bg-orange-500 text-white px-4 py-2 rounded col-span-full"
            >
              {loadingSection === "openingHours" ? "Updating..." : "Update Opening Hours"}
            </button>
          </CardContent>
        )}
      </Card>

      {/* Payout & Delivery */}
      <Card className="p-0 pb-4 border-0">
        <CardHeader className="bg-orange-100 w- p-3 rounded-tl-xl rounded-tr-2xl flex justify-between items-center cursor-pointer" onClick={() => toggleCollapse("payoutDetails")}>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="text-orange-500" /> Payout & Delivery
          </CardTitle>
          <span>{collapsed.payoutDetails ? "+" : "-"}</span>
        </CardHeader>
        {!collapsed.payoutDetails && (
          <CardContent className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={payoutDetails.acceptsDelivery}
                onChange={(e) => setPayoutDetails({ ...payoutDetails, acceptsDelivery: e.target.checked })}
              /> Accepts Delivery
            </label>
            <label className="flex items-center gap-2">
              Delivery Radius (km)
            </label>
            <input
              type="number"
              value={payoutDetails.deliveryRadiusKm}
              onChange={(e) => setPayoutDetails({ ...payoutDetails, deliveryRadiusKm: e.target.value })}
              className="border p-2 rounded w-full"
            />
            <label className="flex items-center gap-2">Bank Name</label>
            <input
              type="text"
              value={payoutDetails.bankName}
              onChange={(e) => setPayoutDetails({ ...payoutDetails, bankName: e.target.value })}
              className="border p-2 rounded w-full"
            />
            <label className="flex items-center gap-2">Account Name</label>
            <input
              type="text"
              value={payoutDetails.accountName}
              onChange={(e) => setPayoutDetails({ ...payoutDetails, accountName: e.target.value })}
              className="border p-2 rounded w-full"
            />
            <label className="flex items-center gap-2">Account Number</label>
            <input
              type="text"
              value={payoutDetails.accountNumber}
              onChange={(e) => setPayoutDetails({ ...payoutDetails, accountNumber: e.target.value })}
              className="border p-2 rounded w-full"
            />
            <button
              onClick={() => updateSection("payoutDetails", payoutDetails)}
              disabled={loadingSection === "payoutDetails"}
              className="rounded-tl-2xl rounded-br-2xl bg-orange-500 text-white px-4 py-2 rounded"
            >
              {loadingSection === "payoutDetails" ? "Updating..." : "Update Payout & Delivery"}
            </button>
          </CardContent>
        )}
      </Card>

      {/* Tags */}
      <Card className="p-0 pb-4 border-0">
        <CardHeader className="bg-orange-100 w- p-3 rounded-tl-xl rounded-tr-2xl flex justify-between items-center cursor-pointer" onClick={() => toggleCollapse("tags")}>
          <CardTitle className="flex items-center gap-2">
            <BadgeCheck className="text-orange-500" /> Tags
          </CardTitle>
          <span>{collapsed.tags ? "+" : "-"}</span>
        </CardHeader>
        {!collapsed.tags && (
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, idx) => (
                <div key={idx} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => handleTagChange(idx, e.target.value)}
                    className="border p-1 rounded"
                  />
                  <button onClick={() => handleRemoveTag(idx)} className="text-red-500 font-bold">×</button>
                </div>
              ))}
              <button onClick={handleAddTag} className="px-2 py-1 bg-orange-500 text-white rounded">+ Add</button>
            </div>
            <button
              onClick={() => updateSection("tags", tags)}
              disabled={loadingSection === "tags"}
              className="rounded-tl-2xl rounded-br-2xl bg-orange-500 text-white px-4 py-2 rounded"
            >
              {loadingSection === "tags" ? "Updating..." : "Update Tags"}
            </button>
          </CardContent>
        )}
      </Card>
      {/* KYC Section */}
      <Card className="p-0 pb-4 border-0">
        <CardHeader className="bg-orange-100 w- p-3 rounded-tl-xl rounded-tr-2xl flex justify-between items-center cursor-pointer" onClick={() => toggleCollapse("kyc")}>
          <CardTitle className="flex items-center gap-2">
            <FileText className="text-orange-500" /> KYC Documents
          </CardTitle>
          <span>{collapsed.kyc ? "+" : "-"}</span>
        </CardHeader>
        {!collapsed.kyc && (
          <CardContent className="space-y-2">
            <label>ID Type</label>
            <input type="text" value={kyc.idType} disabled className="border p-2 rounded w-full bg-gray-100 cursor-not-allowed" />
            
            <label>ID Number</label>
            <input type="text" value={kyc.idNumber} onChange={(e) => setKyc({ ...kyc, idNumber: e.target.value })} className="border p-2 rounded w-full" />
            
            <label>ID Front</label>
            <input type="file" onChange={(e) => handleFileChange("idFrontUrl", e)} className="border p-2 rounded w-full" />

            <label>ID Back</label>
            <input type="file" onChange={(e) => handleFileChange("idBackUrl", e)} className="border p-2 rounded w-full" />

            <label>Business Registration Doc</label>
            <input type="file" onChange={(e) => handleFileChange("businessRegistrationDoc", e)} className="border p-2 rounded w-full" />

            <button onClick={() => updateSection("kyc", kyc)} disabled={loadingSection === "kyc"} className="rounded-tl-2xl rounded-br-2xl bg-orange-500 text-white px-4 py-2 rounded">
              {loadingSection === "kyc" ? "Updating..." : "Update KYC"}
            </button>
          </CardContent>
        )}
      </Card>
      <ScrollToTopButton/>
    </div>
  );
}