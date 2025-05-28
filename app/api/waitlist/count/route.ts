import { NextResponse, NextRequest } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { requireAuth } from "@/lib/requireAuth"

export async function GET(request: NextRequest) {
  // Validate JWT
  const { user, error } = await requireAuth(request)
  if (error) {
    return NextResponse.json({ error }, { status: 401 })
  }

  try {
    const supabase = createServerSupabaseClient()

    const { count, error: supabaseError } = await supabase.from("waitlist").select("*", { count: "exact", head: true })

    if (supabaseError) {
      console.error("Supabase error:", supabaseError)
      return NextResponse.json({ error: "Failed to get waitlist count" }, { status: 500 })
    }

    return NextResponse.json({ count })
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
