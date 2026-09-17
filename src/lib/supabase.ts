import { createAdminClient } from "@supabase/server/core";
import { SUPABASE_SECRET_KEY, SUPABASE_URL } from "astro:env/server";

export const createSupabaseAdminClient = () =>
  createAdminClient({
    env: {
      url: SUPABASE_URL,
      secretKeys: { default: SUPABASE_SECRET_KEY },
    },
  });
