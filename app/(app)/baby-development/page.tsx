"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { differenceInWeeks, parseISO } from "date-fns"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BabyDevelopmentImage } from "@/components/baby-development-image"

// Baby development data with size comparisons and descriptions
const babyDevelopmentData = [
  {
    week: 4,
    size: "Poppy seed",
    length: "0.04 inches",
    weight: "<0.04 oz",
    description: "The embryo is developing the neural tube, which will become the brain and spinal cord.",
  },
  {
    week: 8,
    size: "Kidney bean",
    length: "0.6 inches",
    weight: "<0.1 oz",
    description: "Tiny fingers and toes are forming, and the baby's heart is beating rapidly.",
  },
  {
    week: 12,
    size: "Lime",
    length: "2.1 inches",
    weight: "0.5 oz",
    description: "All essential organs have formed, and the baby can make facial expressions.",
  },
  {
    week: 16,
    size: "Avocado",
    length: "4.6 inches",
    weight: "3.5 oz",
    description: "The baby can make sucking motions and may start growing hair.",
  },
  {
    week: 20,
    size: "Banana",
    length: "6.5 inches",
    weight: "10.2 oz",
    description: "You might feel the baby's movements. The baby can hear sounds outside the womb.",
  },
  {
    week: 24,
    size: "Corn on the cob",
    length: "11.8 inches",
    weight: "1.3 lbs",
    description: "The baby's face is fully formed, and taste buds are developing.",
  },
  {
    week: 28,
    size: "Eggplant",
    length: "14.8 inches",
    weight: "2.2 lbs",
    description: "The baby can open and close their eyes and may have regular sleep cycles.",
  },
  {
    week: 32,
    size: "Squash",
    length: "16.7 inches",
    weight: "3.8 lbs",
    description: "The baby is practicing breathing movements and gaining weight rapidly.",
  },
  {
    week: 36,
    size: "Honeydew melon",
    length: "18.7 inches",
    weight: "5.8 lbs",
    description: "The baby is running out of room to move and is preparing for birth.",
  },
  {
    week: 40,
    size: "Watermelon",
    length: "20.2 inches",
    weight: "7.6 lbs",
    description: "The baby is fully developed and ready to meet you!",
  },
]

export default function BabyDevelopmentPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState<number>(1)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        // Check if user is authenticated
        const { data: sessionData } = await supabase.auth.getSession()

        if (!sessionData.session) {
          router.push("/login")
          return
        }

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", sessionData.session.user.id)
          .single()

        if (profileError) {
          if (profileError.code === "PGRST116") {
            router.push("/onboarding")
            return
          }
          throw profileError
        }

        setProfile(profileData)

        // Calculate current week of pregnancy
        const currentDate = new Date()
        const dueDate = parseISO(profileData.due_date)
        const pregnancyWeek = Math.min(40, Math.max(1, 40 - differenceInWeeks(dueDate, currentDate)))
        setCurrentWeek(pregnancyWeek)
      } catch (err) {
        console.error("Error loading data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading baby development information...</p>
        </div>
      </div>
    )
  }

  // Group weeks by trimester
  const firstTrimester = Array.from({ length: 13 }, (_, i) => i + 1)
  const secondTrimester = Array.from({ length: 14 }, (_, i) => i + 14)
  const thirdTrimester = Array.from({ length: 13 }, (_, i) => i + 28)

  // Get development data for the selected week
  const getDevelopmentData = (week: number) => {
    return babyDevelopmentData.find((data) => data.week >= week) || babyDevelopmentData[babyDevelopmentData.length - 1]
  }

  const selectedWeekData = getDevelopmentData(currentWeek)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Baby Development</h1>

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current Week ({currentWeek})</TabsTrigger>
          <TabsTrigger value="timeline">Development Timeline</TabsTrigger>
          <TabsTrigger value="milestones">Key Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle>Week {currentWeek}: Your Baby Now</CardTitle>
              <CardDescription>Your baby is the size of a {selectedWeekData.size}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2">
                <div className="p-6 flex items-center justify-center">
                  <BabyDevelopmentImage week={currentWeek} size={selectedWeekData.size} />
                </div>
                <div className="p-6 bg-card">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Size & Weight</h3>
                      <p className="text-muted-foreground">
                        Length: {selectedWeekData.length} | Weight: {selectedWeekData.weight}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">Development</h3>
                      <p className="text-muted-foreground">{selectedWeekData.description}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">What's Happening This Week</h3>
                      <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
                        <li>Your baby's organs continue to mature</li>
                        <li>The nervous system is developing rapidly</li>
                        <li>Your baby may be able to hear your voice</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Pregnancy Timeline</CardTitle>
              <CardDescription>Track your baby's development throughout your pregnancy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 text-lg font-medium">First Trimester (Weeks 1-13)</h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {firstTrimester.map((week) => (
                      <Button
                        key={week}
                        variant={week === currentWeek ? "default" : "outline"}
                        className="h-auto py-2"
                        onClick={() => setCurrentWeek(week)}
                      >
                        Week {week}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Second Trimester (Weeks 14-27)</h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {secondTrimester.map((week) => (
                      <Button
                        key={week}
                        variant={week === currentWeek ? "default" : "outline"}
                        className="h-auto py-2"
                        onClick={() => setCurrentWeek(week)}
                      >
                        Week {week}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Third Trimester (Weeks 28-40)</h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {thirdTrimester.map((week) => (
                      <Button
                        key={week}
                        variant={week === currentWeek ? "default" : "outline"}
                        className="h-auto py-2"
                        onClick={() => setCurrentWeek(week)}
                      >
                        Week {week}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <CardTitle>Key Development Milestones</CardTitle>
              <CardDescription>Important stages in your baby's growth</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {babyDevelopmentData.map((milestone) => (
                  <div key={milestone.week} className="flex items-start gap-4 border-b pb-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      {milestone.week}
                    </div>
                    <div>
                      <h3 className="font-medium">
                        Week {milestone.week}: Size of a {milestone.size}
                      </h3>
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
