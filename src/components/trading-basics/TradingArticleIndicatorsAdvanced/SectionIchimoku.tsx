import React from "react"

export const SectionIchimoku = () => (
  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
    <div className="text-white font-orbitron text-xs font-bold mb-3">Облако Ичимоку (Ichimoku Kinko Hyo)</div>
    <p className="text-gray-300 text-sm leading-relaxed mb-3">Ичимоку — комплексный индикатор, который одновременно показывает тренд, уровни поддержки/сопротивления, импульс и сигналы входа. Пять линий в одном.</p>
    <div className="bg-zinc-900 rounded-xl p-3">
      <svg viewBox="0 0 360 130" className="w-full h-32">
        <path d="M 40,50 L 200,40 L 200,75 L 40,85 Z" fill="#22c55e" fillOpacity="0.15" />
        <path d="M 200,40 L 340,30 L 340,60 L 200,75 Z" fill="#ef4444" fillOpacity="0.15" />
        <polyline points="40,85 120,75 200,75 260,55 340,60" fill="none" stroke="#22c55e" strokeWidth="1" />
        <polyline points="40,50 120,45 200,40 260,35 340,30" fill="none" stroke="#ef4444" strokeWidth="1" />
        <polyline points="40,95 80,85 120,90 160,70 200,65 240,45 280,35 320,25" fill="none" stroke="#e5e7eb" strokeWidth="2" />
        <polyline points="40,92 80,82 120,86 160,68 200,63 240,44 280,34 320,24" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="0" />
        <polyline points="40,100 100,92 160,85 220,72 280,60 320,50" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
        <text x="5" y="70" fontSize="6" fill="#22c55e" fontFamily="monospace">Span A</text>
        <text x="5" y="45" fontSize="6" fill="#ef4444" fontFamily="monospace">Span B</text>
        <text x="5" y="95" fontSize="6" fill="#60a5fa" fontFamily="monospace">Tenkan</text>
        <text x="5" y="105" fontSize="6" fill="#fbbf24" fontFamily="monospace">Kijun</text>
        <text x="155" y="125" fontSize="7" fill="#52525b" textAnchor="middle" fontFamily="monospace">Цена выше облака = бычий тренд</text>
      </svg>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs font-space-mono">
      {[
        { name: "Tenkan-sen (9)", color: "text-blue-400", desc: "Быстрая линия. Средняя за 9 периодов. Пересечение с Kijun — сигнал входа. Направление = краткосрочный тренд." },
        { name: "Kijun-sen (26)", color: "text-yellow-400", desc: "Медленная линия. Средняя за 26 периодов. Уровень поддержки/сопротивления. Пересечение Tenkan'а с Kijun = сигнал." },
        { name: "Облако Kumo", color: "text-green-400", desc: "Зелёное облако = бычья поддержка. Красное = медвежье сопротивление. Цена выше облака — торгуем лонги. Ниже — шорты." },
        { name: "Chikou Span", color: "text-purple-400", desc: "Цена, сдвинутая на 26 периодов назад. Если выше исторической цены — бычий сигнал. Подтверждает направление тренда." },
      ].map((item, i) => (
        <div key={i} className="bg-zinc-900 rounded-lg p-2">
          <div className={`font-bold mb-1 ${item.color}`}>{item.name}</div>
          <p className="text-zinc-400 leading-relaxed">{item.desc}</p>
        </div>
      ))}
    </div>
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mt-3">
      <div className="text-blue-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: японские институциональные трейдеры и Ичимоку</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Ичимоку Кинко Хё был разработан японским журналистом Гоити Хосода (псевдоним «Ичимоку Санджин») ещё в 1930-х годах.
        В Японии он традиционно используется институциональными трейдерами крупных банков (Nomura, Mitsubishi UFJ) как основной инструмент анализа.
        По данным японского финансового регулятора, Ичимоку входит в топ-3 самых используемых индикаторов среди профессиональных трейдеров азиатских рынков.
        На Западе его популяризировал Ник Дастуни и команда FX Primus, адаптировав для форекс и крипторынков.
      </p>
    </div>
  </div>
)
