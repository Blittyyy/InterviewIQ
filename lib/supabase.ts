import { createClient } from "@supabase/supabase-js"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/supabase"

// Validate public environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL")
if (!supabaseAnonKey) throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY")

// Create a singleton instance for the client-side Supabase client
let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

/**
 * Get the client-side Supabase client instance.
 * This should be used in client components and hooks.
 */
export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClientComponentClient<Database>()
  }
  return supabaseClient
}

/**
 * Create a server-side Supabase client instance.
 * This should be used in server components and API routes.
 */
export const createServerSupabaseClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseServiceKey) {
    throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY")
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Create a public Supabase client instance.
 * This can be used in both client and server contexts where public access is needed.
 */
export const createPublicSupabaseClient = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}
