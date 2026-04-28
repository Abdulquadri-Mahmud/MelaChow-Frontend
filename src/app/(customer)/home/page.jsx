"use client";

import { useState, useEffect } from "react";
import CategoryList from "@/app/components/Home_Components/Category";
import FeatureSlider from "@/app/components/Home_Components/FeatureSlider";
import FoodList from "@/app/components/Home_Components/FoodList";
import HomeHeader from "@/app/components/Home_Components/HomeHeader";
import PromoBanner from "@/app/components/Home_Components/PromoBanner";
import SearchBar from "@/app/components/Home_Components/SearchBar";
import SmartRecommendations from "@/app/components/Home_Components/SmartRecommendations";
import TrendingFoods from "@/app/components/Home_Components/TrendingFoods";
import VendorList from "@/app/components/Home_Components/VendorList";
import PromoAnnouncementBanner from "@/app/components/Home_Components/PromoAnnouncementBanner";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import AddressModal from "@/app/modals/AddressModal";
import NotificationPromptBanner from "@/app/components/notifications/NotificationPromptBanner";

export default function HomePage() {
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const { user, isLoading } = useUserStorage();

  // Autoen modal if user has no saved addresses
  useEffect(() => {
    if (!isLoading && user && user?.addresses?.length === 0) {
      setIsAddressOpen(true);
    }
  }, [user, isLoading]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-14 transition-colors duration-300">
      <HomeHeader />
      <div className="md:px-4 p-2 space-y-4">
        <SearchBar />
        <CategoryList />
        <PromoAnnouncementBanner />
        <VendorList user={user} />
        {/* <TrendingFoods user={user} /> */}
        <div className="space-y-4">
          {/* <SmartRecommendations /> */}
          {/* <FoodList user={user} /> */}
        </div>
      </div>

      {/* Address Modal */}
      <AddressModal
        user={user}
        isOpen={isAddressOpen}
        setIsOpen={setIsAddressOpen}
      />

      <NotificationPromptBanner />
    </div>
  );
}
