import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { steps } from "@/components/practice/practiceSteps"
import PracticeProgressBar from "@/components/practice/PracticeProgressBar"
import PracticeStepCard from "@/components/practice/PracticeStepCard"
import { Relevance2026Legend } from "@/components/Relevance2026Legend"

const LS_KEY = "practice_opened_steps"

function loadOpened(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveOpened(ids: string[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(ids))
  } catch (_) {
    // ignore
  }
}

export default function PracticeCase() {
  const [open, setOpen] = useState<string[]>([])
  const [openedSteps, setOpenedSteps] = useState<string[]>([])

  useEffect(() => {
    setOpenedSteps(loadOpened())
  }, [])

  function handleOpenChange(ids: string[]) {
    setOpen(ids)
    // Фиксируем все шаги, которые пользователь хоть раз открыл
    const newOpened = Array.from(new Set([...openedSteps, ...ids]))
    setOpenedSteps(newOpened)
    saveOpened(newOpened)
  }

  const done = openedSteps.length
  const total = steps.length
  const pct = Math.round((done / total) * 100)

  return (
    <div className="dark min-h-screen bg-black">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mb-4">Практический кейс</Badge>
            <h1 className="font-orbitron text-4xl md:text-5xl font-bold text-white mb-6">
              BTC на Pocket Option:<br className="hidden sm:block"/> реальный разбор
            </h1>
            <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Применяем всё с сайта на практике: анализ рынка → сигнал → риск-менеджмент → автоматизация.
              Шаг за шагом, как это делают реальные трейдеры.
            </p>
          </div>

          {/* Мини-прогресс */}
          <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-zinc-500 text-xs font-space-mono">Прогресс курса</span>
                <span className="font-orbitron text-xs font-bold text-white">{done}/{total} шагов</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <div className={`font-orbitron text-lg font-bold shrink-0 ${pct === 100 ? "text-green-400" : "text-zinc-400"}`}>
              {pct}%
            </div>
          </div>

          <PracticeProgressBar steps={steps} />

          <Relevance2026Legend />

          <div className="space-y-10">
            {steps.map((step) => (
              <PracticeStepCard
                key={step.id}
                step={step}
                open={open}
                onOpenChange={handleOpenChange}
              />
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-gray-400 mb-4 font-space-mono">Готов автоматизировать стратегию?</p>
            <a
              href="/bot-builder"
              className="inline-block bg-green-500 hover:bg-green-600 text-black font-orbitron font-bold px-8 py-3 rounded-md transition-colors"
            >
              Создать бота в конструкторе →
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}