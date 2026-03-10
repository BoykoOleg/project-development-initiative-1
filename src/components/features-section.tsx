import { Badge } from "@/components/ui/badge"

const features = [
  {
    icon: "🧠",
    title: "Основы трейдинга",
    description: "Фундаментальные знания о рынках: типы ордеров, стакан, ликвидность, тайм-фреймы и базовые стратегии.",
    badge: "Начало",
    badgeColor: "text-blue-400 border-blue-500/30",
    hoverBorder: "group-hover:border-blue-500/40",
    textColor: "text-blue-400",
    details: ["Рынки и биржи", "Типы ордеров", "Основы стакана"],
    href: "/trading-basics",
    chartColor: "#60a5fa",
    chartType: "line",
  },
  {
    icon: "⚡",
    title: "Технический анализ",
    description: "Индикаторы, паттерны свечей, уровни поддержки и сопротивления, сигналы для входа и выхода.",
    badge: "Анализ",
    badgeColor: "text-yellow-400 border-yellow-500/30",
    hoverBorder: "group-hover:border-yellow-500/40",
    textColor: "text-yellow-400",
    details: ["RSI, MACD, Bollinger", "Паттерны свечей", "Уровни S&R"],
    href: "/trading-basics#ta",
    chartColor: "#facc15",
    chartType: "bar",
  },
  {
    icon: "🤖",
    title: "Торговые боты",
    description: "Принципы работы алгоритмической торговли: стратегии, бэктестинг, подключение к биржам через API.",
    badge: "Боты",
    badgeColor: "text-red-400 border-red-500/30",
    hoverBorder: "group-hover:border-red-500/40",
    textColor: "text-red-400",
    details: ["Grid, DCA, тренд", "Бэктестинг", "Telegram-мониторинг"],
    href: "/bots-guide",
    chartColor: "#f87171",
    chartType: "bar",
  },
  {
    icon: "🛡️",
    title: "Управление рисками",
    description: "Размер позиции, стоп-лосс, соотношение риск/прибыль, диверсификация и защита депозита.",
    badge: "Риски",
    badgeColor: "text-green-400 border-green-500/30",
    hoverBorder: "group-hover:border-green-500/40",
    textColor: "text-green-400",
    details: ["Правило 1–2%", "R:R соотношение", "Торговый журнал"],
    href: "/trading-basics#riskmanagement",
    chartColor: "#4ade80",
    chartType: "line",
  },
  {
    icon: "🧘",
    title: "Психология трейдера",
    description: "Торговая дисциплина, работа с эмоциями, ведение торгового журнала и анализ ошибок.",
    badge: "Mindset",
    badgeColor: "text-purple-400 border-purple-500/30",
    hoverBorder: "group-hover:border-purple-500/40",
    textColor: "text-purple-400",
    details: ["FOMO и страх потерь", "Дисциплина", "Разбор ошибок"],
    href: "/trading-basics#psychology",
    chartColor: "#c084fc",
    chartType: "line",
  },
  {
    icon: "⚙️",
    title: "Инструменты и платформы",
    description: "Обзор торговых терминалов, бирж, скринеров и сервисов для автоматизации торговли без кода.",
    badge: "Инструменты",
    badgeColor: "text-orange-400 border-orange-500/30",
    hoverBorder: "group-hover:border-orange-500/40",
    textColor: "text-orange-400",
    details: ["TradingView, Bybit", "Скринеры", "No-code боты"],
    href: "/bots-guide#platforms",
    chartColor: "#fb923c",
    chartType: "bar",
  },
]

function MiniLineChart({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 56 28" className="w-full h-full">
      <polyline
        points="4,20 10,14 18,18 26,8 34,12 42,5 50,9"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="4,28 4,20 10,14 18,18 26,8 34,12 42,5 50,9 50,28"
        fill={color}
        fillOpacity="0.1"
        stroke="none"
      />
    </svg>
  )
}

function MiniBarChart({ color }: { color: string }) {
  const heights = [30, 50, 40, 70, 55, 80, 65]
  return (
    <svg viewBox="0 0 56 32" className="w-full h-full" preserveAspectRatio="none">
      {heights.map((h, i) => (
        <rect key={i} x={i * 8 + 1} y={32 - h / 3} width="6" height={h / 3} rx="1" fill={color} opacity={0.5 + i * 0.07} />
      ))}
    </svg>
  )
}

export function FeaturesSection() {
  return (
    <section className="py-24 px-6 bg-zinc-950 border-t border-zinc-900">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-16">
          <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 mb-4 font-space-mono">Разделы базы знаний</Badge>
          <h2 className="font-orbitron text-4xl md:text-5xl font-bold text-white mb-5">
            Что вы найдёте внутри
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Структурированные материалы по 6 направлениям — от рыночной механики до автоматической торговли
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <a
              key={i}
              href={f.href}
              className={`group bg-zinc-900 border border-zinc-800 ${f.hoverBorder} rounded-2xl p-6 transition-all duration-300 hover:bg-zinc-800/60 hover:scale-[1.02] block`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-3xl">{f.icon}</div>
                <div className="w-16 h-8 opacity-40 group-hover:opacity-80 transition-opacity">
                  {f.chartType === "line"
                    ? <MiniLineChart color={f.chartColor} />
                    : <MiniBarChart color={f.chartColor} />}
                </div>
              </div>

              <span className={`inline-block font-space-mono text-xs border rounded-full px-2 py-0.5 mb-3 ${f.badgeColor} bg-transparent`}>
                {f.badge}
              </span>

              <h3 className={`font-orbitron text-base font-bold text-white mb-2 group-hover:${f.textColor} transition-colors`}>
                {f.title}
              </h3>

              <p className="text-zinc-400 font-space-mono text-xs leading-relaxed mb-4">
                {f.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {f.details.map((d, j) => (
                  <span key={j} className="text-zinc-500 font-space-mono text-xs bg-zinc-800 rounded-md px-2 py-0.5">
                    {d}
                  </span>
                ))}
              </div>

              <div className={`flex items-center gap-1.5 text-xs font-space-mono ${f.textColor} opacity-60 group-hover:opacity-100 transition-all`}>
                <span>Читать</span>
                <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-r from-zinc-900 via-zinc-900 to-red-950/30 border border-zinc-800 hover:border-red-500/30 rounded-2xl p-7 flex flex-col md:flex-row items-center justify-between gap-5 transition-colors duration-300">
          <div className="text-center md:text-left">
            <div className="font-orbitron text-xl font-bold text-white mb-1">Хотите собрать своего бота прямо сейчас?</div>
            <p className="text-zinc-400 font-space-mono text-sm">Конструктор генерирует готовый Python-код по вашим параметрам — без программирования</p>
          </div>
          <a
            href="/bot-builder"
            className="shrink-0 bg-red-600 hover:bg-red-500 text-white font-orbitron text-sm px-6 py-3 rounded-xl transition-colors duration-200 whitespace-nowrap"
          >
            Открыть конструктор →
          </a>
        </div>

      </div>
    </section>
  )
}
