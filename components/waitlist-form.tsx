"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { CheckIcon, MailIcon } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import WaitlistCounter from "./waitlist-counter"

interface WaitlistFormProps {
  compact?: boolean
}

export default function WaitlistForm({ compact = false }: WaitlistFormProps) {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const supabase = createClientComponentClient()

      const { error: supabaseError } = await supabase.from("waitlist").insert([{ email, status: "pending" }])

      if (supabaseError) {
        if (supabaseError.code === "23505") {
          // Unique violation error code
          setError("This email is already on our waitlist!")
        } else {
          throw supabaseError
        }
      } else {
        router.push("/waitlist/confirmation")
      }
    } catch (err) {
      console.error("Waitlist error:", err)
      setError("Failed to join waitlist. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className={`${compact ? "p-4" : "p-6"} border border-gray-200 bg-white shadow-md`}>
      {/* Add the WaitlistCounter component below the form title */}
      <div className={`text-center ${compact ? "mb-3" : "mb-6"}`}>
        <h3 className={`${compact ? "text-lg" : "text-xl"} font-bold text-gray-900 mb-1`}>Want early access?</h3>
        {!compact && (
          <p className="text-gray-600">
            Join the waitlist for InterviewIQ Pro and be the first to know when we launch.
          </p>
        )}
        <WaitlistCounter />
      </div>

      {isSuccess ? (
        <div className="flex items-center justify-center space-x-2 text-green-600 bg-green-50 p-3 rounded-md">
          <CheckIcon className="h-4 w-4" />
          <span className="text-sm">Thanks for joining our waitlist!</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-grow">
              <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="email"
                placeholder="Enter your email"
                className={`${compact ? "pl-9 py-1 text-sm h-9" : "pl-10"}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className={`bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] text-white ${compact ? "text-sm py-1 h-9" : ""}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Joining..." : "Join Waitlist"}
            </Button>
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
        </form>
      )}
    </Card>
  )
}
