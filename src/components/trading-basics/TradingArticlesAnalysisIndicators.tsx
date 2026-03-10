import type { Article } from "./TradingArticleTypes"
import { articleAnalysis } from "./TradingArticleAnalysis"
import {
  sectionIndicatorsOverview,
  sectionMA,
  sectionRSI,
  sectionMACD,
} from "./TradingArticleIndicatorsBasic"
import { sectionIndicatorsAdvanced } from "./TradingArticleIndicatorsAdvanced"

export { articleAnalysis }

export const articleIndicators: Article = {
  id: "indicators",
  badge: "Глава 4",
  title: "Индикаторы: как использовать без перегрузки",
  summary: "Индикаторы помогают подтверждать сигналы, но не заменяют понимание рынка. Важно использовать минимальный набор и понимать логику каждого.",
  relevance2026: {
    score: 70,
    label: "Трансформируется",
    aiImpact: 80,
    botImpact: 75,
    aiNote: "ИИ-модели (LSTM, трансформеры) вытесняют классические индикаторы в алго-торговле. Но RSI, EMA, MACD остаются базой для понимания сигналов и настройки ботов.",
    botNote: "Большинство популярных ботов (3Commas, Pionex) используют именно эти индикаторы как входные параметры. Знание их логики обязательно для кастомизации.",
  },
  aibotInsight: {
    aiExamples: [
      {
        label: "LSTM вместо RSI",
        text: "Глубокие нейросети (LSTM, Transformer) обучаются предсказывать следующий шаг цены без явных индикаторов — они сами находят паттерны в сырых OHLCV-данных. RSI в таких системах не нужен.",
      },
      {
        label: "Adaptive indicators",
        text: "ИИ-системы используют «адаптивные» версии индикаторов: KAMA (Kaufman Adaptive MA) и VIDYA подстраивают период под текущую волатильность автоматически. Фиксированный EMA(14) устаревает.",
      },
      {
        label: "Кластеризация сигналов",
        text: "ML-модели комбинируют 20–50 индикаторов в единый «сигнал вероятности» через Random Forest или XGBoost — это точнее любого ручного конфлюэнса.",
      },
    ],
    botExamples: [
      {
        label: "RSI в Pionex Grid Bot",
        text: "Pionex позволяет запустить сетку только когда RSI ниже 30 (перепроданность). Это встроенный фильтр — бот не торгует против тренда в экстремуме.",
      },
      {
        label: "MACD-крест как триггер",
        text: "В 3Commas и Bitsgap сигнал MACD (пересечение линий) — самый популярный триггер для старта DCA-бота. Настраивается в два клика без кода.",
      },
      {
        label: "EMA как фильтр тренда",
        text: "Стандартная конфигурация бота: торговать только когда цена выше EMA(200). Один индикатор убирает 80% контртрендовых сделок.",
      },
    ],
    codeSnippet: {
      title: "Пример: бот входит только при RSI < 30 + цена выше EMA(200)",
      code: `import pandas_ta as ta

df['rsi'] = ta.rsi(df['close'], length=14)
df['ema200'] = ta.ema(df['close'], length=200)

last = df.iloc[-1]

if last['rsi'] < 30 and last['close'] > last['ema200']:
    print("Сигнал: RSI перепродан + тренд вверх → ВХОД в лонг")
else:
    print("Условия не выполнены → ждём")`,
    },
    comparison: {
      human: "Смотрит на RSI и EMA глазами, принимает решение за 2–3 минуты",
      bot: "Проверяет 5 условий одновременно на 30 парах каждые 60 секунд",
      ai: "Комбинирует 40+ индикаторов через ML-модель, взвешивая их по важности",
    },
  },
  sections: [
    sectionIndicatorsOverview,
    sectionMA,
    sectionRSI,
    sectionMACD,
    sectionIndicatorsAdvanced,
  ]
}

export const articlesAnalysisIndicators: Article[] = [articleAnalysis, articleIndicators]