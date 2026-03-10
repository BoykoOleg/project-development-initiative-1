import { Article } from "./TradingArticles"

interface TradingProgressProps {
  articles: Article[]
  readChapters: Set<string>
  onToggle: (id: string) => void
}

export default function TradingProgress({ articles, readChapters, onToggle }: TradingProgressProps) {
  const readCount = readChapters.size
  const total = articles.length
  const pct = Math.round((readCount / total) * 100)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-10">
      <div className="flex items-center justify-between mb-3">
        <span className="font-orbitron text-white text-sm">Прогресс по курсу</span>
        <span className="font-space-mono text-red-400 text-sm font-bold">{readCount} / {total} глав</span>
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-2 mb-2">
        <div
          className="bg-red-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex gap-2 mt-3 flex-wrap">
        {articles.map((a) => (
          <a
            key={a.id}
            href={`#${a.id}`}
            className={`text-xs font-space-mono px-3 py-1 rounded-full border transition-colors ${
              readChapters.has(a.id)
                ? "bg-green-500/20 border-green-500/40 text-green-400"
                : "border-red-500/30 text-red-400 hover:bg-red-500/10"
            }`}
          >
            {readChapters.has(a.id) ? "✓ " : ""}{a.badge}
          </a>
        ))}
      </div>
    </div>
  )
}
