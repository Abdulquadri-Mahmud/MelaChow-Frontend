import { useApi } from "@/app/context/ApiContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  ArrowRight,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const LogoImage = () => (
  <div className="relative group">
    <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full scale-150 group-hover:scale-175 transition-transform duration-700" />
    <img
      src="/logo.png"
      alt="GrubDash Logo"
      className="w-[180px] object-contain relative z-10"
    />
  </div>
);

export default function Signup() {
  const { baseUrl } = useApi();
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    avatar: "",
    // password: "", 
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  // const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${baseUrl}/user/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Signup successful! 🎉");
        setFormData({
          firstname: "",
          lastname: "",
          email: "",
          phone: "",
          avatar: "",
        });
        router.push("/auth/signin");
      } else {
        setMessage(data.message || "Signup failed. Please try again.");
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-2 overflow-hidden relative">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[5%] right-[5%] w-64 h-64 bg-orange-500/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[20%] left-[5%] w-96 h-96 bg-orange-600/5 rounded-full blur-[120px] animate-pulse delay-700" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white dark:bg-zinc-900 w-full max-w-lg p-4 md:p-10 rounded-[40px] shadow-2xl shadow-zinc-200/50 dark:shadow-none border border-zinc-100 dark:border-zinc-800 relative z-10 my-8"
      >
        <div className="flex justify-center mb-8">
          <LogoImage />
        </div>

        <div className="text-center space-y-2 mb-8">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white leading-none">
            Create <span className="text-orange-600">Account</span>
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
            Start your gourmet journey today
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-1 group">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">First Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="text"
                  name="firstname"
                  placeholder="John"
                  value={formData.firstname}
                  onChange={handleChange}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 p-3.5 pl-11 rounded-2xl outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Last Name */}
            <div className="space-y-1 group">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Last Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="text"
                  name="lastname"
                  placeholder="Doe"
                  value={formData.lastname}
                  onChange={handleChange}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 p-3.5 pl-11 rounded-2xl outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium dark:text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-1 group">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="email"
                name="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 p-3.5 pl-11 rounded-2xl outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium dark:text-white"
                required
              />
            </div>
          </div>

          {/* Phone Input */}
          <div className="space-y-1 group">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="tel"
                name="phone"
                placeholder="0800 000 0000"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 p-3.5 pl-11 rounded-2xl outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium dark:text-white"
                required
              />
            </div>
          </div>

          {/* Password Input (Removed) */}
          {/*
          <div className="space-y-1 group">
             ...
          </div>
          */}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl font-black uppercase italic tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-50 mt-6 active:scale-95 group"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>
        </form>

        <AnimatePresence>
          {message && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-center mt-6 text-[11px] font-bold tracking-tight py-3 px-4 rounded-xl ${message.includes("successful")
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20"
                : "bg-rose-50 text-rose-500 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20"
                }`}
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="mt-4 pt-4 border-t border-zinc-50 dark:border-zinc-800 text-center space-y-4">
          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-tight">
            Already have an account?{" "}
            <Link
              href="/auth/signin"
              className="text-orange-600 hover:text-orange-700 transition font-black tracking-widest italic"
            >
              SIGN IN
            </Link>
          </p>

          <Link
            href="/vendors/auth/register"
            className="inline-block p-1 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 border border-zinc-100 dark:border-zinc-700 text-[9px] font-black uppercase text-zinc-400 hover:text-orange-500 hover:border-orange-500/20 transition-all tracking-[0.2em]"
          >
            Join the Vendor Network
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
