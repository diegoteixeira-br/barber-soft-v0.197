import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useUnits } from "@/hooks/useUnits";
import { supabase } from "@/integrations/supabase/client";

interface UnitContextType {
  currentUnitId: string | null;
  setCurrentUnitId: (id: string | null) => void;
  isLoading: boolean;
}

const UnitContext = createContext<UnitContextType | null>(null);

export function UnitProvider({ children }: { children: ReactNode }) {
  const [currentUnitId, setCurrentUnitId] = useState<string | null>(null);
  const { units, isLoading, createUnit } = useUnits();

  // Auto-create default unit if none exists
  useEffect(() => {
    const initUnit = async () => {
      if (!isLoading && units.length === 0) {
        // Create a default unit for new users
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          createUnit.mutate({ name: "Barbearia Principal" });
        }
      } else if (!isLoading && units.length > 0 && !currentUnitId) {
        setCurrentUnitId(units[0].id);
      }
    };
    initUnit();
  }, [units, isLoading, currentUnitId]);

  // Update currentUnitId when units change and we have a new default unit
  useEffect(() => {
    if (units.length > 0 && !currentUnitId) {
      setCurrentUnitId(units[0].id);
    }
  }, [units]);

  return (
    <UnitContext.Provider value={{ currentUnitId, setCurrentUnitId, isLoading }}>
      {children}
    </UnitContext.Provider>
  );
}

export function useCurrentUnit() {
  const context = useContext(UnitContext);
  if (!context) {
    throw new Error("useCurrentUnit must be used within a UnitProvider");
  }
  return context;
}
