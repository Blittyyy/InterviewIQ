import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import OpenAI from "openai"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { requireAuth } from "@/lib/requireAuth"
import { jsonrepair } from 'jsonrepair'
import { getModelForUser } from '@/lib/ai-utils'

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

// Sample scraped data and report for dev mode
const sampleScrapedData = `
<html>
<head><title>Sample Company - About Us</title></head>
<body>
  <h1>Sample Company</h1>
  <section id="about">
    <h2>About</h2>
    <p>Sample Company is a leading provider of cloud-based solutions for small businesses, founded in 2012 and headquartered in Austin, TX. Our mission is to empower entrepreneurs with easy-to-use tools for growth.</p>
  </section>
  <section id="leadership">
    <h2>Leadership</h2>
    <p>CEO: Jane Doe</p>
  </section>
  <section id="products">
    <h2>Products & Services</h2>
    <ul>
      <li>Business Dashboard</li>
      <li>Automated Invoicing</li>
      <li>Customer CRM</li>
    </ul>
  </section>
  <section id="news">
    <h2>Recent News</h2>
    <ul>
      <li><a href="https://news.com/article1">Sample Company launches new CRM</a> - News.com, 2024-01-15</li>
      <li><a href="https://news.com/article2">CEO Jane Doe wins award</a> - TechPress, 2024-02-10</li>
    </ul>
  </section>
  <section id="careers">
    <h2>Careers</h2>
    <p>We value innovation, teamwork, and work-life balance. Perks include remote work, health insurance, and annual retreats.</p>
    <blockquote>"I love working here!" - Employee</blockquote>
  </section>
</body>
</html>
`;

const sampleReportJSON = {
  summary: "Founded in 2012, Sample Company is a leading provider of cloud-based solutions for small businesses, headquartered in Austin, TX. The company empowers entrepreneurs with easy-to-use tools for growth and innovation.",
  companyOverview: "Sample Company offers a suite of cloud-based tools designed to help small businesses manage their operations, from invoicing to customer relationships. With a focus on simplicity and scalability, Sample Company serves thousands of entrepreneurs across the US, providing them with the technology they need to succeed in a competitive market.",
  companyBasics: {
    companyName: "Sample Company",
    foundingYear: "2012",
    headquarters: "Austin, TX",
    ceoName: "Jane Doe",
    companySize: "50-200 employees",
    missionStatement: "Empower entrepreneurs with easy-to-use tools for growth."
  },
  productsServices: [
    "Business Dashboard",
    "Automated Invoicing",
    "Customer CRM"
  ],
  recentNews: [
    {
      title: "Sample Company launches new CRM",
      url: "https://news.com/article1",
      source: "News.com",
      publishDate: "2024-01-15"
    },
    {
      title: "CEO Jane Doe wins award",
      url: "https://news.com/article2",
      source: "TechPress",
      publishDate: "2024-02-10"
    }
  ],
  cultureValues: {
    workplaceDescriptors: ["innovative", "teamwork", "work-life balance"],
    coreValues: ["Innovation", "Customer Focus", "Integrity"],
    perks: ["Remote work", "Health insurance", "Annual retreats"],
    employeeQuotes: ["I love working here! - Employee"]
  },
  talkingPoints: [
    "How does Sample Company support small business growth through its platform?",
    "What are the biggest challenges facing your product team this year?"
  ]
};

export async function POST(request: Request) {
  console.log("API /api/reports called");
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { user } = await requireAuth(supabase)

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const { companyName, companyWebsite, jobDescription, scrapedData, force } = await request.json()
    console.log("Request body:", { companyName, companyWebsite, jobDescription, scrapedData, force });

    // Validate required fields
    if (!companyName) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 })
    }

    // If force is true, enforce backend cooldown
    if (force) {
      // Check last_regenerated_at
      const { data: lastReport } = await supabase
        .from("reports")
        .select("last_regenerated_at, id, created_at")
        .eq("user_id", user.id)
        .eq("company_name", companyName)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (lastReport && lastReport.last_regenerated_at) {
        const lastTime = new Date(lastReport.last_regenerated_at).getTime();
        const now = Date.now();
        const timeDiff = now - lastTime;
        console.log(`Cooldown check: Last regenerated at ${new Date(lastTime).toISOString()}, now ${new Date(now).toISOString()}, diff ${timeDiff}ms`);
        
        // Only enforce cooldown if the last_regenerated_at is recent (within the last 2 minutes)
        // This prevents stale timestamps from blocking regeneration
        if (timeDiff < 60 * 1000 && timeDiff > 0) {
          const remainingSeconds = Math.ceil((60 * 1000 - timeDiff) / 1000);
          return NextResponse.json({ 
            error: `You can only regenerate this report once per minute. Please wait ${remainingSeconds} more seconds before trying again.` 
          }, { status: 429 });
        }
      }
      
      // Delete old report
      console.log(`Deleting old report for ${companyName}`);
      await supabase
        .from("reports")
        .delete()
        .eq("user_id", user.id)
        .eq("company_name", companyName);
    } else {
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
    }

    // If not in mock mode, fetch scraped data if not provided
    let finalScrapedData = scrapedData;
    if (process.env.USE_MOCK_AI !== 'true' && !finalScrapedData && companyWebsite) {
      try {
        console.log('About to call scraper for:', companyWebsite);
        const scrapeRes = await fetch(`http://localhost:3005/scrape?url=${encodeURIComponent(companyWebsite)}`);
        console.log('Scraper fetch completed with status:', scrapeRes.status);
        if (!scrapeRes.ok) {
          const errorText = await scrapeRes.text();
          console.error('Failed to scrape company website:', companyWebsite, 'Status:', scrapeRes.status, 'Response:', errorText);
          return NextResponse.json({ error: 'Failed to scrape company website.' }, { status: 500 });
        }
        const scrapeJson = await scrapeRes.json();
        console.log('Scraping service returned:', JSON.stringify(scrapeJson, null, 2));
        finalScrapedData = scrapeJson.data;
      } catch (err) {
        console.error('Error calling scraping service:', err);
        return NextResponse.json({ error: 'Error calling scraping service.' }, { status: 500 });
      }
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

    // Check and update trial status if expired
    if (userData.trial_active && userData.trial_start_date) {
      const trialStart = new Date(userData.trial_start_date);
      const now = new Date();
      const daysSinceStart = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceStart >= 7) { // 7-day trial
        await supabase
          .from("users")
          .update({ trial_active: false })
          .eq("id", user.id);
        userData.trial_active = false; // Update in-memory object too
      }
    }

    // Check rate limit for free users
    if (userData.subscription_status !== "pro" && !userData.trial_active) {
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

    if (process.env.USE_MOCK_AI === 'true') {
      // Use mock data for dev/testing
      const report = JSON.stringify(sampleReportJSON);
      const fallbackMode = false;
      const { data: reportData, error: reportError } = await supabase
        .from("reports")
        .insert([
          {
            user_id: user.id,
            company_name: companyName,
            company_website: companyWebsite || null,
            job_description: jobDescription || null,
            status: "completed",
            data: { content: report, fallbackMode },
          },
        ])
        .select()
        .single();
      // ... rest of the code (update user, log, return response) ...
      await supabase
        .from("users")
        .update({ reports_generated: (userData.reports_generated || 0) + 1 })
        .eq("id", user.id)
      await supabase.from("ai_request_logs").insert([
        {
          user_id: user.id,
          report_id: reportData.id,
          model: "mock",
          input_tokens: 0,
          output_tokens: 0,
          cost: 0,
          response_time_ms: 0,
          success: true,
        },
      ])
      return NextResponse.json({ reportId: reportData.id })
    }

    // Generate report using OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Model selection logic
    const model = getModelForUser(userData)

    // Define the function schema for OpenAI function calling
    const functions = [
      {
        name: "generate_company_report",
        description: "Extract structured company intelligence from scraped HTML/text.",
        parameters: {
          type: "object",
          properties: {
            summary: { type: "string", description: "2-3 sentence overview of the company." },
            companyOverview: { type: "string", description: "1-2 paragraph natural-language explanation of what the company does." },
            companyBasics: {
              type: "object",
              properties: {
                companyName: { type: "string", description: "Company name." },
                foundingYear: { type: "string", description: "Year founded." },
                headquarters: { type: "string", description: "Headquarters location." },
                ceoName: { type: "string", description: "CEO name." },
                companySize: { type: "string", description: "Company size." },
                missionStatement: { type: "string", description: "Mission statement." },
              },
              required: ["companyName"]
            },
            productsServices: {
              type: "array",
              items: { type: "string" },
              description: "List of products/services."
            },
            recentNews: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  url: { type: "string" },
                  source: { type: "string" },
                  publishDate: { type: "string" }
                },
                required: ["title", "url", "source", "publishDate"]
              },
              description: "Recent news articles."
            },
            cultureValues: {
              type: "object",
              properties: {
                workplaceDescriptors: { type: "array", items: { type: "string" } },
                coreValues: { type: "array", items: { type: "string" } },
                perks: { type: "array", items: { type: "string" } },
                employeeQuotes: { type: "array", items: { type: "string" } }
              }
            },
            talkingPoints: {
              type: "array",
              items: { type: "string" },
              description: "Strategic interview questions."
            }
          },
          required: ["summary", "companyOverview", "companyBasics", "productsServices", "recentNews", "cultureValues", "talkingPoints"]
        }
      }
    ]

    // If scrapedData is an object with combinedText, use that for the prompt
    let combinedText = '';
    if (finalScrapedData && typeof finalScrapedData === 'object') {
      if (finalScrapedData.combinedText) {
        combinedText = finalScrapedData.combinedText;
      } else {
        // Concatenate all string values in the object
        combinedText = Object.values(finalScrapedData)
          .filter((v) => typeof v === 'string')
          .join('\n\n');
      }
    } else if (typeof finalScrapedData === 'string') {
      combinedText = finalScrapedData;
    }

    // Validate that we have meaningful content before proceeding
    if (!combinedText || combinedText.trim().length < 100) {
      console.warn('Insufficient scraped content for', companyName, companyWebsite);
      console.log('Combined text length:', combinedText?.length || 0);
      console.log('Combined text preview:', combinedText?.substring(0, 200));
      
      // Try to get company name from URL if not provided
      let companyNameForSearch = companyName;
      if (!companyNameForSearch && companyWebsite) {
        try {
          const url = new URL(companyWebsite);
          companyNameForSearch = url.hostname.replace('www.', '').split('.')[0];
        } catch (e) {
          console.error('Error parsing URL:', e);
        }
      }
      
      if (companyNameForSearch) {
        console.log('Attempting to find alternative sources for:', companyNameForSearch);
        // For now, return a more helpful error message
        return NextResponse.json({ 
          error: `Unable to extract sufficient information from ${companyWebsite || 'the company website'}. This might be because the website requires login, uses heavy JavaScript, or blocks automated access. Try searching for "${companyNameForSearch}" on Google to find their main website or try a different company.` 
        }, { status: 422 });
      } else {
        return NextResponse.json({ 
          error: "Unable to extract sufficient information from the company website. Please try again or check if the website is accessible." 
        }, { status: 422 });
      }
    }

    const prompt = `Extract structured company intelligence from the following scraped HTML/text. Be thorough and extract as much information as possible from the available content. 

CRITICAL: If the scraped content is empty, minimal, or contains "No content found", DO NOT generate generic placeholder content. Instead, return an error indicating that insufficient data was found to generate a meaningful report.

IMPORTANT: You must return ALL required fields. If a field cannot be determined from the content, provide a reasonable default or inference based on the company's industry and available information. Only use 'Unknown' if the information is truly not present in the text.

Look for company basics such as CEO, CTO, founding year, company size, locations, mission, and values. These may be present in leadership lists, about sections, or scattered throughout the text. If multiple leaders are listed, use the first as CEO, the second as CTO, and so on. If you see a list of locations, use them for headquarters or office locations. If you see a mission or values section, extract those. If you see a list of benefits or perks, extract those as well. If you see news, press releases, or blog posts, extract recent news titles and dates. If you see employee quotes, extract them. 

Required fields that must be populated:
- summary: 2–3 sentence overview that captures what makes the company unique, including its domain focus, flagship products, clientele (e.g., government, academic, enterprise), and any strong positioning (e.g., open-source leadership, technical specialization). Avoid generic phrases like 'committed to innovation' or 'custom software solutions' unless backed by details. Be specific and professional in tone.
- companyOverview: Write a clear and informative 1–2 paragraph overview that explains:
   • What the company builds or offers (products, platforms, or services),
   • Who they serve (target customers, industries, or sectors),
   • What makes their offering distinctive (technical edge, open-source roots, market position, or impact),
   • Any strategic partnerships, open-source contributions, or R&D initiatives mentioned.

Use complete sentences and specific language. Avoid repeating the summary verbatim. Focus on industry context and technical/product clarity. If needed, infer likely domains or customer types based on product names or open-source tools.
- companyBasics: Extract or infer the following core company info:

   • companyName (required, exact match from text)  
   • foundingYear (look for any date reference; infer if possible)  
   • headquarters (use address, city/state, or office mention)  
   • ceoName (first leadership name mentioned; if multiple, assume first is CEO)  
   • companySize (estimate based on team description, "About Us", or job postings)  
   • missionStatement (verbatim quote if labeled, or inferred 1-sentence summary of company purpose)

If any field is missing, infer a reasonable value based on industry, company history, and language used. Avoid using "Unknown" unless there's truly no basis for inference.
- productsServices: List the core products, platforms, tools, or services the company offers. For each item, include a short 1-line description of what it does or who it helps. Pull this from:
   • Product pages
   • Open-source tool references
   • Mentions of services like R&D, consulting, training, or custom solutions
   • Download or GitHub links

If product names are highly technical, explain their purpose in plain English. If services are generalized (e.g., "custom software"), try to specify for which domains or customers (e.g., scientific computing for federal agencies).

List at least 1 product or service even if not explicitly stated — infer from context if needed.
- recentNews: List recent news items or announcements about the company. Prioritize blog posts, press releases, funding announcements, partnerships, or product launches. For each item, include:

   • Title or headline  
   • Approximate date (month/year)  
   • Optional 1-sentence description (if not obvious)

If no explicit news section is found, infer from any mention of timelines, milestones, or recent updates on the site. Limit to the last 2 years unless only older news is available. If the company does not publish news, infer a default like "Actively maintains open-source updates via GitHub and technical blog."
- cultureValues: Identify and list key aspects of the company's work culture, values, and internal environment. Extract information from any of the following:
   • About pages or leadership quotes
   • Lists of core values or guiding principles
   • Mentions of work style (e.g., collaborative, research-driven, remote-first)
   • Benefits and perks (e.g., flexible hours, professional development support)
   • Employee testimonials or blog posts
   • Language describing how the team works (e.g., interdisciplinary teams, open-source ethos, continuous learning)

If no explicit culture information is given, infer likely values from the company's industry and open-source contributions. Avoid generic terms unless supported by content. Use bullet points, and quote direct employee language when available.
- talkingPoints: Provide exactly 5 strategic, role-agnostic interview questions a candidate could ask the company to show deep understanding and interest. These questions should be:

   • Based on the company's industry, products, services, or customers  
   • Thoughtful and open-ended (not easily answered by the website)  
   • Designed to spark meaningful discussion or insight into challenges, growth, or culture  
   • If possible, reference unique aspects such as open-source strategy, research partnerships, technical differentiators, or mission alignment  
   • Cover different aspects: technology/innovation, market competition, company culture, industry trends, and mission alignment

Avoid generic questions like "What's the company culture like?" unless you can frame them in a way that clearly connects to something specific in the scraped content. Always provide exactly 5 questions.

Scraped Input:
${combinedText || "No content found."}`

    // Log the prompt and scraped content for debugging
    console.log("AI Prompt:", prompt);
    console.log("Scraped Content (combinedText):", combinedText);

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert career coach and company research analyst. Your job is to extract comprehensive company intelligence from scraped website content and generate detailed, well-structured reports that help job seekers prepare for interviews. Always provide complete, actionable information even when some details are not explicitly stated in the source material.",
        },
        { role: "user", content: prompt },
      ],
      functions,
      function_call: { name: "generate_company_report" },
      temperature: 0.7,
      max_tokens: 2000,
    })

    // Log the raw OpenAI response for debugging
    console.log("Raw OpenAI completion:", JSON.stringify(completion, null, 2));

    let report = null
    let fallbackMode = false
    let parsed = null

    const functionCall = completion.choices[0].message?.function_call
    if (functionCall && functionCall.arguments) {
      try {
        parsed = JSON.parse(functionCall.arguments)
        report = JSON.stringify(parsed)
      } catch (e) {
        fallbackMode = true
        report = functionCall.arguments
      }
    } else {
      fallbackMode = true
      report = completion.choices[0].message?.content
    }

    // Log the function call arguments and parsed output
    console.log("Function call arguments:", functionCall?.arguments);
    console.log("Parsed output:", JSON.stringify(parsed, null, 2));

    // Check for required fields and set fallbackMode if missing or too generic
    if (!fallbackMode) {
      const basics = parsed?.companyBasics || {}
      const missingFields = [];
      
      if (!parsed.summary || parsed.summary.trim() === "") missingFields.push("summary");
      if (!parsed.companyOverview || parsed.companyOverview.trim() === "") missingFields.push("companyOverview");
      if (!basics.companyName || basics.companyName.trim() === "") missingFields.push("companyName");
      if (!Array.isArray(parsed.productsServices) || parsed.productsServices.length === 0) missingFields.push("productsServices");
      if (!Array.isArray(parsed.recentNews) || parsed.recentNews.length === 0) missingFields.push("recentNews");
      
      if (missingFields.length > 0) {
        console.log("Missing required fields:", missingFields);
        fallbackMode = true;
      }
    }

    // Log the raw AI response for debugging
    console.log("AI raw report response:", report)
    console.log("Parsed data:", JSON.stringify(parsed, null, 2))
    console.log("Fallback mode:", fallbackMode)

    if (!report) {
      throw new Error("Failed to generate report")
    }

    // Prevent saving/caching of failed or empty reports
    if (fallbackMode || !parsed) {
      console.warn("Report in fallback mode or failed to parse for", companyName, companyWebsite);
      console.log("Parsed data:", JSON.stringify(parsed, null, 2));
      return NextResponse.json({ error: "Failed to generate structured report. Please try again." }, { status: 422 });
    }

    // Check if we have at least some meaningful content
    const hasContent = (
      (parsed.summary && parsed.summary.trim() !== "") ||
      (parsed.companyOverview && parsed.companyOverview.trim() !== "") ||
      (parsed.companyBasics && parsed.companyBasics.companyName && parsed.companyBasics.companyName.trim() !== "") ||
      (parsed.productsServices && parsed.productsServices.length > 0) ||
      (parsed.recentNews && parsed.recentNews.length > 0) ||
      (parsed.cultureValues && Object.values(parsed.cultureValues).some(v => v && (Array.isArray(v) ? v.length > 0 : v !== ""))) ||
      (parsed.talkingPoints && parsed.talkingPoints.length > 0)
    );

    if (!hasContent) {
      console.warn("No meaningful content found in report for", companyName, companyWebsite);
      console.log("Parsed data:", JSON.stringify(parsed, null, 2));
      return NextResponse.json({ error: "No meaningful data could be extracted. Please try again or check the company website." }, { status: 422 });
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
          data: { content: report, fallbackMode },
          last_regenerated_at: new Date().toISOString(),
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
        model: model,
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
