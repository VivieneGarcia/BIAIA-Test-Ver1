"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { motion } from "framer-motion"

export default function OnboardingPage() {
  const [user, setUser] = useState<any>(null)
  const [name, setName] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [symptoms, setSymptoms] = useState("")
  const [allergies, setAllergies] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const router = useRouter()

  useEffect(() => {
    async function getUser() {
      const { data: userData } = await supabase.auth.getUser()
      setUser(userData.user)

      if (userData.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userData.user.id)
          .single()

        // Only redirect if onboarding is marked complete
        if (profileData?.onboarding_complete) {
          router.push("/dashboard")
        }
      } else {
        router.push("/login")
      }
    }
    getUser()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (step !== 3) return

    if (!user) {
      setError("You must be logged in to complete onboarding")
      return
    }

    if (!dueDate) {
      setError("Please select your due date")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.from("profiles").upsert({
        user_id: user.id,
        name,
        due_date: dueDate.toISOString(),
        symptoms: symptoms ? symptoms.split(",").map((s) => s.trim()) : [],
        allergies: allergies ? allergies.split(",").map((a) => a.trim()) : [],
        onboarding_complete: true,
      }, { onConflict: 'user_id' })

      if (error) throw error

      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message || "Failed to complete onboarding")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    setDueDate(date)
  }

  const nextStep = () => {
    if (step === 1 && !name) {
      setError("Please enter your name")
      return
    }
    if (step === 2 && !dueDate) {
      setError("Please select your due date")
      return
    }
    setError(null)
    setStep(step + 1)
  }

  const prevStep = () => {
    setError(null)
    setStep(step - 1)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-gradient-to-b from-pink-50 to-white">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
            B
          </div>
          <CardTitle className="text-2xl font-bold text-center">Welcome to BIAIA</CardTitle>
          <CardDescription className="text-center">
            Let&apos;s get to know you better to personalize your experience
          </CardDescription>
          <div className="flex justify-center space-x-2 pt-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-2 w-${i === step ? "8" : "2"} rounded-full ${
                  i === step ? "bg-primary" : i < step ? "bg-primary/60" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-medium">Tell us about yourself</h2>
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="text-lg"
                      required
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-medium">When is your baby due?</h2>
                  <div className="space-y-2">
                    <Label htmlFor="due-date">Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal text-lg",
                            !dueDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={dueDate} onSelect={handleDateSelect} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-medium">Any health information to share?</h2>
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
                </div>
              )}
            </motion.div>

            <div className="flex justify-between pt-4">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={prevStep}>
                  Back
                </Button>
              ) : (
                <div></div>
              )}

              {step < 3 ? (
                <Button type="button" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Complete Onboarding"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-muted-foreground">This information helps us personalize your experience</div>
        </CardFooter>
      </Card>
    </div>
  )
}
