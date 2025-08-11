"use client"

import { useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast"
import { PartyPopper, Sparkles, Trophy, Rocket, Heart, Star } from "lucide-react"

interface SuccessToastProps {
  title: string
  description?: string
  type?: "success" | "celebration" | "achievement" | "launch"
  duration?: number
}

const toastStyles = {
  success: {
    icon: Sparkles,
    bgColor: "from-green-600 to-emerald-600",
    iconColor: "text-green-400",
    emoji: "✅"
  },
  celebration: {
    icon: PartyPopper,
    bgColor: "from-purple-600 to-pink-600",
    iconColor: "text-yellow-400",
    emoji: "🎉"
  },
  achievement: {
    icon: Trophy,
    bgColor: "from-yellow-600 to-orange-600",
    iconColor: "text-yellow-300",
    emoji: "🏆"
  },
  launch: {
    icon: Rocket,
    bgColor: "from-blue-600 to-indigo-600",
    iconColor: "text-blue-400",
    emoji: "🚀"
  }
}

export function showSuccessToast({
  title,
  description,
  type = "success",
  duration = 3000
}: SuccessToastProps) {
  const style = toastStyles[type]
  const Icon = style.icon

  toast({
    title: `${style.emoji} ${title}`,
    description: description,
    duration: duration,
    className: `bg-gradient-to-r ${style.bgColor} border-none text-white`,
  })
}

export function showFunMessage(message: string, emoji: string = "🎉") {
  const messages = [
    `${emoji} ${message}`,
    `Amazing work! ${message} ⭐`,
    `You're crushing it! ${message} 🔥`,
    `Fantastic! ${message} ✨`,
    `Incredible progress! ${message} 🚀`
  ]
  
  const randomMessage = messages[Math.floor(Math.random() * messages.length)]
  
  toast({
    title: randomMessage,
    duration: 2500,
    className: "bg-gradient-to-r from-purple-600 to-pink-600 border-none text-white",
  })
}

// Fun motivational messages for different progress levels
export const motivationalMessages = {
  0: "Every great journey begins with a single step! 🌟",
  10: "You're off to an amazing start! 🚀",
  25: "Quarter way there! You're doing fantastic! ⭐",
  50: "Halfway to adventure! Keep the momentum going! 🔥",
  75: "Almost there! Your trip is taking shape beautifully! ✨",
  90: "So close! The finish line is in sight! 🎯",
  100: "INCREDIBLE! Your perfect trip is ready to launch! 🎉🚀"
}

export function getProgressMessage(progress: number): string {
  const thresholds = Object.keys(motivationalMessages).map(Number).sort((a, b) => b - a)
  const threshold = thresholds.find(t => progress >= t) || 0
  return motivationalMessages[threshold as keyof typeof motivationalMessages]
}

export default function SuccessToast() {
  return null // This is just a utility component
}
