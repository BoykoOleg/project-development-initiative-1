import { useNavigate } from "react-router-dom"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"

const FEATURES = [
  {
    icon: "Bot",
    title: "5 стратегий",
    desc: "RSI, EMA, Мартингейл, Паттерны свечей, Уровни поддержки — выбирайте или комбинируйте",
    color: "text-red-400",
    border: "border-red-500/20",
  },
  {
    icon: "Code",
    title: "Готовый Python-код",
    desc: "Настройте параметры и скачайте файл. Никакого программирования — только запустить",
    color: "text-green-400",
    border: "border-green-500/20",
  },
  {
    icon: "Send",
    title: "Telegram уведомления",
    desc: "Каждая сделка, победа, проигрыш и достижение TP/SL — прямо в ваш Telegram",
    color: "text-blue-400",
    border: "border-blue-500/20",
  },
  {
    icon: "Zap",
    title: "Режим двух ботов",
    desc: "Запустите 2 бота с разными стратегиями одновременно и увеличьте количество сигналов",
    color: "text-purple-400",
    border: "border-purple-500/20",
  },
  {
    icon: "ShieldCheck",
    title: "TP / SL / Лимиты",
    desc: "Бот остановится сам при достижении Take Profit или Stop Loss — капитал под контролем",
    color: "text-yellow-400",
    border: "border-yellow-500/20",
  },
  {
    icon: "RefreshCw",
    title: "Авто-перезапуск",
    desc: "После достижения лимита бот делает паузу и продолжает торговать — без вашего участия",
    color: "text-cyan-400",
    border: "border-cyan-500/20",
  },
]

const STEPS = [
  { n: "01", title: "Настройте стратегию", desc: "Выберите актив, экспирацию, ставку и стратегию в конструкторе" },
  { n: "02", title: "Скачайте bot.py", desc: "Нажмите кнопку — готовый Python-файл сохранится на ваш компьютер" },
  { n: "03", title: "Введите Session ID", desc: "Скопируйте сообщение 42[\"auth\",...] из DevTools и вставьте в поле" },
  { n: "04", title: "Запустите PowerShell", desc: "Одна команда — и бот начинает торговать. Не закрывайте окно" },
]

const NOTIFICATIONS = [
  { emoji: "🤖", text: "Бот запущен\nEMA Cross | EURUSD_otc | Баланс: 243.50 USD", color: "border-zinc-700" },
  { emoji: "📈", text: "Сделка открыта\nCALL | 10 USD | EURUSD_otc | 1 мин", color: "border-blue-500/30" },
  { emoji: "✅", text: "Выигрыш\n+8.50 USD | Сессия: +8.50 | WR: 100%", color: "border-green-500/30" },
  { emoji: "❌", text: "Проигрыш\n-10.00 USD | Сессия: -1.50 | WR: 50%", color: "border-red-500/30" },
  { emoji: "✅", text: "Take Profit достигнут!\n+50.00 USD за сессию", color: "border-green-500/40 bg-green-500/5" },
]

export default function BotLanding() {
  const navigate = useNavigate()

  return (
    <div className="dark min-h-screen bg-black">
      <Navbar />
      <main>

        {/* Hero */}
        <section className="pt-32 pb-20 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-black to-black pointer-events-none" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-4xl mx-auto text-center relative">
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 mb-6">Бесплатный конструктор</Badge>
            <h1 className="font-orbitron text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Торговый бот для{" "}
              <span className="text-red-400">Pocket Option</span>
              <br />за 5 минут
            </h1>
            <p className="text-zinc-300 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Настройте параметры, скачайте готовый Python-файл и запустите автоторговлю. Без программирования. С уведомлениями в Telegram.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate("/bot-builder")}
                className="bg-red-600 hover:bg-red-700 text-white font-orbitron font-bold px-8 py-4 text-base h-auto"
              >
                <Icon name="Bot" size={18} className="mr-2" />
                Создать бота бесплатно
              </Button>
              <Button
                variant="outline"
                onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 font-orbitron px-8 py-4 text-base h-auto"
              >
                Как это работает?
              </Button>
            </div>
            <p className="text-zinc-600 font-space-mono text-xs mt-6">Python 3.11 · Pocket Option OTC · Работает на Windows / Mac / Linux</p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 border-y border-zinc-800/60">
          <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "5", label: "стратегий", color: "text-red-400" },
              { value: "OTC", label: "активы 24/7", color: "text-green-400" },
              { value: "1-15", label: "мин экспирация", color: "text-blue-400" },
              { value: "0₽", label: "стоимость", color: "text-yellow-400" },
            ].map((s) => (
              <div key={s.label}>
                <p className={`font-orbitron text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-zinc-500 font-space-mono text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 mb-4">Возможности</Badge>
              <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-white">Всё что нужно для автоторговли</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f) => (
                <div key={f.title} className={`bg-zinc-900 border ${f.border} rounded-xl p-5 space-y-2`}>
                  <Icon name={f.icon as never} size={22} className={f.color} />
                  <p className="text-white font-orbitron text-sm font-semibold">{f.title}</p>
                  <p className="text-zinc-400 font-space-mono text-xs leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="py-20 px-4 bg-zinc-950/50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 mb-4">Запуск</Badge>
              <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-white">4 шага до работающего бота</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STEPS.map((s) => (
                <div key={s.n} className="flex gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <div className="flex-shrink-0 font-orbitron text-2xl font-bold text-zinc-700">{s.n}</div>
                  <div>
                    <p className="text-white font-orbitron text-sm font-semibold mb-1">{s.title}</p>
                    <p className="text-zinc-400 font-space-mono text-xs leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Telegram preview */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 mb-4">Telegram</Badge>
                <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-white mb-4">
                  Следите за торгами прямо в телефоне
                </h2>
                <p className="text-zinc-400 font-space-mono text-sm leading-relaxed mb-6">
                  Бот отправляет уведомление при каждом событии — открытии сделки, результате, достижении Take Profit или Stop Loss. Вы всегда в курсе что происходит.
                </p>
                <ul className="space-y-2">
                  {[
                    "🚀 Старт бота — баланс, актив, параметры",
                    "📈📉 Каждая открытая сделка",
                    "✅❌ Результат с профитом и winrate",
                    "🛑✅ Stop Loss и Take Profit",
                    "⚠️ Дневной лимит исчерпан",
                  ].map((item) => (
                    <li key={item} className="text-zinc-300 font-space-mono text-xs flex items-start gap-2">
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mock Telegram chat */}
              <div className="bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden">
                <div className="bg-zinc-800 px-4 py-3 flex items-center gap-3 border-b border-zinc-700">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">🤖</div>
                  <div>
                    <p className="text-white font-orbitron text-xs font-semibold">MyTradeBot</p>
                    <p className="text-green-400 font-space-mono text-xs">онлайн</p>
                  </div>
                </div>
                <div className="p-4 space-y-2 max-h-72 overflow-hidden">
                  {NOTIFICATIONS.map((n, i) => (
                    <div key={i} className={`bg-zinc-800 border ${n.color} rounded-xl px-3 py-2 max-w-[85%] ml-auto`}>
                      <p className="text-white font-space-mono text-xs whitespace-pre-line leading-relaxed">
                        <span className="text-base">{n.emoji}</span> {n.text}
                      </p>
                      <p className="text-zinc-600 font-space-mono text-xs mt-1 text-right">только что</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-gradient-to-r from-red-950/60 to-zinc-900/60 border border-red-500/30 rounded-2xl p-10">
              <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-white mb-4">
                Запустите бота прямо сейчас
              </h2>
              <p className="text-zinc-400 font-space-mono text-sm mb-8">
                Бесплатно. Без регистрации. Работает на демо-счёте Pocket Option.
              </p>
              <Button
                onClick={() => navigate("/bot-builder")}
                className="bg-red-600 hover:bg-red-700 text-white font-orbitron font-bold px-10 py-4 text-base h-auto"
              >
                <Icon name="Bot" size={18} className="mr-2" />
                Открыть конструктор ботов
              </Button>
              <p className="text-zinc-600 font-space-mono text-xs mt-4">Сначала протестируйте на демо — там $10 000 виртуальных</p>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
