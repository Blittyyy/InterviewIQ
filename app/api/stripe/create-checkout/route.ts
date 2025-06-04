import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

const PRICE_IDS = {
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  dayPass: process.env.STRIPE_DAY_PASS_PRICE_ID!,
}

export async function POST(request: Request) {
  try {
    const { priceId } = await request.json()
    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Determine mode based on priceId
    let mode: "payment" | "subscription" = "subscription"
    if (priceId === process.env.STRIPE_DAY_PASS_PRICE_ID) {
      mode = "payment"
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: session.user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        userId: session.user.id,
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 