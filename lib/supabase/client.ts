import { createClient } from "@supabase/supabase-js"
import type { Database } from "./schema"

// Make sure these environment variables are correctly set in your Vercel project
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Add console logs to debug environment variables (will only show on client)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables:", {
    url: supabaseUrl ? "✓" : "✗",
    key: supabaseAnonKey ? "✓" : "✗",
  })
}

export const supabase = createClient<Database>(supabaseUrl || "", supabaseAnonKey || "")
