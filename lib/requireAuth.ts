import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function requireAuth(requestOrClient: NextRequest | SupabaseClient) {
  if (requestOrClient instanceof Request || requestOrClient instanceof NextRequest) {
    // Handle NextRequest case
    const authHeader = requestOrClient.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { user: null, error: "Missing or invalid Authorization header" };
    }

    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error } = await supabase.auth.getUser(jwt);

    if (error || !user) {
      return { user: null, error: "Invalid or expired token" };
    }

    return { user, error: null };
  } else {
    // Handle SupabaseClient case
    const { data: { session }, error: sessionError } = await requestOrClient.auth.getSession();
    if (sessionError || !session?.user) {
      return { user: null, error: "No active session" };
    }
    return { user: session.user, error: null };
  }
} 