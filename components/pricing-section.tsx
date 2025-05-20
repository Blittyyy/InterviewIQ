import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckIcon } from "lucide-react"

export default function PricingSection() {
  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Choose the plan that works best for your interview preparation needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Free Plan */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Free</CardTitle>
            <div className="mt-2">
              <span className="text-3xl font-bold">$0</span>
              <span className="text-gray-500 ml-1">/month</span>
            </div>
            <CardDescription className="mt-2">Perfect for occasional interviews</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                "1 report per day",
                "Summary view only",
                "Basic company insights",
                "No export options",
                "No resume matching",
              ].map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-[#4B6EF5] mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Get Started
            </Button>
          </CardFooter>
        </Card>

        {/* Day Pass */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Day Pass</CardTitle>
            <div className="mt-2">
              <span className="text-3xl font-bold">$3</span>
              <span className="text-gray-500 ml-1">/day</span>
            </div>
            <CardDescription className="mt-2">For when you need a quick boost</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                "3 full reports",
                "Complete company insights",
                "Resume upload & matching",
                "Export to PDF",
                "24-hour access window",
              ].map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-[#4B6EF5] mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Buy Day Pass
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className="border-2 border-[#4B6EF5] shadow-md hover:shadow-lg transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-[#4B6EF5] text-white text-xs font-bold py-1 px-3 rounded-bl-md">
            POPULAR
          </div>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Pro</CardTitle>
            <div className="mt-2">
              <span className="text-3xl font-bold">$9</span>
              <span className="text-gray-500 ml-1">/month</span>
            </div>
            <CardDescription className="mt-2">For serious job seekers</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                "Unlimited reports",
                "Full access to all features",
                "Advanced resume matching",
                "Competitor analysis",
                "Talking points generator",
                "Notes & bookmarks",
                "Priority support",
              ].map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-[#4B6EF5] mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] hover:shadow-md transition-all">
              Subscribe to Pro
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
