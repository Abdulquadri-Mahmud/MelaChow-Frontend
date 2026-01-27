"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import {
  Plus,
  X,
  Upload,
  Utensils,
  Loader2,
  ImageIcon,
  Check,
  Eye,
  Trash2,
  Edit,
  ChevronDown,
  AlertCircle,
  Package,
  DollarSign,
  Layers,
  Menu,
  RefreshCcw,
} from "lucide-react";
import { useFoodById } from "@/app/hooks/useVendorFoodQuery";
import { updateFood } from "@/app/lib/vendorFoodApi";
import UpdateFoodSkeleton from "@/app/skeleton/UpdateFoodSkeleton";

// Reusing components from create-food
import VariantModal from "@/app/modals/create/VariantsModal";
import PreviewModal from "@/app/modals/create/PreviewModal";
import PortionsSection from "@/app/components/create-food/PortionsSection";
import ChoiceGroupsSection from "@/app/components/create-food/ChoiceGroupsSection";
import ImagesSection from "@/app/components/create-food/ImagesSection";
import TagsSection from "@/app/components/create-food/TagsSection";
import MetadataSection from "@/app/components/create-food/MetadataSection";
import PricingSection from "@/app/components/create-food/PricingSection";
import InventorySection from "@/app/components/create-food/InventorySection";
import DetailsSection from "@/app/components/create-food/DetailsSection";
import SectionHeader from "@/app/components/create-food/SectionHeader";
import BackButton from "@/app/components/BackButton";

/***** CONFIG *****/
const ACCENT = "#FF6600";
const CLOUDINARY_PRESET = "GrubDash";
const CLOUDINARY_HOST = "https://api.cloudinary.com/v1_1/dypn7gna0/image/upload";

/***** HIERARCHICAL CATEGORIES *****/
const CATEGORY_HIERARCHY = {
  "African Cuisine": ["Rice Dishes", "Swallow", "Soups & Stews", "Beans Dishes", "Yam Dishes", "Plantain Dishes", "Porridge", "Native Delicacies"],
  "Fast Food": ["Burgers", "Pizza", "Shawarma", "Sandwiches", "Fried Chicken", "Hot Dogs"],
  "Asian Cuisine": ["Chinese", "Japanese", "Thai", "Indian", "Korean"],
  "Pasta & Italian": ["Pasta", "Pizza", "Risotto", "Italian Specials"],
  "Grills & BBQ": ["Grilled Chicken", "Grilled Fish", "Beef BBQ", "Suya", "Asun"],
  "Breakfast": ["Continental", "Local Breakfast", "Cereals", "Pancakes"],
  "Snacks": ["Small Chops", "Pastries", "Finger Foods", "Appetizers"],
  "Seafood": ["Fish Dishes", "Prawns", "Crab", "Mixed Seafood"],
  "Vegetarian": ["Salads", "Veggie Bowls", "Plant-Based Meals"],
  "Drinks": ["Soft Drinks", "Juices", "Smoothies", "Traditional Drinks"],
  "Desserts": ["Cakes", "Ice Cream", "Puddings", "Sweet Treats"],
  "Others": ["Miscellaneous"]
};

/***** HELPERS *****/
const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_PRESET);
  try {
    const res = await axios.post(CLOUDINARY_HOST, formData);
    return { url: res.data.secure_url, publicId: res.data.public_id };
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return null;
  }
};

const showAnimatedToast = (type, message) => {
  toast.custom(
    (t) => (
      <motion.div
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className={`max-w-sm w-full rounded-xl px-4 py-3 shadow-lg flex items-start gap-3 ${type === "success"
          ? "bg-white border-l-4 border-emerald-400"
          : "bg-white border-l-4 border-rose-400"
          }`}
      >
        <div className="mt-0.5">
          {type === "success" ? (
            <Check className="text-emerald-500" />
          ) : (
            <AlertCircle className="text-rose-500" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{message}</p>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
      </motion.div>
    ),
    { position: "top-right", duration: 4000 }
  );
};

/***** MAIN PAGE *****/
export default function UpdateFoodPage() {
  const router = useRouter();
  const { id } = useParams();

  // Fetch Existing Data
  const { food: foodData, isLoading: fetching } = useFoodById(id);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rootCategory: "",
    subCategory: "",
    price: "",
    deliveryFee: "",
    estimatedDeliveryTime: "30",
    tags: [],
    available: true,
    images: [],
    // New Fields
    stock: "",
    packagingFee: "",
    prepTime: "",
    foodType: "",
    allowNotes: true,
    discount: { enabled: false, type: "percentage", value: "", expiresAt: "" },
    availabilitySchedule: {
      enabled: false,
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      startTime: "09:00",
      endTime: "22:00",
    },
    nutrition: {
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
      fiber: "",
      sugar: "",
    },
  });

  const [metadata, setMetadata] = useState({
    spicyLevel: "medium",
    allergens: [],
    dietaryInfo: "",
    preparationTime: "",
  });

  const [portions, setPortions] = useState([]);
  const [choiceGroups, setChoiceGroups] = useState([]);

  // UI state
  const [tagInput, setTagInput] = useState("");
  const [variants, setVariants] = useState([]);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize Data
  useEffect(() => {
    if (foodData?.data) {
      const d = foodData.data;
      setFormData({
        name: d.name || "",
        description: d.description || "",
        rootCategory: d.categories?.[0] || "",
        subCategory: d.categories?.[1] || "",
        price: d.price?.toString() || "",
        deliveryFee: d.deliveryFee?.toString() || "",
        estimatedDeliveryTime: d.estimatedDeliveryTime?.toString() || "30",
        tags: d.tags || [],
        available: d.available ?? true,
        images: d.images?.map(img => typeof img === 'string' ? { url: img } : img) || [],
        // New Fields
        stock: d.stock?.toString() || "",
        packagingFee: d.packagingFee?.toString() || "",
        prepTime: d.prepTime?.toString() || "",
        foodType: d.foodType || "",
        allowNotes: d.allowCustomerInstructions ?? true,
        discount: {
          enabled: d.discount?.active || false,
          type: d.discount?.percentage > 0 ? "percentage" : "flatAmount",
          value: (d.discount?.percentage || d.discount?.flatAmount || "").toString(),
          expiresAt: d.discount?.expiresAt || "",
        },
        availabilitySchedule: d.availabilitySchedule || {
          enabled: false,
          days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          startTime: "09:00",
          endTime: "22:00",
        },
        nutrition: d.nutrition || {
          calories: "",
          protein: "",
          carbs: "",
          fat: "",
          fiber: "",
          sugar: "",
        },
      });
      setVariants(d.variants || []);
      setPortions(d.portions || []);
      setChoiceGroups(d.choiceGroups || []);
      setMetadata(d.metadata || { spicyLevel: "medium", allergens: [], dietaryInfo: "", preparationTime: "" });
    }
  }, [foodData]);

  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    pricing: true,
    images: true,
    variants: false,
    portions: false,
    choiceGroups: false,
    tags: false,
    metadata: false,
    // New Sections
    pricing_advanced: false,
    inventory: false,
    details: false,
  });

  const fileRef = useRef(null);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  /** Validation helpers **/
  const validations = useMemo(() => {
    return {
      name: formData.name.trim().length >= 3,
      categories: formData.rootCategory && formData.subCategory,
      price: Number(formData.price) > 0,
      description: formData.description.trim().length >= 10,
      images: formData.images.length > 0,
    };
  }, [formData]);

  const completedCount = useMemo(() => {
    return Object.values(validations).filter(Boolean).length;
  }, [validations]);

  const totalChecks = 5;
  const progressPercent = Math.round((completedCount / totalChecks) * 100);

  /** Price breakdown **/
  const subtotal = Number(formData.price) || 0;
  const delivery = Number(formData.deliveryFee) || 0;
  const total = subtotal + delivery;

  /** Tag helpers **/
  const handleAddTag = (t) => {
    const tag = (t || tagInput || "").trim();
    if (!tag) return;
    if (formData.tags.includes(tag)) {
      setTagInput("");
      return;
    }
    setFormData((p) => ({ ...p, tags: [...p.tags, tag] }));
    setTagInput("");
  };

  /** Image upload **/
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (formData.images.length + files.length > 5) {
      showAnimatedToast("error", "Maximum 5 images allowed");
      return;
    }
    setUploadingMain(true);
    const id = toast.loading("Uploading images...", { id: "img-upload" });
    try {
      const results = await Promise.all(files.map(uploadToCloudinary));
      const valid = results.filter(Boolean);
      setFormData((p) => ({ ...p, images: [...p.images, ...valid] }));
      toast.dismiss(id);
      showAnimatedToast("success", "Images uploaded");
    } catch (err) {
      toast.dismiss(id);
      showAnimatedToast("error", "Image upload failed");
    } finally {
      setUploadingMain(false);
    }
  };

  /** Variant CRUD **/
  const handleVariantSave = (v) => {
    if (editingVariant?.index != null) {
      setVariants((prev) =>
        prev.map((item, i) => (i === editingVariant.index ? v : item))
      );
      setEditingVariant(null);
    } else {
      setVariants((prev) => [...prev, v]);
    }
    setVariantModalOpen(false);
  };

  const handleEditVariant = (idx) => {
    if (typeof idx !== "number" || !variants[idx]) return;
    setEditingVariant({ index: idx, data: variants[idx] });
    setVariantModalOpen(true);
  };

  const handleRemoveVariant = (idx) =>
    setVariants((prev) => prev.filter((_, i) => i !== idx));

  /** Submit / Update **/
  const handleUpdate = async (e) => {
    e.preventDefault();

    // Validation
    if (!validations.name) return showAnimatedToast("error", "Name must be at least 3 characters");
    if (!validations.categories) return showAnimatedToast("error", "Select both root and sub category");
    if (!validations.price) return showAnimatedToast("error", "Price must be greater than 0");
    if (!validations.description) return showAnimatedToast("error", "Description must be at least 10 characters");
    if (!validations.images) return showAnimatedToast("error", "Add at least one image");

    // ✅ Validate stock
    if (!formData.stock || Number(formData.stock) <= 0) {
      return showAnimatedToast("error", "Stock must be at least 1");
    }

    // Validate portions
    for (let i = 1; i < portions.length; i++) {
      if (Number(portions[i].price) <= Number(portions[i - 1].price)) {
        return showAnimatedToast("error", "Portion prices must increase with portion size");
      }
    }

    // Build payload
    const payload = {
      name: formData.name,
      description: formData.description,
      images: formData.images,
      price: Number(formData.price) || 0,
      deliveryFee: Number(formData.deliveryFee) || 0,
      categories: [formData.rootCategory, formData.subCategory],
      variants: variants.map((v) => ({
        ...v,
        price: Number(v.price) || 0,
        stock: v.stock ? Number(v.stock) : null,
      })),
      portions: portions.map((p) => ({
        portionNumber: Number(p.portionNumber),
        price: Number(p.price),
        label: p.label,
      })),
      choiceGroups: choiceGroups.map((g) => ({
        name: g.name,
        minSelect: Number(g.minSelect),
        maxSelect: Number(g.maxSelect),
        options: g.options.map((o) => ({
          name: o.name,
          price: Number(o.price),
          stock: o.stock ? Number(o.stock) : null,
          image: o.image || undefined,
        })),
      })),
      available: !!formData.available,
      tags: formData.tags,
      estimatedDeliveryTime: Number(formData.estimatedDeliveryTime) || 30,
      metadata: metadata,
      // New Payload Fields
      stock: formData.stock ? Number(formData.stock) : null,
      packagingFee: Number(formData.packagingFee) || 0,
      prepTime: Number(formData.prepTime) || 0,
      foodType: formData.foodType,
      nutrition: formData.nutrition,
      allowCustomerInstructions: !!formData.allowNotes,
      discount: formData.discount.enabled
        ? {
          active: true,
          ...(formData.discount.type === "percentage"
            ? { percentage: Number(formData.discount.value) || 0, flatAmount: 0 }
            : { flatAmount: Number(formData.discount.value) || 0, percentage: 0 }),
          expiresAt: formData.discount.expiresAt || null,
        }
        : {
          active: false,
          percentage: 0,
          flatAmount: 0,
          expiresAt: null,
        },
      availabilitySchedule: {
        enabled: formData.availabilitySchedule.enabled,
        days: formData.availabilitySchedule.days,
        startTime: formData.availabilitySchedule.startTime,
        endTime: formData.availabilitySchedule.endTime,
      },
    };

    try {
      setLoading(true);
      await updateFood(id, payload);
      showAnimatedToast("success", "Food updated successfully!");
      router.push("/vendors/my-foods");
    } catch (err) {
      console.error(err.response);
      showAnimatedToast("error", err?.response?.data?.message || "Failed to update food");
    } finally {
      setLoading(false);
    }
  };

  /** Scroll helper **/
  const scrollToSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: true }));
    setMobileMenuOpen(false);
    setTimeout(() => {
      const element = document.getElementById(`section-${section}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const NavItem = ({ section, label, icon: Icon, isValid }) => (
    <button
      type="button"
      onClick={() => scrollToSection(section)}
      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group ${expandedSections[section]
        ? "bg-orange-50 dark:bg-orange-500/10 text-[#FF6600]"
        : "text-gray-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className={expandedSections[section] ? "text-[#FF6600]" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"} />
        <span className="font-medium text-sm">{label}</span>
      </div>
      {isValid !== undefined && (
        isValid ? (
          <Check size={14} className="text-emerald-500" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700" />
        )
      )}
    </button>
  );

  if (fetching) return <UpdateFoodSkeleton />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1121] pb-32">
      {/* Background decoration */}
      {/* <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div> */}

      <div className="max-w-7xl mx-auto relative z-10">
        <BackButton label="Back" className="mb-4" />

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
          <div className="w-full md:w-auto flex items-center gap-4">
            <button type="button" onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-3 bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 text-gray-600 dark:text-gray-300 transition-colors">
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Update Food</h1>
              <p className="text-sm md:text-lg text-gray-500 dark:text-gray-400 mt-1 md:mt-2">Edit your delicious offering details</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white dark:bg-[#1E293B] p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="px-4 py-2">
              <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Completion</div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-[#FF6600]">{progressPercent}%</div>
                <div className="text-xs text-gray-400 font-medium">{completedCount}/{totalChecks} steps</div>
              </div>
            </div>
            <div className="h-12 w-12 relative flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={125.6} strokeDashoffset={125.6 - (125.6 * progressPercent) / 100} className="text-[#FF6600] transition-all duration-500 ease-out" />
              </svg>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] gap-4 items-start">
          {/* SIDEBAR NAVIGATION */}
          <div className="hidden lg:block sticky top-8 space-y-6">
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-2 overflow-hidden">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Navigation</h3>
              </div>
              <div className="space-y-1">
                <NavItem section="basic" label="Basic Info" icon={Utensils} isValid={validations.name && validations.description} />
                <NavItem section="pricing" label="Categories & Pricing" icon={DollarSign} isValid={validations.categories && validations.price} />
                <NavItem section="images" label="Images" icon={ImageIcon} isValid={validations.images} />
                <NavItem section="pricing_advanced" label="Pricing & Deals" icon={DollarSign} />
                <NavItem section="inventory" label="Inventory & Schedule" icon={Package} />
                <NavItem section="details" label="Item Details" icon={Menu} />
                <NavItem section="variants" label="Variants" icon={Layers} />
                <NavItem section="portions" label="Portions" icon={Package} />
                <NavItem section="choiceGroups" label="Add-ons" icon={Plus} />
                <NavItem section="tags" label="Tags" icon={Check} />
                <NavItem section="metadata" label="Preferences" icon={AlertCircle} />
              </div>
            </div>

            {/* LIVE PREVIEW CARD */}
            <div className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-lg shadow-orange-500/5 border border-slate-200 dark:border-slate-800 p-5 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Eye size={16} className="text-[#FF6600]" /> Live Preview
                </h3>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-full font-bold uppercase tracking-wide">Card View</span>
              </div>
              <div className="relative bg-gray-900 rounded-[2rem] p-2 shadow-2xl border-4 border-gray-900">
                <div className="bg-white dark:bg-gray-800 rounded-[1.5rem] overflow-hidden relative aspect-[9/16]">
                  <div className="absolute top-0 left-0 right-0 h-6 bg-black/20 z-10 flex justify-between px-3 items-center">
                    <div className="w-10 h-1 bg-white/50 rounded-full" />
                    <div className="flex gap-1"><div className="w-1 h-1 rounded-full bg-white/50" /><div className="w-1 h-1 rounded-full bg-white/50" /></div>
                  </div>
                  <div className="absolute top-8 left-3 right-3 bg-white dark:bg-gray-700 rounded-xl shadow-lg overflow-hidden pb-2">
                    <div className="h-24 bg-gray-200 dark:bg-gray-600 relative">
                      {formData.images[0] ? (
                        <img src={formData.images[0].url} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={24} /></div>
                      )}
                      <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold backdrop-blur-sm">
                        {formData.estimatedDeliveryTime} min
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="flex justify-between items-start mb-1">
                        <div className="w-2/3 h-3 bg-gray-100 dark:bg-gray-500 rounded-md">
                          {formData.name && <div className="text-xs font-bold text-gray-900 dark:text-white truncate leading-3">{formData.name}</div>}
                        </div>
                        <div className="text-[#FF6600] font-bold text-xs">₦{Number(formData.price || 0).toLocaleString()}</div>
                      </div>
                      <div className="w-full h-2 bg-gray-50 dark:bg-gray-600 rounded mt-1 mb-2">
                        {formData.description && <div className="text-[9px] text-gray-400 truncate leading-2">{formData.description}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN FORM CONTENT */}
          <motion.form onSubmit={handleUpdate} className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            {/* Basic Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800">
              <SectionHeader title="Basic Information" subtitle="The core details of your dish" icon={Utensils} section="basic" isExpanded={expandedSections.basic} onToggle={() => toggleSection("basic")} isValid={validations.name && validations.description} />
              <AnimatePresence>
                {expandedSections.basic && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-6 md:p-8 space-y-8">
                    <div>
                      <div className="flex justify-between items-baseline mb-2">
                        <label className="text-sm font-bold text-gray-900 dark:text-white">Food Name <span className="text-rose-500">*</span></label>
                        <span className={`text-xs ${formData.name.length >= 3 ? "text-emerald-500" : "text-gray-400"}`}>{formData.name.length}/100</span>
                      </div>
                      <input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} className="w-full border-2 border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 p-4 rounded-2xl focus:border-[#FF6600] focus:ring-4 focus:ring-[#FF6600]/10 outline-none transition-all text-lg font-medium text-gray-900 dark:text-white placeholder:text-gray-400" placeholder="e.g., Jollof Rice" maxLength={100} />
                    </div>
                    <div>
                      <div className="flex justify-between items-baseline mb-2">
                        <label className="text-sm font-bold text-gray-900 dark:text-white">Description <span className="text-rose-500">*</span></label>
                        <span className={`text-xs ${formData.description.length >= 10 ? "text-emerald-500" : "text-gray-400"}`}>{formData.description.length}/500</span>
                      </div>
                      <textarea value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} rows={4} className="w-full border-2 border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 p-4 rounded-2xl focus:border-[#FF6600] focus:ring-4 focus:ring-[#FF6600]/10 outline-none transition-all text-gray-900 dark:text-white placeholder:text-gray-400 resize-none" placeholder="Describe your dish..." maxLength={500} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Categories & Pricing */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800">
              <SectionHeader title="Categories & Pricing" subtitle="Where and how much?" icon={DollarSign} section="pricing" isExpanded={expandedSections.pricing} onToggle={() => toggleSection("pricing")} isValid={validations.categories && validations.price} />
              <AnimatePresence>
                {expandedSections.pricing && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-6 md:p-8 space-y-8">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Root Category <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <select value={formData.rootCategory} onChange={(e) => setFormData((p) => ({ ...p, rootCategory: e.target.value, subCategory: "" }))} className="w-full appearance-none border-2 border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 p-4 pr-10 rounded-2xl focus:border-[#FF6600] focus:ring-4 focus:ring-[#FF6600]/10 outline-none transition-all text-gray-900 dark:text-white font-medium">
                            <option value="">Select Category</option>
                            {Object.keys(CATEGORY_HIERARCHY).map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Sub Category <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <select value={formData.subCategory} onChange={(e) => setFormData((p) => ({ ...p, subCategory: e.target.value }))} disabled={!formData.rootCategory} className="w-full appearance-none border-2 border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 p-4 pr-10 rounded-2xl focus:border-[#FF6600] focus:ring-4 focus:ring-[#FF6600]/10 outline-none transition-all text-gray-900 dark:text-white font-medium disabled:opacity-50">
                            <option value="">Select Sub-Category</option>
                            {formData.rootCategory && CATEGORY_HIERARCHY[formData.rootCategory]?.map((sub) => (<option key={sub} value={sub}>{sub}</option>))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="grid sm:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Base Price (₦) <span className="text-rose-500">*</span></label>
                          <input type="number" value={formData.price} onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))} className="w-full border-2 border-gray-200 dark:border-gray-600 p-3 rounded-xl bg-white dark:bg-gray-800 focus:border-[#FF6600] focus:ring-4 focus:ring-[#FF6600]/10 outline-none text-xl font-bold text-gray-900 dark:text-white" placeholder="0" min="100" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Delivery Fee (₦)</label>
                          <input type="number" value={formData.deliveryFee} onChange={(e) => setFormData((p) => ({ ...p, deliveryFee: e.target.value }))} className="w-full border-2 border-gray-200 dark:border-gray-600 p-3 rounded-xl bg-white dark:bg-gray-800 focus:border-[#FF6600] focus:ring-4 focus:ring-[#FF6600]/10 outline-none text-xl font-bold text-gray-900 dark:text-white" placeholder="0" min="0" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Prep Time (min)</label>
                          <input type="number" value={formData.estimatedDeliveryTime} onChange={(e) => setFormData((p) => ({ ...p, estimatedDeliveryTime: e.target.value }))} className="w-full border-2 border-gray-200 dark:border-gray-600 p-3 rounded-xl bg-white dark:bg-gray-800 focus:border-[#FF6600] focus:ring-4 focus:ring-[#FF6600]/10 outline-none text-xl font-bold text-gray-900 dark:text-white" placeholder="30" min="10" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Images */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <ImagesSection images={formData.images} setImages={(images) => setFormData((p) => ({ ...p, images }))} uploading={uploadingMain} onUpload={handleImageUpload} expanded={expandedSections.images} toggleExpanded={() => toggleSection("images")} isValid={validations.images} />
            </motion.div>

            {/* Pricing Advanced */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <PricingSection
                formData={formData}
                setFormData={setFormData}
                expanded={expandedSections.pricing_advanced}
                toggleExpanded={() => toggleSection("pricing_advanced")}
              />
            </motion.div>

            {/* Inventory */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
              <InventorySection
                formData={formData}
                setFormData={setFormData}
                expanded={expandedSections.inventory}
                toggleExpanded={() => toggleSection("inventory")}
              />
            </motion.div>

            {/* Details */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
              <DetailsSection
                formData={formData}
                setFormData={setFormData}
                expanded={expandedSections.details}
                toggleExpanded={() => toggleSection("details")}
              />
            </motion.div>

            {/* Variants */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800">
              <SectionHeader title="Variants" subtitle="Offer different sizes or types" icon={Layers} section="variants" isExpanded={expandedSections.variants} onToggle={() => toggleSection("variants")} />
              <AnimatePresence>
                {expandedSections.variants && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-6 pb-6 space-y-4">
                    <div className="flex justify-between gap-4 mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Create variants like "Small", "Medium".</p>
                      <button type="button" onClick={() => setVariantModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-500/30"><Plus size={18} /> Add Variant</button>
                    </div>
                    <div className="grid gap-4">
                      {variants.map((v, i) => (
                        <motion.div key={i} className="flex items-center justify-between bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100">{v.image && <img src={v.image} className="w-full h-full object-cover" />}</div>
                            <div><div className="font-bold text-gray-900 dark:text-white text-lg">{v.name}</div><div className="text-emerald-600 font-bold">₦{Number(v.price).toLocaleString()}</div></div>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => handleEditVariant(i)} className="p-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl"><Edit size={16} /></button>
                            <button type="button" onClick={() => handleRemoveVariant(i)} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><Trash2 size={16} /></button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Portions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <PortionsSection portions={portions} setPortions={setPortions} basePrice={Number(formData.price) || 0} expanded={expandedSections.portions} toggleExpanded={() => toggleSection("portions")} />
            </motion.div>

            {/* Choice Groups */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <ChoiceGroupsSection choiceGroups={choiceGroups} setChoiceGroups={setChoiceGroups} expanded={expandedSections.choiceGroups} toggleExpanded={() => toggleSection("choiceGroups")} />
            </motion.div>

            {/* Tags */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <TagsSection tags={formData.tags} setTags={(tags) => setFormData((p) => ({ ...p, tags }))} expanded={expandedSections.tags} toggleExpanded={() => toggleSection("tags")} />
            </motion.div>

            {/* Metadata */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
              <MetadataSection metadata={metadata} setMetadata={setMetadata} expanded={expandedSections.metadata} toggleExpanded={() => toggleSection("metadata")} />
            </motion.div>

          </motion.form>
        </div>
      </div>

      {/* Sub-modals */}
      <VariantModal open={variantModalOpen} onClose={() => { setVariantModalOpen(false); setEditingVariant(null); }} initial={editingVariant?.data ?? null} onSave={handleVariantSave} accent={ACCENT} />
      <PreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} food={{ ...formData, metadata, price: subtotal, deliveryFee: delivery }} variants={variants} portions={portions} choiceGroups={choiceGroups} />

      {/* Floating Footer */}
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-0 left-0 right-0 z-50 p-4">
        <div className="max-w-[1400px] mx-auto">
          <div className="mx-auto max-w-4xl bg-white/90 dark:bg-[#1E293B]/90 backdrop-blur-lg border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-4">
            <button type="button" onClick={() => router.back()} className="px-6 py-3 font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">Cancel</button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold"
              >
                <Eye size={18} />
                <span>Preview</span>
              </button>
              <label className="hidden sm:flex items-center gap-2 cursor-pointer bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${formData.available ? "bg-[#FF6600] border-[#FF6600]" : "border-gray-400"}`}>
                  {formData.available && <Check size={12} className="text-white" />}
                </div>
                <input type="checkbox" checked={formData.available} onChange={(e) => setFormData((p) => ({ ...p, available: e.target.checked }))} className="hidden" />
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Available</span>
              </label>
              <button type="button" onClick={handleUpdate} disabled={loading} className="px-8 py-3 bg-gradient-to-r from-[#FF6600] to-[#FF8C00] text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                {loading ? "Updating..." : "Update Food"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}