import React from "react"
import { MACDChart } from "../TradingCharts"

export const SectionMACD = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">MACD (Moving Average Convergence Divergence) — один из лучших инструментов для определения силы и направления тренда.</p>
    <MACDChart />
    <div className="space-y-2 text-xs font-space-mono">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
        <div className="text-blue-400 font-bold mb-1">Как читать MACD</div>
        <ul className="text-zinc-400 space-y-1">
          <li>→ Синяя линия (MACD) пересекает жёлтую (Signal) снизу вверх = покупка</li>
          <li>→ Синяя пересекает жёлтую сверху вниз = продажа</li>
          <li>→ Гистограмма выше нуля = бычий импульс, ниже нуля = медвежий</li>
          <li>→ Дивергенция MACD работает так же, как дивергенция RSI</li>
        </ul>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
        <div className="text-yellow-400 font-bold mb-1">Объём — король подтверждения</div>
        <ul className="text-zinc-400 space-y-1">
          <li>→ Рост цены + рост объёма = сильное движение, доверяем</li>
          <li>→ Рост цены + падение объёма = слабое движение, осторожно</li>
          <li>→ Пробой уровня без объёма = скорее всего ложный пробой</li>
          <li>→ Аномальный объём (spike) = крупный игрок входит или выходит</li>
        </ul>
      </div>
    </div>
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
      <div className="text-blue-400 font-orbitron text-xs font-bold mb-2">Реальный кейс: объём предупредил о пробое $25,000 (BTC, февраль 2023)</div>
      <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">BTC несколько недель консолидировался под $25,000. 15 февраля объём вырос в 3.8x выше среднедневного — при этом свечи были в плюсе. На следующий день BTC пробил $25,000 и за 2 дня достиг $25,300. Трейдеры, отслеживавшие аномалию объёма, вошли заранее. Без объёмного анализа — вход уже на пробое, с проскальзыванием и риском ложного пробоя.</p>
    </div>
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
      <div className="text-yellow-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Том Уильямс и VSA-объём</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Том Уильямс — бывший синдикатный трейдер лондонского рынка — в своей книге «Master the Markets» раскрыл,
        как профессиональные операторы (банки, фонды) используют аномальный объём для накопления и распределения позиций.
        Он утверждал: «Объём — это единственный честный показатель. Всё остальное может быть сфабриковано».
        Метод VSA, разработанный Уильямсом, используется сегодня крупными трейдинговыми домами для определения входа институциональных игроков ещё до начала движения цены.
      </p>
    </div>
  </div>
)
