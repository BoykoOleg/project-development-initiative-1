import React from "react"

export type AIExample = {
  label: string
  text: string
}

export type BotExample = {
  label: string
  text: string
}

export type AIBotInsight = {
  aiExamples: AIExample[]
  botExamples: BotExample[]
  comparison?: {
    human: string
    bot: string
    ai: string
  }
  codeSnippet?: {
    title: string
    code: string
  }
  chart?: React.ReactNode
}

interface Props {
  data: AIBotInsight
}

function Tag({ color, children }: { color: "violet" | "orange"; children: React.ReactNode }) {
  const cls =
    color === "violet"
      ? "bg-violet-500/10 border-violet-500/30 text-violet-300"
      : "bg-orange-500/10 border-orange-500/30 text-orange-300"
  return (
    <span className={`inline-block text-[10px] font-space-mono font-bold px-2 py-0.5 rounded border ${cls} mr-2 mb-1`}>
      {children}
    </span>
  )
}

function ComparisonRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`flex-1 rounded-lg border p-3 min-w-[120px] ${color}`}>
      <p className="text-[10px] font-space-mono uppercase tracking-wider opacity-60 mb-1">{label}</p>
      <p className="text-[12px] leading-snug">{value}</p>
    </div>
  )
}

export function AIBotInsightBlock({ data }: Props) {
  return (
    <div className="mt-5 space-y-4">
      {/* ИИ примеры */}
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
        <p className="text-[11px] font-space-mono text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>◈</span> Как ИИ меняет это прямо сейчас
        </p>
        <div className="space-y-2">
          {data.aiExamples.map((ex, i) => (
            <div key={i} className="flex gap-2">
              <div className="flex-1">
                <Tag color="violet">{ex.label}</Tag>
                <p className="text-[12px] text-zinc-300 leading-relaxed">{ex.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Бот примеры */}
      <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
        <p className="text-[11px] font-space-mono text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>◈</span> Как торговые боты применяют это
        </p>
        <div className="space-y-2">
          {data.botExamples.map((ex, i) => (
            <div key={i} className="flex gap-2">
              <div className="flex-1">
                <Tag color="orange">{ex.label}</Tag>
                <p className="text-[12px] text-zinc-300 leading-relaxed">{ex.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Сравнение */}
      {data.comparison && (
        <div>
          <p className="text-[11px] font-space-mono text-zinc-500 uppercase tracking-wider mb-2">Сравнение подходов</p>
          <div className="flex flex-wrap gap-2">
            <ComparisonRow
              label="Человек"
              value={data.comparison.human}
              color="border-zinc-700 text-zinc-300"
            />
            <ComparisonRow
              label="Торговый бот"
              value={data.comparison.bot}
              color="border-orange-500/25 text-orange-200"
            />
            <ComparisonRow
              label="ИИ-агент"
              value={data.comparison.ai}
              color="border-violet-500/25 text-violet-200"
            />
          </div>
        </div>
      )}

      {/* Код-сниппет */}
      {data.codeSnippet && (
        <div>
          <p className="text-[11px] font-space-mono text-zinc-500 uppercase tracking-wider mb-1">
            {data.codeSnippet.title}
          </p>
          <pre className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-[11px] text-green-300 font-space-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
            {data.codeSnippet.code}
          </pre>
        </div>
      )}

      {/* Визуализация */}
      {data.chart && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          {data.chart}
        </div>
      )}
    </div>
  )
}
