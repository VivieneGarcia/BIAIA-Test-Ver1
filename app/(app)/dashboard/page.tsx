"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { differenceInWeeks, differenceInDays, parseISO, format } from "date-fns"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Database, Calendar, ArrowRight } from "lucide-react"
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

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<"database" | "auth" | "other" | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        // First check if user is authenticated
        const { data: sessionData } = await supabase.auth.getSession()

        if (!sessionData.session) {
          console.log("No session found, redirecting to login")
          router.push("/login")
          return
        }

        const userId = sessionData.session.user.id
        console.log("User authenticated:", userId)

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single()

        if (profileError) {
          // Check if this is a "relation does not exist" error
          if (profileError.message && profileError.message.includes("does not exist")) {
            console.error("Database tables not created:", profileError.message)
            setError(profileError.message)
            setErrorType("database")
            setLoading(false)
            return
          }

          if (profileError.code === "PGRST116") {
            // Profile not found - redirect to onboarding
            console.log("Profile not found, redirecting to onboarding")
            router.push("/onboarding")
            return
          }
          throw profileError
        }

        setProfile(profileData)
        console.log("Profile loaded:", profileData)

        // Fetch appointments
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from("appointments")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: true })
          .limit(3)

        if (appointmentsError) {
          // Ignore appointment errors if it's just that the table doesn't exist
          if (!appointmentsError.message.includes("does not exist")) {
            throw appointmentsError
          }
        } else {
          setAppointments(appointmentsData || [])
          console.log("Appointments loaded:", appointmentsData?.length || 0)
        }
      } catch (err: any) {
        console.error("Error loading dashboard data:", err)
        setError(err.message)

        if (err.message && err.message.includes("does not exist")) {
          setErrorType("database")
        } else if (err.message && err.message.includes("auth")) {
          setErrorType("auth")
        } else {
          setErrorType("other")
        }
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
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (errorType === "database") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Setup Required
            </CardTitle>
            <CardDescription>
              Your Supabase database tables need to be created before you can use the application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Database Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">How to fix this:</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Go to your{" "}
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Supabase Dashboard
                  </a>
                </li>
                <li>Select your project</li>
                <li>Go to the SQL Editor</li>
                <li>Create a new query</li>
                <li>Copy and paste the SQL script below</li>
                <li>Run the query to create all required tables</li>
              </ol>

              <div className="bg-muted p-4 rounded-md overflow-auto max-h-60">
                <pre className="text-xs">
                  {`-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  due_date DATE NOT NULL,
  symptoms TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}'
);

-- Create appointments table if it doesn't exist
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  notes TEXT,
  reminder BOOLEAN DEFAULT TRUE
);

-- Create journal_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  mood_type TEXT NOT NULL CHECK (mood_type IN ('positive', 'negative', 'neutral')),
  mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 10),
  date DATE NOT NULL
);

-- Create weekly_tips table if it doesn't exist
CREATE TABLE IF NOT EXISTS weekly_tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_number INTEGER NOT NULL UNIQUE CHECK (week_number >= 1 AND week_number <= 40),
  baby_development TEXT NOT NULL,
  mother_development TEXT NOT NULL,
  advice TEXT NOT NULL
);

-- Add RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_tips ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Appointments policies
CREATE POLICY "Users can view their own appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appointments"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments"
  ON appointments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments"
  ON appointments FOR DELETE
  USING (auth.uid() = user_id);

-- Journal entries policies
CREATE POLICY "Users can view their own journal entries"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries"
  ON journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries"
  ON journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Weekly tips policies (everyone can view)
CREATE POLICY "Anyone can view weekly tips"
  ON weekly_tips FOR SELECT
  USING (true);

-- Insert some sample weekly tips data if the table is empty
INSERT INTO weekly_tips (week_number, baby_development, mother_development, advice)
SELECT 
  week_num,
  'During week ' || week_num || ', your baby continues to develop and grow.',
  'Your body is adapting to support your growing baby during week ' || week_num || '.',
  'Stay hydrated, eat nutritious foods, and get plenty of rest during week ' || week_num || '.'
FROM generate_series(1, 40) AS week_num
WHERE NOT EXISTS (SELECT 1 FROM weekly_tips WHERE week_number = week_num);`}
                </pre>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/debug")}>
              Debug Connection
            </Button>
            <Button onClick={() => router.refresh()}>Try Again After Setup</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 flex justify-between">
              <Button onClick={() => router.refresh()}>Try Again</Button>
              <Button variant="outline" onClick={() => router.push("/debug")}>
                Debug Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>We couldn't find your profile. Please complete the onboarding process.</p>
            <Button className="mt-4 w-full" onClick={() => router.push("/onboarding")}>
              Go to Onboarding
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate current week of pregnancy
  const currentDate = new Date()
  const dueDate = parseISO(profile.due_date)
  const pregnancyWeek = Math.min(40, Math.max(1, 40 - differenceInWeeks(dueDate, currentDate)))
  const daysRemaining = Math.max(0, differenceInDays(dueDate, currentDate))
  const progress = (pregnancyWeek / 40) * 100

  // Get baby development data for current week
  const babyDevelopment =
    babyDevelopmentData.find((data) => data.week >= pregnancyWeek) ||
    babyDevelopmentData[babyDevelopmentData.length - 1]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome, {profile.name}</h1>
        <p className="text-muted-foreground">Here's your pregnancy journey at a glance</p>
      </div>

      {/* Pregnancy Progress and Days Remaining */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Your Progress</CardTitle>
            <CardDescription>Week {pregnancyWeek} of 40</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-4 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span>Week 1</span>
              <span>Week 40</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-primary" />
              Days Until Due Date
            </CardTitle>
            <CardDescription>{format(dueDate, "MMMM d, yyyy")}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">{daysRemaining}</div>
              <p className="mt-2 text-muted-foreground">days remaining</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Baby Development Section */}
      <Card className="mb-6 overflow-hidden">
        <CardHeader className="pb-2 bg-muted/30">
          <CardTitle>Baby's Development</CardTitle>
          <CardDescription>Week {pregnancyWeek}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid md:grid-cols-2">
            <div className="p-6 flex items-center justify-center">
              <BabyDevelopmentImage week={pregnancyWeek} size={babyDevelopment.size} className="mb-2" />
            </div>
            <div className="p-6 bg-card">
              <h3 className="font-medium mb-2">This Week's Development</h3>
              <p className="text-muted-foreground mb-4">{babyDevelopment.description}</p>
              <Button variant="outline" asChild className="w-full mt-2">
                <Link href="/baby-development" className="flex items-center justify-center">
                  View Detailed Development <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Your scheduled appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {appointments.length > 0 ? (
              <ul className="space-y-4">
                {appointments.map((appointment) => (
                  <li key={appointment.id} className="flex justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{appointment.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                      </p>
                    </div>
                    {appointment.reminder && (
                      <span className="inline-flex items-center rounded-xl bg-pink-100 px-3 py-0.5 text-xs font-medium text-pink-700 shadow-sm" >
                      Reminder Set
                    </span>
                    
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No upcoming appointments</p>
            )}
            <Button asChild className="mt-4 w-full">
              <Link href="/appointments">Schedule Appointment</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pregnancy Tips</CardTitle>
            <CardDescription>Do's and Don'ts for Week {pregnancyWeek}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-green-600">Do's</h3>
                <ul className="ml-5 list-disc space-y-1 text-sm">
                  <li>Stay hydrated by drinking plenty of water</li>
                  <li>Take prenatal vitamins as prescribed</li>
                  <li>Get adequate rest and sleep</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-red-600">Don'ts</h3>
                <ul className="ml-5 list-disc space-y-1 text-sm">
                  <li>Avoid alcohol and smoking</li>
                  <li>Limit caffeine intake</li>
                  <li>Avoid raw or undercooked foods</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="outline" asChild>
                <Link href="/tracker">Weekly Tracker</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/chat">Ask AI Assistant</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Safe Exercises</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="ml-5 list-disc space-y-1 text-sm">
              <li>Walking</li>
              <li>Swimming</li>
              <li>Prenatal yoga</li>
              <li>Stationary cycling</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Journal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Track your mood and experiences</p>
            <Button asChild className="mt-4 w-full">
              <Link href="/journal">Write Entry</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>AI Assistant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Have questions? Ask our AI assistant</p>
            <Button asChild className="mt-4 w-full">
              <Link href="/chat">Start Chat</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
