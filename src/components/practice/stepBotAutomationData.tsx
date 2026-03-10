import type { PracticeStep } from "./practiceStepTypes"
import { SectionBotVsHuman } from "./practiceStepsRiskBot/SectionBotVsHuman"
import { SectionDcaBot, SectionGridBot } from "./practiceStepsRiskBot/SectionDcaAndGrid"
import { SectionStrategiesOverview } from "./practiceStepsRiskBot/SectionStrategiesOverview"
import { SectionPocketOption } from "./practiceStepsRiskBot/SectionPocketOption"
import { SectionPlatformsComparison } from "./practiceStepsRiskBot/SectionPlatformsComparison"
import { SectionBotCheatsheet } from "./practiceStepsRiskBot/SectionBotCheatsheet"

export const stepBotAutomation: PracticeStep = {
  id: "bot-automation",
  badge: "Шаг 5",
  color: "purple",
  icon: "Bot",
  title: "Автоматизация: когда нужен торговый бот",
  summary: "Боты убирают эмоции из торговли и работают 24/7. Но они решают только часть задач — понимание рынка остаётся за человеком.",
  relevance2026: {
    score: 97,
    label: "Тема №1 в крипте",
    aiImpact: 88,
    botImpact: 100,
    aiNote: "ИИ-агенты (LLM + автоматизация) стали новым видом ботов: они не только исполняют, но и интерпретируют рынок. Это меняет само понятие «торговый бот».",
    botNote: "В 2026 г. более 60% розничных криптотрейдеров используют хотя бы одного бота. Понимание того, «когда бот помогает, а когда мешает» — ключевой навык.",
  },
  aibotInsight: {
    aiExamples: [
      {
        label: "ИИ-агент = новый бот",
        text: "В 2025–2026 гг. появились агенты на базе LLM (GPT-4o, Gemini), которые сами читают рынок, новости и соцсети, принимают решения и исполняют ордера без заранее прописанных правил. Это «бот нового поколения».",
      },
      {
        label: "60%+ трейдеров — с ботами",
        text: "По опросу CryptoCompare (2025): 62% активных крипто-трейдеров используют хотя бы одного бота. Из них 71% — no-code платформы (Pionex, 3Commas). Бот перестал быть чем-то сложным.",
      },
    ],
    botExamples: [
      {
        label: "Когда бот НЕ нужен",
        text: "Важное: бот не поможет на событийных рынках (выход NFP, решение ФРС, хак биржи). В такие моменты лучше остановить бота вручную — резкие движения «выносят» сетки и DCA-стратегии.",
      },
      {
        label: "Когда бот необходим",
        text: "Бот незаменим на стабильном боковом рынке: Grid-бот зарабатывает на каждом колебании внутри диапазона, пока человек занят другими делами. Это типичный «пассивный доход» от трейдинга.",
      },
    ],
    comparison: {
      human: "Решает вручную: торговать сегодня или нет, сколько ставить, когда выходить",
      bot: "Автоматически решает всё — по заранее прописанным правилам, без эмоций",
      ai: "Адаптирует решения на основе текущего контекста рынка и новостного фона",
    },
  },
  sections: [
    { title: "Обзор стратегий: Pocket Option и BTC/USDT", content: <SectionStrategiesOverview /> },
    { title: "Бот vs ручная торговля: что выбрать", content: <SectionBotVsHuman /> },
    { title: "DCA-бот: стратегия для крипто-рынка", content: <SectionDcaBot /> },
    { title: "Grid-бот: заработок на волатильности", content: <SectionGridBot /> },
    { title: "Pocket Option: лучшая идея для бота «Три подтверждения»", content: <SectionPocketOption /> },
    { title: "Сравнение платформ: Pocket Option vs 3Commas vs Pionex", content: <SectionPlatformsComparison /> },
    { title: "Шпаргалка: какой бот выбрать и когда", content: <SectionBotCheatsheet /> },
  ],
}