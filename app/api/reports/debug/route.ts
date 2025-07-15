import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { getSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    // Use the same client as the dashboard
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the session (same as dashboard)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: "No session found" }, { status: 401 })
    }

    const user = session.user
    console.log("Debug: User authenticated:", user.id)

    // Get all reports for this user using the same client as dashboard
    const { data: reports, error: reportsError } = await supabase
      .from("reports")
      .select("id, company_name, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (reportsError) {
      return NextResponse.json({ error: "Failed to fetch reports", details: reportsError }, { status: 500 })
    }

    // Also try with the client-side client for comparison
    const clientSupabase = getSupabaseClient()
    const { data: clientReports, error: clientReportsError } = await clientSupabase
      .from("reports")
      .select("id, company_name, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    return NextResponse.json({ 
      user: { id: user.id, email: user.email },
      reports: reports || [],
      totalReports: reports?.length || 0,
      clientReports: clientReports || [],
      clientTotal: clientReports?.length || 0,
      clientError: clientReportsError
    })
  } catch (err) {
    console.error("Debug error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 