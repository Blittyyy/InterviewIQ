import { useEffect, useState } from "react"

export function useLiveStats() {
  const [stats, setStats] = useState({ reports: 0, companies: 0 })

  useEffect(() => {
    async function fetchStats() {
      const res = await fetch("/api/stats")
      const data = await res.json()
      setStats(data)
    }
    fetchStats()
    const interval = setInterval(fetchStats, 300000) // Poll every 5 minutes
    return () => clearInterval(interval)
  }, [])

  return stats
} 