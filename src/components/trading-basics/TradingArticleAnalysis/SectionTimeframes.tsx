import { TimeframeTable } from "../TradingCharts"

export const SectionTimeframes = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">Выбор тайм-фрейма определяет вашу жизнь как трейдера: сколько времени тратить, какой стресс испытывать, какой капитал нужен.</p>
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
      <div className="text-yellow-400 font-orbitron text-xs font-bold mb-2">Реальный пример: один актив, два тайм-фрейма — два разных взгляда</div>
      <p className="text-zinc-400 text-xs font-space-mono leading-relaxed mb-3">2 ноября 2023. На M15 ETH выглядит медвежьим: несколько красных свечей, RSI в зоне 35. На D1 — явный бычий тренд, ETH отбивается от поддержки $1,820 четвёртый раз. Трейдер, смотревший только M15, зашортил. Трейдер, работавший по D1+H4, купил. Через 3 дня ETH вырос до $2,050. Вывод: <span className="text-white">старший ТФ определяет направление, младший — точку входа.</span></p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-zinc-950 border border-red-500/20 rounded-xl p-3">
          <div className="text-red-400 font-orbitron text-[10px] font-bold mb-1">ETH / M15 — «медвежий»</div>
          <svg viewBox="0 0 160 80" className="w-full h-20">
            {[20, 40, 60].map(y => <line key={y} x1="10" y1={y} x2="155" y2={y} stroke="#27272a" strokeWidth="0.8"/>)}
            {[
              { x: 20, o: 22, c: 35, h: 38, l: 20 },
              { x: 35, o: 20, c: 30, h: 32, l: 18 },
              { x: 50, o: 18, c: 28, h: 30, l: 16 },
              { x: 65, o: 16, c: 26, h: 28, l: 14 },
              { x: 80, o: 14, c: 22, h: 25, l: 12 },
              { x: 95, o: 13, c: 20, h: 23, l: 11 },
            ].map((c, i) => (
              <g key={i}>
                <line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke="#ef4444" strokeWidth="1"/>
                <rect x={c.x - 5} y={Math.min(c.o, c.c)} width="10" height={Math.max(Math.abs(c.o - c.c), 2)} fill="#ef4444" rx="1"/>
              </g>
            ))}
            <text x="110" y="28" fontSize="7" fill="#ef4444" fontFamily="monospace">RSI: 35</text>
            <text x="110" y="40" fontSize="7" fill="#ef4444" fontFamily="monospace">↓ шорт?</text>
            <text x="10" y="76" fontSize="6" fill="#52525b" fontFamily="monospace">Локальный даунтренд → трейдер зашортил</text>
          </svg>
        </div>

        <div className="bg-zinc-950 border border-green-500/20 rounded-xl p-3">
          <div className="text-green-400 font-orbitron text-[10px] font-bold mb-1">ETH / D1 — «бычий»</div>
          <svg viewBox="0 0 160 80" className="w-full h-20">
            {[20, 40, 60].map(y => <line key={y} x1="10" y1={y} x2="155" y2={y} stroke="#27272a" strokeWidth="0.8"/>)}
            <line x1="10" y1="58" x2="155" y2="58" stroke="#22c55e" strokeWidth="1" strokeDasharray="4,2"/>
            <text x="120" y="56" fontSize="6" fill="#22c55e" fontFamily="monospace">$1,820</text>
            {[
              { x: 20, o: 58, c: 48, h: 60, l: 57 },
              { x: 38, o: 48, c: 38, h: 50, l: 46 },
              { x: 56, o: 58, c: 44, h: 60, l: 57 },
              { x: 74, o: 44, c: 32, h: 46, l: 43 },
              { x: 92, o: 58, c: 40, h: 60, l: 57 },
              { x: 110, o: 40, c: 22, h: 42, l: 38 },
            ].map((c, i) => (
              <g key={i}>
                <line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke="#22c55e" strokeWidth="1"/>
                <rect x={c.x - 5} y={Math.min(c.o, c.c)} width="10" height={Math.max(Math.abs(c.o - c.c), 2)} fill="#22c55e" rx="1"/>
              </g>
            ))}
            <text x="10" y="76" fontSize="6" fill="#52525b" fontFamily="monospace">4 отбоя от поддержки → трейдер купил</text>
          </svg>
        </div>
      </div>
    </div>

    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
      <div className="text-blue-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Александр Элдер и «тройной экран»</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Александр Элдер — психиатр, ставший трейдером, автор книги «Как играть и выигрывать на бирже» —
        разработал систему «Тройной экран»: три тайм-фрейма для одной сделки.
        Недельный график определяет направление, дневной — момент входа, часовой — точную цену.
        Он описывал это так: «Никогда не торгуй в направлении, противоположном недельному тренду — это как плыть против течения реки».
        Его метод стал стандартом для мультитаймфреймного анализа у тысяч профессионалов.
      </p>
    </div>

    <TimeframeTable />

    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="text-white font-orbitron text-xs font-bold mb-3">Принцип «сверху вниз» (Top-Down Analysis)</div>
      <svg viewBox="0 0 360 160" className="w-full h-40">
        <rect x="40" y="8" width="280" height="28" rx="6" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.2"/>
        <text x="180" y="19" fontSize="9" fill="#93c5fd" fontFamily="monospace" textAnchor="middle" fontWeight="bold">W1 — Недельный: определяем тренд</text>
        <text x="180" y="30" fontSize="7" fill="#60a5fa" fontFamily="monospace" textAnchor="middle">Бычий / Медвежий / Боковик</text>

        <line x1="180" y1="36" x2="180" y2="46" stroke="#52525b" strokeWidth="1.5"/>
        <polygon points="175,44 185,44 180,50" fill="#52525b"/>

        <rect x="60" y="50" width="240" height="26" rx="6" fill="#2d1b69" stroke="#8b5cf6" strokeWidth="1.2"/>
        <text x="180" y="61" fontSize="9" fill="#c4b5fd" fontFamily="monospace" textAnchor="middle" fontWeight="bold">D1 — Дневной: контекст и зоны</text>
        <text x="180" y="71" fontSize="7" fill="#a78bfa" fontFamily="monospace" textAnchor="middle">Ключевые уровни поддержки / сопротивления</text>

        <line x1="180" y1="76" x2="180" y2="86" stroke="#52525b" strokeWidth="1.5"/>
        <polygon points="175,84 185,84 180,90" fill="#52525b"/>

        <rect x="80" y="90" width="200" height="26" rx="6" fill="#3b2c00" stroke="#eab308" strokeWidth="1.2"/>
        <text x="180" y="101" fontSize="9" fill="#fde68a" fontFamily="monospace" textAnchor="middle" fontWeight="bold">H4 — 4 часа: зона входа</text>
        <text x="180" y="111" fontSize="7" fill="#fbbf24" fontFamily="monospace" textAnchor="middle">Паттерн + объём + подтверждение</text>

        <line x1="180" y1="116" x2="180" y2="126" stroke="#52525b" strokeWidth="1.5"/>
        <polygon points="175,124 185,124 180,130" fill="#52525b"/>

        <rect x="100" y="130" width="160" height="24" rx="6" fill="#052e16" stroke="#22c55e" strokeWidth="1.5"/>
        <text x="180" y="141" fontSize="9" fill="#86efac" fontFamily="monospace" textAnchor="middle" fontWeight="bold">H1 — 1 час: точный вход</text>
        <text x="180" y="151" fontSize="7" fill="#4ade80" fontFamily="monospace" textAnchor="middle">Стоп / Тейк / Размер позиции</text>
      </svg>
      <p className="text-zinc-500 text-xs mt-2">Никогда не торгуйте «против» старшего тайм-фрейма — это один из главных принципов технического анализа.</p>
    </div>
  </div>
)
