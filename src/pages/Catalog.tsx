import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const categories = ["Все", "Основы", "Технический анализ", "Боты", "Риск-менеджмент", "Инструменты", "Психология"]

const materials = [
  {
    id: 1,
    title: "Что такое финансовые рынки",
    description: "Фондовый, крипто, форекс и товарный рынки. Участники, стакан ордеров, ликвидность — с нуля.",
    category: "Основы",
    level: "Начинающий",
    readTime: "8 мин",
    href: "/trading-basics#markets",
    badge: "Статья",
    badgeColor: "bg-zinc-700 text-zinc-300",
  },
  {
    id: 2,
    title: "Типы ордеров и исполнение сделок",
    description: "Рыночный, лимитный, стоп-лосс, трейлинг. Когда и какой ордер выбрать для точного входа.",
    category: "Основы",
    level: "Начинающий",
    readTime: "6 мин",
    href: "/trading-basics#orders",
    badge: "Статья",
    badgeColor: "bg-zinc-700 text-zinc-300",
  },
  {
    id: 3,
    title: "Технический анализ: чтение графиков",
    description: "Тайм-фреймы, японские свечи, уровни поддержки и сопротивления — базовый курс.",
    category: "Технический анализ",
    level: "Начинающий",
    readTime: "10 мин",
    href: "/trading-basics#analysis",
    badge: "Статья",
    badgeColor: "bg-zinc-700 text-zinc-300",
  },
  {
    id: 4,
    title: "Индикаторы: MA, RSI, MACD",
    description: "Как работают популярные индикаторы, как читать сигналы и не перегрузить график.",
    category: "Технический анализ",
    level: "Средний",
    readTime: "9 мин",
    href: "/trading-basics#indicators",
    badge: "Статья",
    badgeColor: "bg-zinc-700 text-zinc-300",
  },
  {
    id: 5,
    title: "Риск-менеджмент: как не слить депозит",
    description: "Правило 1-2%, соотношение R:R, торговый журнал. Основа выживания на рынке.",
    category: "Риск-менеджмент",
    level: "Начинающий",
    readTime: "7 мин",
    href: "/trading-basics#riskmanagement",
    badge: "Статья",
    badgeColor: "bg-zinc-700 text-zinc-300",
  },
  {
    id: 6,
    title: "Что такое торговый бот и как он работает",
    description: "Принципы алгоритмической торговли, API-ключи, преимущества и ограничения ботов.",
    category: "Боты",
    level: "Начинающий",
    readTime: "8 мин",
    href: "/bots-guide#what-is-bot",
    badge: "Гайд",
    badgeColor: "bg-blue-500/20 text-blue-400",
  },
  {
    id: 7,
    title: "Grid, DCA, трендовые и скальпинг-боты",
    description: "Разбор 5 популярных стратегий для ботов с логикой, плюсами и минусами каждой.",
    category: "Боты",
    level: "Средний",
    readTime: "12 мин",
    href: "/bots-guide#strategies",
    badge: "Гайд",
    badgeColor: "bg-blue-500/20 text-blue-400",
  },
  {
    id: 8,
    title: "Бэктестинг: проверка стратегии на истории",
    description: "Как тестировать бота на исторических данных и избежать ловушки overfitting.",
    category: "Боты",
    level: "Средний",
    readTime: "10 мин",
    href: "/bots-guide#backtesting",
    badge: "Гайд",
    badgeColor: "bg-blue-500/20 text-blue-400",
  },
  {
    id: 9,
    title: "Платформы для ботов без кода",
    description: "3Commas, Pionex, Freqtrade — сравнение платформ для запуска ботов без программирования.",
    category: "Инструменты",
    level: "Начинающий",
    readTime: "8 мин",
    href: "/bots-guide#platforms",
    badge: "Гайд",
    badgeColor: "bg-blue-500/20 text-blue-400",
  },
  {
    id: 10,
    title: "Чеклист запуска бота",
    description: "Полный список проверок перед стартом: технические, риск-менеджмент, мониторинг.",
    category: "Боты",
    level: "Средний",
    readTime: "6 мин",
    href: "/bots-guide#launch",
    badge: "Гайд",
    badgeColor: "bg-blue-500/20 text-blue-400",
  },
  {
    id: 11,
    title: "Конструктор торговых ботов",
    description: "Настройте параметры и получите готовый Python-код: Grid, DCA, трендовый или скальпинг.",
    category: "Боты",
    level: "Любой",
    readTime: "Интерактив",
    href: "/bot-builder",
    badge: "Инструмент",
    badgeColor: "bg-red-500/20 text-red-400",
  },
  {
    id: 12,
    title: "BTC на Pocket Option: реальный разбор",
    description: "Применяем всё с сайта на практике: анализ рынка, конфлюэнс сигналов, риск-менеджмент и автоматизация на одном кейсе.",
    category: "Основы",
    level: "Любой",
    readTime: "15 мин",
    href: "/practice",
    badge: "Кейс",
    badgeColor: "bg-green-500/20 text-green-400",
  },
]

const levelColor: Record<string, string> = {
  "Начинающий": "text-green-400 border-green-500/30",
  "Средний": "text-yellow-400 border-yellow-500/30",
  "Любой": "text-zinc-400 border-zinc-600",
}

const STORAGE_KEY = "tradebase_read"

export default function Catalog() {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("Все")
  const [read, setRead] = useState<Set<number>>(new Set())

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as number[]
    setRead(new Set(saved))
  }, [])

  const toggleRead = (e: React.MouseEvent, id: number) => {
    e.preventDefault()
    e.stopPropagation()
    setRead((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      return next
    })
  }

  const filtered = materials.filter((m) => {
    const matchCategory = activeCategory === "Все" || m.category === activeCategory
    const matchSearch =
      search === "" ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  const readCount = materials.filter((m) => read.has(m.id)).length
  const totalReadable = materials.filter((m) => m.readTime !== "Интерактив").length
  const progressPct = Math.round((readCount / totalReadable) * 100)

  return (
    <div className="dark min-h-screen bg-black">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-10">
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 mb-4">Все материалы</Badge>
            <h1 className="font-orbitron text-4xl md:text-5xl font-bold text-white mb-6">
              Каталог базы знаний
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
              {materials.length} материалов по трейдингу и торговым ботам. Фильтруйте по теме или ищите нужное.
            </p>
          </div>

          {/* Progress block */}
          <div className="max-w-xl mx-auto mb-10 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-orbitron text-white text-sm">Ваш прогресс</span>
              <span className="font-space-mono text-red-400 text-sm font-bold">{readCount} / {totalReadable} прочитано</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2 mb-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-zinc-500 font-space-mono text-xs">
              {progressPct === 0
                ? "Начните с любого материала — отмечайте прочитанное галочкой на карточке"
                : progressPct === 100
                ? "🎉 Вы прочитали все материалы! Попробуйте конструктор ботов."
                : `Осталось ${totalReadable - readCount} материал${totalReadable - readCount === 1 ? "" : totalReadable - readCount < 5 ? "а" : "ов"}`}
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <Input
              placeholder="Поиск по материалам..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 font-space-mono max-w-xl mx-auto block"
            />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-space-mono transition-all border ${
                  activeCategory === cat
                    ? "bg-red-500 text-white border-red-500"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Results count */}
          <p className="text-zinc-500 font-space-mono text-sm mb-6">
            Найдено: {filtered.length} материал{filtered.length === 1 ? "" : filtered.length < 5 ? "а" : "ов"}
          </p>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((item) => {
                const isRead = read.has(item.id)
                const isInteractive = item.readTime === "Интерактив"
                return (
                  <a key={item.id} href={item.href} className="group block relative">
                    <Card className={`h-full transition-all duration-300 ${
                      isRead
                        ? "bg-zinc-900/60 border-green-500/30"
                        : "bg-zinc-900 border-zinc-800 group-hover:border-red-500/40 group-hover:bg-zinc-800/80"
                    }`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-xs font-space-mono px-2 py-1 rounded-full border ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-space-mono border rounded-full px-2 py-1 ${levelColor[item.level]}`}>
                              {item.level}
                            </span>
                            {!isInteractive && (
                              <button
                                onClick={(e) => toggleRead(e, item.id)}
                                title={isRead ? "Отметить как непрочитанное" : "Отметить как прочитанное"}
                                className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                                  isRead
                                    ? "bg-green-500 border-green-500 text-white"
                                    : "border-zinc-600 text-zinc-600 hover:border-green-500 hover:text-green-400"
                                }`}
                              >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                        <CardTitle className={`font-orbitron text-base leading-snug transition-colors ${
                          isRead ? "text-zinc-400" : "text-white group-hover:text-red-400"
                        }`}>
                          {item.title}
                          {isRead && <span className="ml-2 text-green-400 text-xs font-space-mono normal-case">✓ прочитано</span>}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-zinc-400 font-space-mono text-xs leading-relaxed mb-4">
                          {item.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-600 font-space-mono text-xs">{item.readTime}</span>
                          <span className="text-red-400 text-xs font-space-mono group-hover:translate-x-1 transition-transform inline-block">
                            {isInteractive ? "Открыть →" : "Читать →"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-zinc-400 font-space-mono">Ничего не найдено. Попробуйте другой запрос.</p>
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 text-center">
            <p className="text-zinc-500 font-space-mono text-sm mb-4">Хотите сразу создать бота?</p>
            <a
              href="/bot-builder"
              className="inline-block bg-red-500 hover:bg-red-600 text-white font-orbitron px-8 py-3 rounded-md transition-colors"
            >
              Открыть конструктор ботов →
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}