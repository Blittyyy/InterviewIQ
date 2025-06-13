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
import Image from "next/image"
import { WavyBackground } from "@/components/ui/wavy-background"
import { ButtonColorful } from "@/components/ui/button-colorful"
import TrialNotification from "@/components/TrialNotification"
import Link from "next/link"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [userStatus, setUserStatus] = useState<null | {
    plan: string;
    subscription_status: string;
    trial_active: boolean;
  }>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
      if (session?.user) {
        const { data } = await supabase
          .from("users")
          .select("plan, subscription_status, trial_active")
          .eq("id", session.user.id)
          .single()
        setUserStatus(data ?? null)
      } else {
        setUserStatus(null)
      }
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
    <>
      <div className="max-w-7xl mx-auto">
        <WavyBackground backgroundFill="#fff" blur={20} waveOpacity={0.15} className="relative z-10">
          {/* Navigation */}
          <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-white/90 border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto grid grid-cols-3 items-center h-16 px-4 sm:px-6 lg:px-8">
              {/* Left: Logo */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex-shrink-0 flex items-center">
                  <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center mr-2 shadow-lg border border-gray-200">
                    <Image src="/logo.png" alt="Logo" width={40} height={40} className="h-10 w-10 object-contain" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">Interview<span className="bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] bg-clip-text text-transparent">IQ</span></span>
                </div>
              </div>
              {/* Center: Pricing */}
              <div className="flex justify-center">
                <a href="#pricing" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center font-bold">
                  <SparklesText text="Pricing" className="text-base" sparklesCount={8} />
                </a>
              </div>
              {/* Right: Action buttons */}
              <div className="flex items-center gap-2 min-w-0 justify-end">
                {isAuthenticated === null ? null : isAuthenticated ? (
                  <>
                    <a href="#generate-report" className="block">
                      <ButtonColorful label={"New Report"} className="w-full" />
                    </a>
                    <Button variant="ghost" onClick={handleLogout} className="transition-all">
                      Log Out
                    </Button>
                  </>
                ) : (
                  <>
                    <a href="/login">
                      <Button variant="ghost" className="hover:bg-gray-200 transition-all">Login</Button>
                    </a>
                    <a href="/signup">
                      {isAuthenticated === false && (
                        <ButtonColorful label="Sign Up" />
                      )}
                    </a>
                  </>
                )}
              </div>
            </div>
          </nav>

          <main className="flex flex-col min-h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-20">
            {/* Hero Section */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-center pt-12 pb-6 md:pt-20 md:pb-10">
                <div className="animate-pulse-slow inline-flex items-center justify-center h-20 w-20 rounded-full bg-white mb-6 shadow-lg border border-gray-200">
                  <div className="h-14 w-14 rounded-full flex items-center justify-center">
                    <Image src="/logo.png" alt="Logo" width={56} height={56} className="h-14 w-14 object-contain" />
                  </div>
                </div>
                <h1 className="text-5xl font-bold text-center text-gray-900">Interview<span className="bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] bg-clip-text text-transparent">IQ</span></h1>
                <h2 className="text-xl text-gray-700 font-medium mt-2 text-center">The AI-powered prep tool for job seekers</h2>
                <p className="text-base text-gray-500 max-w-xl mx-auto mt-2 text-center mb-8">Generate company insights, culture breakdowns, and talking points tailored to your resume.</p>

                {/* Demo Preview */}
                <div className="relative max-w-3xl mx-auto mb-8 rounded-lg overflow-hidden shadow-2xl">
                  <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-pulse-slow inline-flex items-center justify-center h-20 w-20 rounded-full bg-white mb-4 shadow-lg border border-gray-200">
                        <Image src="/logo.png" alt="Logo" width={48} height={48} className="h-12 w-12 object-contain" />
                      </div>
                      <p className="text-white text-lg">Demo not released yet.</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                  <a href={isAuthenticated ? "/dashboard" : "/signup?trial=true"}>
                    <ButtonColorful label={isAuthenticated ? "Go to Dashboard" : "Start Free Trial"} className="px-8 py-6 text-lg w-full sm:w-auto" />
                  </a>
                  <Button variant="outline" className="px-8 py-6 text-lg hover:bg-gray-200 transition-all w-full sm:w-auto">
                    Watch Demo
                  </Button>
                </div>

                {/* Trial Note - Only show for non-authenticated users */}
                {!isAuthenticated && (
                  <p className="text-sm text-gray-500 mb-6">No card needed. Ends automatically after 7 days.</p>
                )}

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

                {/* Waitlist and Trial Notification Section */}
                <div className="max-w-3xl mx-auto mt-4 mb-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div>
                    {isAuthenticated ? (
                      userStatus &&
                      (userStatus.subscription_status === "pro" || userStatus.subscription_status === "enterprise") &&
                      !userStatus.trial_active ? (
                        <div className="flex flex-col items-center justify-center h-full p-6 bg-white rounded-xl shadow border border-gray-200 mb-4">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">Thank you for using InterviewIQ!</h3>
                          <p className="text-base text-gray-600 mb-0 text-center">
                            We appreciate your support. Enjoy unlimited access to all features.
                          </p>
                        </div>
                      ) : (
                        <TrialNotification />
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-6 bg-white rounded-xl shadow border border-gray-200">
                        <h3 className="text-base font-bold text-gray-900 mb-2">Unlock Full Access</h3>
                        <p className="text-base text-gray-600 mb-0 text-center">
                          Sign up for a free trial to generate company insights, culture breakdowns, and more!
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <WaitlistForm compact={true} isAuthenticated={isAuthenticated ?? false} />
                  </div>
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
              <h2 className="text-2xl font-bold text-center mb-8">Trusted by job seekers. <span className='text-gray-500'>(Well, it will be.)</span></h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group will-change-transform transform-gpu transition-transform duration-300 hover:-translate-y-1 [backface-visibility:hidden] translate-z-0">
                  <div className="bg-white p-6 rounded-lg shadow-md group-hover:shadow-xl relative transition-colors duration-300">
                    <div className="flex items-center mb-4">
                      <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center mr-2 shadow-lg border border-gray-200">
                        <Image src="/logo.png" alt="Logo" width={40} height={40} className="h-10 w-10 object-contain" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-semibold">John Doe</h3>
                        <p className="text-sm text-gray-600">Software Engineer</p>
                      </div>
                    </div>
                    <p className="text-gray-700">"InterviewIQ helped me prepare for my dream job at Google. The company insights were spot-on and the talking points were incredibly helpful!"</p>
                    <span className="absolute bottom-4 right-4 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">Sample</span>
                  </div>
                </div>
                <div className="group will-change-transform transform-gpu transition-transform duration-300 hover:-translate-y-1 [backface-visibility:hidden] translate-z-0">
                  <div className="bg-white p-6 rounded-lg shadow-md group-hover:shadow-xl relative transition-colors duration-300">
                    <div className="flex items-center mb-4">
                      <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center mr-2 shadow-lg border border-gray-200">
                        <Image src="/logo.png" alt="Logo" width={40} height={40} className="h-10 w-10 object-contain" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-semibold">Alice Smith</h3>
                        <p className="text-sm text-gray-600">Product Manager</p>
                      </div>
                    </div>
                    <p className="text-gray-700">"The culture insights were invaluable. I was able to align my experience with the company's values and got the job!"</p>
                    <span className="absolute bottom-4 right-4 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">Sample</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Form Section */}
            <div id="generate-report" className="max-w-5xl w-full mx-auto mb-8">
              <ReportForm isAuthenticated={isAuthenticated ?? false} />
            </div>

            {/* Pricing Section */}
            <div id="pricing" className="mt-4">
              <PricingSection />
            </div>
          </main>
        </WavyBackground>
      </div>
      <footer className="w-full bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/logo.png" className="h-6 w-6" alt="Logo" />
            <span className="font-semibold text-gray-900">Interview<span className="bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] bg-clip-text text-transparent">IQ</span></span>
          </div>
          <div className="flex-1 flex justify-center">
            <Link
              href="/contact"
              className="font-bold text-gray-700 hover:text-gray-900 transition-colors duration-200"
            >
              Contact
            </Link>
          </div>
          <p className="text-xs text-gray-500 ml-auto">© {new Date().getFullYear()} InterviewIQ</p>
        </div>
      </footer>
    </>
  )
}
