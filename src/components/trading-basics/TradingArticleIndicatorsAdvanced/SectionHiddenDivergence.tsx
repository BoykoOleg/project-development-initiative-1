import React from "react"

export const SectionHiddenDivergence = () => (
  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">
    <div>
      <div className="text-white font-orbitron text-xs font-bold mb-2">Скрытые дивергенции (Hidden Divergence)</div>
      <p className="text-gray-300 text-sm leading-relaxed">
        Обычная дивергенция говорит: «тренд слабеет, жди разворота». Скрытая говорит противоположное — «это просто коррекция, тренд продолжится». Скрытую дивергенцию видят немногие — и именно поэтому она так хорошо работает.
      </p>
    </div>

    <div className="bg-zinc-900 rounded-xl p-3 text-xs font-space-mono text-zinc-400 leading-relaxed">
      Ключевое отличие: при скрытой дивергенции <span className="text-white font-bold">цена</span> и <span className="text-white font-bold">RSI</span> «меняются ролями» — цена уже развернулась в сторону тренда, а RSI ещё «не верит» в это движение. Это и есть сигнал.
    </div>

    {/* Скрытая бычья */}
    <div className="border border-green-500/30 bg-green-500/5 rounded-xl p-4">
      <div className="text-green-400 font-orbitron text-xs font-bold mb-3">Скрытая бычья дивергенция (HD+) — продолжение роста</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-zinc-300 text-xs font-space-mono leading-relaxed mb-3">
            Происходит во время <span className="text-green-400 font-bold">восходящего тренда</span>, когда цена делает откат вниз (коррекцию). Сигнал о том, что коррекция заканчивается и рост продолжится.
          </p>
          <div className="space-y-2">
            <div className="bg-zinc-900 rounded-lg p-2 flex items-center gap-2">
              <span className="text-green-400 font-bold font-space-mono text-xs w-16 shrink-0">Цена:</span>
              <span className="text-zinc-300 text-xs font-space-mono">делает <span className="text-green-400 font-bold">более высокий минимум</span> (HL — Higher Low). Второе дно выше первого.</span>
            </div>
            <div className="bg-zinc-900 rounded-lg p-2 flex items-center gap-2">
              <span className="text-red-400 font-bold font-space-mono text-xs w-16 shrink-0">RSI:</span>
              <span className="text-zinc-300 text-xs font-space-mono">делает <span className="text-red-400 font-bold">более низкий минимум</span> (LL — Lower Low). RSI «расстроен» сильнее, чем цена.</span>
            </div>
            <div className="bg-green-500/10 rounded-lg p-2">
              <span className="text-green-300 text-xs font-space-mono">→ Результат: входим в лонг на коррекции, ожидаем продолжение роста</span>
            </div>
          </div>
        </div>

        {/* SVG скрытая бычья */}
        <div>
          <svg viewBox="0 0 220 180" className="w-full h-44 rounded-lg bg-zinc-900 p-1">
            {/* Заголовки */}
            <text x="8" y="12" fontSize="7" fill="#6b7280" fontFamily="monospace">Цена</text>
            <text x="8" y="102" fontSize="7" fill="#6b7280" fontFamily="monospace">RSI</text>
            <line x1="6" y1="92" x2="214" y2="92" stroke="#3f3f46" strokeWidth="1"/>

            {/* === ЦЕНА === */}
            {/* Тренд вверх фон */}
            <polyline points="10,75 35,55 60,62 85,38 110,46 135,24 160,32 185,18" fill="none" stroke="#3f3f46" strokeWidth="0.8" strokeDasharray="3,2"/>
            <text x="150" y="14" fontSize="6" fill="#3f3f46" fontFamily="monospace">Восх. тренд</text>

            {/* Свечи — коррекция: первое дно */}
            <line x1="60" y1="55" x2="60" y2="72" stroke="#ef4444" strokeWidth="1"/>
            <rect x="57" y="62" width="6" height="10" fill="#ef4444" opacity="0.7" rx="1"/>

            {/* Второе дно (выше первого — HL) */}
            <line x1="110" y1="40" x2="110" y2="56" stroke="#ef4444" strokeWidth="1"/>
            <rect x="107" y="46" width="6" height="10" fill="#ef4444" opacity="0.7" rx="1"/>

            {/* Стрелки и линии HL */}
            <line x1="60" y1="68" x2="110" y2="52" stroke="#22c55e" strokeWidth="1.2" strokeDasharray="4,2"/>
            <circle cx="60" cy="68" r="3" fill="none" stroke="#22c55e" strokeWidth="1.2"/>
            <circle cx="110" cy="52" r="3" fill="none" stroke="#22c55e" strokeWidth="1.2"/>
            <text x="62" y="80" fontSize="7" fill="#22c55e" fontFamily="monospace">Дно 1</text>
            <text x="100" y="64" fontSize="7" fill="#22c55e" fontFamily="monospace">Дно 2 (выше)</text>
            <text x="68" y="48" fontSize="7" fill="#22c55e" fontFamily="monospace">HL ↗</text>

            {/* Продолжение роста */}
            <polyline points="110,46 135,28 160,20 185,10" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4,2"/>
            <text x="162" y="18" fontSize="7" fill="#22c55e" fontFamily="monospace">→ рост</text>

            {/* === RSI === */}
            <line x1="6" y1="130" x2="214" y2="130" stroke="#374151" strokeWidth="0.5" strokeDasharray="2,2"/>
            <text x="196" y="133" fontSize="6" fill="#374151" fontFamily="monospace">50</text>

            {/* RSI путь — первый минимум */}
            <polyline points="10,115 35,120 60,138 85,118 110,144 135,120 185,115" fill="none" stroke="#6b7280" strokeWidth="1"/>

            {/* Точки RSI дна */}
            <circle cx="60" cy="138" r="3" fill="none" stroke="#ef4444" strokeWidth="1.2"/>
            <circle cx="110" cy="144" r="3" fill="none" stroke="#ef4444" strokeWidth="1.2"/>
            <line x1="60" y1="138" x2="110" y2="144" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="4,2"/>
            <text x="42" y="152" fontSize="7" fill="#ef4444" fontFamily="monospace">RSI мин 1</text>
            <text x="98" y="158" fontSize="7" fill="#ef4444" fontFamily="monospace">RSI мин 2 (ниже)</text>
            <text x="62" y="170" fontSize="7" fill="#ef4444" fontFamily="monospace">LL ↘</text>

            {/* Вертикальные пунктиры */}
            <line x1="60" y1="55" x2="60" y2="175" stroke="#22c55e" strokeWidth="0.5" strokeDasharray="2,3" opacity="0.4"/>
            <line x1="110" y1="40" x2="110" y2="175" stroke="#22c55e" strokeWidth="0.5" strokeDasharray="2,3" opacity="0.4"/>

            {/* Вход */}
            <circle cx="110" cy="46" r="4" fill="#22c55e" opacity="0.8"/>
            <text x="115" y="42" fontSize="7" fill="#22c55e" fontFamily="monospace">← ВХОД</text>
          </svg>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-lg p-3 text-xs font-space-mono text-zinc-400 leading-relaxed">
        <span className="text-green-400 font-bold">Пример:</span> BTC растёт с $40k до $60k. Откатывается до $52k, затем до $55k (второй откат выше первого). При этом RSI на втором откате падает ниже, чем на первом. Это скрытая бычья — покупаем на $55k, цель $60k и выше.
      </div>
    </div>

    {/* Скрытая медвежья */}
    <div className="border border-red-500/30 bg-red-500/5 rounded-xl p-4">
      <div className="text-red-400 font-orbitron text-xs font-bold mb-3">Скрытая медвежья дивергенция (HD−) — продолжение падения</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-zinc-300 text-xs font-space-mono leading-relaxed mb-3">
            Происходит во время <span className="text-red-400 font-bold">нисходящего тренда</span>, когда цена делает отскок вверх. Сигнал о том, что отскок заканчивается и падение продолжится.
          </p>
          <div className="space-y-2">
            <div className="bg-zinc-900 rounded-lg p-2 flex items-center gap-2">
              <span className="text-green-400 font-bold font-space-mono text-xs w-16 shrink-0">Цена:</span>
              <span className="text-zinc-300 text-xs font-space-mono">делает <span className="text-red-400 font-bold">более низкий максимум</span> (LH — Lower High). Второй пик ниже первого.</span>
            </div>
            <div className="bg-zinc-900 rounded-lg p-2 flex items-center gap-2">
              <span className="text-green-400 font-bold font-space-mono text-xs w-16 shrink-0">RSI:</span>
              <span className="text-zinc-300 text-xs font-space-mono">делает <span className="text-green-400 font-bold">более высокий максимум</span> (HH — Higher High). RSI «оптимистичнее» цены.</span>
            </div>
            <div className="bg-red-500/10 rounded-lg p-2">
              <span className="text-red-300 text-xs font-space-mono">→ Результат: входим в шорт на отскоке, ожидаем продолжение падения</span>
            </div>
          </div>
        </div>

        {/* SVG скрытая медвежья */}
        <div>
          <svg viewBox="0 0 220 180" className="w-full h-44 rounded-lg bg-zinc-900 p-1">
            <text x="8" y="12" fontSize="7" fill="#6b7280" fontFamily="monospace">Цена</text>
            <text x="8" y="102" fontSize="7" fill="#6b7280" fontFamily="monospace">RSI</text>
            <line x1="6" y1="92" x2="214" y2="92" stroke="#3f3f46" strokeWidth="1"/>

            {/* Тренд вниз фон */}
            <polyline points="10,18 35,28 60,22 85,38 110,32 135,50 160,44 185,65" fill="none" stroke="#3f3f46" strokeWidth="0.8" strokeDasharray="3,2"/>
            <text x="148" y="60" fontSize="6" fill="#3f3f46" fontFamily="monospace">Нисх. тренд</text>

            {/* Свечи — отскок: первый пик */}
            <line x1="60" y1="18" x2="60" y2="30" stroke="#22c55e" strokeWidth="1"/>
            <rect x="57" y="22" width="6" height="8" fill="#22c55e" opacity="0.7" rx="1"/>

            {/* Второй пик (ниже первого — LH) */}
            <line x1="110" y1="26" x2="110" y2="40" stroke="#22c55e" strokeWidth="1"/>
            <rect x="107" y="32" width="6" height="8" fill="#22c55e" opacity="0.7" rx="1"/>

            {/* Линии LH */}
            <line x1="60" y1="24" x2="110" y2="34" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="4,2"/>
            <circle cx="60" cy="24" r="3" fill="none" stroke="#ef4444" strokeWidth="1.2"/>
            <circle cx="110" cy="34" r="3" fill="none" stroke="#ef4444" strokeWidth="1.2"/>
            <text x="38" y="20" fontSize="7" fill="#ef4444" fontFamily="monospace">Пик 1</text>
            <text x="85" y="30" fontSize="7" fill="#ef4444" fontFamily="monospace">Пик 2 (ниже)</text>
            <text x="65" y="46" fontSize="7" fill="#ef4444" fontFamily="monospace">LH ↘</text>

            {/* Продолжение падения */}
            <polyline points="110,36 135,52 160,66 185,80" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,2"/>
            <text x="162" y="76" fontSize="7" fill="#ef4444" fontFamily="monospace">→ падение</text>

            {/* === RSI === */}
            <line x1="6" y1="130" x2="214" y2="130" stroke="#374151" strokeWidth="0.5" strokeDasharray="2,2"/>
            <text x="196" y="133" fontSize="6" fill="#374151" fontFamily="monospace">50</text>

            {/* RSI путь */}
            <polyline points="10,145 35,140 60,118 85,140 110,112 135,132 185,145" fill="none" stroke="#6b7280" strokeWidth="1"/>

            {/* Точки RSI пиков */}
            <circle cx="60" cy="118" r="3" fill="none" stroke="#22c55e" strokeWidth="1.2"/>
            <circle cx="110" cy="112" r="3" fill="none" stroke="#22c55e" strokeWidth="1.2"/>
            <line x1="60" y1="118" x2="110" y2="112" stroke="#22c55e" strokeWidth="1.2" strokeDasharray="4,2"/>
            <text x="40" y="114" fontSize="7" fill="#22c55e" fontFamily="monospace">RSI пик 1</text>
            <text x="98" y="108" fontSize="7" fill="#22c55e" fontFamily="monospace">RSI пик 2 (выше)</text>
            <text x="62" y="170" fontSize="7" fill="#22c55e" fontFamily="monospace">HH ↗</text>

            {/* Вертикальные пунктиры */}
            <line x1="60" y1="18" x2="60" y2="175" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2,3" opacity="0.4"/>
            <line x1="110" y1="26" x2="110" y2="175" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2,3" opacity="0.4"/>

            {/* Вход */}
            <circle cx="110" cy="34" r="4" fill="#ef4444" opacity="0.8"/>
            <text x="115" y="30" fontSize="7" fill="#ef4444" fontFamily="monospace">← ВХОД</text>
          </svg>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-lg p-3 text-xs font-space-mono text-zinc-400 leading-relaxed">
        <span className="text-red-400 font-bold">Пример:</span> BTC падает с $60k до $45k. Отскакивает до $52k, затем до $49k (второй отскок ниже первого). При этом RSI на втором отскоке поднимается выше, чем на первом. Это скрытая медвежья — продаём на $49k, цель $45k и ниже.
      </div>
    </div>

    {/* Сравнительная таблица */}
    <div className="bg-zinc-900 rounded-xl p-3 overflow-x-auto">
      <div className="text-zinc-400 font-orbitron text-xs font-bold mb-2">Быстрое сравнение: обычная vs скрытая</div>
      <table className="w-full text-xs font-space-mono">
        <thead>
          <tr className="border-b border-zinc-800">
            {["Тип", "Цена", "RSI", "Сигнал", "Направление"].map(h => (
              <th key={h} className="text-left px-2 py-2 text-zinc-500 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {[
            ["Обычная бычья", "LL (ниже)", "HL (выше)", "Разворот ↑", "text-green-400"],
            ["Скрытая бычья ★", "HL (выше)", "LL (ниже)", "Продолжение ↑", "text-green-400"],
            ["Обычная медвежья", "HH (выше)", "LH (ниже)", "Разворот ↓", "text-red-400"],
            ["Скрытая медвежья ★", "LH (ниже)", "HH (выше)", "Продолжение ↓", "text-red-400"],
          ].map(([type, price, rsi, signal, color]) => (
            <tr key={type} className="hover:bg-zinc-800/50">
              <td className={`px-2 py-2 font-bold ${color}`}>{type}</td>
              <td className="px-2 py-2 text-zinc-300">{price}</td>
              <td className="px-2 py-2 text-zinc-300">{rsi}</td>
              <td className={`px-2 py-2 font-bold ${color}`}>{signal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
      <div className="text-purple-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Констанс Браун и скрытые дивергенции</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Констанс Браун — CMT-аналитик и автор книги «Technical Analysis for the Trading Professional» —
        популяризировала концепцию скрытых дивергенций как инструмент профессиональных трейдеров.
        Она обнаружила, что скрытая дивергенция имеет более высокую вероятность отработки в трендовых условиях, чем обычная.
        «Обычная дивергенция — сигнал усталости. Скрытая — сигнал возобновления силы».
        Именно Браун впервые описала «бычьи» и «медвежьи» зоны RSI, радикально изменив подход к его интерпретации.
      </p>
    </div>
  </div>
)
