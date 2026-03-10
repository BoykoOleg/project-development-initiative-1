import React from "react"
import { RSIChart } from "../TradingCharts"

export const SectionRSI = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">RSI — осциллятор от 0 до 100, показывающий «перегрев» рынка. Самый ценный его сигнал — дивергенция.</p>
    <RSIChart />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
        <div className="text-red-400 font-orbitron text-xs font-bold mb-1">RSI &gt; 70: перекупленность</div>
        <p className="text-zinc-400 text-xs font-space-mono">Цена росла слишком быстро. Возможен откат. Но в сильном тренде RSI может оставаться выше 70 неделями. Не продавайте только потому что RSI высокий.</p>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
        <div className="text-green-400 font-orbitron text-xs font-bold mb-1">RSI &lt; 30: перепроданность</div>
        <p className="text-zinc-400 text-xs font-space-mono">Цена падала слишком быстро. Возможен отскок. В медвежьем рынке RSI может долго быть ниже 30. Покупка на перепроданности в нисходящем тренде — ошибка.</p>
      </div>
    </div>
    <div className="bg-zinc-900 border border-yellow-500/20 rounded-xl p-4 space-y-4">
      <div>
        <div className="text-yellow-400 font-orbitron text-xs font-bold mb-2">Дивергенция RSI — самый сильный сигнал</div>
        <p className="text-gray-300 text-sm leading-relaxed">Дивергенция — расхождение между ценой и RSI. Цена говорит одно, индикатор — другое. Это значит, что движение теряет силу и скоро может развернуться.</p>
      </div>

      {/* Бычья дивергенция */}
      <div className="border border-green-500/30 bg-green-500/5 rounded-xl p-4">
        <div className="text-green-400 font-orbitron text-xs font-bold mb-3">Бычья дивергенция — сигнал разворота вверх</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
          <div>
            <p className="text-zinc-300 text-xs font-space-mono leading-relaxed mb-3">Возникает в конце <span className="text-red-400 font-bold">нисходящего тренда</span>. Цена падает всё ниже, но RSI уже не подтверждает — это значит, что продавцы выдыхаются.</p>
            <div className="space-y-2">
              <div className="bg-zinc-800 rounded-lg p-2 flex items-center gap-2">
                <span className="text-green-400 font-bold font-space-mono text-xs w-16 shrink-0">Цена:</span>
                <span className="text-zinc-300 text-xs font-space-mono">делает <span className="text-red-400 font-bold">более низкий минимум</span> (LL). Второе дно ниже первого.</span>
              </div>
              <div className="bg-zinc-800 rounded-lg p-2 flex items-center gap-2">
                <span className="text-green-400 font-bold font-space-mono text-xs w-16 shrink-0">RSI:</span>
                <span className="text-zinc-300 text-xs font-space-mono">делает <span className="text-green-400 font-bold">более высокий минимум</span> (HL). RSI не падает вместе с ценой.</span>
              </div>
              <div className="bg-green-500/10 rounded-lg p-2">
                <span className="text-green-300 text-xs font-space-mono">→ Медведи слабеют. Ждём разворот вверх.</span>
              </div>
            </div>
          </div>
          <div>
            <svg viewBox="0 0 220 180" className="w-full h-44 rounded-lg bg-zinc-950 p-1">
              <text x="8" y="12" fontSize="7" fill="#6b7280" fontFamily="monospace">Цена</text>
              <text x="8" y="102" fontSize="7" fill="#6b7280" fontFamily="monospace">RSI</text>
              <line x1="6" y1="92" x2="214" y2="92" stroke="#27272a" strokeWidth="1"/>

              {/* Цена: нисходящий тренд + два дна */}
              <polyline points="10,28 30,22 50,35 70,28 85,55" fill="none" stroke="#6b7280" strokeWidth="1"/>
              {/* Дно 1 */}
              <line x1="85" y1="48" x2="85" y2="62" stroke="#ef4444" strokeWidth="1"/>
              <rect x="82" y="55" width="6" height="7" fill="#ef4444" opacity="0.7" rx="1"/>
              {/* Подъём */}
              <polyline points="85,55 100,42 115,50" fill="none" stroke="#6b7280" strokeWidth="1"/>
              {/* Дно 2 (ниже) */}
              <line x1="115" y1="44" x2="115" y2="68" stroke="#ef4444" strokeWidth="1"/>
              <rect x="112" y="58" width="6" height="10" fill="#ef4444" opacity="0.7" rx="1"/>
              {/* Линия LL цены */}
              <line x1="85" y1="59" x2="115" y2="64" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="4,2"/>
              <circle cx="85" cy="59" r="3" fill="none" stroke="#ef4444" strokeWidth="1.2"/>
              <circle cx="115" cy="64" r="3" fill="none" stroke="#ef4444" strokeWidth="1.2"/>
              <text x="68" y="72" fontSize="7" fill="#ef4444" fontFamily="monospace">Дно 1</text>
              <text x="105" y="80" fontSize="7" fill="#ef4444" fontFamily="monospace">Дно 2↓</text>
              <text x="82" y="46" fontSize="7" fill="#ef4444" fontFamily="monospace">LL ↘</text>
              {/* Разворот вверх */}
              <polyline points="115,58 135,40 155,25 175,15" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4,2"/>
              <text x="158" y="20" fontSize="7" fill="#22c55e" fontFamily="monospace">↑ рост</text>

              {/* RSI */}
              <line x1="6" y1="128" x2="214" y2="128" stroke="#374151" strokeWidth="0.5" strokeDasharray="2,2"/>
              <text x="196" y="131" fontSize="6" fill="#374151" fontFamily="monospace">30</text>
              <polyline points="10,115 30,118 50,132 70,125 85,138" fill="none" stroke="#6b7280" strokeWidth="1"/>
              {/* RSI дно 1 */}
              <circle cx="85" cy="138" r="3" fill="none" stroke="#22c55e" strokeWidth="1.2"/>
              <polyline points="85,138 100,130 115,122" fill="none" stroke="#6b7280" strokeWidth="1"/>
              {/* RSI дно 2 (выше) */}
              <circle cx="115" cy="122" r="3" fill="none" stroke="#22c55e" strokeWidth="1.2"/>
              <line x1="85" y1="138" x2="115" y2="122" stroke="#22c55e" strokeWidth="1.2" strokeDasharray="4,2"/>
              <text x="58" y="152" fontSize="7" fill="#22c55e" fontFamily="monospace">RSI дно 1</text>
              <text x="100" y="116" fontSize="7" fill="#22c55e" fontFamily="monospace">RSI↑ (выше)</text>
              <text x="72" y="168" fontSize="7" fill="#22c55e" fontFamily="monospace">HL ↗ — расхождение!</text>

              {/* Вертикали */}
              <line x1="85" y1="48" x2="85" y2="175" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2,3" opacity="0.3"/>
              <line x1="115" y1="44" x2="115" y2="175" stroke="#22c55e" strokeWidth="0.5" strokeDasharray="2,3" opacity="0.3"/>
              {/* Вход */}
              <circle cx="115" cy="58" r="4" fill="#22c55e" opacity="0.85"/>
              <text x="120" y="54" fontSize="7" fill="#22c55e" fontFamily="monospace">← ВХОД</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Медвежья дивергенция */}
      <div className="border border-red-500/30 bg-red-500/5 rounded-xl p-4">
        <div className="text-red-400 font-orbitron text-xs font-bold mb-3">Медвежья дивергенция — сигнал разворота вниз</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
          <div>
            <p className="text-zinc-300 text-xs font-space-mono leading-relaxed mb-3">Возникает в конце <span className="text-green-400 font-bold">восходящего тренда</span>. Цена растёт всё выше, но RSI уже не подтверждает — это значит, что покупатели выдыхаются.</p>
            <div className="space-y-2">
              <div className="bg-zinc-800 rounded-lg p-2 flex items-center gap-2">
                <span className="text-green-400 font-bold font-space-mono text-xs w-16 shrink-0">Цена:</span>
                <span className="text-zinc-300 text-xs font-space-mono">делает <span className="text-green-400 font-bold">более высокий максимум</span> (HH). Второй пик выше первого.</span>
              </div>
              <div className="bg-zinc-800 rounded-lg p-2 flex items-center gap-2">
                <span className="text-green-400 font-bold font-space-mono text-xs w-16 shrink-0">RSI:</span>
                <span className="text-zinc-300 text-xs font-space-mono">делает <span className="text-red-400 font-bold">более низкий максимум</span> (LH). RSI не растёт вместе с ценой.</span>
              </div>
              <div className="bg-red-500/10 rounded-lg p-2">
                <span className="text-red-300 text-xs font-space-mono">→ Быки слабеют. Ждём разворот вниз.</span>
              </div>
            </div>
          </div>
          <div>
            <svg viewBox="0 0 220 180" className="w-full h-44 rounded-lg bg-zinc-950 p-1">
              <text x="8" y="12" fontSize="7" fill="#6b7280" fontFamily="monospace">Цена</text>
              <text x="8" y="102" fontSize="7" fill="#6b7280" fontFamily="monospace">RSI</text>
              <line x1="6" y1="92" x2="214" y2="92" stroke="#27272a" strokeWidth="1"/>

              {/* Цена: восходящий тренд + два пика */}
              <polyline points="10,80 30,72 50,65 70,70 85,48" fill="none" stroke="#6b7280" strokeWidth="1"/>
              {/* Пик 1 */}
              <line x1="85" y1="38" x2="85" y2="55" stroke="#22c55e" strokeWidth="1"/>
              <rect x="82" y="42" width="6" height="8" fill="#22c55e" opacity="0.7" rx="1"/>
              {/* Спуск */}
              <polyline points="85,48 100,58 115,50" fill="none" stroke="#6b7280" strokeWidth="1"/>
              {/* Пик 2 (выше) */}
              <line x1="115" y1="28" x2="115" y2="52" stroke="#22c55e" strokeWidth="1"/>
              <rect x="112" y="32" width="6" height="10" fill="#22c55e" opacity="0.7" rx="1"/>
              {/* Линия HH цены */}
              <line x1="85" y1="44" x2="115" y2="34" stroke="#22c55e" strokeWidth="1.2" strokeDasharray="4,2"/>
              <circle cx="85" cy="44" r="3" fill="none" stroke="#22c55e" strokeWidth="1.2"/>
              <circle cx="115" cy="34" r="3" fill="none" stroke="#22c55e" strokeWidth="1.2"/>
              <text x="62" y="40" fontSize="7" fill="#22c55e" fontFamily="monospace">Пик 1</text>
              <text x="104" y="26" fontSize="7" fill="#22c55e" fontFamily="monospace">Пик 2↑</text>
              <text x="82" y="70" fontSize="7" fill="#22c55e" fontFamily="monospace">HH ↗</text>
              {/* Разворот вниз */}
              <polyline points="115,42 135,58 155,72 175,84" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,2"/>
              <text x="158" y="82" fontSize="7" fill="#ef4444" fontFamily="monospace">↓ падение</text>

              {/* RSI */}
              <line x1="6" y1="118" x2="214" y2="118" stroke="#374151" strokeWidth="0.5" strokeDasharray="2,2"/>
              <text x="196" y="116" fontSize="6" fill="#374151" fontFamily="monospace">70</text>
              <polyline points="10,130 30,124 50,118 70,122 85,108" fill="none" stroke="#6b7280" strokeWidth="1"/>
              {/* RSI пик 1 */}
              <circle cx="85" cy="108" r="3" fill="none" stroke="#ef4444" strokeWidth="1.2"/>
              <polyline points="85,108 100,116 115,120" fill="none" stroke="#6b7280" strokeWidth="1"/>
              {/* RSI пик 2 (ниже) */}
              <circle cx="115" cy="120" r="3" fill="none" stroke="#ef4444" strokeWidth="1.2"/>
              <line x1="85" y1="108" x2="115" y2="120" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="4,2"/>
              <text x="60" y="104" fontSize="7" fill="#ef4444" fontFamily="monospace">RSI пик 1</text>
              <text x="100" y="134" fontSize="7" fill="#ef4444" fontFamily="monospace">RSI↓ (ниже)</text>
              <text x="68" y="168" fontSize="7" fill="#ef4444" fontFamily="monospace">LH ↘ — расхождение!</text>

              {/* Вертикали */}
              <line x1="85" y1="38" x2="85" y2="175" stroke="#22c55e" strokeWidth="0.5" strokeDasharray="2,3" opacity="0.3"/>
              <line x1="115" y1="28" x2="115" y2="175" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2,3" opacity="0.3"/>
              {/* Вход */}
              <circle cx="115" cy="34" r="4" fill="#ef4444" opacity="0.85"/>
              <text x="120" y="30" fontSize="7" fill="#ef4444" fontFamily="monospace">← ВХОД</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Реальные примеры */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
          <div className="text-green-400 font-orbitron text-xs font-bold mb-2">Реальный пример: бычья дивергенция ETH, ноябрь 2022</div>
          <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">ETH достиг дна $1,080 (минимум 1), затем $1,070 (минимум 2 — ниже). Цена сделала новый лоу. RSI в первом дне был 22, во втором — 29. RSI не подтвердил новый минимум = бычья дивергенция. Трейдеры, заметившие это на D1, купили с целью $1,350. Через 6 недель ETH торговался по $1,580.</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          <div className="text-red-400 font-orbitron text-xs font-bold mb-2">Реальный пример: медвежья дивергенция BTC, ноябрь 2021</div>
          <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">BTC достиг пика $61,800 (максимум 1), затем $69,000 (максимум 2 — выше). Цена сделала новый хай. RSI на первом пике был 78, на втором — 68. RSI не подтвердил новый максимум = медвежья дивергенция. Трейдеры, заметившие это на W1, закрыли лонги. Через 2 месяца BTC торговался по $33,000 — падение на 52%.</p>
        </div>
      </div>
    </div>
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
      <div className="text-red-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Эндрю Кардвелл и «позитивный» RSI</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Эндрю Кардвелл — ученик Уайлдера, создателя RSI — разработал концепцию «позитивных и негативных реверсалов» RSI.
        Он обнаружил, что в бычьем тренде RSI работает иначе: уровни перекупленности (70+) не являются сигналом продажи.
        Наоборот — RSI выше 70 в бычьем тренде говорит о силе, а не слабости.
        «Стандартное использование RSI как сигнала разворота — самая распространённая ошибка», — говорил Кардвелл.
        Дивергенция работает, только если вы учитываете контекст тренда.
      </p>
    </div>
  </div>
)
