import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Use the service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    console.log("Received Stripe event:", event.type)

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const stripeCustomerId = session.customer as string;
        console.log("Processing checkout.session.completed for userId:", userId)

        if (!userId) {
          console.error("Missing userId in session metadata")
          break
        }

        // Determine plan type by fetching the subscription and checking the price ID
        let plan = "pro";
        let priceId = null;
        const subscriptionId = session.subscription as string;
        let subscriptionStartDate = null;
        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            priceId = subscription.items.data[0].price.id;
            subscriptionStartDate = new Date(subscription.start_date * 1000).toISOString();
            if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID) {
              plan = "monthly";
            } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID) {
              plan = "annual";
            }
          } catch (err) {
            console.error("Error fetching subscription from Stripe:", err);
          }
        }

        // Log before updating
        console.log("Attempting to update user in Supabase:", userId, "with plan:", plan);

        // Save the Stripe customer ID if not already set
        if (userId && stripeCustomerId) {
          await supabase
            .from("users")
            .update({ stripe_customer_id: stripeCustomerId })
            .eq("id", userId);
        }

        // Ensure userId is set on the subscription for future events
        if (subscriptionId && userId) {
          try {
            await stripe.subscriptions.update(subscriptionId, {
              metadata: { userId },
            });
          } catch (err) {
            console.error("Error updating subscription metadata:", err);
          }
        }

        const { error } = await supabase
          .from("users")
          .update({
            subscription_status: "pro",
            subscription_expires: null,
            plan: plan,
            ...(subscriptionStartDate && { subscription_start_date: subscriptionStartDate }),
            trial_active: false,
          })
          .eq("id", userId)

        if (error) {
          console.error("Supabase update error:", error)
        } else {
          console.log("Supabase user updated successfully!")
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) {
          console.error("Missing userId in subscription metadata")
          break
        }

        const { error } = await supabase
          .from("users")
          .update({
            subscription_status: "free",
            subscription_expires: null,
            plan: "free",
          })
          .eq("id", userId)

        if (error) {
          console.error("Supabase update error:", error)
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (!userId) {
          console.error("Missing userId in subscription metadata");
          break;
        }
        // If the subscription is set to cancel at period end, update the user's subscription_end_date
        if (subscription.cancel_at_period_end && subscription.cancel_at) {
          const endDate = new Date(subscription.cancel_at * 1000).toISOString();
          const { error } = await supabase
            .from("users")
            .update({ subscription_end_date: endDate })
            .eq("id", userId);
          if (error) {
            console.error("Supabase update error:", error);
          } else {
            console.log("Supabase user updated with subscription_end_date!");
          }
        } else if (!subscription.cancel_at_period_end) {
          // If the user reactivates, clear the end date
          const { error } = await supabase
            .from("users")
            .update({ subscription_end_date: null })
            .eq("id", userId);
          if (error) {
            console.error("Supabase update error:", error);
          } else {
            console.log("Supabase user cleared subscription_end_date!");
          }
        }
        break;
      }

      default:
        // Log unhandled event types
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Always return 200 to acknowledge receipt of the event
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 