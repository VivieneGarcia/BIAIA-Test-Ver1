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
import axios from 'axios';  

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
    e.preventDefault();
  
    if (!input.trim() || isLoading) return;
  
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
  
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
  
    // Call the AI response with async function
    const aiResponse = await generateAIResponse(input, profile);
  
    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      },
    ]);
  
    setIsLoading(false);
  };

  // Inside your ChatPage component

  const generateAIResponse = async (message: string, profile: Profile | null): Promise<string> => {
    const lowerMessage = message.toLowerCase();
  
    // If the profile exists, include personalized info
    if (profile) {
      const currentDate = new Date();
      const dueDate = new Date(profile.due_date);
      const pregnancyWeek = 40 - Math.floor((dueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
  
      // Prepare the prompt for Gemini AI
      const prompt = `
      
You name is Bembang, assisting a user who is currently ${pregnancyWeek} weeks pregnant. Their due date is ${dueDate} Their name is ${profile.name}.  Their reported symptoms include: ${profile.symptoms ? profile.symptoms.join(", ") : "None reported."} and their allergies include: ${profile.allergies ? profile.allergies.join(", ") : "None reported."}

When responding:
- Offer clear, medically accurate advice in a calm, friendly, and empathetic tone.
- If the user’s question involves any symptoms or medical concerns, gently encourage them to reach out to a healthcare provider for personalized care, especially if the symptoms seem worrisome or severe. Always approach with kindness and concern for their well-being.
- Keep your advice direct but comforting. 
- Use emojis to make it more readable
- Give concise like somewhere around 30 words but complete answers. If you need to make it long, then do it. The user may adhd tendency so they might have low attention span. But don't tell them
- Make important answer bold! 
- If they speak tagalog, use tagalog as language. Otherwise, use english.
- "Bembang" means sex in english. It is also your name as an ai bot. 
- Don't be shy to tell sensitive topics. 
- If the user questions and talks about Sex, replace "Sex" as "Bembang (Sex)" and make sure to make that word bold. 
- Use bullet points and bold to break down information where it makes it easier for the user to follow. (Use "•" as bullet)
- Do not repeat the user’s pregnancy details, symptoms, or allergies unless it's necessary for context, but always make sure the response is relevant to their current question.

User's question: "${message}"
`;


  
      try {
        console.log('Sending request to Gemini API...');
        const response = await axios.post('api/gemini', { prompt });
  
        // Log the entire response to check its structure
        console.log('Received response from Gemini:', JSON.stringify(response.data, null, 2));

  
        // Assuming the reply is inside a specific field, adjust this according to the logged response
        if (response.data && response.data.reply) {
          return response.data.reply;
        } else {
          return "Sorry, I'm having trouble getting a response from the AI.";
        }
      } catch (error) {
        console.error("Error contacting Gemini AI:", error);
        return "Sorry, I'm having trouble connecting to my AI assistant. Please try again later.";
      }
    }
  
    // Default response if no profile is available
    return `I'm here to help with your pregnancy journey. You can ask me about your symptoms, diet recommendations, safe exercises, or general pregnancy information.`;
  };
  
  

  


  return (
    <div className="container mx-auto flex h-[calc(100vh-4rem)] flex-col px-4 py-8">
      <Card className="flex h-full flex-col">
        <CardHeader>
          <CardTitle>Hi, I'm Bembang!</CardTitle>
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
              <AvatarFallback className="font-bold">B</AvatarFallback>
            </Avatar>
          )}
          <div>
            <p
              dangerouslySetInnerHTML={{
                __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/- /g, '• ').replace(/\n/g, '<br />')
              }}
            />
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
