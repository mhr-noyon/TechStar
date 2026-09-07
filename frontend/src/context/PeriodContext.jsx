import React, { createContext, useContext, useState } from "react";

const PeriodContext = createContext(null);

export function PeriodProvider({ children }) {
  const [period, setPeriod] = useState("THIS_MONTH");

  return (
    <PeriodContext.Provider value={{ period, setPeriod }}>
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod() {
  const context = useContext(PeriodContext);
  if (!context) {
    throw new Error("usePeriod must be used within a PeriodProvider");
  }
  return context;
}
