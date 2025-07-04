import type { Metadata } from "next"
import { ButtonColorful } from "@/components/ui/button-colorful"
import { Card } from "@/components/ui/card"
import { PlusIcon, FileTextIcon } from "lucide-react"
import Link from "next/link"
import ProtectedRoute from "@/components/protected-route"
import SubscriptionStatus from "@/components/subscription-status"
import BackgroundBlobs from "@/components/BackgroundBlobs"
import TrialNotification from "@/components/TrialNotification"

export const metadata: Metadata = {
  title: "Dashboard | InterviewIQ",
  description: "View your generated company research reports",
}

export default function DashboardPage() {
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
            {/* Right: New Report button */}
            <a href="/#generate-report">
              <ButtonColorful label="New Report" />
            </a>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
            {/* Empty state */}
            <Card className="col-span-full flex flex-col items-center justify-center p-8 text-center border-dashed border-2 border-gray-300 bg-white/50">
              <FileTextIcon className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No reports yet</h3>
              <p className="text-gray-600 mb-6">
                Generate your first company research report to prepare for your interview.
              </p>
              <a href="/#generate-report">
                <ButtonColorful label="Generate Report" className="w-full" />
              </a>
            </Card>

            {/* This would be populated with actual reports in a real implementation */}
            {/* Example report card for reference */}
            {/* 
            <Card className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Google</CardTitle>
                <CardDescription className="flex items-center text-xs">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  Generated on May 14, 2023
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                  A leading technology company focused on search, cloud computing, and advertising.
                </p>
                <Link href="/reports/123">
                  <Button variant="outline" size="sm" className="w-full">
                    View Report
                  </Button>
                </Link>
              </CardContent>
            </Card>
            */}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
