"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Calendar, MessageCircle, Check, X, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { useNotifications } from "@/components/providers/notification-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } = useNotifications()

  const [showDeleteAll, setShowDeleteAll] = useState(false)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return <Calendar className="h-5 w-5 text-blue-500" />
      case "message":
        return <MessageCircle className="h-5 w-5 text-green-500" />
      case "reminder":
        return <Bell className="h-5 w-5 text-yellow-500" />
      case "tip":
        return <Bell className="h-5 w-5 text-purple-500" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5

    if (diffInHours < 24) {
      return `${Math.round(diffInHours)} hour${Math.round(diffInHours) !== 1 ? "s" : ""} ${
        date > now ? "from now" : "ago"
      }`
    }

    return format(date, "MMM d, yyyy")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <div className="flex gap-2">
          {notifications.some((n) => !n.read) && (
            <Button variant="outline" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" onClick={() => setShowDeleteAll(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete all
            </Button>
          )}
        </div>
      </div>

      {showDeleteAll && (
        <Alert className="mb-4">
          <AlertDescription className="flex items-center justify-between">
            <span>Are you sure you want to delete all notifications?</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowDeleteAll(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  deleteAllNotifications()
                  setShowDeleteAll(false)
                }}
              >
                Delete All
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className={notification.read ? "opacity-70" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{notification.title}</h3>
                        {!notification.read && <Badge className="h-2 w-2 rounded-full p-0" />}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(notification.date)}</span>
                    </div>
                    <p className="mt-1 text-sm">{notification.description}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="h-4 w-4" />
                        <span className="sr-only">Mark as read</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
            <CardTitle className="mb-2">No notifications</CardTitle>
            <CardDescription>You're all caught up!</CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
