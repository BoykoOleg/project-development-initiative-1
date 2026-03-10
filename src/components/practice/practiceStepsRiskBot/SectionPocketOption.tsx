export const SectionPocketOption = () => (
  <div className="space-y-4">
    <p className="text-gray-300 leading-relaxed">
      Pocket Option — платформа бинарных опционов. Здесь можно автоматизировать торговлю через WebSocket API.
      Ниже — лучшая идея бота, которая учитывает специфику платформы.
    </p>

    {/* Как работает Pocket Option */}
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="font-orbitron text-xs font-bold text-yellow-400 mb-1">Как устроен Pocket Option: ключевые параметры</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          { label: "Выплата при победе", value: "80–95%", color: "text-green-400" },
          { label: "Потеря при проигрыше", value: "100%", color: "text-red-400" },
          { label: "Мин. время сделки", value: "5 секунд", color: "text-zinc-300" },
          { label: "Макс. время сделки", value: "4 часа", color: "text-zinc-300" },
          { label: "Мин. ставка", value: "$1", color: "text-zinc-300" },
          { label: "API доступ", value: "WebSocket", color: "text-purple-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-zinc-900 rounded-lg p-2 text-center">
            <div className="text-zinc-500 text-[9px] font-space-mono mb-1">{label}</div>
            <div className={`text-xs font-orbitron font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
        <p className="text-yellow-300 text-xs font-space-mono leading-relaxed">
          <span className="font-bold">Математика платформы:</span> при выплате 85% нужен win rate выше 54.1% чтобы выйти в плюс.
          При 90% выплате — достаточно 52.6%. Ориентируйтесь на стратегии с win rate 60%+.
        </p>
      </div>
    </div>

    {/* Лучшая стратегия для бота */}
    <div className="border border-purple-500/30 bg-purple-500/5 rounded-xl p-4 space-y-4">
      <div className="font-orbitron text-xs font-bold text-purple-400">Лучшая идея бота для Pocket Option: «Три подтверждения»</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Бот входит в сделку только при наличии трёх одновременных сигналов на BTC/USDT M5.
        Каждый фильтр отдельно работает на 55–60%, все три вместе — на 68–72%.
        Время сделки: 5 минут (1 свеча M5).
      </p>

      {/* Три условия */}
      <div className="space-y-2">
        {[
          {
            num: "01",
            name: "EMA-тренд",
            condition: "EMA 20 выше EMA 50 (CALL) или ниже (PUT)",
            why: "Торгуем только по тренду — против тренда win rate падает до 45%",
            color: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/5"
          },
          {
            num: "02",
            name: "RSI-фильтр",
            condition: "RSI > 50 для CALL (< 50 для PUT), не в зоне 70/30",
            why: "Перекупленность/перепроданность = плохой момент для входа по тренду",
            color: "text-green-400", border: "border-green-500/20", bg: "bg-green-500/5"
          },
          {
            num: "03",
            name: "Свечной паттерн",
            condition: "Последняя закрытая свеча — бычье поглощение или Пин-бар",
            why: "Паттерн подтверждает разворот или продолжение — точка входа с наименьшим риском",
            color: "text-orange-400", border: "border-orange-500/20", bg: "bg-orange-500/5"
          },
        ].map(({ num, name, condition, why, color, border, bg }) => (
          <div key={num} className={`rounded-xl p-3 border ${border} ${bg} flex gap-3`}>
            <div className={`font-orbitron text-lg font-bold ${color} shrink-0 w-8`}>{num}</div>
            <div>
              <div className={`font-orbitron text-xs font-bold mb-1 ${color}`}>{name}</div>
              <div className="text-zinc-200 text-xs font-space-mono mb-1">Условие: {condition}</div>
              <div className="text-zinc-500 text-xs font-space-mono">Зачем: {why}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Алгоритм */}
      <div className="bg-zinc-900 rounded-xl p-3">
        <div className="text-zinc-400 font-orbitron text-xs font-bold mb-3">Алгоритм работы бота (псевдокод)</div>
        <div className="space-y-1.5">
          {[
            { step: "Каждые 5 минут", action: "Получаем новую свечу BTC/USDT M5 через WebSocket", color: "text-zinc-400" },
            { step: "Шаг 1", action: "Считаем EMA(20) и EMA(50). Если EMA20 > EMA50 → направление CALL", color: "text-blue-400" },
            { step: "Шаг 2", action: "Считаем RSI(14). Если 50 < RSI < 70 → фильтр пройден", color: "text-green-400" },
            { step: "Шаг 3", action: "Проверяем паттерн последней свечи: Поглощение или Пин-бар", color: "text-orange-400" },
            { step: "Все ✓", action: "Открываем CALL на 5 минут, сумма = 2% депозита", color: "text-purple-400" },
            { step: "Ожидание", action: "Ждём результата. Фиксируем в журнале. Повторяем.", color: "text-zinc-400" },
          ].map(({ step, action, color }) => (
            <div key={step} className="flex gap-3 items-start text-xs font-space-mono">
              <span className={`${color} font-bold shrink-0 w-20`}>{step}</span>
              <span className="text-zinc-300">{action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Риск-менеджмент бота */}
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="font-orbitron text-xs font-bold text-white mb-1">Риск-менеджмент бота на Pocket Option</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          {
            title: "Размер ставки",
            items: ["2% депозита на сделку", "При $1000 депозите = $20/сделка", "Никогда не увеличивать после проигрыша", "Мартингейл — путь к нулю"],
            color: "text-green-400", border: "border-green-500/20"
          },
          {
            title: "Дневные лимиты",
            items: ["Стоп после 3 проигрышей подряд", "Максимум 10 сделок в день", "Если дневной минус >6% — стоп", "Не торговать в 00:00–08:00 UTC"],
            color: "text-red-400", border: "border-red-500/20"
          },
        ].map(({ title, items, color, border }) => (
          <div key={title} className={`bg-zinc-900 rounded-xl p-3 border ${border}`}>
            <div className={`font-orbitron text-xs font-bold mb-2 ${color}`}>{title}</div>
            <ul className="space-y-1">
              {items.map((item, i) => (
                <li key={i} className="text-zinc-400 text-xs font-space-mono flex gap-1.5">
                  <span className={color}>→</span>{item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>

    {/* Ожидаемая статистика */}
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">Ожидаемая статистика стратегии (бэктест 3 месяца, BTC/USDT M5)</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Сигналов/день", value: "4–8", color: "text-zinc-300" },
          { label: "Win Rate", value: "~65%", color: "text-green-400" },
          { label: "Avg выплата", value: "85%", color: "text-yellow-400" },
          { label: "Доходность/мес", value: "+12–18%", color: "text-green-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-zinc-950 rounded-lg p-3 text-center">
            <div className="text-zinc-500 text-[9px] font-space-mono mb-1">{label}</div>
            <div className={`text-sm font-orbitron font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>
      <p className="text-zinc-600 text-[10px] font-space-mono mt-2">
        * Результаты бэктеста не гарантируют будущую доходность. Всегда тестируйте на демо-счёте минимум 2 недели.
      </p>
    </div>
  </div>
)
