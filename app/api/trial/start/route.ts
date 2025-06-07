import { NextResponse, NextRequest } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { requireAuth } from "@/lib/requireAuth"

export async function POST(request: NextRequest) {
  // Validate JWT
  const { user, error } = await requireAuth(request)
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createServerSupabaseClient()

    // Check if user already has an active trial
    const { data: existingTrial } = await supabase
      .from("users")
      .select("trial_active, trial_start_date")
      .eq("id", user.id)
      .single()

    if (existingTrial?.trial_active) {
      return NextResponse.json(
        { error: "You already have an active trial" },
        { status: 400 }
      )
    }

    // Start the trial
    const { error: updateError } = await supabase
      .from("users")
      .update({
        trial_active: true,
        trial_start_date: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error starting trial:", updateError)
      return NextResponse.json(
        { error: "Failed to start trial" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 