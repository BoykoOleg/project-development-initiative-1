import type { PracticeStep } from "./practiceStepTypes"
import {
  SectionEmaTrend,
  SectionSupportResistance,
  SectionBtcPracticalExample,
} from "./practiceStepsMarketAnalysis/SectionEmaSignals"

export const stepMarketAnalysis: PracticeStep = {
  id: "market-analysis",
  badge: "Шаг 1",
  color: "blue",
  icon: "TrendingUp",
  title: "Анализ рынка: определяем тренд и уровни",
  summary: "Перед каждой сделкой нужно понять, куда движется рынок и где находятся ключевые уровни. Без этого — не анализ, а азартная игра.",
  relevance2026: {
    score: 92,
    label: "Фундамент остаётся",
    aiImpact: 68,
    botImpact: 52,
    aiNote: "ИИ-модели (GPT, Claude) анализируют тренды мгновенно, но EMA и уровни — по-прежнему основа большинства алгоритмических стратегий на крипторынке.",
    botNote: "Боты считывают тренд по EMA автоматически, но человек должен задать правильные параметры и таймфрейм — без понимания этого шага настройка бота невозможна.",
  },
  aibotInsight: {
    aiExamples: [
      {
        label: "GPT анализирует тренд",
        text: "Подключив TradingView через API к GPT-4o, можно описать картину словами: «BTC на M5 — EMA 20 выше EMA 50, последние 3 свечи бычьи» → ИИ подтверждает или опровергает сигнал на основе контекста новостей дня.",
      },
      {
        label: "ML-определение режима рынка",
        text: "Продвинутые ИИ-системы классифицируют рынок на режимы: «тренд / боковик / высокая волатильность». Это точнее одного EMA-пересечения и позволяет автоматически выбирать стратегию.",
      },
    ],
    botExamples: [
      {
        label: "EMA-кросс в коде бота",
        text: "Именно EMA(20)/EMA(50) — самый частый фильтр тренда в торговых ботах. Бот проверяет соотношение EMA перед каждым потенциальным входом. Это «шаг 1» любого алго-алгоритма.",
      },
      {
        label: "Мультитаймфреймовый анализ",
        text: "Профессиональный бот проверяет H4 для определения основного тренда, M15 — для точки входа. Если на H4 медвежий тренд, бот не открывает лонги на M5 даже при локальном сигнале.",
      },
    ],
    codeSnippet: {
      title: "Шаг 1 любого бота: определение тренда через EMA",
      code: `import pandas_ta as ta

def get_trend(df):
    df['ema20'] = ta.ema(df['close'], length=20)
    df['ema50'] = ta.ema(df['close'], length=50)

    last = df.iloc[-1]

    if last['ema20'] > last['ema50']:
        return 'BULLISH'   # Тренд вверх — ищем CALL
    elif last['ema20'] < last['ema50']:
        return 'BEARISH'   # Тренд вниз — ищем PUT
    else:
        return 'NEUTRAL'   # Неопределённость — пропускаем

# Пример использования:
trend = get_trend(btc_df)
print("BTC/USDT тренд: " + trend)`,
    },
    comparison: {
      human: "Смотрит на график 2–3 минуты, оценивает «на глаз»",
      bot: "Вычисляет EMA и определяет тренд за миллисекунды на любом числе пар",
      ai: "Добавляет контекст: новости + on-chain + volume profile для подтверждения тренда",
    },
  },
  sections: [
    { title: "Определение тренда через EMA 20/50", content: SectionEmaTrend },
    { title: "Поиск уровней поддержки и сопротивления", content: SectionSupportResistance },
    { title: "Практический пример: анализ BTC/USD на M5", content: SectionBtcPracticalExample },
  ],
}