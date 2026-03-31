import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { env } from "./env";

// Browser (anon) client — safe for client components
export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Server client factory — uses service role key for admin operations
// Only import and call this from API routes / server components, never from client code
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Server-side client that reads cookies (for middleware / server components)
export function createServerSupabaseClient(cookieStore: {
  get: (name: string) => { value: string } | undefined;
  set: (name: string, value: string, options?: object) => void;
  delete: (name: string, options?: object) => void;
}) {
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set(name, value, options);
        },
        remove(name, options) {
          cookieStore.delete(name, options);
        },
      },
    }
  );
}
