
// ===================
// ProfileForm Component
// ===================
const ProfileForm = ({
  userState,
  setUserState,
  loading,
  handleSaveProfile,
  avatarSuccess,
  openProfileImageMessage,
  setOpenProfileMessage,
}) => {
  return (
    <div className="mb-6">
      <h3 className="font-semibold text-gray-700 mb-3">Profile Details</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-600 text-sm">First Name</label>
          <input
            type="text"
            value={userState.firstname}
            onChange={(e) =>
              setUserState((prev) => ({ ...prev, firstname: e.target.value }))
            }
            className="w-full border border-gray-100 text-gray-600 md:text-md text-sm  rounded p-2"
          />
        </div>
        <div>
          <label className="block text-gray-600 text-sm">Last Name</label>
          <input
            type="text"
            value={userState.lastname}
            onChange={(e) =>
              setUserState((prev) => ({ ...prev, lastname: e.target.value }))
            }
            className="w-full border border-gray-100 text-gray-600 md:text-md text-sm  rounded p-2"
          />
        </div>
        <div>
          <label className="block text-gray-600 text-sm">Phone</label>
          <input
            type="text"
            value={userState.phone}
            onChange={(e) =>
              setUserState((prev) => ({ ...prev, phone: e.target.value }))
            }
            className="w-full border border-gray-100 text-gray-600 md:text-md text-sm  rounded p-2"
          />
        </div>
        <div>
          <label className="block text-gray-600 text-sm">Email</label>
          <input
            type="text"
            value={userState.email}
            disabled
            className="w-full border border-gray-100 text-gray-600 md:text-md text-sm  rounded p-2 bg-gray-100"
          />
        </div>
      </div>
      {openProfileImageMessage && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white p-6 rounded shadow-md w-full max-w-md"
            >
              <h3 className="text-green-500 text-xl font-semibold">Profile Image</h3>
              <p className="text-gray-600 mt-4">{avatarSuccess}</p>
              <div className="w-full flex justify-end mt-6">
                <button
                  onClick={() => setOpenProfileMessage(false)}
                  className="py-2 px-6 bg-green-500 rounded text-white hover:bg-green-600"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
      
      <button
        onClick={handleSaveProfile}
        className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition"
        disabled={loading}
      >
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

export default ProfileForm;