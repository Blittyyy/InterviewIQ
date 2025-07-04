"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { MailIcon, LockIcon, AlertCircle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { FcGoogle } from "react-icons/fc"
import { getDeviceFingerprint, storeFingerprint } from "./device-fingerprint"

export default function SignupForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetMessage, setResetMessage] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Initialize device fingerprint on component mount
    const initFingerprint = async () => {
      const fingerprint = await getDeviceFingerprint()
      storeFingerprint(fingerprint)
    }
    initFingerprint()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const supabase = getSupabaseClient()

      // Validate email format
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        throw new Error("Please enter a valid email address (e.g., student@university.edu)")
      }

      // Validate password length
      if (!password || password.length < 6) {
        throw new Error("Your password needs to be at least 6 characters long")
      }

      // Get device fingerprint
      const fingerprint = await getDeviceFingerprint()

      // Check if this device already has an account
      const { data: existingAccount, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("device_fingerprint", fingerprint)
        .eq("email_verified", true)
        .single()

      if (checkError && checkError.code !== "PGRST116") { // PGRST116 is "no rows returned" error
        throw checkError
      }

      if (existingAccount) {
        throw new Error(
          "It looks like you already have an account on this device. " +
          "Please try logging in instead. " +
          "If you're having trouble accessing your account, our support team is here to help!"
        )
      }

      // Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            device_fingerprint: fingerprint,
          },
        },
      })

      if (signUpError) {
        throw signUpError
      }

      // Create user record with device fingerprint
      if (data.user) {
        await supabase.from("users").insert([
          {
            id: data.user.id,
            email: data.user.email,
            plan: "free",
            reports_generated: 0,
            daily_reports_count: 0,
            device_fingerprint: fingerprint,
            email_verified: false,
          },
        ])
      }

      // If session exists, user is signed in, redirect to home
      if (data.session) {
        router.push("/")
        return
      }

      // If no session, redirect to confirm email page
      router.push("/confirm-email")
    } catch (err) {
      console.error("Signup error:", err)
      setError(err instanceof Error ? err.message : "Failed to create account")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetMessage("")
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : undefined,
      })
      if (error) throw error
      setResetMessage("Password reset email sent! Check your inbox.")
    } catch (err) {
      setResetMessage(err instanceof Error ? err.message : "Failed to send reset email")
    }
  }

  // Add a function to resend verification email
  const handleResendVerification = async () => {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      })
      if (error) throw error
      setError("Verification email resent! Please check your inbox.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend verification email")
    }
  }

  return (
    <div className="flex items-center justify-center w-full min-h-screen">
      <Card className="w-full max-w-md p-6 space-y-6 bg-white shadow-lg rounded-xl">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Create an Account</h2>
          <p className="text-gray-600">Join InterviewIQ to get started</p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-red-500 bg-red-50 p-3 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
            {error.includes("verification") && (
              <Button
                variant="link"
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={handleResendVerification}
              >
                Resend
              </Button>
            )}
          </div>
        )}

        {/* Google Auth Button */}
        <Button
          type="button"
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          onClick={async () => {
            const supabase = getSupabaseClient()
            await supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: typeof window !== "undefined"
                  ? `${window.location.origin}/dashboard`
                  : undefined,
              },
            })
          }}
        >
          <FcGoogle className="h-5 w-5" />
          Sign up with Google
        </Button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="email"
                placeholder="Email address"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="password"
                placeholder="Password"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="text-right">
              <button
                type="button"
                className="text-xs text-[#4B6EF5] hover:underline"
                onClick={() => setShowReset((v) => !v)}
              >
                Forgot password?
              </button>
            </div>
          </div>

          {showReset && (
            <div className="space-y-2 mb-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
              <Button
                type="button"
                className="w-full"
                variant="outline"
                onClick={handlePasswordReset}
              >
                Send password reset email
              </Button>
              {resetMessage && (
                <div className="text-xs text-center text-gray-600 mt-1">{resetMessage}</div>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] text-white hover:shadow-lg transition-all"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Account..." : "Sign Up"}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-[#4B6EF5] hover:underline">
              Log in
            </a>
          </p>
        </form>
        <Button asChild className="w-full mt-4 bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] text-white hover:shadow-lg transition-all">
          <a href="/">Back to Home</a>
        </Button>
      </Card>
    </div>
  )
} 