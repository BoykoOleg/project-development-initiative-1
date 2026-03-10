import { useState } from "react"

const LS_KEY = "relevance2026_legend_collapsed"

export function Relevance2026Legend() {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(LS_KEY) === "1" } catch { return false }
  })

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev
      try { localStorage.setItem(LS_KEY, next ? "1" : "0") } catch { /* ignore */ }
      return next
    })
  }

  return (
    <div className="mb-10 rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
            <span className="text-zinc-400 text-xs font-bold">?</span>
          </div>
        </div>
        <p className="text-xs font-space-mono text-zinc-400 uppercase tracking-wider flex-1">
          Что такое «Актуальность в 2026»
        </p>
        <button
          onClick={toggle}
          className="text-[11px] font-space-mono text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1.5 shrink-0"
        >
          {collapsed ? "показать" : "свернуть"}
          <svg
            width="10" height="10" viewBox="0 0 10 10" fill="none"
            className={`transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`}
          >
            <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {!collapsed && (
        <div className="mt-3 ml-9 space-y-2">
          <p className="text-[13px] text-zinc-500 leading-relaxed">
            Под каждой темой — блок с оценкой того, насколько тема актуальна прямо сейчас, когда ИИ и торговые боты меняют трейдинг.
          </p>
          <div className="flex flex-wrap gap-4 pt-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-1.5 rounded-full bg-violet-500" />
              <span className="text-[11px] text-zinc-500 font-space-mono">Влияние ИИ — как нейросети меняют эту тему</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1.5 rounded-full bg-orange-500" />
              <span className="text-[11px] text-zinc-500 font-space-mono">Влияние ботов — насколько автоматизация затрагивает тему</span>
            </div>
            <div className="flex items-center gap-3 pt-0.5 w-full">
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 font-space-mono">80–100% актуально</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 font-space-mono">60–79% меняется</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 font-space-mono">&lt;60% устаревает</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
