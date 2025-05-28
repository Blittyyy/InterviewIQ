import { NextResponse, NextRequest } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { requireAuth } from "@/lib/requireAuth"

export async function POST(request: NextRequest) {
  // Validate JWT
  const { user, error } = await requireAuth(request)
  if (error) {
    return NextResponse.json({ error }, { status: 401 })
  }

  try {
    const { companyName, companyWebsite, jobDescription, userId } = await request.json()

    if (!companyName) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Check if the user exists, if not create a new user
    let userIdToUse = userId

    if (!userIdToUse) {
      // Create an anonymous user for now
      const { data: userData, error: userError } = await supabase
        .from("users")
        .insert([{ email: `anonymous-${Date.now()}@interviewiq.app`, plan: "free" }])
        .select("id")
        .single()

      if (userError) {
        console.error("Error creating user:", userError)
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
      }

      userIdToUse = userData.id
    } else {
      // Check if user exists
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, subscription_status")
        .eq("id", userIdToUse)
        .single()

      if (userError) {
        console.error("Error fetching user:", userError)
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      // Check if user has reached their daily limit for free plan
      if (userData.subscription_status === "free") {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { count, error: countError } = await supabase
          .from("report_logs")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userIdToUse)
          .gte("created_at", since)

        if (countError) {
          return NextResponse.json({ error: "Error checking report limit" }, { status: 500 })
        }

        if ((count ?? 0) >= 3) {
          return NextResponse.json(
            {
              error: "You have reached your daily free report limit. Upgrade for unlimited access.",
              upgradeRequired: true,
            },
            { status: 403 },
          )
        }
      }
    }

    // Create a new report
    const { data: reportData, error: reportError } = await supabase
      .from("reports")
      .insert([
        {
          user_id: userIdToUse,
          company_name: companyName,
          company_website: companyWebsite || null,
          job_description: jobDescription || null,
          status: "processing",
        },
      ])
      .select("id")
      .single()

    if (reportError) {
      console.error("Error creating report:", reportError)
      return NextResponse.json({ error: "Failed to create report" }, { status: 500 })
    }

    // Log this report generation in report_logs
    await supabase
      .from("report_logs")
      .insert([
        {
          user_id: userIdToUse,
          report_id: reportData.id,
          created_at: new Date().toISOString(),
        },
      ])

    // Update user's report count
    await supabase
      .from("users")
      .update({
        reports_generated: supabase.rpc("increment", { x: 1 }),
      })
      .eq("id", userIdToUse)

    // In a real application, you would trigger a background job here to generate the report
    // For now, we'll simulate the report generation with a placeholder

    // Simulate report generation (this would be a background job in production)
    setTimeout(async () => {
      const simulatedReportData = {
        basics: {
          founded: "2015",
          headquarters: "San Francisco, CA",
          ceo: "John Smith",
          size: "500-1000 employees",
          mission: "To revolutionize the industry with innovative solutions",
        },
        products: ["Enterprise SaaS platform", "Mobile application for team collaboration", "API integration services"],
        news: [
          {
            title: "Company raises $50M in Series C funding",
            source: "TechCrunch",
            date: "2023-05-15",
            url: "https://example.com/news1",
          },
          {
            title: "New product launch announced for Q3",
            source: "Company Blog",
            date: "2023-06-02",
            url: "https://example.com/news2",
          },
        ],
        culture:
          "The company values innovation, collaboration, and work-life balance. They offer flexible working arrangements and focus on employee development.",
        competitors: [
          {
            name: "CompetitorX",
            description: "Market leader in the enterprise space",
          },
          {
            name: "CompetitorY",
            description: "Focuses on SMB market segment",
          },
          {
            name: "CompetitorZ",
            description: "New entrant with innovative technology",
          },
        ],
        talkingPoints: [
          "How is the company planning to use the recent Series C funding?",
          "What challenges do you face in the current competitive landscape?",
          "How does the company approach innovation and product development?",
        ],
      }

      const summary = {
        tldr: "A growing tech company with strong funding, focused on enterprise SaaS solutions with a collaborative culture.",
        whyThisCompany:
          "The company offers innovative solutions in a growing market, with a strong focus on employee development and work-life balance.",
      }

      await supabase
        .from("reports")
        .update({
          status: "completed",
          data: simulatedReportData,
          summary: summary,
        })
        .eq("id", reportData.id)
    }, 5000) // Simulate 5 second processing time

    return NextResponse.json({
      success: true,
      reportId: reportData.id,
      userId: userIdToUse,
    })
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching reports:", error)
      return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
    }

    return NextResponse.json({ reports: data })
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
