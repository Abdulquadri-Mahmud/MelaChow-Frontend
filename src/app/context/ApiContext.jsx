"use client";
import React, { createContext, useContext } from "react";

const ApiContext = createContext({ baseUrl: "" });

export const ApiProvider = ({ children }) => {
  // Use relative path to leverage Next.js rewrites (Proxy)
  // This ensures cookies are treated as First-Party (fixes iOS Safari issues)
  const baseUrl = "/api";

  return (
    <ApiContext.Provider value={{ baseUrl }}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => useContext(ApiContext);
