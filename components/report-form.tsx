"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ButtonColorful } from "@/components/ui/button-colorful"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { ArrowRightIcon } from "lucide-react"
import ResumeUploader from "@/components/resume-uploader"
import { getSupabaseClient } from "@/lib/supabase"
import Link from "next/link"

interface ReportFormProps {
  isAuthenticated?: boolean
}

export default function ReportForm({ isAuthenticated = true }: ReportFormProps) {
  const [companyName, setCompanyName] = useState("")
  const [companyWebsite, setCompanyWebsite] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!companyName) {
      setError("Company name is required")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      // Get the current user ID and access token if available
      const supabase = getSupabaseClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const userId = session?.user?.id
      const accessToken = session?.access_token

      // --- Fix: If companyName is a URL, set it as companyWebsite and clear companyName ---
      let name = companyName.trim();
      let website = companyWebsite.trim();
      const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?$/i;
      if (!website && urlPattern.test(name)) {
        website = name;
        name = "";
      }
      // --- End fix ---

      if (!accessToken) {
        setError("You must be logged in to generate a report. Redirecting to login...")
        setIsSubmitting(false)
        setTimeout(() => {
          router.push("/login")
        }, 1500)
        return
      }

      // 1. Scrape company website if URL is provided
      let scrapedData = null;
      if (website) {
        try {
          const scraperUrl = `${process.env.NEXT_PUBLIC_SCRAPING_SERVICE_URL}/scrape?url=${encodeURIComponent(website)}`;
          const scrapeResponse = await fetch(scraperUrl);
          if (scrapeResponse.ok) {
            const result = await scrapeResponse.json();
            scrapedData = result.data;
          } else {
            console.warn("Failed to scrape website, proceeding without scraped data.");
          }
        } catch (scrapeError) {
          console.error("Error during website scraping:", scrapeError);
          // Non-critical error, so we can proceed without scraped data
        }
      }

      // 2. Submit the report request with scraped data
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          companyName: name,
          companyWebsite: website,
          jobDescription,
          userId,
          scrapedData, // Include scraped data in the request
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.upgradeRequired) {
          // Redirect to pricing page if user needs to upgrade
          router.push("/pricing")
          return
        }
        throw new Error(data.error || "Failed to generate report")
      }

      // Redirect to the report page or dashboard
      if (data.reportId) {
        router.push(`/reports/${data.reportId}`)
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      console.error("Error generating report:", err)
      setError(err instanceof Error ? err.message : "Failed to generate report")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto p-8 md:p-10 shadow-lg border-0 bg-white">
      <h2 className="text-2xl font-bold text-center mb-6">Generate your report</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
            Company name or website
          </label>
          <Input
            id="company"
            placeholder="e.g., Google or google.com"
            className="w-full"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
            Company website (optional)
          </label>
          <Input
            id="website"
            placeholder="e.g., https://google.com"
            className="w-full"
            value={companyWebsite}
            onChange={(e) => setCompanyWebsite(e.target.value)}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="job-description" className="block text-sm font-medium text-gray-700">
              Job description (optional)
            </label>
            <span className="text-xs text-gray-500">Improves personalization</span>
          </div>
          <Textarea
            id="job-description"
            placeholder="Paste the job description here..."
            className="w-full min-h-[120px]"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        <ResumeUploader />

        <div className="mt-6 mb-2">
          <Link href="/reports/sample" className="block">
            <button
              type="button"
              className="w-full py-3 px-6 rounded-xl border-2 border-transparent bg-white shadow-sm font-semibold text-[#4B6EF5] hover:bg-gray-200 transition-all"
              onClick={(e) => {
                e.preventDefault()
                router.push("/reports/sample")
              }}
            >
              See a sample report
            </button>
          </Link>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {isAuthenticated ? (
          <ButtonColorful
            label={isSubmitting ? "Generating Report..." : "Generate Report"}
            className="w-full py-6 text-lg"
            type="submit"
            disabled={isSubmitting}
          />
        ) : (
          <ButtonColorful label="Generate Report" className="w-full py-6 text-lg" />
        )}
      </form>
    </Card>
  )
}
