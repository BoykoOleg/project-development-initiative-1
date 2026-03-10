export const SectionRsiFilter = (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      RSI (Relative Strength Index) показывает, перекуплен или перепродан актив. Мы используем его <span className="text-yellow-400 font-semibold">только как фильтр</span>, а не как основной сигнал.
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
        <div className="text-red-400 font-orbitron text-xs font-bold mb-2">RSI {">"} 65 → Перекупленность</div>
        <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">
          Покупатели устали. Высокая вероятность разворота вниз. Открываем PUT (если совпадает с уровнем и трендом).
        </p>
      </div>
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
        <div className="text-green-400 font-orbitron text-xs font-bold mb-2">RSI {"<"} 35 → Перепроданность</div>
        <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">
          Продавцы истощились. Высокая вероятность разворота вверх. Открываем CALL (если совпадает с уровнем и трендом).
        </p>
      </div>
    </div>
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
      <p className="text-yellow-300 text-xs font-space-mono">
        RSI от 35 до 65 — нейтральная зона. Профессионалы в ней не торгуют: нет явного сигнала.
      </p>
    </div>

    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
      <div className="text-blue-400 font-orbitron text-xs font-bold mb-2">Из жизни: Уэллс Уайлдер — создатель RSI</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Джей Уэллс Уайлдер создал RSI в 1978 году и сам предупреждал: индикатор даёт сигнал только в трендовых условиях.
        В боковике RSI будет ложно показывать перекупленность/перепроданность снова и снова.
        Именно поэтому мы сначала определяем тренд через EMA, и лишь потом смотрим на RSI — так, как задумывал сам автор.
      </p>
    </div>
  </div>
)

export const SectionConfluencePrinciple = (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      Конфлюэнс — это совпадение нескольких независимых факторов в одной точке. Чем больше факторов совпало, тем выше вероятность правильного прогноза.
    </p>
    <div className="space-y-2">
      {[
        {
          factor: "Тренд (EMA 20/50)",
          forCall: "EMA 20 выше EMA 50",
          forPut: "EMA 20 ниже EMA 50",
          weight: "Обязательно",
          color: "text-blue-400",
          border: "border-blue-500/30"
        },
        {
          factor: "Уровень цены",
          forCall: "Цена у поддержки",
          forPut: "Цена у сопротивления",
          weight: "Обязательно",
          color: "text-purple-400",
          border: "border-purple-500/30"
        },
        {
          factor: "RSI фильтр",
          forCall: "RSI < 35",
          forPut: "RSI > 65",
          weight: "Обязательно",
          color: "text-yellow-400",
          border: "border-yellow-500/30"
        },
      ].map((row, i) => (
        <div key={i} className={`bg-zinc-900 border ${row.border} rounded-lg p-3`}>
          <div className={`font-orbitron text-xs font-bold mb-2 ${row.color}`}>{row.factor} · {row.weight}</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-xs font-space-mono">
              <span className="text-green-400">CALL: </span>
              <span className="text-zinc-300">{row.forCall}</span>
            </div>
            <div className="text-xs font-space-mono">
              <span className="text-red-400">PUT: </span>
              <span className="text-zinc-300">{row.forPut}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-zinc-400 text-xs font-orbitron">Совпало факторов</span>
        <span className="text-zinc-400 text-xs font-orbitron">Решение</span>
      </div>
      {[
        { count: "3 из 3", decision: "Входим в сделку", color: "text-green-400", bg: "bg-green-500/10" },
        { count: "2 из 3", decision: "Пропускаем", color: "text-yellow-400", bg: "bg-yellow-500/10" },
        { count: "1 из 3", decision: "Не входим", color: "text-red-400", bg: "bg-red-500/10" },
      ].map((row, i) => (
        <div key={i} className={`flex justify-between items-center p-2 rounded-lg ${row.bg} mb-1`}>
          <span className={`text-xs font-space-mono ${row.color}`}>{row.count}</span>
          <span className={`text-xs font-orbitron font-bold ${row.color}`}>{row.decision}</span>
        </div>
      ))}
    </div>

    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
      <div className="text-orange-400 font-orbitron text-xs font-bold mb-2">Из жизни: стратегия Марка Дугласа</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Марк Дуглас, автор книги «Трейдинг в зоне», учил: профессионал ищет только те сделки, где рынок сам «кричит» о своём намерении.
        Он называл это «высоковероятностными сетапами». В его методе — минимум 3 совпадающих условия перед входом.
        «Когда рынок подходит к уровню, RSI в зоне перекупленности, и тренд подтверждает — это не совпадение. Это приглашение».
      </p>
    </div>
  </div>
)

export const SectionSetupBreakdown = (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      Посмотрим на конкретный момент: BTC/USD, M5, 14:40. Проверяем все три фактора.
    </p>
    <div className="space-y-2">
      {[
        {
          num: "01",
          factor: "Тренд",
          status: "Подтверждает PUT",
          detail: "EMA 20 ($96,420) ниже EMA 50 ($96,580) — нисходящий тренд на M5",
          color: "text-red-400",
        },
        {
          num: "02",
          factor: "Уровень",
          status: "Цена у сопротивления",
          detail: "BTC на $96,580 — это зона, где цена разворачивалась дважды за последние 2 часа",
          color: "text-red-400",
        },
        {
          num: "03",
          factor: "RSI",
          status: "RSI = 68 → Перекупленность",
          detail: "RSI выше 65, подтверждает разворот вниз",
          color: "text-red-400",
        },
      ].map((item, i) => (
        <div key={i} className="flex gap-3 items-start bg-zinc-900 border border-zinc-800 rounded-lg p-3">
          <div className={`font-orbitron text-xs font-bold ${item.color} w-6 shrink-0`}>{item.num}</div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-zinc-400 font-orbitron text-xs">{item.factor}:</span>
              <span className={`font-orbitron text-xs font-bold ${item.color}`}>{item.status}</span>
            </div>
            <p className="text-zinc-500 text-xs font-space-mono">{item.detail}</p>
          </div>
        </div>
      ))}
      <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
        <div className="text-red-400 font-orbitron text-xs font-bold mb-1">Итог: открываем PUT</div>
        <p className="text-zinc-300 text-xs font-space-mono">Все 3 фактора совпали в сторону PUT. Ставка: 2% от депозита. Экспирация: 5 минут.</p>
      </div>
    </div>

    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
      <div className="text-green-400 font-orbitron text-xs font-bold mb-2">Из жизни: как торгует Стив Кленоу</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Стив Кленоу — управляющий хедж-фонда Klenow Pattern Research — использует системный подход:
        его алгоритмы открывают позицию только при совпадении сразу нескольких условий.
        «Если один фактор говорит "войди", а другой молчит — это не сигнал, это желание заработать».
        Именно поэтому профессионалы пропускают большинство движений рынка — они ждут только сильные сетапы.
      </p>
    </div>

    <div className="bg-zinc-950 border border-zinc-700 rounded-xl overflow-hidden">
      <div className="bg-zinc-900 px-4 py-2.5 border-b border-zinc-800">
        <span className="font-orbitron text-xs font-bold text-white">Шпаргалка: анализ рынка — всё в одном</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-space-mono">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-3 py-2 text-zinc-500 font-normal">Инструмент</th>
              <th className="text-left px-3 py-2 text-zinc-500 font-normal">Что показывает</th>
              <th className="text-left px-3 py-2 text-zinc-500 font-normal">CALL сигнал</th>
              <th className="text-left px-3 py-2 text-zinc-500 font-normal">PUT сигнал</th>
            </tr>
          </thead>
          <tbody>
            {[
              { tool: "EMA 20/50", color: "text-blue-400", what: "Направление тренда", call: "EMA 20 > EMA 50", put: "EMA 20 < EMA 50" },
              { tool: "Уровни", color: "text-purple-400", what: "Поддержка / сопротивление", call: "Цена у поддержки", put: "Цена у сопротивления" },
              { tool: "RSI (14)", color: "text-yellow-400", what: "Перекупленность / перепроданность", call: "RSI < 35", put: "RSI > 65" },
              { tool: "Конфлюэнс", color: "text-green-400", what: "Совпадение факторов", call: "3 из 3 → входим", put: "2 из 3 → пропускаем" },
            ].map((row, i) => (
              <tr key={i} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/50 transition-colors">
                <td className={`px-3 py-2.5 font-bold ${row.color}`}>{row.tool}</td>
                <td className="px-3 py-2.5 text-zinc-400">{row.what}</td>
                <td className="px-3 py-2.5 text-green-400">{row.call}</td>
                <td className="px-3 py-2.5 text-red-400">{row.put}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)
