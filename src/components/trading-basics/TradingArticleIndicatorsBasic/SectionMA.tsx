import React from "react"

export const SectionMA = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">MA — самый популярный инструмент. Сглаживает шум цены и показывает направление тренда.</p>
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <svg viewBox="0 0 360 140" className="w-full h-36">
        {[60,90,120].map(y => <line key={y} x1="20" y1={y} x2="340" y2={y} stroke="#27272a" strokeWidth="0.8" />)}
        <polyline points="20,120 50,110 80,100 110,90 90,85 120,75 150,65 130,60 160,50 190,45 210,40 240,35 270,30 300,25 330,20" fill="none" stroke="#e5e7eb" strokeWidth="1.5" />
        <polyline points="20,118 50,108 80,98 110,88 90,84 120,73 150,62 130,58 160,48 190,43 210,38 240,33 270,28 300,23 330,18" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="0" />
        <polyline points="20,122 50,115 80,108 110,100 100,96 130,88 160,78 145,73 175,62 205,55 225,49 255,43 285,37 315,31 340,26" fill="none" stroke="#ef4444" strokeWidth="2" />
        <circle cx="195" cy="50" r="6" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
        <text x="200" y="43" fontSize="8" fill="#fbbf24" fontFamily="monospace">Golden Cross</text>
        <line x1="20" y1="108" x2="340" y2="95" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4,2" />
        <text x="250" y="92" fontSize="8" fill="#a78bfa" fontFamily="monospace">EMA 200</text>
        <line x1="20" y1="135" x2="35" y2="135" stroke="#22c55e" strokeWidth="2" />
        <text x="38" y="138" fontSize="7" fill="#86efac" fontFamily="monospace">EMA20 (быстрая)</text>
        <line x1="130" y1="135" x2="145" y2="135" stroke="#ef4444" strokeWidth="2" />
        <text x="148" y="138" fontSize="7" fill="#fca5a5" fontFamily="monospace">EMA50 (медленная)</text>
      </svg>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="bg-zinc-900 border border-green-500/20 rounded-lg p-3">
        <div className="text-green-400 font-orbitron text-xs font-bold mb-1">Golden Cross 🐂</div>
        <p className="text-zinc-400 text-xs font-space-mono">EMA20 пересекает EMA50 снизу вверх. Сигнал на покупку. Наиболее значим на H4 и D1. На меньших ТФ — много ложных сигналов.</p>
      </div>
      <div className="bg-zinc-900 border border-red-500/20 rounded-lg p-3">
        <div className="text-red-400 font-orbitron text-xs font-bold mb-1">Death Cross 🐻</div>
        <p className="text-zinc-400 text-xs font-space-mono">EMA20 пересекает EMA50 сверху вниз. Сигнал на продажу. Самый известный пример — Death Cross BTC в мае 2021.</p>
      </div>
    </div>
    <div className="bg-zinc-900 border border-purple-500/20 rounded-lg p-3">
      <div className="text-purple-400 font-orbitron text-xs font-bold mb-1">MA200 — маркер бычьего/медвежьего рынка</div>
      <p className="text-zinc-400 text-xs font-space-mono">Цена выше MA200 на D1 = бычий рынок. Ниже = медвежий. Используйте это как главный фильтр направления. Покупайте только выше MA200, продавайте только ниже.</p>
    </div>
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
      <div className="text-yellow-400 font-orbitron text-xs font-bold mb-2">Реальный кейс: Death Cross BTC, май 2021</div>
      <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">20 мая 2021 на дневном графике BTC EMA50 пересекла EMA200 сверху вниз — Death Cross. Это был официальный сигнал начала медвежьего рынка. Трейдеры, работавшие по этому правилу, закрыли лонги и ждали. BTC с $59,000 упал до $16,000 к ноябрю 2022. Золотой крест появился снова в январе 2023 по $21,000 — начало нового цикла.</p>
    </div>
    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
      <div className="text-green-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Пол Тюдор Джонс и MA200</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Пол Тюдор Джонс в документальном фильме «Trader» (1987) открыто показал свои правила: он смотрит на 200-дневную скользящую среднюю как на главный фильтр.
        «Если цена ниже MA200 — у меня нет длинных позиций. Точка. Никаких исключений».
        Это простое правило позволило ему не участвовать в большинстве медвежьих рынков и сохранять капитал для роста.
        Тот же принцип в масштабе M5 с EMA20/50 работает по той же логике — только на более коротких временных горизонтах.
      </p>
    </div>
  </div>
)
