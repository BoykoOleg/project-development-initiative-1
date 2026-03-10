export const SectionStrategiesOverview = () => (
  <div className="space-y-4">
    <p className="text-gray-300 leading-relaxed">
      Каждая стратегия работает в своих условиях. Главная ошибка — применять одну и ту же тактику на любом рынке.
      Ниже — полный обзор подходов с адаптацией под <span className="text-yellow-400 font-bold">Pocket Option</span> и пару <span className="text-orange-400 font-bold">BTC/USDT</span>.
    </p>

    {/* Таблица стратегий */}
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 overflow-x-auto">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">Сравнение стратегий: условия и применимость</div>
      <table className="w-full text-xs font-space-mono min-w-[560px]">
        <thead>
          <tr className="border-b border-zinc-800">
            {["Стратегия", "Рынок", "Таймфрейм", "Pocket Option", "BTC/USDT", "Сложность"].map(h => (
              <th key={h} className="text-left px-2 py-2 text-zinc-500 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {[
            ["Скальпинг", "Боковик / слабый тренд", "M1–M5", "✓ Идеально", "⚠ Высокий спред", "text-red-400", "Высокая"],
            ["Пробой уровня", "Тренд", "M5–H1", "✓ Отлично", "✓ Часто", "text-green-400", "Средняя"],
            ["DCA-бот", "Любой (долгосрок)", "D1–W1", "✗ Не подходит", "✓ Лучший выбор", "text-green-400", "Низкая"],
            ["Grid-бот", "Боковик ±5–10%", "H1–H4", "✗ Не подходит", "✓ Отлично", "text-green-400", "Средняя"],
            ["Тренд (EMA+RSI)", "Тренд", "M15–H4", "✓ Хорошо", "✓ Хорошо", "text-green-400", "Низкая"],
            ["Дивергенция RSI", "Разворот тренда", "H1–D1", "✓ Отлично", "✓ Отлично", "text-green-400", "Средняя"],
            ["Мартингейл", "Любой", "M1–M5", "⚠ Риск слива", "✗ Опасно", "text-red-400", "Низкая"],
          ].map(([name, market, tf, po, btc, btcColor, diff], i) => (
            <tr key={i} className="hover:bg-zinc-900/50">
              <td className="px-2 py-2 text-white font-bold whitespace-nowrap">{name}</td>
              <td className="px-2 py-2 text-zinc-400 whitespace-nowrap">{market}</td>
              <td className="px-2 py-2 text-zinc-300 whitespace-nowrap">{tf}</td>
              <td className="px-2 py-2 text-yellow-300 whitespace-nowrap">{po}</td>
              <td className={`px-2 py-2 whitespace-nowrap ${btcColor}`}>{btc}</td>
              <td className="px-2 py-2 text-zinc-400 whitespace-nowrap">{diff}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Pocket Option: что подходит */}
    <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-xl p-4 space-y-3">
      <div className="font-orbitron text-xs font-bold text-yellow-400">Pocket Option: какие стратегии работают лучше всего</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Pocket Option — бинарный брокер. Здесь вы не покупаете актив, а делаете ставку на направление движения цены за фиксированное время (1–60 минут).
        Это принципиально меняет подход к стратегии.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          {
            title: "Работает на PO",
            color: "text-green-400",
            border: "border-green-500/20",
            bg: "bg-green-500/5",
            items: [
              "Пробой уровня с подтверждением объёма",
              "Дивергенция RSI на M5/M15",
              "Торговля на новостях (за 1 мин до выхода)",
              "EMA-кросс на тренде (M5–M15)",
              "Свечные паттерны (Пин-бар, Поглощение)",
            ]
          },
          {
            title: "Не работает на PO",
            color: "text-red-400",
            border: "border-red-500/20",
            bg: "bg-red-500/5",
            items: [
              "DCA / Grid (нет удержания позиции)",
              "Стоп-лосс / Тейк-профит (не предусмотрены)",
              "Мартингейл — приводит к быстрому сливу",
              "Торговля против тренда без подтверждений",
              "Стратегии на D1/W1 — слишком долго",
            ]
          },
        ].map(({ title, color, border, bg, items }) => (
          <div key={title} className={`rounded-xl p-3 border ${border} ${bg}`}>
            <div className={`font-orbitron text-xs font-bold mb-2 ${color}`}>{title}</div>
            <ul className="space-y-1">
              {items.map((item, j) => (
                <li key={j} className="text-zinc-400 text-xs font-space-mono flex gap-1.5">
                  <span className={color}>→</span>{item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>

    {/* BTC/USDT: что подходит */}
    <div className="border border-orange-500/30 bg-orange-500/5 rounded-xl p-4 space-y-3">
      <div className="font-orbitron text-xs font-bold text-orange-400">BTC/USDT: особенности и лучшие стратегии</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        BTC/USDT — самая ликвидная криптопара с объёмом $20–40 млрд в сутки. Реагирует на макроэкономику,
        новости регуляторов и настроения рынка. Техника работает, но новостной фон важнее, чем у форекс.
      </p>
      <div className="bg-zinc-900 rounded-xl p-3 space-y-2">
        <div className="text-zinc-400 text-xs font-space-mono font-bold mb-2">Когда входить в BTC/USDT по стратегии:</div>
        {[
          { signal: "Пробой уровня $X с закрытием свечи выше + объём ×2", tf: "M15/H1", chance: "68%" },
          { signal: "Бычья дивергенция RSI на D1 + уровень поддержки", tf: "D1", chance: "72%" },
          { signal: "EMA 20 пересекает EMA 50 снизу вверх на H4", tf: "H4", chance: "61%" },
          { signal: "Скрытая бычья дивергенция на откате в тренде", tf: "H1/H4", chance: "65%" },
        ].map(({ signal, tf, chance }, i) => (
          <div key={i} className="flex items-start gap-3 bg-zinc-800 rounded-lg p-2">
            <span className="text-orange-400 font-space-mono text-xs shrink-0">→</span>
            <div className="flex-1">
              <div className="text-zinc-200 text-xs font-space-mono">{signal}</div>
              <div className="flex gap-3 mt-1">
                <span className="text-zinc-500 text-[10px] font-space-mono">TF: {tf}</span>
                <span className="text-green-400 text-[10px] font-space-mono">Win rate: ~{chance}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Лучшее время", value: "14:00–22:00 UTC", sub: "Нью-Йорк + Лондон" },
          { label: "Избегать", value: "00:00–06:00 UTC", sub: "Низкая ликвидность" },
          { label: "Новости", value: "ФРС / CPI / ETF", sub: "Выход = волатильность" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-zinc-900 rounded-lg p-2 text-center">
            <div className="text-zinc-500 text-[9px] font-space-mono mb-1">{label}</div>
            <div className="text-orange-400 text-xs font-orbitron font-bold">{value}</div>
            <div className="text-zinc-600 text-[9px] font-space-mono mt-0.5">{sub}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Вывод */}
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
      <div className="text-blue-400 font-orbitron text-xs font-bold mb-2">Главный вывод: стратегия зависит от платформы</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        На Pocket Option работают краткосрочные стратегии с чётким сигналом (пробой, дивергенция, паттерн свечи).
        На споте BTC/USDT лучшие результаты у трендовых стратегий с дивергенциями и уровнями на H1–D1.
        DCA и Grid-бот — исключительно для крипто-спота, не для бинарных опционов.
      </p>
    </div>
  </div>
)
