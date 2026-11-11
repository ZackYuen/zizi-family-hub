import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import {
  OUTBOUND_KEY,
  normalizeOutboundStore,
  pruneOutboundStore,
  type WhatsAppOutboundStore,
} from "./whatsapp-outbound";

export async function loadOutboundStore(): Promise<WhatsAppOutboundStore> {
  if (!isSupabaseConfigured()) {
    throw new Error("Live database is not configured");
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("app_data")
    .select("data")
    .eq("key", OUTBOUND_KEY)
    .maybeSingle();
  if (error) throw error;
  return normalizeOutboundStore(data?.data);
}

export async function saveOutboundStore(
  store: WhatsAppOutboundStore
): Promise<WhatsAppOutboundStore> {
  if (!isSupabaseConfigured()) {
    throw new Error("Live database is not configured");
  }
  const updated = pruneOutboundStore(store);
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("app_data").upsert({
    key: OUTBOUND_KEY,
    data: updated,
    updated_at: updated.updatedAt,
  });
  if (error) throw error;
  return updated;
}
