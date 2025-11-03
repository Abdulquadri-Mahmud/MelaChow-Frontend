  "use client";

  import { useEffect, useMemo, useRef, useState } from "react";
  import { motion, AnimatePresence } from "framer-motion";
  import toast, { Toaster } from "react-hot-toast";
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
    Moon,
    Sun,
    Repeat,
    RefreshCcw,
  } from "lucide-react";
  import PreviewModal from "@/app/components/modals/update/PreviewModal";
  import VariantModal from "@/app/components/modals/update/VariantsModal";
  import MetadataModal from "@/app/components/modals/update/MetadataModal";
  import showAnimatedToast from "@/app/components/toast/showAnimatedToast";
  import { updateFood } from "@/app/utils/vendor/api/vendorFoodApi";
  import { useFoodById } from "@/app/hooks/useVendorFoodQuery";
import UpdateFoodSkeleton from "@/app/components/skeletons/UpdateFoodSkeleton";

  /***** CONFIG *****/
  const ACCENT = "#FF6600";
  const CLOUDINARY_PRESET = "GrubDash"; // your preset
  const CLOUDINARY_HOST = "https://api.cloudinary.com/v1_1/dypn7gna0/image/upload";

  /***** HELPERS *****/
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET);
    try {
      const res = await axios.post(CLOUDINARY_HOST, formData);
      return res.data.secure_url;
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      return null;
    }
  };

  /***** TAG SUGGESTIONS *****/
  const SUGGESTED_TAGS = ["popular", "spicy","delicious", "vegan", "new", "combo", "signature"];

  /***** MAIN PAGE *****/
  export default function UpdateFoodPage() {
    const router = useRouter();
    const { id } = useParams();

    // Form state
    const [formData, setFormData] = useState({
      name: "",
      description: "",
      category: "",
      price: "",
      deliveryFee: "",
      estimatedDeliveryTime: "",
      tags: [],
      available: true,
      images: [],
    });

    const [metadata, setMetadata] = useState({});

    // --- FETCH FOOD BY ID ---
    const { food: foodData, isLoading } = useFoodById(id);

    // UI state
    const [tagInput, setTagInput] = useState("");
    const [variants, setVariants] = useState([]);
    const [variantModalOpen, setVariantModalOpen] = useState(false);
    const [editingVariant, setEditingVariant] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadingMain, setUploadingMain] = useState(false);

    const [initialized, setInitialized] = useState(false);
    
    const [refreshing, setRefreshing] = useState(false);

    const refreshData = async () => {
      try {
        setRefreshing(true);

        if (foodData?.data) {
          setFormData({
            name: foodData.data.name || "",
            description: foodData.data.description || "",
            category: foodData.data.category || "",
            price: foodData.data.price?.toString() || "",
            deliveryFee: foodData.data.deliveryFee?.toString() || "",
            estimatedDeliveryTime: foodData.data.estimatedDeliveryTime?.toString() || "",
            tags: foodData.data.tags || [],
            available: foodData.data.available ?? true,
            images: Array.isArray(foodData.data.images)
              ? foodData.data.images.map((img) =>
                  typeof img === "string" ? img : img.url
                )
              : [],
          });

          setVariants(
            Array.isArray(foodData.data.variants)
              ? foodData.data.variants.map((v) => ({
                  _id: v._id,
                  name: v.name || "",
                  price: v.price || 0,
                  image:
                    typeof v.image === "string"
                      ? v.image
                      : v.image?.url || "",
                }))
              : []
          );

          setMetadata({
            portionSize: foodData.data.metadata?.portionSize || "1",
            spiceLevel: foodData.data.metadata?.spiceLevel || "Medium",
            chefSpecial: foodData.data.metadata?.chefSpecial || false,
          });
        }
        toast.success("Food data reloaded successfully!");
      } catch (error) {
        console.error("Failed to refresh data:", error);
        toast.error("No food data found to refresh.");
      } finally {
        setRefreshing(false);
      }
    };
    
    useEffect(() => {
      if (foodData?.data) {
        refreshData();
        // setInitialized(true);
      }
    }, [foodData]);

    useEffect(() => {
      if (metadata && Object.keys(metadata).length > 0) {
        // console.log("Updated metadata:", metadata);
      }
    }, [metadata]);

    // refs
    const fileRef = useRef(null);

    // Fetch dynamic categories (optional) - gracefully fails
    const [categories, setCategories] = useState([
      "Rice Dishes",
      "Swallow",
      "Soups & Stews",
      "Beans Dishes",
      "Yam Dishes",
      "Plantain Dishes",
      "Pasta",
      "Snacks",
      "Grills & Barbecue",
      "Shawarma",
      "Breakfast",
      "Drinks",
      "Desserts",
      "Seafood",
      "Vegetarian",
      "Salads",
      "Small Chops",
      "Porridge",
      "Native Delicacies",
      "Others"
    ]);

    /** Validation helpers and inline feedback **/
    const validations = useMemo(() => {
      return {
        name: formData.name.trim().length >= 3,
        category: !!formData.category,
        price: Number(formData.price) > 0,
        description: formData.description.trim().length >= 10,
        // images: formData.images.length > 0,
        tags: formData.tags.length > 0,
      };
    }, [formData]);

    const completedCount = useMemo(() => {
      const checks = Object.values(validations).filter(Boolean).length;
      return checks;
    }, [validations]);

    const totalChecks = 6; // name, category, price, description, images, tags
    const progressPercent = Math.round((completedCount / totalChecks) * 100);

    /** Real-time price breakdown **/
    const subtotal = Number(formData.price) || 0;
    const delivery = Number(formData.deliveryFee) || 0;
    const total = subtotal + delivery;

    let totalVariationPrice = 0;

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
      if (e.key === "Enter" || e.key === ",") { e.preventDefault(); handleAddTag(); }
      else if (e.key === "Backspace" && !tagInput) {
        setFormData(p => ({ ...p, tags: p.tags.slice(0, -1) }));
      }
    };
    const removeTag = (t) => setFormData(p => ({ ...p, tags: p.tags.filter(x => x !== t) }));

    /** Image upload (main) **/
    const handleImageUpload = async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      setUploadingMain(true);
      const id = toast.loading("Uploading images...", { id: "img-upload" });
      try {
        const urls = await Promise.all(files.map(uploadToCloudinary));
        const valid = urls.filter(Boolean);
        setFormData(p => ({ ...p, images: [...p.images, ...valid] }));
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
      // if editing, replace the variant at that index
      if (editingVariant?.index != null) {
          setVariants(prev =>
          prev.map((item, i) => (i === editingVariant.index ? v : item))
          );
          setEditingVariant(null);
      } else {
          // add new
          setVariants(prev => [...prev, v]);
      }
      // close modal if still open
      setVariantModalOpen(false);
    };

    const handleEditVariant = (idx) => {
      // sanity check
      if (typeof idx !== "number" || !variants[idx]) {
          console.warn("handleEditVariant: invalid index", idx);
          return;
      }

      setEditingVariant({ index: idx, data: variants[idx] });
      console.log("Editing variant index", idx, "data:", variants[idx]);
      setVariantModalOpen(true);
    };

    const handleRemoveVariant = (idx) => setVariants(prev => prev.filter((_, i) => i !== idx));

    /** Variant auto-sync helper **/
    const autoSyncVariants = () => {
      if (!variants.length) { showAnimatedToast("error", "No variants to sync"); return; }
      const confirmSync = confirm("Sync variant names to include food name? This will prefix each variant with the food name. Continue?");
      if (!confirmSync) return;
      setVariants(prev => prev.map(v => ({ ...v, name: `${formData.name} - ${v.name}` })));
      showAnimatedToast("success", "Variants synced");
    };

    /** Preview modal data **/
    const previewData = {
      ...formData,
      price: subtotal,
      deliveryFee: delivery,
    };

    // --- HANDLE UPDATE ---
    const handleUpdate = async (e) => {
      e.preventDefault();

      console.log()
      setLoading(true);
      try {
        const payload = {
          ...formData,
          metadata,
          variants: variants.map((v) => ({
            _id: v._id || undefined,
            name: v.name,
            price: v.price,
            image: v.image,
          })),
          images: formData.images.map((img) => ({
            _id: img._id || undefined,
            url: typeof img === "string" ? img : img.url,
          })),
        };
  
        // const token = localStorage.getItem("vendorToken");

        const { data } = await updateFood(id, payload);


        console.log(data);

        // toast.success("✅ Food updated successfully!");
        showAnimatedToast("success", "✅ Food updated successfully!");
        // router.push("/vendors/my-foods");
      } catch (error) {
        console.error("Update error:", error || error.message);
        toast.error(error.response?.data.message || "❌ Failed to update food");
      } finally {
        setLoading(false);
      }
    };

    /** Small helper UI indicators **/
    const fieldIndicator = (ok) => {
      return ok ? <span className="text-emerald-500 text-xs flex items-center gap-1"><Check size={12} /> Looks good</span> : <span className="text-rose-500 text-xs">Required</span>;
    };

    if (isLoading)
      return <UpdateFoodSkeleton/>;

    return (
      <div className="min-h-screen transition-colors">
        <Toaster position="top-right" />

        {/* TOP BAR: progress + theme */}
        <div className="max-w-5xl mx-auto mb-3">
          <div className="relative bg-white rounded-xl p-3 mb-3">
            <div className="flex items-center flex-col gap-4">
              <div className="bg-orange-500/70 p-3 rounded-full">
                <Utensils className="text-gray-200" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 ">
                  <span className="text-orange-500 ">Update Food</span> - 
                  <span className="text-orange-500"> GrubDash</span>
                </h1>
                <p className="text-sm sm:text-base text-gray-500">
                    Step-by-step listing creation with validation & live preview
                </p>
              </div>
            </div>

            <button onClick={refreshData} disabled={refreshing} className="absolute top-2 left-2 px-4 py-2 bg-orange-500 text-white rounded-md flex items-center gap-2">
              {refreshing ? (
                <>
                  <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                  <RefreshCcw />
                </>
              ) : (
                <RefreshCcw />
              )}
            </button>


            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setPreviewOpen(true)} 
              className="absolute top-2 right-2 font-semibold bg-orange-500 px-3 py-2 text-white rounded-tl-2xl rounded-br-2xl text-sm cursor-pointer hover:bg-orange-700">Preview</button>
              {/* <button type="button" onClick={() => { setDark(d => !d); }} className="p-2 rounded-md border hover:bg-gray-100">
                {dark ? <Sun /> : <Moon />}
              </button> */}
            </div>
          </div>

          {/* Progress bar */}
          {/* <div className="mb-4 bg-white p-3 rounded-full">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-600 dark:text-gray-300">Form completion</div>
              <div className="text-xs font-medium text-gray-700">{completedCount} of {totalChecks} • {progressPercent}%</div>
            </div>
            <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.5, ease: "easeOut" }} className="h-full" style={{ background: ACCENT }} />
            </div>
          </div> */}

        </div>

        {/* MAIN FORM */}
        <motion.form onSubmit={handleUpdate} className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-3 sm:p-3 space-y-8" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {/* Section: Basic */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Basic Info</h2>
              <div className="text-sm">{fieldIndicator(validations.name)}</div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Food name *</label>
              <input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full border border-gray-200 p-3 rounded-lg mt-2 bg-white focus:ring-2 focus:ring-[#FF6600]/30" placeholder="Pounded Yam with Egusi Soup" />
              {!validations.name ? <p className="text-xs text-rose-500 mt-1">Name must be at least 3 characters</p> : <p className="text-xs text-green-600 mt-1">Looks good ✅</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full border border-gray-200 p-3 rounded-lg mt-2 bg-white focus:ring-2 focus:ring-[#FF6600]/30" placeholder="Describe the dish..." />
              {!validations.description ? <p className="text-xs text-rose-500 mt-1">Make it a little longer (10+ chars)</p> : <p className="text-xs text-green-600 mt-1">Good description</p>}
            </div>
          </motion.div>

          {/* Section: Pricing */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Pricing & Delivery</h2>
              <div className="text-sm">{fieldIndicator(validations.price)}</div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-gray-700">Category *</label>
                <select value={formData.category} onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))} className="w-full border border-gray-200 p-3 rounded-lg mt-2 bg-white focus:ring-2 focus:ring-[#FF6600]/30">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {!validations.category ? <p className="text-xs text-rose-500 mt-1">Choose a category</p> : <p className="text-xs text-green-600 mt-1">Set</p>}
              </div>

              <div>
                <label className="text-sm text-gray-700">Price (₦) *</label>
                <input type="number" value={formData.price} onChange={(e) => setFormData(p => ({ ...p, price: e.target.value }))} className="w-full border border-gray-200 p-3 rounded-lg mt-2 bg-white focus:ring-2 focus:ring-[#FF6600]/30" placeholder="3500" />
                {!validations.price ? <p className="text-xs text-rose-500 mt-1">Price must be '' 0</p> : <p className="text-xs text-green-600 mt-1">Good</p>}
              </div>

              <div>
                <label className="text-sm text-gray-700">Delivery fee (₦)</label>
                <input type="number" value={formData.deliveryFee} onChange={(e) => setFormData(p => ({ ...p, deliveryFee: e.target.value }))} className="w-full border border-gray-200 p-3 rounded-lg mt-2 bg-white focus:ring-2 focus:ring-[#FF6600]/30" placeholder="500" />
              </div>
            </div>

            {/* Price breakdown */}
            <div className="flex items-center justify-between mt-2 bg-orange-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Subtotal <span className="font-semibold">₦{subtotal.toLocaleString()}</span> + Delivery <span className="font-semibold">₦{delivery.toLocaleString()}</span></div>
              <motion.div initial={{ x: 8, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 24 }} className="text-lg font-semibold text-gray-900">Total ₦{total.toLocaleString()}</motion.div>
            </div>
          </motion.div>

          {/* Section: Tags + suggestions */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Tags</h2>
              <div className="text-xs text-gray-500">Click suggestions or type your own</div>
            </div>

            <div className="flex gap-2 items-center">
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKey} className="flex-1 border border-gray-200 p-3 rounded-lg bg-white focus:ring-2 focus:ring-[#FF6600]/30" placeholder="Type tag and press Enter" />
              <button type="button" onClick={() => handleAddTag()} className="px-4 py-2 bg-orange-500 text-white rounded-tl-2xl rounded-br-2xl">Add</button>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {SUGGESTED_TAGS.map(tag => (
                <button type="button" key={tag} onClick={() => handleAddTag(tag)} className="text-xs px-3 py-1 rounded-full border border-gray-200 hover:bg-orange-50 text-[#FF6600]">{tag}</button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {formData.tags.length ? formData.tags.map(t => (
                <span key={t} className="px-3 py-1 bg-orange-50 text-[#FF6600] rounded-full flex items-center gap-2">
                  <span className="text-sm">{t}</span>
                  <button type="button" onClick={() => removeTag(t)} className="p-0.5"><X size={14} /></button>
                </span>
              )) : <p className="text-xs text-gray-400">Tags help customers find your dish (e.g., "spicy")</p>}
            </div>
          </motion.div>

          {/* Section: Images */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Images</h2>
              <div className="text-xs text-gray-500">{fieldIndicator(validations.images)}</div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <label className="col-span-1 flex items-center justify-center border-2 border-dashed border-gray-800 p-6 rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="flex flex-col items-center text-gray-900">
                  {uploadingMain ? <Loader2 className="animate-spin" /> : <Upload />}
                  <span className="text-sm mt-2">Upload images</span>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                </div>
              </label>

              <div className="col-span-2 flex gap-3 flex-wrap">
                {formData.images.length ? formData.images.map((url, i) => (
                  <div key={i} className="w-28 h-28 rounded-lg overflow-hidden border relative">
                    <img src={typeof url === "string" ? url : url.url} alt={`img-${i}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-white/80 rounded p-1"
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          images: p.images.filter((_, idx) => idx !== i),
                        }))
                      }
                    >
                      <X size={14} />
                    </button>
                  </div>
                )) : (
                  <div className="text-gray-400 text-sm">No images yet — upload clear photos.</div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Section: Variants */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
            <div className="w-full flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Variants</h2>
              <div className="flex items-center gap-2">
                <button type="button" className="flex items-center px-2 py-2 gap-2 bg-green-500 text-white rounded-tl-2xl rounded-br-2xl text-sm" onClick={() => setVariantModalOpen(true)}><Plus /> Add</button>
                <button type="button" className="flex items-center px-2 py-2 gap-3 bg-orange-500 text-white rounded-tl-2xl rounded-br-2xl text-sm" onClick={() => autoSyncVariants()}><Repeat /> Sync names</button>
              </div>
            </div>

            <div className="space-y-2">
              {variants.length ? variants.map((v, i) => {
                  
                  totalVariationPrice += v.price;

                  return (
                      <div key={i} className="flex items-center justify-between bg-white border-2 border-dashed  border-orange-500 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                              {v.image ? <img src={v.image} className="w-12 h-12 rounded-md object-cover" /> : <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center"><ImageIcon /></div>}
                              <div>
                                  <div className="font-medium">{v.name}</div>
                                  <div className="text-xs text-gray-500">₦{Number(v.price).toLocaleString()}</div>
                              </div>
                          </div>
                          <div className="flex gap-2">
                              <button type="button" onClick={() => handleEditVariant(i)} className="text-sm bg-green-500 text-white p-2 rounded-tl-2xl rounded-br-2xl">Edit</button>
                              <button type="button" onClick={() => handleRemoveVariant(i)} className="text-sm bg-red-500 text-white p-2 rounded-tl-2xl rounded-br-2xl">Remove</button>
                          </div>
                      </div>
                  )
              }) : <p className="text-sm text-gray-400">No variants added yet.</p>}
              <div className="bg-orange-100 p-2 max-w-[200px] text-sm font-semibold rounded-tl-2xl rounded-br-2xl">
                  <p className="">Total variation price: <span className="font-bold text-orange-500">₦{totalVariationPrice.toLocaleString()}</span></p>
              </div>
            </div>
          </motion.div>
          
          
          <MetadataModal metadata={metadata} setMetadata={setMetadata} />

          {/* Small meta row */}
          <div className="flex items-center justify-between gap-1">
            <div className="max-w-[45%] w-full">
              <div className="flex items-center flex-wrap gap-3">
                  <label className="flex items-center gap-2"><input type="checkbox" className="bg-orange-500" checked={formData.available} onChange={(e) => setFormData(p => ({ ...p, available: e.target.checked }))} /> <span className="text-sm">Available</span></label>
                  <div className="text-xs text-gray-500">Est. Delivery: <input value={formData.estimatedDeliveryTime} onChange={(e) => setFormData(p => ({ ...p, estimatedDeliveryTime: e.target.value }))} className="w-20 ml-2 font-semibold border border-dashed border-orange-600 outline-0 text-gray-800 text-center p-1 rounded-tl-2xl rounded-br-2xl text-sm bg-orange-100" placeholder="25" required /></div>
              </div>
              <p className="text-xs text-center text-gray-500">Estimated delivery time</p>
            </div>

            <div className="max-w-[45%] w-full flex items-center flex-wrap gap-4">
              <button type="button" onClick={() => setPreviewOpen(true)} className="px-3 py-2 border rounded-tl-2xl rounded-br-2xl text-sm flex items-center gap-3 bg-green-500 text-white"><Eye /> Preview</button>
              <div className="text-sm text-gray-600">Subtotal <span className="font-semibold">₦{subtotal.toLocaleString()}</span> • Delivery <span className="font-semibold">₦{delivery.toLocaleString()}</span></div>
            </div>
          </div>

          {/* Actions / sticky on mobile */}
          <div className="flex items-center justify-between gap-3 border-t border-gray-300 pb-8 pt-4">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 bg-red-500 text-white rounded-tl-2xl rounded-br-2xl">Cancel</button>
            <button type="button"  onClick={() => { setPreviewOpen(true); }} className="px-4 py-2 bg-gray-800 text-white font-medium rounded-tl-2xl rounded-br-2xl">Preview</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-[#FF6600] text-white rounded-tl-2xl rounded-br-2xl flex items-center gap-2">
              {loading ? <Loader2 className="animate-spin" /> : <span>Update Food</span>}
            </button>
          </div>
        </motion.form>

        {/* Variant modal (pass initial state when editing) */}
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

        {/* Preview modal */}
        <PreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} food={previewData} variants={variants} />
      </div>
    );
  }