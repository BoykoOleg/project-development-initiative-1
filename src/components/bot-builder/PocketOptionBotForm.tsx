import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import Icon from "@/components/ui/icon"
import {
  POBotConfig,
  POStrategy,
  POExpiry,
  POComboLogic,
  PO_STRATEGIES,
  PO_ASSETS,
  PO_EXPIRY_LABELS,
} from "./PocketOptionBotTypes"

interface Props {
  config: POBotConfig
  onChange: (config: POBotConfig) => void
  onGenerate: () => void
}

const RISK_COLORS: Record<string, string> = {
  "Низкий": "bg-green-500/20 text-green-400 border-green-500/30",
  "Средний": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Высокий": "bg-red-500/20 text-red-400 border-red-500/30",
}

function StrategyCard({
  stratKey,
  active,
  selectable,
  onClick,
  showDetail,
  onToggleDetail,
}: {
  stratKey: POStrategy
  active: boolean
  selectable?: boolean
  onClick: () => void
  showDetail: boolean
  onToggleDetail: () => void
}) {
  const s = PO_STRATEGIES[stratKey]
  return (
    <div className={`rounded-xl border transition-all duration-150 overflow-hidden
      ${active ? "border-red-500/60 bg-red-500/10" : "border-zinc-700 bg-zinc-800/40"}`}
    >
      {/* Header row */}
      <div
        className="flex items-start gap-3 p-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={onClick}
      >
        <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 border-2 ${
          active
            ? selectable ? "border-red-400 bg-red-400" : "border-red-400 bg-red-400"
            : "border-zinc-500"
        }`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base">{s.icon}</span>
            <span className={`font-orbitron text-sm font-semibold ${active ? "text-white" : "text-zinc-300"}`}>
              {s.label}
            </span>
            <Badge className={`text-xs ${RISK_COLORS[s.risk]}`}>{s.risk} риск</Badge>
          </div>
          <p className="text-zinc-500 text-xs mt-0.5 leading-snug">{s.description}</p>
          <div className="flex gap-3 mt-1.5 text-xs font-space-mono">
            <span className="text-zinc-600">WR: <span className="text-zinc-400">{s.winrateEst}</span></span>
            <span className="text-zinc-600">Сигналов: <span className="text-zinc-400">{s.signalsPerDay}/д</span></span>
            <span className="text-zinc-600">Экспир: <span className="text-zinc-400">{s.bestExpiry}</span></span>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleDetail() }}
          className="text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0 mt-0.5"
          title="Характеристики"
        >
          <Icon name={showDetail ? "ChevronUp" : "ChevronDown"} size={14} />
        </button>
      </div>

      {/* Detail panel */}
      {showDetail && (
        <div className="border-t border-zinc-700/60 px-4 py-3 space-y-3 bg-zinc-900/60">
          <div className="grid grid-cols-2 gap-2 text-xs font-space-mono">
            <div className="bg-zinc-800 rounded-lg p-2">
              <p className="text-zinc-500 mb-0.5">Лучшие активы</p>
              <p className="text-zinc-200 leading-snug">{s.bestAssets}</p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-2">
              <p className="text-zinc-500 mb-0.5">Экспирация</p>
              <p className="text-zinc-200">{s.bestExpiry}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-space-mono">
            <div>
              <p className="text-green-400 mb-1 font-semibold">✓ Плюсы</p>
              <ul className="space-y-0.5">
                {s.pros.map((p, i) => <li key={i} className="text-zinc-400">• {p}</li>)}
              </ul>
            </div>
            <div>
              <p className="text-red-400 mb-1 font-semibold">✗ Минусы</p>
              <ul className="space-y-0.5">
                {s.cons.map((c, i) => <li key={i} className="text-zinc-400">• {c}</li>)}
              </ul>
            </div>
          </div>
          {s.combosWith.length > 0 && (
            <div className="text-xs font-space-mono">
              <p className="text-zinc-500 mb-1">Лучшие комбо:</p>
              <div className="flex flex-wrap gap-1">
                {s.combosWith.map((cs) => (
                  <span key={cs} className="bg-zinc-800 border border-zinc-700 text-zinc-300 px-2 py-0.5 rounded-full">
                    {PO_STRATEGIES[cs].icon} {PO_STRATEGIES[cs].label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ===== AI Comment component =====
type CommentLevel = "good" | "warn" | "danger" | "info"
function AIComment({ level, text }: { level: CommentLevel; text: string }) {
  const styles: Record<CommentLevel, string> = {
    good:   "bg-green-500/10 border-green-500/25 text-green-400",
    warn:   "bg-yellow-500/10 border-yellow-500/25 text-yellow-400",
    danger: "bg-red-500/10 border-red-500/25 text-red-400",
    info:   "bg-blue-500/10 border-blue-500/25 text-blue-400",
  }
  const icons: Record<CommentLevel, string> = {
    good: "✅", warn: "⚠️", danger: "🚨", info: "💡",
  }
  return (
    <div className={`flex gap-2 px-3 py-2 rounded-lg border text-xs font-space-mono leading-relaxed ${styles[level]}`}>
      <span className="flex-shrink-0 mt-0.5">{icons[level]}</span>
      <span>{text}</span>
    </div>
  )
}

// ===== Asset/Expiry comment =====
function assetExpiryComment(asset: string, expiry: POExpiry, strategy: POStrategy, comboMode: boolean, comboStrategies: POStrategy[]): { level: CommentLevel; text: string } | null {
  const strats = comboMode ? comboStrategies : [strategy]
  const isOTC = asset.includes("OTC")
  const expNum = Number(expiry)
  const hasCandle = strats.includes("candle_pattern")
  const hasSR = strats.includes("support_resistance")
  const hasEMA = strats.includes("ema_cross")
  const hasRSI = strats.includes("rsi_reversal")

  if (expNum === 1 && (hasCandle || hasSR)) {
    return { level: "warn", text: "Паттерны свечей и уровни плохо работают на экспирации 1 мин — слишком мало данных для формирования сигнала. Рекомендуем 5–15 мин." }
  }
  if (expNum >= 5 && strats.includes("martingale") && !comboMode) {
    return { level: "warn", text: "Мартингейл на 5+ минутах означает долгое ожидание результата каждой сделки. Депозит рискует не выдержать серию убытков." }
  }
  if (!isOTC && expNum <= 2) {
    return { level: "warn", text: "На реальных парах (не OTC) короткая экспирация 1–2 мин сильно зависит от спреда и волатильности. OTC-активы стабильнее для скальпинга." }
  }
  if (isOTC && (hasEMA || hasRSI) && expNum <= 3) {
    return { level: "good", text: "Отличный выбор! OTC-активы со стратегиями RSI/EMA на 1–3 минуты — классическое сочетание для Pocket Option." }
  }
  if (hasCandle && hasSR && expNum >= 5) {
    return { level: "good", text: "Паттерны свечей + уровни на 5–15 мин — высокоточное сочетание. Сигналов будет мало, но каждый — взвешенный вход." }
  }
  if (asset.includes("Gold") && expNum >= 5) {
    return { level: "info", text: "Gold OTC хорошо реагирует на уровни поддержки/сопротивления. Если не выбрана эта стратегия — добавьте для повышения точности." }
  }
  return null
}

// ===== Bet comment =====
function betComment(cfg: POBotConfig): { level: CommentLevel; text: string } | null {
  const { betAmount, betPercent, takeProfitRub, stopLossRub, dailyLimit, martingaleEnabled, martingaleMultiplier, martingaleSteps } = cfg

  if (betPercent && betAmount > 10) {
    return { level: "danger", text: `${betAmount}% от баланса — очень агрессивно. Рекомендуем не более 2–5% на сделку. При серии убытков депозит быстро сгорит.` }
  }
  if (betPercent && betAmount <= 2) {
    return { level: "good", text: `${betAmount}% от баланса — консервативный размер. Хороший выбор для долгосрочной торговли.` }
  }
  if (!betPercent && takeProfitRub < betAmount * 3) {
    return { level: "warn", text: `TP = ${takeProfitRub}₽ при ставке ${betAmount}₽ — соотношение низкое. Рекомендуем TP не менее чем в 3–5 раз выше ставки.` }
  }
  if (stopLossRub < betAmount * 2) {
    return { level: "warn", text: `Stop Loss ${stopLossRub}₽ покроет менее 2 проигрышных сделок подряд при ставке ${betAmount}₽. Увеличьте SL или снизьте ставку.` }
  }
  if (martingaleEnabled) {
    const maxBet = betAmount * Math.pow(martingaleMultiplier, martingaleSteps - 1)
    if (maxBet > stopLossRub * 0.6) {
      return { level: "danger", text: `При мартингейле ×${martingaleMultiplier} за ${martingaleSteps} шагов максимальная ставка достигнет $${maxBet.toFixed(0)}, что превышает 60% вашего SL. Это критично.` }
    }
    return { level: "warn", text: `С мартингейлом максимальная ставка на шаге ${martingaleSteps}: $${maxBet.toFixed(0)}. Убедитесь, что депозит покрывает полную серию.` }
  }
  if (dailyLimit > 30 && !betPercent) {
    return { level: "warn", text: `${dailyLimit} сделок/день при фиксированной ставке — высокая нагрузка на депозит. Рекомендуем лимит 10–20 сделок.` }
  }
  if (takeProfitRub >= betAmount * 5 && stopLossRub <= betAmount * 3) {
    return { level: "good", text: "Хорошее соотношение риск/доходность. TP значительно превышает SL." }
  }
  return null
}

// ===== Indicator comments — always return at least one comment =====
function rsiComment(cfg: POBotConfig): { level: CommentLevel; text: string } {
  const { rsiPeriod, rsiOverbought, rsiOversold, expiry } = cfg
  const expNum = Number(expiry)
  const gap = rsiOverbought - rsiOversold

  if (rsiOverbought <= rsiOversold) {
    return { level: "danger", text: `Уровень перекупленности (${rsiOverbought}) должен быть выше перепроданности (${rsiOversold}). Исправьте значения.` }
  }
  if (gap < 30) {
    return { level: "danger", text: `Зона нейтральности RSI (${rsiOversold}–${rsiOverbought}) слишком узкая — будет много ложных сигналов. Стандарт: 30/70 или жёстче 20/80.` }
  }
  if (rsiPeriod < 9 && expNum <= 2) {
    return { level: "warn", text: `RSI(${rsiPeriod}) на ${expiry} мин очень чувствителен к шуму рынка. Попробуйте период 9–14 для более чистых сигналов.` }
  }
  if (rsiPeriod >= 14 && expNum <= 2) {
    return { level: "info", text: `RSI(${rsiPeriod}) на экспирации ${expiry} мин немного запаздывает. Период 7–9 даст более быстрые сигналы для скальпинга.` }
  }
  if (rsiPeriod >= 14 && expNum >= 5) {
    return { level: "good", text: `RSI(${rsiPeriod}) хорошо подходит для экспирации ${expiry} мин — достаточно данных для чёткого сигнала.` }
  }
  if (gap >= 50) {
    return { level: "info", text: `RSI ${rsiOversold}/${rsiOverbought} — жёсткие уровни. Сигналов будет мало, но каждый — при экстремальном состоянии рынка.` }
  }
  if (rsiOverbought === 70 && rsiOversold === 30) {
    return { level: "good", text: `RSI(${rsiPeriod}) со стандартными уровнями 30/70 — надёжный классический вариант для OTC-рынка.` }
  }
  return { level: "good", text: `RSI(${rsiPeriod}): уровни ${rsiOversold}/${rsiOverbought}, зона нейтральности ${gap} пп — параметры в норме.` }
}

function emaComment(cfg: POBotConfig): { level: CommentLevel; text: string } {
  const { emaFast, emaSlow, expiry } = cfg
  const expNum = Number(expiry)
  const diff = emaSlow - emaFast

  if (emaFast >= emaSlow) {
    return { level: "danger", text: `Быстрая EMA(${emaFast}) ≥ медленной EMA(${emaSlow}) — это ошибка конфигурации. Быстрая EMA всегда должна быть меньше медленной.` }
  }
  if (diff < 5) {
    return { level: "danger", text: `Разница между EMA(${emaFast}) и EMA(${emaSlow}) всего ${diff} — сигналы будут слишком частыми и ложными. Рекомендуем разницу минимум 8–12.` }
  }
  if (diff < 8) {
    return { level: "warn", text: `Разница EMA(${emaFast})/EMA(${emaSlow}) = ${diff} — немного мала. Рекомендуем увеличить до 9/21 или 5/20 для снижения ложных пересечений.` }
  }
  if (emaFast <= 5 && expNum >= 5) {
    return { level: "warn", text: `EMA(${emaFast}) очень быстрая для экспирации ${expiry} мин — будет давать преждевременные сигналы. Попробуйте EMA 9–12.` }
  }
  if (emaFast === 9 && emaSlow === 21) {
    return { level: "good", text: `EMA 9/21 — классическое проверенное сочетание для бинарных опционов. Отличный выбор для экспирации ${expiry} мин.` }
  }
  if (emaFast === 5 && emaSlow === 20) {
    return { level: "good", text: `EMA 5/20 — агрессивное сочетание для коротких таймфреймов. Хорошо подходит для экспирации 1–2 мин.` }
  }
  if (emaFast === 12 && emaSlow === 26) {
    return { level: "good", text: `EMA 12/26 — основа классического MACD. Надёжно для экспирации 5–15 мин.` }
  }
  if (expNum <= 2 && emaFast >= 12) {
    return { level: "warn", text: `EMA(${emaFast}) медленновата для экспирации ${expiry} мин — сигналы будут запаздывать. Попробуйте EMA 5–9.` }
  }
  return { level: "good", text: `EMA(${emaFast})/EMA(${emaSlow}): разница ${diff} пп, параметры корректны для экспирации ${expiry} мин.` }
}

// ===== Indicator comment =====
function indicatorComment(cfg: POBotConfig): { level: CommentLevel; text: string } | null {
  // kept for backwards compat — not used directly anymore
  return null
}

export default function PocketOptionBotForm({ config, onChange, onGenerate }: Props) {
  const set = (patch: Partial<POBotConfig>) => onChange({ ...config, ...patch })
  const [detailOpen, setDetailOpen] = useState<Record<string, boolean>>({})

  const toggleDetail = (key: string) =>
    setDetailOpen((prev) => ({ ...prev, [key]: !prev[key] }))

  const toggleComboStrategy = (key: POStrategy) => {
    const cur = config.comboStrategies
    if (cur.includes(key)) {
      if (cur.length <= 2) return // min 2
      set({ comboStrategies: cur.filter((s) => s !== key) })
    } else {
      if (cur.length >= 4) return // max 4
      set({ comboStrategies: [...cur, key] })
    }
  }

  const strategies = Object.keys(PO_STRATEGIES) as POStrategy[]

  const PRESETS: {
    id: string
    name: string
    emoji: string
    desc: string
    tag: string
    tagColor: string
    strategies: POStrategy[]
    logic: POComboLogic
    expiry: POExpiry
    tip: string
  }[] = [
    {
      id: "flat_filter",
      name: "Флет-фильтр",
      emoji: "🎯",
      desc: "RSI + EMA — двойное подтверждение для торговли в боковике",
      tag: "Новичкам",
      tagColor: "bg-green-500/20 text-green-400 border-green-500/30",
      strategies: ["rsi_reversal", "ema_cross"],
      logic: "AND",
      expiry: "3",
      tip: "Лучше работает на EUR/USD OTC и GBP/USD OTC в спокойный рынок",
    },
    {
      id: "reversal_pro",
      name: "Разворот Про",
      emoji: "🔄",
      desc: "Паттерны свечей + Уровни + RSI — три подтверждения разворота",
      tag: "Опытным",
      tagColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      strategies: ["candle_pattern", "support_resistance", "rsi_reversal"],
      logic: "AND",
      expiry: "5",
      tip: "Мало сигналов, но очень высокая точность. Подходит для Gold OTC",
    },
    {
      id: "trend_catch",
      name: "Ловец тренда",
      emoji: "🏄",
      desc: "EMA + Поддержка/Сопротивление — вход по тренду с подтверждением уровня",
      tag: "Универсальный",
      tagColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      strategies: ["ema_cross", "support_resistance"],
      logic: "AND",
      expiry: "5",
      tip: "Отлично работает на USD/JPY OTC при выраженном тренде",
    },
    {
      id: "signal_hunter",
      name: "Охотник за сигналами",
      emoji: "⚡",
      desc: "RSI + EMA + Паттерны — широкий охват, сигнал при любом совпадении",
      tag: "Активный",
      tagColor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      strategies: ["rsi_reversal", "ema_cross", "candle_pattern"],
      logic: "OR",
      expiry: "1",
      tip: "Много сигналов для активной торговли. Рекомендуем строгий Stop Loss",
    },
    {
      id: "precision",
      name: "Снайпер",
      emoji: "🎯",
      desc: "Все 4 стратегии AND — максимальная фильтрация, только лучшие входы",
      tag: "Высший класс",
      tagColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      strategies: ["rsi_reversal", "ema_cross", "candle_pattern", "support_resistance"],
      logic: "AND",
      expiry: "5",
      tip: "1–3 сигнала в день. Каждый вход максимально взвешен",
    },
  ]

  const applyPreset = (preset: typeof PRESETS[number]) => {
    onChange({
      ...config,
      comboMode: true,
      comboStrategies: preset.strategies,
      comboLogic: preset.logic,
      expiry: preset.expiry,
    })
  }

  return (
    <div className="space-y-5">

      {/* Mode toggle */}
      <div className="flex gap-2 bg-zinc-800 border border-zinc-700 rounded-xl p-1">
        <button
          onClick={() => set({ comboMode: false })}
          className={`flex-1 py-2 px-3 rounded-lg font-orbitron text-xs font-bold transition-all duration-150
            ${!config.comboMode ? "bg-red-600 text-white shadow shadow-red-500/20" : "text-zinc-400 hover:text-zinc-200"}`}
        >
          Одна стратегия
        </button>
        <button
          onClick={() => set({ comboMode: true })}
          className={`flex-1 py-2 px-3 rounded-lg font-orbitron text-xs font-bold transition-all duration-150
            ${config.comboMode ? "bg-red-600 text-white shadow shadow-red-500/20" : "text-zinc-400 hover:text-zinc-200"}`}
        >
          🔀 Комбо
        </button>
      </div>

      {/* Strategy selection */}
      {!config.comboMode ? (
        <Card className="bg-zinc-900 border-red-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="font-orbitron text-white text-base">Стратегия</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {strategies.map((key) => (
              <StrategyCard
                key={key}
                stratKey={key}
                active={config.strategy === key}
                onClick={() => set({ strategy: key })}
                showDetail={!!detailOpen[key]}
                onToggleDetail={() => toggleDetail(key)}
              />
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-zinc-900 border-red-500/20">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="font-orbitron text-white text-base">Комбо-стратегии</CardTitle>
                <p className="text-zinc-500 font-space-mono text-xs mt-0.5">
                  Выберите 2–4 стратегии ({config.comboStrategies.length} выбрано)
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Combo logic */}
            <div className="grid grid-cols-2 gap-2 mb-1">
              {(["AND", "OR"] as POComboLogic[]).map((logic) => (
                <button
                  key={logic}
                  onClick={() => set({ comboLogic: logic })}
                  className={`py-2.5 px-3 rounded-xl border font-orbitron text-xs font-bold transition-all text-left
                    ${config.comboLogic === logic
                      ? "bg-red-500/20 border-red-500/50 text-red-400"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                    }`}
                >
                  <div className="font-bold mb-0.5">{logic}</div>
                  <div className="text-zinc-500 font-space-mono text-xs font-normal">
                    {logic === "AND" ? "Все совпадают → сигнал" : "Хотя бы одна → сигнал"}
                  </div>
                </button>
              ))}
            </div>

            {config.comboLogic === "AND" && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 text-xs font-space-mono text-blue-400">
                🔒 AND — строгий фильтр: меньше сигналов, но выше качество
              </div>
            )}
            {config.comboLogic === "OR" && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 text-xs font-space-mono text-yellow-400">
                ⚡ OR — мягкий фильтр: больше сигналов, выше активность
              </div>
            )}

            {/* Presets */}
            <div>
              <p className="text-zinc-500 font-space-mono text-xs mb-2">⚡ Быстрые пресеты</p>
              <div className="space-y-2">
                {PRESETS.map((preset) => {
                  const isActive =
                    preset.strategies.length === config.comboStrategies.length &&
                    preset.strategies.every((s) => config.comboStrategies.includes(s)) &&
                    preset.logic === config.comboLogic
                  return (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset)}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-150
                        ${isActive
                          ? "border-red-500/60 bg-red-500/10"
                          : "border-zinc-700 bg-zinc-800/40 hover:border-zinc-500 hover:bg-zinc-800/70"
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0 mt-0.5">{preset.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`font-orbitron text-sm font-semibold ${isActive ? "text-white" : "text-zinc-200"}`}>
                              {preset.name}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-space-mono ${preset.tagColor}`}>
                              {preset.tag}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded font-space-mono border
                              ${preset.logic === "AND" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"}`}>
                              {preset.logic}
                            </span>
                          </div>
                          <p className="text-zinc-400 font-space-mono text-xs leading-snug mb-1.5">{preset.desc}</p>
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {preset.strategies.map((s) => (
                              <span key={s} className="bg-zinc-700/60 text-zinc-300 text-xs font-space-mono px-1.5 py-0.5 rounded">
                                {PO_STRATEGIES[s].icon} {PO_STRATEGIES[s].label}
                              </span>
                            ))}
                            <span className="text-zinc-600 text-xs font-space-mono px-1.5 py-0.5">· {preset.expiry} мин</span>
                          </div>
                          {isActive && (
                            <p className="text-zinc-500 font-space-mono text-xs italic">💡 {preset.tip}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="border-t border-zinc-800 mt-3 pt-3">
                <p className="text-zinc-500 font-space-mono text-xs mb-2">Или настройте вручную:</p>
              </div>
            </div>

            {/* Strategy cards with checkboxes */}
            <div className="space-y-2">
              {strategies.filter((k) => k !== "martingale").map((key) => {
                const isActive = config.comboStrategies.includes(key)
                return (
                  <StrategyCard
                    key={key}
                    stratKey={key}
                    active={isActive}
                    selectable
                    onClick={() => toggleComboStrategy(key)}
                    showDetail={!!detailOpen["combo_" + key]}
                    onToggleDetail={() => toggleDetail("combo_" + key)}
                  />
                )
              })}
            </div>

            {config.comboStrategies.length >= 2 && (() => {
              const active = config.comboStrategies.filter(s => s !== "martingale")
              // Parse "10–25" → [10, 25]
              const ranges = active.map(s => {
                const parts = PO_STRATEGIES[s].signalsPerDay.replace("–", "-").split("-").map(Number)
                return { min: parts[0], max: parts[parts.length - 1] }
              })
              const risks = active.map(s => PO_STRATEGIES[s].risk)
              const hasHigh = risks.includes("Высокий")
              const hasMed  = risks.includes("Средний")

              let sigMin: number, sigMax: number, qualityText: string, qualityColor: string, falseRisk: string, falseColor: string

              if (config.comboLogic === "AND") {
                // AND → bottleneck (минимальные сигналы из всех стратегий)
                sigMin = Math.max(1, Math.min(...ranges.map(r => r.min)))
                sigMax = Math.max(2, Math.min(...ranges.map(r => r.max)))
                qualityText = active.length >= 3 ? "Очень высокое (все 3+ совпадают)" : "Высокое (оба подтверждают)"
                qualityColor = "text-green-400"
                falseRisk = active.length >= 3 ? "Очень низкий" : "Низкий"
                falseColor = "text-green-400"
              } else {
                // OR → сумма, но перекрытие ~30%
                sigMin = Math.round(ranges.reduce((a, r) => a + r.min, 0) * 0.7)
                sigMax = Math.round(ranges.reduce((a, r) => a + r.max, 0) * 0.7)
                qualityText = active.length >= 3 ? "Среднее (большинство голосов)" : "Среднее (хватает одного)"
                qualityColor = "text-yellow-400"
                falseRisk = hasHigh ? "Высокий" : hasMed ? "Средний" : "Низкий"
                falseColor = hasHigh ? "text-red-400" : hasMed ? "text-yellow-400" : "text-green-400"
              }

              const winrateMin = Math.round(active.reduce((a, s) => a + parseInt(PO_STRATEGIES[s].winrateEst), 0) / active.length)
              const winrateBonus = config.comboLogic === "AND" ? Math.min(8, active.length * 3) : 0
              const estWinrate = `${winrateMin + winrateBonus}–${winrateMin + winrateBonus + 8}%`

              return (
                <div className="bg-zinc-800 rounded-xl px-4 py-3 text-xs font-space-mono space-y-1.5">
                  <p className="text-zinc-300 font-semibold mb-2">📊 Оценка текущего комбо ({active.length} стратегии, {config.comboLogic}):</p>
                  <p className="text-zinc-500">• Стратегии: <span className="text-zinc-300">{active.map(s => PO_STRATEGIES[s].label).join(", ")}</span></p>
                  <p className="text-zinc-500">• Сигналов/день: <span className="text-white">~{sigMin}–{sigMax}</span></p>
                  <p className="text-zinc-500">• Расчётный winrate: <span className={config.comboLogic === "AND" ? "text-green-400" : "text-yellow-400"}>{estWinrate}</span></p>
                  <p className="text-zinc-500">• Качество сигналов: <span className={qualityColor}>{qualityText}</span></p>
                  <p className="text-zinc-500">• Риск ложных входов: <span className={falseColor}>{falseRisk}</span></p>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {/* Asset & Expiry */}
      <Card className="bg-zinc-900 border-red-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-orbitron text-white text-base">Актив и экспирация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-zinc-400 font-space-mono text-xs mb-1.5 block">Торговый актив</Label>
            <Select value={config.asset} onValueChange={(v) => set({ asset: v })}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white font-space-mono text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 max-h-64">
                {PO_ASSETS.map((a) => (
                  <SelectItem key={a} value={a} className="text-white font-space-mono text-xs hover:bg-zinc-700">
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-zinc-400 font-space-mono text-xs mb-1.5 block">Экспирация опциона</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {(["1", "2", "3", "5", "15"] as POExpiry[]).map((exp) => (
                <button
                  key={exp}
                  onClick={() => set({ expiry: exp })}
                  className={`py-2 rounded-lg text-xs font-orbitron font-bold border transition-all
                    ${config.expiry === exp
                      ? "bg-red-500 border-red-500 text-white"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                    }`}
                >
                  {exp}м
                </button>
              ))}
            </div>
            <p className="text-zinc-600 text-xs font-space-mono mt-1">{PO_EXPIRY_LABELS[config.expiry]}</p>
          </div>
          {(() => {
            const c = assetExpiryComment(config.asset, config.expiry, config.strategy, config.comboMode, config.comboStrategies)
            return c ? <AIComment level={c.level} text={c.text} /> : null
          })()}
        </CardContent>
      </Card>

      {/* Bet */}
      <Card className="bg-zinc-900 border-red-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-orbitron text-white text-base">Управление ставкой</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-zinc-300 text-sm">Ставка в % от баланса</Label>
              <p className="text-zinc-500 text-xs font-space-mono">Иначе — фиксированная сумма в USD</p>
            </div>
            <Switch checked={config.betPercent} onCheckedChange={(v) => set({ betPercent: v })} />
          </div>

          <div>
            <Label className="text-zinc-400 font-space-mono text-xs mb-1.5 block">
              {config.betPercent ? "Ставка (% от баланса)" : "Ставка (₽)"}
            </Label>
            <div className="flex items-center gap-3">
              <Slider
                min={config.betPercent ? 1 : 50} max={config.betPercent ? 50 : 10000} step={config.betPercent ? 1 : 50}
                value={[config.betAmount]}
                onValueChange={([v]) => set({ betAmount: v })}
                className="flex-1"
              />
              <span className="text-red-400 font-orbitron font-bold text-sm w-16 text-right">
                {config.betAmount}{config.betPercent ? "%" : "₽"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-zinc-400 font-space-mono text-xs mb-1.5 block">Take Profit (₽)</Label>
              <Input type="number" value={config.takeProfitRub} onChange={(e) => set({ takeProfitRub: Number(e.target.value) })} className="bg-zinc-800 border-zinc-700 text-green-400 font-space-mono text-sm" />
            </div>
            <div>
              <Label className="text-zinc-400 font-space-mono text-xs mb-1.5 block">Stop Loss (₽)</Label>
              <Input type="number" value={config.stopLossRub} onChange={(e) => set({ stopLossRub: Number(e.target.value) })} className="bg-zinc-800 border-zinc-700 text-red-400 font-space-mono text-sm" />
            </div>
          </div>

          <div>
            <Label className="text-zinc-400 font-space-mono text-xs mb-1.5 block">Макс. сделок в день: {config.dailyLimit}</Label>
            <Slider min={1} max={100} step={1} value={[config.dailyLimit]} onValueChange={([v]) => set({ dailyLimit: v })} />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <Label className="text-zinc-300 text-sm">Режим счёта</Label>
              <p className="text-zinc-500 text-xs font-space-mono">Демо или реальный счёт</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-space-mono ${config.isDemo ? "text-green-400" : "text-zinc-500"}`}>Демо</span>
              <Switch checked={!config.isDemo} onCheckedChange={(v) => set({ isDemo: !v })} />
              <span className={`text-xs font-space-mono ${!config.isDemo ? "text-red-400" : "text-zinc-500"}`}>Реальный</span>
            </div>
          </div>
          {!config.isDemo && (
            <div className="flex items-center gap-2 bg-red-950/40 border border-red-500/30 rounded-lg px-3 py-2">
              <span className="text-red-400 text-xs font-space-mono">Реальный счёт — бот будет торговать настоящими деньгами!</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <div>
              <Label className="text-zinc-300 text-sm">Авто-перезапуск</Label>
              <p className="text-zinc-500 text-xs font-space-mono">Продолжать после TP/SL</p>
            </div>
            <Switch checked={config.autoRestart} onCheckedChange={(v) => set({ autoRestart: v })} />
          </div>
          {(() => {
            const c = betComment(config)
            return c ? <AIComment level={c.level} text={c.text} /> : null
          })()}
        </CardContent>
      </Card>

      {/* Martingale */}
      <Card className={`border transition-all duration-200 ${config.martingaleEnabled ? "bg-red-950/30 border-red-500/40" : "bg-zinc-900 border-zinc-700"}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-orbitron text-white text-base">
              Мартингейл
              {config.martingaleEnabled && <Badge className="ml-2 bg-red-500/20 text-red-400 border-red-500/30 text-xs">Включён</Badge>}
            </CardTitle>
            <Switch checked={config.martingaleEnabled} onCheckedChange={(v) => set({ martingaleEnabled: v })} />
          </div>
        </CardHeader>
        {config.martingaleEnabled && (
          <CardContent className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-xs font-space-mono leading-relaxed">
                ⚠️ Мартингейл увеличивает ставку после каждого проигрыша. Высокий риск потери депозита при серии убытков.
              </p>
            </div>
            <div>
              <Label className="text-zinc-400 font-space-mono text-xs mb-1.5 block">Множитель: ×{config.martingaleMultiplier}</Label>
              <Slider min={1.5} max={4} step={0.1} value={[config.martingaleMultiplier]} onValueChange={([v]) => set({ martingaleMultiplier: Math.round(v * 10) / 10 })} />
              <div className="flex justify-between text-zinc-600 text-xs font-space-mono mt-1">
                <span>×1.5 (консерв.)</span><span>×4.0 (агресс.)</span>
              </div>
            </div>
            <div>
              <Label className="text-zinc-400 font-space-mono text-xs mb-1.5 block">Макс. шагов: {config.martingaleSteps}</Label>
              <Slider min={1} max={7} step={1} value={[config.martingaleSteps]} onValueChange={([v]) => set({ martingaleSteps: v })} />
            </div>
            <div className="bg-zinc-800 rounded-lg p-3 font-space-mono text-xs space-y-1">
              <p className="text-zinc-400">Пример с базовой ставкой {config.betAmount}₽:</p>
              {Array.from({ length: config.martingaleSteps }, (_, i) => {
                const bet = (config.betAmount * Math.pow(config.martingaleMultiplier, i)).toFixed(2)
                return (
                  <p key={i} className={i === 0 ? "text-green-400" : i < 3 ? "text-yellow-400" : "text-red-400"}>
                    Шаг {i + 1}: {bet}₽
                  </p>
                )
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* RSI settings */}
      {!config.comboMode && config.strategy === "rsi_reversal" && (
        <Card className="bg-zinc-900 border-blue-500/20">
          <CardHeader className="pb-3"><CardTitle className="font-orbitron text-white text-base">Настройки RSI</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-zinc-400 font-space-mono text-xs mb-1.5 block">Период RSI: {config.rsiPeriod}</Label>
              <Slider min={7} max={21} step={1} value={[config.rsiPeriod]} onValueChange={([v]) => set({ rsiPeriod: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-400 font-space-mono text-xs mb-1.5 block">Перекупленность</Label>
                <Input type="number" value={config.rsiOverbought} onChange={(e) => set({ rsiOverbought: Number(e.target.value) })} className="bg-zinc-800 border-zinc-700 text-red-400 font-space-mono text-sm" />
              </div>
              <div>
                <Label className="text-zinc-400 font-space-mono text-xs mb-1.5 block">Перепроданность</Label>
                <Input type="number" value={config.rsiOversold} onChange={(e) => set({ rsiOversold: Number(e.target.value) })} className="bg-zinc-800 border-zinc-700 text-green-400 font-space-mono text-sm" />
              </div>
            </div>
            <AIComment {...rsiComment(config)} />
          </CardContent>
        </Card>
      )}

      {/* EMA settings */}
      {!config.comboMode && config.strategy === "ema_cross" && (
        <Card className="bg-zinc-900 border-green-500/20">
          <CardHeader className="pb-3"><CardTitle className="font-orbitron text-white text-base">Настройки EMA</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-400 font-space-mono text-xs mb-1.5 block">Быстрая EMA</Label>
                <Input type="number" value={config.emaFast} onChange={(e) => set({ emaFast: Number(e.target.value) })} className="bg-zinc-800 border-zinc-700 text-green-400 font-space-mono text-sm" />
              </div>
              <div>
                <Label className="text-zinc-400 font-space-mono text-xs mb-1.5 block">Медленная EMA</Label>
                <Input type="number" value={config.emaSlow} onChange={(e) => set({ emaSlow: Number(e.target.value) })} className="bg-zinc-800 border-zinc-700 text-blue-400 font-space-mono text-sm" />
              </div>
            </div>
            <AIComment {...emaComment(config)} />
          </CardContent>
        </Card>
      )}

      {/* Combo RSI+EMA settings */}
      {config.comboMode && (config.comboStrategies.includes("rsi_reversal") || config.comboStrategies.includes("ema_cross")) && (
        <Card className="bg-zinc-900 border-zinc-700">
          <CardHeader className="pb-3"><CardTitle className="font-orbitron text-white text-base">Параметры индикаторов</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {config.comboStrategies.includes("rsi_reversal") && (
              <div className="space-y-2">
                <p className="text-blue-400 font-space-mono text-xs font-semibold">RSI</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-zinc-500 font-space-mono text-xs mb-1 block">Период</Label>
                    <Input type="number" value={config.rsiPeriod} onChange={(e) => set({ rsiPeriod: Number(e.target.value) })} className="bg-zinc-800 border-zinc-700 text-white font-space-mono text-xs h-8" />
                  </div>
                  <div>
                    <Label className="text-zinc-500 font-space-mono text-xs mb-1 block">Перекуп.</Label>
                    <Input type="number" value={config.rsiOverbought} onChange={(e) => set({ rsiOverbought: Number(e.target.value) })} className="bg-zinc-800 border-zinc-700 text-red-400 font-space-mono text-xs h-8" />
                  </div>
                  <div>
                    <Label className="text-zinc-500 font-space-mono text-xs mb-1 block">Перепрод.</Label>
                    <Input type="number" value={config.rsiOversold} onChange={(e) => set({ rsiOversold: Number(e.target.value) })} className="bg-zinc-800 border-zinc-700 text-green-400 font-space-mono text-xs h-8" />
                  </div>
                </div>
                <AIComment {...rsiComment(config)} />
              </div>
            )}
            {config.comboStrategies.includes("ema_cross") && (
              <div className="space-y-2">
                <p className="text-green-400 font-space-mono text-xs font-semibold">EMA</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-zinc-500 font-space-mono text-xs mb-1 block">Быстрая EMA</Label>
                    <Input type="number" value={config.emaFast} onChange={(e) => set({ emaFast: Number(e.target.value) })} className="bg-zinc-800 border-zinc-700 text-green-400 font-space-mono text-xs h-8" />
                  </div>
                  <div>
                    <Label className="text-zinc-500 font-space-mono text-xs mb-1 block">Медленная EMA</Label>
                    <Input type="number" value={config.emaSlow} onChange={(e) => set({ emaSlow: Number(e.target.value) })} className="bg-zinc-800 border-zinc-700 text-blue-400 font-space-mono text-xs h-8" />
                  </div>
                </div>
                <AIComment {...emaComment(config)} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Button
        onClick={onGenerate}
        className="w-full bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold py-4 text-base rounded-xl transition-all duration-200 shadow-lg shadow-red-500/20"
      >
        {config.comboMode ? `🔀 Сгенерировать комбо-бот (${config.comboLogic})` : "Сгенерировать код бота"}
      </Button>
    </div>
  )
}