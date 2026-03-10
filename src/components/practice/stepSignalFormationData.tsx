import type { PracticeStep } from "./practiceStepTypes"
import {
  SectionRsiFilter,
  SectionConfluencePrinciple,
  SectionSetupBreakdown,
} from "./practiceStepsMarketSignal/SectionRsiConfluence"

export const stepSignalFormation: PracticeStep = {
  id: "signal-formation",
  badge: "Шаг 3",
  color: "yellow",
  icon: "Zap",
  title: "Формирование сигнала: конфлюэнс трёх факторов",
  summary: "Профессионалы не торгуют по одному индикатору. Сигнал считается сильным, только когда тренд, уровень и RSI подтверждают друг друга.",
  relevance2026: {
    score: 88,
    label: "Актуально, но конкуренция растёт",
    aiImpact: 75,
    botImpact: 80,
    aiNote: "ИИ-стратегии добавляют 4-й фактор — анализ новостного потока в реальном времени. Конфлюэнс трёх факторов остаётся базой, но топ-боты уже работают с 5–7.",
    botNote: "Стратегия «три подтверждения» — основа большинства успешных розничных ботов 2025-2026. Боты с одним индикатором показывают win rate ниже порога безубыточности.",
  },
  aibotInsight: {
    aiExamples: [
      {
        label: "4-й фактор: новостной поток",
        text: "Топовые ИИ-боты 2025–2026 добавляют к классическому конфлюэнсу 4-й фактор — сентимент новостей. Если выходят данные по инфляции через 30 минут, бот игнорирует любые технические сигналы.",
      },
      {
        label: "7 условий в ML-стратегиях",
        text: "ML-системы в хедж-фондах проверяют 5–7 условий одновременно: тренд, уровень, RSI, объём, волатильность, on-chain метрики, news sentiment. Классический «три подтверждения» — это минимум.",
      },
    ],
    botExamples: [
      {
        label: "Конфлюэнс в коде",
        text: "Три условия кодируются как AND-логика: входим ТОЛЬКО если тренд == 'BULLISH' AND уровень == True AND RSI < 35. Одно условие не выполнено — ордер не создаётся. Win rate вырастает с 50% до 58–65%.",
      },
      {
        label: "Реальная статистика",
        text: "Тест на 2 годах истории BTC/USDT: бот с 1 условием (только RSI) — win rate 51%. С 2 условиями (+тренд) — 57%. С 3 условиями (+уровень) — 63%. Каждое условие добавляет ~6% к точности.",
      },
    ],
    codeSnippet: {
      title: "Три подтверждения в коде бота (Python)",
      code: `def check_signal(df, key_level, tolerance=0.002):
    last = df.iloc[-1]

    # Условие 1: тренд (EMA 20 > EMA 50)
    trend_bullish = last['ema20'] > last['ema50']

    # Условие 2: цена у уровня (±0.2%)
    near_level = abs(last['close'] - key_level) / key_level < tolerance

    # Условие 3: RSI перепродан (< 35) для лонга
    rsi_oversold = last['rsi'] < 35

    # Конфлюэнс: все три должны совпасть
    if trend_bullish and near_level and rsi_oversold:
        return 'CALL'   # Сильный сигнал на покупку

    return None  # Условия не выполнены → пропускаем`,
    },
    comparison: {
      human: "Иногда пропускает условия «по ощущению», когда кажется что «вот-вот пойдёт»",
      bot: "Проверяет все 3 условия математически — без исключений и без эмоций",
      ai: "Добавляет 4-й фактор (news/sentiment) и адаптирует вес условий под режим рынка",
    },
  },
  sections: [
    { title: "RSI как подтверждающий фильтр", content: SectionRsiFilter },
    { title: "Принцип конфлюэнса: три подтверждения", content: SectionConfluencePrinciple },
    { title: "Разбор реального сетапа: пример конфлюэнса", content: SectionSetupBreakdown },
  ],
}