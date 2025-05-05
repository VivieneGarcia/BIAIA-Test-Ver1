"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function DebugPage() {
  const [supabaseStatus, setSupabaseStatus] = useState<"loading" | "success" | "error">("loading")
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<any>(null)
  const [envVars, setEnvVars] = useState({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓" : "✗",
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓" : "✗",
  })

  useEffect(() => {
    async function checkSupabase() {
      try {
        // Test Supabase connection
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        setSession(data.session)
        setSupabaseStatus("success")
      } catch (err: any) {
        console.error("Supabase connection error:", err)
        setSupabaseStatus("error")
        setError(err.message || "Failed to connect to Supabase")
      }
    }

    checkSupabase()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Supabase Debug Page</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>Check if Supabase environment variables are set</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>
                <span className="font-medium">NEXT_PUBLIC_SUPABASE_URL:</span>{" "}
                <span className={envVars.url === "✓" ? "text-green-600" : "text-red-600"}>{envVars.url}</span>
              </li>
              <li>
                <span className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>{" "}
                <span className={envVars.key === "✓" ? "text-green-600" : "text-red-600"}>{envVars.key}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supabase Connection</CardTitle>
            <CardDescription>Test connection to Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            {supabaseStatus === "loading" && <p>Testing connection...</p>}

            {supabaseStatus === "success" && (
              <Alert className="bg-green-50 text-green-800">
                <AlertDescription>Successfully connected to Supabase!</AlertDescription>
              </Alert>
            )}

            {supabaseStatus === "error" && (
              <Alert variant="destructive">
                <AlertDescription>Failed to connect to Supabase: {error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
            <CardDescription>Current authentication session</CardDescription>
          </CardHeader>
          <CardContent>
            {session ? (
              <div className="space-y-4">
                <Alert className="bg-green-50 text-green-800">
                  <AlertDescription>You are logged in!</AlertDescription>
                </Alert>

                <div>
                  <p className="font-medium">User ID:</p>
                  <p className="text-sm text-muted-foreground">{session.user.id}</p>
                </div>

                <div>
                  <p className="font-medium">Email:</p>
                  <p className="text-sm text-muted-foreground">{session.user.email}</p>
                </div>

                <Button onClick={handleSignOut} variant="outline">
                  Sign Out
                </Button>
              </div>
            ) : (
              <Alert>
                <AlertDescription>You are not logged in</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
