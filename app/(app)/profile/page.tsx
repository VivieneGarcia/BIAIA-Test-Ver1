"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarIcon, LogOut } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [name, setName] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [symptoms, setSymptoms] = useState("")
  const [allergies, setAllergies] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()

        if (!sessionData.session) {
          router.push("/login")
          return
        }

        setUser(sessionData.session.user)

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", sessionData.session.user.id)
          .single()

        if (error) {
          if (error.code === "PGRST116") {
            // Profile not found - redirect to onboarding
            router.push("/onboarding")
            return
          }
          throw error
        }

        if (data) {
          setProfile(data)
          setName(data.name)
          setDueDate(data.due_date ? new Date(data.due_date) : undefined)
          setSymptoms(data.symptoms ? data.symptoms.join(", ") : "")
          setAllergies(data.allergies ? data.allergies.join(", ") : "")
        }
      } catch (error: any) {
        console.error("Error fetching profile:", error.message)
        setError(error.message)
      }
    }

    fetchProfile()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError("You must be logged in to update your profile")
      return
    }

    if (!dueDate) {
      setError("Please select your due date")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name,
          due_date: dueDate.toISOString(),
          symptoms: symptoms ? symptoms.split(",").map((s) => s.trim()) : [],
          allergies: allergies ? allergies.split(",").map((a) => a.trim()) : [],
        })
        .eq("user_id", user.id)

      if (error) throw error

      setSuccess("Profile updated successfully")
    } catch (error: any) {
      setError(error.message || "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error: any) {
      console.error("Error signing out:", error.message)
    }
  }

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <Button variant="destructive" onClick={handleSignOut} className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="/placeholder.svg" alt={name} />
                  <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h2 className="mt-4 text-xl font-bold">{name}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="mt-4 w-full">
                  <div className="flex items-center justify-between border-t py-2">
                    <span className="text-sm font-medium">Due Date</span>
                    <span className="text-sm">{dueDate ? format(dueDate, "MMMM d, yyyy") : "Not set"}</span>
                  </div>
                  <div className="flex items-center justify-between border-t py-2">
                    <span className="text-sm font-medium">Member Since</span>
                    <span className="text-sm">{format(new Date(user?.created_at || Date.now()), "MMMM yyyy")}</span>
                  </div>
                </div>
                <Button asChild className="mt-6 w-full">
                  <a href="/settings">Edit Settings</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="profile">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile Information</TabsTrigger>
              <TabsTrigger value="medical">Medical Information</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {success && (
                      <Alert className="bg-green-50 text-green-800">
                        <AlertDescription>{success}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="due-date">Due Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !dueDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Saving..." : "Update Profile"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="medical" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Medical Information</CardTitle>
                  <CardDescription>Update your medical information</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="symptoms">Current Symptoms (comma separated)</Label>
                      <Textarea
                        id="symptoms"
                        placeholder="Nausea, fatigue, etc."
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="allergies">Allergies (comma separated)</Label>
                      <Textarea
                        id="allergies"
                        placeholder="Peanuts, shellfish, etc."
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Saving..." : "Update Medical Information"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
