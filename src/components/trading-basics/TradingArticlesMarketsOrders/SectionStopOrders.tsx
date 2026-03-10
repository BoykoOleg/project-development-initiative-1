import React from "react"

export const SectionStopOrders = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">Стоп-ордера — это ваша страховка. Профессионалы всегда ставят стопы до входа в сделку, а не после.</p>
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <svg viewBox="0 0 360 120" className="w-full h-28">
        <polyline points="20,80 80,75 120,60 160,55 200,65 240,50 270,40 290,30" fill="none" stroke="#e5e7eb" strokeWidth="2" />
        <circle cx="120" cy="60" r="4" fill="#60a5fa" />
        <text x="125" y="55" fontSize="8" fill="#60a5fa" fontFamily="monospace">ВХОД $100</text>
        <line x1="20" y1="90" x2="340" y2="90" stroke="#ef4444" strokeWidth="1" strokeDasharray="5,3" />
        <text x="250" y="87" fontSize="8" fill="#ef4444" fontFamily="monospace">STOP-LOSS $93 (-7%)</text>
        <line x1="20" y1="20" x2="340" y2="20" stroke="#22c55e" strokeWidth="1" strokeDasharray="5,3" />
        <text x="245" y="17" fontSize="8" fill="#22c55e" fontFamily="monospace">TAKE-PROFIT $121 (+21%)</text>
        <line x1="350" y1="20" x2="350" y2="90" stroke="#a78bfa" strokeWidth="1" />
        <text x="310" y="58" fontSize="8" fill="#a78bfa" fontFamily="monospace">R:R = 1:3</text>
      </svg>
    </div>
    <div className="space-y-2 text-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
        <div className="text-red-400 font-orbitron text-xs font-bold mb-1">Где ставить Stop-Loss?</div>
        <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">За последний значимый уровень поддержки/сопротивления, за тень последней свечи, или фиксированный % от входа. Не ставьте стоп «на круглых числах» — там его часто выбивают намеренно.</p>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
        <div className="text-yellow-400 font-orbitron text-xs font-bold mb-1">Трейлинг-стоп: автоматическое сохранение прибыли</div>
        <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">Трейлинг-стоп следует за ценой на фиксированном расстоянии. Если BTC вырос с $42к до $48к, а трейлинг-стоп стоит на 5% ниже — он передвинется до $45,600. При откате закроет позицию, зафиксировав прибыль.</p>
      </div>
    </div>
    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
      <div className="text-orange-400 font-orbitron text-xs font-bold mb-2">Реальный пример: трейлинг-стоп спас 60% прибыли</div>
      <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">Олег купил BTC по $38,000, цена выросла до $52,000 (+37%). Он выставил трейлинг-стоп 8%. Цена откатила до $47,840 — стоп сработал. Олег зафиксировал +25.9% вместо того, чтобы ждать роста и потенциально «отдать» всё обратно. Без трейлинга — BTC упал до $41,000 и он продал «руками» на эмоциях, зафиксировав лишь +7.9%.</p>
    </div>
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
      <div className="text-yellow-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Николас Дарвас и метод «стоп всегда»</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Николас Дарвас — танцор по профессии, заработавший $2 млн на фондовом рынке в 1950-х —
        стал легендой именно благодаря системной расстановке стопов. Он торговал из разных стран мира, получая только телеграммы с котировками.
        Без возможности следить за рынком постоянно, он разработал «коробочный метод»: покупал при пробое, всегда ставил трейлинг-стоп.
        Его книга «Как я заработал $2,000,000 на фондовом рынке» показывает: стоп-приказы — не трусость, а система.
      </p>
    </div>
  </div>
)
