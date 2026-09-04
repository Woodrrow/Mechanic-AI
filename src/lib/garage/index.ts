import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { LocalGarageStore } from "./local-store";
import { SupabaseGarageStore } from "./supabase-store";
import type { GarageStore, GarageStoreKind } from "./types";

export type { GarageStore, GarageStoreKind } from "./types";

let store: GarageStore | null = null;

/** Which store this build will use. Decided by NEXT_PUBLIC_SUPABASE_* at build time. */
export function garageStoreKind(): GarageStoreKind {
  return isSupabaseConfigured() ? "supabase" : "local";
}

/**
 * Browser-only. Nothing here touches window at construction time, so it is
 * safe to call while a client component is being server-rendered.
 */
export function getGarageStore(): GarageStore {
  if (store) return store;
  const client = getSupabaseBrowserClient();
  store = client ? new SupabaseGarageStore(client) : new LocalGarageStore();
  return store;
}
