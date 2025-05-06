"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, BookOpen, MessageCircle, User, AlarmClock } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const navItems = [
  {
    name: "Home",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Tracker",
    href: "/tracker",
    icon: Calendar,
  },
  {
    name: "Journal",
    href: "/journal",
    icon: BookOpen,
  },
  {
    name: "Chat",
    href: "/chat",
    icon: MessageCircle,
  },
  {
    name: "Appts",
    href: "/appointments",
    icon: AlarmClock,
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background px-4 shadow-lg md:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-col items-center justify-center space-y-1 rounded-md p-2 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isActive && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute -top-2 h-1 w-12 rounded-full bg-primary"
                transition={{ type: "spring", duration: 0.5 }}
              />
            )}
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
