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

export default uploadToCloudinary;