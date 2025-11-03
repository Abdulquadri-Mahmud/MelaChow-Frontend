"use client";
import React, { createContext, useContext } from "react";

const ApiContext = createContext({ baseUrl: ""});

export const ApiProvider = ({ children }) => {
  const baseUrl = "https://grub-dash-api.vercel.app/api";

  return (
    <ApiContext.Provider value={{ baseUrl }}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => useContext(ApiContext);
