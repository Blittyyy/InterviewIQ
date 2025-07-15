"use client"

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

// Sample structured data
const sampleData = {
  summary: "Founded in 1998, Google is a global technology leader that specializes in internet-related services and products. The company serves billions of users worldwide and has grown to become one of the most valuable companies in the world, with over 100,000 employees across 50+ countries.",
  companyOverview: "Google is a multinational technology company that specializes in Internet-related services and products, which include online advertising technologies, search engine, cloud computing, software, and hardware. The company's mission is to organize the world's information and make it universally accessible and useful. Google serves billions of users worldwide through its core search engine, which processes over 5.6 billion searches per day, and its ecosystem of products including Gmail, Google Maps, YouTube, Chrome, and Android. The company generates the majority of its revenue through advertising, helping businesses of all sizes reach their target audiences through sophisticated algorithms and data-driven insights. Google's value proposition lies in its ability to provide free, high-quality services while monetizing through targeted advertising, making information and tools accessible to everyone while helping businesses grow through digital marketing solutions.",
  companyBasics: {
    companyName: "Google",
    foundingYear: "1998",
    headquarters: "Mountain View, California",
    ceoName: "Sundar Pichai",
    companySize: "100,000+ employees",
    missionStatement: "To organize the world's information and make it universally accessible and useful."
  },
  productsServices: [
    "Google Search Engine",
    "Google Workspace (Gmail, Docs, Drive, etc.)",
    "Android Operating System",
    "Google Cloud Platform",
    "YouTube",
    "Google Ads",
    "Chrome Browser",
    "Google Maps"
  ],
  recentNews: [
    {
      title: "Google Announces New AI Features at I/O 2024",
      url: "https://techcrunch.com/2024/05/google-io-2024-ai-features",
      source: "TechCrunch",
      publishDate: "May 10, 2024"
    },
    {
      title: "Google Cloud Revenue Grows 28% in Q1 2024",
      url: "https://www.cnbc.com/2024/04/google-cloud-q1-2024",
      source: "CNBC",
      publishDate: "April 25, 2024"
    },
    {
      title: "Google Launches New Pixel 8 Pro with Advanced AI Capabilities",
      url: "https://www.theverge.com/2024/05/google-pixel-8-pro",
      source: "The Verge",
      publishDate: "May 5, 2024"
    }
  ],
  cultureValues: {
    workplace: "Innovative, collaborative, and fast-paced environment that encourages creativity and experimentation",
    coreValues: [
      "Focus on the user and all else will follow",
      "It's best to do one thing really, really well",
      "Fast is better than slow",
      "Democracy on the web works",
      "You can be serious without a suit",
      "Great just isn't good enough"
    ],
    perks: [
      "Comprehensive health benefits",
      "Flexible work arrangements",
      "On-site wellness programs",
      "Professional development opportunities",
      "Generous parental leave",
      "Free meals and snacks"
    ],
    employeeQuotes: [
      "The culture here encourages you to think big and take risks",
      "I love how collaborative and supportive the team environment is",
      "The opportunities for growth and learning are endless"
    ]
  },
  competitors: [
    {
      name: "Microsoft",
      description: "Competes in cloud services, productivity software, and search with Bing"
    },
    {
      name: "Amazon",
      description: "Major competitor in cloud services with AWS and smart home devices"
    },
    {
      name: "Apple",
      description: "Competes in mobile operating systems, browsers, and hardware"
    },
    {
      name: "Meta (Facebook)",
      description: "Competes in digital advertising and future technologies like AR/VR"
    }
  ],
  talkingPoints: [
    "How is Google balancing AI innovation with ethical considerations and responsible development?",
    "What strategies is Google employing to compete with Microsoft and Amazon in the cloud space?",
    "How does Google maintain its innovative culture at such a large scale with over 100,000 employees?",
    "What role do you see Google playing in the future of [relevant technology to the role]?",
    "How does Google's mission to organize the world's information translate to your specific team's goals?"
  ]
}

export default function SampleReportPage() {
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
              <h1 className="text-3xl font-bold text-gray-900">{sampleData.companyBasics.companyName}</h1>
              <p className="text-gray-600 mt-1">
                Sample Report - Generated on {new Date().toLocaleDateString()}
              </p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Sample Report
                </span>
              </div>
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
              {/* Company Overview */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-xl">
                    <BuildingIcon className="h-5 w-5 mr-2 text-[#4B6EF5]" />
                    Company Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{sampleData.companyOverview}</p>
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
                      <dd className="text-gray-900">{sampleData.companyBasics.foundingYear}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Headquarters</dt>
                      <dd className="text-gray-900">{sampleData.companyBasics.headquarters}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">CEO</dt>
                      <dd className="text-gray-900">{sampleData.companyBasics.ceoName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Size</dt>
                      <dd className="text-gray-900">{sampleData.companyBasics.companySize}</dd>
                    </div>
                    <div className="col-span-full">
                      <dt className="text-sm font-medium text-gray-500">Mission</dt>
                      <dd className="text-gray-900">{sampleData.companyBasics.missionStatement}</dd>
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
                    {sampleData.productsServices.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
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
                    {sampleData.recentNews.map((news, idx) => (
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

              {/* Culture & Values */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-xl">
                    <UsersIcon className="h-5 w-5 mr-2 text-[#4B6EF5]" />
                    Culture & Values
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <span className="font-semibold">Workplace:</span> {sampleData.cultureValues.workplace}
                  </div>
                  <div className="mb-4">
                    <span className="font-semibold">Core Values:</span>
                    <ul className="list-disc pl-5 mt-2">
                      {sampleData.cultureValues.coreValues.map((value, idx) => (
                        <li key={idx}>{value}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mb-4">
                    <span className="font-semibold">Perks:</span>
                    <ul className="list-disc pl-5 mt-2">
                      {sampleData.cultureValues.perks.map((perk, idx) => (
                        <li key={idx}>{perk}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-semibold">Employee Quotes:</span>
                    <ul className="list-disc pl-5 mt-2">
                      {sampleData.cultureValues.employeeQuotes.map((quote, idx) => (
                        <li key={idx} className="italic">"{quote}"</li>
                      ))}
                    </ul>
                  </div>
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
                    {sampleData.competitors.map((comp, idx) => (
                      <div key={idx}>
                        <h3 className="font-medium text-gray-900">{comp.name}</h3>
                        <p className="text-sm text-gray-700">{comp.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tldr">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-4">{sampleData.companyBasics.companyName} at a Glance</h3>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">{sampleData.summary}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="talking-points">
            <Tabs defaultValue="company-research" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="company-research">Company Research Questions</TabsTrigger>
                <TabsTrigger value="general">General Questions</TabsTrigger>
              </TabsList>

              <TabsContent value="company-research">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-xl">
                      <MessageSquareIcon className="h-5 w-5 mr-2 text-[#4B6EF5]" />
                      Company Research Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4">
                      <li className="pb-3 border-b last:border-b-0"><p className="font-medium text-gray-900">What are the company’s biggest growth opportunities in the next year?</p></li>
                      <li className="pb-3 border-b last:border-b-0"><p className="font-medium text-gray-900">How does the company measure success for this role?</p></li>
                      <li className="pb-3 border-b last:border-b-0"><p className="font-medium text-gray-900">What are the most important values that drive the company’s culture?</p></li>
                      <li className="pb-3 border-b last:border-b-0"><p className="font-medium text-gray-900">How does the company support innovation and new ideas?</p></li>
                      <li className="pb-3 border-b last:border-b-0"><p className="font-medium text-gray-900">What are the main challenges the company is facing in its industry?</p></li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="general">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-xl">
                      <MessageSquareIcon className="h-5 w-5 mr-2 text-[#4B6EF5]" />
                      General Interview Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4">
                      <li className="pb-3 border-b last:border-b-0"><p className="font-medium text-gray-900">What does a typical day look like for someone in this role?</p></li>
                      <li className="pb-3 border-b last:border-b-0"><p className="font-medium text-gray-900">How do you evaluate success here?</p></li>
                      <li className="pb-3 border-b last:border-b-0"><p className="font-medium text-gray-900">What are the next steps in the interview process?</p></li>
                      <li className="pb-3 border-b last:border-b-0"><p className="font-medium text-gray-900">What do you enjoy most about working here?</p></li>
                      <li className="pb-3 border-b last:border-b-0"><p className="font-medium text-gray-900">How does the team handle feedback and professional development?</p></li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 