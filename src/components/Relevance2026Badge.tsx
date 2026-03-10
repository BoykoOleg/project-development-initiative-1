import React from "react"

export type Relevance2026 = {
  score: number
  label: string
  aiImpact: number
  botImpact: number
  aiNote: string
  botNote: string
}

interface Props {
  data: Relevance2026
}

function ImpactBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-space-mono font-bold w-9 text-right" style={{ color: color.includes("violet") ? "#a78bfa" : "#f97316" }}>
        {value}%
      </span>
    </div>
  )
}

export function Relevance2026Badge({ data }: Props) {
  const scoreColor =
    data.score >= 80
      ? "text-green-400 border-green-500/30 bg-green-500/10"
      : data.score >= 60
      ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
      : "text-red-400 border-red-500/30 bg-red-500/10"

  return (
    <div className="mt-4 rounded-xl border border-zinc-700/60 bg-zinc-900/80 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-space-mono text-zinc-500 uppercase tracking-wider">Актуальность в 2026</span>
        <span className={`text-xs font-orbitron font-bold px-2.5 py-1 rounded-full border ${scoreColor}`}>
          {data.label}
        </span>
      </div>

      <div className="space-y-2">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-zinc-400 font-space-mono flex items-center gap-1.5">
              <span className="text-violet-400">◈</span> Влияние ИИ
            </span>
          </div>
          <ImpactBar value={data.aiImpact} color="bg-violet-500" />
          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{data.aiNote}</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-zinc-400 font-space-mono flex items-center gap-1.5">
              <span className="text-orange-400">◈</span> Влияние торговых ботов
            </span>
          </div>
          <ImpactBar value={data.botImpact} color="bg-orange-500" />
          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{data.botNote}</p>
        </div>
      </div>
    </div>
  )
}
