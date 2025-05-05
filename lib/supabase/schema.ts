export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          name: string
          due_date: string
          symptoms: string[] | null
          allergies: string[] | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          name: string
          due_date: string
          symptoms?: string[] | null
          allergies?: string[] | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          name?: string
          due_date?: string
          symptoms?: string[] | null
          allergies?: string[] | null
        }
      }
      appointments: {
        Row: {
          id: string
          created_at: string
          user_id: string
          title: string
          date: string
          time: string
          notes: string | null
          reminder: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          title: string
          date: string
          time: string
          notes?: string | null
          reminder?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          title?: string
          date?: string
          time?: string
          notes?: string | null
          reminder?: boolean
        }
      }
      journal_entries: {
        Row: {
          id: string
          created_at: string
          user_id: string
          title: string
          description: string
          mood_type: "positive" | "negative" | "neutral"
          mood_score: number
          date: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          title: string
          description: string
          mood_type: "positive" | "negative" | "neutral"
          mood_score: number
          date: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          title?: string
          description?: string
          mood_type?: "positive" | "negative" | "neutral"
          mood_score?: number
          date?: string
        }
      }
      weekly_tips: {
        Row: {
          id: string
          week_number: number
          baby_development: string
          mother_development: string
          advice: string
        }
        Insert: {
          id?: string
          week_number: number
          baby_development: string
          mother_development: string
          advice: string
        }
        Update: {
          id?: string
          week_number?: number
          baby_development?: string
          mother_development?: string
          advice?: string
        }
      }
    }
  }
}
