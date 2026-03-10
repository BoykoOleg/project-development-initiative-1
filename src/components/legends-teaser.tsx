export function LegendsTeaser() {
  const legends = [
    {
      rank: "#1",
      avatar: "📈",
      name: "Джесси Ливермор",
      years: "1877–1940",
      quote: "Деньги делаются на сидении, а не на торговле.",
      stat: "+$100 млн в 1929",
      color: "border-yellow-500/30 hover:border-yellow-500/60",
      rankColor: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
      quoteColor: "text-yellow-300/70",
    },
    {
      rank: "#2",
      avatar: "🏆",
      name: "Пол Тюдор Джонс",
      years: "1954–н.в.",
      quote: "Самое важное — управление деньгами. Снова и снова.",
      stat: "0 убыточных лет за 45 лет",
      color: "border-zinc-500/30 hover:border-zinc-400/60",
      rankColor: "text-zinc-300 border-zinc-400/40 bg-zinc-400/10",
      quoteColor: "text-zinc-300/70",
    },
    {
      rank: "#3",
      avatar: "⚡",
      name: "Ларри Вильямс",
      years: "1942–н.в.",
      quote: "Торгуй только когда три вещи говорят тебе одно и то же.",
      stat: "+11 376% за один год",
      color: "border-orange-500/30 hover:border-orange-500/60",
      rankColor: "text-orange-400 border-orange-500/40 bg-orange-500/10",
      quoteColor: "text-orange-300/70",
    },
  ]

  return (
    <section className="py-16 px-4 bg-black border-t border-zinc-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span className="inline-block font-space-mono text-xs text-yellow-500/70 uppercase tracking-widest mb-3">
            Зал славы трейдинга
          </span>
          <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-white mb-4">
            Три легенды, три системы
          </h2>
          <p className="text-zinc-400 text-base max-w-xl mx-auto">
            Они создали правила ещё до появления компьютеров. Сегодня эти правила — основа каждого торгового алгоритма.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {legends.map((l) => (
            <a
              key={l.rank}
              href="/legends"
              className={`block bg-zinc-900/80 border rounded-2xl p-5 transition-all group ${l.color}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{l.avatar}</span>
                <div>
                  <span className={`text-[10px] font-orbitron font-bold px-2 py-0.5 rounded-full border inline-block mb-1 ${l.rankColor}`}>
                    {l.rank}
                  </span>
                  <div className="font-orbitron text-sm font-bold text-white leading-tight">{l.name}</div>
                  <div className="text-[11px] text-zinc-600 font-space-mono">{l.years}</div>
                </div>
              </div>

              <p className={`text-[13px] italic leading-relaxed mb-3 ${l.quoteColor}`}>
                «{l.quote}»
              </p>

              <div className="border-t border-zinc-800 pt-3">
                <span className="text-[11px] font-space-mono text-zinc-500">{l.stat}</span>
              </div>
            </a>
          ))}
        </div>

        <div className="text-center">
          <a
            href="/legends"
            className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 hover:border-yellow-500/60 text-yellow-400 hover:text-yellow-300 font-orbitron text-sm px-6 py-3 rounded-xl transition-all"
          >
            🏆 Открыть зал славы
            <span className="text-yellow-500/50">→</span>
          </a>
        </div>
      </div>
    </section>
  )
}
