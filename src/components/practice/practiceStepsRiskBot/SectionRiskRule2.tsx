// Визуал 1: Симуляция депозита при разных % ставки
const DepositSimulation = () => {
  const scenarios = [
    { pct: 2, label: "2% (правило)", color: "#22c55e" },
    { pct: 5, label: "5% (агрессивно)", color: "#eab308" },
    { pct: 10, label: "10% (слив)", color: "#ef4444" },
  ]

  const calcDepositAfterLosses = (pct: number, losses: number) => {
    let d = 1000
    for (let i = 0; i < losses; i++) d -= d * (pct / 100)
    return Math.round(d)
  }

  const losses = [0, 1, 2, 3, 5, 7, 10]

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-4">
        Депозит $1,000 после N проигрышей подряд
      </div>
      <div className="space-y-4">
        {scenarios.map((s) => (
          <div key={s.pct}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-orbitron font-bold" style={{ color: s.color }}>{s.label}</span>
            </div>
            <div className="flex items-end gap-1 h-16">
              {losses.map((n) => {
                const val = calcDepositAfterLosses(s.pct, n)
                const heightPct = Math.max(2, (val / 1000) * 100)
                return (
                  <div key={n} className="flex-1 flex flex-col items-center justify-end gap-1">
                    <span className="text-[9px] font-space-mono text-zinc-500">${val}</span>
                    <div
                      className="w-full rounded-t-sm"
                      style={{ height: `${heightPct}%`, backgroundColor: s.color, opacity: 0.8 }}
                    />
                    <span className="text-[9px] font-space-mono text-zinc-600">{n}x</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="text-zinc-600 text-[10px] font-space-mono mt-3">
        Ось X: количество проигрышей подряд. Ось Y: остаток депозита.
      </p>
    </div>
  )
}

// Визуал 2: Timeline торгового дня
const DayTimeline = () => {
  const events = [
    { time: "09:00", label: "Старт дня", desc: "Открываем платформу, проверяем новости", type: "neutral", balance: "$1,000" },
    { time: "09:30", label: "Сделка 1 — PUT", desc: "EMA нисходящая + RSI 71 → сигнал", type: "win", balance: "$1,016" },
    { time: "10:15", label: "Сделка 2 — CALL", desc: "Сигнал ложный — волатильность после новостей", type: "loss", balance: "$996" },
    { time: "11:00", label: "Сделка 3 — PUT", desc: "Чистый сигнал на M5 — сильное сопротивление", type: "win", balance: "$1,013" },
    { time: "11:45", label: "Сделка 4 — PUT", desc: "Тренд продолжается, confluence 3/3", type: "loss", balance: "$993" },
    { time: "12:30", label: "Сделка 5 — CALL", desc: "Слабый сигнал, но руки зачесались...", type: "loss", balance: "$973" },
    { time: "12:50", label: "🛑 Стоп! -6%", desc: "Дневной лимит сработал. Закрываем Pocket Option", type: "stop", balance: "$940" },
  ]

  const typeStyle: Record<string, { dot: string; text: string; card: string }> = {
    neutral: { dot: "bg-zinc-500", text: "text-zinc-400", card: "border-zinc-700 bg-zinc-900" },
    win: { dot: "bg-green-500", text: "text-green-400", card: "border-green-500/30 bg-green-500/5" },
    loss: { dot: "bg-red-500", text: "text-red-400", card: "border-red-500/30 bg-red-500/5" },
    stop: { dot: "bg-orange-500", text: "text-orange-400", card: "border-orange-500/40 bg-orange-500/10" },
  }

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-4">
        Типичный торговый день: когда стоп спасает депозит
      </div>
      <div className="relative">
        <div className="absolute left-[5.5rem] top-0 bottom-0 w-px bg-zinc-800" />
        <div className="space-y-3">
          {events.map((e, i) => {
            const s = typeStyle[e.type]
            return (
              <div key={i} className="flex gap-3 items-start">
                <span className="text-[10px] font-space-mono text-zinc-500 w-16 shrink-0 pt-2 text-right">{e.time}</span>
                <div className="relative flex items-start gap-2 pl-4">
                  <div className={`absolute left-0 top-2 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 ${s.dot} z-10`} />
                  <div className={`rounded-lg border px-3 py-2 ${s.card}`}>
                    <div className={`text-xs font-orbitron font-bold ${s.text} mb-0.5 flex items-center justify-between gap-4`}>
                      <span>{e.label}</span>
                      <span className="text-white font-space-mono">{e.balance}</span>
                    </div>
                    <p className="text-zinc-500 text-[10px] font-space-mono">{e.desc}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Визуал 3: Заполненный журнал трейдера за неделю
const TraderJournal = () => {
  const trades = [
    { date: "Пн 24.02", time: "10:40", asset: "BTC/USD M5", dir: "PUT", signals: "EMA ↓ + RSI 72 + сопр. $96,580", stake: "$20", result: "win", pnl: "+$16.40" },
    { date: "Пн 24.02", time: "14:15", asset: "BTC/USD M5", dir: "CALL", signals: "EMA ↑ + RSI 38 + поддержка $95,200", stake: "$20", result: "loss", pnl: "-$20.00" },
    { date: "Вт 25.02", time: "09:55", asset: "BTC/USD M5", dir: "CALL", signals: "EMA ↑ + RSI 42 + отбой от MA50", stake: "$20", result: "win", pnl: "+$16.40" },
    { date: "Ср 26.02", time: "11:30", asset: "BTC/USD M5", dir: "PUT", signals: "EMA ↓ + RSI 69 — слабый сигнал", stake: "$20", result: "loss", pnl: "-$20.00" },
    { date: "Чт 27.02", time: "15:00", asset: "BTC/USD M5", dir: "PUT", signals: "EMA ↓ + RSI 74 + сопр. $97,100 + объём", stake: "$20", result: "win", pnl: "+$16.40" },
    { date: "Пт 28.02", time: "10:20", asset: "BTC/USD M5", dir: "CALL", signals: "EMA ↑ + RSI 35 + поддержка $94,800", stake: "$20", result: "win", pnl: "+$16.40" },
  ]

  const totalPnl = trades.reduce((acc, t) => acc + parseFloat(t.pnl.replace(/\$|\+/g, "")), 0)
  const wins = trades.filter((t) => t.result === "win").length

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3 flex items-center justify-between">
        <span>Журнал трейдера — неделя 24–28 февраля</span>
        <span className={`${totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
          {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] font-space-mono border-collapse">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Дата", "Время", "Актив", "Направл.", "Сигналы", "Ставка", "PnL"].map((h) => (
                <th key={h} className="text-left text-zinc-600 font-bold pb-2 pr-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => (
              <tr key={i} className="border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors">
                <td className="py-1.5 pr-3 text-zinc-500 whitespace-nowrap">{t.date}</td>
                <td className="py-1.5 pr-3 text-zinc-400 whitespace-nowrap">{t.time}</td>
                <td className="py-1.5 pr-3 text-zinc-300 whitespace-nowrap">{t.asset}</td>
                <td className={`py-1.5 pr-3 font-bold whitespace-nowrap ${t.dir === "PUT" ? "text-red-400" : "text-green-400"}`}>{t.dir}</td>
                <td className="py-1.5 pr-3 text-zinc-500 max-w-[160px]">{t.signals}</td>
                <td className="py-1.5 pr-3 text-white whitespace-nowrap">{t.stake}</td>
                <td className={`py-1.5 font-bold whitespace-nowrap ${t.result === "win" ? "text-green-400" : "text-red-400"}`}>{t.pnl}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 pt-3 border-t border-zinc-800 flex gap-6">
        <div>
          <span className="text-zinc-600 text-[10px] font-space-mono">Сделок</span>
          <div className="text-white text-sm font-orbitron font-bold">{trades.length}</div>
        </div>
        <div>
          <span className="text-zinc-600 text-[10px] font-space-mono">Win Rate</span>
          <div className="text-green-400 text-sm font-orbitron font-bold">{Math.round((wins / trades.length) * 100)}%</div>
        </div>
        <div>
          <span className="text-zinc-600 text-[10px] font-space-mono">Итог недели</span>
          <div className={`text-sm font-orbitron font-bold ${totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
            {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Экспорт: 3 секции Шага 3 (Риск-менеджмент)
// ─────────────────────────────────────────────────────────────

export const SectionRiskRule2 = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      На бинарных опционах риск на сделку = размер ставки (при проигрыше теряем всю ставку).
      Поэтому <span className="text-red-400 font-semibold">правило 1–2% критично</span> как нигде.
    </p>
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="space-y-3">
        {[
          { deposit: "$1,000", pct: "2%", stake: "$20", label: "Рекомендуемый старт" },
          { deposit: "$1,000", pct: "5%", stake: "$50", label: "Агрессивно — риск слива" },
          { deposit: "$1,000", pct: "10%", stake: "$100", label: "Слив за 10 проигрышей" },
        ].map((row, i) => (
          <div key={i} className={`flex items-center gap-3 p-2 rounded-lg border ${i === 0 ? "bg-green-500/10 border-green-500/30" : i === 1 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-red-500/10 border-red-500/30"}`}>
            <div className={`text-xs font-space-mono w-4 ${i === 0 ? "text-green-400" : i === 1 ? "text-yellow-400" : "text-red-400"}`}>
              {i === 0 ? "✓" : "✗"}
            </div>
            <div className="flex-1 text-xs font-space-mono text-zinc-300">
              Депозит {row.deposit} × {row.pct} = <span className="font-bold text-white">{row.stake}</span> ставка
            </div>
            <div className={`text-xs font-orbitron ${i === 0 ? "text-green-400" : i === 1 ? "text-yellow-400" : "text-red-400"}`}>{row.label}</div>
          </div>
        ))}
      </div>
    </div>
    <DepositSimulation />
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
      <div className="text-red-400 font-orbitron text-xs font-bold mb-2">Математика выживания на Pocket Option</div>
      <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">
        При 2% ставке: 10 проигрышей подряд = -18.3% депозита. Можно восстановиться.<br />
        При 10% ставке: 10 проигрышей подряд = -65.1% депозита. Восстановиться крайне сложно.<br />
        <span className="text-white">Серия из 10 проигрышей при 55% Win Rate встречается в 0.25% случаев — это реально.</span>
      </p>
    </div>
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
      <div className="text-blue-400 font-orbitron text-xs font-bold mb-2">Из жизни: правило 2% от Эда Сейкоты</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Эд Сейкота — трейдер-легенда, превративший $5,000 в $15 млн за 12 лет — публично говорил,
        что управление риском важнее любой стратегии входа: «Долгосрочное выживание полностью зависит от размера позиции».
        Он никогда не рисковал более чем 2–3% на одну сделку, даже в периоды максимальной уверенности.
        Именно это позволило ему пережить десятки кризисов без серьёзных потерь капитала.
      </p>
    </div>
  </div>
)

export const SectionDailyLimit = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      Даже с правильной стратегией бывают плохие дни. <span className="text-yellow-400 font-semibold">Дневной стоп-лосс</span> защищает от эмоциональных решений.
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="bg-zinc-900 border border-red-500/30 rounded-xl p-4">
        <div className="text-red-400 font-orbitron text-xs font-bold mb-3">Дневной Stop Loss</div>
        <div className="text-3xl font-orbitron font-bold text-red-400 mb-2">-6%</div>
        <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">
          Потеряли 3 ставки по 2% → стоп. Закрываем платформу до следующего дня. Без исключений.
        </p>
      </div>
      <div className="bg-zinc-900 border border-green-500/30 rounded-xl p-4">
        <div className="text-green-400 font-orbitron text-xs font-bold mb-3">Дневной Take Profit</div>
        <div className="text-3xl font-orbitron font-bold text-green-400 mb-2">+10%</div>
        <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">
          Заработали 10% за день → тоже стоп. Жадность убивает прибыль. Фиксируем и уходим.
        </p>
      </div>
    </div>
    <DayTimeline />
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
      <div className="text-yellow-400 font-orbitron text-xs font-bold mb-2">Из жизни: правило Джорджа Сороса о потерях</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Джордж Сорос — один из самых богатых трейдеров в истории — имел жёсткое правило:
        если он чувствовал, что «не в форме» или рынок ведёт себя непредсказуемо, он просто переставал торговать.
        «Не важно, правы вы или нет. Важно, сколько вы зарабатываете, когда правы, и сколько теряете, когда ошибаетесь».
        Дневной лимит — это формализация того же принципа: плохой день заканчиваем заранее.
      </p>
    </div>
  </div>
)

export const SectionTraderJournal = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      Журнал сделок — инструмент №1 для роста. Без него невозможно понять, что работает, а что нет.
    </p>
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">Минимальная запись после каждой сделки</div>
      <div className="space-y-2">
        {[
          { field: "Дата/время", example: "28.02.2026, 14:40", color: "text-blue-400" },
          { field: "Инструмент", example: "BTC/USD, M5", color: "text-purple-400" },
          { field: "Направление", example: "PUT", color: "text-red-400" },
          { field: "Сигналы", example: "EMA нисход. + сопротивление $96,580 + RSI 68", color: "text-yellow-400" },
          { field: "Ставка", example: "$20 (2% от $1,000)", color: "text-green-400" },
          { field: "Результат", example: "Выигрыш / Проигрыш / сумма", color: "text-zinc-400" },
        ].map((row, i) => (
          <div key={i} className="flex gap-2 items-center">
            <span className={`text-xs font-orbitron w-28 shrink-0 ${row.color}`}>{row.field}:</span>
            <span className="text-xs font-space-mono text-zinc-400">{row.example}</span>
          </div>
        ))}
      </div>
    </div>
    <TraderJournal />
    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
      <div className="text-purple-400 font-orbitron text-xs font-bold mb-2">Из жизни: журнал Ливермора и Далио</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Джесси Ливермор — трейдер начала XX века, сделавший состояние на «чёрный четверг» 1929 года — вёл детальные дневники каждой сделки.
        Рэй Далио, основатель Bridgewater Associates (крупнейший хедж-фонд в мире), до сих пор фиксирует гипотезы и их результаты.
        Он называет это «петлёй обратной связи»: без записей ты не можешь учиться, потому что память субъективна — мозг «забывает» ошибки.
        Ведение журнала — это то, что отличает профессионала от любителя на любом рынке.
      </p>
    </div>
  </div>
)
