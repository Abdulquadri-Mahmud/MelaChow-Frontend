import { motion, AnimatePresence } from "framer-motion";

// ===================
// DeleteModal Component
// ===================
const DeleteModal = ({ isDeleteModalOpen, setIsDeleteModalOpen, confirmDelete, deleteLoading }) => {
  return (
    <AnimatePresence>
    {isDeleteModalOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 bg-opacity-40 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
          className="bg-white p-6 rounded shadow-md w-full max-w-md"
        >
          <h4 className="font-semibold mb-4">Confirm Delete</h4>
          <p className="mb-6">Are you sure you want to delete your account?</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
  )
}

export default DeleteModal;