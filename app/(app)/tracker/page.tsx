"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { differenceInWeeks, differenceInDays, parseISO, format, addWeeks } from "date-fns"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { BabyDevelopmentImage } from "@/components/baby-development-image"
import { Calendar } from "lucide-react"

// Define types for better type safety
type Profile = {
  name: string
  due_date: string
  symptoms: string[]
  allergies: string[]
}

type WeeklyTip = {
  week_number: number
  baby_development: string
  mother_development: string
  advice: string
}

export default function TrackerPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [weeklyTips, setWeeklyTips] = useState<WeeklyTip | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pregnancyWeek, setPregnancyWeek] = useState<number>(1)
  const [daysInCurrentWeek, setDaysInCurrentWeek] = useState<number>(0)
  const [gestationDays, setGestationDays] = useState<number>(0)
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

        setProfile(profileData as Profile)

        // Calculate current week of pregnancy and gestation days
        const currentDate = new Date()
        const dueDate = parseISO(profileData.due_date)
        const conceptionDate = addWeeks(dueDate, -40) // Estimate conception date

        // Calculate weeks and days
        const week = Math.min(40, Math.max(1, 40 - differenceInWeeks(dueDate, currentDate)))
        const totalDays = differenceInDays(currentDate, conceptionDate)
        const daysInWeek = totalDays % 7

        setPregnancyWeek(week)
        setDaysInCurrentWeek(daysInWeek)
        setGestationDays(totalDays)

        // Fetch weekly tips for the current week
        const { data: tipsData, error: tipsError } = await supabase
          .from("weekly_tips")
          .select("*")
          .eq("week_number", week)
          .single()

        if (tipsError) {
          // If no specific week data, use placeholder data
          setWeeklyTips({
            week_number: week,
            baby_development: `During week ${week}, your baby continues to develop and grow.`,
            mother_development: `Your body is adapting to support your growing baby during week ${week}.`,
            advice: `Stay hydrated, eat nutritious foods, and get plenty of rest during week ${week}.`,
          })
        } else {
          setWeeklyTips(tipsData as WeeklyTip)
        }
      } catch (err: any) {
        console.error("Error loading tracker data:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load tracker data: {error}</p>
            <button
              onClick={() => router.refresh()}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile || !weeklyTips) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No profile or weekly tips data found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Generate weeks for the timeline
  const weeks = Array.from({ length: 40 }, (_, i) => i + 1)

  // Calculate trimester
  let trimester = 1
  if (pregnancyWeek > 13 && pregnancyWeek <= 26) {
    trimester = 2
  } else if (pregnancyWeek > 26) {
    trimester = 3
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Pregnancy Tracker</h1>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gestation">Gestation</TabsTrigger>
          <TabsTrigger value="development">Development</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
              <CardDescription>Week {pregnancyWeek} of 40</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4 h-4 overflow-hidden rounded-full bg-secondary">
                <div
                  className="absolute left-0 top-0 h-full bg-primary"
                  style={{ width: `${(pregnancyWeek / 40) * 100}%` }}
                />
              </div>

              <div className="mt-8 overflow-x-auto">
                <div className="flex min-w-max space-x-1">
                  {weeks.map((week) => (
                    <div
                      key={week}
                      className={`flex h-16 w-8 flex-col items-center justify-center rounded-md text-xs ${
                        week === pregnancyWeek
                          ? "bg-primary text-primary-foreground"
                          : week < pregnancyWeek
                            ? "bg-primary/20"
                            : "bg-muted"
                      }`}
                    >
                      <span className="font-medium">{week}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Baby Development</CardTitle>
                <CardDescription>Week {pregnancyWeek}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{weeklyTips.baby_development}</p>

                <div className="mt-4 rounded-md bg-muted p-3 text-sm">
                  <p className="font-medium">Trimester {trimester}</p>
                  {trimester === 1 && (
                    <p className="mt-1">During this period, your baby's major organs and body systems are forming.</p>
                  )}
                  {trimester === 2 && (
                    <p className="mt-1">Your baby is growing rapidly and you may start to feel movement.</p>
                  )}
                  {trimester === 3 && <p className="mt-1">Your baby is gaining weight and preparing for birth.</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mother's Development</CardTitle>
                <CardDescription>Week {pregnancyWeek}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{weeklyTips.mother_development}</p>

                <div className="mt-4 rounded-md bg-muted p-3 text-sm">
                  <p className="font-medium">Common Symptoms at Week {pregnancyWeek}</p>
                  {pregnancyWeek <= 13 && (
                    <ul className="mt-1 list-inside list-disc">
                      <li>Morning sickness</li>
                      <li>Fatigue</li>
                      <li>Breast tenderness</li>
                      <li>Frequent urination</li>
                    </ul>
                  )}

                  {pregnancyWeek > 13 && pregnancyWeek <= 26 && (
                    <ul className="mt-1 list-inside list-disc">
                      <li>Increased energy</li>
                      <li>Baby movements</li>
                      <li>Backaches</li>
                      <li>Stretch marks</li>
                    </ul>
                  )}

                  {pregnancyWeek > 26 && (
                    <ul className="mt-1 list-inside list-disc">
                      <li>Shortness of breath</li>
                      <li>Braxton Hicks contractions</li>
                      <li>Swelling in feet and ankles</li>
                      <li>Trouble sleeping</li>
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Advice for Week {pregnancyWeek}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{weeklyTips.advice}</p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-md bg-green-50 dark:bg-green-950 p-4">
                  <h3 className="font-medium text-green-800 dark:text-green-300">Do's</h3>
                  <ul className="mt-2 list-inside list-disc text-sm text-green-700 dark:text-green-400">
                    <li>Stay hydrated by drinking plenty of water</li>
                    <li>Eat a balanced diet rich in fruits, vegetables, and protein</li>
                    <li>Take prenatal vitamins as prescribed</li>
                    <li>Get regular, gentle exercise as approved by your doctor</li>
                    <li>Get adequate rest and sleep</li>
                  </ul>
                </div>

                <div className="rounded-md bg-red-50 dark:bg-red-950 p-4">
                  <h3 className="font-medium text-red-800 dark:text-red-300">Don'ts</h3>
                  <ul className="mt-2 list-inside list-disc text-sm text-red-700 dark:text-red-400">
                    <li>Avoid alcohol and smoking</li>
                    <li>Limit caffeine intake</li>
                    <li>Avoid raw or undercooked meats and fish</li>
                    <li>Avoid hot tubs and saunas</li>
                    <li>Don't take medications without consulting your doctor</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gestation">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Gestation Details</CardTitle>
                <CardDescription>Tracking your pregnancy by days and weeks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Current Gestation</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{pregnancyWeek}</span>
                    <span className="text-xl">weeks</span>
                    <span className="text-4xl font-bold ml-2">{daysInCurrentWeek}</span>
                    <span className="text-xl">days</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">That's {gestationDays} days since conception</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Week Progress</h3>
                  <Progress value={(daysInCurrentWeek / 7) * 100} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-1">
                    Day {daysInCurrentWeek + 1} of week {pregnancyWeek}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Trimester</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div
                      className={`rounded-md p-3 text-center ${trimester === 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    >
                      <p className="font-medium">First</p>
                      <p className="text-xs">Weeks 1-13</p>
                    </div>
                    <div
                      className={`rounded-md p-3 text-center ${trimester === 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    >
                      <p className="font-medium">Second</p>
                      <p className="text-xs">Weeks 14-26</p>
                    </div>
                    <div
                      className={`rounded-md p-3 text-center ${trimester === 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    >
                      <p className="font-medium">Third</p>
                      <p className="text-xs">Weeks 27-40</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Important Dates</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Due Date</span>
                      </div>
                      <span className="font-medium">{format(parseISO(profile.due_date), "MMMM d, yyyy")}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Estimated Conception</span>
                      </div>
                      <span className="font-medium">
                        {format(addWeeks(parseISO(profile.due_date), -40), "MMMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>End of First Trimester</span>
                      </div>
                      <span className="font-medium">
                        {format(addWeeks(addWeeks(parseISO(profile.due_date), -40), 13), "MMMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>End of Second Trimester</span>
                      </div>
                      <span className="font-medium">
                        {format(addWeeks(addWeeks(parseISO(profile.due_date), -40), 26), "MMMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pregnancy Calendar</CardTitle>
                <CardDescription>Your 40-week journey</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 40 }, (_, i) => i + 1).map((week) => (
                    <div
                      key={week}
                      className={`
                        rounded-md p-2 text-center border
                        ${
                          week === pregnancyWeek
                            ? "bg-primary text-primary-foreground border-primary"
                            : week < pregnancyWeek
                              ? "bg-primary/10 border-primary/20"
                              : "bg-card border-muted"
                        }
                      `}
                    >
                      <p className="font-medium">Week {week}</p>
                      <p className="text-xs">{week <= 13 ? "T1" : week <= 26 ? "T2" : "T3"}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Pregnancy Milestones</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                        8
                      </div>
                      <div>
                        <p className="font-medium">Heartbeat Detectable</p>
                        <p className="text-xs text-muted-foreground">Week 8</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                        12
                      </div>
                      <div>
                        <p className="font-medium">End of First Trimester</p>
                        <p className="text-xs text-muted-foreground">Week 12</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                        20
                      </div>
                      <div>
                        <p className="font-medium">Anatomy Scan</p>
                        <p className="text-xs text-muted-foreground">Week 20</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                        24
                      </div>
                      <div>
                        <p className="font-medium">Viability</p>
                        <p className="text-xs text-muted-foreground">Week 24</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                        28
                      </div>
                      <div>
                        <p className="font-medium">Third Trimester Begins</p>
                        <p className="text-xs text-muted-foreground">Week 28</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                        37
                      </div>
                      <div>
                        <p className="font-medium">Full Term</p>
                        <p className="text-xs text-muted-foreground">Week 37</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="development">
          <Card>
            <CardHeader>
              <CardTitle>Baby's Development</CardTitle>
              <CardDescription>Week {pregnancyWeek}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex flex-col items-center justify-center">
                  <BabyDevelopmentImage week={pregnancyWeek} size="Size varies by week" className="mb-4" />
                  <div className="text-center">
                    <h3 className="font-medium">Size Comparison</h3>
                    <p className="text-sm text-muted-foreground">
                      {pregnancyWeek <= 8 && "Your baby is about the size of a kidney bean"}
                      {pregnancyWeek > 8 && pregnancyWeek <= 12 && "Your baby is about the size of a lime"}
                      {pregnancyWeek > 12 && pregnancyWeek <= 16 && "Your baby is about the size of an avocado"}
                      {pregnancyWeek > 16 && pregnancyWeek <= 20 && "Your baby is about the size of a banana"}
                      {pregnancyWeek > 20 && pregnancyWeek <= 24 && "Your baby is about the size of a corn on the cob"}
                      {pregnancyWeek > 24 && pregnancyWeek <= 28 && "Your baby is about the size of an eggplant"}
                      {pregnancyWeek > 28 && pregnancyWeek <= 32 && "Your baby is about the size of a squash"}
                      {pregnancyWeek > 32 && pregnancyWeek <= 36 && "Your baby is about the size of a honeydew melon"}
                      {pregnancyWeek > 36 && "Your baby is about the size of a watermelon"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Development Highlights</h3>
                    <p className="text-sm mt-1">{weeklyTips.baby_development}</p>
                  </div>

                  <div>
                    <h3 className="font-medium">What's Happening This Week</h3>
                    <ul className="list-disc list-inside text-sm mt-1">
                      {pregnancyWeek <= 8 && (
                        <>
                          <li>Tiny fingers and toes are forming</li>
                          <li>Baby's heart is beating rapidly</li>
                          <li>Major organs are beginning to develop</li>
                        </>
                      )}
                      {pregnancyWeek > 8 && pregnancyWeek <= 12 && (
                        <>
                          <li>All essential organs have formed</li>
                          <li>Baby can make facial expressions</li>
                          <li>Fingernails and toenails are growing</li>
                        </>
                      )}
                      {pregnancyWeek > 12 && pregnancyWeek <= 16 && (
                        <>
                          <li>Baby can make sucking motions</li>
                          <li>Baby may start growing hair</li>
                          <li>Skeleton is forming from cartilage to bone</li>
                        </>
                      )}
                      {pregnancyWeek > 16 && pregnancyWeek <= 20 && (
                        <>
                          <li>You might feel the baby's movements</li>
                          <li>Baby can hear sounds outside the womb</li>
                          <li>Baby is developing a sleep cycle</li>
                        </>
                      )}
                      {pregnancyWeek > 20 && pregnancyWeek <= 24 && (
                        <>
                          <li>Baby's face is fully formed</li>
                          <li>Taste buds are developing</li>
                          <li>Fingerprints and footprints are forming</li>
                        </>
                      )}
                      {pregnancyWeek > 24 && pregnancyWeek <= 28 && (
                        <>
                          <li>Baby can open and close their eyes</li>
                          <li>Baby may have regular sleep cycles</li>
                          <li>Lungs are developing rapidly</li>
                        </>
                      )}
                      {pregnancyWeek > 28 && pregnancyWeek <= 32 && (
                        <>
                          <li>Baby is practicing breathing movements</li>
                          <li>Baby is gaining weight rapidly</li>
                          <li>Brain development is accelerating</li>
                        </>
                      )}
                      {pregnancyWeek > 32 && pregnancyWeek <= 36 && (
                        <>
                          <li>Baby is running out of room to move</li>
                          <li>Baby is preparing for birth</li>
                          <li>Most organs are fully developed</li>
                        </>
                      )}
                      {pregnancyWeek > 36 && (
                        <>
                          <li>Baby is fully developed and ready to meet you</li>
                          <li>Baby continues to gain weight</li>
                          <li>Baby is usually positioned head-down</li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium">Mother's Experience</h3>
                    <p className="text-sm mt-1">{weeklyTips.mother_development}</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => router.push("/baby-development")}>
                View Detailed Development Timeline
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
