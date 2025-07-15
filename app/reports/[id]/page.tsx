"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeftIcon,
  BuildingIcon,
  PackageIcon,
  NewspaperIcon,
  UsersIcon,
  MessageSquareIcon,
  GlobeIcon,
} from "lucide-react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase"
// @ts-ignore
import html2pdf from "html2pdf.js";
import { useParams } from "next/navigation";

// Print-specific CSS for better PDF export
const printStyles = `
  @media print {
    body {
      background: #fff !important;
      color: #222 !important;
      font-size: 14px !important;
      line-height: 1.6 !important;
    }
    
    /* Hide UI elements not needed in PDF */
    .no-print, nav, .sidebar, button, .tabs-list, .debug-toggle {
      display: none !important;
    }
    
    /* Improve card styling for print */
    .card, [class*="Card"] {
      box-shadow: none !important;
      border: 1px solid #ddd !important;
      margin-bottom: 24px !important;
      page-break-inside: avoid !important;
      background: #fff !important;
    }
    
    /* Better typography for print */
    h1, h2, h3, h4, h5, h6 {
      color: #222 !important;
      margin-top: 24px !important;
      margin-bottom: 12px !important;
      page-break-after: avoid !important;
    }
    
    /* Improve spacing and readability */
    p, li, dd, dt {
      margin-bottom: 8px !important;
      color: #333 !important;
    }
    
    /* Better list styling */
    ul, ol {
      margin-left: 20px !important;
    }
    
    /* Improve table-like structures */
    dl {
      margin: 0 !important;
    }
    
    dt {
      font-weight: 600 !important;
      color: #555 !important;
    }
    
    dd {
      margin-bottom: 12px !important;
      margin-left: 0 !important;
    }
    
    /* Better link styling */
    a {
      color: #0066cc !important;
      text-decoration: underline !important;
    }
    
    /* Ensure proper page breaks */
    .page-break {
      page-break-before: always !important;
    }
    
    /* Hide scrollbars and other UI elements */
    ::-webkit-scrollbar {
      display: none !important;
    }
    
    /* Ensure white background */
    * {
      background-color: transparent !important;
    }
    
    .card, [class*="Card"] {
      background-color: #fff !important;
    }
  }
`;

interface Report {
  id: string
  company_name: string
  company_website: string | null
  job_description: string | null
  data: {
    content: string
  }
  created_at: string
}

export default function ReportPage() {
  const params = useParams();
  const reportId = params?.id as string;
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  // Debug toggle (for development) - moved to top to fix Rules of Hooks
  const [showDebug, setShowDebug] = useState(false)
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const notesSectionRef = useRef<HTMLDivElement>(null);

  // Load notes from localStorage on mount
  useEffect(() => {
    if (reportId) {
      const saved = localStorage.getItem(`report-notes-${reportId}`);
      if (saved) setNotes(saved);
    }
  }, [reportId]);

  // Save notes to localStorage
  const handleSaveNotes = () => {
    if (reportId) {
      localStorage.setItem(`report-notes-${reportId}`, notes);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 1500);
      setShowNotes(false);
    }
  };

  // PDF export using server-side Puppeteer generation
  const handleSavePDF = async () => {
    let originalText: string | null = null;
    try {
      // Show loading state
      const button = document.querySelector('button[onclick*="handleSavePDF"]') as HTMLButtonElement;
      originalText = button?.textContent || null;
      if (button) {
        button.textContent = 'Generating PDF...';
        button.disabled = true;
      }

      // Build the URL with notes as query parameter
      const url = new URL(`/api/reports/${reportId}/pdf`, window.location.origin);
      if (notes) {
        url.searchParams.set('notes', notes);
      }

      // Fetch the PDF
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Create blob and download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${report?.company_name || 'Company'}-Report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error('PDF generation error:', error);
      
      // Fallback to browser print if server-side fails
      console.log('Attempting fallback to browser print...');
      try {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          alert('Please allow popups to generate PDF');
          return;
        }

        // Build the HTML content for fallback
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${report?.company_name || 'Company Report'}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 20px;
                background: white;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #4B6EF5;
                padding-bottom: 20px;
              }
              .header h1 {
                font-size: 28px;
                color: #222;
                margin: 0 0 10px 0;
              }
              .header p {
                font-size: 14px;
                color: #666;
                margin: 0;
              }
              .section {
                margin-bottom: 30px;
                page-break-inside: avoid;
              }
              .section h2 {
                font-size: 20px;
                color: #222;
                margin-bottom: 15px;
                border-bottom: 1px solid #eee;
                padding-bottom: 5px;
              }
              .section p {
                margin-bottom: 10px;
              }
              .section ul {
                margin-left: 20px;
              }
              .section li {
                margin-bottom: 8px;
              }
              .basics-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 15px;
              }
              .basic-item {
                margin-bottom: 10px;
              }
              .basic-item dt {
                font-weight: 600;
                color: #555;
                font-size: 14px;
              }
              .basic-item dd {
                margin: 5px 0 0 0;
                color: #333;
              }
              .news-item {
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #eee;
              }
              .news-item:last-child {
                border-bottom: none;
              }
              .news-title {
                font-weight: 600;
                color: #222;
                margin-bottom: 5px;
              }
              .news-meta {
                font-size: 14px;
                color: #666;
              }
              .culture-item {
                margin-bottom: 10px;
              }
              .culture-label {
                font-weight: 600;
                color: #555;
              }
              .culture-value {
                margin-left: 10px;
              }
              .quote {
                font-style: italic;
                margin: 5px 0;
                padding-left: 10px;
                border-left: 3px solid #4B6EF5;
              }
              .talking-point {
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #eee;
              }
              .talking-point:last-child {
                border-bottom: none;
              }
              .notes {
                margin-top: 30px;
                padding: 15px;
                background: #f9f9f9;
                border-left: 4px solid #4B6EF5;
              }
              .notes h3 {
                margin-top: 0;
                color: #222;
              }
              @media print {
                body { margin: 0; }
                .section { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${report?.company_name || 'Company Report'}</h1>
              <p>Report generated on ${report?.created_at ? new Date(report.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</p>
            </div>
            
            ${parsed?.companyOverview ? `
              <div class="section">
                <h2>Company Overview</h2>
                <p>${parsed.companyOverview}</p>
              </div>
            ` : ''}
            
            ${parsed?.companyBasics && parsed.companyBasics.companyName ? `
              <div class="section">
                <h2>Company Basics</h2>
                <div class="basics-grid">
                  <div class="basic-item">
                    <dt>Founded</dt>
                    <dd>${parsed.companyBasics.foundingYear || 'No data found'}</dd>
                  </div>
                  <div class="basic-item">
                    <dt>Headquarters</dt>
                    <dd>${parsed.companyBasics.headquarters || 'No data found'}</dd>
                  </div>
                  <div class="basic-item">
                    <dt>CEO</dt>
                    <dd>${parsed.companyBasics.ceoName || 'No data found'}</dd>
                  </div>
                  <div class="basic-item">
                    <dt>Size</dt>
                    <dd>${parsed.companyBasics.companySize || 'No data found'}</dd>
                  </div>
                </div>
                <div class="basic-item">
                  <dt>Mission</dt>
                  <dd>${parsed.companyBasics.missionStatement || 'No data found'}</dd>
                </div>
              </div>
            ` : ''}
            
            ${parsed?.productsServices && parsed.productsServices.length > 0 ? `
              <div class="section">
                <h2>Products & Services</h2>
                <ul>
                  ${parsed.productsServices.map((item: string) => `<li>${item}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            ${parsed?.recentNews && parsed.recentNews.length > 0 ? `
              <div class="section">
                <h2>Recent News & Press</h2>
                ${parsed.recentNews.map((news: any) => `
                  <div class="news-item">
                    <div class="news-title">${news.title}</div>
                    <div class="news-meta">${news.source} • ${news.publishDate}</div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            ${parsed?.cultureValues ? `
              <div class="section">
                <h2>Culture & Values</h2>
                <div class="culture-item">
                  <span class="culture-label">Workplace:</span>
                  <span class="culture-value">${parsed.cultureValues.workplaceDescriptors && parsed.cultureValues.workplaceDescriptors.length > 0 ? parsed.cultureValues.workplaceDescriptors.join(', ') : 'No data found'}</span>
                </div>
                <div class="culture-item">
                  <span class="culture-label">Core Values:</span>
                  <span class="culture-value">${parsed.cultureValues.coreValues && parsed.cultureValues.coreValues.length > 0 ? parsed.cultureValues.coreValues.join(', ') : 'No data found'}</span>
                </div>
                <div class="culture-item">
                  <span class="culture-label">Perks:</span>
                  <span class="culture-value">${parsed.cultureValues.perks && parsed.cultureValues.perks.length > 0 ? parsed.cultureValues.perks.join(', ') : 'No data found'}</span>
                </div>
                ${parsed.cultureValues.employeeQuotes && parsed.cultureValues.employeeQuotes.length > 0 ? `
                  <div class="culture-item">
                    <span class="culture-label">Employee Quotes:</span>
                    ${parsed.cultureValues.employeeQuotes.map((q: string) => `<div class="quote">"${q}"</div>`).join('')}
                  </div>
                ` : ''}
              </div>
            ` : ''}
            
            ${parsed?.talkingPoints && parsed.talkingPoints.length > 0 ? `
              <div class="section">
                <h2>Strategic Interview Questions</h2>
                ${parsed.talkingPoints.map((tp: string) => `
                  <div class="talking-point">
                    <p>${tp}</p>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            ${notes ? `
              <div class="notes">
                <h3>Your Notes</h3>
                <div>${notes.replace(/\n/g, '<br>')}</div>
              </div>
            ` : ''}
          </body>
          </html>
        `;

        // Write the content to the new window
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Wait for content to load, then print
        printWindow.onload = () => {
          printWindow.print();
          // Close the window after printing
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        };
        
        console.log('Fallback to browser print successful');
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        alert('Failed to generate PDF. Please try again.');
      }
    } finally {
      // Restore button state
      const button = document.querySelector('button[onclick*="handleSavePDF"]') as HTMLButtonElement;
      if (button) {
        button.textContent = originalText || 'Save as PDF';
        button.disabled = false;
      }
    }
  };

  const handleAddNotesClick = () => {
    setShowNotes((v) => !v);
    setTimeout(() => {
      notesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100); // slight delay to ensure section is rendered
  };

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          setError("You must be logged in to view reports")
          return
        }

        if (!reportId) {
          setError("Report ID not available")
          return
        }

        const { data, error } = await supabase
          .from("reports")
          .select("*")
          .eq("id", reportId)
          .single()

        if (error) {
          throw error
        }

        setReport(data)
      } catch (err) {
        console.error("Error fetching report:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch report")
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [reportId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F4F7FE] to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">Loading report...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-lg text-red-600">{error}</div>;
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F4F7FE] to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-red-500">{error || "Report not found"}</div>
        </div>
      </div>
    )
  }

  // Parse the report content
  let parsed = null
  let parseError = false
  let fallbackMode = false
  try {
    const data = typeof report.data === 'string' ? JSON.parse(report.data) : report.data
    if (data && typeof data === 'object') {
      fallbackMode = !!data.fallbackMode
      parsed = typeof data.content === 'string' ? JSON.parse(data.content) : data.content
    }
  } catch (e) {
    parseError = true
  }

  // Check for partial data
  const hasAnySection = parsed && (
    parsed.companyOverview ||
    (parsed.companyBasics && parsed.companyBasics.companyName) ||
    (parsed.productsServices && parsed.productsServices.length > 0) ||
    (parsed.recentNews && parsed.recentNews.length > 0) ||
    (parsed.cultureValues && (
      (parsed.cultureValues.workplaceDescriptors && parsed.cultureValues.workplaceDescriptors.length > 0) ||
      (parsed.cultureValues.coreValues && parsed.cultureValues.coreValues.length > 0) ||
      (parsed.cultureValues.perks && parsed.cultureValues.perks.length > 0) ||
      (parsed.cultureValues.employeeQuotes && parsed.cultureValues.employeeQuotes.length > 0)
    )) ||
    (parsed.talkingPoints && parsed.talkingPoints.length > 0)
  );

  if (fallbackMode && !hasAnySection) {
    // Only show fallback if nothing is present
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F4F7FE] to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8 flex flex-col gap-2">
            <div className="flex justify-start">
              <Link href="/">
                <button
                  type="button"
                  className="py-2 px-5 rounded-lg border-2 border-transparent bg-white shadow-sm font-semibold text-[#4B6EF5] transition-all duration-200 hover:bg-gradient-to-r hover:from-[#F4F7FE] hover:to-[#E9E3FF] hover:border-[#8C52FF] focus:outline-none focus:ring-2 focus:ring-[#8C52FF]"
                >
                  Go to Home
                </button>
              </Link>
            </div>
            <Link href="/dashboard">
              <Button variant="ghost" className="hover:bg-gray-200 transition-all mb-4">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{report.company_name}</h1>
                <p className="text-gray-600 mt-1">
                  Report generated on {new Date(report.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-3">
                <Button variant="outline">Save as PDF</Button>
                <Button className="bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] text-white">Add Notes</Button>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-900 p-6 rounded mb-8">
            <h2 className="text-lg font-bold mb-2">We couldn't generate a full structured report, but here's what we found:</h2>
            <pre className="bg-white text-sm p-4 rounded border overflow-x-auto whitespace-pre-wrap mb-4" style={{maxHeight: 400}}>{report.data.content}</pre>
            <div className="flex gap-4 mb-2">
              <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200" onClick={() => window.location.reload()}>↻ Try Again with Refined Input</button>
              <button className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200" onClick={() => alert('Feedback form coming soon!')}>🐞 Report Issue</button>
            </div>
            <div className="text-xs text-gray-600 mt-2">This company's site may be missing key info or is protected. For better results, try the About or Careers page directly.</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F7FE] to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Navigation links */}
        <div className="flex gap-3 mb-4 no-print">
          <Link href="/">
            <button
              type="button"
              className="py-2 px-5 rounded-lg border-2 border-transparent bg-white shadow-sm font-semibold text-[#4B6EF5] transition-all duration-200 hover:bg-gradient-to-r hover:from-[#F4F7FE] hover:to-[#E9E3FF] hover:border-[#8C52FF] focus:outline-none focus:ring-2 focus:ring-[#8C52FF] flex items-center"
            >
              Go to Home
            </button>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" className="hover:bg-gray-200 transition-all flex items-center">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        {/* Company name and buttons row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1 mt-2">{report?.company_name || ""}</h1>
            <div className="text-gray-500 text-sm mb-2">Report generated on {report?.created_at ? new Date(report.created_at).toLocaleDateString() : ""}</div>
          </div>
          <div className="flex gap-3 items-center no-print">
            <Button variant="ghost" className="hover:bg-gray-200 transition-all" onClick={handleSavePDF}>Save as PDF</Button>
            <Button className="bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] text-white" onClick={handleAddNotesClick}>Add Notes</Button>
          </div>
        </div>

        {/* Report content for PDF export */}
        <div ref={reportRef} id="report-content">
          {/* Debug toggle button (dev only) */}
          <div className="mb-4 debug-toggle no-print">
            <button
              className="text-xs text-blue-500 underline hover:text-blue-700"
              onClick={() => setShowDebug((v) => !v)}
            >
              {showDebug ? "Hide Raw AI Response" : "Show Raw AI Response"}
            </button>
            {showDebug && (
              <pre className="bg-gray-100 text-xs p-2 rounded border mt-2 overflow-x-auto">
                {report.data.content}
              </pre>
            )}
          </div>

          {parseError ? (
            <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded mb-8">
              <strong>Sorry, we couldn't generate a structured report for this company.</strong>
              <div className="mt-2 text-xs text-gray-700">Raw AI response:</div>
              <pre className="bg-gray-50 text-xs p-2 rounded border mt-1 overflow-x-auto">{report.data.content}</pre>
            </div>
          ) : (
            <Tabs defaultValue="full" className="mb-12">
              <TabsList className="mb-6 tabs-list no-print">
                <TabsTrigger value="full">Full Report</TabsTrigger>
                <TabsTrigger value="tldr">TL;DR</TabsTrigger>
                <TabsTrigger value="talking-points">Talking Points</TabsTrigger>
              </TabsList>

              <TabsContent value="full">
                <div className="space-y-8">
                  {/* Company Overview */}
                  {parsed?.companyOverview ? (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-xl">
                          <BuildingIcon className="h-5 w-5 mr-2 text-[#4B6EF5]" />
                          Company Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose max-w-none">
                          <p className="text-gray-700 leading-relaxed">{parsed.companyOverview}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card><CardContent>No data found for this section.</CardContent></Card>
                  )}

                  {/* Company Basics */}
                  {parsed?.companyBasics && parsed.companyBasics.companyName ? (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-xl">
                          <BuildingIcon className="h-5 w-5 mr-2 text-[#4B6EF5]" />
                          Company Basics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Founded</dt>
                            <dd className="text-gray-900">{parsed.companyBasics.foundingYear || 'No data found'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Headquarters</dt>
                            <dd className="text-gray-900">{parsed.companyBasics.headquarters || 'No data found'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">CEO</dt>
                            <dd className="text-gray-900">{parsed.companyBasics.ceoName || 'No data found'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Size</dt>
                            <dd className="text-gray-900">{parsed.companyBasics.companySize || 'No data found'}</dd>
                          </div>
                          <div className="col-span-full">
                            <dt className="text-sm font-medium text-gray-500">Mission</dt>
                            <dd className="text-gray-900">{parsed.companyBasics.missionStatement || 'No data found'}</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card><CardContent>No data found for this section.</CardContent></Card>
                  )}

                  {/* Products & Services */}
                  {parsed?.productsServices && parsed.productsServices.length > 0 ? (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-xl">
                          <PackageIcon className="h-5 w-5 mr-2 text-[#4B6EF5]" />
                          Products & Services
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-5 space-y-2">
                          {parsed.productsServices.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card><CardContent>No data found for this section.</CardContent></Card>
                  )}

                  {/* Recent News */}
                  {parsed?.recentNews && parsed.recentNews.length > 0 ? (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-xl">
                          <NewspaperIcon className="h-5 w-5 mr-2 text-[#4B6EF5]" />
                          Recent News & Press
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {parsed.recentNews.map((news: any, idx: number) => (
                            <div key={idx} className="border-b pb-3">
                              <h3 className="font-medium text-gray-900 hover:text-[#4B6EF5]">
                                <a href={news.url} target="_blank" rel="noopener noreferrer">
                                  {news.title}
                                </a>
                              </h3>
                              <p className="text-sm text-gray-500">{news.source} • {news.publishDate}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card><CardContent>No data found for this section.</CardContent></Card>
                  )}

                  {/* Culture & Values */}
                  {parsed?.cultureValues && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-xl">
                          <UsersIcon className="h-5 w-5 mr-2 text-[#4B6EF5]" />
                          Culture & Values
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-2">
                          <span className="font-semibold">Workplace:</span> {parsed.cultureValues.workplaceDescriptors && parsed.cultureValues.workplaceDescriptors.length > 0 ? parsed.cultureValues.workplaceDescriptors.join(', ') : 'No data found'}
                        </div>
                        <div className="mb-2">
                          <span className="font-semibold">Core Values:</span> {parsed.cultureValues.coreValues && parsed.cultureValues.coreValues.length > 0 ? parsed.cultureValues.coreValues.join(', ') : 'No data found'}
                        </div>
                        <div className="mb-2">
                          <span className="font-semibold">Perks:</span> {parsed.cultureValues.perks && parsed.cultureValues.perks.length > 0 ? parsed.cultureValues.perks.join(', ') : 'No data found'}
                        </div>
                        <div className="mb-2">
                          <span className="font-semibold">Employee Quotes:</span> {parsed.cultureValues.employeeQuotes && parsed.cultureValues.employeeQuotes.length > 0 ? parsed.cultureValues.employeeQuotes.map((q: string, idx: number) => <div key={idx} className="italic">"{q}"</div>) : 'No data found'}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Talking Points */}
                  {parsed?.talkingPoints && parsed.talkingPoints.length > 0 ? (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-xl">
                          <MessageSquareIcon className="h-5 w-5 mr-2 text-[#4B6EF5]" />
                          Strategic Interview Questions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-4">
                          {parsed.talkingPoints.map((tp: string, idx: number) => (
                            <li key={idx} className="pb-3 border-b last:border-b-0">
                              <p className="font-medium text-gray-900">{tp}</p>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card><CardContent>No data found for this section.</CardContent></Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="tldr">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-bold mb-4">{report.company_name} at a Glance</h3>
                    {parsed?.summary ? (
                      <div className="space-y-4">
                        <p className="text-gray-700 leading-relaxed">{parsed.summary}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500">No summary available.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="talking-points">
                <Tabs defaultValue="company-research" className="w-full">
                  <TabsList className="mb-6 tabs-list no-print">
                    <TabsTrigger value="company-research">Company Research Questions</TabsTrigger>
                    <TabsTrigger value="general">General Questions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="company-research">
                    <Card className="bg-gray-50 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium mb-2">Company Research Questions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-6 space-y-2">
                          {parsed?.talkingPoints && parsed.talkingPoints.length > 0 ? (
                            parsed.talkingPoints.map((tp: string, idx: number) => (
                              <li key={idx}><p className="font-medium text-gray-900 text-base">{tp}</p></li>
                            ))
                          ) : (
                            <li className="text-gray-500">No company research questions available.</li>
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="general">
                    <div className="space-y-8">
                      {/* Role & Performance */}
                      <Card className="bg-gray-50 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-medium mb-2">Role & Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc pl-6 space-y-2">
                            <li><p className="font-medium text-gray-900 text-base">What does a typical day look like for someone in this role?</p></li>
                            <li><p className="font-medium text-gray-900 text-base">How do you measure success in this position?</p></li>
                            <li><p className="font-medium text-gray-900 text-base">What are the biggest challenges someone in this role would face?</p></li>
                            <li><p className="font-medium text-gray-900 text-base">How has this role evolved over the past year?</p></li>
                          </ul>
                        </CardContent>
                      </Card>

                      {/* Team & Collaboration */}
                      <Card className="bg-gray-50 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-medium mb-2">Team & Collaboration</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc pl-6 space-y-2">
                            <li><p className="font-medium text-gray-900 text-base">Can you tell me about the team I'd be working with?</p></li>
                            <li><p className="font-medium text-gray-900 text-base">How does the team collaborate and communicate?</p></li>
                            <li><p className="font-medium text-gray-900 text-base">What's the team's working style and culture?</p></li>
                            <li><p className="font-medium text-gray-900 text-base">How does the team handle feedback and professional development?</p></li>
                          </ul>
                        </CardContent>
                      </Card>

                      {/* Company & Culture */}
                      <Card className="bg-gray-50 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-medium mb-2">Company & Culture</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc pl-6 space-y-2">
                            <li><p className="font-medium text-gray-900 text-base">What do you enjoy most about working here?</p></li>
                            <li><p className="font-medium text-gray-900 text-base">How does the company support professional development and learning?</p></li>
                            <li><p className="font-medium text-gray-900 text-base">What opportunities are there for career advancement?</p></li>
                            <li><p className="font-medium text-gray-900 text-base">How would you describe the company culture?</p></li>
                          </ul>
                        </CardContent>
                      </Card>

                      {/* Interview Process */}
                      <Card className="bg-gray-50 shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-medium mb-2">Interview Process</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc pl-6 space-y-2">
                            <li><p className="font-medium text-gray-900 text-base">Do you have any reservations about me moving on in the interview process?</p></li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          )}

          {/* Notes Section */}
          <div className="mt-8" ref={notesSectionRef}>
            <h2 className="text-xl font-semibold mb-2">Your Notes</h2>
            {showNotes ? (
              <div className="mb-4 no-print">
                <textarea
                  className="w-full min-h-[100px] border rounded p-2 text-base"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Write your notes here..."
                />
                <div className="flex gap-2 mt-2">
                  <button
                    className="px-4 py-1 rounded bg-[#4B6EF5] text-white font-semibold"
                    onClick={handleSaveNotes}
                  >
                    Save Notes
                  </button>
                  <button
                    className="px-4 py-1 rounded border text-gray-700"
                    onClick={() => setShowNotes(false)}
                  >
                    Cancel
                  </button>
                  {notesSaved && <span className="text-green-600 ml-2">Notes saved!</span>}
                </div>
              </div>
            ) : null}
            {notes && !showNotes && (
              <div className="bg-white border rounded p-3 text-gray-900 whitespace-pre-line">
                {notes}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
