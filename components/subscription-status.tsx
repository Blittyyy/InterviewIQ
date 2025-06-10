"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getSupabaseClient } from "@/lib/supabase"
import { Database } from "@/types/supabase"
import { CrownIcon, ClockIcon, ArrowUpRightIcon } from "lucide-react"
import Link from "next/link"
import { ButtonColorful } from "@/components/ui/button-colorful"

type UserSubscription = Database["public"]["Tables"]["users"]["Row"]

export default function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reportsUsed, setReportsUsed] = useState<number | null>(null)

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
              {subscription.subscription_status === "free" && "Free Plan"}
              {subscription.subscription_status === "day-pass" && "Day Pass"}
            </h3>
          </div>
          
          {subscription.subscription_status === "day-pass" && timeRemaining && (
            <div className="flex items-center text-sm text-gray-600">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{timeRemaining} remaining</span>
            </div>
          )}
          
          {subscription.subscription_status === "free" && (
            <>
              <p className="text-sm text-gray-600">
                Upgrade to Pro for unlimited reports and advanced features
              </p>
              {reportsUsed !== null && (
                <p className="text-xs text-gray-500 mt-1">
                  You've used {reportsUsed} of 3 free reports today
                </p>
              )}
            </>
          )}
        </div>

        {subscription.subscription_status === "free" && (
          <a href="/#pricing">
            <ButtonColorful label="Upgrade" className="px-6" />
          </a>
        )}
      </div>
    </Card>
  )
} 