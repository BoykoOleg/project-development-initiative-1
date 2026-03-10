export function BotWorkflowDiagram() {
  const steps = [
    { label: "Биржа\n(Данные)", icon: "📊", color: "#3b82f6" },
    { label: "API\n(Запрос)", icon: "🔌", color: "#8b5cf6" },
    { label: "Бот\n(Анализ)", icon: "🤖", color: "#ef4444" },
    { label: "Стратегия\n(Решение)", icon: "🧠", color: "#f59e0b" },
    { label: "Ордер\n(Сделка)", icon: "📈", color: "#22c55e" },
  ]
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 my-4">
      <p className="text-zinc-400 text-xs font-space-mono mb-4">Цикл работы торгового бота (каждые ~100мс)</p>
      <div className="flex items-center justify-between overflow-x-auto gap-1">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-1 flex-shrink-0">
            <div className="flex flex-col items-center">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-xl border"
                style={{ borderColor: s.color + "50", backgroundColor: s.color + "15" }}
              >
                {s.icon}
              </div>
              <div className="text-center mt-1">
                {s.label.split("\n").map((l, j) => (
                  <div key={j} className="text-xs font-space-mono" style={{ color: j === 0 ? "white" : "#71717a", fontSize: j === 0 ? "10px" : "9px" }}>{l}</div>
                ))}
              </div>
            </div>
            {i < steps.length - 1 && (
              <svg width="24" height="16" className="flex-shrink-0 mt-[-10px]">
                <path d="M4 8 L20 8 M14 4 L20 8 L14 12" stroke="#3f3f46" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <div className="bg-zinc-900 rounded px-3 py-1.5 text-xs font-space-mono text-zinc-400">
          <span className="text-white">Скорость:</span> 50–500 мс на полный цикл
        </div>
        <div className="bg-zinc-900 rounded px-3 py-1.5 text-xs font-space-mono text-zinc-400">
          <span className="text-white">24/7:</span> без перерывов и эмоций
        </div>
        <div className="bg-zinc-900 rounded px-3 py-1.5 text-xs font-space-mono text-zinc-400">
          <span className="text-white">HFT-боты:</span> до 1 мс
        </div>
      </div>
    </div>
  )
}

export function GridBotChart() {
  const gridLevels = [40, 60, 80, 100, 120, 140, 160]
  const pricePath = "20,140 50,130 80,110 110,100 140,120 170,90 200,80 230,100 260,110 290,90 320,80 350,60"
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 my-4">
      <p className="text-zinc-400 text-xs font-space-mono mb-2">Grid-бот: сетка ордеров в диапазоне цены</p>
      <svg viewBox="0 0 370 170" className="w-full h-44">
        {gridLevels.map((y, i) => (
          <g key={i}>
            <line x1="15" y1={y} x2="355" y2={y} stroke={i % 2 === 0 ? "#22c55e33" : "#ef444433"} strokeWidth="1" strokeDasharray="4,3" />
            <text x="357" y={y + 4} fontSize="7" fill={i % 2 === 0 ? "#86efac" : "#fca5a5"} fontFamily="monospace">
              {i % 2 === 0 ? "BUY" : "SELL"}
            </text>
          </g>
        ))}
        <polyline points={pricePath} fill="none" stroke="#e5e7eb" strokeWidth="2" />
        {[{x:170,y:90,type:"S"},{x:260,y:110,type:"B"},{x:290,y:90,type:"S"},{x:110,y:100,type:"B"}].map((m, i) => (
          <g key={i}>
            <circle cx={m.x} cy={m.y} r="5" fill={m.type === "B" ? "#22c55e" : "#ef4444"} opacity="0.9" />
            <text x={m.x} y={m.y + 4} fontSize="7" fill="white" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{m.type}</text>
          </g>
        ))}
        <text x="15" y="158" fontSize="8" fill="#52525b" fontFamily="monospace">B = Покупка на уровне сетки, S = Продажа на уровне сетки → постоянный доход в боковике</text>
      </svg>
    </div>
  )
}

export function DCAChart() {
  const entries = [
    { x: 30, y: 60, price: "$45k" },
    { x: 90, y: 90, price: "$42k" },
    { x: 150, y: 110, price: "$40k" },
    { x: 210, y: 130, price: "$38k" },
    { x: 270, y: 100, price: "$41k" },
    { x: 330, y: 70, price: "$44k" },
  ]
  const prices = [60, 65, 80, 90, 100, 110, 125, 130, 115, 100, 95, 110, 130, 120, 105, 80, 70, 60, 75, 100, 115]
  const w = 360, ph = 150
  const px = (i: number) => 15 + (i / (prices.length - 1)) * (w - 30)
  const py = (v: number) => ph - ((v - 55) / 80) * (ph - 20) - 10
  const path = prices.map((v, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${py(v)}`).join(" ")
  const avgY = py(90)
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 my-4">
      <p className="text-zinc-400 text-xs font-space-mono mb-2">DCA-бот: усреднение при падении, снижение средней цены</p>
      <svg viewBox={`0 0 ${w} ${ph + 10}`} className="w-full h-44">
        <line x1="15" y1={avgY} x2={w - 15} y2={avgY} stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="5,3" />
        <text x={w - 14} y={avgY - 3} fontSize="8" fill="#fbbf24" fontFamily="monospace" textAnchor="end">Ср. цена</text>
        <path d={path} stroke="#e5e7eb" strokeWidth="2" fill="none" />
        {entries.map((e, i) => (
          <g key={i}>
            <circle cx={e.x} cy={e.y} r="5" fill="#3b82f6" />
            <text x={e.x} y={e.y - 8} fontSize="7" fill="#93c5fd" textAnchor="middle" fontFamily="monospace">{e.price}</text>
          </g>
        ))}
        <text x="185" y={ph + 8} fontSize="8" fill="#52525b" textAnchor="middle" fontFamily="monospace">Синие точки = покупки DCA-бота при каждом падении</text>
      </svg>
    </div>
  )
}

export function StrategyComparisonTable() {
  const strategies = [
    { name: "Grid", market: "Боковик", risk: "Низкий", capital: "От $200", complexity: "Низкая", best: "Стабильные флэт-рынки" },
    { name: "DCA", market: "Любой", risk: "Низкий", capital: "От $100", complexity: "Очень низкая", best: "Долгосрочное накопление" },
    { name: "Тренд (EMA/MACD)", market: "Тренд", risk: "Средний", capital: "От $300", complexity: "Средняя", best: "Сильные трендовые рынки" },
    { name: "Скальпинг", market: "Любой ликвидный", risk: "Высокий", capital: "От $1000", complexity: "Высокая", best: "BTC, ETH на M1–M5" },
    { name: "Арбитраж", market: "Любой", risk: "Низкий*", capital: "От $5000", complexity: "Очень высокая", best: "Кросс-биржевой спред" },
    { name: "Мартингейл", market: "Боковик", risk: "Очень высокий", capital: "Резервный", complexity: "Низкая", best: "Не рекомендуется" },
  ]
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden my-4">
      <div className="px-4 py-2 border-b border-zinc-800">
        <p className="text-zinc-400 text-xs font-space-mono">Сравнение стратегий для торговых ботов</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-space-mono">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-4 py-2 text-zinc-500">Стратегия</th>
              <th className="text-left px-4 py-2 text-zinc-500">Рынок</th>
              <th className="text-left px-4 py-2 text-zinc-500">Риск</th>
              <th className="text-left px-4 py-2 text-zinc-500">Капитал</th>
              <th className="text-left px-4 py-2 text-zinc-500">Лучший для</th>
            </tr>
          </thead>
          <tbody>
            {strategies.map((s, i) => {
              const riskColor = s.risk === "Низкий" || s.risk === "Низкий*" ? "text-green-400" : s.risk === "Средний" ? "text-yellow-400" : "text-red-400"
              return (
                <tr key={i} className={`border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors ${s.name === "Мартингейл" ? "opacity-60" : ""}`}>
                  <td className="px-4 py-2 text-red-400 font-bold">{s.name}</td>
                  <td className="px-4 py-2 text-zinc-300">{s.market}</td>
                  <td className={`px-4 py-2 font-semibold ${riskColor}`}>{s.risk}</td>
                  <td className="px-4 py-2 text-zinc-400">{s.capital}</td>
                  <td className="px-4 py-2 text-zinc-400">{s.best}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
