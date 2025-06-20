import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import OpenAI from "openai"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { requireAuth } from "@/lib/requireAuth"

// Create Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Create rate limiter
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1 d"), // 5 requests per day
})

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { user } = await requireAuth(supabase)

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const { companyName, companyWebsite, jobDescription } = await request.json()

    // Validate required fields
    if (!companyName) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 })
    }

    // Check if user exists and get their subscription status
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("subscription_status, trial_active, trial_start_date, reports_generated")
      .eq("id", user.id)
      .single()

    if (userError) {
      console.error("Error fetching user:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check rate limit for free users
    if (userData.subscription_status !== "active" && !userData.trial_active) {
      const { success, reset } = await ratelimit.limit(user.id)
      if (!success) {
        const now = Date.now()
        const retryAfter = Math.floor((reset - now) / 1000)
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            retryAfter,
            upgradeRequired: true,
          },
          { status: 429 }
        )
      }
    }

    // Check if a report for this company already exists for this user
    const { data: existingReport } = await supabase
      .from("reports")
      .select("id")
      .eq("user_id", user.id)
      .eq("company_name", companyName)
      .single()

    if (existingReport) {
      return NextResponse.json({ reportId: existingReport.id })
    }

    // Generate report using OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    const prompt = `Generate a detailed report for ${companyName}.
    Include:
    1. Company Overview
    2. Culture & Values
    3. Interview Process
    4. Key Talking Points
    ${jobDescription ? "\nJob Description: " + jobDescription : ""}
    ${companyWebsite ? "\nWebsite: " + companyWebsite : ""}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an expert career coach helping job seekers prepare for interviews. Generate detailed, well-structured reports about companies.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const report = completion.choices[0].message?.content

    if (!report) {
      throw new Error("Failed to generate report")
    }

    // Save report to database
    const { data: reportData, error: reportError } = await supabase
      .from("reports")
      .insert([
        {
          user_id: user.id,
          company_name: companyName,
          company_website: companyWebsite || null,
          job_description: jobDescription || null,
          status: "completed",
          data: { content: report },
        },
      ])
      .select()
      .single()

    if (reportError) {
      console.error("Error saving report:", reportError)
      throw new Error("Failed to save report")
    }

    // Update user's report count
    await supabase
      .from("users")
      .update({ reports_generated: (userData.reports_generated || 0) + 1 })
      .eq("id", user.id)

    // Log AI request
    await supabase.from("ai_request_logs").insert([
      {
        user_id: user.id,
        report_id: reportData.id,
        model: "gpt-4",
        input_tokens: completion.usage?.prompt_tokens || 0,
        output_tokens: completion.usage?.completion_tokens || 0,
        cost: 0.01, // Approximate cost for GPT-4
        response_time_ms: 0, // You could calculate this
        success: true,
      },
    ])

    return NextResponse.json({ reportId: reportData.id })
  } catch (err) {
    console.error("Error generating report:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate report" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

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
