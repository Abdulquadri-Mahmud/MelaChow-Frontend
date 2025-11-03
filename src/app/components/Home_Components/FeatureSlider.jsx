"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiTruck, FiCreditCard, FiStar, FiLayers, FiHome } from "react-icons/fi";

const features = [
  {
    id: 1,
    icon: <FiHome className="text-3xl text-orange-500" />,
    title: "Authentic Local Dishes",
    desc: "Enjoy the taste of home with freshly prepared meals from trusted restaurants near you.",
  },
  {
    id: 2,
    icon: <FiTruck className="text-3xl text-orange-500" />,
    title: "Fast Delivery",
    desc: "Hot meals, delivered right on time, wherever you are.",
  },
  {
    id: 3,
    icon: <FiCreditCard className="text-3xl text-orange-500" />,
    title: "Flexible Payment Options",
    desc: "Pay your way — including cash on delivery.",
  },
  {
    id: 4,
    icon: <FiStar className="text-3xl text-orange-500" />,
    title: "Top-Rated Restaurants",
    desc: "Dine with confidence from our carefully verified local favorites.",
  },
  {
    id: 5,
    icon: <FiLayers className="text-3xl text-orange-500" />,
    title: "Custom Meal Combos",
    desc: "Select your favorite dishes, sides, and proteins — your meal, your way.",
  },
];

export default function FeatureSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full flex justify-center py-5 bg-zinc-300 rounded-xl">
      <div className="w-[90%] md:w-[60%] relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={features[index].id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="bg-white shadow-lg rounded-2xl p-6 flex flex-col items-center justify-center text-center"
          >
            <div className="bg-zinc-100 p-3 rounded-full">
              {features[index].icon}
            </div>
            <h3 className="text-lg font-bold mt-3 text-orange-500">
              {features[index].title}
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              {features[index].desc}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
