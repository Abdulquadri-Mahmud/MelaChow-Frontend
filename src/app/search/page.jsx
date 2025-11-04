"use client";

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic';
import SearchPageSkeleton from '../skeleton/SearchPageSkeleton';

const FoodSearchMobile = dynamic(
  () => import("../components/searchs/Searchs"),
);

export default function page() {
  return (
    <Suspense fallback={<SearchPageSkeleton/>}>
      <FoodSearchMobile />
    </Suspense>
  )
}
