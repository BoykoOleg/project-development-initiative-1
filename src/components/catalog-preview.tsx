import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const featured = [
  {
    title: "Основы трейдинга",
    description: "5 глав от нуля: рынки, ордера, теханализ, индикаторы и риск-менеджмент.",
    badge: "Статья",
    badgeColor: "bg-zinc-700 text-zinc-300",
    level: "Начинающий",
    levelColor: "text-green-400 border-green-500/30",
    readTime: "40 мин",
    href: "/trading-basics",
    icon: "📈",
  },
  {
    title: "Гайд по торговым ботам",
    description: "Принципы работы, стратегии, бэктестинг, платформы и чеклист запуска.",
    badge: "Гайд",
    badgeColor: "bg-blue-500/20 text-blue-400",
    level: "Средний",
    levelColor: "text-yellow-400 border-yellow-500/30",
    readTime: "45 мин",
    href: "/bots-guide",
    icon: "🤖",
  },
  {
    title: "Конструктор ботов",
    description: "Настройте Grid, DCA или трендовый бот и получите готовый Python-код.",
    badge: "Инструмент",
    badgeColor: "bg-red-500/20 text-red-400",
    level: "Любой",
    levelColor: "text-zinc-400 border-zinc-600",
    readTime: "Интерактив",
    href: "/bot-builder",
    icon: "⚙️",
  },
  {
    title: "Типы ордеров",
    description: "Рыночный, лимитный, стоп-лосс, трейлинг — когда и какой ордер использовать.",
    badge: "Статья",
    badgeColor: "bg-zinc-700 text-zinc-300",
    level: "Начинающий",
    levelColor: "text-green-400 border-green-500/30",
    readTime: "6 мин",
    href: "/trading-basics#orders",
    icon: "📋",
  },
  {
    title: "Grid, DCA и трендовые боты",
    description: "Разбор 5 популярных алгоритмических стратегий с плюсами и минусами.",
    badge: "Гайд",
    badgeColor: "bg-blue-500/20 text-blue-400",
    level: "Средний",
    levelColor: "text-yellow-400 border-yellow-500/30",
    readTime: "12 мин",
    href: "/bots-guide#strategies",
    icon: "🧠",
  },
  {
    title: "Риск-менеджмент",
    description: "Правило 1–2%, соотношение R:R, торговый журнал. Как не слить депозит.",
    badge: "Статья",
    badgeColor: "bg-zinc-700 text-zinc-300",
    level: "Начинающий",
    levelColor: "text-green-400 border-green-500/30",
    readTime: "7 мин",
    href: "/trading-basics#riskmanagement",
    icon: "🛡️",
  },
]

export function CatalogPreview() {
  return (
    <section className="py-24 px-6 bg-zinc-950">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 mb-3">База знаний</Badge>
            <h2 className="text-4xl font-bold text-white font-orbitron">Популярные материалы</h2>
            <p className="text-gray-400 mt-3 max-w-lg leading-relaxed">
              Самые читаемые статьи, гайды и инструменты для трейдеров любого уровня
            </p>
          </div>
          <a
            href="/catalog"
            className="shrink-0 inline-flex items-center gap-2 border border-red-500/40 text-red-400 hover:bg-red-500/10 font-orbitron text-sm px-5 py-2.5 rounded-md transition-colors"
          >
            Весь каталог →
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((item, index) => (
            <a key={index} href={item.href} className="group block">
              <Card className="bg-zinc-900 border-zinc-800 h-full transition-all duration-300 group-hover:border-red-500/40 group-hover:bg-zinc-800/60">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-space-mono px-2 py-1 rounded-full border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                    <span className={`text-xs font-space-mono border rounded-full px-2 py-1 ${item.levelColor}`}>
                      {item.level}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{item.icon}</span>
                    <CardTitle className="font-orbitron text-base text-white leading-snug group-hover:text-red-400 transition-colors">
                      {item.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-400 font-space-mono text-xs leading-relaxed mb-4">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 font-space-mono text-xs">{item.readTime}</span>
                    <span className="text-red-400 text-xs font-space-mono group-hover:translate-x-1 transition-transform inline-block">
                      Читать →
                    </span>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
