import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Fetch the user's Stripe customer ID from your users table
    const { data: user } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", session.user.id)
      .single();
    if (!user?.stripe_customer_id) {
      return NextResponse.json({ error: "No Stripe customer ID found" }, { status: 400 });
    }
    // Create a customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/dashboard",
    });
    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating Stripe customer portal session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 