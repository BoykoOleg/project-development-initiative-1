import type { PracticeStep } from "./practiceStepTypes"
import { SectionCourseSummary } from "./practiceStepsChecklist/SectionCourseSummary"
import { SectionDecisionAlgorithm } from "./practiceStepsChecklist/SectionDecisionAlgorithm"
import { SectionNoSystemMistake } from "./practiceStepsChecklist/SectionNoSystemMistake"
import { SectionSiteMap } from "./practiceStepsChecklist/SectionSiteMap"
import { SectionGrowthMap } from "./practiceStepsChecklist/SectionGrowthMap"

export const stepFullChecklist: PracticeStep = {
  id: "full-checklist",
  badge: "Итог",
  color: "green",
  icon: "CheckCircle",
  title: "Итог: полная система от анализа до автоматизации",
  summary: "Сводка всех 6 шагов курса. Единый алгоритм действий, карта прогресса трейдера и следующие шаги для роста.",
  relevance2026: {
    score: 100,
    label: "Система, которая работает",
    aiImpact: 70,
    botImpact: 95,
    aiNote: "Системный подход (анализ → сигнал → риск → автоматизация) — именно то, что ИИ-решения пытаются реализовать алгоритмически. Понимание системы позволяет её улучшать.",
    botNote: "Трейдеры, прошедшие все 6 шагов и запустившие бота по этой системе, фиксируют стабильность результата через 3–6 месяцев. Это не теория — это рабочий чеклист.",
  },
  aibotInsight: {
    aiExamples: [
      {
        label: "Система = основа ИИ-трейдинга",
        text: "Любая ИИ-стратегия реализует те же 6 шагов алгоритмически: сбор данных (Шаг 1) → генерация сигнала (Шаг 2) → расчёт риска (Шаг 3) → исполнение (Шаг 4–5) → анализ ошибок (Шаг 6). Понимание системы = понимание любого алгоритма.",
      },
      {
        label: "Следующий уровень",
        text: "После освоения базовой системы логичный следующий шаг — добавить ML-фильтр между сигналом и исполнением. Модель обучается на ваших исторических сделках и предсказывает вероятность успеха текущего сигнала.",
      },
    ],
    botExamples: [
      {
        label: "Статистика реальных трейдеров",
        text: "По данным внутренней аналитики 3Commas (2025): трейдеры, которые прошли обучение перед запуском бота, показывают прибыль на 34% чаще в первые 6 месяцев по сравнению с теми, кто запустил бота без подготовки.",
      },
      {
        label: "3–6 месяцев до стабильности",
        text: "Реалистичный срок выхода на стабильный результат с ботом — 3–6 месяцев. За это время накапливается статистика, корректируются параметры, отрабатывается психология невмешательства.",
      },
    ],
    comparison: {
      human: "Изучил теорию → торгует по ощущениям → теряет деньги → бросает",
      bot: "Изучил систему → настроил по шагам → мониторит → корректирует → масштабирует",
      ai: "Изучил систему → добавил ML-слой → система самообучается на новых данных",
    },
  },
  sections: [
    { title: "Сводка курса: 6 шагов к системной торговле", content: <SectionCourseSummary /> },
    { title: "Алгоритм принятия решения за 5 минут", content: <SectionDecisionAlgorithm /> },
    { title: "Главная ошибка новичков: торговля без системы", content: <SectionNoSystemMistake /> },
    { title: "Связь разделов сайта: как всё работает вместе", content: <SectionSiteMap /> },
    { title: "Ваш следующий шаг: карта роста трейдера", content: <SectionGrowthMap /> },
  ],
}