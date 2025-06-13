import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/requireAuth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    // Use JWT authentication from the Authorization header
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Use the service role key for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    // Fetch the user's Stripe customer ID from your users table
    const { data: dbUser } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();
    if (!dbUser?.stripe_customer_id) {
      return NextResponse.json({ error: "No Stripe customer ID found" }, { status: 400 });
    }
    // Create a customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripe_customer_id,
      return_url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/dashboard",
    });
    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating Stripe customer portal session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 