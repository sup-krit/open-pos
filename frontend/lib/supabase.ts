// Single shared browser Supabase client. Auth is 100% client-side against
// Supabase; the FastAPI backend only verifies the resulting JWT (see lib/api.ts).
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
