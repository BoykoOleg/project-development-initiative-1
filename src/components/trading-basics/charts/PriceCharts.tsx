export function CandlestickChart() {
  const candles = [
    { x: 30, open: 140, close: 120, high: 150, low: 110, bull: false },
    { x: 70, open: 120, close: 145, high: 155, low: 115, bull: true },
    { x: 110, open: 145, close: 135, high: 160, low: 130, bull: false },
    { x: 150, open: 135, close: 165, high: 170, low: 128, bull: true },
    { x: 190, open: 165, close: 155, high: 175, low: 148, bull: false },
    { x: 230, open: 155, close: 185, high: 190, low: 150, bull: true },
    { x: 270, open: 185, close: 175, high: 195, low: 168, bull: false },
    { x: 310, open: 175, close: 200, high: 205, low: 170, bull: true },
  ]
  const labels = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг"]
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 my-4">
      <p className="text-zinc-400 text-xs font-space-mono mb-3">График: японские свечи BTC/USDT (пример)</p>
      <svg viewBox="0 0 360 220" className="w-full h-48">
        {[60, 100, 140, 180].map(y => (
          <line key={y} x1="20" y1={y} x2="340" y2={y} stroke="#27272a" strokeWidth="1" />
        ))}
        {[{y:60,p:"$45k"},{y:100,p:"$42k"},{y:140,p:"$39k"},{y:180,p:"$36k"}].map(l => (
          <text key={l.y} x="5" y={l.y+4} fontSize="8" fill="#52525b" fontFamily="monospace">{l.p}</text>
        ))}
        {candles.map((c, i) => {
          const color = c.bull ? "#22c55e" : "#ef4444"
          const top = Math.min(c.open, c.close)
          const bot = Math.max(c.open, c.close)
          return (
            <g key={i}>
              <line x1={c.x} y1={c.high} x2={c.x} y2={c.low} stroke={color} strokeWidth="1.5" />
              <rect x={c.x - 10} y={top} width="20" height={Math.max(bot - top, 2)} fill={color} rx="1" />
            </g>
          )
        })}
        {candles.map((c, i) => (
          <text key={i} x={c.x} y="212" fontSize="8" fill="#52525b" textAnchor="middle" fontFamily="monospace">{labels[i]}</text>
        ))}
        <rect x="240" y="10" width="10" height="10" fill="#22c55e" rx="1" />
        <text x="254" y="19" fontSize="8" fill="#86efac" fontFamily="monospace">Бычья свеча</text>
        <rect x="240" y="26" width="10" height="10" fill="#ef4444" rx="1" />
        <text x="254" y="35" fontSize="8" fill="#fca5a5" fontFamily="monospace">Медвежья свеча</text>
      </svg>
    </div>
  )
}

export function SupportResistanceChart() {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 my-4">
      <p className="text-zinc-400 text-xs font-space-mono mb-2">Уровни поддержки и сопротивления</p>
      <svg viewBox="0 0 360 180" className="w-full h-44">
        <line x1="30" y1="50" x2="330" y2="50" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6,4" />
        <text x="332" y="54" fontSize="8" fill="#ef4444" fontFamily="monospace">Сопр.</text>
        <line x1="30" y1="130" x2="330" y2="130" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="6,4" />
        <text x="332" y="134" fontSize="8" fill="#22c55e" fontFamily="monospace">Подд.</text>
        <polyline
          points="30,130 60,110 90,50 100,70 130,130 160,100 190,50 200,65 230,130 260,108 290,50 310,75 330,90"
          fill="none" stroke="#e5e7eb" strokeWidth="2"
        />
        {[[90,50],[190,50],[290,50]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="4" fill="none" stroke="#ef4444" strokeWidth="1.5" />
        ))}
        {[[30,130],[130,130],[230,130]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="4" fill="none" stroke="#22c55e" strokeWidth="1.5" />
        ))}
        <text x="155" y="170" fontSize="8" fill="#52525b" textAnchor="middle" fontFamily="monospace">Чем больше касаний → тем уровень сильнее</text>
      </svg>
    </div>
  )
}

export function RSIChart() {
  const prices = [100, 105, 102, 110, 115, 112, 118, 122, 119, 125, 128, 124, 120, 116, 112, 108, 105, 102, 98, 95]
  const rsi = [50, 58, 52, 63, 71, 66, 74, 79, 72, 80, 83, 75, 67, 60, 52, 45, 38, 31, 25, 20]
  const w = 340, ph = 80, rh = 60, pad = 20
  const maxP = Math.max(...prices), minP = Math.min(...prices)
  const px = (i: number) => pad + (i / (prices.length - 1)) * (w - pad * 2)
  const py = (v: number) => ph - ((v - minP) / (maxP - minP)) * (ph - 10) - 5
  const ry = (v: number) => rh - (v / 100) * (rh - 8) - 4
  const pPath = prices.map((v, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${py(v)}`).join(" ")
  const rPath = rsi.map((v, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${ry(v)}`).join(" ")
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 my-4">
      <p className="text-zinc-400 text-xs font-space-mono mb-2">Цена + RSI: пример дивергенции и зон</p>
      <svg viewBox={`0 0 ${w} ${ph + rh + 20}`} className="w-full">
        <text x="2" y="12" fontSize="8" fill="#71717a" fontFamily="monospace">ЦЕНА</text>
        <path d={pPath} stroke="#ef4444" strokeWidth="1.5" fill="none" />
        <text x="2" y={ph + 28} fontSize="8" fill="#71717a" fontFamily="monospace">RSI(14)</text>
        <g transform={`translate(0, ${ph + 16})`}>
          <rect x={pad} y={ry(70)} width={w - pad * 2} height={ry(30) - ry(70)} fill="#ef4444" opacity="0.07" />
          <line x1={pad} y1={ry(70)} x2={w - pad} y2={ry(70)} stroke="#ef4444" strokeWidth="0.8" strokeDasharray="3,3" />
          <line x1={pad} y1={ry(30)} x2={w - pad} y2={ry(30)} stroke="#22c55e" strokeWidth="0.8" strokeDasharray="3,3" />
          <text x={w - pad + 2} y={ry(70) + 4} fontSize="7" fill="#ef4444" fontFamily="monospace">70</text>
          <text x={w - pad + 2} y={ry(30) + 4} fontSize="7" fill="#22c55e" fontFamily="monospace">30</text>
          <path d={rPath} stroke="#a78bfa" strokeWidth="1.5" fill="none" />
        </g>
        <text x={px(11)} y={py(128) - 5} fontSize="7" fill="#fbbf24" textAnchor="middle" fontFamily="monospace">Перекупленность</text>
        <text x={px(19)} y={ph + 16 + ry(20) + 12} fontSize="7" fill="#86efac" textAnchor="middle" fontFamily="monospace">Перепроданность</text>
      </svg>
    </div>
  )
}

export function MACDChart() {
  const prices = [100, 102, 105, 108, 106, 110, 115, 118, 116, 120, 125, 122, 118, 114, 110, 112, 116, 120, 124, 128]
  const macd = [-0.5, -0.3, 0.2, 0.8, 0.5, 1.2, 2.0, 2.5, 2.0, 2.8, 3.5, 2.8, 1.5, 0.3, -0.5, -0.8, -0.3, 0.5, 1.2, 2.0]
  const signal = [0.2, 0.1, 0.2, 0.4, 0.4, 0.6, 1.0, 1.5, 1.7, 2.0, 2.5, 2.6, 2.3, 1.8, 1.2, 0.7, 0.3, 0.3, 0.5, 0.9]
  const w = 340, ph = 80, mh = 60, pad = 20
  const maxP = Math.max(...prices), minP = Math.min(...prices)
  const maxM = Math.max(...macd.map(Math.abs)) * 1.2
  const px = (i: number) => pad + (i / (prices.length - 1)) * (w - pad * 2)
  const py = (v: number) => ph - ((v - minP) / (maxP - minP)) * (ph - 10) - 5
  const my = (v: number) => mh / 2 - (v / maxM) * (mh / 2 - 5)
  const pPath = prices.map((v, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${py(v)}`).join(" ")
  const macdPath = macd.map((v, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${my(v)}`).join(" ")
  const sigPath = signal.map((v, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${my(v)}`).join(" ")
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 my-4">
      <p className="text-zinc-400 text-xs font-space-mono mb-2">Цена + MACD (сигналы на пересечениях)</p>
      <svg viewBox={`0 0 ${w} ${ph + mh + 20}`} className="w-full">
        <text x="2" y="12" fontSize="8" fill="#71717a" fontFamily="monospace">ЦЕНА</text>
        <path d={pPath} stroke="#e5e7eb" strokeWidth="1.5" fill="none" />
        <text x="2" y={ph + 26} fontSize="8" fill="#71717a" fontFamily="monospace">MACD</text>
        <g transform={`translate(0, ${ph + 14})`}>
          <line x1={pad} y1={mh / 2} x2={w - pad} y2={mh / 2} stroke="#3f3f46" strokeWidth="0.8" />
          {macd.map((v, i) => {
            const barH = Math.abs(my(v) - mh / 2)
            const barY = v >= 0 ? mh / 2 - barH : mh / 2
            return <rect key={i} x={px(i) - 4} y={barY} width="8" height={barH} fill={v >= 0 ? "#22c55e" : "#ef4444"} opacity="0.6" />
          })}
          <path d={macdPath} stroke="#60a5fa" strokeWidth="1.5" fill="none" />
          <path d={sigPath} stroke="#fbbf24" strokeWidth="1.5" fill="none" strokeDasharray="4,2" />
        </g>
        <rect x={w - 110} y="5" width="8" height="4" fill="#60a5fa" />
        <text x={w - 98} y="11" fontSize="7" fill="#93c5fd" fontFamily="monospace">MACD</text>
        <rect x={w - 110} y="15" width="8" height="4" fill="#fbbf24" />
        <text x={w - 98} y="21" fontSize="7" fill="#fde68a" fontFamily="monospace">Signal</text>
      </svg>
    </div>
  )
}
