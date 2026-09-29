"use client";
export function usePushNotifications() {
  return {
    isSupported: false, permission: "default", subscription: null,
    loading: false, error: null, subscribe: async () => false,
    unsubscribe: async () => false,
  };
}
