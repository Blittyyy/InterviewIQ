import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckIcon, Loader2Icon } from "lucide-react"
import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    features: [
      "1 report per day",
      "Summary view only",
      "Basic company insights",
      "No export options",
      "No resume matching",
    ],
    buttonText: "Get Started",
    type: "free",
  },
  {
    name: "Day Pass",
    price: "$3",
    period: "/day",
    features: [
      "3 full reports",
      "Complete company insights",
      "Resume upload & matching",
      "Export to PDF",
      "24-hour access window",
    ],
    buttonText: "Buy Day Pass",
    type: "dayPass",
    priceId: process.env.NEXT_PUBLIC_STRIPE_DAY_PASS_PRICE_ID,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    features: [
      "Unlimited reports",
      "Full access to all features",
      "Advanced resume matching",
      "Competitor analysis",
      "Talking points generator",
      "Notes & bookmarks",
      "Priority support",
    ],
    buttonText: "Subscribe to Pro",
    type: "pro",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
  },
]

export default function PricingSection() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    }
    checkAuth()
  }, [])

  const handleCheckout = async (priceId: string) => {
    try {
      setLoading(priceId)
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      })
      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Error creating checkout session:", error)
    } finally {
      setLoading(null)
    }
  }

  const handleFreeGetStarted = () => {
    if (isAuthenticated) {
      router.push("/dashboard")
    } else {
      router.push("/signup")
    }
  }

  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Choose the plan that works best for your interview preparation needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan, idx) => (
          <Card
            key={plan.name}
            className={`border shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300 transform-gpu ${plan.name === "Pro" ? "border-2 border-[#4B6EF5] shadow-md relative overflow-hidden" : "border-gray-200"}`}
          >
            {plan.name === "Pro" && (
              <div className="absolute top-0 right-0 bg-[#4B6EF5] text-white text-xs font-bold py-1 px-3 rounded-bl-md">
                POPULAR
              </div>
            )}
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-gray-500 ml-1">{plan.period}</span>
              </div>
              <CardDescription className="mt-2">
                {plan.name === "Free"
                  ? "Perfect for occasional interviews"
                  : plan.name === "Day Pass"
                  ? "For when you need a quick boost"
                  : "For serious job seekers"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-[#4B6EF5] mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {plan.type === "free" ? (
                <Button variant="outline" className="w-full" onClick={handleFreeGetStarted}>
                  {plan.buttonText}
                </Button>
              ) : (
                <Button
                  className={`w-full bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] text-white hover:shadow-lg`}
                  disabled={loading === plan.priceId}
                  onClick={() => plan.priceId && handleCheckout(plan.priceId)}
                >
                  {loading === plan.priceId ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    plan.buttonText
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
