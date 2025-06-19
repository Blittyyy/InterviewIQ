import { NextResponse, NextRequest } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { requireAuth } from "@/lib/requireAuth"
import OpenAI from "openai"
import { generateAIReport } from "@/lib/ai-utils"

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
    }

    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, subscription_status, email_verified, device_fingerprint, trial_active, trial_start_date")
      .eq("id", userIdToUse)
      .single()

    if (userError) {
      console.error("Error fetching user:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if email is verified for free users
    if (userData.subscription_status === "free" && !userData.email_verified) {
      return NextResponse.json(
        { 
          error: "Please verify your email address to start generating reports. " +
                 "Check your inbox for a verification link. " +
                 "If you don't see it, try checking your spam folder or request a new verification email."
        },
        { status: 403 }
      )
    }

    // Only allow report generation for trial or paid users
    if (!userData.trial_active && userData.subscription_status !== "pro" && userData.subscription_status !== "enterprise") {
      return NextResponse.json({
        error: "You must start a free trial or upgrade to Pro to generate reports.",
        upgradeRequired: true,
      }, { status: 403 });
    }

    // Enforce 3 reports per day limit for trial users
    if (userData.trial_active) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count, error: countError } = await supabase
        .from("report_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userIdToUse)
        .gte("created_at", since);
      if (countError) {
        return NextResponse.json({ error: "Error checking trial report limit" }, { status: 500 });
      }
      if ((count ?? 0) >= 3) {
        return NextResponse.json({
          error: "You've used all 3 reports for today during your trial. Upgrade to Pro for unlimited reports! Your reports will reset at midnight.",
          upgradeRequired: true,
        }, { status: 403 });
      }
    }

    // Check if a report for this company already exists
    const { data: existingReport, error: existingReportError } = await supabase
      .from("reports")
      .select("*")
      .eq("company_name", companyName.toLowerCase())
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (existingReportError && existingReportError.code !== "PGRST116") { // PGRST116 is "no rows returned"
      console.error("Error checking for existing report:", existingReportError)
    }

    // Check if existing report is fresh enough (less than 7 days old)
    const isReportFresh = existingReport && (() => {
      const reportDate = new Date(existingReport.created_at)
      const now = new Date()
      const daysOld = (now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24)
      return daysOld < 7 // Consider reports older than 7 days as stale
    })()

    // If we found a fresh existing report, create a new report entry but reuse the data
    if (existingReport && isReportFresh) {
      const { data: reportData, error: reportError } = await supabase
        .from("reports")
        .insert([
          {
            user_id: userIdToUse,
            company_name: companyName,
            company_website: companyWebsite || null,
            job_description: jobDescription || null,
            status: "completed",
            data: existingReport.data,
            summary: existingReport.summary,
            created_at: new Date().toISOString(),
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

      // Update user's report count and last report timestamp
      await supabase
        .from("users")
        .update({
          reports_generated: supabase.rpc("increment", { x: 1 }),
          last_report_at: new Date().toISOString(),
        })
        .eq("id", userIdToUse)

      return NextResponse.json({
        success: true,
        reportId: reportData.id,
        userId: userIdToUse,
      });
    }

    // If no existing report found or report is stale, proceed with creating a new one
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

    // Update user's report count and last report timestamp
    await supabase
      .from("users")
      .update({
        reports_generated: supabase.rpc("increment", { x: 1 }),
        last_report_at: new Date().toISOString(),
      })
      .eq("id", userIdToUse)

    // === OpenAI Integration ===
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const prompt = `Generate a detailed company research report for the following:
Company Name: ${companyName}
${companyWebsite ? `Company Website: ${companyWebsite}\n` : ""}${jobDescription ? `Job Description: ${jobDescription}\n` : ""}

The report should include:
- Company basics (founded, HQ, CEO, size, mission)
- Products & services
- Recent news & press (3-5 headlines with title, link, source, date)
- Culture & values
- Competitors & market overview
- 3-5 strategic interview talking points
- A short summary (tldr) and a 'Why this company?' answer for interview motivation
Format the response as a JSON object with keys: basics, products, news, culture, competitors, talkingPoints, summary.`;

    try {
      const result = await generateAIReport(openai, user, prompt, reportData.id);
      
      await supabase
        .from("reports")
        .update({
          status: "completed",
          data: result.data,
          summary: result.summary,
        })
        .eq("id", reportData.id);

      console.log(`Report generated successfully using ${result.model} for user ${userIdToUse}`);

      return NextResponse.json({
        success: true,
        reportId: reportData.id,
        userId: userIdToUse,
      });
    } catch (error) {
      console.error("AI report generation failed:", error);
      
      await supabase
        .from("reports")
        .update({ status: "failed" })
        .eq("id", reportData.id);
        
      return NextResponse.json({ 
        error: "Failed to generate report. Please try again later." 
      }, { status: 500 });
    }
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
