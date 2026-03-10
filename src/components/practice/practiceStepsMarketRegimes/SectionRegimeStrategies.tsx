export const SectionRegimeStrategies = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      Режим рынка определяет весь план торговли. Вот конкретные инструменты под каждый режим.
    </p>
    <div className="space-y-2">
      {[
        {
          regime: "Тренд",
          color: "text-green-400",
          border: "border-green-500/30",
          tools: ["EMA-пересечения (20/50)", "Пробой уровней с подтверждением", "MACD для направления", "Вход на откатах к EMA"],
          avoid: "Не торговать против тренда, не входить на пике свечи",
          example: "BTC пробил $97,000 вверх, EMA 20 выше EMA 50, ADX = 32 → ищем только CALL на откатах",
        },
        {
          regime: "Боковик",
          color: "text-blue-400",
          border: "border-blue-500/30",
          tools: ["RSI перекупленность (>70) и перепроданность (<30)", "Отскоки от чётких уровней", "Bollinger Bands (отскок от краёв)", "Сеточный бот"],
          avoid: "Не торговать пробои — 80% из них ложные в боковике",
          example: "BTC ходит между $95,000 и $97,000 третий час, ADX = 15 → ждём касания границ канала",
        },
        {
          regime: "Высокая волатильность",
          color: "text-yellow-400",
          border: "border-yellow-500/30",
          tools: ["Пропуск большинства сигналов", "Торговля только по чётким новостным движениям", "Уменьшение размера ставки в 2–4 раза"],
          avoid: "Не держать открытые позиции — рынок может развернуться на 3–5% за минуты",
          example: "Вышли данные CPI — BTC прыгнул на 3% за 10 минут, ATR × 2.5 → ждём стабилизации 15–30 минут",
        },
        {
          regime: "Переход",
          color: "text-zinc-400",
          border: "border-zinc-500/30",
          tools: ["Ожидание", "Наблюдение за объёмом", "Установка алертов на пробой уровня"],
          avoid: "Не торговать — в переходный период убытки максимальны, сигналы ложные",
          example: "ADX = 22, EMA сближаются, объём снизился → сидим в сайдлайне, ждём прорыва",
        },
      ].map((item, i) => (
        <div key={i} className={`border ${item.border} rounded-xl p-4 space-y-2`}>
          <div className={`font-orbitron text-sm font-bold ${item.color}`}>{item.regime}</div>
          <div className="flex flex-wrap gap-1">
            {item.tools.map((t, j) => (
              <span key={j} className="bg-zinc-800 text-zinc-300 text-xs font-space-mono px-2 py-0.5 rounded-md">{t}</span>
            ))}
          </div>
          <div className="flex gap-2 items-start">
            <span className="text-red-400 text-xs shrink-0">✗</span>
            <span className="text-zinc-400 text-xs font-space-mono">{item.avoid}</span>
          </div>
          <div className="bg-zinc-900 rounded-lg p-3">
            <span className="text-zinc-500 text-xs font-space-mono">Пример: </span>
            <span className="text-zinc-300 text-xs font-space-mono">{item.example}</span>
          </div>
        </div>
      ))}
    </div>

    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
      <div className="text-purple-400 font-orbitron text-xs font-bold mb-2">Из жизни: как думает Рэй Далио</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Bridgewater Associates — крупнейший хедж-фонд мира. Их подход «All Weather» строится на одной идее:
        рынок проходит через разные режимы, и одна стратегия не работает всегда. Они держат разные инструменты
        под каждый режим. Для трейдера BTC логика та же: не одна стратегия навсегда, а адаптация под то,
        что происходит прямо сейчас.
      </p>
    </div>

    <div className="bg-zinc-950 border border-zinc-700 rounded-xl overflow-hidden">
      <div className="bg-zinc-900 px-4 py-2.5 border-b border-zinc-800">
        <span className="font-orbitron text-xs font-bold text-white">Шпаргалка: режимы рынка — всё в одном</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-space-mono">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-3 py-2 text-zinc-500 font-normal">Режим</th>
              <th className="text-left px-3 py-2 text-zinc-500 font-normal">Сигнал</th>
              <th className="text-left px-3 py-2 text-zinc-500 font-normal">Что делать</th>
              <th className="text-left px-3 py-2 text-zinc-500 font-normal">Риск</th>
            </tr>
          </thead>
          <tbody>
            {[
              { regime: "📈 Тренд", color: "text-green-400", signal: "ADX > 25, EMA расходятся", action: "Трендовые входы, EMA-кросс, пробои", risk: "1–2% на сделку", riskColor: "text-green-400" },
              { regime: "↔️ Боковик", color: "text-blue-400", signal: "ADX < 20, цена в канале", action: "Отскоки от уровней, RSI, сетка", risk: "0.5–1% на сделку", riskColor: "text-blue-400" },
              { regime: "⚡ Волатильность", color: "text-yellow-400", signal: "ATR > 1.5× нормы", action: "Пропуск или минимальные ставки", risk: "0.25–0.5% или пропуск", riskColor: "text-yellow-400" },
              { regime: "🔄 Переход", color: "text-zinc-400", signal: "ADX 20–25, EMA сближаются", action: "Ждать. Не торговать.", risk: "Пропуск", riskColor: "text-zinc-500" },
            ].map((row, i) => (
              <tr key={i} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/50 transition-colors">
                <td className={`px-3 py-2.5 font-bold ${row.color}`}>{row.regime}</td>
                <td className="px-3 py-2.5 text-zinc-400">{row.signal}</td>
                <td className="px-3 py-2.5 text-zinc-300">{row.action}</td>
                <td className={`px-3 py-2.5 font-bold ${row.riskColor}`}>{row.risk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)
