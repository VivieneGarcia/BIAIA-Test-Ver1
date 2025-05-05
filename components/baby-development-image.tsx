"use client"

import Image from "next/image"

interface BabyDevelopmentImageProps {
  week: number
  size: string
  className?: string
}

export function BabyDevelopmentImage({ week, size, className = "" }: BabyDevelopmentImageProps) {
  // For now, we'll use placeholder images based on the week range
  // In a production app, you would have actual illustrations for each week
  const getImageUrl = () => {
    if (week <= 8) {
      return "/placeholder.svg?height=150&width=150&text=Early+Development"
    } else if (week <= 16) {
      return "/placeholder.svg?height=150&width=150&text=First+Trimester"
    } else if (week <= 28) {
      return "/placeholder.svg?height=150&width=150&text=Second+Trimester"
    } else {
      return "/placeholder.svg?height=150&width=150&text=Third+Trimester"
    }
  }

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      <div className="relative h-40 w-40 rounded-full bg-primary/10 flex items-center justify-center">
        <Image
          src={getImageUrl() || "/placeholder.svg"}
          alt={`Baby at week ${week}`}
          width={150}
          height={150}
          className="rounded-full"
        />
      </div>
      <p className="mt-3 text-center font-medium">Size: {size}</p>
    </div>
  )
}
