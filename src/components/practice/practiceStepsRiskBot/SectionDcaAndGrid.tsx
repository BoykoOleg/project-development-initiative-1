// Визуал: DCA — визуальный график покупок + средняя цена
const DcaChart = () => {
  const weeks = [
    { label: "Нед. 1", price: 94000, amount: 100 },
    { label: "Нед. 2", price: 91000, amount: 100 },
    { label: "Нед. 3", price: 96500, amount: 100 },
    { label: "Нед. 4", price: 98000, amount: 100 },
    { label: "Нед. 5", price: 89500, amount: 100 },
    { label: "Нед. 6", price: 92000, amount: 100 },
    { label: "Нед. 7", price: 100000, amount: 100 },
    { label: "Нед. 8", price: 97000, amount: 100 },
  ]

  const minP = Math.min(...weeks.map((w) => w.price))
  const maxP = Math.max(...weeks.map((w) => w.price))
  const range = maxP - minP

  const totalBtc = weeks.reduce((acc, w) => acc + w.amount / w.price, 0)
  const totalUsd = weeks.reduce((acc, w) => acc + w.amount, 0)
  const avgPrice = totalUsd / totalBtc

  const currentPrice = weeks[weeks.length - 1].price
  const portfolioValue = totalBtc * currentPrice
  const pnl = portfolioValue - totalUsd

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-4">
        DCA на BTC: $100 каждую неделю × 8 недель
      </div>
      <div className="flex items-end gap-2 h-28 mb-1">
        {weeks.map((w, i) => {
          const barH = Math.max(15, ((w.price - minP) / range) * 80 + 20)
          const isAboveAvg = w.price > avgPrice
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 relative group">
              <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-[9px] font-space-mono text-white whitespace-nowrap z-10 pointer-events-none">
                ${(w.price / 1000).toFixed(1)}K
              </div>
              <div
                className={`w-full rounded-t-sm transition-all ${isAboveAvg ? "bg-purple-500/70" : "bg-blue-500/70"}`}
                style={{ height: `${barH}%` }}
              />
              <span className="text-[8px] font-space-mono text-zinc-600">{w.label}</span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-px border-t-2 border-dashed border-yellow-400" />
        <span className="text-yellow-400 text-[10px] font-space-mono">
          Средняя цена покупки: ${Math.round(avgPrice).toLocaleString()}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="bg-zinc-900 rounded-lg p-2 text-center">
          <div className="text-zinc-500 text-[9px] font-space-mono mb-1">Вложено</div>
          <div className="text-white text-xs font-orbitron font-bold">${totalUsd}</div>
        </div>
        <div className="bg-zinc-900 rounded-lg p-2 text-center">
          <div className="text-zinc-500 text-[9px] font-space-mono mb-1">BTC куплено</div>
          <div className="text-purple-400 text-xs font-orbitron font-bold">{totalBtc.toFixed(5)}</div>
        </div>
        <div className="bg-zinc-900 rounded-lg p-2 text-center">
          <div className="text-zinc-500 text-[9px] font-space-mono mb-1">Прибыль</div>
          <div className={`text-xs font-orbitron font-bold ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
            {pnl >= 0 ? "+" : ""}${Math.round(pnl)}
          </div>
        </div>
      </div>
      <p className="text-zinc-600 text-[9px] font-space-mono mt-2">
        Синие = ниже средней цены, фиолетовые = выше средней цены
      </p>
    </div>
  )
}

// Визуал: Grid-бот — схема сетки ордеров
const GridBotVisual = () => {
  const rangeMin = 93000
  const rangeMax = 99000
  const step = 1000
  const levels: number[] = []
  for (let p = rangeMax; p >= rangeMin; p -= step) levels.push(p)

  const currentPrice = 95500

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-4 flex items-center justify-between">
        <span>Grid-бот: сетка ордеров BTC/USD</span>
        <span className="text-yellow-400 font-space-mono text-xs">${currentPrice.toLocaleString()} ← текущая цена</span>
      </div>
      <div className="space-y-1">
        {levels.map((price) => {
          const isCurrent = Math.abs(price - currentPrice) < 500
          const isAbove = price > currentPrice
          const isBoundary = price === rangeMax || price === rangeMin

          return (
            <div
              key={price}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 border transition-all ${
                isBoundary
                  ? "border-orange-500/50 bg-orange-500/10"
                  : isCurrent
                  ? "border-yellow-400/60 bg-yellow-400/10"
                  : isAbove
                  ? "border-red-500/20 bg-red-500/5"
                  : "border-green-500/20 bg-green-500/5"
              }`}
            >
              <span className={`text-xs font-space-mono font-bold w-24 ${isBoundary ? "text-orange-400" : isCurrent ? "text-yellow-400" : "text-zinc-300"}`}>
                ${price.toLocaleString()}
              </span>
              {isBoundary ? (
                <span className="text-orange-400 text-[10px] font-orbitron">
                  {price === rangeMax ? "▲ Верхняя граница — стоп" : "▼ Нижняя граница — стоп"}
                </span>
              ) : isCurrent ? (
                <span className="text-yellow-400 text-[10px] font-orbitron">◉ Текущая цена</span>
              ) : isAbove ? (
                <div className="flex items-center gap-3">
                  <span className="text-red-400 text-[10px] font-space-mono">SELL ордер</span>
                  <div className="w-16 h-1.5 bg-red-500/40 rounded-full">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: "70%" }} />
                  </div>
                  <span className="text-zinc-500 text-[10px] font-space-mono">+0.5% прибыли</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-[10px] font-space-mono">BUY ордер</span>
                  <div className="w-16 h-1.5 bg-green-500/40 rounded-full">
                    <div className="h-full bg-green-400 rounded-full" style={{ width: "70%" }} />
                  </div>
                  <span className="text-zinc-500 text-[10px] font-space-mono">ждёт падения</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-zinc-800 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-zinc-600 text-[9px] font-space-mono">Уровней</div>
          <div className="text-white text-sm font-orbitron font-bold">{levels.length}</div>
        </div>
        <div>
          <div className="text-zinc-600 text-[9px] font-space-mono">Шаг сетки</div>
          <div className="text-purple-400 text-sm font-orbitron font-bold">$1,000</div>
        </div>
        <div>
          <div className="text-zinc-600 text-[9px] font-space-mono">Прибыль/шаг</div>
          <div className="text-green-400 text-sm font-orbitron font-bold">~0.5%</div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Экспорт: секции 2 и 3 Шага 4 (DCA-бот и Grid-бот)
// ─────────────────────────────────────────────────────────────

export const SectionDcaBot = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      Dollar Cost Averaging (DCA) — покупка фиксированной суммы актива через равные интервалы времени.
      Не нужно угадывать «дно» — стратегия усредняет цену автоматически.
    </p>
    <DcaChart />
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">Пример DCA на BTC за 4 недели</div>
      <div className="space-y-2">
        {[
          { week: "Неделя 1", price: "$94,000", amount: "$100", btc: "0.00106 BTC" },
          { week: "Неделя 2", price: "$91,000", amount: "$100", btc: "0.00110 BTC" },
          { week: "Неделя 3", price: "$96,500", amount: "$100", btc: "0.00104 BTC" },
          { week: "Неделя 4", price: "$98,000", amount: "$100", btc: "0.00102 BTC" },
        ].map((row, i) => (
          <div key={i} className="flex items-center gap-2 text-xs font-space-mono">
            <span className="text-zinc-500 w-20">{row.week}</span>
            <span className="text-zinc-400 w-20">{row.price}</span>
            <span className="text-white w-14">{row.amount}</span>
            <span className="text-green-400">{row.btc}</span>
          </div>
        ))}
        <div className="border-t border-zinc-800 pt-2 flex items-center gap-2 text-xs font-space-mono">
          <span className="text-zinc-500 w-20">Итого</span>
          <span className="text-yellow-400 w-20">Ср. $94,875</span>
          <span className="text-white w-14">$400</span>
          <span className="text-green-400 font-bold">0.00422 BTC</span>
        </div>
      </div>
    </div>
    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
      <div className="text-green-400 font-orbitron text-xs font-bold mb-2">Из жизни: как инвестирует Майкл Сэйлор</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Майкл Сэйлор, CEO MicroStrategy, публично применяет принцип DCA для корпоративных покупок биткоина.
        Компания покупает BTC каждый квартал на фиксированную сумму — независимо от цены.
        К 2024 году MicroStrategy накопила более 190,000 BTC со средней ценой покупки около $31,224.
        При цене BTC выше $95K — это многократный рост. Систематичность важнее попытки поймать «идеальный момент».
      </p>
    </div>
  </div>
)

export const SectionGridBot = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      Grid-бот выставляет сетку ордеров на покупку и продажу. Каждое колебание цены внутри диапазона приносит прибыль.
      Идеален для боковых рынков, которые составляют 70% времени.
    </p>
    <GridBotVisual />
    <div className="space-y-2">
      {[
        { param: "Диапазон", value: "$93,000 — $99,000", desc: "Зона, где BTC торгуется в боковике", color: "text-blue-400" },
        { param: "Шаг сетки", value: "$500 (12 уровней)", desc: "Каждые $500 — ордер на покупку и продажу", color: "text-purple-400" },
        { param: "Прибыль с шага", value: "0.5% за движение", desc: "Бот зарабатывает на каждом полном качании цены", color: "text-green-400" },
        { param: "Риск", value: "Выход из диапазона", desc: "Если BTC уходит ниже $93K или выше $99K — бот останавливается", color: "text-red-400" },
      ].map((row, i) => (
        <div key={i} className="flex gap-3 items-start bg-zinc-900 border border-zinc-800 rounded-lg p-3">
          <div className={`font-orbitron text-xs font-bold ${row.color} w-20 shrink-0`}>{row.param}</div>
          <div>
            <div className="text-white text-xs font-space-mono font-bold mb-0.5">{row.value}</div>
            <p className="text-zinc-500 text-xs font-space-mono">{row.desc}</p>
          </div>
        </div>
      ))}
    </div>
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
      <div className="text-blue-400 font-orbitron text-xs font-bold mb-2">Из жизни: алгоритмы маркет-мейкеров</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Крупные маркет-мейкеры (Citadel Securities, Virtu Financial) зарабатывают именно на сетке ордеров — выставляя bid и ask одновременно.
        Они не угадывают направление: они зарабатывают на спреде и объёме.
        Grid-бот — это доступная версия той же стратегии для розничного трейдера.
        По данным Virtu Financial, компания была прибыльна в 1,237 из 1,238 торговых дней — именно благодаря этому подходу.
      </p>
    </div>
  </div>
)
