import { Button } from "@/components/ui/button"
import { ButtonColorful } from "@/components/ui/button-colorful"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckIcon, Loader2Icon } from "lucide-react"
import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

const plans = [
  {
    name: "7-Day Free Trial",
    price: "Free",
    period: "for 7 days",
    features: [
      "All Pro features included",
      "3 reports per day",
      "No credit card required",
      "Ends automatically",
      "Countdown on dashboard",
      "Start anytime",
    ],
    buttonText: "Start Free Trial",
    type: "trial",
  },
  {
    name: "Pro Plan",
    price: "$9",
    period: "/month",
    features: [
      "Unlimited reports",
      "Advanced company insights",
      "Resume upload & matching",
      "Export to PDF",
      "Competitor analysis",
      "Talking points generator",
      "Notes & bookmarks",
      "Priority support",
    ],
    buttonText: "Upgrade to Pro",
    type: "pro",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
    annualOption: {
      price: "$90",
      period: "/year",
      savings: "2 months free",
    },
  },
]

export default function PricingSection() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [isAnnual, setIsAnnual] = useState(false)
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
        body: JSON.stringify({ 
          priceId,
          isAnnual 
        }),
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

  const handleTrialStart = async () => {
    if (!isAuthenticated) {
      router.push("/signup?trial=true")
      return
    }
    try {
      setLoading("trial")
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      const response = await fetch("/api/trial/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      })
      if (response.ok) {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error starting trial:", error)
    } finally {
      setLoading(null)
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan, idx) => (
          <div
            key={plan.name}
            className="group will-change-transform transform-gpu transition-transform duration-300 hover:-translate-y-1 [backface-visibility:hidden] translate-z-0"
          >
            <Card
              className={`border shadow-sm group-hover:shadow-xl transition-colors duration-300 ${plan.name === "Pro Plan" ? "border-2 border-[#4B6EF5] shadow-md relative overflow-hidden" : "border-gray-200"}`}
            >
              {plan.name === "Pro Plan" && (
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
                {plan.name === "Pro Plan" && plan.annualOption && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-sm text-gray-600">Monthly</span>
                      <button
                        onClick={() => setIsAnnual(!isAnnual)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#4B6EF5] focus:ring-offset-2 ${
                          isAnnual ? "bg-[#4B6EF5]" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isAnnual ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className="text-sm text-gray-600">Annual</span>
                    </div>
                    {isAnnual && (
                      <div className="mt-2 text-center">
                        <span className="text-2xl font-bold">{plan.annualOption.price}</span>
                        <span className="text-gray-500 ml-1">{plan.annualOption.period}</span>
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {plan.annualOption.savings}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <CardDescription className="mt-2">
                  {plan.name === "7-Day Free Trial"
                    ? "Try all Pro features risk-free"
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
                {plan.type === "trial" ? (
                  <ButtonColorful
                    label={plan.buttonText}
                    className="w-full"
                    disabled={loading === "trial"}
                    onClick={handleTrialStart}
                  />
                ) : (
                  <ButtonColorful
                    label={plan.buttonText}
                    className="w-full"
                    disabled={false}
                    onClick={() => {
                      console.log("ButtonColorful clicked");
                      if (!isAuthenticated) {
                        router.push("/signup");
                      } else if (plan.priceId) {
                        handleCheckout(plan.priceId);
                      }
                    }}
                  />
                )}
              </CardFooter>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
