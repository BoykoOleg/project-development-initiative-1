import type React from "react"
import type { Relevance2026 } from "@/components/Relevance2026Badge"
import type { AIBotInsight } from "@/components/AIBotInsightBlock"

export type Section = {
  title: string
  content: React.ReactNode
}

export type Article = {
  id: string
  badge: string
  title: string
  summary: string
  sections: Section[]
  relevance2026?: Relevance2026
  aibotInsight?: AIBotInsight
}