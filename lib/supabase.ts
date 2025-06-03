import { createClient } from "@supabase/supabase-js"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/supabase"

// Validate public environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Enhanced validation to ensure URLs are properly formatted
const isValidUrl = (urlString: string) => {
  try {
    new URL(urlString)
    return true
  } catch (e) {
    return false
  }
}

if (!supabaseUrl || !isValidUrl(supabaseUrl)) {
  console.error("Invalid or missing NEXT_PUBLIC_SUPABASE_URL. Please check your environment variables.")
  throw new Error("Invalid or missing NEXT_PUBLIC_SUPABASE_URL")
}

if (!supabaseAnonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Please check your environment variables.")
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

// Create a singleton instance for the client-side Supabase client
let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

/**
 * Get the client-side Supabase client instance.
 * This should be used in client components and hooks.
 */
export const getSupabaseClient = () => {
  if (!supabaseClient) {
    try {
      supabaseClient = createClientComponentClient<Database>()
    } catch (error) {
      console.error("Failed to create Supabase client:", error)
      throw new Error("Failed to initialize Supabase client")
    }
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
  
  try {
    return createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  } catch (error) {
    console.error("Failed to create server Supabase client:", error)
    throw new Error("Failed to initialize server Supabase client")
  }
}

/**
 * Create a public Supabase client instance.
 * This can be used in both client and server contexts where public access is needed.
 */
export const createPublicSupabaseClient = () => {
  try {
    return createClient<Database>(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error("Failed to create public Supabase client:", error)
    throw new Error("Failed to initialize public Supabase client")
  }
}