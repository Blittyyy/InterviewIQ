"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckIcon, Loader2Icon } from "lucide-react"
import { useRouter } from "next/navigation"

const plans = [
  {
    name: "Free",
    price: "$0",
    features: [
      "3 reports per month",
      "Basic company research",
      "Standard support",
    ],
    buttonText: "Current Plan",
    disabled: true,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    features: [
      "Unlimited reports",
      "Advanced company research",
      "Priority support",
      "Custom report templates",
      "Export to PDF",
    ],
    buttonText: "Upgrade to Pro",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
  },
  {
    name: "Day Pass",
    price: "$9",
    period: "/day",
    features: [
      "24-hour access",
      "Unlimited reports",
      "All Pro features",
      "Perfect for interviews",
    ],
    buttonText: "Get Day Pass",
    priceId: process.env.NEXT_PUBLIC_STRIPE_DAY_PASS_PRICE_ID,
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F7FE] to-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600">
            Choose the plan that's right for you
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className="p-6 bg-white/50 border border-gray-200 hover:shadow-lg transition-all"
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-center justify-center">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && (
                    <span className="text-gray-600 ml-1">{plan.period}</span>
                  )}
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center text-gray-600">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${
                  plan.disabled
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] text-white hover:shadow-lg"
                }`}
                disabled={plan.disabled || loading === plan.priceId}
                onClick={() => plan.priceId && handleCheckout(plan.priceId)}
              >
                {loading === plan.priceId ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  plan.buttonText
                )}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
} 