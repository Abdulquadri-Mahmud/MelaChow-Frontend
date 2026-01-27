import { motion, AnimatePresence } from "framer-motion";
import { Trash2, AlertCircle } from "lucide-react";

const DeleteModal = ({ isDeleteModalOpen, setIsDeleteModalOpen, confirmDelete, deleteLoading }) => {
  return (
    <AnimatePresence>
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDeleteModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-[32px] p-8 w-full max-w-sm text-center relative z-10 shadow-2xl"
          >
            <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <Trash2 className="text-red-500" size={32} />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Account?</h3>
            <p className="text-sm font-medium text-gray-400 mb-8 px-4">
              This action is permanent and cannot be undone. All your data will be cleared instantly.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="bg-red-500 text-white py-4 rounded-2xl font-bold hover:bg-red-600 active:scale-[0.98] transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                {deleteLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : (
                  "Yes, Delete My Account"
                )}
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="bg-gray-50 text-gray-500 py-4 rounded-2xl font-bold hover:bg-gray-100 active:scale-[0.98] transition-all"
              >
                No, Keep It
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default DeleteModal;
