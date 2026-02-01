"use client";

import { useState, useEffect } from "react";
import CategoryList from "../components/Home_Components/Category";
import FeatureSlider from "../components/Home_Components/FeatureSlider";
import FoodList from "../components/Home_Components/FoodList";
import HomeHeader from "../components/Home_Components/HomeHeader";
import PromoBanner from "../components/Home_Components/PromoBanner";
import SearchBar from "../components/Home_Components/SearchBar";
import SmartRecommendations from "../components/Home_Components/SmartRecommendations";
import TrendingFoods from "../components/Home_Components/TrendingFoods";
import VendorList from "../components/Home_Components/VendorList";
import { useUserStorage } from "../hooks/useUserStorage";
import AddressModal from "../modals/AddressModal";

export default function HomePage() {
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const { user, isLoading } = useUserStorage();

  // Auto-open modal if user has no saved addresses
  useEffect(() => {
    if (!isLoading && user && user?.addresses?.length === 0) {
      setIsAddressOpen(true);
    }
  }, [user, isLoading]);

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <HomeHeader />
      <div className="md:px-4 p-2">
        <div className="space-y-4">
          <SearchBar />
          <CategoryList />
          <VendorList user={user} />
          <SmartRecommendations />
          <TrendingFoods user={user} />
          <FoodList user={user} />
        </div>
        {/* <PromoBanner /> */}
        
        <div className="" />
        {/* <FeatureSlider /> */}
      </div>

      {/* Address Modal */}
      <AddressModal
        user={user}
        isOpen={isAddressOpen}
        setIsOpen={setIsAddressOpen}
      />
    </div>
  );
}
