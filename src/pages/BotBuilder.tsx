import { useState, useEffect, useRef } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BotConfig, DEFAULT_CONFIG, generateCode } from "@/components/bot-builder/BotBuilderTypes"
import BotBuilderForm from "@/components/bot-builder/BotBuilderForm"
import { POBotConfig, PO_DEFAULT_CONFIG, generatePOCode, generatePOComboCode } from "@/components/bot-builder/PocketOptionBotTypes"
import PocketOptionBotForm from "@/components/bot-builder/PocketOptionBotForm"
import TradeJournal from "@/components/bot-builder/TradeJournal"
import Icon from "@/components/ui/icon"

type Tab = "pocket_option" | "crypto"

export default function BotBuilder() {
  const [tab, setTab] = useState<Tab>("pocket_option")
  const [sessionGuideOpen, setSessionGuideOpen] = useState(false)
  const [strategyGuideOpen, setStrategyGuideOpen] = useState(false)
  const [tgGuideOpen, setTgGuideOpen] = useState(false)
  const [tgTestStatus, setTgTestStatus] = useState<"idle" | "sending" | "ok" | "error">("idle")

  const sendTgTest = async () => {
    if (!poConfig.tgToken || !poConfig.tgChatId) return
    setTgTestStatus("sending")
    try {
      const text = encodeURIComponent("🤖 Тест TradeBase Bot\n\nПодключение работает! Уведомления о торгах будут приходить сюда.\n\n✅ ВЫИГРЫШ +2.5 USD\n❌ ПРОИГРЫШ -1.0 USD\n🛑 Stop Loss достигнут\n✅ Take Profit достигнут")
      const res = await fetch(`https://api.telegram.org/bot${poConfig.tgToken}/sendMessage?chat_id=${poConfig.tgChatId}&text=${text}&parse_mode=HTML`)
      const data = await res.json()
      setTgTestStatus(data.ok ? "ok" : "error")
    } catch {
      setTgTestStatus("error")
    }
    setTimeout(() => setTgTestStatus("idle"), 4000)
  }

  // Telegram settings — сохраняются в localStorage
  const savedTg = (() => {
    try { return JSON.parse(localStorage.getItem("tg_settings") || "{}") } catch { return {} }
  })()
  const saveTgSettings = (token: string, chatId: string) => {
    localStorage.setItem("tg_settings", JSON.stringify({ tgToken: token, tgChatId: chatId }))
  }
  const clearTgSettings = () => {
    localStorage.removeItem("tg_settings")
    setPoConfig((p) => ({ ...p, tgToken: "", tgChatId: "" }))
  }

  // Pocket Option state — Bot 1
  const [poConfig, setPoConfig] = useState<POBotConfig>({
    ...PO_DEFAULT_CONFIG,
    tgToken: savedTg.tgToken || "",
    tgChatId: savedTg.tgChatId || "",
  })
  const [poCode, setPoCode] = useState("")
  const [poGenerated, setPoGenerated] = useState(false)
  const [poCopied, setPoCopied] = useState(false)
  const poCodeRef = useRef<HTMLDivElement>(null)
  const cryptoCodeRef = useRef<HTMLDivElement>(null)

  // Session ID input
  const [sessionId, setSessionId] = useState("")
  const [sessionIdVisible, setSessionIdVisible] = useState(false)
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null)

  const copyCmd = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCmd(key)
    setTimeout(() => setCopiedCmd(null), 2000)
  }

  // Pocket Option state — Bot 2
  const [dualMode, setDualMode] = useState(false)
  const [poConfig2, setPoConfig2] = useState<POBotConfig>({ ...PO_DEFAULT_CONFIG, strategy: "ema_cross", betAmount: 1, tgToken: savedTg.tgToken || "", tgChatId: savedTg.tgChatId || "" })

  // Автосохранение TG настроек при изменении + синхронизация с Bot2
  useEffect(() => {
    saveTgSettings(poConfig.tgToken, poConfig.tgChatId)
    setPoConfig2(p => ({ ...p, tgToken: poConfig.tgToken, tgChatId: poConfig.tgChatId }))
  }, [poConfig.tgToken, poConfig.tgChatId])
  const [poCode2, setPoCode2] = useState("")
  const [dualDownloaded, setDualDownloaded] = useState(false)

  // Crypto (original) state
  const [config, setConfig] = useState<BotConfig>(DEFAULT_CONFIG)
  const [code, setCode] = useState("")
  const [generated, setGenerated] = useState(false)
  const [copied, setCopied] = useState(false)

  const handlePOGenerate = () => {
    const code = poConfig.comboMode ? generatePOComboCode(poConfig) : generatePOCode(poConfig)
    setPoCode(code)
    if (dualMode) {
      const code2 = poConfig2.comboMode ? generatePOComboCode(poConfig2) : generatePOCode(poConfig2)
      setPoCode2(code2)
    }
    setPoGenerated(true)
    setTimeout(() => {
      poCodeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
  }

  const handleDualDownload = () => {
    const download = (content: string, filename: string) => {
      const blob = new Blob([content], { type: "text/x-python" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    }
    download(poCode, `bot1_${poConfig.strategy}.py`)
    setTimeout(() => download(poCode2, `bot2_${poConfig2.strategy}.py`), 300)
    setDualDownloaded(true)
  }

  const handlePOCopy = () => {
    navigator.clipboard.writeText(poCode)
    setPoCopied(true)
    setTimeout(() => setPoCopied(false), 2000)
  }

  const handleGenerate = () => {
    setCode(generateCode(config))
    setGenerated(true)
    setTimeout(() => {
      cryptoCodeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Download .py file
  const handlePODownload = () => {
    const filename = `pocket_option_bot_${poConfig.strategy}.py`
    const blob = new Blob([poCode], { type: "text/x-python" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleEnvDownload = () => {
    const sessionVal = sessionId || "ВСТАВЬТЕ_SESSION_ID_СЮДА"
    const content = `# Файл .env для Pocket Option Bot\n# Положите этот файл рядом с bot.py\nPO_SESSION_ID=${sessionVal}\n`
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = ".env"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCryptoDownload = () => {
    const filename = `crypto_bot_${config.type}.py`
    const blob = new Blob([code], { type: "text/x-python" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // Share config via URL
  const [shareCopied, setShareCopied] = useState(false)

  const handleShare = () => {
    const params = new URLSearchParams()
    Object.entries(poConfig).forEach(([k, v]) => params.set(k, String(v)))
    const url = `${window.location.origin}/bot-builder?${params.toString()}`
    navigator.clipboard.writeText(url)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2500)
  }

  // Load config from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.has("strategy")) return
    setPoConfig((prev) => ({
      ...prev,
      strategy: (params.get("strategy") as POBotConfig["strategy"]) ?? prev.strategy,
      asset: params.get("asset") ?? prev.asset,
      expiry: (params.get("expiry") as POBotConfig["expiry"]) ?? prev.expiry,
      betAmount: Number(params.get("betAmount") ?? prev.betAmount),
      betPercent: params.get("betPercent") === "true",
      martingaleEnabled: params.get("martingaleEnabled") === "true",
      martingaleMultiplier: Number(params.get("martingaleMultiplier") ?? prev.martingaleMultiplier),
      martingaleSteps: Number(params.get("martingaleSteps") ?? prev.martingaleSteps),
      takeProfitUsd: Number(params.get("takeProfitUsd") ?? prev.takeProfitUsd),
      stopLossUsd: Number(params.get("stopLossUsd") ?? prev.stopLossUsd),
      dailyLimit: Number(params.get("dailyLimit") ?? prev.dailyLimit),
      rsiPeriod: Number(params.get("rsiPeriod") ?? prev.rsiPeriod),
      rsiOverbought: Number(params.get("rsiOverbought") ?? prev.rsiOverbought),
      rsiOversold: Number(params.get("rsiOversold") ?? prev.rsiOversold),
      emaFast: Number(params.get("emaFast") ?? prev.emaFast),
      emaSlow: Number(params.get("emaSlow") ?? prev.emaSlow),
      useOTC: params.get("useOTC") === "true",
      autoRestart: params.get("autoRestart") === "true",
    }))
    setTab("pocket_option")
  }, [])

  return (
    <div className="dark min-h-screen bg-black">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-10">
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 mb-4">Конструктор ботов</Badge>
            <h1 className="font-orbitron text-4xl md:text-5xl font-bold text-white mb-4">
              Конструктор торговых ботов
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
              Настройте параметры и получите готовый Python-код. Без программирования.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-zinc-900 border border-zinc-800 rounded-xl p-1 max-w-md mx-auto">
            <button
              onClick={() => setTab("pocket_option")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-orbitron text-sm font-bold transition-all duration-200 ${
                tab === "pocket_option"
                  ? "bg-red-600 text-white shadow-lg shadow-red-500/20"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Pocket Option
            </button>
            <button
              onClick={() => setTab("crypto")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-orbitron text-sm font-bold transition-all duration-200 ${
                tab === "crypto"
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Крипто / Спот
            </button>
          </div>

          {/* Pocket Option Tab */}
          {tab === "pocket_option" && (
            <>
              {/* Info banner */}
              <div className="mb-6 bg-gradient-to-r from-red-950/60 to-zinc-900/60 border border-red-500/30 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between">
                <div>
                  <p className="text-red-400 font-orbitron font-bold text-sm mb-1">Бинарные опционы — Pocket Option</p>
                  <p className="text-zinc-400 font-space-mono text-xs">Стратегии для OTC-рынка: RSI, EMA, паттерны свечей, мартингейл</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-4 text-xs font-space-mono">
                    <div className="text-center">
                      <p className="text-green-400 font-bold text-lg">5</p>
                      <p className="text-zinc-500">стратегий</p>
                    </div>
                    <div className="text-center">
                      <p className="text-blue-400 font-bold text-lg">OTC</p>
                      <p className="text-zinc-500">активы</p>
                    </div>
                    <div className="text-center">
                      <p className="text-yellow-400 font-bold text-lg">1-15</p>
                      <p className="text-zinc-500">мин экспир.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleShare}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-orbitron text-xs font-bold transition-all duration-200
                        ${shareCopied
                          ? "bg-green-500/20 border-green-500/40 text-green-400"
                          : "bg-zinc-800 border-zinc-600 text-zinc-300 hover:border-zinc-400 hover:text-white"
                        }`}
                    >
                      <Icon name={shareCopied ? "Check" : "Share2"} size={13} />
                      {shareCopied ? "Скопировано!" : "Поделиться"}
                    </button>
                    <a
                      href="/bot-landing"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border font-orbitron text-xs font-bold transition-all duration-200 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                    >
                      <Icon name="ExternalLink" size={13} />
                      Лендинг
                    </a>
                  </div>
                </div>
              </div>

              {/* Session ID + Telegram Input */}
              <div className="mb-6 bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-4">

                {/* Session ID */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">🔑</span>
                    <p className="text-white font-orbitron text-sm font-semibold">Session ID</p>
                    <span className="text-zinc-500 font-space-mono text-xs">— команды запуска сгенерируются автоматически</span>
                  </div>
                  <div className="relative">
                    <input
                      type={sessionIdVisible ? "text" : "password"}
                      value={sessionId}
                      onChange={(e) => setSessionId(e.target.value)}
                      placeholder='42["auth",{"session":"...","isDemo":1,"uid":...,"platform":2}]'
                      className="w-full bg-black border border-zinc-700 focus:border-green-500/60 rounded-lg px-4 py-3 text-green-400 font-space-mono text-xs outline-none transition-colors placeholder:text-zinc-600 pr-20"
                    />
                    <button
                      onClick={() => setSessionIdVisible((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 font-space-mono text-xs transition-colors"
                    >
                      {sessionIdVisible ? "скрыть" : "показать"}
                    </button>
                  </div>
                  {sessionId
                    ? <div className="flex items-center gap-2 text-green-400 font-space-mono text-xs"><Icon name="CheckCircle" size={13} />Session ID сохранён</div>
                    : <p className="text-zinc-600 font-space-mono text-xs">DevTools (F12) → Network → WS → Messages → сообщение <span className="text-zinc-400">42["auth",...]</span></p>
                  }
                </div>

                {/* Divider */}
                <div className="border-t border-zinc-800" />

                {/* Telegram */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">✈️</span>
                    <p className="text-white font-orbitron text-sm font-semibold">Telegram уведомления</p>
                    <span className="text-zinc-500 font-space-mono text-xs">— необязательно</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <p className="text-zinc-500 font-space-mono text-xs mb-1 flex items-center gap-1">
                        Bot Token (от @BotFather)
                        {poConfig.tgToken && <span className="text-green-400 flex items-center gap-1"><Icon name="Check" size={11} />сохранён</span>}
                        {(poConfig.tgToken || poConfig.tgChatId) && (
                          <button onClick={clearTgSettings} className="ml-auto flex items-center gap-0.5 text-zinc-600 hover:text-red-400 transition-colors text-xs">
                            <Icon name="X" size={10} />очистить
                          </button>
                        )}
                      </p>
                      <input
                        type="text"
                        value={poConfig.tgToken}
                        onChange={(e) => setPoConfig((p) => ({ ...p, tgToken: e.target.value }))}
                        placeholder="1234567890:AAF..."
                        className="w-full bg-black border border-zinc-700 focus:border-blue-500/60 rounded-lg px-3 py-2 text-blue-300 font-space-mono text-xs outline-none transition-colors placeholder:text-zinc-600"
                      />
                    </div>
                    <div>
                      <p className="text-zinc-500 font-space-mono text-xs mb-1 flex items-center gap-1">
                        Chat ID (ваш Telegram ID)
                        {poConfig.tgChatId && <span className="text-green-400 flex items-center gap-1"><Icon name="Check" size={11} />сохранён</span>}
                      </p>
                      <input
                        type="text"
                        value={poConfig.tgChatId}
                        onChange={(e) => setPoConfig((p) => ({ ...p, tgChatId: e.target.value }))}
                        placeholder="123456789"
                        className="w-full bg-black border border-zinc-700 focus:border-blue-500/60 rounded-lg px-3 py-2 text-blue-300 font-space-mono text-xs outline-none transition-colors placeholder:text-zinc-600"
                      />
                    </div>
                  </div>
                  {poConfig.tgToken && poConfig.tgChatId
                    ? <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 text-blue-400 font-space-mono text-xs"><Icon name="CheckCircle" size={13} />Telegram подключён — уведомления будут вшиты в бота</div>
                        <button
                          onClick={sendTgTest}
                          disabled={tgTestStatus === "sending"}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-space-mono font-bold border transition-all ${
                            tgTestStatus === "ok" ? "bg-green-500/20 border-green-500/40 text-green-400" :
                            tgTestStatus === "error" ? "bg-red-500/20 border-red-500/40 text-red-400" :
                            tgTestStatus === "sending" ? "bg-zinc-700 border-zinc-600 text-zinc-400" :
                            "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                          }`}
                        >
                          <Icon name={tgTestStatus === "ok" ? "Check" : tgTestStatus === "error" ? "X" : "Send"} size={11} />
                          {tgTestStatus === "sending" ? "Отправка..." : tgTestStatus === "ok" ? "Пришло!" : tgTestStatus === "error" ? "Ошибка — проверьте токен" : "Отправить тест"}
                        </button>
                      </div>
                    : (
                      <button
                        onClick={() => setTgGuideOpen((v) => !v)}
                        className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-space-mono text-xs transition-colors"
                      >
                        <Icon name={tgGuideOpen ? "ChevronUp" : "ChevronDown"} size={12} />
                        Как создать Telegram бота за 1 минуту?
                      </button>
                    )
                  }

                  {tgGuideOpen && !poConfig.tgToken && (
                    <div className="mt-2 bg-zinc-800/60 border border-zinc-700 rounded-xl p-4 space-y-3">
                      <p className="text-zinc-400 font-space-mono text-xs">Нужен Telegram — всё делается прямо в нём:</p>
                      <div className="space-y-2">
                        {[
                          { step: "1", icon: "🤖", color: "border-blue-500/30 bg-blue-500/5", title: "Откройте @BotFather", desc: "Перейдите в Telegram и найдите бота", link: { href: "https://t.me/BotFather", label: "@BotFather" } },
                          { step: "2", icon: "💬", color: "border-zinc-600 bg-zinc-800/40", title: 'Отправьте команду /newbot', desc: "BotFather спросит имя — введите любое, например: MyTradeBot" },
                          { step: "3", icon: "🔑", color: "border-green-500/30 bg-green-500/5", title: "Скопируйте Token", desc: "BotFather пришлёт сообщение с токеном вида 1234567890:AAF... — вставьте его в поле Bot Token выше" },
                          { step: "4", icon: "🆔", color: "border-zinc-600 bg-zinc-800/40", title: "Получите ваш Chat ID", desc: "Откройте", link: { href: "https://t.me/userinfobot", label: "@userinfobot" }, descAfter: "— он пришлёт ваш ID. Вставьте в поле Chat ID выше" },
                          { step: "5", icon: "✅", color: "border-purple-500/30 bg-purple-500/5", title: "Напишите своему боту /start", desc: "Найдите своего нового бота в Telegram и нажмите Start — без этого уведомления не придут!" },
                        ].map(({ step, icon, color, title, desc, link, descAfter }) => (
                          <div key={step} className={`flex gap-3 p-3 rounded-lg border ${color}`}>
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-orbitron font-bold text-xs text-zinc-300">{step}</div>
                            <div>
                              <p className="text-white font-orbitron text-xs font-semibold mb-0.5">{icon} {title}</p>
                              <p className="text-zinc-400 font-space-mono text-xs">
                                {desc}{" "}
                                {link && <a href={link.href} target="_blank" rel="noreferrer" className="text-blue-400 underline">{link.label}</a>}
                                {descAfter && ` ${descAfter}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                        <p className="text-yellow-400/80 font-space-mono text-xs">💡 Один и тот же бот и chat ID можно использовать для обоих ботов — уведомления придут в один чат</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Session ID Guide */}
              <div className="mb-6">
                <button
                  onClick={() => setSessionGuideOpen((v) => !v)}
                  className="w-full flex items-center justify-between bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-xl px-5 py-3.5 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-blue-400 text-lg">🔑</span>
                    <div className="text-left">
                      <p className="text-white font-orbitron text-sm font-semibold">Как получить Session ID из Pocket Option?</p>
                      <p className="text-zinc-500 font-space-mono text-xs">Пошаговая инструкция — займёт 1 минуту</p>
                    </div>
                  </div>
                  <Icon
                    name={sessionGuideOpen ? "ChevronUp" : "ChevronDown"}
                    size={18}
                    className="text-zinc-400 group-hover:text-zinc-200 transition-colors flex-shrink-0"
                  />
                </button>

                {sessionGuideOpen && (
                  <div className="mt-2 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
                    <div className="p-5 space-y-5">

                      {/* Intro */}
                      <p className="text-zinc-400 font-space-mono text-xs leading-relaxed">
                        Session ID — это ключ вашей сессии в Pocket Option. Бот использует его, чтобы открывать сделки от вашего имени. Вот как его найти:
                      </p>

                      {/* Steps */}
                      <div className="space-y-3">
                        {[
                          {
                            step: "1",
                            icon: "🌐",
                            title: "Откройте Pocket Option в браузере",
                            desc: "Перейдите на сайт po-fcm.com/ru и войдите в свой аккаунт.",
                            color: "border-blue-500/40 bg-blue-500/5",
                          },
                          {
                            step: "2",
                            icon: "🛠️",
                            title: "Откройте DevTools",
                            desc: "Нажмите F12 (или Ctrl+Shift+I на Windows / Cmd+Option+I на Mac). Откроется панель разработчика.",
                            color: "border-zinc-600 bg-zinc-800/40",
                          },
                          {
                            step: "3",
                            icon: "📡",
                            title: "Перейдите во вкладку «Network» → «WS»",
                            desc: 'В верхней панели DevTools нажмите "Network" (Сеть). В строке фильтра выберите "WS" (WebSocket).',
                            color: "border-zinc-600 bg-zinc-800/40",
                          },
                          {
                            step: "4",
                            icon: "🔄",
                            title: "Обновите страницу F5",
                            desc: "Нажмите F5 — страница перезагрузится и в списке появятся WebSocket-соединения.",
                            color: "border-zinc-600 bg-zinc-800/40",
                          },
                          {
                            step: "5",
                            icon: "🔍",
                            title: "Найдите сообщение 42[\"auth\",...]",
                            desc: 'Кликните на соединение в списке → вкладка "Messages". Найдите сообщение начинающееся с 42["auth", — скопируйте его целиком.',
                            color: "border-green-500/40 bg-green-500/5",
                          },
                          {
                            step: "6",
                            icon: "💻",
                            title: "Запустите бота в PowerShell",
                            desc: 'Скопируйте сообщение 42["auth",...] целиком из DevTools и вставьте вместо ТВОЁ_СООБЩЕНИЕ_42auth_ЦЕЛИКОМ:',
                            color: "border-red-500/40 bg-red-500/5",
                            code: `$env:PO_SESSION_ID='ТВОЁ_СООБЩЕНИЕ_42auth_ЦЕЛИКОМ'; python bot.py`,
                          },
                        ].map(({ step, icon, title, desc, color, code }) => (
                          <div key={step} className={`flex gap-4 p-4 rounded-xl border ${color}`}>
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-orbitron font-bold text-xs text-zinc-300">
                              {step}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span>{icon}</span>
                                <p className="text-white font-orbitron text-sm font-semibold">{title}</p>
                              </div>
                              <p className="text-zinc-400 font-space-mono text-xs leading-relaxed">{desc}</p>
                              {code && (
                                <pre className="mt-2 bg-black rounded-lg p-3 text-xs text-green-400 font-space-mono border border-zinc-800 overflow-auto whitespace-pre-wrap">
                                  {code}
                                </pre>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Warning */}
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                        <div className="flex gap-3">
                          <span className="text-yellow-400 text-lg flex-shrink-0">⚠️</span>
                          <div className="space-y-1">
                            <p className="text-yellow-400 font-orbitron text-xs font-semibold">Важно о безопасности</p>
                            <ul className="text-zinc-400 font-space-mono text-xs space-y-1">
                              <li>• Session ID — как пароль. Никому его не передавайте</li>
                              <li>• Сессия истекает через некоторое время — нужно будет получить новую</li>
                              <li>• Не записывайте Session ID в файл бота — используйте только переменные окружения</li>
                              <li>• При смене пароля или выходе из аккаунта Session ID станет недействительным</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Strategy Guide */}
              <div className="mb-6">
                <button
                  onClick={() => setStrategyGuideOpen((v) => !v)}
                  className="w-full flex items-center justify-between bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-xl px-5 py-3.5 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-400 text-lg">🧭</span>
                    <div className="text-left">
                      <p className="text-white font-orbitron text-sm font-semibold">Какую стратегию выбрать?</p>
                      <p className="text-zinc-500 font-space-mono text-xs">Сравнение стратегий и советы для новичков</p>
                    </div>
                  </div>
                  <Icon
                    name={strategyGuideOpen ? "ChevronUp" : "ChevronDown"}
                    size={18}
                    className="text-zinc-400 group-hover:text-zinc-200 transition-colors flex-shrink-0"
                  />
                </button>

                {strategyGuideOpen && (
                  <div className="mt-2 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
                    <div className="p-5 space-y-5">

                      {/* Recommendation for beginners */}
                      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                        <div className="flex gap-3">
                          <span className="text-2xl flex-shrink-0">👶</span>
                          <div>
                            <p className="text-green-400 font-orbitron text-sm font-semibold mb-1">Новичку — начинать отсюда</p>
                            <p className="text-zinc-300 font-space-mono text-xs leading-relaxed">
                              Если вы только начинаете — выбирайте <span className="text-green-400 font-bold">EMA Пересечение</span>. 
                              Это самая понятная и предсказуемая стратегия с минимальным риском. 
                              Она даёт чёткий сигнал и не требует сложных настроек.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Strategy comparison cards */}
                      <div className="space-y-3">

                        {/* EMA Cross */}
                        <div className="border border-green-500/30 bg-green-500/5 rounded-xl p-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-green-400 font-orbitron font-bold text-sm">EMA Пересечение</span>
                              <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-space-mono">Новичкам</span>
                            </div>
                            <div className="flex gap-1">
                              {["🟢","🟢","⚫","⚫","⚫"].map((d,i) => <span key={i} className="text-xs">{d}</span>)}
                            </div>
                          </div>
                          <p className="text-zinc-400 font-space-mono text-xs leading-relaxed mb-3">
                            Бот ждёт, когда быстрая линия EMA пересечёт медленную. Пересечение снизу вверх — покупаем CALL (ждём рост). Сверху вниз — PUT (ждём падение). Сигналов немного, но они надёжные.
                          </p>
                          <div className="grid grid-cols-3 gap-2 text-xs font-space-mono">
                            <div className="bg-zinc-800 rounded-lg p-2 text-center">
                              <p className="text-zinc-500 mb-0.5">Сигналов/день</p>
                              <p className="text-white font-bold">5–15</p>
                            </div>
                            <div className="bg-zinc-800 rounded-lg p-2 text-center">
                              <p className="text-zinc-500 mb-0.5">Winrate (прим.)</p>
                              <p className="text-green-400 font-bold">55–65%</p>
                            </div>
                            <div className="bg-zinc-800 rounded-lg p-2 text-center">
                              <p className="text-zinc-500 mb-0.5">Риск</p>
                              <p className="text-green-400 font-bold">Низкий</p>
                            </div>
                          </div>
                        </div>

                        {/* RSI */}
                        <div className="border border-blue-500/30 bg-blue-500/5 rounded-xl p-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-400 font-orbitron font-bold text-sm">RSI Разворот</span>
                              <span className="text-xs bg-zinc-700 text-zinc-300 border border-zinc-600 px-2 py-0.5 rounded-full font-space-mono">Универсальная</span>
                            </div>
                            <div className="flex gap-1">
                              {["🟡","🟡","🟡","⚫","⚫"].map((d,i) => <span key={i} className="text-xs">{d}</span>)}
                            </div>
                          </div>
                          <p className="text-zinc-400 font-space-mono text-xs leading-relaxed mb-3">
                            RSI измеряет «усталость» рынка. Когда рынок сильно вырос — RSI выше 70 (перекупленность), ждём разворот вниз → PUT. Упал ниже 30 (перепроданность) → CALL. Хорошо работает на флете и OTC-парах.
                          </p>
                          <div className="grid grid-cols-3 gap-2 text-xs font-space-mono">
                            <div className="bg-zinc-800 rounded-lg p-2 text-center">
                              <p className="text-zinc-500 mb-0.5">Сигналов/день</p>
                              <p className="text-white font-bold">10–25</p>
                            </div>
                            <div className="bg-zinc-800 rounded-lg p-2 text-center">
                              <p className="text-zinc-500 mb-0.5">Winrate (прим.)</p>
                              <p className="text-yellow-400 font-bold">52–60%</p>
                            </div>
                            <div className="bg-zinc-800 rounded-lg p-2 text-center">
                              <p className="text-zinc-500 mb-0.5">Риск</p>
                              <p className="text-yellow-400 font-bold">Средний</p>
                            </div>
                          </div>
                        </div>

                        {/* Candle patterns */}
                        <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-xl p-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-yellow-400 font-orbitron font-bold text-sm">Паттерны свечей</span>
                              <span className="text-xs bg-zinc-700 text-zinc-300 border border-zinc-600 px-2 py-0.5 rounded-full font-space-mono">Опытным</span>
                            </div>
                            <div className="flex gap-1">
                              {["🟡","🟡","🟡","⚫","⚫"].map((d,i) => <span key={i} className="text-xs">{d}</span>)}
                            </div>
                          </div>
                          <p className="text-zinc-400 font-space-mono text-xs leading-relaxed mb-3">
                            Бот ищет японские паттерны: молот, поглощение, доджи. Когда находит разворотную фигуру — открывает опцион. Сигналов меньше, но они бывают очень точными. Лучше работает на таймфрейме 5 минут.
                          </p>
                          <div className="grid grid-cols-3 gap-2 text-xs font-space-mono">
                            <div className="bg-zinc-800 rounded-lg p-2 text-center">
                              <p className="text-zinc-500 mb-0.5">Сигналов/день</p>
                              <p className="text-white font-bold">3–10</p>
                            </div>
                            <div className="bg-zinc-800 rounded-lg p-2 text-center">
                              <p className="text-zinc-500 mb-0.5">Winrate (прим.)</p>
                              <p className="text-yellow-400 font-bold">55–68%</p>
                            </div>
                            <div className="bg-zinc-800 rounded-lg p-2 text-center">
                              <p className="text-zinc-500 mb-0.5">Риск</p>
                              <p className="text-yellow-400 font-bold">Средний</p>
                            </div>
                          </div>
                        </div>

                        {/* Support/Resistance */}
                        <div className="border border-purple-500/30 bg-purple-500/5 rounded-xl p-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-purple-400 font-orbitron font-bold text-sm">Поддержка / Сопротивление</span>
                              <span className="text-xs bg-zinc-700 text-zinc-300 border border-zinc-600 px-2 py-0.5 rounded-full font-space-mono">Опытным</span>
                            </div>
                            <div className="flex gap-1">
                              {["🟡","🟡","🟡","🟡","⚫"].map((d,i) => <span key={i} className="text-xs">{d}</span>)}
                            </div>
                          </div>
                          <p className="text-zinc-400 font-space-mono text-xs leading-relaxed mb-3">
                            Бот находит ключевые ценовые уровни — «потолки» и «полы» рынка. Когда цена подходит к уровню, открывает опцион в сторону отбоя. Требует достаточно данных (минимум 30 свечей) для точного определения уровней.
                          </p>
                          <div className="grid grid-cols-3 gap-2 text-xs font-space-mono">
                            <div className="bg-zinc-800 rounded-lg p-2 text-center">
                              <p className="text-zinc-500 mb-0.5">Сигналов/день</p>
                              <p className="text-white font-bold">2–8</p>
                            </div>
                            <div className="bg-zinc-800 rounded-lg p-2 text-center">
                              <p className="text-zinc-500 mb-0.5">Winrate (прим.)</p>
                              <p className="text-purple-400 font-bold">58–70%</p>
                            </div>
                            <div className="bg-zinc-800 rounded-lg p-2 text-center">
                              <p className="text-zinc-500 mb-0.5">Риск</p>
                              <p className="text-yellow-400 font-bold">Средний</p>
                            </div>
                          </div>
                        </div>

                        {/* Martingale */}
                        <div className="border border-red-500/40 bg-red-500/5 rounded-xl p-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-red-400 font-orbitron font-bold text-sm">Мартингейл</span>
                              <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-space-mono">⚠️ Опасно</span>
                            </div>
                            <div className="flex gap-1">
                              {["🔴","🔴","🔴","🔴","🔴"].map((d,i) => <span key={i} className="text-xs">{d}</span>)}
                            </div>
                          </div>
                          <p className="text-zinc-400 font-space-mono text-xs leading-relaxed mb-3">
                            После каждого проигрыша ставка умножается на заданный коэффициент. Идея: рано или поздно выигрыш окупит все потери. На практике — серия из 5–7 убытков подряд может уничтожить весь депозит. Не рекомендуем новичкам.
                          </p>
                          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                            <p className="text-red-400 font-space-mono text-xs">
                              Пример: ставка $10 с множителем ×2.1 за 6 шагов вырастет до <span className="font-bold text-red-300">$96</span>. При 7-м проигрыше подряд — $202. При нулевом балансе бот остановится.
                            </p>
                          </div>
                        </div>

                      </div>

                      {/* Tips */}
                      <div className="bg-zinc-800 rounded-xl p-4 space-y-2">
                        <p className="text-white font-orbitron text-xs font-semibold mb-2">💡 Советы по выбору</p>
                        <ul className="text-zinc-400 font-space-mono text-xs space-y-1.5">
                          <li>• Начинайте с <span className="text-green-400">EMA Пересечение</span> на EUR/USD OTC — самый стабильный старт</li>
                          <li>• Для OTC-пар лучше работают RSI и EMA — рынок менее волатильный</li>
                          <li>• Экспирация 1–3 минуты подходит для скальпинговых стратегий</li>
                          <li>• Экспирация 5–15 минут — для паттернов свечей и уровней</li>
                          <li>• Всегда тестируйте на демо-счёте минимум 50 сделок перед реальными деньгами</li>
                          <li>• Мартингейл можно добавить к любой стратегии, но делайте это осторожно</li>
                        </ul>
                      </div>

                    </div>
                  </div>
                )}
              </div>

              {/* Dual mode toggle */}
              <div className="mb-6">
                <button
                  onClick={() => setDualMode((v) => !v)}
                  className={`w-full flex items-center justify-between rounded-xl px-5 py-3.5 transition-all duration-200 border group ${
                    dualMode
                      ? "bg-purple-500/10 border-purple-500/40 hover:border-purple-400"
                      : "bg-zinc-900 border-zinc-700 hover:border-zinc-500"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">⚡</span>
                    <div className="text-left">
                      <p className={`font-orbitron text-sm font-semibold ${dualMode ? "text-purple-300" : "text-white"}`}>
                        Режим двух ботов {dualMode ? "— включён" : ""}
                      </p>
                      <p className="text-zinc-500 font-space-mono text-xs">Настройте 2 разные стратегии и скачайте оба файла сразу</p>
                    </div>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-all duration-200 flex items-center px-0.5 ${dualMode ? "bg-purple-500" : "bg-zinc-700"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-all duration-200 ${dualMode ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                </button>
              </div>

              {/* Dual risk summary */}
              {dualMode && (
                <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      label: "Суммарный стоп-лосс",
                      value: `$${poConfig.stopLossUsd + poConfig2.stopLossUsd}`,
                      sub: `Бот 1: $${poConfig.stopLossUsd} + Бот 2: $${poConfig2.stopLossUsd}`,
                      color: "border-red-500/30 bg-red-500/5",
                      valueColor: "text-red-400",
                    },
                    {
                      label: "Суммарный тейк-профит",
                      value: `$${poConfig.takeProfitUsd + poConfig2.takeProfitUsd}`,
                      sub: `Бот 1: $${poConfig.takeProfitUsd} + Бот 2: $${poConfig2.takeProfitUsd}`,
                      color: "border-green-500/30 bg-green-500/5",
                      valueColor: "text-green-400",
                    },
                    {
                      label: "Суммарная ставка",
                      value: `$${poConfig.betAmount + poConfig2.betAmount}`,
                      sub: `Бот 1: $${poConfig.betAmount} + Бот 2: $${poConfig2.betAmount}`,
                      color: "border-yellow-500/30 bg-yellow-500/5",
                      valueColor: "text-yellow-400",
                    },
                    {
                      label: "Соотношение TP/SL",
                      value: (poConfig.stopLossUsd + poConfig2.stopLossUsd) > 0
                        ? `${((poConfig.takeProfitUsd + poConfig2.takeProfitUsd) / (poConfig.stopLossUsd + poConfig2.stopLossUsd)).toFixed(1)}x`
                        : "—",
                      sub: (poConfig.takeProfitUsd + poConfig2.takeProfitUsd) >= (poConfig.stopLossUsd + poConfig2.stopLossUsd)
                        ? "Хорошее соотношение"
                        : "SL превышает TP",
                      color: (poConfig.takeProfitUsd + poConfig2.takeProfitUsd) >= (poConfig.stopLossUsd + poConfig2.stopLossUsd)
                        ? "border-blue-500/30 bg-blue-500/5"
                        : "border-orange-500/30 bg-orange-500/5",
                      valueColor: (poConfig.takeProfitUsd + poConfig2.takeProfitUsd) >= (poConfig.stopLossUsd + poConfig2.stopLossUsd)
                        ? "text-blue-400"
                        : "text-orange-400",
                    },
                  ].map((item) => (
                    <div key={item.label} className={`rounded-xl border p-3 ${item.color}`}>
                      <p className="text-zinc-500 font-space-mono text-xs mb-1">{item.label}</p>
                      <p className={`font-orbitron font-bold text-xl ${item.valueColor}`}>{item.value}</p>
                      <p className="text-zinc-600 font-space-mono text-xs mt-0.5">{item.sub}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className={`grid gap-8 ${dualMode ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 lg:grid-cols-3"}`}>
                {/* Bot 1 Form */}
                <div className={dualMode ? "" : "lg:col-span-1"}>
                  {dualMode && <p className="text-purple-400 font-orbitron text-xs font-bold mb-3 uppercase tracking-wider">🤖 Бот 1</p>}
                  <PocketOptionBotForm
                    config={poConfig}
                    onChange={setPoConfig}
                    onGenerate={handlePOGenerate}
                  />
                </div>

                {/* Bot 2 Form (dual mode only) */}
                {dualMode && (
                  <div className="space-y-4">
                    <p className="text-blue-400 font-orbitron text-xs font-bold uppercase tracking-wider">🤖 Бот 2</p>
                    <PocketOptionBotForm
                      config={poConfig2}
                      onChange={setPoConfig2}
                      onGenerate={handlePOGenerate}
                    />
                    {/* Telegram for Bot 2 */}
                    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400">✈️</span>
                        <p className="text-white font-orbitron text-xs font-semibold">Telegram для Бота 2</p>
                        <span className="text-zinc-500 font-space-mono text-xs">— необязательно</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <p className="text-zinc-500 font-space-mono text-xs mb-1">Bot Token</p>
                          <input
                            type="text"
                            value={poConfig2.tgToken}
                            onChange={(e) => setPoConfig2((p) => ({ ...p, tgToken: e.target.value }))}
                            placeholder="1234567890:AAF..."
                            className="w-full bg-black border border-zinc-700 focus:border-blue-500/60 rounded-lg px-3 py-2 text-blue-300 font-space-mono text-xs outline-none transition-colors placeholder:text-zinc-600"
                          />
                        </div>
                        <div>
                          <p className="text-zinc-500 font-space-mono text-xs mb-1">Chat ID</p>
                          <input
                            type="text"
                            value={poConfig2.tgChatId}
                            onChange={(e) => setPoConfig2((p) => ({ ...p, tgChatId: e.target.value }))}
                            placeholder="123456789"
                            className="w-full bg-black border border-zinc-700 focus:border-blue-500/60 rounded-lg px-3 py-2 text-blue-300 font-space-mono text-xs outline-none transition-colors placeholder:text-zinc-600"
                          />
                        </div>
                      </div>
                      {poConfig2.tgToken && poConfig2.tgChatId
                        ? <div className="flex items-center gap-2 text-blue-400 font-space-mono text-xs"><Icon name="CheckCircle" size={12} />Telegram подключён для Бота 2</div>
                        : <p className="text-zinc-600 font-space-mono text-xs">Можно использовать тот же бот и chat id что и для Бота 1</p>
                      }
                    </div>
                  </div>
                )}

                {!dualMode && (
                  <>
                {/* Code output */}
                <div className="space-y-4" ref={poCodeRef}>
                  <Card className="bg-zinc-900 border-red-500/20 h-full">
                    <CardHeader className="flex flex-row items-center justify-between gap-2">
                      <CardTitle className="font-orbitron text-white text-lg">Python-код бота</CardTitle>
                      {poGenerated && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePOCopy}
                            className="border-red-500/40 text-red-400 hover:bg-red-500/10 font-space-mono text-xs"
                          >
                            <Icon name="Copy" size={12} className="mr-1" />
                            {poCopied ? "Скопировано ✓" : "Копировать"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePODownload}
                            className="border-green-500/40 text-green-400 hover:bg-green-500/10 font-space-mono text-xs"
                          >
                            <Icon name="Download" size={12} className="mr-1" />
                            .py
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEnvDownload}
                            className="border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 font-space-mono text-xs"
                          >
                            <Icon name="Download" size={12} className="mr-1" />
                            .env
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyCmd(`$env:PO_SESSION_ID='${sessionId || "ВСТАВЬТЕ_SESSION_ID"}'; python bot.py`, "header")}
                            className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10 font-space-mono text-xs"
                          >
                            <Icon name={copiedCmd === "header" ? "Check" : "Terminal"} size={12} className="mr-1" />
                            {copiedCmd === "header" ? "Скопировано ✓" : "Команда запуска"}
                          </Button>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {poGenerated ? (
                        <pre className="bg-black rounded-lg p-4 text-xs text-green-400 font-space-mono overflow-auto max-h-[700px] whitespace-pre-wrap leading-relaxed border border-zinc-800">
                          {poCode}
                        </pre>
                      ) : (
                        <div className="bg-black rounded-lg p-8 border border-zinc-800 text-center min-h-[400px] flex flex-col items-center justify-center">
                          <div className="text-6xl mb-4">🎯</div>
                          <p className="text-zinc-400 font-space-mono text-sm mb-2">Код появится здесь</p>
                          <p className="text-zinc-600 font-space-mono text-xs">Настройте параметры и нажмите «Сгенерировать»</p>
                        </div>
                      )}
                      {poGenerated && (
                        <div className="space-y-3 border-t border-zinc-800 pt-4">
                          <p className="text-white font-orbitron text-sm font-semibold">Как запустить бота</p>

                          {/* Step 1 */}
                          <div className="rounded-lg border border-zinc-700 bg-zinc-800/40 p-3 space-y-1">
                            <p className="text-red-400 font-orbitron text-xs font-semibold">Шаг 1 — Скачайте файл</p>
                            <p className="text-zinc-400 font-space-mono text-xs">Нажмите кнопку <span className="text-green-400">.py</span> выше — файл сохранится на ваш компьютер.</p>
                            <p className="text-zinc-400 font-space-mono text-xs">Переименуйте скачанный файл в <span className="text-white">bot.py</span> (правая кнопка → <span className="text-green-400">«Переименовать»</span>).</p>
                          </div>

                          {/* Step 2 */}
                          <div className="rounded-lg border border-zinc-700 bg-zinc-800/40 p-3 space-y-2">
                            <p className="text-red-400 font-orbitron text-xs font-semibold">Шаг 2 — Установите Python</p>
                            <p className="text-zinc-400 font-space-mono text-xs">Скачайте <a href="https://www.python.org/downloads/release/python-3119/" target="_blank" rel="noreferrer" className="text-blue-400 underline">Python 3.11</a> (Windows installer 64-bit). При установке отметьте галочку <span className="text-white">«Add to PATH»</span>.</p>
                            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded p-2">
                              <p className="text-yellow-400/80 font-space-mono text-xs">⚠️ Используйте именно <span className="text-white">Python 3.11</span> — версии 3.12+ не совместимы с библиотекой Pocket Option.</p>
                            </div>
                          </div>

                          {/* Step 3 */}
                          <div className="rounded-lg border border-zinc-700 bg-zinc-800/40 p-3 space-y-2">
                            <p className="text-red-400 font-orbitron text-xs font-semibold">Шаг 3 — Установите зависимости</p>
                            <p className="text-zinc-400 font-space-mono text-xs">Библиотека Pocket Option устанавливается вручную — через ZIP с GitHub:</p>
                            <ol className="text-zinc-400 font-space-mono text-xs space-y-1 ml-2 list-decimal list-inside">
                              <li>Скачайте ZIP-архив: <a href="https://github.com/ChipaDevTeam/PocketOptionAPI/archive/refs/heads/main.zip" target="_blank" rel="noreferrer" className="text-blue-400 underline">github.com/ChipaDevTeam/PocketOptionAPI</a></li>
                              <li>Распакуйте архив (правая кнопка → <span className="text-white">«Извлечь всё»</span>)</li>
                              <li>Зайдите в распакованную папку <span className="text-white">PocketOptionAPI-main</span></li>
                              <li>В адресной строке проводника напечатайте <span className="text-green-400">powershell</span> → Enter</li>
                              <li>Выполните команду:</li>
                            </ol>
                            <div className="relative">
                              <pre className="bg-black rounded p-2 pr-24 text-xs text-green-400 font-space-mono border border-zinc-800 overflow-x-auto whitespace-pre-wrap break-all">{`pip install .`}</pre>
                              <button
                                onClick={() => copyCmd("pip install .", "pip1")}
                                className={`absolute right-2 top-2 px-2 py-1 rounded text-xs font-space-mono font-bold transition-all ${copiedCmd === "pip1" ? "bg-green-500/30 text-green-300" : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"}`}
                              >
                                {copiedCmd === "pip1" ? "✓" : "Копировать"}
                              </button>
                            </div>
                            <p className="text-zinc-500 font-space-mono text-xs">Увидите <span className="text-green-400">Successfully installed</span> — готово, переходите к шагу 4.</p>
                            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded p-2">
                              <p className="text-yellow-400/80 font-space-mono text-xs">Видите сообщение <span className="text-white">«new version of pip available»</span>? Это не ошибка — можно проигнорировать.</p>
                            </div>
                          </div>

                          {/* Step 4 */}
                          <div className="rounded-lg border border-zinc-700 bg-zinc-800/40 p-3 space-y-2">
                            <p className="text-red-400 font-orbitron text-xs font-semibold">Шаг 4 — Получите Session ID</p>
                            <p className="text-zinc-400 font-space-mono text-xs">Войдите в <a href="https://po-fcm.com/ru" target="_blank" rel="noreferrer" className="text-blue-400 underline">po-fcm.com/ru</a>. Session ID — это WebSocket-сообщение авторизации. Вот как его найти:</p>
                            <div className="space-y-2">
                              <div className="bg-black/40 rounded p-2">
                                <p className="text-zinc-300 font-space-mono text-xs font-semibold mb-1">Chrome / Edge / Opera</p>
                                <ol className="text-zinc-500 font-space-mono text-xs space-y-0.5 ml-2 list-decimal list-inside">
                                  <li>Нажмите <span className="text-white">F12</span> — откроется DevTools</li>
                                  <li>Вкладка <span className="text-white">Network</span> (Сеть)</li>
                                  <li>В фильтре выберите <span className="text-white">WS</span> (WebSocket)</li>
                                  <li>Обновите страницу <span className="text-white">F5</span></li>
                                  <li>Нажмите на соединение в списке → вкладка <span className="text-white">Messages</span></li>
                                  <li>Найдите сообщение начинающееся с <span className="text-red-400">42["auth",</span> → скопируйте его целиком</li>
                                </ol>
                              </div>
                              <div className="bg-black/40 rounded p-2">
                                <p className="text-zinc-300 font-space-mono text-xs font-semibold mb-1">Firefox</p>
                                <ol className="text-zinc-500 font-space-mono text-xs space-y-0.5 ml-2 list-decimal list-inside">
                                  <li>Нажмите <span className="text-white">F12</span></li>
                                  <li>Вкладка <span className="text-white">Сеть</span> → фильтр <span className="text-white">WS</span></li>
                                  <li>Обновите страницу <span className="text-white">F5</span></li>
                                  <li>Кликните на WS-соединение → <span className="text-white">Ответ</span></li>
                                  <li>Найдите сообщение <span className="text-red-400">42["auth",...]</span> → скопируйте целиком</li>
                                </ol>
                              </div>
                              <div className="bg-black/40 rounded p-2">
                                <p className="text-zinc-300 font-space-mono text-xs font-semibold mb-1">Firefox</p>
                                <ol className="text-zinc-500 font-space-mono text-xs space-y-0.5 ml-2 list-decimal list-inside">
                                  <li>Нажмите <span className="text-white">F12</span></li>
                                  <li>Вкладка <span className="text-white">Хранилище</span> (Storage)</li>
                                  <li>Слева: <span className="text-white">Куки → po-fcm.com</span></li>
                                  <li>Найдите строку <span className="text-red-400">ci_session</span> → скопируйте значение</li>
                                </ol>
                              </div>
                            </div>
                            <p className="text-zinc-500 font-space-mono text-xs">Сообщение выглядит так: <span className="text-green-400">42["auth",{"{"}{"\"session\""}:{"\"abc123...\""},{"\"isDemo\""}:1,...{"}"}]</span> — скопируйте его целиком.</p>
                          </div>

                          {/* Step 5 */}
                          <div className="rounded-lg border border-zinc-700 bg-zinc-800/40 p-3 space-y-2">
                            <p className="text-red-400 font-orbitron text-xs font-semibold">Шаг 5 — Запустите бота</p>
                            <p className="text-zinc-400 font-space-mono text-xs">Положите <span className="text-white">bot.py</span> в папку <span className="text-white">PocketOptionAPI-main</span> (туда же, где делали <span className="text-green-400">pip install .</span>).</p>
                            <p className="text-zinc-400 font-space-mono text-xs font-semibold">Как открыть терминал в нужной папке:</p>
                            <ol className="text-zinc-400 font-space-mono text-xs space-y-1 ml-2 list-decimal list-inside">
                              <li>Откройте папку <span className="text-white">PocketOptionAPI-main</span> в Проводнике</li>
                              <li>В адресной строке проводника напечатайте <span className="text-green-400">powershell</span> → Enter</li>
                            </ol>
                            <p className="text-zinc-400 font-space-mono text-xs mt-1 mb-1">Скопируйте сообщение <span className="text-red-400">42["auth",...]</span> целиком из DevTools и вставьте в поле <span className="text-green-400">🔑 выше</span> — команда готова:</p>
                            <div className="relative group">
                              <pre className="bg-black rounded p-2 pr-24 text-xs text-green-400 font-space-mono border border-zinc-800 overflow-x-auto whitespace-pre-wrap break-all">{`$env:PO_SESSION_ID='${sessionId || "ВСТАВЬТЕ_SESSION_ID_В_ПОЛЕ_ВЫШЕ"}'; python bot.py`}</pre>
                              <button
                                onClick={() => copyCmd(`$env:PO_SESSION_ID='${sessionId || "ВСТАВЬТЕ_SESSION_ID_В_ПОЛЕ_ВЫШЕ"}'; python bot.py`, "step5")}
                                className={`absolute right-2 top-2 px-2 py-1 rounded text-xs font-space-mono font-bold transition-all ${copiedCmd === "step5" ? "bg-green-500/30 text-green-300" : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"}`}
                              >
                                {copiedCmd === "step5" ? "✓" : "Копировать"}
                              </button>
                            </div>
                            <p className="text-zinc-500 font-space-mono text-xs">Если всё верно — в терминале появятся логи бота и он начнёт работать. Не закрывайте окно PowerShell — бот остановится.</p>
                          </div>

                          {/* Errors */}
                          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 space-y-2">
                            <p className="text-red-400 font-orbitron text-xs font-semibold">❓ Бот выдал ошибку — что делать</p>
                            <div className="space-y-2">
                              <div className="bg-black/40 rounded p-2">
                                <p className="text-zinc-300 font-space-mono text-xs font-semibold mb-0.5">«python не является внутренней командой»</p>
                                <p className="text-zinc-500 font-space-mono text-xs">Python не установлен или не добавлен в PATH. Переустановите Python с <a href="https://python.org/downloads" target="_blank" rel="noreferrer" className="text-blue-400 underline">python.org</a> и обязательно отметьте <span className="text-white">«Add to PATH»</span>.</p>
                              </div>
                              <div className="bg-black/40 rounded p-2">
                                <p className="text-zinc-300 font-space-mono text-xs font-semibold mb-0.5">«No module named 'pocketoptionapi'»</p>
                                <p className="text-zinc-500 font-space-mono text-xs">Зависимости не установились. Вернитесь к шагу 3 — скачайте ZIP и выполните <span className="text-green-400">pip install .</span> в папке PocketOptionAPI-main.</p>
                              </div>
                              <div className="bg-black/40 rounded p-2">
                                <p className="text-zinc-300 font-space-mono text-xs font-semibold mb-0.5">«Invalid session» или «Unauthorized»</p>
                                <p className="text-zinc-500 font-space-mono text-xs">Session ID устарел или скопирован неверно. Зайдите в Pocket Option заново, не выходя из аккаунта — и повторите шаг 4.</p>
                              </div>
                              <div className="bg-black/40 rounded p-2">
                                <p className="text-zinc-300 font-space-mono text-xs font-semibold mb-0.5">«No such file or directory» / «bot.py не найден»</p>
                                <p className="text-zinc-500 font-space-mono text-xs mb-1">PowerShell открыт не в той папке где лежит файл. Исправление:</p>
                                <ol className="text-zinc-500 font-space-mono text-xs space-y-0.5 ml-2 list-decimal list-inside">
                                  <li>Откройте папку с <span className="text-white">bot.py</span> в Проводнике</li>
                                  <li>Зажмите <span className="text-white">Shift</span> → правая кнопка мыши на пустом месте папки</li>
                                  <li>Выберите <span className="text-green-400">«Открыть окно PowerShell здесь»</span> — только так PowerShell сразу окажется в нужной папке</li>
                                  <li>Теперь вводите команду запуска</li>
                                </ol>
                              </div>
                              <div className="bg-black/40 rounded p-2">
                                <p className="text-zinc-300 font-space-mono text-xs font-semibold mb-0.5">Терминал сразу закрылся</p>
                                <p className="text-zinc-500 font-space-mono text-xs">Запустите через PowerShell (не двойным кликом по файлу) — так увидите текст ошибки.</p>
                              </div>
                            </div>
                          </div>

                          {/* Step 6 */}
                          <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 space-y-2">
                            <p className="text-green-400 font-orbitron text-xs font-semibold">Шаг 6 — Сначала демо-счёт</p>
                            <p className="text-zinc-400 font-space-mono text-xs">Обязательно протестируйте бота на <span className="text-white">демо-счёте</span> Pocket Option минимум 1–2 дня перед запуском на реальные деньги.</p>
                            <div className="bg-black/40 rounded p-2 space-y-1">
                              <p className="text-green-400 font-space-mono text-xs font-semibold">Как переключиться на демо в Pocket Option:</p>
                              <ol className="text-zinc-400 font-space-mono text-xs space-y-1 ml-2 list-decimal list-inside">
                                <li>Войдите на <a href="https://po-fcm.com/ru/cabinet/demo-quick-high-low/" target="_blank" rel="noreferrer" className="text-blue-400 underline">po-fcm.com — Демо счёт</a></li>
                                <li>В правом верхнем углу кликните на <span className="text-white">баланс</span></li>
                                <li>Выберите <span className="text-green-400">«Демо-счёт»</span> — там уже есть $10 000 виртуальных</li>
                                <li>Получите Session ID именно с этой страницы (шаг 4) и запускайте бота</li>
                              </ol>
                            </div>
                            <p className="text-zinc-500 font-space-mono text-xs">Бот не знает на каком счёте работает — он торгует там, где активен Session ID.</p>
                          </div>

                          {/* Warning */}
                          <div className="flex gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                            <span className="text-yellow-400 text-base shrink-0">⚠️</span>
                            <p className="text-yellow-400/80 font-space-mono text-xs">Session ID действует до выхода из аккаунта. Не передавайте его третьим лицам — это полный доступ к вашему счёту.</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Trade Journal — 3rd column */}
                <TradeJournal
                  defaultAsset={poConfig.asset}
                  defaultBet={poConfig.betAmount}
                />
                  </>
                )}

                {/* Dual mode: code output + download both */}
                {dualMode && poGenerated && (
                  <div className="lg:col-span-2 space-y-4" ref={poCodeRef}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-zinc-900 border-purple-500/20">
                        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                          <CardTitle className="font-orbitron text-white text-sm">🤖 Бот 1 — {poConfig.strategy}</CardTitle>
                          <Button variant="outline" size="sm" onClick={handlePOCopy} className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 font-space-mono text-xs">
                            <Icon name="Copy" size={12} className="mr-1" />
                            {poCopied ? "✓" : "Копировать"}
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <pre className="bg-black rounded-lg p-3 text-xs text-green-400 font-space-mono overflow-auto max-h-80 whitespace-pre-wrap border border-zinc-800">{poCode}</pre>
                        </CardContent>
                      </Card>
                      <Card className="bg-zinc-900 border-blue-500/20">
                        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                          <CardTitle className="font-orbitron text-white text-sm">🤖 Бот 2 — {poConfig2.strategy}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="bg-black rounded-lg p-3 text-xs text-blue-300 font-space-mono overflow-auto max-h-80 whitespace-pre-wrap border border-zinc-800">{poCode2}</pre>
                        </CardContent>
                      </Card>
                    </div>
                    <Button
                      onClick={handleDualDownload}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-orbitron font-bold py-3"
                    >
                      <Icon name={dualDownloaded ? "Check" : "Download"} size={16} className="mr-2" />
                      {dualDownloaded ? "Скачано! Открой 2 окна PowerShell" : "Скачать оба файла (bot1.py + bot2.py)"}
                    </Button>
                    {dualDownloaded && (
                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 space-y-2">
                        <p className="text-purple-300 font-orbitron text-sm font-semibold">Как запустить оба бота одновременно:</p>
                        {!sessionId && (
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2 mb-2">
                            <p className="text-yellow-400 font-space-mono text-xs">⚠️ Вставьте Session ID в поле <span className="text-white">🔑 выше</span> — команды сгенерируются автоматически</p>
                          </div>
                        )}
                        {sessionId && (
                          <div className="flex items-center gap-2 text-green-400 font-space-mono text-xs mb-2">
                            <Icon name="CheckCircle" size={12} />
                            Session ID подставлен — скопируйте команды и запустите в двух окнах PowerShell
                          </div>
                        )}
                        <div className="space-y-2">
                          <div className="bg-black/40 rounded p-2">
                            <p className="text-zinc-400 font-space-mono text-xs mb-1">Окно PowerShell 1:</p>
                            <div className="relative">
                              <pre className="text-green-400 font-space-mono text-xs whitespace-pre-wrap break-all pr-24">{`$env:PO_SESSION_ID='${sessionId || "ВСТАВЬТЕ_SESSION_ID_В_ПОЛЕ_ВЫШЕ"}'; python bot1_${poConfig.strategy}.py`}</pre>
                              <button
                                onClick={() => copyCmd(`$env:PO_SESSION_ID='${sessionId || "ВСТАВЬТЕ_SESSION_ID_В_ПОЛЕ_ВЫШЕ"}'; python bot1_${poConfig.strategy}.py`, "dual1")}
                                className={`absolute right-0 top-0 px-2 py-1 rounded text-xs font-space-mono font-bold transition-all ${copiedCmd === "dual1" ? "bg-green-500/30 text-green-300" : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"}`}
                              >
                                {copiedCmd === "dual1" ? "✓" : "Копировать"}
                              </button>
                            </div>
                          </div>
                          <div className="bg-black/40 rounded p-2">
                            <p className="text-zinc-400 font-space-mono text-xs mb-1">Окно PowerShell 2:</p>
                            <div className="relative">
                              <pre className="text-blue-300 font-space-mono text-xs whitespace-pre-wrap break-all pr-24">{`$env:PO_SESSION_ID='${sessionId || "ВСТАВЬТЕ_SESSION_ID_В_ПОЛЕ_ВЫШЕ"}'; python bot2_${poConfig2.strategy}.py`}</pre>
                              <button
                                onClick={() => copyCmd(`$env:PO_SESSION_ID='${sessionId || "ВСТАВЬТЕ_SESSION_ID_В_ПОЛЕ_ВЫШЕ"}'; python bot2_${poConfig2.strategy}.py`, "dual2")}
                                className={`absolute right-0 top-0 px-2 py-1 rounded text-xs font-space-mono font-bold transition-all ${copiedCmd === "dual2" ? "bg-blue-500/30 text-blue-300" : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"}`}
                              >
                                {copiedCmd === "dual2" ? "✓" : "Копировать"}
                              </button>
                            </div>
                          </div>
                        </div>
                        <p className="text-zinc-500 font-space-mono text-xs">Оба бота будут торговать на одном счёте параллельно.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Crypto Tab */}
          {tab === "crypto" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <BotBuilderForm
                config={config}
                onChange={setConfig}
                onGenerate={handleGenerate}
              />

              <div className="space-y-4" ref={cryptoCodeRef}>
                <Card className="bg-zinc-900 border-red-500/20 h-full">
                  <CardHeader className="flex flex-row items-center justify-between gap-2">
                    <CardTitle className="font-orbitron text-white text-lg">Python-код бота</CardTitle>
                    {generated && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopy}
                          className="border-red-500/40 text-red-400 hover:bg-red-500/10 font-space-mono text-xs"
                        >
                          <Icon name="Copy" size={12} className="mr-1" />
                          {copied ? "Скопировано ✓" : "Копировать"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCryptoDownload}
                          className="border-green-500/40 text-green-400 hover:bg-green-500/10 font-space-mono text-xs"
                        >
                          <Icon name="Download" size={12} className="mr-1" />
                          .py
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {generated ? (
                      <pre className="bg-black rounded-lg p-4 text-xs text-green-400 font-space-mono overflow-auto max-h-[700px] whitespace-pre-wrap leading-relaxed border border-zinc-800">
                        {code}
                      </pre>
                    ) : (
                      <div className="bg-black rounded-lg p-8 border border-zinc-800 text-center min-h-[400px] flex flex-col items-center justify-center">
                        <div className="text-6xl mb-4">🤖</div>
                        <p className="text-zinc-400 font-space-mono text-sm mb-2">Код появится здесь</p>
                        <p className="text-zinc-600 font-space-mono text-xs">Настройте параметры и нажмите «Сгенерировать»</p>
                      </div>
                    )}
                    {generated && (
                      <div className="space-y-3 border-t border-zinc-800 pt-4">
                        <p className="text-white font-orbitron text-sm font-semibold">Как запустить бота</p>

                        <div className="rounded-lg border border-zinc-700 bg-zinc-800/40 p-3 space-y-1">
                          <p className="text-red-400 font-orbitron text-xs font-semibold">Шаг 1 — Скачайте файл</p>
                          <p className="text-zinc-400 font-space-mono text-xs">Нажмите кнопку <span className="text-green-400">.py</span> выше — файл <span className="text-white">bot.py</span> сохранится на ваш компьютер.</p>
                        </div>

                        <div className="rounded-lg border border-zinc-700 bg-zinc-800/40 p-3 space-y-2">
                          <p className="text-red-400 font-orbitron text-xs font-semibold">Шаг 2 — Установите Python</p>
                          <p className="text-zinc-400 font-space-mono text-xs">Если Python не установлен — скачайте с <a href="https://python.org/downloads" target="_blank" rel="noreferrer" className="text-blue-400 underline">python.org</a> (версия 3.10+). При установке отметьте <span className="text-white">«Add to PATH»</span>.</p>
                        </div>

                        <div className="rounded-lg border border-zinc-700 bg-zinc-800/40 p-3 space-y-2">
                          <p className="text-red-400 font-orbitron text-xs font-semibold">Шаг 3 — Установите зависимости</p>
                          <p className="text-zinc-400 font-space-mono text-xs font-semibold text-white mb-1">Как открыть терминал в папке с файлом (Windows):</p>
                          <ol className="text-zinc-400 font-space-mono text-xs space-y-1 ml-2 list-decimal list-inside">
                            <li>Откройте папку <span className="text-white">Загрузки</span> в Проводнике (где лежит bot.py)</li>
                            <li>Зажмите <span className="text-white">Shift</span> и кликните <span className="text-white">правой кнопкой мыши</span> на пустом месте в папке</li>
                            <li>Выберите <span className="text-green-400">«Открыть окно PowerShell здесь»</span> (или «Открыть в терминале»)</li>
                            <li>В открывшемся окне вставьте команду и нажмите <span className="text-white">Enter</span>:</li>
                          </ol>
                          <pre className="bg-black rounded p-2 text-xs text-green-400 font-space-mono border border-zinc-800 overflow-x-auto whitespace-pre-wrap break-all">{`pip install requests ccxt`}</pre>
                          <p className="text-zinc-500 font-space-mono text-xs">Увидите <span className="text-green-400">Successfully installed</span> — готово, переходите к шагу 4.</p>
                          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded p-2">
                            <p className="text-yellow-400/80 font-space-mono text-xs">Видите сообщение <span className="text-white">«new version of pip available»</span>? Это не ошибка — просто pip предлагает обновить себя. Можно проигнорировать и идти дальше.</p>
                          </div>
                        </div>

                        <div className="rounded-lg border border-zinc-700 bg-zinc-800/40 p-3 space-y-2">
                          <p className="text-red-400 font-orbitron text-xs font-semibold">Шаг 4 — Получите API-ключи биржи</p>
                          <p className="text-zinc-400 font-space-mono text-xs">Зайдите в личный кабинет вашей биржи (Binance, Bybit и др.) → раздел <span className="text-white">API Management</span> → создайте ключ с правами на торговлю. Скопируйте <span className="text-red-400">API Key</span> и <span className="text-red-400">Secret Key</span>.</p>
                        </div>

                        <div className="rounded-lg border border-zinc-700 bg-zinc-800/40 p-3 space-y-2">
                          <p className="text-red-400 font-orbitron text-xs font-semibold">Шаг 5 — Запустите бота</p>
                          <p className="text-zinc-400 font-space-mono text-xs mb-1">Передайте ключи через переменные окружения:</p>
                          <pre className="bg-black rounded p-2 text-xs text-green-400 font-space-mono border border-zinc-800 overflow-x-auto whitespace-pre-wrap break-all">{`# Windows (PowerShell)
$env:API_KEY="ваш_api_key"
$env:API_SECRET="ваш_secret"
python bot.py

# Mac / Linux
API_KEY="ваш_api_key" API_SECRET="ваш_secret" python bot.py`}</pre>
                        </div>

                        {/* Errors */}
                        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 space-y-2">
                          <p className="text-red-400 font-orbitron text-xs font-semibold">❓ Бот выдал ошибку — что делать</p>
                          <div className="space-y-2">
                            <div className="bg-black/40 rounded p-2">
                              <p className="text-zinc-300 font-space-mono text-xs font-semibold mb-0.5">«python не является внутренней командой»</p>
                              <p className="text-zinc-500 font-space-mono text-xs">Python не установлен или не добавлен в PATH. Переустановите с <a href="https://python.org/downloads" target="_blank" rel="noreferrer" className="text-blue-400 underline">python.org</a> и отметьте <span className="text-white">«Add to PATH»</span>.</p>
                            </div>
                            <div className="bg-black/40 rounded p-2">
                              <p className="text-zinc-300 font-space-mono text-xs font-semibold mb-0.5">«No module named 'ccxt'» или «No module named 'requests'»</p>
                              <p className="text-zinc-500 font-space-mono text-xs">Зависимости не установились. Вернитесь к шагу 3 и выполните <span className="text-green-400">pip install requests ccxt</span> заново.</p>
                            </div>
                            <div className="bg-black/40 rounded p-2">
                              <p className="text-zinc-300 font-space-mono text-xs font-semibold mb-0.5">«Invalid API key» или «AuthenticationError»</p>
                              <p className="text-zinc-500 font-space-mono text-xs">API-ключ скопирован неверно или у него нет прав на торговлю. Проверьте ключ в личном кабинете биржи и убедитесь что включены права <span className="text-white">Spot Trading</span>.</p>
                            </div>
                            <div className="bg-black/40 rounded p-2">
                              <p className="text-zinc-300 font-space-mono text-xs font-semibold mb-0.5">Терминал сразу закрылся</p>
                              <p className="text-zinc-500 font-space-mono text-xs">Запустите через PowerShell (не двойным кликом по файлу) — так увидите текст ошибки.</p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg border border-zinc-700 bg-zinc-800/40 p-3 space-y-1">
                          <p className="text-red-400 font-orbitron text-xs font-semibold">Шаг 6 — Сначала тестовая сеть</p>
                          <p className="text-zinc-400 font-space-mono text-xs">Большинство бирж предоставляют <span className="text-white">Testnet / Paper Trading</span> — используйте его минимум 1–2 дня. Убедитесь что стратегия работает корректно до пополнения реального счёта.</p>
                        </div>

                        <div className="flex gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                          <span className="text-yellow-400 text-base shrink-0">⚠️</span>
                          <p className="text-yellow-400/80 font-space-mono text-xs">Никогда не храните API-ключи в коде. Не давайте ключам права на вывод средств — только торговля. Начинайте с минимального депозита.</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  )
}