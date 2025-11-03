"use client";

import CategoryList from "../components/Home_Components/Category";
import FeatureSlider from "../components/Home_Components/FeatureSlider";
import FoodList from "../components/Home_Components/FoodList";
import HomeHeader from "../components/Home_Components/HomeHeader";
import PromoBanner from "../components/Home_Components/PromoBanner";
import SearchBar from "../components/Home_Components/SearchBar";
import VendorList from "../components/Home_Components/VendorList";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <HomeHeader />
      <div className="md:px-4 p-2">
        <SearchBar />
        <CategoryList />
        <PromoBanner />
        <VendorList />
        {/* <RecommendedList /> */}
        <FoodList />
        <FeatureSlider />
      </div>
    </div>
  );
}
