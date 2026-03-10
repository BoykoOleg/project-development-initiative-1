import type { PracticeStep } from "./practiceStepTypes"
import { SectionMarketRegimes4 } from "./practiceStepsMarketRegimes/SectionMarketRegimes4"
import { SectionRegimeDetection } from "./practiceStepsMarketRegimes/SectionRegimeDetection"
import { SectionRegimeStrategies } from "./practiceStepsMarketRegimes/SectionRegimeStrategies"

export const stepMarketRegimes: PracticeStep = {
  id: "market-regimes",
  badge: "Шаг 2",
  color: "purple",
  icon: "Layers",
  title: "Режимы рынка: в каком состоянии BTC прямо сейчас?",
  summary: "Одна и та же стратегия приносит прибыль в тренде и убытки в боковике. Перед любым входом нужно определить режим рынка — это меняет всё: инструменты, стратегию, размер ставки.",
  relevance2026: {
    score: 95,
    label: "Ключевой навык",
    aiImpact: 82,
    botImpact: 75,
    aiNote: "ИИ-системы классифицируют режим рынка в реальном времени, совмещая ATR, ADX, объёмы и новостной фон. Это один из самых ценных применений ML в трейдинге.",
    botNote: "Профессиональные боты автоматически переключаются между стратегиями в зависимости от определённого режима — это и есть их главное преимущество над человеком.",
  },
  aibotInsight: {
    aiExamples: [
      {
        label: "ML-классификатор режима рынка",
        text: "Hedge-фонды используют градиентный бустинг (XGBoost) для классификации режимов на основе 50+ фич: ADX, ATR, корреляция с индексами, объёмный профиль, funding rate. Точность — до 78% на крипте.",
      },
      {
        label: "Адаптивный ИИ-агент",
        text: "GPT-4o в связке с TradingView API может ежечасно пересматривать режим рынка и давать рекомендацию: «Сейчас флэт — переключись на сетку» или «Волатильность высокая — уменьши размер сделки вдвое».",
      },
    ],
    botExamples: [
      {
        label: "Переключение стратегий по ADX",
        text: "Бот проверяет ADX каждую свечу: если ADX > 25 — включает трендовую стратегию (EMA-кросс), если ADX < 20 — переключается на сеточную торговлю. Это и есть адаптивный алгоритм.",
      },
      {
        label: "Фильтр по ATR перед входом",
        text: "Перед каждой сделкой бот считает ATR(14). Если текущая свеча > 1.5×ATR — рынок в режиме высокой волатильности, бот уменьшает размер позиции или пропускает вход.",
      },
    ],
    codeSnippet: {
      title: "Определение режима рынка: ADX + ATR",
      code: `import pandas_ta as ta

def get_market_regime(df):
    df['adx'] = ta.adx(df['high'], df['low'], df['close'])['ADX_14']
    df['atr'] = ta.atr(df['high'], df['low'], df['close'], length=14)
    atr_mean = df['atr'].rolling(50).mean()

    last = df.iloc[-1]
    adx = last['adx']
    atr_ratio = last['atr'] / atr_mean.iloc[-1]

    if adx > 25 and atr_ratio < 1.5:
        return 'TREND'        # Чёткий тренд — работаем по тренду
    elif adx < 20:
        return 'FLAT'         # Боковик — сетка или пропуск
    elif atr_ratio > 1.5:
        return 'VOLATILE'     # Высокая волатильность — осторожно
    else:
        return 'TRANSITION'   # Переходный режим — ждём

regime = get_market_regime(btc_df)
print(f"Режим BTC: {regime}")`,
    },
    comparison: {
      human: "Определяет режим «на глаз» — часто ошибается в переходных зонах",
      bot: "Считает ADX + ATR за миллисекунды, автоматически меняет стратегию",
      ai: "Учитывает корреляции, объёмы, funding rate и новости для точной классификации",
    },
  },
  sections: [
    { title: "4 режима рынка: как называть и как узнать", content: <SectionMarketRegimes4 /> },
    { title: "Как определить режим за 30 секунд", content: <SectionRegimeDetection /> },
    { title: "Какую стратегию выбрать в каждом режиме", content: <SectionRegimeStrategies /> },
  ],
}