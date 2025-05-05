// Define types for the application
export type Notification = {
  id: string
  title: string
  description: string
  type: "appointment" | "message" | "reminder" | "tip"
  read: boolean
  date: Date
  expiresAt?: Date // Optional expiration date
}

export type Profile = {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  name: string
  due_date: string
  symptoms: string[] | null
  allergies: string[] | null
}

export type Appointment = {
  id: string
  created_at: string
  user_id: string
  title: string
  date: string
  time: string
  notes: string | null
  reminder: boolean
}

export type JournalEntry = {
  id: string
  created_at: string
  user_id: string
  title: string
  description: string
  mood_type: "positive" | "negative" | "neutral"
  mood_score: number
  date: string
}

export type WeeklyTip = {
  id: string
  week_number: number
  baby_development: string
  mother_development: string
  advice: string
}
