"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import CategoryList from "../components/Home_Components/Category";
import FeatureSlider from "../components/Home_Components/FeatureSlider";
import FoodList from "../components/Home_Components/FoodList";
import HomeHeader from "../components/Home_Components/HomeHeader";
import PromoBanner from "../components/Home_Components/PromoBanner";
import SearchBar from "../components/Home_Components/SearchBar";
import VendorList from "../components/Home_Components/VendorList";
import { fetchUser } from "../lib/api";
import AddressModal from "../modals/AddressModal";

export default function HomePage() {
  const [token, setToken] = useState(null);
  const [isAddressOpen, setIsAddressOpen] = useState(false);

  // Load token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("userToken");
    setToken(storedToken || null);
  }, []);

  // Fetch user from backend
  const { data: userData, isLoading } = useQuery({
    queryKey: ["userProfile", token],
    queryFn: () => fetchUser(token),
    enabled: !!token,
    retry: false,
  });

  // Auto-open modal if user has no saved addresses
  useEffect(() => {
    if (!isLoading && userData && userData?.user?.addresses?.length === 0) {
      setIsAddressOpen(true);
    }
  }, [userData, isLoading]);

  // console.log(userData?.user);  

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <HomeHeader />
      <div className="md:px-4 p-2">
        <SearchBar />
        <CategoryList />
        {/* <PromoBanner /> */}
        <VendorList user={userData?.user} />
        <FoodList user={userData?.user} />
        <div className="" />
        {/* <FeatureSlider /> */}
      </div>

      {/* Address Modal */}
      <AddressModal
        token={token}
        user={userData?.user}
        isOpen={isAddressOpen}
        setIsOpen={setIsAddressOpen}
      />
    </div>
  );
}
