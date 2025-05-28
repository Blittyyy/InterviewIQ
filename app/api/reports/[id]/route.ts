import { NextResponse, NextRequest } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { requireAuth } from "@/lib/requireAuth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // Validate JWT
  const { user, error } = await requireAuth(request)
  if (error) {
    return NextResponse.json({ error }, { status: 401 })
  }

  try {
    const reportId = params.id

    if (!reportId) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

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
