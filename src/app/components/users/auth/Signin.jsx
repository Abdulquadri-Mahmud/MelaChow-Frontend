import { useApi } from "@/app/context/ApiContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Store } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

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

export default function Signin() {
  const { baseUrl } = useApi();
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
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
      // ✅ Explicit endpoint construction for clarity
      const endpoint = `${baseUrl}/user/auth/login`;

      console.log(endpoint)

      if (process.env.NODE_ENV === 'development') {
        console.log('[Signin] Sending request to:', endpoint);
        console.log('[Signin] Form data:', { email: formData.email });
      }

      const { data } = await axios.post(endpoint, formData, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,  // ✅ CRITICAL: Send cookies
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('[Signin] Response:', data);
      }

      setMessage("Signin successful! 🎉 Redirecting...");

      // ✅ Add small delay so user sees success message
      setTimeout(() => {
        router.push(
          `/auth/verify-account?email=${encodeURIComponent(formData.email)}`
        );
      }, 1000);

    } catch (err) {
      console.error('[Signin] Error:', err);

      if (err.response) {
        // Server responded with error status
        const errorMessage = err.response.data.message || "Invalid email.";
        setMessage(errorMessage);

        if (process.env.NODE_ENV === 'development') {
          console.error('[Signin] Server error:', err.response.status, errorMessage);
        }
      } else if (err.request) {
        // Request made but no response received
        setMessage("Network error. Please check your connection.");

        if (process.env.NODE_ENV === 'development') {
          console.error('[Signin] Network error - no response received');
        }
      } else {
        // Something else happened
        setMessage("An error occurred. Please try again.");

        if (process.env.NODE_ENV === 'development') {
          console.error('[Signin] Unexpected error:', err.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md flex flex-col h-full max-h-[40vh] justify-center"
      >
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-4xl font-black italic uppercase tracking-tight text-zinc-900 dark:text-white">
            Welcome <span className="text-orange-600">Back</span>
          </h2>
          <p className="text-xs font-semibold text-zinc-500">
            Sign in to continue ordering
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 flex-1 justify-center flex flex-col">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl text-base font-medium dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              required
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </motion.button>
        </form>

        <AnimatePresence>
          {message && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-center mt-4 text-sm font-semibold py-3 px-4 rounded-xl ${message.includes("successful")
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"
                : "bg-rose-50 text-rose-500 dark:bg-rose-500/10"
                }`}
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="mt-6 text-center space-y-4">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Don't have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-orange-600 hover:text-orange-700 font-bold"
            >
              Create One
            </Link>
          </p>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Link
              href="/vendors/auth/login"
              className="group inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 rounded-xl hover:from-orange-100 hover:to-amber-100 dark:hover:from-orange-500/20 dark:hover:to-amber-500/20 transition-all duration-300"
            >
              <Store className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                Vendor?
              </span>
              <span className="text-xs font-semibold text-orange-600">
                Sign In Here
              </span>
              <ArrowRight className="w-4 h-4 text-orange-600 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
