"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircleIcon, AlertCircle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import BackgroundBlobs from "@/components/BackgroundBlobs"

function LoadingState() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#F4F7FE] to-white px-4 relative overflow-hidden">
      <BackgroundBlobs />
      <div className="flex flex-col items-center space-y-2">
        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] animate-pulse mb-2" />
        <h1 className="text-xl font-semibold text-gray-900">Loading...</h1>
      </div>
    </div>
  )
}

function AuthCallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>("loading")
  const [errorMsg, setErrorMsg] = useState("")
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>("idle")
  const [resendMsg, setResendMsg] = useState("")
  const [emailInput, setEmailInput] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Try both 'code' and 'access_token' for compatibility
        const code = searchParams.get("code") || searchParams.get("access_token")
        if (!code) {
          setStatus("error")
          setErrorMsg("No confirmation code found in the URL.")
          return
        }
        const supabase = getSupabaseClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setStatus("error")
          setErrorMsg(error.message || "There was a problem confirming your email.")
        } else {
          setStatus("success")
        }
      } catch (error) {
        setStatus("error")
        setErrorMsg("An unexpected error occurred.")
      }
    }
    handleAuth()
  }, [searchParams])

  const handleResend = async () => {
    setResendStatus("loading")
    setResendMsg("")
    try {
      const email = searchParams.get("email") || emailInput
      if (!email) {
        setResendStatus("error")
        setResendMsg("Please enter your email address.")
        return
      }
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.resend({ type: "signup", email })
      if (error) {
        setResendStatus("error")
        setResendMsg(error.message || "Failed to resend confirmation email.")
      } else {
        setResendStatus("success")
        setResendMsg("Confirmation email sent! Please check your inbox.")
      }
    } catch (error) {
      setResendStatus("error")
      setResendMsg("An unexpected error occurred.")
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#F4F7FE] to-white px-4 relative overflow-hidden">
      <BackgroundBlobs />
      <Button asChild className="w-full max-w-md mb-6 bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] text-white hover:shadow-lg transition-all">
        <a href="/">Back to Home</a>
      </Button>
      <Card className="w-full max-w-md p-8 space-y-6 bg-white shadow-lg rounded-xl text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] animate-pulse mb-2" />
            <h1 className="text-xl font-semibold text-gray-900">Confirming your email...</h1>
            <p className="text-gray-600">Please wait while we confirm your account.</p>
          </div>
        )}
        {status === "success" && (
          <>
            <div className="flex flex-col items-center space-y-2">
              <CheckCircleIcon className="h-12 w-12 text-green-500 mb-2" />
              <h1 className="text-2xl font-bold text-gray-900">Email Confirmed!</h1>
              <p className="text-gray-600">Your email has been confirmed. You can now log in to your account.</p>
            </div>
            <Button asChild className="w-full bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] text-white hover:shadow-lg transition-all">
              <a href="/login">Go to Login</a>
            </Button>
          </>
        )}
        {status === "error" && (
          <div className="flex flex-col items-center space-y-2">
            <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
            <h1 className="text-2xl font-bold text-gray-900">Confirmation Failed</h1>
            <p className="text-gray-600">{errorMsg}</p>
            <div className="w-full flex flex-col items-center gap-2 mt-4">
              <input
                type="email"
                placeholder="Enter your email to resend"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4B6EF5]"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                required
              />
              <Button
                className="w-full bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] text-white hover:shadow-lg transition-all"
                onClick={handleResend}
                disabled={resendStatus === "loading"}
              >
                {resendStatus === "loading" ? "Resending..." : "Resend Confirmation Email"}
              </Button>
              {resendStatus === "success" && <p className="text-green-600 text-sm mt-2">{resendMsg}</p>}
              {resendStatus === "error" && <p className="text-red-600 text-sm mt-2">{resendMsg}</p>}
            </div>
            <Button asChild className="w-full bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] text-white hover:shadow-lg transition-all mt-4">
              <a href="/login">Go to Login</a>
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AuthCallbackContent />
    </Suspense>
  )
} 