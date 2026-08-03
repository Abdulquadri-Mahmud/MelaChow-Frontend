"use client";

import Header2 from "@/app/components/App_Header/Header2";
import NotificationSettings from "@/app/components/notifications/NotificationSettings";

export default function NotificationSettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header2 />
      <main className="mx-auto max-w-2xl space-y-5 p-4 sm:p-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-base text-gray-500">Choose whether you want order updates.</p>
        </div>
        <NotificationSettings />
      </main>
    </div>
  );
}