import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { requireAuth } from "@/lib/requireAuth"
import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  // Validate JWT
  const { user, error } = await requireAuth(request)
  if (error) {
    return NextResponse.json({ error }, { status: 401 })
  }

  try {
    const { email } = await request.json()

    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    const { error: supabaseError } = await supabase.from("waitlist").insert([{ email, status: "pending" }])

    if (supabaseError) {
      if (supabaseError.code === "23505") {
        // Unique violation error code
        return NextResponse.json({ error: "This email is already on our waitlist!" }, { status: 409 })
      }

      console.error("Supabase error:", supabaseError)
      return NextResponse.json({ error: "Failed to add to waitlist" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
