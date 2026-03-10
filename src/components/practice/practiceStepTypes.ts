import type { ReactNode } from "react"
import type { Relevance2026 } from "@/components/Relevance2026Badge"
import type { AIBotInsight } from "@/components/AIBotInsightBlock"

export type PracticeStep = {
  id: string
  badge: string
  color: string
  icon: string
  title: string
  summary: string
  sections: { title: string; content: ReactNode }[]
  relevance2026?: Relevance2026
  aibotInsight?: AIBotInsight
}

export const colorMap: Record<string, string> = {
  blue: "bg-blue-500 text-white border-0",
  yellow: "bg-yellow-500 text-black border-0",
  red: "bg-red-500 text-white border-0",
  purple: "bg-purple-500 text-white border-0",
  green: "bg-green-500 text-black border-0",
}

export const borderMap: Record<string, string> = {
  blue: "border-blue-500/25",
  yellow: "border-yellow-500/25",
  red: "border-red-500/25",
  purple: "border-purple-500/25",
  green: "border-green-500/25",
}