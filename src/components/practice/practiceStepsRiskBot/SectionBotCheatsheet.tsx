const botRows = [
  {
    type: "Grid-бот",
    color: "text-blue-400",
    regime: "Боковик (флэт)",
    platform: "Pionex, 3Commas",
    avoid: "В сильном тренде — убыток",
  },
  {
    type: "DCA-бот",
    color: "text-green-400",
    regime: "Долгосрочный тренд",
    platform: "3Commas, вручную",
    avoid: "При высокой волатильности",
  },
  {
    type: "Сигнальный бот",
    color: "text-purple-400",
    regime: "Тренд",
    platform: "Pocket Option (Python)",
    avoid: "В боковике — много ложных сигналов",
  },
  {
    type: "Ручная торговля",
    color: "text-yellow-400",
    regime: "Любой",
    platform: "Pocket Option",
    avoid: "При эмоциональном состоянии",
  },
]

export function SectionBotCheatsheet() {
  return (
    <div className="bg-zinc-950 border border-zinc-700 rounded-xl overflow-hidden">
      <div className="bg-zinc-900 px-4 py-2.5 border-b border-zinc-800">
        <span className="font-orbitron text-xs font-bold text-white">Шпаргалка по типам ботов</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-space-mono">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-3 py-2 text-zinc-500 font-normal">Тип бота</th>
              <th className="text-left px-3 py-2 text-zinc-500 font-normal">Режим рынка</th>
              <th className="text-left px-3 py-2 text-zinc-500 font-normal">Платформа</th>
              <th className="text-left px-3 py-2 text-zinc-500 font-normal">Когда НЕ использовать</th>
            </tr>
          </thead>
          <tbody>
            {botRows.map((row, i) => (
              <tr key={i} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/50 transition-colors">
                <td className={`px-3 py-2.5 font-bold ${row.color}`}>{row.type}</td>
                <td className="px-3 py-2.5 text-zinc-300">{row.regime}</td>
                <td className="px-3 py-2.5 text-zinc-400">{row.platform}</td>
                <td className="px-3 py-2.5 text-red-400/70">{row.avoid}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
