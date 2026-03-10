import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import Icon from "@/components/ui/icon"

const STEPS = [
  { id: "market-analysis",  badge: "Шаг 1", title: "Анализ рынка",            icon: "BarChart2",     color: "blue" },
  { id: "signal-formation", badge: "Шаг 2", title: "Формирование сигнала",    icon: "Zap",           color: "yellow" },
  { id: "risk-management",  badge: "Шаг 3", title: "Риск-менеджмент",         icon: "Shield",        color: "red" },
  { id: "bot-automation",   badge: "Шаг 4", title: "Выбор платформы и бота",  icon: "Bot",           color: "purple" },
  { id: "automation",       badge: "Шаг 5", title: "Python-бот 24/7",         icon: "Code2",         color: "purple" },
  { id: "mistakes",         badge: "Шаг 6", title: "Устранение ошибок",       icon: "AlertTriangle", color: "red" },
  { id: "full-checklist",   badge: "Итог",  title: "Полная система",          icon: "CheckCircle",   color: "green" },
]

const COLOR_MAP: Record<string, { text: string; border: string; bg: string; dot: string }> = {
  blue:   { text: "text-blue-400",   border: "border-blue-500/40",   bg: "bg-blue-500/10",   dot: "bg-blue-400" },
  yellow: { text: "text-yellow-400", border: "border-yellow-500/40", bg: "bg-yellow-500/10", dot: "bg-yellow-400" },
  red:    { text: "text-red-400",    border: "border-red-500/40",    bg: "bg-red-500/10",    dot: "bg-red-400" },
  purple: { text: "text-purple-400", border: "border-purple-500/40", bg: "bg-purple-500/10", dot: "bg-purple-400" },
  green:  { text: "text-green-400",  border: "border-green-500/40",  bg: "bg-green-500/10",  dot: "bg-green-400" },
  orange: { text: "text-orange-400", border: "border-orange-500/40", bg: "bg-orange-500/10", dot: "bg-orange-400" },
}

const LS_KEY = "practice_opened_steps"

function loadProgress(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function CourseProgressSection() {
  const [opened, setOpened] = useState<string[]>([])

  useEffect(() => {
    setOpened(loadProgress())

    const onStorage = () => setOpened(loadProgress())
    window.addEventListener("storage", onStorage)

    // Polling для обновления в той же вкладке
    const interval = setInterval(() => setOpened(loadProgress()), 2000)
    return () => {
      window.removeEventListener("storage", onStorage)
      clearInterval(interval)
    }
  }, [])

  const done = opened.length
  const total = STEPS.length
  const pct = Math.round((done / total) * 100)
  const allDone = done === total

  return (
    <section className="py-20 px-6 bg-black border-t border-zinc-900">
      <div className="max-w-5xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-10">
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mb-4 font-space-mono">
            Практический курс
          </Badge>
          <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-white mb-4">
            {allDone ? "Курс пройден" : "Ваш прогресс по курсу"}
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto font-space-mono text-sm leading-relaxed">
            {allDone
              ? "Вы изучили все 6 шагов системной торговли — от анализа рынка до работающего бота."
              : "6 шагов от анализа рынка до готового Python-бота. Откройте раздел в практике — прогресс сохранится."}
          </p>
        </div>

        {/* Прогресс-бар */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-500 text-xs font-space-mono">Пройдено шагов</span>
            <span className={`font-orbitron text-sm font-bold ${allDone ? "text-green-400" : "text-white"}`}>
              {done} / {total}
            </span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${allDone ? "bg-green-400" : "bg-gradient-to-r from-blue-500 via-purple-500 to-green-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-zinc-600 text-[10px] font-space-mono">0%</span>
            <span className={`text-[10px] font-space-mono font-bold ${allDone ? "text-green-400" : "text-zinc-400"}`}>{pct}%</span>
            <span className="text-zinc-600 text-[10px] font-space-mono">100%</span>
          </div>
        </div>

        {/* Карточки шагов */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {STEPS.map((step) => {
            const isDone = opened.includes(step.id)
            const c = COLOR_MAP[step.color]
            return (
              <a
                key={step.id}
                href="/practice"
                className={`group relative flex flex-col gap-2 rounded-xl p-4 border transition-all duration-200
                  ${isDone
                    ? `${c.bg} ${c.border} hover:opacity-90`
                    : "bg-zinc-900 border-zinc-800 hover:border-zinc-600"
                  }`}
              >
                {/* Статус-точка */}
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-1.5 ${isDone ? c.text : "text-zinc-500"}`}>
                    <Icon name={step.icon as "Bot"} size={14} />
                    <span className="font-orbitron text-[10px] font-bold">{step.badge}</span>
                  </div>
                  {isDone
                    ? <div className={`w-2 h-2 rounded-full ${c.dot} shrink-0`} />
                    : <div className="w-2 h-2 rounded-full bg-zinc-700 shrink-0" />
                  }
                </div>
                <div className={`font-space-mono text-[11px] leading-tight ${isDone ? "text-white" : "text-zinc-500"}`}>
                  {step.title}
                </div>
                {isDone && (
                  <div className={`text-[9px] font-space-mono font-bold ${c.text}`}>✓ изучено</div>
                )}
                {!isDone && (
                  <div className="text-[9px] font-space-mono text-zinc-600 group-hover:text-zinc-400 transition-colors">→ открыть</div>
                )}
              </a>
            )
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          {allDone ? (
            <div className="inline-flex flex-col sm:flex-row items-center gap-3">
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-5 py-3">
                <span className="text-green-400 font-orbitron text-sm font-bold">🎯 Отличная работа! Курс завершён</span>
              </div>
              <a
                href="/bot-builder"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-orbitron font-bold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                Создать бота
                <Icon name="ArrowRight" size={16} />
              </a>
            </div>
          ) : done === 0 ? (
            <a
              href="/practice"
              className="inline-flex items-center gap-2 bg-white hover:bg-zinc-100 text-black font-orbitron font-bold px-8 py-3 rounded-xl transition-colors"
            >
              Начать курс
              <Icon name="ArrowRight" size={16} />
            </a>
          ) : (
            <a
              href="/practice"
              className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-orbitron font-bold px-8 py-3 rounded-xl transition-colors border border-zinc-700"
            >
              Продолжить курс
              <Icon name="ArrowRight" size={16} />
            </a>
          )}
        </div>
      </div>
    </section>
  )
}