"use client";

import { useUserStorage } from "../hooks/useUserStorage";

/**
 * AutoLogout Component
 * Automatically logs out user when JWT token expires.
 * Session expiry is now handled by API 401 responses, effectively managed solely by the backend/cookies.
 */
const AutoLogout = () => {
  // Logic removed as HttpOnly cookies are used.
  return null;
};

export default AutoLogout;
