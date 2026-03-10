import React, { useState } from "react"

const platforms = [
  {
    name: "3Commas",
    type: "Облачный",
    site: "3commas.io",
    price: { free: "Базовый (ограничен)", paid: "$29–$99/мес", annual: "скидка 25%" },
    exchanges: ["Binance", "Bybit", "OKX", "Kraken", "KuCoin", "+20"],
    bots: ["DCA Bot", "Grid Bot", "Options Bot", "HODL Bot"],
    pros: [
      "Крупнейшая экосистема — 500+ сигналов и marketplace стратегий",
      "Telegram-уведомления из коробки",
      "Подробная статистика и бэктестинг",
      "TradingView webhooks интеграция",
    ],
    cons: [
      "Дорого на старте — free план сильно ограничен",
      "Облако = зависимость от сервера 3Commas (были даунтаймы)",
      "Интерфейс перегружен для новичков",
    ],
    level: "Начинающий–Средний",
    levelColor: "yellow",
    score: { ease: 7, power: 8, price: 5, reliability: 8, security: 8 },
    ideal: "Трейдер, который хочет скопировать чужие стратегии или использовать TradingView сигналы",
    warning: null,
    tag: "Самый популярный",
    tagColor: "blue",
  },
  {
    name: "Pionex",
    type: "Биржа + Боты",
    site: "pionex.com",
    price: { free: "Полностью бесплатно", paid: "Только торговая комиссия 0.05%", annual: "—" },
    exchanges: ["Встроенная биржа (ликвидность Binance+Huobi)"],
    bots: ["Grid Bot", "Leveraged Grid", "DCA Bot", "TWAP", "Rebalancing", "Spot-Futures Arb", "+10"],
    pros: [
      "Полностью бесплатно — нет подписки вообще",
      "16 встроенных типов ботов",
      "Ликвидность = агрегация Binance + Huobi",
      "Мобильное приложение уровня TOP",
      "Идеально для новичка без технических знаний",
    ],
    cons: [
      "Нельзя подключить внешнюю биржу",
      "Нельзя писать собственные стратегии на коде",
      "Встроенная биржа — не Binance, меньше пар",
      "Слабая аналитика и отчётность",
    ],
    level: "Новичок",
    levelColor: "green",
    score: { ease: 10, power: 5, price: 10, reliability: 8, security: 7 },
    ideal: "Абсолютный новичок, который хочет запустить Grid Bot без бюджета и технических знаний",
    warning: null,
    tag: "Лучший бесплатный",
    tagColor: "green",
  },
  {
    name: "Cryptohopper",
    type: "Облачный",
    site: "cryptohopper.com",
    price: { free: "7 дней пробный", paid: "$19–$99/мес", annual: "скидка ~20%" },
    exchanges: ["Binance", "Coinbase", "KuCoin", "Bybit", "Bitfinex", "+12"],
    bots: ["Trend Following", "DCA", "Grid", "Market-making", "Scalping"],
    pros: [
      "Marketplace сигналов и стратегий от других трейдеров",
      "Визуальный конструктор стратегий без кода",
      "Copy-trading — подписка на сигналы проверенных трейдеров",
      "Развитая документация и обучение",
    ],
    cons: [
      "Free плана нет (только 7 дней)",
      "Производительность ниже конкурентов при высокой нагрузке",
      "Marketplace стратегий — много мусора, нужно фильтровать",
    ],
    level: "Начинающий–Средний",
    levelColor: "yellow",
    score: { ease: 8, power: 7, price: 6, reliability: 7, security: 7 },
    ideal: "Трейдер, который хочет покупать готовые стратегии и сигналы без написания кода",
    warning: null,
    tag: "Copy-trading",
    tagColor: "purple",
  },
  {
    name: "Bybit Bot",
    type: "Биржа + Боты",
    site: "bybit.com",
    price: { free: "Полностью бесплатно", paid: "Только торговая комиссия", annual: "—" },
    exchanges: ["Только Bybit"],
    bots: ["Spot Grid", "Futures Grid", "DCA", "Martingale", "Arbitrage"],
    pros: [
      "Встроено в одну из крупнейших бирж мира",
      "Бесплатно, без комиссий сервиса",
      "Futures Grid с плечом — уникально среди бесплатных",
      "Мгновенное исполнение (нет API задержки)",
    ],
    cons: [
      "Работает только с Bybit — нет диверсификации",
      "Ограниченная аналитика и отчётность",
      "Нет кастомизации стратегий",
      "Martingale риск — новичок может не понять опасности",
    ],
    level: "Новичок–Средний",
    levelColor: "yellow",
    score: { ease: 9, power: 6, price: 10, reliability: 9, security: 8 },
    ideal: "Активный пользователь Bybit, который хочет автоматизировать торговлю без доп. расходов",
    warning: "Futures Grid с плечом — только для опытных. Можно потерять депозит.",
    tag: "Встроен в биржу",
    tagColor: "cyan",
  },
  {
    name: "Binance Bot",
    type: "Биржа + Боты",
    site: "binance.com",
    price: { free: "Полностью бесплатно", paid: "Только торговая комиссия 0.1%", annual: "—" },
    exchanges: ["Только Binance"],
    bots: ["Spot Grid", "Futures Grid", "DCA", "TWAP", "Rebalancing"],
    pros: [
      "Крупнейшая биржа в мире — максимальная ликвидность",
      "Бесплатно",
      "TWAP-бот для крупных ордеров (минимальный проскальзывание)",
      "Мгновенное исполнение без API задержки",
    ],
    cons: [
      "Только Binance",
      "Базовый функционал без глубокой аналитики",
      "Нет внешних сигналов / TradingView интеграции",
      "Регуляторные проблемы в ряде стран",
    ],
    level: "Новичок",
    levelColor: "green",
    score: { ease: 9, power: 5, price: 10, reliability: 9, security: 8 },
    ideal: "Пользователь Binance, который только начинает автоматизировать торговлю",
    warning: null,
    tag: "Максимальная ликвидность",
    tagColor: "yellow",
  },
  {
    name: "Freqtrade",
    type: "Open-source (локально)",
    site: "freqtrade.io",
    price: { free: "Полностью бесплатно", paid: "Только VPS ~$5–15/мес", annual: "—" },
    exchanges: ["Binance", "Bybit", "OKX", "Kraken", "Gate.io", "+30"],
    bots: ["Любые — пишешь сам на Python", "Telegram управление", "Встроенный бэктестинг"],
    pros: [
      "Полный контроль — стратегия в Python, никаких ограничений",
      "Лучший встроенный бэктестинг с реальными историческими данными",
      "Hyperopt — автоматическая оптимизация параметров",
      "Открытый код — никакой зависимости от стороннего сервиса",
      "Telegram-бот управления из коробки",
    ],
    cons: [
      "Нужно знать Python хотя бы базово",
      "Настройка занимает часы (Docker, конфиги)",
      "Нет красивого UI — всё через терминал или Telegram",
      "Технические проблемы решаете сами",
    ],
    level: "Продвинутый",
    levelColor: "orange",
    score: { ease: 3, power: 10, price: 9, reliability: 9, security: 10 },
    ideal: "Трейдер с базовыми знаниями Python, который хочет максимальный контроль без платной подписки",
    warning: null,
    tag: "Выбор разработчиков",
    tagColor: "orange",
  },
  {
    name: "Hummingbot",
    type: "Open-source (локально)",
    site: "hummingbot.org",
    price: { free: "Полностью бесплатно", paid: "VPS ~$5–20/мес", annual: "—" },
    exchanges: ["Binance", "Bybit", "OKX", "dYdX", "Uniswap (DeFi)", "+40"],
    bots: ["Market-making", "Arbitrage (CEX-CEX, CEX-DEX)", "TWAP", "VWAP"],
    pros: [
      "Единственный бесплатный инструмент для market-making",
      "DeFi + CEX интеграция — уникально",
      "CEX-DEX арбитраж — стратегии недоступные на облачных платформах",
      "Огромное сообщество и гранты от Hummingbot Foundation",
    ],
    cons: [
      "Сложнейшая настройка — не для новичков",
      "Market-making требует понимания стакана ордеров",
      "Без капитала $10k+ market-making неэффективен",
      "Python/Cython — нужен технический бэкграунд",
    ],
    level: "Эксперт",
    levelColor: "red",
    score: { ease: 2, power: 10, price: 9, reliability: 8, security: 10 },
    ideal: "Опытный трейдер или разработчик, который хочет делать market-making или CEX-DEX арбитраж",
    warning: "Market-making без опыта приводит к быстрым убыткам. Сначала изучите стратегию.",
    tag: "Market-making",
    tagColor: "red",
  },
  {
    name: "Wunderbit",
    type: "Облачный",
    site: "wunderbit.co",
    price: { free: "Ограниченный free план", paid: "$9–$49/мес", annual: "скидка 20%" },
    exchanges: ["Binance", "Bybit", "OKX", "KuCoin", "Bitget", "+8"],
    bots: ["DCA Bot", "Grid Bot", "Signal Bot (TradingView)"],
    pros: [
      "Самый дешёвый облачный вариант с нормальным функционалом",
      "Чистый интерфейс — легче 3Commas",
      "TradingView вебхуки без лишних настроек",
      "Полный бэктестинг включён в базовый план",
    ],
    cons: [
      "Меньше бирж чем у конкурентов",
      "Нет marketplace стратегий",
      "Маленькое сообщество = меньше готовых решений",
    ],
    level: "Начинающий–Средний",
    levelColor: "yellow",
    score: { ease: 8, power: 6, price: 8, reliability: 7, security: 7 },
    ideal: "Трейдер с TradingView, который хочет дешевле чем 3Commas, но с похожим функционалом",
    warning: null,
    tag: "Бюджетный облак",
    tagColor: "teal",
  },
  {
    name: "TradeSanta",
    type: "Облачный",
    site: "tradesanta.com",
    price: { free: "Бесплатно (2 бота)", paid: "$18–$70/мес", annual: "скидка ~30%" },
    exchanges: ["Binance", "Bybit", "OKX", "Huobi", "HitBTC", "+6"],
    bots: ["Long DCA", "Short DCA", "Grid"],
    pros: [
      "Простейший интерфейс — запуск бота за 5 минут",
      "Реально бесплатный free план (2 бота)",
      "Хорошие шаблоны стратегий для старта",
      "Telegram-поддержка 24/7",
    ],
    cons: [
      "Ограниченный набор стратегий (только DCA + Grid)",
      "Нет бэктестинга на платных планах ниже TOP",
      "Слабая аналитика",
      "Малое количество бирж",
    ],
    level: "Новичок",
    levelColor: "green",
    score: { ease: 9, power: 4, price: 7, reliability: 7, security: 7 },
    ideal: "Абсолютный новичок, которому нужен самый простой старт с базовым DCA ботом",
    warning: null,
    tag: "Проще всего",
    tagColor: "green",
  },
  {
    name: "Bitsgap",
    type: "Облачный",
    site: "bitsgap.com",
    price: { free: "7 дней пробный", paid: "$23–$119/мес", annual: "скидка 25%" },
    exchanges: ["Binance", "Bybit", "OKX", "Kraken", "Bitfinex", "+25"],
    bots: ["Grid Bot", "DCA Bot", "Combo Bot (DCA+Grid)", "Futures Bot", "SMART orders"],
    pros: [
      "Combo Bot = DCA + Grid одновременно — уникальная функция",
      "Встроенный порфолио-трекер и арбитражный сканер",
      "SMART orders — продвинутые условные ордера",
      "Лучший интерфейс среди платных платформ",
    ],
    cons: [
      "Дорого — от $23/мес за базовый",
      "Нет free плана (только тест)",
      "Combo Bot — сложно разобраться без опыта",
    ],
    level: "Средний–Продвинутый",
    levelColor: "orange",
    score: { ease: 7, power: 9, price: 5, reliability: 8, security: 8 },
    ideal: "Опытный трейдер, который хочет комбинировать стратегии и использовать продвинутые ордера",
    warning: null,
    tag: "Combo-стратегии",
    tagColor: "violet",
  },
]

const ScoreBar = ({ value, max = 10 }: { value: number; max?: number }) => {
  const pct = (value / max) * 100
  const color = value >= 8 ? "bg-green-500" : value >= 6 ? "bg-yellow-500" : value >= 4 ? "bg-orange-500" : "bg-red-500"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-zinc-400 text-xs font-space-mono w-4">{value}</span>
    </div>
  )
}

const tagColors: Record<string, string> = {
  blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  green: "bg-green-500/20 text-green-400 border-green-500/30",
  purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  red: "bg-red-500/20 text-red-400 border-red-500/30",
  teal: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  violet: "bg-violet-500/20 text-violet-400 border-violet-500/30",
}

const levelColors: Record<string, string> = {
  green: "text-green-400",
  yellow: "text-yellow-400",
  orange: "text-orange-400",
  red: "text-red-400",
}

export function DeepPlatformsComparison() {
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "free" | "beginner" | "advanced">("all")

  const filtered = platforms.filter(p => {
    if (filter === "free") return p.price.free.includes("бесплатно") || p.price.free.includes("Полностью")
    if (filter === "beginner") return p.levelColor === "green" || p.levelColor === "yellow"
    if (filter === "advanced") return p.levelColor === "orange" || p.levelColor === "red"
    return true
  })

  const selectedPlatform = platforms.find(p => p.name === selected)

  return (
    <div className="space-y-4">
      {/* Фильтры */}
      <div className="flex flex-wrap gap-2">
        {([["all", "Все 10"], ["free", "Бесплатные"], ["beginner", "Для новичков"], ["advanced", "Для опытных"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1 rounded-lg text-xs font-space-mono border transition-all ${filter === key ? "bg-sky-500/20 border-sky-500/50 text-sky-300" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Карточки */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(p => (
          <button
            key={p.name}
            onClick={() => setSelected(selected === p.name ? null : p.name)}
            className={`text-left bg-zinc-900 border rounded-xl p-4 transition-all hover:border-zinc-600 ${selected === p.name ? "border-sky-500/50 bg-sky-500/5" : "border-zinc-800"}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-orbitron font-bold text-sm">{p.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-space-mono ${tagColors[p.tagColor]}`}>{p.tag}</span>
                </div>
                <div className="text-zinc-500 text-xs font-space-mono">{p.type} · {p.site}</div>
              </div>
              <div className={`text-right text-xs font-space-mono ${levelColors[p.levelColor]}`}>
                {p.level}
              </div>
            </div>

            {/* Оценки */}
            <div className="space-y-1.5 mb-3">
              {([["ease", "Простота"], ["power", "Мощность"], ["price", "Цена"], ["reliability", "Надёжность"]] as const).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-zinc-600 text-xs font-space-mono w-20 shrink-0">{label}</span>
                  <ScoreBar value={p.score[key]} />
                </div>
              ))}
            </div>

            {/* Цена */}
            <div className="bg-zinc-950 rounded-lg px-3 py-2 text-xs font-space-mono">
              <span className="text-zinc-500">Цена: </span>
              <span className="text-green-400">{p.price.free}</span>
              {p.price.paid !== "—" && p.price.paid !== "Только торговая комиссия" && p.price.paid !== "Только торговая комиссия 0.05%" && p.price.paid !== "Только торговая комиссия 0.1%" && (
                <span className="text-zinc-400"> / {p.price.paid}</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Детальная карточка */}
      {selectedPlatform && (
        <div className="bg-zinc-900 border border-sky-500/30 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-white font-orbitron font-bold text-base">{selectedPlatform.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-space-mono ${tagColors[selectedPlatform.tagColor]}`}>{selectedPlatform.tag}</span>
              </div>
              <div className="text-zinc-500 text-xs font-space-mono">{selectedPlatform.type} · {selectedPlatform.site}</div>
            </div>
            <button onClick={() => setSelected(null)} className="text-zinc-600 hover:text-zinc-400 font-space-mono text-xs">✕ закрыть</button>
          </div>

          {/* Биржи */}
          <div>
            <div className="text-sky-400 font-orbitron text-xs font-bold mb-2">Поддерживаемые биржи</div>
            <div className="flex flex-wrap gap-1">
              {selectedPlatform.exchanges.map(ex => (
                <span key={ex} className="bg-zinc-800 text-zinc-300 text-xs px-2 py-0.5 rounded font-space-mono">{ex}</span>
              ))}
            </div>
          </div>

          {/* Типы ботов */}
          <div>
            <div className="text-sky-400 font-orbitron text-xs font-bold mb-2">Доступные стратегии/боты</div>
            <div className="flex flex-wrap gap-1">
              {selectedPlatform.bots.map(b => (
                <span key={b} className="bg-blue-500/10 text-blue-300 text-xs px-2 py-0.5 rounded font-space-mono border border-blue-500/20">{b}</span>
              ))}
            </div>
          </div>

          {/* Плюсы и минусы */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="text-green-400 font-orbitron text-xs font-bold mb-2">Плюсы</div>
              <ul className="space-y-1">
                {selectedPlatform.pros.map(pro => (
                  <li key={pro} className="flex gap-2 text-xs font-space-mono text-zinc-300">
                    <span className="text-green-400 shrink-0">+</span>{pro}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-red-400 font-orbitron text-xs font-bold mb-2">Минусы</div>
              <ul className="space-y-1">
                {selectedPlatform.cons.map(con => (
                  <li key={con} className="flex gap-2 text-xs font-space-mono text-zinc-300">
                    <span className="text-red-400 shrink-0">−</span>{con}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Для кого */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
            <div className="text-yellow-400 font-orbitron text-xs font-bold mb-1">Кому идеально подходит</div>
            <p className="text-zinc-300 text-xs font-space-mono">{selectedPlatform.ideal}</p>
          </div>

          {/* Предупреждение */}
          {selectedPlatform.warning && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <div className="text-red-400 font-orbitron text-xs font-bold mb-1">⚠ Внимание</div>
              <p className="text-red-300 text-xs font-space-mono">{selectedPlatform.warning}</p>
            </div>
          )}

          {/* Все оценки */}
          <div className="bg-zinc-950 rounded-lg p-3">
            <div className="text-zinc-500 font-orbitron text-xs font-bold mb-3">Детальный рейтинг</div>
            <div className="space-y-2">
              {([["ease", "Простота использования"], ["power", "Мощность / функционал"], ["price", "Соотношение цена/качество"], ["reliability", "Надёжность сервиса"], ["security", "Безопасность"]] as const).map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-zinc-500 text-xs font-space-mono w-44 shrink-0">{label}</span>
                  <ScoreBar value={selectedPlatform.score[key]} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Матрица выбора */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
        <div className="text-sky-400 font-orbitron text-xs font-bold mb-3">Матрица выбора: кому что подходит</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-space-mono">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-3 py-2 text-zinc-500">Ситуация</th>
                <th className="text-left px-3 py-2 text-zinc-400">Рекомендация</th>
              </tr>
            </thead>
            <tbody>
              {[
                { situation: "Новичок, $0 бюджет", rec: "Pionex или Bybit Bot", color: "green" },
                { situation: "Новичок, есть $20/мес", rec: "TradeSanta или Wunderbit", color: "green" },
                { situation: "Есть TradingView Premium", rec: "3Commas или Wunderbit (вебхуки)", color: "yellow" },
                { situation: "Хочу копировать сигналы", rec: "Cryptohopper (marketplace)", color: "yellow" },
                { situation: "Хочу Grid + DCA комбо", rec: "Bitsgap (Combo Bot)", color: "orange" },
                { situation: "Знаю Python, хочу контроль", rec: "Freqtrade (open-source)", color: "orange" },
                { situation: "DeFi + CEX арбитраж", rec: "Hummingbot (единственный)", color: "red" },
                { situation: "Market-making, $50k+", rec: "Hummingbot или Freqtrade", color: "red" },
              ].map(({ situation, rec, color }) => (
                <tr key={situation} className="border-b border-zinc-900">
                  <td className="px-3 py-2 text-zinc-400">{situation}</td>
                  <td className={`px-3 py-2 text-${color}-400 font-bold`}>{rec}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function PlatformRadarChart() {
  const top5 = [
    { name: "3Commas", scores: [7, 8, 5, 8, 8], color: "#3b82f6" },
    { name: "Pionex", scores: [10, 5, 10, 8, 7], color: "#22c55e" },
    { name: "Freqtrade", scores: [3, 10, 9, 9, 10], color: "#f97316" },
    { name: "Bitsgap", scores: [7, 9, 5, 8, 8], color: "#a855f7" },
    { name: "Bybit Bot", scores: [9, 6, 10, 9, 8], color: "#06b6d4" },
  ]
  const labels = ["Простота", "Мощность", "Цена", "Надёжн.", "Безопасн."]

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="text-zinc-400 font-space-mono text-xs mb-3">Сравнение ТОП-5 платформ по 5 критериям (из 10)</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-space-mono">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-3 py-2 text-zinc-500">Платформа</th>
              {labels.map(l => <th key={l} className="text-left px-2 py-2 text-zinc-500">{l}</th>)}
              <th className="text-left px-3 py-2 text-zinc-500">Итого</th>
            </tr>
          </thead>
          <tbody>
            {top5.map(p => {
              const total = p.scores.reduce((a, b) => a + b, 0)
              return (
                <tr key={p.name} className="border-b border-zinc-900">
                  <td className="px-3 py-2 font-bold" style={{ color: p.color }}>{p.name}</td>
                  {p.scores.map((s, i) => (
                    <td key={i} className="px-2 py-2">
                      <div className="flex items-center gap-1">
                        <div className="w-8 h-1.5 bg-zinc-800 rounded-full">
                          <div className="h-1.5 rounded-full" style={{ width: `${s * 10}%`, backgroundColor: p.color }} />
                        </div>
                        <span className="text-zinc-400">{s}</span>
                      </div>
                    </td>
                  ))}
                  <td className="px-3 py-2 text-white font-bold">{total}/50</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
