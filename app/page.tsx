"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CloudLightningIcon as LightningBoltIcon } from "lucide-react"
import WaitlistForm from "@/components/waitlist-form"
import FeatureCard from "@/components/feature-card"
import PricingSection from "@/components/pricing-section"
import ReportForm from "@/components/report-form"
import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import BackgroundBlobs from "@/components/BackgroundBlobs"
import { SparklesText } from "@/components/ui/sparkles-text"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    }
    checkAuth()
  }, [])

  const handleLogout = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    setIsAuthenticated(false)
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F7FE] to-white relative overflow-hidden">
      <BackgroundBlobs />
      {/* Colorful background blobs */}
      <div className="hidden md:block absolute -top-32 -left-32 w-[38rem] h-[38rem] bg-gradient-to-br from-purple-400/30 via-blue-400/20 to-teal-300/10 rounded-full blur-3xl z-0 pointer-events-none" />
      <div className="hidden md:block absolute top-1/3 left-1/2 w-[32rem] h-[24rem] bg-gradient-to-tr from-blue-400/20 via-purple-400/10 to-teal-300/10 rounded-full blur-2xl z-0 pointer-events-none" />
      <div className="hidden md:block absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-gradient-to-tl from-teal-300/30 via-blue-400/10 to-purple-400/10 rounded-full blur-3xl z-0 pointer-events-none" />
      <div className="hidden md:block absolute bottom-1/4 left-0 w-[20rem] h-[20rem] bg-gradient-to-tr from-purple-400/20 via-blue-400/10 to-teal-300/10 rounded-full blur-2xl z-0 pointer-events-none" />
      {/* Additional blobs for richer effect */}
      <div className="hidden md:block absolute top-0 right-1/3 w-[18rem] h-[18rem] bg-gradient-to-br from-blue-400/20 via-teal-300/10 to-purple-400/10 rounded-full blur-2xl z-0 pointer-events-none" />
      <div className="hidden md:block absolute bottom-1/2 right-0 w-[16rem] h-[24rem] bg-gradient-to-tl from-purple-400/10 via-blue-400/20 to-teal-300/10 rounded-full blur-3xl z-0 pointer-events-none" />
      <div className="hidden md:block absolute top-1/4 left-1/4 w-[14rem] h-[14rem] bg-gradient-to-br from-teal-300/20 via-blue-400/10 to-purple-400/10 rounded-full blur-2xl z-0 pointer-events-none" />
      <div className="hidden md:block absolute bottom-0 left-1/2 w-[22rem] h-[12rem] bg-gradient-to-tr from-blue-400/10 via-purple-400/20 to-teal-300/10 rounded-full blur-3xl z-0 pointer-events-none" />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 relative">
          {/* Left: Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 rounded-md bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] flex items-center justify-center mr-2">
                <LightningBoltIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">InterviewIQ</span>
            </div>
          </div>
          {/* Center: Pricing */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <a href="#pricing" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center">
              <SparklesText text="Pricing" className="text-base" sparklesCount={8} />
            </a>
          </div>
          {/* Right: Action buttons */}
          <div className="flex items-center gap-2">
            {isAuthenticated === null ? null : isAuthenticated ? (
              <>
                <a href="#generate-report" className="block">
                  <Button className="bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] text-white hover:shadow-lg transition-all w-full">
                    <span className="mr-1">+</span> New Report
                  </Button>
                </a>
                <Button variant="ghost" onClick={handleLogout} className="transition-all">
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <a href="/login">
                  <Button variant="ghost" className="hover:bg-gray-100 transition-all">Login</Button>
                </a>
                <a href="/signup">
                  <Button className="bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] text-white shadow-md hover:shadow-lg transition-all">Sign Up</Button>
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex flex-col min-h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-center pt-12 pb-6 md:pt-20 md:pb-10">
            <div className="animate-pulse-slow inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-[#4B6EF5]/10 to-[#8C52FF]/10 mb-6">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] flex items-center justify-center">
                <LightningBoltIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">InterviewIQ</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Generate smart, personalized company research reports to ace your job interviews.
            </p>

            {/* Demo Preview */}
            <div className="relative max-w-3xl mx-auto mb-8 rounded-lg overflow-hidden shadow-2xl">
              <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-pulse-slow inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-[#4B6EF5]/20 to-[#8C52FF]/20 mb-4">
                    <LightningBoltIcon className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-white text-lg">See InterviewIQ in action</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <a href={isAuthenticated ? "/dashboard" : "/signup"}>
                <Button className="bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] text-white px-8 py-6 text-lg hover:shadow-lg transition-all w-full sm:w-auto">
                  {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
                </Button>
              </a>
              <Button variant="outline" className="px-8 py-6 text-lg hover:bg-gray-50 transition-all w-full sm:w-auto">
                Watch Demo
              </Button>
            </div>

            {/* Feature Tags */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <Badge
                variant="outline"
                className="py-2 px-4 bg-white shadow-sm border border-gray-200 hover:shadow-md transition-all"
              >
                <span className="h-2 w-2 rounded-full bg-[#4B6EF5] mr-2"></span>
                Company Insights
              </Badge>
              <Badge
                variant="outline"
                className="py-2 px-4 bg-white shadow-sm border border-gray-200 hover:shadow-md transition-all"
              >
                <span className="h-2 w-2 rounded-full bg-[#8C52FF] mr-2"></span>
                Culture & Values
              </Badge>
              <Badge
                variant="outline"
                className="py-2 px-4 bg-white shadow-sm border border-gray-200 hover:shadow-md transition-all"
              >
                <span className="h-2 w-2 rounded-full bg-[#10F2C5] mr-2"></span>
                Personalized Talking Points
              </Badge>
            </div>

            {/* Waitlist Section - Moved here and made more compact */}
            <div className="max-w-md mx-auto mt-4 mb-2">
              <WaitlistForm compact={true} />
            </div>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="p-4">
              <div className="text-3xl font-bold text-[#4B6EF5] mb-2">10k+</div>
              <div className="text-sm text-gray-600">Reports Generated</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-[#8C52FF] mb-2">95%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-[#10F2C5] mb-2">500+</div>
              <div className="text-sm text-gray-600">Companies Analyzed</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-[#4B6EF5] mb-2">24/7</div>
              <div className="text-sm text-gray-600">Support Available</div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <FeatureCard
            icon="building"
            title="Company Basics"
            description="Founding year, HQ, CEO, size, and mission pulled from company site/about pages."
          />
          <FeatureCard
            icon="package"
            title="Products & Services"
            description="Structured bullets summarizing what the company offers using AI."
          />
          <FeatureCard
            icon="newspaper"
            title="Recent News & Press"
            description="Top 3–5 headlines with title, link, source, and publish date."
          />
          <FeatureCard
            icon="users"
            title="Culture & Values"
            description="Insights from Careers pages, Glassdoor, and social profiles."
          />
          <FeatureCard
            icon="message-square"
            title="Talking Points Generator"
            description="3–5 strategic interview questions based on company data and role."
          />
          <FeatureCard
            icon="file-text"
            title="Resume Upload"
            description="Upload your resume to tailor talking points and role alignment."
          />
        </div>

        {/* Testimonials Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Trusted by Job Seekers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 transform-gpu">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] flex items-center justify-center text-white font-bold">JD</div>
                <div className="ml-4">
                  <h3 className="font-semibold">John Doe</h3>
                  <p className="text-sm text-gray-600">Software Engineer</p>
                </div>
              </div>
              <p className="text-gray-700">"InterviewIQ helped me prepare for my dream job at Google. The company insights were spot-on and the talking points were incredibly helpful!"</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 transform-gpu">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] flex items-center justify-center text-white font-bold">AS</div>
                <div className="ml-4">
                  <h3 className="font-semibold">Alice Smith</h3>
                  <p className="text-sm text-gray-600">Product Manager</p>
                </div>
              </div>
              <p className="text-gray-700">"The culture insights were invaluable. I was able to align my experience with the company's values and got the job!"</p>
            </div>
          </div>
        </div>

        {/* Main Form Section */}
        <div id="generate-report" className="max-w-3xl mx-auto mb-4">
          <ReportForm />
        </div>

        {/* Pricing Section */}
        <div id="pricing" className="mt-4">
          <PricingSection />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="h-8 w-8 rounded-md bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] flex items-center justify-center mr-2">
                <LightningBoltIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">InterviewIQ</span>
            </div>
            <div className="text-sm text-gray-500">© {new Date().getFullYear()} InterviewIQ. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
