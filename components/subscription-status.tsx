"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getSupabaseClient } from "@/lib/supabase"
import { Database } from "@/types/supabase"
import { CrownIcon, ClockIcon, ArrowUpRightIcon } from "lucide-react"
import Link from "next/link"
import { ButtonColorful } from "@/components/ui/button-colorful"
import { useRouter } from "next/navigation"

type UserSubscription = Database["public"]["Tables"]["users"]["Row"]

export default function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reportsUsed, setReportsUsed] = useState<number | null>(null)
  const [loadingPortal, setLoadingPortal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) return

        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (error) throw error
        setSubscription(data)

        // If user is free, fetch report usage
        if (data.subscription_status === "free") {
          const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          const { count, error: countError } = await supabase
            .from("report_logs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", session.user.id)
            .gte("created_at", since)
          if (!countError) setReportsUsed(count ?? 0)
        }
      } catch (error) {
        console.error("Error fetching subscription:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscription()
  }, [])

  if (isLoading) {
    return (
      <Card className="p-4 bg-white/50 border border-gray-200">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    )
  }

  if (!subscription) return null

  const getTimeRemaining = () => {
    if (!subscription.subscription_end_date) return null
    const endDate = new Date(subscription.subscription_end_date)
    const now = new Date()
    const diff = endDate.getTime() - now.getTime()
    if (diff <= 0) return null
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const timeRemaining = getTimeRemaining()

  return (
    <Card className="p-4 bg-white/50 border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <CrownIcon className={`h-5 w-5 ${
              subscription.subscription_status === "pro" || subscription.subscription_status === "enterprise"
                ? "text-yellow-500"
                : "text-gray-400"
            }`} />
            <h3 className="font-medium text-gray-900">
              {subscription.subscription_status === "pro" && "Pro Plan"}
              {subscription.subscription_status === "enterprise" && "Enterprise Plan"}
              {subscription.trial_active && "Free Trial"}
              {subscription.subscription_status === "day-pass" && "Day Pass"}
            </h3>
            {(subscription.subscription_status === "pro" || subscription.subscription_status === "enterprise") && (
              <button
                className="ml-4 px-4 py-1 rounded bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition disabled:opacity-50"
                disabled={loadingPortal}
                onClick={async () => {
                  setLoadingPortal(true)
                  try {
                    const supabase = getSupabaseClient();
                    const { data: { session } } = await supabase.auth.getSession();
                    const accessToken = session?.access_token;
                    const res = await fetch("/api/stripe/customer-portal", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                      },
                    });
                    const data = await res.json();
                    if (data.url) {
                      window.location.href = data.url;
                    }
                  } catch (e) {
                    alert("Failed to open customer portal.");
                  } finally {
                    setLoadingPortal(false);
                  }
                }}
              >
                {loadingPortal ? "Loading..." : "Cancel Subscription"}
              </button>
            )}
          </div>
          {subscription.subscription_status === "day-pass" && timeRemaining && (
            <div className="flex items-center text-sm text-gray-600">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{timeRemaining} remaining</span>
            </div>
          )}
          {((subscription.subscription_status === "pro" || subscription.subscription_status === "enterprise") && subscription.subscription_end_date) && (() => {
            const endDate = new Date(subscription.subscription_end_date);
            const now = new Date();
            if (endDate > now) {
              return (
                <div className="text-sm text-yellow-700 bg-yellow-100 rounded px-2 py-1 mt-2 inline-block">
                  Plan still active until {endDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              );
            }
            return null;
          })()}
          {subscription.trial_active && (
            <div className="text-sm text-blue-700 bg-blue-100 rounded px-2 py-1 mt-2 inline-block">
              Free trial active
            </div>
          )}
        </div>
      </div>
    </Card>
  )
} 