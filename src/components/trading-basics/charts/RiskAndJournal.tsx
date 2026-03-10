export function RiskCalcTable() {
  const rows = [
    { deposit: "50 000₽", risk1: "500₽", risk2: "1 000₽", maxLoss: "10 000₽ (20 сделок)" },
    { deposit: "100 000₽", risk1: "1 000₽", risk2: "2 000₽", maxLoss: "20 000₽ (20 сделок)" },
    { deposit: "500 000₽", risk1: "5 000₽", risk2: "10 000₽", maxLoss: "100 000₽ (20 сделок)" },
    { deposit: "1 000 000₽", risk1: "10 000₽", risk2: "20 000₽", maxLoss: "200 000₽ (20 сделок)" },
  ]
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden my-4">
      <div className="px-4 py-2 border-b border-zinc-800">
        <p className="text-zinc-400 text-xs font-space-mono">Таблица: размер риска на сделку по правилу 1–2%</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-space-mono">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-4 py-2 text-zinc-500">Депозит</th>
              <th className="text-right px-4 py-2 text-zinc-500">Риск 1%</th>
              <th className="text-right px-4 py-2 text-zinc-500">Риск 2%</th>
              <th className="text-right px-4 py-2 text-zinc-500">Макс. серия потерь</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors">
                <td className="px-4 py-2 text-white font-semibold">{r.deposit}</td>
                <td className="px-4 py-2 text-right text-yellow-400">{r.risk1}</td>
                <td className="px-4 py-2 text-right text-orange-400">{r.risk2}</td>
                <td className="px-4 py-2 text-right text-zinc-400">{r.maxLoss}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function RRTable() {
  const rows = [
    { rr: "1:1", winRate: "51%", comment: "Минимально допустимо", color: "text-orange-400" },
    { rr: "1:2", winRate: "34%", comment: "Стандарт для трейдеров", color: "text-yellow-400" },
    { rr: "1:3", winRate: "25%", comment: "Хорошо для тренд-трейдинга", color: "text-green-400" },
    { rr: "1:5", winRate: "17%", comment: "Для swing/позиционных сделок", color: "text-emerald-400" },
  ]
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden my-4">
      <div className="px-4 py-2 border-b border-zinc-800">
        <p className="text-zinc-400 text-xs font-space-mono">Таблица: минимальный win rate для прибыли при разных R:R</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-space-mono">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-4 py-2 text-zinc-500">Риск:Прибыль</th>
              <th className="text-right px-4 py-2 text-zinc-500">Мин. Win Rate</th>
              <th className="text-right px-4 py-2 text-zinc-500">Комментарий</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors">
                <td className={`px-4 py-2 font-bold text-base ${r.color}`}>{r.rr}</td>
                <td className="px-4 py-2 text-right text-white font-semibold">{r.winRate}</td>
                <td className="px-4 py-2 text-right text-zinc-400">{r.comment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function TradingJournalTemplate() {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden my-4">
      <div className="px-4 py-2 border-b border-zinc-800">
        <p className="text-zinc-400 text-xs font-space-mono">Шаблон торгового журнала</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-space-mono">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Дата", "Актив", "Напр.", "Вход", "SL", "TP", "Выход", "P&L", "R:R", "Причина входа"].map(h => (
                <th key={h} className="text-left px-3 py-2 text-zinc-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-zinc-900 bg-green-500/5">
              <td className="px-3 py-2 text-zinc-300">15.01</td>
              <td className="px-3 py-2 text-white">BTC/USDT</td>
              <td className="px-3 py-2 text-green-400">LONG</td>
              <td className="px-3 py-2">42 500</td>
              <td className="px-3 py-2 text-red-400">41 500</td>
              <td className="px-3 py-2 text-green-400">44 500</td>
              <td className="px-3 py-2">44 500</td>
              <td className="px-3 py-2 text-green-400">+2 000</td>
              <td className="px-3 py-2 text-emerald-400">1:2</td>
              <td className="px-3 py-2 text-zinc-400">Откат к EMA200 + RSI 32</td>
            </tr>
            <tr className="border-b border-zinc-900 bg-red-500/5">
              <td className="px-3 py-2 text-zinc-300">17.01</td>
              <td className="px-3 py-2 text-white">ETH/USDT</td>
              <td className="px-3 py-2 text-red-400">SHORT</td>
              <td className="px-3 py-2">2 350</td>
              <td className="px-3 py-2 text-red-400">2 420</td>
              <td className="px-3 py-2 text-green-400">2 210</td>
              <td className="px-3 py-2">2 420</td>
              <td className="px-3 py-2 text-red-400">-700</td>
              <td className="px-3 py-2 text-orange-400">1:2</td>
              <td className="px-3 py-2 text-zinc-400">Пробой уровня сопр.</td>
            </tr>
            <tr className="border-b border-zinc-900 bg-green-500/5">
              <td className="px-3 py-2 text-zinc-300">20.01</td>
              <td className="px-3 py-2 text-white">SOL/USDT</td>
              <td className="px-3 py-2 text-green-400">LONG</td>
              <td className="px-3 py-2">95.20</td>
              <td className="px-3 py-2 text-red-400">92.00</td>
              <td className="px-3 py-2 text-green-400">104.60</td>
              <td className="px-3 py-2">104.50</td>
              <td className="px-3 py-2 text-green-400">+9 300</td>
              <td className="px-3 py-2 text-emerald-400">1:3</td>
              <td className="px-3 py-2 text-zinc-400">Поглощение + объём</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
