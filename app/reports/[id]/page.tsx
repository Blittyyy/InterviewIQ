"use client"

import { useEffect, useState } from "react"
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

export default function ReportPage({ params }: { params: { id: string } }) {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          setError("You must be logged in to view reports")
          return
        }

        const { data, error } = await supabase
          .from("reports")
          .select("*")
          .eq("id", params.id)
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
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F4F7FE] to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">Loading report...</div>
        </div>
      </div>
    )
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
  const reportContent = report.data.content

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F7FE] to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex flex-col gap-2">
          <div className="flex justify-start">
            <Link href="/" className="block">
              <button
                type="button"
                className="py-2 px-5 rounded-lg border-2 border-transparent bg-white shadow-sm font-semibold text-[#4B6EF5] transition-all duration-200 hover:bg-gradient-to-r hover:from-[#F4F7FE] hover:to-[#E9E3FF] hover:border-[#8C52FF] focus:outline-none focus:ring-2 focus:ring-[#8C52FF]"
              >
                Go to Home
              </button>
            </Link>
          </div>
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
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

        <Tabs defaultValue="full" className="mb-12">
          <TabsList className="mb-6">
            <TabsTrigger value="full">Full Report</TabsTrigger>
            <TabsTrigger value="tldr">TL;DR</TabsTrigger>
            <TabsTrigger value="talking-points">Talking Points</TabsTrigger>
          </TabsList>

          <TabsContent value="full">
            <div className="space-y-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-xl">
                    <BuildingIcon className="h-5 w-5 mr-2 text-[#4B6EF5]" />
                    Report Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    {reportContent.split("\n").map((paragraph, index) => (
                      <p key={index} className="text-gray-700 mb-4">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Company Basics */}
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
                      <dd className="text-gray-900">1998</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Headquarters</dt>
                      <dd className="text-gray-900">Mountain View, CA</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">CEO</dt>
                      <dd className="text-gray-900">Sundar Pichai</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Size</dt>
                      <dd className="text-gray-900">100,000+ employees</dd>
                    </div>
                    <div className="col-span-full">
                      <dt className="text-sm font-medium text-gray-500">Mission</dt>
                      <dd className="text-gray-900">
                        To organize the world's information and make it universally accessible and useful.
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Products & Services */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-xl">
                    <PackageIcon className="h-5 w-5 mr-2 text-[#4B6EF5]" />
                    Products & Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Search Engine</li>
                    <li>Google Workspace (Gmail, Docs, Drive, etc.)</li>
                    <li>Android Operating System</li>
                    <li>Google Cloud Platform</li>
                    <li>YouTube</li>
                    <li>Google Ads</li>
                    <li>Chrome Browser</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Recent News */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-xl">
                    <NewspaperIcon className="h-5 w-5 mr-2 text-[#4B6EF5]" />
                    Recent News & Press
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-b pb-3">
                      <h3 className="font-medium text-gray-900 hover:text-[#4B6EF5]">
                        <a href="#" target="_blank" rel="noopener noreferrer">
                          Google Announces New AI Features at I/O 2023
                        </a>
                      </h3>
                      <p className="text-sm text-gray-500">TechCrunch • May 10, 2023</p>
                    </div>
                    <div className="border-b pb-3">
                      <h3 className="font-medium text-gray-900 hover:text-[#4B6EF5]">
                        <a href="#" target="_blank" rel="noopener noreferrer">
                          Google Cloud Revenue Grows 28% in Q1 2023
                        </a>
                      </h3>
                      <p className="text-sm text-gray-500">CNBC • April 25, 2023</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 hover:text-[#4B6EF5]">
                        <a href="#" target="_blank" rel="noopener noreferrer">
                          Google Launches New Pixel Devices
                        </a>
                      </h3>
                      <p className="text-sm text-gray-500">The Verge • May 5, 2023</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Culture & Values */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-xl">
                    <UsersIcon className="h-5 w-5 mr-2 text-[#4B6EF5]" />
                    Culture & Values
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">
                    Google is known for its innovative culture and employee-friendly workplace. The company values
                    diversity, inclusion, and giving employees the freedom to be creative. Google's culture is built
                    around the idea that work should be challenging and the challenge should be fun.
                  </p>
                  <p className="text-gray-700">
                    Core values include: Focus on the user, freedom to innovate, data-driven decision making, and a
                    commitment to making a positive impact on society through technology.
                  </p>
                </CardContent>
              </Card>

              {/* Competitors */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-xl">
                    <GlobeIcon className="h-5 w-5 mr-2 text-[#4B6EF5]" />
                    Competitors & Market Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900">Microsoft</h3>
                      <p className="text-sm text-gray-700">
                        Competes in cloud services, productivity software, and search with Bing.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Amazon</h3>
                      <p className="text-sm text-gray-700">
                        Major competitor in cloud services with AWS and smart home devices.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Apple</h3>
                      <p className="text-sm text-gray-700">
                        Competes in mobile operating systems, browsers, and hardware.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Meta (Facebook)</h3>
                      <p className="text-sm text-gray-700">
                        Competes in digital advertising and future technologies like AR/VR.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tldr">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-4">Google at a Glance</h3>
                <p className="text-gray-700 mb-4">
                  Google is a global technology leader founded in 1998, headquartered in Mountain View, CA. Led by CEO
                  Sundar Pichai, the company has 100,000+ employees worldwide.
                </p>
                <p className="text-gray-700 mb-4">
                  Their core products include Search, Google Workspace, Android, Google Cloud, YouTube, and Chrome. The
                  company is known for its innovative culture, focus on users, and data-driven approach.
                </p>
                <p className="text-gray-700">
                  Recent developments include new AI features announced at Google I/O, strong cloud revenue growth, and
                  new Pixel device launches. Main competitors include Microsoft, Amazon, Apple, and Meta.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="talking-points">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-xl">
                  <MessageSquareIcon className="h-5 w-5 mr-2 text-[#4B6EF5]" />
                  Strategic Interview Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="pb-3 border-b">
                    <p className="font-medium text-gray-900">
                      How is Google balancing AI innovation with ethical considerations?
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      This shows your awareness of both Google's AI leadership and the ethical challenges in the field.
                    </p>
                  </li>
                  <li className="pb-3 border-b">
                    <p className="font-medium text-gray-900">
                      What strategies is Google employing to compete with Microsoft and Amazon in the cloud space?
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Demonstrates your understanding of Google's position in the competitive cloud market.
                    </p>
                  </li>
                  <li className="pb-3 border-b">
                    <p className="font-medium text-gray-900">
                      How does Google maintain its innovative culture at such a large scale?
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Shows interest in company culture and organizational effectiveness.
                    </p>
                  </li>
                  <li>
                    <p className="font-medium text-gray-900">
                      What role do you see Google playing in the future of [relevant technology to the role]?
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Connects your specific role to the company's broader mission and future.
                    </p>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-xl">
                  <MessageSquareIcon className="h-5 w-5 mr-2 text-[#4B6EF5]" />
                  "Why This Company?" Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <p className="text-gray-700 mb-3">
                    "I'm drawn to Google because of its unwavering commitment to innovation and solving complex problems
                    at global scale. The company's mission to organize the world's information aligns with my passion
                    for creating accessible technology that improves people's lives.
                  </p>
                  <p className="text-gray-700 mb-3">
                    Google's culture of collaboration and emphasis on data-driven decision making resonates with my own
                    work philosophy. I'm particularly excited about Google's recent advancements in AI and machine
                    learning, as these are areas where I've focused my skills and where I believe the most
                    transformative opportunities exist.
                  </p>
                  <p className="text-gray-700">
                    Additionally, Google's approach to balancing ambitious innovation with ethical considerations
                    demonstrates the kind of thoughtful leadership I want to work under and contribute to."
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
