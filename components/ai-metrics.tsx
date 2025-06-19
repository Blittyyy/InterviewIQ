"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createPublicSupabaseClient } from "@/lib/supabase"
import { Database } from "@/types/supabase"

type AIRequestLog = Database['public']['Tables']['ai_request_logs']['Row']

interface AIMetrics {
  totalRequests: number
  totalCost: number
  successRate: number
  avgResponseTime: number
  modelUsage: {
    "gpt-3.5-turbo": number
    "gpt-4": number
  }
  recentRequests: Array<{
    id: string
    model: string
    cost: number
    success: boolean
    created_at: string
  }>
}

export function AIMetrics() {
  const [metrics, setMetrics] = useState<AIMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const supabase = createPublicSupabaseClient()
        
        // Get total requests and cost
        const { data: totalData } = await supabase
          .from("ai_request_logs")
          .select("cost, success, model, response_time_ms")

        if (totalData) {
          const totalRequests = totalData.length
          const totalCost = totalData.reduce((sum, req) => sum + req.cost, 0)
          const successfulRequests = totalData.filter(req => req.success).length
          const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0
          const avgResponseTime = totalData.reduce((sum, req) => sum + req.response_time_ms, 0) / totalRequests

          const modelUsage = totalData.reduce((acc, req) => {
            acc[req.model as keyof typeof acc] = (acc[req.model as keyof typeof acc] || 0) + 1
            return acc
          }, { "gpt-3.5-turbo": 0, "gpt-4": 0 })

          // Get recent requests
          const { data: recentData } = await supabase
            .from("ai_request_logs")
            .select("id, model, cost, success, created_at")
            .order("created_at", { ascending: false })
            .limit(10)

          setMetrics({
            totalRequests,
            totalCost,
            successRate,
            avgResponseTime,
            modelUsage,
            recentRequests: recentData || []
          })
        }
      } catch (error) {
        console.error("Error fetching AI metrics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!metrics) {
    return <div>Failed to load metrics</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalRequests.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalCost.toFixed(4)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgResponseTime.toFixed(0)}ms</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Model Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>GPT-3.5 Turbo</span>
                <Badge variant="secondary">{metrics.modelUsage["gpt-3.5-turbo"] || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>GPT-4</span>
                <Badge variant="secondary">{metrics.modelUsage["gpt-4"] || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.recentRequests.map((request) => (
                <div key={request.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center space-x-2">
                    <Badge variant={request.success ? "default" : "destructive"}>
                      {request.success ? "✓" : "✗"}
                    </Badge>
                    <span>{request.model}</span>
                  </div>
                  <span>${request.cost.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 