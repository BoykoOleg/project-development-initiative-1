import React from "react"

const JMAChart = () => (
  <svg viewBox="0 0 380 160" className="w-full h-40">
    {/* Grid */}
    {[40, 70, 100, 130].map(y => (
      <line key={y} x1="0" y1={y} x2="380" y2={y} stroke="#27272a" strokeWidth="1" />
    ))}

    {/* Price candles — резкий спайк вверх и разворот */}
    {[
      [10, 115, 105], [30, 112, 108], [50, 108, 112], [70, 110, 104],
      [90, 105, 98],  [110, 95, 88], [130, 80, 70],  [150, 60, 52],
      [170, 48, 42],  [190, 40, 35], [210, 38, 45],  [230, 50, 42],
      [250, 48, 38],  [270, 42, 50], [290, 55, 45],  [310, 65, 55],
      [330, 72, 65],  [350, 78, 70],
    ].map(([x, high, low], i) => (
      <rect key={i} x={x + 8} y={Math.min(high, low)} width="8"
        height={Math.abs(high - low) || 2}
        fill={high > low ? "#ef4444" : "#22c55e"} opacity="0.55" />
    ))}

    {/* EMA — красная пунктир, сильно запаздывает */}
    <polyline
      points="18,111 38,110 58,110 78,109 98,107 118,103 138,96 158,87 178,77 198,67 218,60 238,57 258,56 278,57 298,60 318,64 338,67 358,70"
      fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5,3" opacity="0.7"
    />

    {/* KAMA — зелёная, средняя */}
    <polyline
      points="18,112 38,111 58,110 78,108 98,104 118,97 138,87 158,74 178,60 198,47 218,42 238,41 258,42 278,46 298,52 318,58 338,64 358,69"
      fill="none" stroke="#22c55e" strokeWidth="1.8" opacity="0.8"
    />

    {/* JMA — голубая, минимальный лаг, плавная */}
    <polyline
      points="18,113 38,112 58,110 78,107 98,102 118,94 138,83 158,69 178,55 198,43 218,39 238,39 258,41 278,46 298,53 318,60 338,66 358,70"
      fill="none" stroke="#38bdf8" strokeWidth="2.5" opacity="0.95"
    />

    {/* Зона спайка */}
    <rect x="170" y="33" width="60" height="70" fill="#f59e0b" fillOpacity="0.04" stroke="#f59e0b" strokeOpacity="0.2" strokeWidth="1" rx="4" />
    <text x="200" y="28" textAnchor="middle" fill="#f59e0b" fontSize="9" fontFamily="monospace">спайк / разворот</text>

    {/* Легенда */}
    <line x1="10" y1="14" x2="28" y2="14" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5,3" />
    <text x="31" y="18" fill="#ef4444" fontSize="9" fontFamily="monospace">EMA</text>

    <line x1="80" y1="14" x2="98" y2="14" stroke="#22c55e" strokeWidth="1.8" />
    <text x="101" y="18" fill="#22c55e" fontSize="9" fontFamily="monospace">KAMA</text>

    <line x1="160" y1="14" x2="178" y2="14" stroke="#38bdf8" strokeWidth="2.5" />
    <text x="181" y="18" fill="#38bdf8" fontSize="9" fontFamily="monospace">JMA (минимальный лаг)</text>
  </svg>
)

export const SectionJMA = () => (
  <div className="bg-zinc-950 border border-sky-500/20 rounded-xl p-4 space-y-4">
    <div className="flex items-center gap-3">
      <span className="bg-sky-500/20 text-sky-300 font-orbitron text-xs px-2 py-0.5 rounded">JMA</span>
      <div className="text-white font-orbitron text-xs font-bold">Jurik Moving Average — скальперский стандарт</div>
    </div>

    <p className="text-gray-300 text-sm leading-relaxed">
      JMA создана Марком Юриком в 1998 году и до сих пор считается одной из самых точных MA.
      Она сочетает минимальный лаг с максимальным подавлением шума — то, чего обычные MA достичь не могут одновременно.
    </p>

    {/* График */}
    <div className="bg-zinc-900 rounded-xl p-3">
      <div className="text-zinc-500 font-space-mono text-xs mb-2">Реакция на резкий разворот цены</div>
      <JMAChart />
      <p className="text-zinc-600 text-xs font-space-mono mt-1 text-center">
        JMA следует за ценой плотнее KAMA, при этом остаётся гладкой — без дёрганий EMA
      </p>
    </div>

    {/* Как работает */}
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-2">
      <div className="text-sky-400 font-orbitron text-xs font-bold mb-2">Как устроена JMA</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Юрик применил <span className="text-sky-300">нелинейный адаптивный фильтр</span> с тремя параметрами:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[
          { param: "Length", desc: "Период сглаживания. Аналог периода в EMA — чем больше, тем плавнее.", color: "sky" },
          { param: "Phase", desc: "Смещение от −100 до +100. 0 — баланс. Плюс = быстрее, но больше шума. Минус = плавнее, но лаг.", color: "violet" },
          { param: "Power", desc: "Сила адаптации. Обычно 2. Выше — агрессивнее реагирует на тренд.", color: "amber" },
        ].map(({ param, desc, color }) => (
          <div key={param} className={`bg-${color}-500/10 border border-${color}-500/20 rounded-lg p-3`}>
            <div className={`text-${color}-300 font-orbitron text-xs font-bold mb-1`}>{param}</div>
            <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Сценарии применения */}
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
      <div className="text-zinc-400 font-orbitron text-xs px-4 py-2 border-b border-zinc-800">Настройки JMA под разные задачи</div>
      <table className="w-full text-xs font-space-mono">
        <thead>
          <tr className="border-b border-zinc-800">
            {["Задача", "Length", "Phase", "Характер"].map(h => (
              <th key={h} className="text-left px-3 py-2 text-zinc-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            ["Скальпинг (M1–M5)", "7–10", "+50…+100", "Быстро, чуть шумит"],
            ["Внутри дня (M15–H1)", "14–21", "0…+25", "Баланс скорость / шум"],
            ["Свинг-трейдинг (H4–D1)", "30–50", "−25…0", "Плавно, фильтр тренда"],
            ["Трейлинг-стоп для бота", "10–14", "−50…−25", "Медленно, без ложных пробоев"],
          ].map(([task, len, phase, char], i) => (
            <tr key={i} className="border-b border-zinc-900 hover:bg-zinc-900/40">
              <td className="px-3 py-2 text-zinc-300">{task}</td>
              <td className="px-3 py-2 text-sky-300 font-bold">{len}</td>
              <td className="px-3 py-2 text-violet-300">{phase}</td>
              <td className="px-3 py-2 text-zinc-400">{char}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* JMA vs KAMA vs VIDYA */}
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
      <div className="text-zinc-400 font-orbitron text-xs px-4 py-2 border-b border-zinc-800">JMA vs KAMA vs VIDYA — итоговое сравнение</div>
      <table className="w-full text-xs font-space-mono">
        <thead>
          <tr className="border-b border-zinc-800">
            {["", "JMA", "KAMA", "VIDYA"].map(h => (
              <th key={h} className="text-left px-3 py-2 text-zinc-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            ["Лаг", "🟢 минимальный", "🟡 средний", "🟡 средний"],
            ["Сглаживание шума", "🟢 отличное", "🟢 хорошее", "🟡 среднее"],
            ["Скальпинг", "🟢 лучший выбор", "🔴 не подходит", "🟡 удовлетворит."],
            ["Крипта (высокая волат.)", "🟢 отлично", "🟡 средне", "🟢 хорошо"],
            ["Настройка", "🟡 3 параметра", "🟢 1 параметр", "🟢 1 параметр"],
            ["Доступность", "🟡 TradingView (платный)", "🟢 бесплатно", "🟢 встроена в TV"],
          ].map(([crit, jma, kama, vidya], i) => (
            <tr key={i} className="border-b border-zinc-900 hover:bg-zinc-900/40">
              <td className="px-3 py-2 text-zinc-400">{crit}</td>
              <td className="px-3 py-2 text-sky-300">{jma}</td>
              <td className="px-3 py-2 text-indigo-300">{kama}</td>
              <td className="px-3 py-2 text-violet-300">{vidya}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Практика */}
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
      <div className="text-amber-400 font-orbitron text-xs font-bold mb-1">Практический сетап со JMA</div>
      <div className="text-zinc-300 text-xs font-space-mono leading-relaxed space-y-1">
        <p><span className="text-amber-300">Вход в лонг:</span> цена выше JMA(14,0) + RSI {">"} 50 + объём выше среднего → покупка на откате к JMA</p>
        <p><span className="text-amber-300">Стоп:</span> закрытие свечи ниже JMA(14,−50) — медленная версия как динамический стоп</p>
        <p><span className="text-amber-300">В боте:</span> JMA(7,+50) как быстрый сигнал + JMA(21,0) как фильтр направления — пересечение двух JMA вместо классического EMA-креста</p>
      </div>
    </div>

    <div className="bg-zinc-900 border border-yellow-500/20 rounded-xl p-3">
      <div className="text-yellow-400 font-orbitron text-xs font-bold mb-1">Где найти JMA</div>
      <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">
        TradingView: поиск «Jurik Moving Average» в индикаторах — доступны бесплатные скрипты сообщества.
        В Python: библиотека <span className="text-yellow-300">pandas-ta</span> не содержит JMA, но есть реализации на GitHub.
        Для ботов на Bybit / Binance — подключается через собственный расчёт или через TV-вебхук.
      </p>
    </div>
  </div>
)