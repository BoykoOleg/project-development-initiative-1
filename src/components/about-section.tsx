import { Badge } from "@/components/ui/badge"

function MiniCandleChart() {
  const candles = [
    { o: 70, c: 55, h: 75, l: 50, bull: false },
    { o: 55, c: 72, h: 78, l: 52, bull: true },
    { o: 72, c: 65, h: 76, l: 62, bull: false },
    { o: 65, c: 85, h: 88, l: 63, bull: true },
    { o: 85, c: 78, h: 90, l: 75, bull: false },
    { o: 78, c: 95, h: 98, l: 76, bull: true },
    { o: 95, c: 88, h: 100, l: 85, bull: false },
    { o: 88, c: 110, h: 113, l: 86, bull: true },
  ]
  const w = 160, h = 80, pad = 8
  const step = (w - pad * 2) / (candles.length - 0.5)
  const maxV = 120, minV = 45
  const py = (v: number) => h - ((v - minV) / (maxV - minV)) * (h - 6) - 3
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
      {candles.map((c, i) => {
        const x = pad + i * step + step / 2
        const color = c.bull ? "#22c55e" : "#ef4444"
        const top = py(Math.max(c.o, c.c))
        const bot = py(Math.min(c.o, c.c))
        return (
          <g key={i}>
            <line x1={x} y1={py(c.h)} x2={x} y2={py(c.l)} stroke={color} strokeWidth="1" />
            <rect x={x - 4} y={top} width="8" height={Math.max(bot - top, 1.5)} fill={color} rx="0.5" />
          </g>
        )
      })}
    </svg>
  )
}

function MiniRSI() {
  const vals = [50, 60, 72, 78, 65, 45, 32, 28, 38, 52, 65, 73, 68]
  const w = 160, h = 50
  const px = (i: number) => 4 + (i / (vals.length - 1)) * (w - 8)
  const py = (v: number) => h - (v / 100) * (h - 6) - 3
  const path = vals.map((v, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${py(v)}`).join(" ")
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
      <rect x="4" y={py(70)} width={w - 8} height={py(30) - py(70)} fill="#ef444410" />
      <line x1="4" y1={py(70)} x2={w - 4} y2={py(70)} stroke="#ef4444" strokeWidth="0.7" strokeDasharray="3,2" />
      <line x1="4" y1={py(30)} x2={w - 4} y2={py(30)} stroke="#22c55e" strokeWidth="0.7" strokeDasharray="3,2" />
      <path d={path} stroke="#a78bfa" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

function MiniGrid() {
  const levels = [20, 35, 50, 65, 80]
  const pricePath = "10,65 30,55 50,38 70,50 90,35 110,48 130,30 150,42"
  return (
    <svg viewBox="0 0 160 90" className="w-full h-full">
      {levels.map((y, i) => (
        <line key={i} x1="8" y1={y} x2="152" y2={y} stroke={i % 2 === 0 ? "#22c55e25" : "#ef444425"} strokeWidth="1" strokeDasharray="3,2" />
      ))}
      <polyline points={pricePath} fill="none" stroke="#e5e7eb" strokeWidth="1.5" />
      {[[50, 38], [90, 35], [130, 30]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#ef4444" />
      ))}
      {[[30, 55], [70, 50], [110, 48]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#22c55e" />
      ))}
    </svg>
  )
}

const learningPath = [
  {
    step: "01",
    title: "Понять рынок",
    desc: "Типы рынков, участники, стакан ордеров, ликвидность. Как деньги текут между покупателями и продавцами.",
    color: "from-blue-600 to-blue-800",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/5",
    textColor: "text-blue-400",
    chart: <MiniCandleChart />,
    tag: "Глава 1–2",
    results: ["Читать стакан ордеров", "Выбирать нужный рынок", "Понимать ликвидность"],
  },
  {
    step: "02",
    title: "Читать графики",
    desc: "Японские свечи, тайм-фреймы, уровни поддержки и сопротивления. Технический анализ от основ до паттернов.",
    color: "from-purple-600 to-purple-800",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-500/5",
    textColor: "text-purple-400",
    chart: <MiniRSI />,
    tag: "Глава 3–4",
    results: ["Находить уровни на графике", "Читать RSI и MACD", "Определять тренд и боковик"],
  },
  {
    step: "03",
    title: "Защитить капитал",
    desc: "Правило 1–2%, R:R соотношение, торговый журнал. Математика выживания на рынке при любой стратегии.",
    color: "from-green-600 to-green-800",
    borderColor: "border-green-500/30",
    bgColor: "bg-green-500/5",
    textColor: "text-green-400",
    chart: (
      <svg viewBox="0 0 160 80" className="w-full h-full">
        {[10, 2, 0.5].map((risk, i) => {
          const vals = Array.from({ length: 10 }, (_, j) => Math.pow(1 - risk / 100, j) * 75)
          const colors = ["#ef4444", "#f59e0b", "#22c55e"]
          const px = (j: number) => 8 + (j / 9) * 144
          const py = (v: number) => 75 - v
          const path = vals.map((v, j) => `${j === 0 ? "M" : "L"} ${px(j)} ${py(v)}`).join(" ")
          return <path key={i} d={path} stroke={colors[i]} strokeWidth="1.5" fill="none" />
        })}
        <text x="80" y="78" fontSize="7" fill="#52525b" textAnchor="middle" fontFamily="monospace">10 убыточных сделок подряд</text>
      </svg>
    ),
    tag: "Глава 5",
    results: ["Рассчитывать размер позиции", "Ставить правильный стоп-лосс", "Вести торговый журнал"],
  },
  {
    step: "04",
    title: "Автоматизировать",
    desc: "Торговые боты, стратегии Grid и DCA, бэктестинг, платформы без кода. От идеи до работающего алгоритма.",
    color: "from-red-600 to-red-800",
    borderColor: "border-red-500/30",
    bgColor: "bg-red-500/5",
    textColor: "text-red-400",
    chart: <MiniGrid />,
    tag: "Боты (5 глав)",
    results: ["Запустить Grid или DCA бота", "Протестировать стратегию на истории", "Настроить мониторинг в Telegram"],
  },
]

const stats = [
  { value: "10", unit: "глав", label: "Структурированного контента" },
  { value: "40+", unit: "тем", label: "От нуля до алгоритмов" },
  { value: "20+", unit: "таблиц", label: "Со сравнениями и расчётами" },
  { value: "100%", unit: "бесплатно", label: "Открытый доступ ко всему" },
]

export function AboutSection() {
  return (
    <section className="py-24 px-6 bg-black border-t border-zinc-900">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 mb-4">Чему вы научитесь</Badge>
          <h2 className="font-orbitron text-4xl md:text-5xl font-bold text-white mb-6">
            От нуля до первого бота —<br className="hidden md:block" /> понятно и по порядку
          </h2>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            База знаний построена как курс с последовательным прохождением. Каждая глава — конкретный навык с примерами, таблицами и графиками.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-20">
          {stats.map((s, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center">
              <div className="font-orbitron text-3xl font-bold text-white mb-0.5">{s.value}</div>
              <div className="font-space-mono text-red-400 text-sm mb-1">{s.unit}</div>
              <div className="text-zinc-500 text-xs font-space-mono">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Learning path */}
        <div className="space-y-8">
          {learningPath.map((item, i) => (
            <div
              key={i}
              className={`border rounded-2xl p-6 md:p-8 ${item.borderColor} ${item.bgColor} transition-all duration-300 hover:scale-[1.01]`}
            >
              <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 items-start">
                {/* Step + title */}
                <div className="flex items-center gap-4 md:flex-col md:items-start md:min-w-[140px]">
                  <div className={`font-orbitron text-5xl font-black ${item.textColor} opacity-30 leading-none`}>
                    {item.step}
                  </div>
                  <div>
                    <Badge className={`mb-2 text-xs font-space-mono border ${item.borderColor} bg-transparent ${item.textColor}`}>
                      {item.tag}
                    </Badge>
                    <h3 className={`font-orbitron text-xl font-bold ${item.textColor}`}>{item.title}</h3>
                  </div>
                </div>

                {/* Description + results */}
                <div className="space-y-4">
                  <p className="text-gray-300 leading-relaxed">{item.desc}</p>
                  <div>
                    <div className="text-zinc-500 text-xs font-space-mono mb-2 uppercase tracking-wider">После этого блока вы сможете:</div>
                    <ul className="space-y-1.5">
                      {item.results.map((r, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm font-space-mono text-zinc-300">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${item.textColor} border ${item.borderColor}`}>
                            ✓
                          </span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Mini chart */}
                <div className={`hidden md:block w-44 h-24 rounded-xl border ${item.borderColor} bg-zinc-950/60 p-2 flex-shrink-0`}>
                  {item.chart}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          <a
            href="/trading-basics"
            className="group bg-zinc-900 border border-zinc-800 hover:border-red-500/40 rounded-2xl p-6 transition-all duration-300 hover:bg-zinc-800/60"
          >
            <div className="text-3xl mb-3">📈</div>
            <div className="font-orbitron text-lg font-bold text-white mb-2 group-hover:text-red-400 transition-colors">
              Начать с основ трейдинга
            </div>
            <p className="text-zinc-400 font-space-mono text-sm leading-relaxed">
              5 глав: рынки, ордера, теханализ, индикаторы, риск-менеджмент. Для тех, кто начинает с нуля.
            </p>
            <div className="flex items-center gap-4 mt-4 text-xs font-space-mono text-zinc-500">
              <span className="text-green-400">● Начинающий</span>
              <span>~40 мин</span>
              <span className="text-red-400 group-hover:translate-x-1 transition-transform inline-block">Читать →</span>
            </div>
          </a>
          <a
            href="/bots-guide"
            className="group bg-zinc-900 border border-zinc-800 hover:border-red-500/40 rounded-2xl p-6 transition-all duration-300 hover:bg-zinc-800/60"
          >
            <div className="text-3xl mb-3">🤖</div>
            <div className="font-orbitron text-lg font-bold text-white mb-2 group-hover:text-red-400 transition-colors">
              Перейти к торговым ботам
            </div>
            <p className="text-zinc-400 font-space-mono text-sm leading-relaxed">
              5 глав: принципы работы, Grid/DCA/тренд стратегии, бэктестинг, платформы, чеклист запуска.
            </p>
            <div className="flex items-center gap-4 mt-4 text-xs font-space-mono text-zinc-500">
              <span className="text-yellow-400">● Средний</span>
              <span>~45 мин</span>
              <span className="text-red-400 group-hover:translate-x-1 transition-transform inline-block">Читать →</span>
            </div>
          </a>
        </div>

      </div>
    </section>
  )
}
