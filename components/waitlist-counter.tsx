"use client"

import { useEffect, useState } from "react"

export default function WaitlistCounter() {
  const [count, setCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch("/api/waitlist/count")
        const data = await response.json()

        if (data.count !== undefined) {
          setCount(data.count)
        }
      } catch (error) {
        console.error("Failed to fetch waitlist count:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCount()
  }, [])

  if (isLoading || count === null) {
    return null
  }

  return (
    <div className="text-sm text-gray-500 mt-2">
      <span className="font-medium text-[#4B6EF5]">{count}+</span> people on the waitlist
    </div>
  )
}
