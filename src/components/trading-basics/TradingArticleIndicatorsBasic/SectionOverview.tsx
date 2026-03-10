import React from "react"
import { IndicatorsComparisonTable } from "../TradingCharts"

export const SectionOverview = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">Существуют сотни индикаторов, но большинство дублируют друг друга. Ниже — всё, что нужно знать о главных из них.</p>
    <IndicatorsComparisonTable />
    <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-4">
      <div className="text-red-400 font-orbitron text-xs font-bold mb-2">Главная ошибка новичков</div>
      <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">Добавлять всё больше индикаторов в надежде найти «идеальный сигнал». На самом деле — чем больше индикаторов, тем больше противоречивых сигналов. Профессионалы используют 2–3 индикатора максимум.</p>
    </div>
    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
      <div className="text-purple-400 font-orbitron text-xs font-bold mb-2">Реальный пример: «индикаторный паралич»</div>
      <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">Виктор добавил на график 11 индикаторов: Stochastic, RSI, MACD, три MA, Bollinger Bands, ADX, CCI, OBV, ATR. На каждый потенциальный вход один индикатор говорил «покупай», другой — «продавай». За 2 месяца он совершил 3 сделки. Убрал всё, оставил EMA20/50 + RSI. Следующий месяц — 17 сделок, win rate 61%.</p>
    </div>
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
      <div className="text-blue-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Линда Рашке — минимум инструментов, максимум результата</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Линда Брэдфорд Рашке — одна из немногих женщин-трейдеров, вошедших в книгу Джека Швагера «Маги рынка» —
        работает с минимальным набором: скользящие средние и осциллятор Stochastic.
        «Большинство трейдеров добавляют индикаторы, когда начинают проигрывать. Это ошибка: проблема не в инструментах, а в дисциплине».
        За десятилетия работы она доказала: простота + дисциплина = устойчивые результаты, которых не даст ни один «магический» набор индикаторов.
      </p>
    </div>
  </div>
)
