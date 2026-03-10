import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Icon from "@/components/ui/icon"

export const LEGENDS = [
  {
    id: "livermore",
    rank: "#1",
    rankColor: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
    name: "Джесси Ливермор",
    nameEn: "Jesse Livermore",
    years: "1877–1940",
    title: "Величайший спекулянт всех времён",
    summary: "Заработал $100 млн в 1929 году на коротких позициях во время Великой депрессии. Начинал с $5 в брокерской конторе в 14 лет. Создал большинство принципов технического анализа задолго до их появления в учебниках.",
    avatar: "📈",
    accentColor: "yellow",
    borderColor: "border-yellow-500/25",
    badgeBg: "bg-yellow-500/15 border-yellow-500/30 text-yellow-300",
    stats: [
      { label: "Пиковое состояние", value: "$100 млн", sub: "1929 г., ~$1,5 млрд сегодня" },
      { label: "Лет в трейдинге", value: "40+", sub: "с 14 до 63 лет" },
      { label: "Знаковая сделка", value: "Short 1929", sub: "заработал на крахе рынка" },
    ],
    philosophy: "«Рынки никогда не ошибаются. Мнения — часто. Не спорь с лентой.»",
    chapters: [
      {
        section: "Основы трейдинга",
        link: "/trading-basics",
        icon: "BookOpen",
        color: "text-red-400",
        title: "Тренд и уровни",
        usage: "Ливермор торговал ТОЛЬКО по тренду. Он никогда не открывал позицию против движения рынка. Его правило: «Дай тренду работать, режь убытки быстро» — это и есть EMA-анализ задолго до компьютеров.",
        quote: "«Деньги делаются на сидении, а не на торговле.»",
      },
      {
        section: "Психология",
        link: "/trading-basics#psychology",
        icon: "Brain",
        color: "text-purple-400",
        title: "Психология трейдинга",
        usage: "Ливермор несколько раз терял всё состояние — и каждый раз из-за нарушения собственных правил. Он описал все классические психологические ловушки в книге «Воспоминания биржевого спекулянта» (1923) — задолго до психологии трейдинга как науки.",
        quote: "«Величайшим врагом трейдера является он сам.»",
      },
      {
        section: "Практика",
        link: "/practice",
        icon: "Target",
        color: "text-green-400",
        title: "Анализ и сигналы",
        usage: "Его метод «точек разворота» — прямой предшественник современного анализа уровней поддержки/сопротивления. Именно Ливермор первым описал концепцию «входа после подтверждения» — принцип конфлюэнса из Шага 2.",
        quote: "«Никогда не усредняй убыточную позицию.»",
      },
    ],
    keyRules: [
      "Торгуй только в направлении главного тренда",
      "Никогда не усредняй убыточную позицию",
      "Режь убытки на уровне 10% от входа",
      "Дай прибыли расти — не выходи раньше времени",
      "Не торгуй на слухах и «подсказках»",
    ],
    botTake: "Ливермор торговал вручную, но его правила идеально ложатся в код: трендовый фильтр (EMA), жёсткий стоп-лосс, запрет мартингейла. Современный DCA-бот с трендовым фильтром — это Ливермор в автоматическом режиме.",
    aiTake: "ИИ-системы 2025 года реализуют его принцип «следования за лентой» через анализ order flow и on-chain данных в реальном времени — то, что Ливермор делал интуитивно, читая биржевую ленту.",
  },
  {
    id: "tudor",
    rank: "#2",
    rankColor: "text-zinc-300 border-zinc-400/40 bg-zinc-400/10",
    name: "Пол Тюдор Джонс",
    nameEn: "Paul Tudor Jones",
    years: "1954–наст. время",
    title: "Король макро-трейдинга",
    summary: "Предсказал и заработал на крахе 1987 года, утроив капитал за один день. Основатель Tudor Investment Corp с AUM $13 млрд. Никогда не имел убыточного года за 45 лет карьеры. Легенда риск-менеджмента.",
    avatar: "🏆",
    accentColor: "zinc",
    borderColor: "border-zinc-500/25",
    badgeBg: "bg-zinc-500/15 border-zinc-500/30 text-zinc-300",
    stats: [
      { label: "Под управлением", value: "$13 млрд", sub: "Tudor Investment Corp" },
      { label: "Убыточных лет", value: "0", sub: "за 45+ лет карьеры" },
      { label: "Знаковая сделка", value: "+200% 1987", sub: "в день краша рынка" },
    ],
    philosophy: "«Я ищу 5:1 — рискую $1, чтобы заработать $5. Это позволяет ошибаться 4 раза из 5 и всё равно оставаться в плюсе.»",
    chapters: [
      {
        section: "Риск-менеджмент",
        link: "/trading-basics#riskmanagement",
        icon: "Shield",
        color: "text-red-400",
        title: "Правило 2% и R:R",
        usage: "Джонс — живое воплощение раздела по риск-менеджменту. Его правило «не рискую более 1% на сделку» и требование соотношения R:R минимум 5:1 — основа всего, что описано в Главе 5 нашего курса.",
        quote: "«Самое важное — это управление деньгами, управление деньгами и ещё раз управление деньгами.»",
      },
      {
        section: "Гайд по ботам",
        link: "/bots-guide#backtesting",
        icon: "BarChart2",
        color: "text-blue-400",
        title: "Бэктестинг и стратегия",
        usage: "Tudor Investment использует сложнейшие квантовые модели и бэктестинг на десятилетиях данных. Принцип «не запускай без тестирования» — его кредо. В главе про бэктестинг — именно его подход к проверке гипотез.",
        quote: "«Если у тебя нет плана торговли, ты проиграешь.»",
      },
      {
        section: "Практика",
        link: "/practice#risk-management",
        icon: "Target",
        color: "text-green-400",
        title: "Риск-менеджмент на практике",
        usage: "Дневной лимит потерь из Шага 3 — прямая реализация принципа Джонса. Он рассказывал: «Каждый вечер я закрываю все позиции если день был убыточным выше лимита». Это то самое правило 6% из нашего кода RiskManager.",
        quote: "«Проигравший усредняет убытки. Победитель — наращивает прибыль.»",
      },
    ],
    keyRules: [
      "Соотношение риск/прибыль минимум 1:5",
      "Не рискуй более 1% депозита на сделку",
      "Дневной лимит потерь — обязателен",
      "Торгуй на подтверждённых пробоях, не на прогнозах",
      "Будь готов ошибаться — управляй размером потерь",
    ],
    botTake: "Алго-стратегии Tudor Investment — одни из самых сложных в мире. Но базовый принцип Джонса прост: жёсткий R:R и лимит дневных потерь. Это первое, что кодируется в любой торговый бот профессионального уровня.",
    aiTake: "Tudor Investment активно использует ML-модели для макро-анализа. Джонс публично говорил, что в 2025 году ИИ-системы стали обязательной частью любого хедж-фонда. При этом он подчёркивает: ИИ не заменяет риск-менеджмент, а лишь улучшает точность сигналов.",
  },
  {
    id: "williams",
    rank: "#3",
    rankColor: "text-orange-400 border-orange-500/40 bg-orange-500/10",
    name: "Ларри Вильямс",
    nameEn: "Larry Williams",
    years: "1942–наст. время",
    title: "Чемпион мира по трейдингу",
    summary: "Превратил $10,000 в $1,147,607 за один год на реальном счету — мировой рекорд, который держится с 1987 года. Создатель индикатора Williams %R и десятков торговых стратегий. Автор 11 книг по трейдингу.",
    avatar: "⚡",
    accentColor: "orange",
    borderColor: "border-orange-500/25",
    badgeBg: "bg-orange-500/15 border-orange-500/30 text-orange-300",
    stats: [
      { label: "Рекорд Robbins Cup", value: "+11,376%", sub: "$10K → $1.14M за год" },
      { label: "Книг написано", value: "11", sub: "переведены на 9 языков" },
      { label: "Индикаторов создано", value: "20+", sub: "Williams %R, Ultimate Oscillator" },
    ],
    philosophy: "«Большинство трейдеров проигрывают не потому что они глупы, а потому что они не следуют правилам. Дисциплина — единственное конкурентное преимущество розничного трейдера.»",
    chapters: [
      {
        section: "Индикаторы",
        link: "/trading-basics#indicators",
        icon: "TrendingUp",
        color: "text-violet-400",
        title: "Индикаторы и RSI",
        usage: "Вильямс создал Williams %R — осциллятор, аналогичный RSI. Его подход к индикаторам: используй минимум, понимай механику, не перегружай график. Именно это описывает Глава 4 — 2-3 индикатора максимум, и ты знаешь, что они считают.",
        quote: "«Индикаторы — это зеркала рынка. Чем больше зеркал, тем сложнее увидеть настоящую картину.»",
      },
      {
        section: "Гайд по ботам",
        link: "/bots-guide#strategies",
        icon: "Bot",
        color: "text-orange-400",
        title: "Стратегии для ботов",
        usage: "Вильямс один из первых начал использовать компьютеры для трейдинга в 1980-х. Его краткосрочные стратегии на основе %R — идеальная база для торгового бота. Он говорил: «Компьютер торгует лучше человека, потому что не устаёт и не боится».",
        quote: "«Система должна быть проще, чем вы думаете. Если вы не можете объяснить её за 30 секунд — она слишком сложная.»",
      },
      {
        section: "Практика",
        link: "/practice#signal-formation",
        icon: "Zap",
        color: "text-yellow-400",
        title: "Формирование сигнала",
        usage: "Метод Вильямса — классический конфлюэнс: тренд (дневной ТФ) + осциллятор (Williams %R) + ценовой паттерн. Три фактора подтверждают друг друга — это в точности Шаг 2 нашего практического кейса. Он применял это с 1970-х, до появления термина «конфлюэнс».",
        quote: "«Торгуй только когда три вещи говорят тебе одно и то же.»",
      },
    ],
    keyRules: [
      "Система должна быть простой и понятной",
      "Торгуй только при совпадении нескольких факторов",
      "Тестируй на реальных данных, а не на бумаге",
      "Следуй правилам — дисциплина важнее интеллекта",
      "Краткосрочный трейдинг требует чёткого стопа",
    ],
    botTake: "Вильямс буквально сказал: «Компьютер — лучший трейдер». Его стратегии %R + тренд + паттерн — первое что программируют начинающие алго-трейдеры. Williams %R встроен в TA-Lib и pandas-ta — две строки кода.",
    aiTake: "В 2024 году Вильямс публично протестировал ChatGPT для анализа своих стратегий. Вывод: ИИ хорошо систематизирует правила, но не заменяет понимание рыночной структуры. «ИИ — хороший ассистент, плохой трейдер» — его слова.",
  },
]

type Legend = typeof LEGENDS[0]

function StatCard({ stat }: { stat: Legend["stats"][0] }) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg px-4 py-3 text-center">
      <div className="font-orbitron text-lg font-bold text-white">{stat.value}</div>
      <div className="text-[11px] text-zinc-400 font-space-mono mt-0.5">{stat.label}</div>
      <div className="text-[10px] text-zinc-600 font-space-mono">{stat.sub}</div>
    </div>
  )
}

function ChapterCard({ ch, accentColor }: { ch: Legend["chapters"][0]; accentColor: string }) {
  const borderCls = accentColor === "yellow"
    ? "border-yellow-500/20 hover:border-yellow-500/40"
    : accentColor === "orange"
    ? "border-orange-500/20 hover:border-orange-500/40"
    : "border-zinc-600/20 hover:border-zinc-500/40"

  return (
    <a href={ch.link} className={`block bg-zinc-900/60 border rounded-xl p-4 transition-all group ${borderCls}`}>
      <div className="flex items-start gap-3 mb-2">
        <Icon name={ch.icon as "BookOpen"} size={14} className={`${ch.color} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-zinc-600 font-space-mono uppercase tracking-wider">{ch.section}</div>
          <div className="text-[12px] font-orbitron font-bold text-white group-hover:text-white/90">{ch.title}</div>
        </div>
        <Icon name="ArrowRight" size={12} className="text-zinc-600 group-hover:text-zinc-400 shrink-0 mt-1 transition-colors" />
      </div>
      <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">{ch.usage}</p>
      <p className="text-[11px] text-zinc-600 italic leading-snug border-l-2 border-zinc-700 pl-2">{ch.quote}</p>
    </a>
  )
}

function LegendCard({ legend, isExpanded, onToggle }: { legend: Legend; isExpanded: boolean; onToggle: () => void }) {
  return (
    <Card className={`border bg-zinc-900 ${legend.borderColor} transition-all`}>
      <CardHeader className="pb-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="text-5xl shrink-0">{legend.avatar}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className={`font-orbitron text-xs font-bold px-2.5 py-1 rounded-full border ${legend.rankColor}`}>
                {legend.rank}
              </span>
              <span className="text-zinc-600 text-xs font-space-mono">{legend.years}</span>
            </div>
            <h2 className="font-orbitron text-2xl font-bold text-white leading-tight">{legend.name}</h2>
            <p className="text-zinc-500 text-xs font-space-mono mt-0.5">{legend.nameEn}</p>
            <p className="text-zinc-400 text-sm mt-1">{legend.title}</p>
          </div>
        </div>

        <p className="text-zinc-300 text-sm leading-relaxed mt-4">{legend.summary}</p>

        {/* Философия */}
        <div className="mt-4 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3">
          <p className="text-zinc-300 text-[13px] italic leading-relaxed">{legend.philosophy}</p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {legend.stats.map((s, i) => <StatCard key={i} stat={s} />)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Кнопка раскрытия */}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between text-sm font-orbitron text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-lg px-4 py-3 transition-all"
        >
          <span>{isExpanded ? "Свернуть детали" : "Как применял в трейдинге"}</span>
          <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} />
        </button>

        {isExpanded && (
          <div className="space-y-4">
            {/* Главы курса */}
            <div>
              <p className="text-[11px] font-space-mono text-zinc-500 uppercase tracking-wider mb-3">Связь с нашими курсами</p>
              <div className="space-y-2">
                {legend.chapters.map((ch, i) => (
                  <ChapterCard key={i} ch={ch} accentColor={legend.accentColor} />
                ))}
              </div>
            </div>

            {/* Ключевые правила */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
              <p className="text-[11px] font-space-mono text-zinc-500 uppercase tracking-wider mb-3">5 правил, которые не нарушал никогда</p>
              <div className="space-y-1.5">
                {legend.keyRules.map((rule, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[10px] font-orbitron font-bold text-zinc-600 w-4 shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-[12px] text-zinc-300 font-space-mono leading-snug">{rule}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ИИ и боты */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                <p className="text-[10px] font-space-mono text-violet-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>◈</span> ИИ и его методы
                </p>
                <p className="text-[12px] text-zinc-300 leading-relaxed">{legend.aiTake}</p>
              </div>
              <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
                <p className="text-[10px] font-space-mono text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>◈</span> Боты и его стиль
                </p>
                <p className="text-[12px] text-zinc-300 leading-relaxed">{legend.botTake}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function Legends() {
  const [expanded, setExpanded] = useState<string | null>("livermore")

  return (
    <div className="dark min-h-screen bg-black">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="text-center mb-12">
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 mb-4 font-space-mono">
              Зал славы трейдинга
            </Badge>
            <h1 className="font-orbitron text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Три легенды,<br className="hidden sm:block" /> которые изменили рынки
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
              Они торговали без компьютеров, без ИИ и без ботов — и всё равно создали правила,
              которые лежат в основе всех современных алгоритмов. Изучи их методы, связанные с каждым разделом курса.
            </p>
          </div>

          {/* Рейтинг-шапка */}
          <div className="grid grid-cols-3 gap-3 mb-10">
            {LEGENDS.map((l) => (
              <button
                key={l.id}
                onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                className={`rounded-xl border p-3 text-center transition-all ${l.borderColor} bg-zinc-900/60 hover:bg-zinc-900`}
              >
                <div className="text-2xl mb-1">{l.avatar}</div>
                <div className={`font-orbitron text-xs font-bold px-1.5 py-0.5 rounded-full border inline-block mb-1 ${l.rankColor}`}>
                  {l.rank}
                </div>
                <div className="font-orbitron text-[11px] text-white leading-tight">{l.name.split(" ")[0]}</div>
                <div className="font-orbitron text-[10px] text-zinc-600 leading-tight">{l.name.split(" ").slice(1).join(" ")}</div>
              </button>
            ))}
          </div>

          {/* Карточки */}
          <div className="space-y-6">
            {LEGENDS.map((legend) => (
              <LegendCard
                key={legend.id}
                legend={legend}
                isExpanded={expanded === legend.id}
                onToggle={() => setExpanded(expanded === legend.id ? null : legend.id)}
              />
            ))}
          </div>

          {/* Итог */}
          <div className="mt-12 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
            <p className="text-zinc-500 text-xs font-space-mono uppercase tracking-wider mb-3">Главный вывод</p>
            <p className="text-white text-lg font-orbitron font-bold mb-3 leading-tight">
              Три разных эпохи — одни и те же правила
            </p>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-xl mx-auto mb-6">
              Ливермор, Джонс и Вильямс жили в разное время и торговали разными инструментами.
              Но их правила совпадают: следуй тренду, управляй риском, торгуй только при конфлюэнсе.
              Именно эти принципы лежат в основе каждого раздела нашего курса — и каждого хорошего торгового бота.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href="/trading-basics" className="inline-block bg-red-500 hover:bg-red-600 text-white font-orbitron text-sm px-6 py-2.5 rounded-md transition-colors">
                Курс: Основы трейдинга
              </a>
              <a href="/practice" className="inline-block bg-green-500 hover:bg-green-600 text-black font-orbitron text-sm px-6 py-2.5 rounded-md transition-colors">
                Практический кейс
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
