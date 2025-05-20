import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function WaitlistConfirmation() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F7FE] to-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">You're on the list!</h1>
          <p className="text-gray-600">
            Thanks for joining our waitlist. We'll notify you as soon as InterviewIQ Pro is ready.
          </p>
        </div>

        <div className="pt-4">
          <Link href="/">
            <Button className="w-full bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] text-white hover:shadow-lg transition-all">
              Return to Homepage
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
} 