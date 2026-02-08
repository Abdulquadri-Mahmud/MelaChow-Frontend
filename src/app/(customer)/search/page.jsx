"use client";

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic';
import SearchPageSkeleton from '@/app/skeleton/SearchPageSkeleton';

const FoodSearchMobile = dynamic(
  () => import("@/app/components/searchs/Searchs"),
);

export default function page() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <FoodSearchMobile />
    </Suspense>
  )
}
