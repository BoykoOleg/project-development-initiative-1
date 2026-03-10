// Визуал: Бот vs Человек — сравнительная инфографика
const BotVsHumanChart = () => {
  const metrics = [
    { label: "Скорость реакции", bot: 100, human: 15, unit: "мс vs секунды" },
    { label: "Дисциплина правил", bot: 100, human: 65, unit: "% соблюдения" },
    { label: "Работа 24/7", bot: 100, human: 25, unit: "доступность" },
    { label: "Адаптация к рынку", bot: 30, human: 90, unit: "гибкость" },
    { label: "Реакция на новости", bot: 10, human: 85, unit: "понимание" },
  ]

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-4">
        Бот vs Человек: сравнительный анализ навыков
      </div>
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-purple-500/70" />
          <span className="text-[10px] font-space-mono text-zinc-400">Бот</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-500/70" />
          <span className="text-[10px] font-space-mono text-zinc-400">Человек</span>
        </div>
      </div>
      <div className="space-y-3">
        {metrics.map((m, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-space-mono text-zinc-400">{m.label}</span>
              <span className="text-[9px] font-space-mono text-zinc-600">{m.unit}</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-purple-400 w-8 text-right font-space-mono shrink-0">{m.bot}%</span>
                <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500/70 rounded-full transition-all" style={{ width: `${m.bot}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-blue-400 w-8 text-right font-space-mono shrink-0">{m.human}%</span>
                <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500/70 rounded-full transition-all" style={{ width: `${m.human}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Экспорт: секция 1 Шага 4 (Бот vs ручная торговля)
// ─────────────────────────────────────────────────────────────

export const SectionBotVsHuman = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      Бот — это инструмент, а не волшебная кнопка. Он хорош там, где нужна дисциплина и скорость реакции.
      Плох там, где нужно принимать нестандартные решения.
    </p>
    <BotVsHumanChart />
    <div className="space-y-2">
      {[
        { aspect: "Эмоции", bot: "Торгует по правилам без страха и жадности", human: "Может нарушить правила под давлением рынка", winner: "bot" },
        { aspect: "Скорость", bot: "Реагирует за миллисекунды", human: "Анализирует 5–30 секунд перед входом", winner: "bot" },
        { aspect: "Адаптация", bot: "Не видит смену рыночного режима", human: "Может подстроиться под новые условия", winner: "human" },
        { aspect: "Режим 24/7", bot: "Работает постоянно без перерывов", human: "Устаёт, теряет концентрацию", winner: "bot" },
      ].map((row, i) => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
          <div className="text-zinc-400 font-orbitron text-xs mb-2">{row.aspect}</div>
          <div className="grid grid-cols-2 gap-2">
            <div className={`text-xs font-space-mono p-2 rounded ${row.winner === "bot" ? "bg-purple-500/20 text-purple-300" : "bg-zinc-800 text-zinc-400"}`}>
              <span className="font-bold">Бот: </span>{row.bot}
            </div>
            <div className={`text-xs font-space-mono p-2 rounded ${row.winner === "human" ? "bg-blue-500/20 text-blue-300" : "bg-zinc-800 text-zinc-400"}`}>
              <span className="font-bold">Человек: </span>{row.human}
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
      <div className="text-purple-400 font-orbitron text-xs font-bold mb-2">Из жизни: как работает Renaissance Technologies</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Medallion Fund от Renaissance Technologies — самый успешный хедж-фонд в истории (+66% годовых в среднем за 30 лет).
        Он полностью алгоритмический: там работают математики и физики, а не традиционные трейдеры.
        Но даже они постоянно вмешиваются вручную при смене рыночного режима. Чистая автоматизация работает лишь в стабильных условиях —
        именно поэтому понимание рынка важнее любого алгоритма.
      </p>
    </div>
  </div>
)
