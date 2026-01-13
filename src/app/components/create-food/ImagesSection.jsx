import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, ImageIcon, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

export default function ImagesSection({
    images,
    setImages,
    uploading,
    onUpload,
    expanded,
    toggleExpanded,
    isValid,
}) {
    const removeImage = (index) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button
                type="button"
                onClick={toggleExpanded}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-transparent dark:from-green-900/10 rounded-xl hover:from-green-100 dark:hover:from-green-900/20 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-500/10 rounded-lg text-green-600">
                        <ImageIcon size={20} />
                    </div>
                    <div className="text-left">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                            Images *
                        </h2>
                        <p className="text-xs text-gray-500">
                            {images.length} image{images.length !== 1 ? "s" : ""} uploaded (max 5)
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isValid !== undefined && (
                        <span
                            className={`text-xs ${isValid ? "text-emerald-500" : "text-rose-500"
                                }`}
                        >
                            {isValid ? "✓ Valid" : "Required"}
                        </span>
                    )}
                    {expanded ? (
                        <ChevronUp size={20} className="text-gray-400" />
                    ) : (
                        <ChevronDown size={20} className="text-gray-400" />
                    )}
                </div>
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-6 pb-6 space-y-4"
                    >
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {/* Upload Button */}
                            <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={onUpload}
                                    disabled={uploading || images.length >= 5}
                                />
                                <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                                    {uploading ? (
                                        <Loader2 className="animate-spin mb-2" size={32} />
                                    ) : (
                                        <Upload size={32} className="mb-2" />
                                    )}
                                    <span className="text-xs font-medium text-center px-2">
                                        {uploading ? "Uploading..." : "Upload Images"}
                                    </span>
                                    <span className="text-[10px] text-gray-400 mt-1">
                                        {images.length}/5
                                    </span>
                                </div>
                            </label>

                            {/* Image Previews */}
                            {images.map((img, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 relative group"
                                >
                                    <img
                                        src={img.url}
                                        alt={`Food ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    {index === 0 && (
                                        <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                                            PRIMARY
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {!isValid && images.length === 0 && (
                            <p className="text-xs text-rose-500">
                                At least one image is required
                            </p>
                        )}

                        <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-800 dark:text-blue-400 font-medium">
                                💡 Tips: Upload high-quality images (800x600px recommended). First image will be the primary display image.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
