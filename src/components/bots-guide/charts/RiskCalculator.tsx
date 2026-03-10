import { useState, useMemo } from "react"

function Slider({ label, value, min, max, step, unit, color, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string; color: string; onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-zinc-400 text-xs font-space-mono">{label}</span>
        <span className={`text-xs font-orbitron font-bold ${color}`}>{value}{unit}</span>
      </div>
      <div className="relative h-2 bg-zinc-800 rounded-full cursor-pointer">
        <div className={`absolute left-0 top-0 h-2 rounded-full transition-all ${color.replace("text-", "bg-")}`} style={{ width: `${pct}%` }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
        />
      </div>
      <div className="flex justify-between text-zinc-600 text-xs font-space-mono">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  )
}

export function RiskCalculator() {
  const [deposit, setDeposit] = useState(10000)
  const [riskPct, setRiskPct] = useState(2)
  const [slPct, setSlPct] = useState(5)
  const [dailySlPct, setDailySlPct] = useState(3)
  const [startPct, setStartPct] = useState(10)

  const calc = useMemo(() => {
    const posSize = (deposit * riskPct) / 100 / (slPct / 100)
    const posSizeCapped = Math.min(posSize, deposit * 0.15)
    const actualRisk = posSizeCapped * (slPct / 100)
    const dailySl = deposit * dailySlPct / 100
    const startCapital = deposit * startPct / 100
    const globalSl = deposit * 0.15
    const tradesBeforeDailySl = Math.floor(dailySl / actualRisk)
    return { posSize: Math.round(posSizeCapped), actualRisk: Math.round(actualRisk), dailySl: Math.round(dailySl), startCapital: Math.round(startCapital), globalSl: Math.round(globalSl), tradesBeforeDailySl }
  }, [deposit, riskPct, slPct, dailySlPct, startPct])

  const riskLevel = calc.actualRisk / deposit * 100
  const riskColor = riskLevel < 1 ? "text-green-400" : riskLevel < 2 ? "text-yellow-400" : "text-red-400"
  const riskLabel = riskLevel < 1 ? "Консервативный" : riskLevel < 2 ? "Умеренный" : "Агрессивный"

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <p className="text-zinc-300 text-xs font-space-mono font-bold">Калькулятор риска позиции</p>
        <span className={`ml-auto text-xs font-orbitron font-bold px-2 py-0.5 rounded ${riskColor} bg-zinc-900 border border-zinc-700`}>{riskLabel}</span>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-5">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-xs font-space-mono">Депозит бота ($)</span>
              <span className="text-blue-400 text-xs font-orbitron font-bold">${deposit.toLocaleString()}</span>
            </div>
            <div className="flex gap-2">
              {[1000, 5000, 10000, 25000, 50000].map(v => (
                <button
                  key={v}
                  onClick={() => setDeposit(v)}
                  className={`flex-1 text-xs py-1 rounded font-space-mono transition-colors ${deposit === v ? "bg-blue-500/20 text-blue-400 border border-blue-500/40" : "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-zinc-600"}`}
                >${v >= 1000 ? `${v/1000}k` : v}</button>
              ))}
            </div>
          </div>

          <Slider label="Риск на сделку" value={riskPct} min={0.5} max={5} step={0.5} unit="%" color="text-blue-400" onChange={setRiskPct} />
          <Slider label="Стоп-лосс позиции" value={slPct} min={1} max={20} step={1} unit="%" color="text-red-400" onChange={setSlPct} />
          <Slider label="Daily Stop Loss" value={dailySlPct} min={1} max={10} step={0.5} unit="%" color="text-orange-400" onChange={setDailySlPct} />
          <Slider label="Стартовый капитал бота" value={startPct} min={5} max={100} step={5} unit="%" color="text-green-400" onChange={setStartPct} />
        </div>

        {/* Results */}
        <div className="space-y-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
            <p className="text-zinc-500 text-xs font-space-mono uppercase tracking-wider">Результаты расчёта</p>

            <div className="space-y-2">
              {[
                { label: "Размер позиции", value: `$${calc.posSize.toLocaleString()}`, note: `(${((calc.posSize / deposit) * 100).toFixed(1)}% депозита)`, color: "text-blue-400" },
                { label: "Риск на сделку", value: `$${calc.actualRisk.toLocaleString()}`, note: `(${((calc.actualRisk / deposit) * 100).toFixed(2)}% депозита)`, color: riskColor },
                { label: "Daily Stop Loss", value: `$${calc.dailySl.toLocaleString()}`, note: `≈ ${calc.tradesBeforeDailySl} убыточных сделок`, color: "text-orange-400" },
                { label: "Стартовый капитал", value: `$${calc.startCapital.toLocaleString()}`, note: `из $${deposit.toLocaleString()} общего`, color: "text-green-400" },
                { label: "Global Stop Loss", value: `$${calc.globalSl.toLocaleString()}`, note: "(15% от депозита)", color: "text-red-400" },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-start">
                  <div>
                    <span className="text-zinc-400 text-xs font-space-mono">{row.label}</span>
                    <div className="text-zinc-600 text-xs font-space-mono">{row.note}</div>
                  </div>
                  <span className={`text-sm font-orbitron font-bold ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk gauge */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
            <p className="text-zinc-500 text-xs font-space-mono mb-2">Уровень риска портфеля</p>
            <div className="relative h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div className="absolute inset-0 flex">
                <div className="flex-1 bg-green-500/30" />
                <div className="flex-1 bg-yellow-500/30" />
                <div className="flex-1 bg-red-500/30" />
              </div>
              <div
                className="absolute left-0 top-0 h-3 rounded-full bg-gradient-to-r from-green-500 to-red-500 transition-all"
                style={{ width: `${Math.min(riskLevel / 3 * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-zinc-600 text-xs font-space-mono mt-1">
              <span>Консервативный</span><span>Умеренный</span><span>Агрессивный</span>
            </div>
          </div>

          {riskLevel >= 2 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-xs font-space-mono font-bold mb-1">Предупреждение</p>
              <p className="text-zinc-400 text-xs font-space-mono">Риск {riskLevel.toFixed(2)}% за сделку — агрессивная стратегия. Профессиональные управляющие рекомендуют не более 1–2% на позицию.</p>
            </div>
          )}
          {riskLevel < 1 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <p className="text-green-400 text-xs font-space-mono font-bold mb-1">Отличный риск-менеджмент</p>
              <p className="text-zinc-400 text-xs font-space-mono">Риск {riskLevel.toFixed(2)}% за сделку — консервативный подход. Депозит защищён от серии убытков.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
