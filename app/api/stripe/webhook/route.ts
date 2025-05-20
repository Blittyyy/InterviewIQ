import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return new NextResponse("Webhook signature verification failed", { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const priceId = session.line_items?.data[0]?.price?.id

        if (!userId || !priceId) {
          throw new Error("Missing userId or priceId")
        }

        // Update user subscription status
        const { error } = await supabase
          .from("users")
          .update({
            subscription_status: priceId === process.env.STRIPE_PRO_PRICE_ID ? "pro" : "day-pass",
            subscription_end_date: priceId === process.env.STRIPE_DAY_PASS_PRICE_ID 
              ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
              : null,
          })
          .eq("id", userId)

        if (error) throw error
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) {
          throw new Error("Missing userId")
        }

        // Reset user to free plan
        const { error } = await supabase
          .from("users")
          .update({
            subscription_status: "free",
            subscription_end_date: null,
          })
          .eq("id", userId)

        if (error) throw error
        break
      }
    }

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 