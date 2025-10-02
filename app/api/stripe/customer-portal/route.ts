import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/requireAuth";

// Initialize Stripe with error handling
let stripe: Stripe;
try {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
} catch (error) {
  console.error("Failed to initialize Stripe:", error);
  throw new Error("Stripe initialization failed");
}

export async function GET(request: NextRequest) {
  try {
    // Simple health check for customer portal endpoint
    return NextResponse.json({
      status: "ok",
      endpoint: "customer-portal",
      timestamp: new Date().toISOString(),
      environment: {
        STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: "Health check failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for required environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY is not set");
      return NextResponse.json({ error: "Stripe configuration missing" }, { status: 500 });
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error("NEXT_PUBLIC_SUPABASE_URL is not set");
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 });
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not set");
      return NextResponse.json({ error: "Supabase service role key missing" }, { status: 500 });
    }

    // Use JWT authentication from the Authorization header
    const { user, error } = await requireAuth(request);
    if (error || !user) {
      console.error("Authentication error:", error);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use the service role key for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch the user's Stripe customer ID from your users table
    const { data: dbUser, error: dbError } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!dbUser?.stripe_customer_id) {
      console.error("No Stripe customer ID found for user:", user.id);
      return NextResponse.json({ 
        error: "No Stripe customer ID found",
        userId: user.id,
        userEmail: user.email 
      }, { status: 400 });
    }

    console.log("Creating portal session for customer:", dbUser.stripe_customer_id);

    // Test Stripe customer exists first
    try {
      const customer = await stripe.customers.retrieve(dbUser.stripe_customer_id);
      console.log("Customer found:", customer.id);
    } catch (customerError) {
      console.error("Customer not found in Stripe:", customerError);
      return NextResponse.json({ 
        error: "Customer not found in Stripe",
        customerId: dbUser.stripe_customer_id,
        stripeError: customerError instanceof Error ? customerError.message : "Unknown error"
      }, { status: 400 });
    }

    // Create a customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripe_customer_id,
      return_url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/dashboard",
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating Stripe customer portal session:", error);
    
    // Return more detailed error information for debugging
    const errorResponse = {
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 