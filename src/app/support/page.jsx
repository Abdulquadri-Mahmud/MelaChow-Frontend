"use client";

import { BiQuestionMark } from "react-icons/bi";
import Header2 from "../components/App_Header/Header2";
import Link from "next/link";
import { BadgeQuestionMark, ChevronRight, HeartHandshake } from "lucide-react";

export default function Support() {
  return (
    <div className="">
      <Header2/>
      <div className="p-4">
        <Link href='/get-help' className='py-4 rounded-lg bg-orange-100 mb-4 text-start px-4 hover:bg-orange-300 transition flex items-center justify-between gap-2 border-b border-gray-100 font-medium text-gray-700'>
          <div className="flex items-center gap-1">
            <HeartHandshake className='w-6 h-6 text-orange-500'/>
            Get Help
          </div>
          <ChevronRight className='w-6 h-6 text-orange-500' />
        </Link>
        <Link href='/faqs' className='py-4 rounded-lg bg-orange-100  text-start px-4 hover:bg-orange-300 transition flex items-center justify-between gap-2 border-b border-gray-100 font-medium text-gray-700'>
          <div className="flex items-center gap-1">
            <BadgeQuestionMark className='w-6 h-6 text-orange-500'/>
            FAQs
          </div>
          <ChevronRight className='w-6 h-6 text-orange-500' />
        </Link>
      </div>
    </div>
  )
}
