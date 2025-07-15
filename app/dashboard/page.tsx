"use client"

import type { Metadata } from "next"
import { ButtonColorful } from "@/components/ui/button-colorful"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { PlusIcon, FileTextIcon, ClockIcon, Trash2Icon } from "lucide-react"
import Link from "next/link"
import ProtectedRoute from "@/components/protected-route"
import SubscriptionStatus from "@/components/subscription-status"
import BackgroundBlobs from "@/components/BackgroundBlobs"
import TrialNotification from "@/components/TrialNotification"
import { useEffect, useState, useMemo } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [regenLoading, setRegenLoading] = useState<{ [id: string]: boolean }>({})
  const [regenCooldown, setRegenCooldown] = useState<{ [id: string]: number }>({})
  const [regenError, setRegenError] = useState<{ [id: string]: string }>({})
  const [deleteLoading, setDeleteLoading] = useState<{ [id: string]: boolean }>({})
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const REPORTS_PER_PAGE = 12;

  // Filtered reports by search
  const filteredReports = useMemo(() => {
    if (!search) return reports;
    return reports.filter(r =>
      (r.company_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.data?.content || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [reports, search]);

  // Paginated reports
  const totalPages = Math.ceil(filteredReports.length / REPORTS_PER_PAGE) || 1;
  const paginatedReports = useMemo(() => {
    const start = (page - 1) * REPORTS_PER_PAGE;
    return filteredReports.slice(start, start + REPORTS_PER_PAGE);
  }, [filteredReports, page]);

  // Reset to page 1 on new search
  useEffect(() => { setPage(1); }, [search]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        console.log("Dashboard: Starting to fetch reports...")
        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          console.log("Dashboard: No session found")
          setError("You must be logged in to view reports")
          setLoading(false)
          return
        }
        const userId = session.user.id
        console.log("Dashboard: Fetching reports for user:", userId)
        const { data, error } = await supabase
          .from("reports")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
        if (error) {
          console.error("Dashboard: Error fetching reports:", error)
          throw error
        }
        console.log("Dashboard: Fetched reports:", data?.length || 0, "reports")
        if (data && data.length > 0) {
          console.log("Dashboard: Report IDs:", data.map(r => r.id))
        }
        setReports(data || [])
      } catch (err) {
        console.error("Dashboard: Failed to fetch reports:", err)
        setError("Failed to fetch reports")
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [])

  const handleRegenerate = async (report: any) => {
    setRegenError((prev) => ({ ...prev, [report.id]: "" }))
    setRegenLoading((prev) => ({ ...prev, [report.id]: true }))
    try {
      let companyName = report.company_name;
      if (!companyName || companyName.trim() === "") {
        companyName = window.prompt("This report is missing a company name. Please enter the company name to regenerate:") || "";
        if (!companyName.trim()) {
          setRegenError((prev) => ({ ...prev, [report.id]: "Regeneration cancelled: company name is required." }));
          setRegenLoading((prev) => ({ ...prev, [report.id]: false }));
          return;
        }
      }
      let companyWebsite = report.company_website;
      if (!companyWebsite || companyWebsite.trim() === "") {
        companyWebsite = window.prompt("This report is missing a company website. Please enter the company website URL to regenerate:") || "";
        if (!companyWebsite.trim()) {
          setRegenError((prev) => ({ ...prev, [report.id]: "Regeneration cancelled: company website is required." }));
          setRegenLoading((prev) => ({ ...prev, [report.id]: false }));
          return;
        }
      }
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          companyWebsite,
          jobDescription: report.job_description,
          force: true
        })
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429 && data.error) {
          setRegenError((prev) => ({ ...prev, [report.id]: data.error }))
        } else {
          setRegenError((prev) => ({ ...prev, [report.id]: data.error || "Failed to regenerate report" }))
        }
        return
      }
      // Set frontend cooldown (1 min)
      setRegenCooldown((prev) => ({ ...prev, [report.id]: Date.now() + 60 * 1000 }))
      // Refetch reports after regeneration
      setLoading(true)
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err) {
      setRegenError((prev) => ({ ...prev, [report.id]: "Failed to regenerate report" }))
    } finally {
      setRegenLoading((prev) => ({ ...prev, [report.id]: false }))
    }
  }

  const handleDelete = async (reportId: string) => {
    // Add confirmation prompt
    const isConfirmed = window.confirm("Are you sure you want to delete this report? This action cannot be undone.")
    if (!isConfirmed) {
      return
    }
    
    setDeleteLoading((prev) => ({ ...prev, [reportId]: true }))
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
        credentials: "include"
      })
      if (!res.ok) throw new Error("Failed to delete report")
      setReports((prev) => prev.filter((r) => r.id !== reportId))
    } catch (err) {
      // Optionally show error
    } finally {
      setDeleteLoading((prev) => ({ ...prev, [reportId]: false }))
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-[#F4F7FE] to-white p-4 relative overflow-hidden">
        <BackgroundBlobs />
        <div className="max-w-7xl mx-auto">
          <div className="relative flex items-center justify-between mb-6 h-16">
            {/* Left: Dashboard title */}
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            {/* Center: Home button */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <Link href="/">
                <ButtonColorful label="Home" className="px-6" />
              </Link>
            </div>
            {/* Right: New Report button (sticky) */}
            <div className="sticky top-4 z-20">
              <a href="/#generate-report">
                <ButtonColorful label="New Report" />
              </a>
            </div>
          </div>

          {/* Search bar */}
          <div className="mb-6 flex justify-between items-center gap-4">
            <input
              type="text"
              placeholder="Search reports by company or keyword..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full max-w-md px-4 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4B6EF5]"
            />
            <span className="text-gray-500 text-sm">{filteredReports.length} result{filteredReports.length !== 1 ? "s" : ""}</span>
          </div>

          <div className="mb-8">
            <SubscriptionStatus />
          </div>

          {/* Flex row: 'Your Reports' left, Free Trial Active right */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
            <div className="text-left">
              <h2 className="text-2xl font-bold text-gray-900">Your Reports</h2>
              <p className="text-gray-600 mt-1">View and manage your company research reports</p>
            </div>
            <div className="flex justify-center md:justify-end w-full md:w-auto">
              <TrialNotification variant="subtle" />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading reports...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-12">{error}</div>
          ) : filteredReports.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
              <Card className="col-span-full flex flex-col items-center justify-center p-8 text-center border-dashed border-2 border-gray-300 bg-white/50">
                <FileTextIcon className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No reports found</h3>
                <p className="text-gray-600 mb-6">
                  Generate your first company research report to prepare for your interview.
                </p>
                <a href="/#generate-report">
                  <ButtonColorful label="Generate Report" className="w-full" />
                </a>
              </Card>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
                {paginatedReports.map((report) => {
                  let summary = "";
                  try {
                    const parsed = JSON.parse(report.data?.content || "{}")
                    summary = parsed.summary || "";
                  } catch {}
                  const cooldownLeft = regenCooldown[report.id] ? Math.max(0, Math.floor((regenCooldown[report.id] - Date.now()) / 1000)) : 0;
                  return (
                    <Card key={report.id} className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all relative">
                      {/* Trashcan delete button */}
                      <button
                        className="absolute top-3 right-3 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                        onClick={() => handleDelete(report.id)}
                        disabled={deleteLoading[report.id]}
                        title="Delete report"
                      >
                        <Trash2Icon className="h-5 w-5" />
                      </button>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{report.company_name}</CardTitle>
                        <CardDescription className="flex items-center text-xs">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          Generated on {new Date(report.created_at).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                          {summary}
                        </p>
                        <Link href={`/reports/${report.id}`}>
                          <ButtonColorful label="View Report" className="w-full mb-2" />
                        </Link>
                        <ButtonColorful
                          label={regenLoading[report.id] ? "Regenerating..." : cooldownLeft > 0 ? `Regenerate (${cooldownLeft}s)` : "Regenerate"}
                          className="w-full"
                          disabled={regenLoading[report.id] || cooldownLeft > 0}
                          onClick={() => handleRegenerate(report)}
                        />
                        {regenError[report.id] && (
                          <div className="text-xs text-red-500 mt-2">{regenError[report.id]}</div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
              {/* Pagination controls */}
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-gray-700">Page {page} of {totalPages}</span>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
