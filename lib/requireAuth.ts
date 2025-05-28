import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null, error: "Missing or invalid Authorization header" };
  }

  const jwt = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(jwt);

  if (error || !user) {
    return { user: null, error: "Invalid or expired token" };
  }

  return { user, error: null };
} 