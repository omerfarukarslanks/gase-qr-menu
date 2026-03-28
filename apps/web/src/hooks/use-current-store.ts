import { useMemo } from "react";
import { useAuthStore } from "@/lib/store";

export function useCurrentStore() {
  const stores = useAuthStore((state) => state.stores);
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const setActiveStoreId = useAuthStore((state) => state.setActiveStoreId);

  const activeStore = useMemo(
    () => stores.find((store) => store.id === activeStoreId) ?? null,
    [activeStoreId, stores]
  );

  return {
    stores,
    activeStore,
    activeStoreId,
    setActiveStoreId,
  };
}
