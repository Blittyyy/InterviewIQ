import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

export default function SampleReportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F7FE] to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex justify-start">
          <Link href="/" className="block">
            <button
              type="button"
              className="py-2 px-5 rounded-lg border-2 border-transparent bg-white shadow-sm font-semibold text-[#4B6EF5] transition-all duration-200 hover:bg-gradient-to-r hover:from-[#F4F7FE] hover:to-[#E9E3FF] hover:border-[#8C52FF] focus:outline-none focus:ring-2 focus:ring-[#8C52FF]"
            >
              Go to Home
            </button>
          </Link>
        </div>
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sample Company Report</h1>
          <p className="text-gray-600 mb-6">This is a sample report to show what you can expect when you generate a real report.</p>
        </div>
        <div className="space-y-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">Company Basics</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Founded</dt>
                  <dd className="text-gray-900">2010</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Headquarters</dt>
                  <dd className="text-gray-900">New York, NY</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">CEO</dt>
                  <dd className="text-gray-900">Jane Doe</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Size</dt>
                  <dd className="text-gray-900">500+ employees</dd>
                </div>
                <div className="col-span-full">
                  <dt className="text-sm font-medium text-gray-500">Mission</dt>
                  <dd className="text-gray-900">To make job interview preparation smarter and more effective for everyone.</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">Products & Services</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                <li>AI-powered company research reports</li>
                <li>Resume matching and talking points generator</li>
                <li>PDF export and sharing</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">Recent News & Press</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <h3 className="font-medium text-gray-900">InterviewIQ launches new AI features</h3>
                  <p className="text-sm text-gray-500">TechCrunch • Jan 10, 2025</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Named one of the top 10 job search tools</h3>
                  <p className="text-sm text-gray-500">Forbes • Dec 5, 2024</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl">Culture & Values</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                InterviewIQ values innovation, transparency, and user empowerment. The team is dedicated to making job search less stressful and more successful for everyone.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 