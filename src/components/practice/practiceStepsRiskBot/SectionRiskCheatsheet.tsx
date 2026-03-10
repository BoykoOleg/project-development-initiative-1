const riskRows = [
  {
    rule: "Размер сделки",
    color: "text-red-400",
    value: "2% от баланса",
    example: "$10 на сделку",
    risk: "Одна потеря обнулит депозит",
  },
  {
    rule: "Дневной стоп",
    color: "text-orange-400",
    value: "5% потерь → стоп",
    example: "$25 в минус → конец дня",
    risk: "Эмоциональный слив после нескольких неудач",
  },
  {
    rule: "Серия потерь",
    color: "text-yellow-400",
    value: "3 подряд → пауза",
    example: "3 убытка → перерыв 2 часа",
    risk: "«Отыгрыш» — главная причина слива",
  },
  {
    rule: "Журнал",
    color: "text-blue-400",
    value: "Каждая сделка",
    example: "Дата, сигнал, итог, причина",
    risk: "Не видишь паттерны своих ошибок",
  },
]

export function SectionRiskCheatsheet() {
  return (
    <div className="bg-zinc-950 border border-zinc-700 rounded-xl overflow-hidden">
      <div className="bg-zinc-900 px-4 py-2.5 border-b border-zinc-800">
        <span className="font-orbitron text-xs font-bold text-white">Правила риск-менеджмента</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-space-mono">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-3 py-2 text-zinc-500 font-normal">Правило</th>
              <th className="text-left px-3 py-2 text-zinc-500 font-normal">Цифра</th>
              <th className="text-left px-3 py-2 text-zinc-500 font-normal">Пример ($500)</th>
              <th className="text-left px-3 py-2 text-zinc-500 font-normal">Что будет без него</th>
            </tr>
          </thead>
          <tbody>
            {riskRows.map((row, i) => (
              <tr key={i} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/50 transition-colors">
                <td className={`px-3 py-2.5 font-bold ${row.color}`}>{row.rule}</td>
                <td className="px-3 py-2.5 text-zinc-300">{row.value}</td>
                <td className="px-3 py-2.5 text-zinc-400">{row.example}</td>
                <td className="px-3 py-2.5 text-red-400/70">{row.risk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
