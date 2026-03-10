export const SectionMarketRegimes4 = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      Рынок постоянно меняет поведение. Профессионалы выделяют <span className="text-purple-400 font-semibold">4 режима</span> — у каждого своя логика и своя стратегия.
    </p>
    <div className="space-y-2">
      {[
        {
          name: "Тренд",
          emoji: "📈",
          color: "text-green-400",
          border: "border-green-500/30",
          bg: "bg-green-500/5",
          signal: "ADX > 25, EMA 20 далеко от EMA 50",
          desc: "Рынок уверенно движется в одну сторону. Самый прибыльный режим — работай по направлению тренда.",
          strategy: "Стратегия: трендовые сигналы по EMA, MACD, пробои уровней",
          risk: "Риск: обычный (1–2% депозита на сделку)",
        },
        {
          name: "Боковик (флэт)",
          emoji: "↔️",
          color: "text-blue-400",
          border: "border-blue-500/30",
          bg: "bg-blue-500/5",
          signal: "ADX < 20, EMA переплетены, цена ходит в канале",
          desc: "Рынок движется горизонтально между уровнями. Трендовые стратегии дают ложные сигналы — нужна другая тактика.",
          strategy: "Стратегия: отскоки от уровней, сеточная торговля, RSI-перекупленность/перепроданность",
          risk: "Риск: уменьшенный (0.5–1%) — много ложных пробоев",
        },
        {
          name: "Высокая волатильность",
          emoji: "⚡",
          color: "text-yellow-400",
          border: "border-yellow-500/30",
          bg: "bg-yellow-500/5",
          signal: "ATR > 1.5× среднего за 50 свечей, резкие движения",
          desc: "Рынок двигается быстро и непредсказуемо — часто после новостей, ликвидаций китов, регуляторных событий.",
          strategy: "Стратегия: пропуск или минимальные ставки, ожидание стабилизации",
          risk: "Риск: минимальный (0.25–0.5%) или полный пропуск",
        },
        {
          name: "Переход",
          emoji: "🔄",
          color: "text-zinc-400",
          border: "border-zinc-500/30",
          bg: "bg-zinc-500/5",
          signal: "ADX между 20–25, EMA сближаются, объём падает",
          desc: "Рынок меняет режим — тренд заканчивается или боковик собирается взорваться. Самое неопределённое состояние.",
          strategy: "Стратегия: ждать. Не торговать в неопределённости.",
          risk: "Риск: пропуск — профессионалы пропускают этот режим",
        },
      ].map((r, i) => (
        <div key={i} className={`border ${r.border} ${r.bg} rounded-xl p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{r.emoji}</span>
            <span className={`font-orbitron text-sm font-bold ${r.color}`}>{r.name}</span>
            <span className="text-zinc-500 text-xs font-space-mono ml-auto">{r.signal}</span>
          </div>
          <p className="text-zinc-300 text-xs font-space-mono leading-relaxed mb-2">{r.desc}</p>
          <div className="flex flex-col gap-1">
            <div className="flex gap-2 items-start">
              <span className="text-zinc-500 text-xs shrink-0">→</span>
              <span className={`text-xs font-space-mono ${r.color}`}>{r.strategy}</span>
            </div>
            <div className="flex gap-2 items-start">
              <span className="text-zinc-500 text-xs shrink-0">⚠</span>
              <span className="text-zinc-400 text-xs font-space-mono">{r.risk}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)
