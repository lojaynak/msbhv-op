import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export type CustomerRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  tags: string[];
  created_at: string;
};

const PAGE_SIZE = 50;

export async function getRecentCustomers(): Promise<{ customers: CustomerRow[]; connected: boolean }> {
  if (!isSupabaseConfigured()) {
    return { customers: [], connected: false };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("customers")
      .select("id, full_name, phone, email, tags, created_at")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (error || !data) {
      return { customers: [], connected: true };
    }

    return { connected: true, customers: data };
  } catch {
    return { customers: [], connected: false };
  }
}
