import React from "react"
import { MarketComparisonTable } from "../TradingCharts"

export const SectionMarketTypes = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">Выбор рынка определяет весь стиль торговли. Каждый рынок имеет свой характер волатильности, ликвидности и часов работы.</p>
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
      <div className="text-blue-400 font-orbitron text-xs font-bold mb-2">Реальный пример: почему рынок важнее стратегии</div>
      <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">Антон торговал акциями SBER с 10:00 до 18:50, успевал смотреть графики между делами. Когда он перешёл на биткоин — та же система сломалась: BTC обвалился на 12% в 3 ночи пока он спал. Вывод: выбирайте рынок, который подходит <span className="text-white">вашему расписанию и образу жизни</span>, а не только доходности.</p>
    </div>
    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
      <div className="text-purple-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Стэнли Дракенмиллер и выбор рынка</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Стэнли Дракенмиллер — один из самых успешных трейдеров в истории, средняя доходность 30% годовых за 30 лет —
        говорил, что его главным конкурентным преимуществом была готовность переключаться между рынками:
        «Я торговал акциями, валютами, облигациями, сырьём — в зависимости от того, где было наибольшее движение».
        Он понимал: нет «лучшего» рынка навсегда — есть рынок, который лучше подходит тебе прямо сейчас.
      </p>
    </div>
    <MarketComparisonTable />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
        <div className="text-yellow-400 font-orbitron text-xs font-bold mb-2">Что такое ликвидность?</div>
        <p className="text-zinc-400 text-xs leading-relaxed">Ликвидность — насколько легко купить или продать актив без существенного изменения его цены. Высокая ликвидность = узкий спред, быстрое исполнение. Низкая = широкий спред, проскальзывание.</p>
        <p className="text-zinc-500 text-xs mt-2 font-space-mono">Пример: покупаете BTC на $50,000 — исполняется мгновенно. Покупаете малоизвестный альткоин на $5,000 — цена сдвигается на 3% из-за вашей же заявки.</p>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
        <div className="text-red-400 font-orbitron text-xs font-bold mb-2">Что такое волатильность?</div>
        <p className="text-zinc-400 text-xs leading-relaxed">Волатильность — амплитуда колебаний цены. BTC может за день изменить цену на 5–15%. Акции SBER — на 1–3%. Высокая волатильность = больше возможностей и рисков одновременно.</p>
        <p className="text-zinc-500 text-xs mt-2 font-space-mono">Пример: 18 июня 2022 BTC за одни сутки упал с $22,000 до $17,500 (-20%). Кто держал без стопа — потерял пятую часть капитала за ночь.</p>
      </div>
    </div>
  </div>
)
