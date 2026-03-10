export function MarketComparisonTable() {
  const markets = [
    { name: "Криптовалюта", hours: "24/7", volatility: "Очень высокая", liquidity: "Высокая", example: "BTC, ETH, SOL" },
    { name: "Форекс", hours: "24/5", volatility: "Средняя", liquidity: "Очень высокая", example: "EUR/USD, GBP/JPY" },
    { name: "Акции (РФ)", hours: "10:00–18:50", volatility: "Средняя", liquidity: "Средняя", example: "SBER, GAZP, YNDX" },
    { name: "Акции (США)", hours: "09:30–16:00 ET", volatility: "Средняя", liquidity: "Очень высокая", example: "AAPL, TSLA, NVDA" },
    { name: "Товарный", hours: "Сессии", volatility: "Низкая–Средняя", liquidity: "Средняя", example: "Нефть, Золото, Газ" },
  ]
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden my-4">
      <div className="px-4 py-2 border-b border-zinc-800">
        <p className="text-zinc-400 text-xs font-space-mono">Сравнение основных финансовых рынков</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-space-mono">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-4 py-2 text-zinc-500">Рынок</th>
              <th className="text-left px-4 py-2 text-zinc-500">Часы торгов</th>
              <th className="text-left px-4 py-2 text-zinc-500">Волатильность</th>
              <th className="text-left px-4 py-2 text-zinc-500">Ликвидность</th>
              <th className="text-left px-4 py-2 text-zinc-500">Примеры</th>
            </tr>
          </thead>
          <tbody>
            {markets.map((m, i) => (
              <tr key={i} className="border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors">
                <td className="px-4 py-2 text-white font-semibold">{m.name}</td>
                <td className="px-4 py-2 text-yellow-400">{m.hours}</td>
                <td className="px-4 py-2 text-zinc-300">{m.volatility}</td>
                <td className="px-4 py-2 text-zinc-300">{m.liquidity}</td>
                <td className="px-4 py-2 text-zinc-400">{m.example}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function TimeframeTable() {
  const tfs = [
    { tf: "M1–M5", name: "Скальпинг", desc: "Десятки сделок в день, минимальная прибыль с каждой", who: "Профессиональные скальперы" },
    { tf: "M15–M30", name: "Интрадей", desc: "Несколько сделок в день, закрытие к вечеру", who: "Дневные трейдеры" },
    { tf: "H1–H4", name: "Свинг", desc: "Позиции от часов до дней", who: "Большинство трейдеров" },
    { tf: "D1", name: "Позиционный", desc: "Удержание от дней до недель", who: "Инвесторы + трейдеры" },
    { tf: "W1–MN", name: "Долгосрочный", desc: "Месяцы и годы удержания", who: "Инвесторы" },
  ]
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden my-4">
      <div className="px-4 py-2 border-b border-zinc-800">
        <p className="text-zinc-400 text-xs font-space-mono">Тайм-фреймы и стили торговли</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-space-mono">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-4 py-2 text-zinc-500">ТФ</th>
              <th className="text-left px-4 py-2 text-zinc-500">Стиль</th>
              <th className="text-left px-4 py-2 text-zinc-500">Описание</th>
              <th className="text-left px-4 py-2 text-zinc-500">Для кого</th>
            </tr>
          </thead>
          <tbody>
            {tfs.map((t, i) => (
              <tr key={i} className="border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors">
                <td className="px-4 py-2 text-red-400 font-bold">{t.tf}</td>
                <td className="px-4 py-2 text-white font-semibold">{t.name}</td>
                <td className="px-4 py-2 text-zinc-300">{t.desc}</td>
                <td className="px-4 py-2 text-zinc-400">{t.who}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function IndicatorsComparisonTable() {
  const indicators = [
    { name: "SMA (простая MA)", type: "Трендовый", signal: "Пересечение MA200", lag: "Высокий", best: "Долгосрочный тренд" },
    { name: "EMA (экспон. MA)", type: "Трендовый", signal: "Golden/Death cross", lag: "Средний", best: "Свинг-трейдинг" },
    { name: "RSI (14)", type: "Осциллятор", signal: ">70 / <30, дивергенция", lag: "Низкий", best: "Боковой рынок" },
    { name: "MACD", type: "Трендовый+Осц.", signal: "Пересечение линий", lag: "Средний", best: "Подтверждение тренда" },
    { name: "Bollinger Bands", type: "Волатильность", signal: "Выход за полосы", lag: "Средний", best: "Волатильные рынки" },
    { name: "Stochastic", type: "Осциллятор", signal: ">80 / <20", lag: "Низкий", best: "Краткосрочная торговля" },
    { name: "Volume", type: "Объём", signal: "Рост объёма на движении", lag: "Нет", best: "Подтверждение пробоев" },
  ]
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden my-4">
      <div className="px-4 py-2 border-b border-zinc-800">
        <p className="text-zinc-400 text-xs font-space-mono">Сравнение популярных индикаторов</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-space-mono">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-4 py-2 text-zinc-500">Индикатор</th>
              <th className="text-left px-4 py-2 text-zinc-500">Тип</th>
              <th className="text-left px-4 py-2 text-zinc-500">Сигнал</th>
              <th className="text-left px-4 py-2 text-zinc-500">Запазд.</th>
              <th className="text-left px-4 py-2 text-zinc-500">Лучший для</th>
            </tr>
          </thead>
          <tbody>
            {indicators.map((ind, i) => (
              <tr key={i} className="border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors">
                <td className="px-4 py-2 text-purple-400 font-semibold">{ind.name}</td>
                <td className="px-4 py-2 text-zinc-300">{ind.type}</td>
                <td className="px-4 py-2 text-yellow-300">{ind.signal}</td>
                <td className="px-4 py-2 text-zinc-400">{ind.lag}</td>
                <td className="px-4 py-2 text-zinc-400">{ind.best}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function CandlePatternCards() {
  const patterns = [
    { name: "Доджи", color: "text-yellow-400", desc: "Открытие ≈ Закрытие. Нерешительность рынка. Сигнал потенциального разворота.", shape: "doji" },
    { name: "Молот", color: "text-green-400", desc: "Длинная нижняя тень + маленькое тело. Отклонение падения. Бычий разворот.", shape: "hammer" },
    { name: "Поглощение", color: "text-red-400", desc: "Большая свеча поглощает предыдущую. Смена настроений рынка.", shape: "engulf" },
    { name: "Пинбар", color: "text-purple-400", desc: "Длинная тень в направлении тренда. Отказ идти дальше. Сильный разворот.", shape: "pinbar" },
  ]
  function Shape({ type }: { type: string }) {
    if (type === "doji") return (
      <svg viewBox="0 0 30 60" className="h-12 mx-auto">
        <line x1="15" y1="5" x2="15" y2="55" stroke="#eab308" strokeWidth="1.5" />
        <rect x="5" y="28" width="20" height="4" fill="#eab308" />
      </svg>
    )
    if (type === "hammer") return (
      <svg viewBox="0 0 30 60" className="h-12 mx-auto">
        <line x1="15" y1="5" x2="15" y2="15" stroke="#22c55e" strokeWidth="1.5" />
        <rect x="5" y="15" width="20" height="15" fill="#22c55e" />
        <line x1="15" y1="30" x2="15" y2="55" stroke="#22c55e" strokeWidth="1.5" />
      </svg>
    )
    if (type === "engulf") return (
      <svg viewBox="0 0 50 60" className="h-12 mx-auto">
        <line x1="12" y1="8" x2="12" y2="52" stroke="#ef4444" strokeWidth="1" />
        <rect x="4" y="15" width="16" height="25" fill="#ef4444" />
        <line x1="38" y1="4" x2="38" y2="56" stroke="#22c55e" strokeWidth="1" />
        <rect x="28" y="10" width="20" height="36" fill="#22c55e" />
      </svg>
    )
    return (
      <svg viewBox="0 0 30 60" className="h-12 mx-auto">
        <line x1="15" y1="5" x2="15" y2="15" stroke="#a78bfa" strokeWidth="1.5" />
        <rect x="5" y="15" width="20" height="10" fill="#a78bfa" />
        <line x1="15" y1="25" x2="15" y2="55" stroke="#a78bfa" strokeWidth="1.5" />
      </svg>
    )
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
      {patterns.map((p, i) => (
        <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center">
          <Shape type={p.shape} />
          <div className={`font-orbitron text-sm font-bold mt-2 mb-1 ${p.color}`}>{p.name}</div>
          <div className="text-zinc-400 text-xs font-space-mono leading-relaxed">{p.desc}</div>
        </div>
      ))}
    </div>
  )
}
