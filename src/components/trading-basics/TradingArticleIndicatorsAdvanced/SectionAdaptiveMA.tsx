import React from "react"

const AdaptiveChart = () => (
  <svg viewBox="0 0 380 160" className="w-full h-40">
    <defs>
      <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
      </linearGradient>
    </defs>

    {/* Grid */}
    {[40, 70, 100, 130].map(y => (
      <line key={y} x1="0" y1={y} x2="380" y2={y} stroke="#27272a" strokeWidth="1" />
    ))}

    {/* Price bars */}
    {[
      [20, 120, 95], [40, 100, 115], [60, 105, 90], [80, 90, 105],
      [100, 85, 75], [120, 75, 85], [140, 65, 75], [160, 55, 65],
      [180, 45, 55], [200, 48, 42], [220, 55, 48], [240, 70, 55],
      [260, 85, 70], [280, 95, 85], [300, 110, 95], [320, 105, 115],
      [340, 95, 105], [360, 100, 90],
    ].map(([x, high, low], i) => (
      <rect key={i} x={x + 8} y={Math.min(high, low)} width="8"
        height={Math.abs(high - low)} fill={high < low ? "#22c55e" : "#ef4444"} opacity="0.6" />
    ))}

    {/* Simple MA (slow, lags) — красная пунктир */}
    <polyline
      points="20,107 40,107 60,105 80,100 100,95 120,88 140,80 160,70 180,62 200,57 220,54 240,57 260,65 280,75 300,85 320,92 340,95 360,95"
      fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5,3" opacity="0.7"
    />

    {/* KAMA (адаптивная) — зелёная */}
    <polyline
      points="20,107 40,106 60,104 80,99 100,91 120,80 140,68 160,57 180,47 200,45 220,47 240,58 260,72 280,86 300,98 320,106 340,103 360,99"
      fill="none" stroke="#22c55e" strokeWidth="2" opacity="0.9"
    />

    {/* VIDYA (волатильная) — фиолетовая */}
    <polyline
      points="20,108 40,107 60,103 80,97 100,88 120,77 140,65 160,54 180,45 200,43 220,46 240,60 260,75 280,89 300,101 320,108 340,104 360,98"
      fill="none" stroke="#a78bfa" strokeWidth="2" opacity="0.9"
    />

    {/* Метки зон */}
    <rect x="60" y="125" width="70" height="16" rx="4" fill="#ef4444" fillOpacity="0.15" />
    <text x="95" y="136" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="monospace">нисходящий тренд</text>

    <rect x="200" y="125" width="60" height="16" rx="4" fill="#22c55e" fillOpacity="0.15" />
    <text x="230" y="136" textAnchor="middle" fill="#22c55e" fontSize="9" fontFamily="monospace">боковик</text>

    <rect x="290" y="125" width="70" height="16" rx="4" fill="#3b82f6" fillOpacity="0.15" />
    <text x="325" y="136" textAnchor="middle" fill="#3b82f6" fontSize="9" fontFamily="monospace">восстановление</text>

    {/* Легенда */}
    <line x1="14" y1="12" x2="34" y2="12" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5,3" />
    <text x="37" y="16" fill="#ef4444" fontSize="9" fontFamily="monospace">EMA (обычная)</text>

    <line x1="120" y1="12" x2="140" y2="12" stroke="#22c55e" strokeWidth="2" />
    <text x="143" y="16" fill="#22c55e" fontSize="9" fontFamily="monospace">KAMA</text>

    <line x1="200" y1="12" x2="220" y2="12" stroke="#a78bfa" strokeWidth="2" />
    <text x="223" y="16" fill="#a78bfa" fontSize="9" fontFamily="monospace">VIDYA</text>
  </svg>
)

export const SectionAdaptiveMA = () => (
  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">
    <div className="text-white font-orbitron text-xs font-bold">
      Адаптивные скользящие: КАМА и VIDYA
    </div>

    <p className="text-gray-300 text-sm leading-relaxed">
      Обычные MA усредняют данные с фиксированной скоростью — в боковике они генерируют ложные сигналы,
      на тренде запаздывают. Адаптивные MA решают это: они сами замедляются в боковике и ускоряются на тренде.
    </p>

    {/* График */}
    <div className="bg-zinc-900 rounded-xl p-3">
      <div className="text-zinc-500 font-space-mono text-xs mb-2">Сравнение реакции на рыночные фазы</div>
      <AdaptiveChart />
      <p className="text-zinc-600 text-xs font-space-mono mt-1 text-center">
        На тренде EMA запаздывает — KAMA и VIDYA следуют ближе. В боковике они замирают, EMA шумит.
      </p>
    </div>

    {/* KAMA */}
    <div className="bg-zinc-900 border border-indigo-500/20 rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="bg-indigo-500/20 text-indigo-300 font-orbitron text-xs px-2 py-0.5 rounded">KAMA</span>
        <span className="text-zinc-400 text-xs font-space-mono">Kaufman's Adaptive Moving Average</span>
      </div>
      <p className="text-gray-300 text-xs leading-relaxed">
        Создана Перри Кауфманом в 1995 году. Ключевая идея — <span className="text-indigo-300">Efficiency Ratio (ER)</span>: отношение направленного движения к суммарному пути цены.
      </p>
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-space-mono text-xs space-y-1">
        <div className="text-zinc-500">Логика расчёта:</div>
        <div className="text-indigo-300">ER = |Цена[n] − Цена[n−10]| / Σ|Δцена за 10 баров|</div>
        <div className="text-zinc-400 text-xs mt-1">
          ER → 1: цена идёт прямо (тренд) → MA ускоряется<br />
          ER → 0: цена топчется (боковик) → MA почти замирает
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
          <div className="text-green-400 font-orbitron text-xs font-bold mb-1">Плюсы</div>
          <ul className="text-zinc-400 text-xs font-space-mono space-y-0.5">
            <li>— минимум ложных сигналов в боковике</li>
            <li>— быстрая реакция на начало тренда</li>
            <li>— хорошо как фильтр направления</li>
          </ul>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
          <div className="text-red-400 font-orbitron text-xs font-bold mb-1">Минусы</div>
          <ul className="text-zinc-400 text-xs font-space-mono space-y-0.5">
            <li>— нет в стандартном наборе большинства терминалов</li>
            <li>— требует ручной настройки периода ER</li>
            <li>— отстаёт на резких разворотах</li>
          </ul>
        </div>
      </div>
    </div>

    {/* VIDYA */}
    <div className="bg-zinc-900 border border-violet-500/20 rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="bg-violet-500/20 text-violet-300 font-orbitron text-xs px-2 py-0.5 rounded">VIDYA</span>
        <span className="text-zinc-400 text-xs font-space-mono">Variable Index Dynamic Average</span>
      </div>
      <p className="text-gray-300 text-xs leading-relaxed">
        Автор — Тушар Чанде, 1992 год. В отличие от КАМА, скорость адаптации основана не на направлении движения,
        а на <span className="text-violet-300">волатильности</span> через индекс Чанде (CMO).
      </p>
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-space-mono text-xs space-y-1">
        <div className="text-zinc-500">Логика расчёта:</div>
        <div className="text-violet-300">VIDYA = k × CMO × Цена + (1 − k × CMO) × VIDYA[-1]</div>
        <div className="text-zinc-400 text-xs mt-1">
          Высокий CMO (сильный тренд) → MA гибкая, следует за ценой<br />
          Низкий CMO (хаос, боковик) → MA плавная, игнорирует шум
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
          <div className="text-green-400 font-orbitron text-xs font-bold mb-1">Плюсы</div>
          <ul className="text-zinc-400 text-xs font-space-mono space-y-0.5">
            <li>— чувствительнее КАМА на волатильных рынках</li>
            <li>— хорошо работает на крипте и фьючерсах</li>
            <li>— встроена в TradingView</li>
          </ul>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
          <div className="text-red-400 font-orbitron text-xs font-bold mb-1">Минусы</div>
          <ul className="text-zinc-400 text-xs font-space-mono space-y-0.5">
            <li>— реагирует на любую волатильность, не только трендовую</li>
            <li>— может давать ложные входы при спайках</li>
            <li>— сложнее в интерпретации</li>
          </ul>
        </div>
      </div>
    </div>

    {/* Сравнение */}
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
      <div className="text-zinc-400 font-orbitron text-xs px-4 py-2 border-b border-zinc-800">KAMA vs VIDYA — когда что использовать</div>
      <table className="w-full text-xs font-space-mono">
        <thead>
          <tr className="border-b border-zinc-800">
            {["Ситуация", "KAMA", "VIDYA"].map(h => (
              <th key={h} className="text-left px-3 py-2 text-zinc-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            ["Устойчивый тренд", "✅ отлично", "✅ отлично"],
            ["Боковик / диапазон", "✅ замирает", "⚠️ может шуметь"],
            ["Резкий пробой", "⚠️ запаздывает", "✅ реагирует быстрее"],
            ["Крипта, высокая волатильность", "⚠️ средне", "✅ предпочтительнее"],
            ["Фондовый рынок (акции)", "✅ предпочтительнее", "⚠️ средне"],
            ["В связке с RSI / MACD", "✅ как фильтр направления", "✅ как фильтр направления"],
          ].map(([sit, kama, vidya], i) => (
            <tr key={i} className="border-b border-zinc-900 hover:bg-zinc-900/40">
              <td className="px-3 py-2 text-zinc-300">{sit}</td>
              <td className="px-3 py-2 text-indigo-300">{kama}</td>
              <td className="px-3 py-2 text-violet-300">{vidya}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Практика */}
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
      <div className="text-blue-400 font-orbitron text-xs font-bold mb-2">Как применять на практике</div>
      <div className="space-y-2 text-zinc-300 text-xs font-space-mono leading-relaxed">
        <p><span className="text-blue-300">1. Фильтр тренда:</span> открывайте сделки только в направлении KAMA/VIDYA — отсекает большинство контртрендовых ловушек.</p>
        <p><span className="text-blue-300">2. Точка входа:</span> ждите, когда цена откатывается к КАМА и RSI выходит из перепроданности — это подтверждённый сетап.</p>
        <p><span className="text-blue-300">3. Трейлинг-стоп:</span> переставляйте стоп вслед за VIDYA — она автоматически "дышит" вместе с волатильностью рынка.</p>
      </div>
    </div>

    {/* Про ботов */}
    <div className="bg-zinc-900 border border-yellow-500/20 rounded-xl p-3">
      <div className="text-yellow-400 font-orbitron text-xs font-bold mb-1">Боты и адаптивные MA</div>
      <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">
        Торговые боты особенно выигрывают от KAMA и VIDYA: они работают 24/7 и сталкиваются со всеми фазами рынка.
        Адаптивная MA автоматически переключает режим — бот торгует на тренде и пропускает боковик без ручного вмешательства.
        В коде: вместо EMA-фильтра подставьте KAMA — и процент ложных сигналов снизится на 30–40%.
      </p>
    </div>
  </div>
)
