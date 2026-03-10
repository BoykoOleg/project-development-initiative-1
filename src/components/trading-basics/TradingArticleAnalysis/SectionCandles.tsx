import { CandlestickChart, CandlePatternCards } from "../TradingCharts"

export const SectionCandles = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">Японские свечи придумали рисовые трейдеры в Японии XVII века. Сегодня это стандарт во всём мире. Каждая свеча рассказывает о борьбе быков и медведей за период.</p>
    <CandlestickChart />
    <CandlePatternCards />
    <div className="bg-zinc-900 border border-yellow-500/20 rounded-xl p-4">
      <div className="text-yellow-400 font-orbitron text-xs font-bold mb-2">Важное правило</div>
      <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">Паттерн свечи — это предположение, а не гарантия. Всегда ждите подтверждения: следующая свеча должна подтвердить разворот, а объём должен быть выше среднего. Без подтверждения — это просто красивая картинка.</p>
    </div>
    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
      <div className="text-green-400 font-orbitron text-xs font-bold mb-2">Реальный кейс: Молот на поддержке SOL, октябрь 2023</div>
      <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">SOL торговался в нисходящем тренде, достиг зоны поддержки $17.80. На D1 появился классический Молот: тело наверху, длинная нижняя тень вдвое длиннее тела, объём в 2.3x выше среднего. Следующая свеча — уверенный бычий бар. Трейдеры, дождавшиеся подтверждения, вошли по $19.50. Через 6 недель SOL торговался по $58. Без подтверждения — часть зашла на первой свече и вышла в безубыток при первом откате.</p>
    </div>
    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
      <div className="text-purple-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Стив Нисон и возрождение свечного анализа</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Стив Нисон — американский аналитик, который в 1991 году познакомил западных трейдеров с японскими свечами через книгу «Japanese Candlestick Charting Techniques» —
        рассказывал, что японские рисовые торговцы использовали свечные паттерны ещё в XVIII веке.
        Мунэхиса Хомма, легендарный японский трейдер, сколотил огромное состояние на рисовой бирже именно благодаря психологическому анализу паттернов.
        Нисон предупреждал: «Японцы никогда не использовали свечи изолированно — всегда в контексте уровней и тренда».
      </p>
    </div>
  </div>
)
