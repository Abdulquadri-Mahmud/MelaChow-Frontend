"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  Check,
} from "lucide-react";
import axios from "axios";
import showAnimatedToast from "../../toast/showAnimatedToast";

const CLOUDINARY_PRESET = "GrubDash"; // your Cloudinary preset
const CLOUDINARY_HOST = "https://api.cloudinary.com/v1_1/dypn7gna0/image/upload";

/***** VARIANT MODAL COMPONENT (step-by-step) *****/
export default function VariantModal({ open, onClose, initial = null, onSave, accent = ACCENT }) {
  const [step, setStep] = useState(0);
  const [payload, setPayload] = useState(initial || { name: "", price: "", image: "" });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPayload(initial || { name: "", price: "", image: "" });
    setStep(0);
    setUploading(false);
  }, [initial, open]);

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET);

    try {
    const res = await axios.post(CLOUDINARY_HOST, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.secure_url;
    } catch (err) {
    console.error("❌ Cloudinary upload error:", err);

    if (err.response) {
        setError(`Upload failed: ${err.response.data.error?.message || "Unknown Cloudinary error"}`);
    } else if (err.request) {
        setError("No response from Cloudinary — check your internet connection or Cloudinary host URL.");
    } else {
        setError(`Error setting up request: ${err.message}`);
    }

    return null;
    }
};

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload only JPEG, PNG, or WEBP images.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large. Please upload an image smaller than 5MB.");
      return;
    }

    setUploading(true);
    setError("");

    const url = await uploadToCloudinary(file);

    if (url) {
      setPayload((p) => ({ ...p, image: url }));
      showAnimatedToast("success", "Image uploaded successfully!");
    } else {
      showAnimatedToast("error", "Image upload failed. Please try again.");
    }

    setUploading(false);
  };

  const reset = () => {
    setStep(0);
    setPayload({ name: "", price: "", image: "" });
    setUploading(false);
  };

  const handleSave = () => {
    if (!payload.name.trim()) { showAnimatedToast("error", "Add variant name"); return; }
    if (!payload.price && payload.price !== 0) { showAnimatedToast("error", "Add variant price"); return; }
    onSave({ ...payload, price: Number(payload.price) });
    reset();
    onClose();
    showAnimatedToast("success", "Variant added");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black/40 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { reset(); onClose(); }} />
          <motion.div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6 bg-white rounded-2xl shadow-xl"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Variant — Step {step + 1}/3</h3>
              <button onClick={() => { reset(); onClose(); }} className="p-1 rounded hover:bg-gray-100"><X /></button>
            </div>

            <div className="space-y-4">
              {step === 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Variant name</label>
                  <input className="w-full border border-gray-200 p-3 rounded-lg mt-2" value={payload.name} onChange={(e) => setPayload(p => ({ ...p, name: e.target.value }))} placeholder="e.g. With Chicken" />
                  <p className="text-xs text-gray-400 mt-2">Give this variant a short descriptive name.</p>
                </div>
              )}

              {step === 1 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Variant price (₦)</label>
                  <input className="w-full border border-gray-200 p-3 rounded-lg mt-2" value={payload.price} onChange={(e) => setPayload(p => ({ ...p, price: e.target.value }))} type="number" placeholder="1200" />
                  <p className="text-xs text-gray-400 mt-2">Price for this variant.</p>
                </div>
              )}

              {step === 2 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Variant image (optional)</label>
                  <div className="mt-2">
                    {payload.image ? (
                      <div className="flex items-center gap-3">
                        <img src={payload.image} alt="variant" className="w-20 h-20 rounded-md object-cover border" />
                        <div>
                          <div className="font-medium">{payload.name || "Variant preview"}</div>
                          <button className="text-sm text-rose-500 mt-2" onClick={() => setPayload(p => ({ ...p, image: "" }))}>Remove image</button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 cursor-pointer text-[#FF6600]">
                        <Upload /> Upload image
                        <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                      </label>
                    )}
                    {uploading && <p className="text-xs text-gray-500 mt-2">Uploading...</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-5">
              <div>
                <button className="px-3 py-2 rounded-md bg-gray-100" onClick={() => { if (step === 0) { reset(); onClose(); } else setStep(s => s - 1); }}>{step === 0 ? "Cancel" : "Back"}</button>
              </div>
              <div className="flex gap-2">
                {step < 2 ? (
                  <button className="px-4 py-2 bg-[#FF6600] text-white rounded-md" onClick={() => {
                    if (step === 0 && !payload.name.trim()) { showAnimatedToast("error", "Please add a variant name."); return; }
                    if (step === 1 && (!payload.price && payload.price !== 0)) { showAnimatedToast("error", "Please add a variant price."); return; }
                    setStep(s => s + 1);
                  }}>Next</button>
                ) : (
                  <button className="px-4 py-2 bg-emerald-600 text-white rounded-md flex items-center gap-2" onClick={handleSave}><Check /> Save Variant</button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}