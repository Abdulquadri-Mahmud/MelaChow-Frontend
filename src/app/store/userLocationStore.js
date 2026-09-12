import { create } from "zustand";

const getInitialLocation = () => {
    if (typeof window === "undefined") return null;
    try {
        const saved = localStorage.getItem("melachow_location");
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
};

export const useLocationStore = create((set, get) => ({
    userLocation: getInitialLocation(),

    setLocation: (location) => {
        if (typeof window !== "undefined" && location) {
            localStorage.setItem("melachow_location", JSON.stringify(location));
        }
        set({ userLocation: location });
    },

    syncWithUserAddress: (user) => {
        if (!user || !user.addresses) return;

        const defaultAddr = user.addresses.find((a) => a.isDefault);
        const city = defaultAddr?.city || defaultAddr?.cityName;
        const state = defaultAddr?.state || defaultAddr?.stateName;

        const addressId = defaultAddr?.id || defaultAddr?._id;
        if (addressId && ((city && state) || defaultAddr?.coordinates)) {
            const newLoc = { city: city || "", state: state || "", addressId, coordinates: defaultAddr.coordinates };
            const currentLoc = get().userLocation;

            // Only update if the location is completely missing or different
            if (
                !currentLoc ||
                currentLoc.city !== newLoc.city ||
                currentLoc.state !== newLoc.state ||
                currentLoc.addressId !== newLoc.addressId
            ) {
                if (typeof window !== "undefined") {
                    localStorage.setItem("melachow_location", JSON.stringify(newLoc));
                }
                set({ userLocation: newLoc });
            }
        }
    },
}));

