"use client";
import React, { createContext, useContext } from "react";

const ApiContext = createContext({ baseUrl: ""});

export const ApiProvider = ({ children }) => {
  // const baseUrl = "http://localhost:3001/api";
  const baseUrl = "https://grub-dash-api.vercel.app/api";

  return (
    <ApiContext.Provider value={{ baseUrl }}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => useContext(ApiContext);
