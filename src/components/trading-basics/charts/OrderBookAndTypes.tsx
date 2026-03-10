export function OrderBookChart() {
  const bids = [
    { price: "42,850", size: 3.2, pct: 80 },
    { price: "42,800", size: 2.1, pct: 52 },
    { price: "42,750", size: 1.5, pct: 38 },
    { price: "42,700", size: 4.8, pct: 100 },
    { price: "42,650", size: 0.9, pct: 22 },
  ]
  const asks = [
    { price: "42,900", size: 1.8, pct: 45 },
    { price: "42,950", size: 3.5, pct: 88 },
    { price: "43,000", size: 2.2, pct: 55 },
    { price: "43,050", size: 1.1, pct: 28 },
    { price: "43,100", size: 4.0, pct: 100 },
  ]
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 my-4">
      <p className="text-zinc-400 text-xs font-space-mono mb-3">Стакан ордеров (Order Book) BTC/USDT</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex justify-between text-xs text-zinc-500 font-space-mono mb-1 px-1">
            <span>Цена (USDT)</span><span>Объём (BTC)</span>
          </div>
          {asks.map((a, i) => (
            <div key={i} className="relative flex justify-between text-xs font-space-mono py-0.5 px-1">
              <div className="absolute inset-0 right-0 bg-red-500/10 rounded" style={{ width: `${a.pct}%` }} />
              <span className="relative text-red-400">{a.price}</span>
              <span className="relative text-zinc-400">{a.size}</span>
            </div>
          ))}
          <div className="border-t border-zinc-700 my-1" />
          {bids.map((b, i) => (
            <div key={i} className="relative flex justify-between text-xs font-space-mono py-0.5 px-1">
              <div className="absolute inset-0 right-0 bg-green-500/10 rounded" style={{ width: `${b.pct}%` }} />
              <span className="relative text-green-400">{b.price}</span>
              <span className="relative text-zinc-400">{b.size}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-center gap-2 text-xs font-space-mono">
          <div className="bg-zinc-900 rounded-lg p-3">
            <div className="text-zinc-500 mb-1">Лучший ASK (продажа)</div>
            <div className="text-red-400 font-bold text-base">$42,900</div>
          </div>
          <div className="bg-zinc-900 rounded-lg p-3">
            <div className="text-zinc-500 mb-1">Спред</div>
            <div className="text-yellow-400 font-bold text-base">$50 (0.12%)</div>
          </div>
          <div className="bg-zinc-900 rounded-lg p-3">
            <div className="text-zinc-500 mb-1">Лучший BID (покупка)</div>
            <div className="text-green-400 font-bold text-base">$42,850</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function OrderTypesTable() {
  const orders = [
    { type: "Market Order", when: "Нужна мгновенная покупка/продажа", pros: "Всегда исполняется", cons: "Проскальзывание при низкой ликвидности" },
    { type: "Limit Order", when: "Хотите войти по конкретной цене", pros: "Точная цена, нет proскальзывания", cons: "Может не исполниться" },
    { type: "Stop-Loss", when: "Защита от убытков", pros: "Автоматическая защита капитала", cons: "Срабатывает при flash-crash" },
    { type: "Take-Profit", when: "Фиксация прибыли", pros: "Не нужно следить за рынком", cons: "Может закрыть раньше сильного движения" },
    { type: "Trailing Stop", when: "Трендовые движения", pros: "Сохраняет нарастающую прибыль", cons: "Сложнее настроить корректно" },
    { type: "Stop-Limit", when: "Точный выход при стопе", pros: "Контроль цены выхода", cons: "Не гарантирует исполнение при гэпе" },
  ]
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden my-4">
      <div className="px-4 py-2 border-b border-zinc-800">
        <p className="text-zinc-400 text-xs font-space-mono">Типы ордеров: когда и зачем использовать</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-space-mono">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-4 py-2 text-zinc-500">Тип ордера</th>
              <th className="text-left px-4 py-2 text-zinc-500">Когда использовать</th>
              <th className="text-left px-4 py-2 text-zinc-500">Плюс</th>
              <th className="text-left px-4 py-2 text-zinc-500">Минус</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => (
              <tr key={i} className="border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors">
                <td className="px-4 py-2 text-red-400 font-bold whitespace-nowrap">{o.type}</td>
                <td className="px-4 py-2 text-zinc-300">{o.when}</td>
                <td className="px-4 py-2 text-green-400">{o.pros}</td>
                <td className="px-4 py-2 text-red-300">{o.cons}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
