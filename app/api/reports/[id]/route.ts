import { NextResponse, NextRequest } from "next/server"
import { createPublicSupabaseClient } from "@/lib/supabase"
import { requireAuth } from "@/lib/requireAuth"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Validate JWT
  const { user, error } = await requireAuth(request)
  if (error) {
    return NextResponse.json({ error }, { status: 401 })
  }

  try {
    const { id: reportId } = await params

    if (!reportId) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 })
    }

    const supabase = createPublicSupabaseClient()

    const { data, error: supabaseError } = await supabase.from("reports").select("*").eq("id", reportId).single()

    if (supabaseError) {
      console.error("Error fetching report:", supabaseError)
      return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    return NextResponse.json({ report: data })
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: reportId } = await params
    console.log("DELETE request started for report:", reportId)
    
    // Use the same client as the working debug endpoint
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the session (same as dashboard)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error("No session found")
      return NextResponse.json({ error: "No session found" }, { status: 401 })
    }

    const user = session.user
    console.log("User authenticated:", user.id)

    if (!reportId) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 })
    }

    // First, let's check what reports exist for this user
    console.log("Checking user's reports...")
    const { data: userReports, error: userReportsError } = await supabase
      .from("reports")
      .select("id, company_name")
      .eq("user_id", user.id)
    
    if (userReportsError) {
      console.error("Error fetching user reports:", userReportsError)
    } else {
      console.log("User has reports:", userReports?.map(r => ({ id: r.id, company: r.company_name })))
    }
    
    console.log("Fetching report ownership...")
    // Only allow deleting if the user owns the report
    const { data: report, error: fetchError } = await supabase
      .from("reports")
      .select("user_id")
      .eq("id", reportId)
      .single()
      
    if (fetchError) {
      console.error("Fetch error:", fetchError)
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: "Report not found" }, { status: 404 })
      }
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }
    
    if (!report) {
      console.log("Report not found in database")
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }
    
    console.log("Report user_id:", report.user_id, "Current user:", user.id)
    
    if (report.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    
    // Delete related ai_request_logs first (for existing data and safety)
    console.log("Deleting related ai_request_logs...");
    const { error: logsDeleteError } = await supabase
      .from("ai_request_logs")
      .delete()
      .eq("report_id", reportId);
    if (logsDeleteError) {
      console.error("Error deleting ai_request_logs:", logsDeleteError);
      return NextResponse.json({ error: "Failed to delete related logs" }, { status: 500 });
    }

    console.log("Deleting report...")
    const { data: deleted, error: deleteError, count } = await supabase
      .from("reports")
      .delete()
      .eq("id", reportId)
      .select();

    console.log("Delete result:", { deleted, error: deleteError, count });
    
    if (deleteError) {
      console.error("Delete error:", deleteError)
      return NextResponse.json({ error: "Failed to delete report" }, { status: 500 })
    }
    
    console.log("Report deleted successfully")
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Server error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
