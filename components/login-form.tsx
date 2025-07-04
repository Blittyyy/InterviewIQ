"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { MailIcon, LockIcon, AlertCircle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { FcGoogle } from "react-icons/fc"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetMessage, setResetMessage] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const supabase = getSupabaseClient()

      // Validate email format
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        throw new Error("Please enter a valid email address")
      }

      // Validate password
      if (!password) {
        throw new Error("Please enter your password")
      }

      // Sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password")
        }
        throw signInError
      }

      // After successful login, ensure user row exists
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const userId = session?.user?.id
      const userEmail = session?.user?.email
      if (userId && userEmail) {
        const { data: userData } = await supabase
          .from("users")
          .select("id")
          .eq("id", userId)
          .single()
        if (!userData) {
          await supabase.from("users").insert([
            {
              id: userId,
              email: userEmail,
              plan: "free",
              reports_generated: 0,
              daily_reports_count: 0,
            },
          ])
        }
      }

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      console.error("Login error:", err)
      setError(err instanceof Error ? err.message : "Failed to log in")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const supabase = getSupabaseClient()
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined"
            ? `${window.location.origin}/dashboard`
            : undefined,
        },
      })
    } catch (err) {
      console.error("Google sign-in error:", err)
      setError("Failed to sign in with Google")
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

  return (
    <div className="flex items-center justify-center w-full min-h-screen">
      <Card className="w-full max-w-md p-6 space-y-6 bg-white shadow-lg rounded-xl">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your InterviewIQ account</p>
        </div>

        {/* Google Auth Button */}
        <Button
          type="button"
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          onClick={handleGoogleSignIn}
        >
          <FcGoogle className="h-5 w-5" />
          Sign in with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Or continue with</span>
          </div>
        </div>

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

          {error && (
            <div className="flex items-center space-x-2 text-red-500 bg-red-50 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] text-white hover:shadow-lg transition-all"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <a href="/signup" className="text-[#4B6EF5] hover:underline">
              Sign up
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