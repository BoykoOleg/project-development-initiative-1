const modules = [
  {
    num: "01",
    module: "Data Feed — поток котировок",
    desc: "Получает реальные цены BTC/USDT в режиме реального времени. Источники: Binance WebSocket API (бесплатно) или Pocket Option собственный поток.",
    color: "text-blue-400",
    border: "border-blue-500/30",
  },
  {
    num: "02",
    module: "Signal Engine — движок сигналов",
    desc: "Считает EMA 20/50 и RSI на каждой новой свече M5. Проверяет конфлюэнс трёх факторов. Генерирует сигнал CALL/PUT или WAIT.",
    color: "text-yellow-400",
    border: "border-yellow-500/30",
  },
  {
    num: "03",
    module: "Risk Manager — контроль риска",
    desc: "Перед каждой сделкой проверяет: не превышен ли дневной лимит -6%, какой размер ставки по правилу 2%, не торгуем ли в запрещённое время.",
    color: "text-red-400",
    border: "border-red-500/30",
  },
  {
    num: "04",
    module: "Executor — исполнение ордеров",
    desc: "Подключается к Pocket Option через WebSocket (протокол Traderoom API). Отправляет команду открыть опцион с нужной ставкой и экспирацией.",
    color: "text-purple-400",
    border: "border-purple-500/30",
  },
  {
    num: "05",
    module: "Logger — журнал и статистика",
    desc: "Записывает каждую сделку в CSV: время, направление, цена входа, результат. Считает Win Rate, серии, просадку в реальном времени.",
    color: "text-green-400",
    border: "border-green-500/30",
  },
]

const dataFlow = ["Binance WS", "→", "Data Feed", "→", "Signal Engine", "→", "Risk Manager", "→", "Executor", "→", "Pocket Option"]

export const SectionArchitecture = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      Торговый бот — это не одна программа, а цепочка модулей. Каждый отвечает за свою задачу.
      Разберём архитектуру на примере BTC/USDT с нашей стратегией (EMA 20/50 + RSI + уровни).
    </p>
    <div className="space-y-2">
      {modules.map((item, i) => (
        <div key={i} className={`flex gap-3 items-start bg-zinc-900 border ${item.border} rounded-lg p-3`}>
          <div className={`font-orbitron text-xs font-bold ${item.color} w-6 shrink-0`}>{item.num}</div>
          <div>
            <div className={`font-orbitron text-xs font-bold mb-1 ${item.color}`}>{item.module}</div>
            <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>

    <div className="bg-zinc-950 border border-zinc-700 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">Схема потока данных</div>
      <div className="flex items-center gap-2 flex-wrap">
        {dataFlow.map((item, i) => (
          <span key={i} className={`text-xs font-space-mono ${item === "→" ? "text-zinc-600" : "bg-zinc-800 text-zinc-300 px-2 py-1 rounded"}`}>{item}</span>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs font-space-mono bg-zinc-800 text-zinc-300 px-2 py-1 rounded">Logger</span>
        <span className="text-xs font-space-mono text-zinc-600">← записывает каждый шаг</span>
      </div>
    </div>

    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
      <div className="text-blue-400 font-orbitron text-xs font-bold mb-2">Из жизни: архитектура Two Sigma</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Хедж-фонд Two Sigma (AUM $60 млрд) строит свои торговые системы по той же модульной архитектуре.
        Каждый компонент — отдельная служба с чёткой ответственностью. Это позволяет менять стратегию (Signal Engine),
        не трогая исполнение (Executor) или риск-менеджмент. Модульность — стандарт индустрии.
      </p>
    </div>
  </div>
)
