"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send } from "lucide-react"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

type Profile = {
  name: string
  due_date: string
  symptoms: string[]
  allergies: string[]
}

export default function ChatPage() {
  const { user } = useSupabaseAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

        if (error) throw error

        setProfile(data as Profile)

        // Add welcome message
        setMessages([
          {
            id: "1",
            role: "assistant",
            content: `Hello ${data.name}! I'm your pregnancy assistant. How can I help you today?`,
            timestamp: new Date(),
          },
        ])
      } catch (error: any) {
        console.error("Error fetching profile:", error.message)
      }
    }

    fetchProfile()
  }, [user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(input, profile)

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: aiResponse,
          timestamp: new Date(),
        },
      ])

      setIsLoading(false)
    }, 1000)
  }

  // Placeholder function to generate AI responses
  const generateAIResponse = (message: string, profile: Profile | null): string => {
    const lowerMessage = message.toLowerCase()

    if (profile) {
      // Calculate current week of pregnancy
      const currentDate = new Date()
      const dueDate = new Date(profile.due_date)
      const pregnancyWeek = 40 - Math.floor((dueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 7))

      if (lowerMessage.includes("week") || lowerMessage.includes("progress")) {
        return `You're currently in week ${pregnancyWeek} of your pregnancy. This is an exciting time! The baby is continuing to develop and grow.`
      }

      if (lowerMessage.includes("symptom") || lowerMessage.includes("feeling")) {
        if (profile.symptoms && profile.symptoms.length > 0) {
          return `I see you've mentioned experiencing ${profile.symptoms.join(", ")}. These are common symptoms during pregnancy. Make sure to discuss any severe or concerning symptoms with your healthcare provider.`
        } else {
          return `How are you feeling today? It's important to keep track of any symptoms you experience during your pregnancy.`
        }
      }

      if (lowerMessage.includes("allerg")) {
        if (profile.allergies && profile.allergies.length > 0) {
          return `I see you've noted allergies to ${profile.allergies.join(", ")}. It's important to avoid these allergens and discuss with your doctor how to manage them during pregnancy.`
        } else {
          return `I don't see any allergies listed in your profile. If you have any allergies, please update your profile so I can provide better guidance.`
        }
      }

      if (lowerMessage.includes("eat") || lowerMessage.includes("food") || lowerMessage.includes("diet")) {
        return `A balanced diet is crucial during pregnancy. Focus on fruits, vegetables, whole grains, lean proteins, and dairy. Avoid raw or undercooked meats, unpasteurized dairy, high-mercury fish, and excessive caffeine.`
      }

      if (lowerMessage.includes("exercise") || lowerMessage.includes("workout")) {
        return `Regular exercise during pregnancy can help reduce backaches, constipation, bloating, and swelling. Good options include walking, swimming, and prenatal yoga. Always consult with your healthcare provider before starting any exercise routine.`
      }
    }

    // Default responses
    if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
      return `Hello! How can I assist you with your pregnancy journey today?`
    }

    if (lowerMessage.includes("thank")) {
      return `You're welcome! I'm here to help with any questions you have about your pregnancy.`
    }

    return `I'm here to help with your pregnancy journey. You can ask me about your symptoms, diet recommendations, safe exercises, or general pregnancy information.`
  }

  return (
    <div className="container mx-auto flex h-[calc(100vh-4rem)] flex-col px-4 py-8">
      <Card className="flex h-full flex-col">
        <CardHeader>
          <CardTitle>AI Pregnancy Assistant</CardTitle>
          <CardDescription>Ask questions about your pregnancy journey</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`flex max-w-[80%] items-start space-x-2 rounded-lg p-3 ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <p>{message.content}</p>
                    <p className="mt-1 text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex max-w-[80%] items-center space-x-2 rounded-lg bg-muted p-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/50"></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-foreground/50"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-foreground/50"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        <CardFooter className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex w-full space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
