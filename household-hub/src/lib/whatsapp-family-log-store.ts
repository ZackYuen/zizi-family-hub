import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import {
  FAMILY_LOG_KEY,
  normalizeFamilyLogStore,
  pruneFamilyLogStore,
  type FamilyLogStore,
} from "./whatsapp-family-log";

export async function loadFamilyLogStore(): Promise<FamilyLogStore> {
  if (!isSupabaseConfigured()) {
    throw new Error("Live database is not configured");
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("app_data")
    .select("data")
    .eq("key", FAMILY_LOG_KEY)
    .maybeSingle();
  if (error) throw error;
  return normalizeFamilyLogStore(data?.data);
}

export async function saveFamilyLogStore(
  store: FamilyLogStore
): Promise<FamilyLogStore> {
  if (!isSupabaseConfigured()) {
    throw new Error("Live database is not configured");
  }
  const updated = pruneFamilyLogStore(store);
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("app_data").upsert({
    key: FAMILY_LOG_KEY,
    data: updated,
    updated_at: updated.updatedAt,
  });
  if (error) throw error;
  return updated;
}
