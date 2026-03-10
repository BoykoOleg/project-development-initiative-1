export const SectionBotCheatsheet = () => (
  <div className="bg-zinc-950 border border-zinc-700 rounded-xl overflow-hidden">
    <div className="bg-zinc-900 px-4 py-2.5 border-b border-zinc-800">
      <span className="font-orbitron text-xs font-bold text-white">Модули торгового бота — функции и статус</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-space-mono">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left px-3 py-2 text-zinc-500 font-normal">Модуль</th>
            <th className="text-left px-3 py-2 text-zinc-500 font-normal">Что делает</th>
            <th className="text-left px-3 py-2 text-zinc-500 font-normal">Ключевой параметр</th>
            <th className="text-left px-3 py-2 text-zinc-500 font-normal">Без него</th>
          </tr>
        </thead>
        <tbody>
          {[
            { module: "DataFeed", color: "text-blue-400", what: "Получает котировки BTC/USDT", param: "WebSocket Binance", without: "Нет данных — бот слепой" },
            { module: "SignalEngine", color: "text-purple-400", what: "Считает EMA, RSI, генерирует сигнал", param: "EMA 20/50 + RSI(14)", without: "Случайные сделки без логики" },
            { module: "RiskManager", color: "text-red-400", what: "Считает размер ставки, следит за лимитом", param: "2% / 5% дневной стоп", without: "Слив депозита за несколько дней" },
            { module: "Executor", color: "text-green-400", what: "Отправляет ордера через API", param: "Pocket Option WebSocket", without: "Сигналы есть, но сделок нет" },
            { module: "Monitor", color: "text-yellow-400", what: "Логи, алерты, статус бота", param: "Telegram-уведомления", without: "Не знаешь, что происходит 24/7" },
          ].map((row, i) => (
            <tr key={i} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/50 transition-colors">
              <td className={`px-3 py-2.5 font-bold ${row.color}`}>{row.module}</td>
              <td className="px-3 py-2.5 text-zinc-300">{row.what}</td>
              <td className="px-3 py-2.5 text-zinc-400">{row.param}</td>
              <td className="px-3 py-2.5 text-red-400/70">{row.without}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)
