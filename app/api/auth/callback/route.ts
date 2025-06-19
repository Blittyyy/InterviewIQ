import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    
    if (!code) {
      return NextResponse.json({ error: "No confirmation code found" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    
    // Exchange the code for a session
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 400 })
    }

    if (session?.user) {
      // Update the user's email_verified status in our database
      const { error: updateError } = await supabase
        .from("users")
        .update({ email_verified: true })
        .eq("id", session.user.id)

      if (updateError) {
        console.error("Error updating email verification status:", updateError)
      }
    }

    // Redirect to the success page
    return NextResponse.redirect(new URL("/auth/callback?success=true", request.url))
  } catch (error) {
    console.error("Auth callback error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 