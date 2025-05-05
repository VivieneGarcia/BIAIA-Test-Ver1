import type React from "react"
import { BottomNav } from "@/components/layout/bottom-nav"
import { TopNav } from "@/components/layout/top-nav"
import { NotificationProvider } from "@/components/providers/notification-provider"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NotificationProvider>
      <div className="flex min-h-screen flex-col">
        <TopNav />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <BottomNav />
      </div>
    </NotificationProvider>
  )
}
