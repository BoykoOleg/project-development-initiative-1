type LegendQuoteProps = {
  avatar: string
  name: string
  rank: string
  quote: string
  context: string
  legendId: string
  color?: "yellow" | "zinc" | "orange"
}

export function LegendQuote({ avatar, name, rank, quote, context, legendId, color = "yellow" }: LegendQuoteProps) {
  const borderCls = color === "yellow"
    ? "border-yellow-500/25 bg-yellow-500/5"
    : color === "orange"
    ? "border-orange-500/25 bg-orange-500/5"
    : "border-zinc-500/25 bg-zinc-500/5"

  const rankCls = color === "yellow"
    ? "text-yellow-400 border-yellow-500/40 bg-yellow-500/10"
    : color === "orange"
    ? "text-orange-400 border-orange-500/40 bg-orange-500/10"
    : "text-zinc-300 border-zinc-400/40 bg-zinc-400/10"

  const quoteCls = color === "yellow"
    ? "text-yellow-200/80"
    : color === "orange"
    ? "text-orange-200/80"
    : "text-zinc-200/80"

  return (
    <a
      href={"/legends#" + legendId}
      className={`mt-5 flex gap-3 rounded-xl border p-4 transition-all hover:opacity-90 ${borderCls}`}
    >
      <div className="text-2xl shrink-0">{avatar}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className={`text-[10px] font-orbitron font-bold px-2 py-0.5 rounded-full border ${rankCls}`}>{rank}</span>
          <span className="text-[11px] font-orbitron text-white">{name}</span>
        </div>
        <p className={`text-[12px] italic leading-relaxed mb-1.5 ${quoteCls}`}>«{quote}»</p>
        <p className="text-[11px] text-zinc-500 leading-snug">{context}</p>
      </div>
    </a>
  )
}
