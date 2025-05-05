"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import type { Notification, Appointment, Profile } from "@/lib/types"
import { addDays, differenceInDays, parseISO, format, isAfter } from "date-fns"

type NotificationContextType = {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  deleteAllNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [lastJournalDate, setLastJournalDate] = useState<Date | null>(null)

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length

  // Load user data and generate notifications
  useEffect(() => {
    async function loadUserData() {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) return

      const uid = sessionData.session.user.id
      setUserId(uid)

      // Fetch profile
      const { data: profileData } = await supabase.from("profiles").select("*").eq("user_id", uid).single()

      if (profileData) {
        setProfile(profileData as Profile)
      }

      // Fetch appointments
      const { data: appointmentsData } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", uid)
        .order("date", { ascending: true })

      if (appointmentsData) {
        setAppointments(appointmentsData as Appointment[])
      }

      // Fetch last journal entry
      const { data: journalData } = await supabase
        .from("journal_entries")
        .select("date")
        .eq("user_id", uid)
        .order("date", { ascending: false })
        .limit(1)

      if (journalData && journalData.length > 0) {
        setLastJournalDate(new Date(journalData[0].date))
      }
    }

    loadUserData()
  }, [])

  // Generate notifications based on data
  useEffect(() => {
    const newNotifications: Notification[] = []
    const today = new Date()

    // Load saved notifications from localStorage
    const savedNotifications = localStorage.getItem("biaia_notifications")
    let existingNotifications: Notification[] = []

    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications)
        existingNotifications = parsed.map((n: any) => ({
          ...n,
          date: new Date(n.date),
          expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined,
        }))

        // Filter out expired notifications
        existingNotifications = existingNotifications.filter(
          (n) => !n.expiresAt || isAfter(new Date(n.expiresAt), today),
        )
      } catch (e) {
        console.error("Error parsing saved notifications", e)
      }
    }

    // Generate appointment reminders
    if (appointments.length > 0) {
      appointments.forEach((appointment) => {
        const appointmentDate = parseISO(appointment.date)
        const daysUntil = differenceInDays(appointmentDate, today)

        // Create reminders for upcoming appointments (5, 3, 1 days before)
        if ([5, 3, 1].includes(daysUntil)) {
          const notificationId = `appointment-${appointment.id}-${daysUntil}`

          // Check if this notification already exists
          if (!existingNotifications.some((n) => n.id === notificationId)) {
            newNotifications.push({
              id: notificationId,
              title: "Upcoming Appointment",
              description: `You have "${appointment.title}" in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`,
              type: "appointment",
              read: false,
              date: today,
              expiresAt: appointmentDate, // Expires on the appointment date
            })
          }
        }
      })
    }

    // Generate journal reminder if no entry in the last 24 hours
    if (!lastJournalDate || differenceInDays(today, lastJournalDate) >= 1) {
      const notificationId = `journal-reminder-${format(today, "yyyy-MM-dd")}`

      // Check if this notification already exists
      if (!existingNotifications.some((n) => n.id === notificationId)) {
        newNotifications.push({
          id: notificationId,
          title: "Journal Reminder",
          description: "Don't forget to log your symptoms and mood today",
          type: "reminder",
          read: false,
          date: today,
          expiresAt: addDays(today, 1), // Expires after 1 day
        })
      }
    }

    // Generate weekly pregnancy update notification
    if (profile) {
      const dueDate = parseISO(profile.due_date)
      const pregnancyWeek = Math.min(40, Math.max(1, 40 - differenceInWeeks(dueDate, today)))

      // Create weekly update notification (once per week)
      const weeklyNotificationId = `weekly-update-week-${pregnancyWeek}`

      // Check if this notification already exists
      if (!existingNotifications.some((n) => n.id === weeklyNotificationId)) {
        newNotifications.push({
          id: weeklyNotificationId,
          title: "Weekly Pregnancy Update",
          description: `Week ${pregnancyWeek}: Your baby is continuing to develop!`,
          type: "tip",
          read: false,
          date: today,
          expiresAt: addDays(today, 7), // Expires after 7 days
        })
      }
    }

    // Combine existing and new notifications
    const combinedNotifications = [...existingNotifications, ...newNotifications]

    // Sort by date (newest first)
    combinedNotifications.sort((a, b) => b.date.getTime() - a.date.getTime())

    setNotifications(combinedNotifications)

    // Save to localStorage
    localStorage.setItem("biaia_notifications", JSON.stringify(combinedNotifications))
  }, [appointments, profile, lastJournalDate])

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      )

      // Save to localStorage
      localStorage.setItem("biaia_notifications", JSON.stringify(updated))

      return updated
    })
  }

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((notification) => ({ ...notification, read: true }))

      // Save to localStorage
      localStorage.setItem("biaia_notifications", JSON.stringify(updated))

      return updated
    })
  }

  // Delete a notification
  const deleteNotification = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((notification) => notification.id !== id)

      // Save to localStorage
      localStorage.setItem("biaia_notifications", JSON.stringify(updated))

      return updated
    })
  }

  // Delete all notifications
  const deleteAllNotifications = () => {
    setNotifications([])
    localStorage.removeItem("biaia_notifications")
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

// Helper function
function differenceInWeeks(dateLeft: Date, dateRight: Date): number {
  const diffTime = Math.abs(dateLeft.getTime() - dateRight.getTime())
  return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7))
}
