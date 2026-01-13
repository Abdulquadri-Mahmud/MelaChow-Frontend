"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";
import { useRouter } from "next/navigation";
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
  ChevronUp,
  AlertCircle,
  Package,
  DollarSign,
  Layers,
} from "lucide-react";
import { getVendorId } from "@/app/lib/vendorId";
import MetadataModal from "@/app/modals/create/MetadataModal";
import VariantModal from "@/app/modals/create/VariantsModal";
import PreviewModal from "@/app/modals/create/PreviewModal";
import { createFood } from "@/app/lib/vendorFoodApi";
import { useVendorStorage } from "@/app/hooks/vendorStorage";
import PortionsSection from "@/app/components/create-food/PortionsSection";
import ChoiceGroupsSection from "@/app/components/create-food/ChoiceGroupsSection";
import ImagesSection from "@/app/components/create-food/ImagesSection";
import TagsSection from "@/app/components/create-food/TagsSection";

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

/***** TAG SUGGESTIONS *****/
const SUGGESTED_TAGS = [
  "Popular",
  "Spicy",
  "Delicious",
  "Vegan",
  "New",
  "Combo",
  "Signature",
  "Halal",
  "Vegetarian",
  "Gluten-Free",
];

/***** MAIN PAGE *****/
export default function CreateFoodPage() {
  const router = useRouter();

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
  });

  const [metadata, setMetadata] = useState({
    spicyLevel: "medium",
    allergens: [],
    dietaryInfo: "",
    preparationTime: "",
  });

  // New state for portions and choice groups
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
  });

  const { vendorDetails } = useVendorStorage();
  const vendor = vendorDetails?.vendor?.id;

  const fileRef = useRef(null);

  // Toggle section
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

  const handleTagKey = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === "Backspace" && !tagInput) {
      setFormData((p) => ({ ...p, tags: p.tags.slice(0, -1) }));
    }
  };

  const removeTag = (t) =>
    setFormData((p) => ({ ...p, tags: p.tags.filter((x) => x !== t) }));

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

  /** Portions Management **/
  const addPortion = () => {
    const newPortionNumber = portions.length + 1;
    const basePrice = Number(formData.price) || 0;
    setPortions([
      ...portions,
      {
        portionNumber: newPortionNumber,
        price: basePrice * newPortionNumber,
        label: `${newPortionNumber} Portion${newPortionNumber > 1 ? "s" : ""}`,
      },
    ]);
  };

  const updatePortion = (index, field, value) => {
    setPortions((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const removePortion = (index) => {
    setPortions((prev) => prev.filter((_, i) => i !== index));
  };

  /** Choice Groups Management **/
  const addChoiceGroup = () => {
    setChoiceGroups([
      ...choiceGroups,
      {
        name: "",
        minSelect: 0,
        maxSelect: 1,
        options: [],
      },
    ]);
  };

  const updateChoiceGroup = (index, field, value) => {
    setChoiceGroups((prev) =>
      prev.map((g, i) => (i === index ? { ...g, [field]: value } : g))
    );
  };

  const removeChoiceGroup = (index) => {
    setChoiceGroups((prev) => prev.filter((_, i) => i !== index));
  };

  const addOption = (groupIndex) => {
    setChoiceGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex
          ? { ...g, options: [...g.options, { name: "", price: 0 }] }
          : g
      )
    );
  };

  const updateOption = (groupIndex, optionIndex, field, value) => {
    setChoiceGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex
          ? {
            ...g,
            options: g.options.map((o, j) =>
              j === optionIndex ? { ...o, [field]: value } : o
            ),
          }
          : g
      )
    );
  };

  const removeOption = (groupIndex, optionIndex) => {
    setChoiceGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex
          ? { ...g, options: g.options.filter((_, j) => j !== optionIndex) }
          : g
      )
    );
  };

  /** Submit **/
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!validations.name) {
      showAnimatedToast("error", "Name must be at least 3 characters");
      return;
    }
    if (!validations.categories) {
      showAnimatedToast("error", "Select both root and sub category");
      return;
    }
    if (!validations.price) {
      showAnimatedToast("error", "Price must be greater than 0");
      return;
    }
    if (!validations.description) {
      showAnimatedToast("error", "Description must be at least 10 characters");
      return;
    }
    if (!validations.images) {
      showAnimatedToast("error", "Add at least one image");
      return;
    }

    // Validate portions (prices must increase)
    for (let i = 1; i < portions.length; i++) {
      if (Number(portions[i].price) <= Number(portions[i - 1].price)) {
        showAnimatedToast(
          "error",
          "Portion prices must increase with portion size"
        );
        return;
      }
    }

    // Validate choice groups
    for (const group of choiceGroups) {
      if (!group.name.trim()) {
        showAnimatedToast("error", "All choice groups must have a name");
        return;
      }
      if (group.minSelect > group.maxSelect) {
        showAnimatedToast(
          "error",
          `Choice group "${group.name}": Min select cannot be greater than max select`
        );
        return;
      }
      if (group.options.length === 0) {
        showAnimatedToast(
          "error",
          `Choice group "${group.name}" must have at least one option`
        );
        return;
      }
      for (const option of group.options) {
        if (!option.name.trim()) {
          showAnimatedToast(
            "error",
            `All options in "${group.name}" must have a name`
          );
          return;
        }
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
        name: v.name,
        price: Number(v.price) || 0,
        image: v.image || undefined,
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
        })),
      })),
      available: !!formData.available,
      tags: formData.tags,
      estimatedDeliveryTime: Number(formData.estimatedDeliveryTime) || 30,
      metadata: metadata,
    };

    try {
      setLoading(true);
      await createFood(vendor, payload);
      showAnimatedToast("success", "Food created successfully!");
      localStorage.removeItem("gd_create_food_draft");
      router.push("/vendors/my-foods");
    } catch (err) {
      console.error(err.response);
      showAnimatedToast(
        "error",
        err?.response?.data?.message || "Failed to create food"
      );
    } finally {
      setLoading(false);
    }
  };

  /** Auto-save draft **/
  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem(
        "gd_create_food_draft",
        JSON.stringify({ formData, variants, portions, choiceGroups })
      );
    }, 800);
    return () => clearTimeout(t);
  }, [formData, variants, portions, choiceGroups]);

  useEffect(() => {
    const draft = localStorage.getItem("gd_create_food_draft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed?.formData) setFormData(parsed.formData);
        if (Array.isArray(parsed?.variants)) setVariants(parsed.variants);
        if (Array.isArray(parsed?.portions)) setPortions(parsed.portions);
        if (Array.isArray(parsed?.choiceGroups))
          setChoiceGroups(parsed.choiceGroups);
      } catch (e) {
        /* ignore */
      }
    }
  }, []);

  const fieldIndicator = (ok) => {
    return ok ? (
      <span className="text-emerald-500 text-xs flex items-center gap-1">
        <Check size={12} /> Valid
      </span>
    ) : (
      <span className="text-rose-500 text-xs">Required</span>
    );
  };

  const SectionHeader = ({ title, icon: Icon, section, isValid }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-900/10 rounded-xl hover:from-orange-100 dark:hover:from-orange-900/20 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-100 dark:bg-orange-500/10 rounded-lg text-[#FF6600]">
          <Icon size={20} />
        </div>
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">
          {title}
        </h2>
      </div>
      <div className="flex items-center gap-3">
        {isValid !== undefined && fieldIndicator(isValid)}
        {expandedSections[section] ? (
          <ChevronUp size={20} className="text-gray-400" />
        ) : (
          <ChevronDown size={20} className="text-gray-400" />
        )}
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A]">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 ">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1E293B] rounded-3xl p-6 border border-slate-200 dark:border-slate-800"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl">
                <Utensils className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Create New Food
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Add a new item to your menu
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 transition-colors"
            >
              <Eye size={18} />
              Preview
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-600 dark:text-gray-300">
                Form completion
              </div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {completedCount} of {totalChecks} • {progressPercent}%
              </div>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* MAIN FORM */}
      <motion.form
        onSubmit={handleSubmit}
        className="max-w-7xl mx-auto space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Basic Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          <SectionHeader
            title="Basic Information"
            icon={Utensils}
            section="basic"
            isValid={validations.name && validations.description}
          />

          <AnimatePresence>
            {expandedSections.basic && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 pb-6 space-y-4"
              >
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Food Name *
                  </label>
                  <input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, name: e.target.value }))
                    }
                    className="w-full border border-gray-200 dark:border-gray-700 p-3 rounded-xl mt-2 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#FF6600]/30 outline-none text-gray-900 dark:text-white"
                    placeholder="e.g., Jollof Rice with Chicken"
                    maxLength={100}
                  />
                  <div className="flex justify-between mt-1">
                    {!validations.name ? (
                      <p className="text-xs text-rose-500">
                        Name must be at least 3 characters
                      </p>
                    ) : (
                      <p className="text-xs text-green-600">Looks good ✅</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {formData.name.length}/100
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full border border-gray-200 dark:border-gray-700 p-3 rounded-xl mt-2 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#FF6600]/30 outline-none text-gray-900 dark:text-white"
                    placeholder="Describe your dish, ingredients, and what makes it special..."
                    maxLength={500}
                  />
                  <div className="flex justify-between mt-1">
                    {!validations.description ? (
                      <p className="text-xs text-rose-500">
                        Description must be at least 10 characters
                      </p>
                    ) : (
                      <p className="text-xs text-green-600">Good description</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {formData.description.length}/500
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          <SectionHeader
            title="Categories"
            icon={Layers}
            section="pricing"
            isValid={validations.categories && validations.price}
          />

          <AnimatePresence>
            {expandedSections.pricing && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 pb-6 space-y-4"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Root Category *
                    </label>
                    <select
                      value={formData.rootCategory}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          rootCategory: e.target.value,
                          subCategory: "",
                        }))
                      }
                      className="w-full border border-gray-200 dark:border-gray-700 p-3 rounded-xl mt-2 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#FF6600]/30 outline-none text-gray-900 dark:text-white"
                    >
                      <option value="">Select root category</option>
                      {Object.keys(CATEGORY_HIERARCHY).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sub Category *
                    </label>
                    <select
                      value={formData.subCategory}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          subCategory: e.target.value,
                        }))
                      }
                      disabled={!formData.rootCategory}
                      className="w-full border border-gray-200 dark:border-gray-700 p-3 rounded-xl mt-2 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#FF6600]/30 outline-none text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select sub category</option>
                      {formData.rootCategory &&
                        CATEGORY_HIERARCHY[formData.rootCategory]?.map(
                          (sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          )
                        )}
                    </select>
                  </div>
                </div>

                {!validations.categories && (
                  <p className="text-xs text-rose-500">
                    Both root and sub category are required
                  </p>
                )}

                <div className="grid sm:grid-cols-3 gap-4 mt-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Price (₦) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, price: e.target.value }))
                      }
                      className="w-full border border-gray-200 dark:border-gray-700 p-3 rounded-xl mt-2 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#FF6600]/30 outline-none text-gray-900 dark:text-white"
                      placeholder="3500"
                      min="100"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Delivery Fee (₦)
                    </label>
                    <input
                      type="number"
                      value={formData.deliveryFee}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          deliveryFee: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-200 dark:border-gray-700 p-3 rounded-xl mt-2 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#FF6600]/30 outline-none text-gray-900 dark:text-white"
                      placeholder="500"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Delivery Time (min)
                    </label>
                    <input
                      type="number"
                      value={formData.estimatedDeliveryTime}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          estimatedDeliveryTime: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-200 dark:border-gray-700 p-3 rounded-xl mt-2 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#FF6600]/30 outline-none text-gray-900 dark:text-white"
                      placeholder="30"
                      min="10"
                      max="120"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-900/10 p-4 rounded-xl">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Subtotal{" "}
                    <span className="font-semibold">
                      ₦{subtotal.toLocaleString()}
                    </span>{" "}
                    + Delivery{" "}
                    <span className="font-semibold">
                      ₦{delivery.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    Total ₦{total.toLocaleString()}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

                {/* Images Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ImagesSection
            images={formData.images}
            setImages={(images) => setFormData((p) => ({ ...p, images }))}
            uploading={uploadingMain}
            onUpload={handleImageUpload}
            expanded={expandedSections.images}
            toggleExpanded={() => toggleSection("images")}
            isValid={validations.images}
          />
        </motion.div>

        {/* Variants Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          <button
            type="button"
            onClick={() => toggleSection("variants")}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-900/10 rounded-xl hover:from-emerald-100 dark:hover:from-emerald-900/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg text-emerald-600">
                <Layers size={20} />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  Variants (Optional)
                </h2>
                <p className="text-xs text-gray-500">
                  {variants.length} variant{variants.length !== 1 ? "s" : ""} added
                </p>
              </div>
            </div>
            {expandedSections.variants ? (
              <ChevronUp size={20} className="text-gray-400" />
            ) : (
              <ChevronDown size={20} className="text-gray-400" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.variants && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 pb-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Add size variations (e.g., Small, Medium, Large)
                  </p>
                  <button
                    type="button"
                    onClick={() => setVariantModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors"
                  >
                    <Plus size={16} />
                    Add Variant
                  </button>
                </div>

                {variants.length > 0 ? (
                  <div className="space-y-3">
                    {variants.map((v, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl p-4"
                      >
                        <div className="flex items-center gap-3">
                          {v.image ? (
                            <img
                              src={v.image}
                              className="w-16 h-16 rounded-lg object-cover border-2 border-white dark:border-gray-700"
                              alt={v.name}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                              <ImageIcon size={24} className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white">
                              {v.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ₦{Number(v.price).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditVariant(i)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(i)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Layers size={48} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No variants added yet</p>
                    <p className="text-xs mt-1">
                      Click "Add Variant" to create size options
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Portions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <PortionsSection
            portions={portions}
            setPortions={setPortions}
            basePrice={Number(formData.price) || 0}
            expanded={expandedSections.portions}
            toggleExpanded={() => toggleSection("portions")}
          />
        </motion.div>

        {/* Choice Groups Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ChoiceGroupsSection
            choiceGroups={choiceGroups}
            setChoiceGroups={setChoiceGroups}
            expanded={expandedSections.choiceGroups}
            toggleExpanded={() => toggleSection("choiceGroups")}
          />
        </motion.div>

        {/* Tags Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <TagsSection
            tags={formData.tags}
            setTags={(tags) => setFormData((p) => ({ ...p, tags }))}
            expanded={expandedSections.tags}
            toggleExpanded={() => toggleSection("tags")}
          />
        </motion.div>

        {/* Submit Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#1E293B] rounded-3xl p-6 border border-slate-200 dark:border-slate-800"
        >
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full sm:w-auto px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={formData.available}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, available: e.target.checked }))
                }
                className="w-4 h-4 text-[#FF6600] border-gray-300 rounded focus:ring-[#FF6600]"
              />
              Available for order
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Creating...
                </>
              ) : (
                <>
                  <Check size={20} />
                  Create Food
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.form>

      {/* Modals */}
      <VariantModal
        open={variantModalOpen}
        onClose={() => {
          setVariantModalOpen(false);
          setEditingVariant(null);
        }}
        initial={editingVariant?.data ?? null}
        onSave={(v) => handleVariantSave(v)}
        accent={ACCENT}
      />

      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        food={{ ...formData, price: subtotal, deliveryFee: delivery }}
        variants={variants}
      />

      <MetadataModal metadata={metadata} setMetadata={setMetadata} />
    </div>
  );
}
