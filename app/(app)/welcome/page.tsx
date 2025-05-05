"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"

const features = [
  {
    title: "Weekly Pregnancy Tracker",
    description: "Track your pregnancy progress week by week with personalized information.",
    icon: "📊",
  },
  {
    title: "AI Pregnancy Assistant",
    description: "Get answers to your pregnancy questions from our AI assistant.",
    icon: "🤖",
  },
  {
    title: "Symptom Journal",
    description: "Keep track of your symptoms, moods, and experiences throughout your pregnancy.",
    icon: "📓",
  },
  {
    title: "Appointment Management",
    description: "Schedule and manage your doctor appointments and set reminders.",
    icon: "🗓️",
  },
]

export default function WelcomePage() {
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()

  const handleNext = () => {
    if (currentStep < features.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      router.push("/dashboard")
    }
  }

  const handleSkip = () => {
    router.push("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-pink-50 to-white p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
            B
          </div>
        </div>

        <div className="mb-6 flex justify-center">
          <div className="flex space-x-2">
            {features.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full ${index === currentStep ? "bg-primary" : "bg-primary/30"}`}
              />
            ))}
          </div>
        </div>

        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden border-none shadow-lg">
            <CardContent className="p-0">
              <div className="bg-primary p-6 text-center text-primary-foreground">
                <div className="mb-4 flex justify-center text-4xl">{features[currentStep].icon}</div>
                <h2 className="text-xl font-bold">{features[currentStep].title}</h2>
              </div>
              <div className="p-6">
                <p className="text-center text-muted-foreground">{features[currentStep].description}</p>

                <div className="mt-8 space-y-4">
                  <Button className="w-full" onClick={handleNext}>
                    {currentStep < features.length - 1 ? "Next" : "Get Started"}
                  </Button>
                  {currentStep < features.length - 1 && (
                    <Button variant="ghost" className="w-full" onClick={handleSkip}>
                      Skip Tour
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="mt-8">
          <p className="text-center text-sm text-muted-foreground">BIAIA - Your Pregnancy Companion</p>
        </div>
      </div>
    </div>
  )
}
