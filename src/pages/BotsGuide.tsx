import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { chapters } from "@/components/bots-guide/BotsChapters"
import BotsProgress from "@/components/bots-guide/BotsProgress"
import { Relevance2026Badge } from "@/components/Relevance2026Badge"
import { Relevance2026Legend } from "@/components/Relevance2026Legend"
import { AIBotInsightBlock } from "@/components/AIBotInsightBlock"

const STORAGE_KEY = "tradebase_chapters_bots"

export default function BotsGuide() {
  const [readChapters, setReadChapters] = useState<Set<string>>(new Set())

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as string[]
    setReadChapters(new Set(saved))
  }, [])

  const toggleChapter = (id: string) => {
    setReadChapters((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      return next
    })
  }

  return (
    <div className="dark min-h-screen bg-black">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 mb-4">База знаний</Badge>
            <h1 className="font-orbitron text-4xl md:text-5xl font-bold text-white mb-6">
              Гайд по торговым ботам
            </h1>
            <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              От понимания принципов работы до запуска первого бота. Стратегии, бэктестинг, платформы и чеклист запуска.
            </p>
          </div>

          <BotsProgress chapters={chapters} readChapters={readChapters} />

          <Relevance2026Legend />

          <div className="space-y-12">
            {chapters.map((chapter) => {
              const isDone = readChapters.has(chapter.id)
              return (
                <div key={chapter.id} id={chapter.id} className="scroll-mt-24">
                  <Card className={`border transition-colors ${isDone ? "bg-zinc-900/60 border-green-500/25" : "bg-zinc-900 border-red-500/20"}`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className="bg-red-500 text-white border-0">{chapter.badge}</Badge>
                        <button
                          onClick={() => toggleChapter(chapter.id)}
                          className={`flex items-center gap-2 text-xs font-space-mono px-3 py-1.5 rounded-full border transition-all ${
                            isDone
                              ? "bg-green-500/20 border-green-500/40 text-green-400"
                              : "border-zinc-600 text-zinc-500 hover:border-green-500/50 hover:text-green-400"
                          }`}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {isDone ? "Прочитано" : "Отметить прочитанным"}
                        </button>
                      </div>
                      <CardTitle className={`font-orbitron text-2xl leading-tight ${isDone ? "text-zinc-400" : "text-white"}`}>
                        {chapter.title}
                      </CardTitle>
                      <p className="text-gray-400 leading-relaxed mt-2">{chapter.summary}</p>
                      {chapter.relevance2026 && <Relevance2026Badge data={chapter.relevance2026} />}
                      {chapter.aibotInsight && <AIBotInsightBlock data={chapter.aibotInsight} />}
                    </CardHeader>
                    <CardContent>
                      <Accordion type="multiple" className="w-full">
                        {chapter.sections.map((section, idx) => (
                          <AccordionItem
                            key={idx}
                            value={`${chapter.id}-${idx}`}
                            className="border-red-500/20"
                          >
                            <AccordionTrigger className="text-left text-base font-semibold text-white hover:text-red-400 font-orbitron">
                              {section.title}
                            </AccordionTrigger>
                            <AccordionContent>
                              {section.content}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>

          <div className="mt-16 text-center">
            <p className="text-gray-400 mb-4 font-space-mono">Хотите создать своего бота прямо сейчас?</p>
            <a
              href="/bot-builder"
              className="inline-block bg-red-500 hover:bg-red-600 text-white font-orbitron px-8 py-3 rounded-md transition-colors"
            >
              Открыть конструктор ботов →
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}