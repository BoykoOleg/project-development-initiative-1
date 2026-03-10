export const SectionPlatformsComparison = () => (
  <div className="space-y-4">
    <p className="text-gray-300 leading-relaxed">
      Pocket Option, 3Commas и Pionex — три разных инструмента для разных задач. Сравниваем по ключевым параметрам,
      чтобы выбрать правильную платформу под вашу стратегию.
    </p>

    {/* Главная таблица сравнения */}
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 overflow-x-auto">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">Pocket Option vs 3Commas vs Pionex</div>
      <table className="w-full text-xs font-space-mono min-w-[580px]">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left px-2 py-2 text-zinc-500 w-36">Параметр</th>
            <th className="text-left px-2 py-2 text-yellow-400">Pocket Option</th>
            <th className="text-left px-2 py-2 text-blue-400">3Commas</th>
            <th className="text-left px-2 py-2 text-green-400">Pionex</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {[
            ["Тип платформы", "Бинарные опционы", "Управление ботами для споровых/фьючерс бирж", "Биржа со встроенными ботами"],
            ["Активы", "Валюты, крипто, акции (CFD)", "Любые (через API Binance, Bybit и др.)", "Криптовалюты (спот)"],
            ["Удержание позиции", "Нет (срок истечения)", "Да (бессрочно)", "Да (бессрочно)"],
            ["Стоп-лосс / ТП", "Нет", "Да, гибкие", "Частично (в ботах)"],
            ["Встроенные боты", "Нет (нужен свой код)", "DCA, Grid, Signal, Options", "Grid, DCA, Infinity Grid, 16+ ботов"],
            ["Стоимость", "Бесплатно (зарабатывают на спреде)", "От $14.5/мес", "Бесплатно (комиссия 0.05%)"],
            ["API для своего бота", "WebSocket (неофициальный)", "REST API + WebSocket (официальный)", "REST API (официальный)"],
            ["Регуляция", "Офшор (нет лицензии)", "Зарегистрирована в Израиле", "Cayman Islands"],
            ["Риск платформы", "Высокий (бинарные опционы)", "Средний (зависит от биржи)", "Средний (централизованная биржа)"],
            ["Лучшая стратегия", "Краткосрочные сигналы (M1–M15)", "DCA, Grid на крипто", "Grid на боковике BTC"],
          ].map(([param, po, tc, px], i) => (
            <tr key={i} className="hover:bg-zinc-900/40">
              <td className="px-2 py-2 text-zinc-500 font-bold">{param}</td>
              <td className="px-2 py-2 text-yellow-200">{po}</td>
              <td className="px-2 py-2 text-blue-200">{tc}</td>
              <td className="px-2 py-2 text-green-200">{px}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Детальные карточки */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

      {/* Pocket Option */}
      <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-orbitron text-xs font-bold text-yellow-400">Pocket Option</div>
          <span className="text-[9px] font-space-mono bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Бинарные опционы</span>
        </div>
        <div className="space-y-1">
          <div className="text-green-400 text-xs font-space-mono font-bold">Плюсы:</div>
          {["Простой старт от $10", "Демо-счёт без регистрации", "Быстрые результаты (5 мин)", "Можно автоматизировать через WS"].map((p, i) => (
            <div key={i} className="text-zinc-400 text-xs font-space-mono flex gap-1.5"><span className="text-green-400">✓</span>{p}</div>
          ))}
        </div>
        <div className="space-y-1">
          <div className="text-red-400 text-xs font-space-mono font-bold">Минусы:</div>
          {["Математика против вас (нужно 54%+ win rate)", "Нет стоп-лосса", "Офшорная регуляция", "Не подходит для DCA/Grid"].map((p, i) => (
            <div key={i} className="text-zinc-400 text-xs font-space-mono flex gap-1.5"><span className="text-red-400">✗</span>{p}</div>
          ))}
        </div>
        <div className="bg-yellow-500/10 rounded-lg p-2">
          <div className="text-yellow-400 text-[10px] font-space-mono font-bold">Для кого:</div>
          <div className="text-zinc-400 text-[10px] font-space-mono">Краткосрочная торговля с чёткими сигналами. Подходит для обучения и тестирования стратегий.</div>
        </div>
      </div>

      {/* 3Commas */}
      <div className="border border-blue-500/30 bg-blue-500/5 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-orbitron text-xs font-bold text-blue-400">3Commas</div>
          <span className="text-[9px] font-space-mono bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Управление ботами</span>
        </div>
        <div className="space-y-1">
          <div className="text-green-400 text-xs font-space-mono font-bold">Плюсы:</div>
          {["Подключается к Binance, Bybit, OKX", "Готовые DCA и Grid боты", "Сигналы от сообщества TradingView", "Подробная аналитика и статистика"].map((p, i) => (
            <div key={i} className="text-zinc-400 text-xs font-space-mono flex gap-1.5"><span className="text-green-400">✓</span>{p}</div>
          ))}
        </div>
        <div className="space-y-1">
          <div className="text-red-400 text-xs font-space-mono font-bold">Минусы:</div>
          {["Платный от $14.5/мес", "Нужен аккаунт на бирже + API", "Сложнее для новичков", "В 2022 году был взломан"].map((p, i) => (
            <div key={i} className="text-zinc-400 text-xs font-space-mono flex gap-1.5"><span className="text-red-400">✗</span>{p}</div>
          ))}
        </div>
        <div className="bg-blue-500/10 rounded-lg p-2">
          <div className="text-blue-400 text-[10px] font-space-mono font-bold">Для кого:</div>
          <div className="text-zinc-400 text-[10px] font-space-mono">Опытные трейдеры с аккаунтом на Binance/Bybit, которым нужна гибкая автоматизация DCA и Grid.</div>
        </div>
      </div>

      {/* Pionex */}
      <div className="border border-green-500/30 bg-green-500/5 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-orbitron text-xs font-bold text-green-400">Pionex</div>
          <span className="text-[9px] font-space-mono bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Биржа + боты</span>
        </div>
        <div className="space-y-1">
          <div className="text-green-400 text-xs font-space-mono font-bold">Плюсы:</div>
          {["Боты встроены в биржу — бесплатно", "16+ типов ботов из коробки", "Комиссия всего 0.05%", "Простой интерфейс для Grid BTC"].map((p, i) => (
            <div key={i} className="text-zinc-400 text-xs font-space-mono flex gap-1.5"><span className="text-green-400">✓</span>{p}</div>
          ))}
        </div>
        <div className="space-y-1">
          <div className="text-red-400 text-xs font-space-mono font-bold">Минусы:</div>
          {["Меньше пар чем Binance", "Нет продвинутой аналитики", "Ограниченная кастомизация", "Ликвидность ниже топ-бирж"].map((p, i) => (
            <div key={i} className="text-zinc-400 text-xs font-space-mono flex gap-1.5"><span className="text-red-400">✗</span>{p}</div>
          ))}
        </div>
        <div className="bg-green-500/10 rounded-lg p-2">
          <div className="text-green-400 text-[10px] font-space-mono font-bold">Для кого:</div>
          <div className="text-zinc-400 text-[10px] font-space-mono">Лучший выбор для запуска Grid-бота на BTC/USDT без написания кода и без абонентской платы.</div>
        </div>
      </div>
    </div>

    {/* Матрица выбора */}
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">Матрица выбора: что использовать под вашу задачу</div>
      <div className="space-y-2">
        {[
          { goal: "Хочу попробовать торговлю с минимальным депозитом", winner: "Pocket Option", why: "Старт от $10, демо без регистрации, быстрый результат", color: "text-yellow-400" },
          { goal: "Хочу Grid-бот на BTC/USDT без кода и бесплатно", winner: "Pionex", why: "Встроенный Grid-бот, 0.05% комиссия, спот-торговля BTC", color: "text-green-400" },
          { goal: "Хочу DCA-бот + подключить Binance/Bybit аккаунт", winner: "3Commas", why: "Лучшая интеграция с биржами, готовые DCA-боты", color: "text-blue-400" },
          { goal: "Хочу написать своего бота на Python под стратегию", winner: "Pionex / Bybit API", why: "Официальный REST API, документация, тестнет для бэктеста", color: "text-green-400" },
          { goal: "Хочу автоматизировать торговлю на Pocket Option", winner: "Свой бот (WebSocket)", why: "Неофициальный WS API + Python, описан в Шаге 5 этого курса", color: "text-purple-400" },
        ].map(({ goal, winner, why, color }, i) => (
          <div key={i} className="bg-zinc-900 rounded-xl p-3 flex gap-3 items-start">
            <div className="text-zinc-600 font-space-mono text-xs shrink-0 w-5">{i + 1}.</div>
            <div className="flex-1">
              <div className="text-zinc-300 text-xs font-space-mono mb-1">{goal}</div>
              <div className="flex gap-2 items-center flex-wrap">
                <span className={`font-orbitron text-xs font-bold ${color}`}>→ {winner}</span>
                <span className="text-zinc-500 text-[10px] font-space-mono">{why}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Итог */}
    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
      <div className="text-purple-400 font-orbitron text-xs font-bold mb-2">Рекомендация: с чего начать</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Если вы новичок — начните с <span className="text-yellow-400 font-bold">Pocket Option демо</span> для отработки стратегий,
        затем перейдите на <span className="text-green-400 font-bold">Pionex</span> для запуска Grid-бота на BTC/USDT без абонентской платы.
        Когда наберёте статистику и понимание — используйте <span className="text-blue-400 font-bold">3Commas</span> для более гибкой автоматизации
        или пишите своего бота на Python (Шаг 5 этого курса).
      </p>
    </div>
  </div>
)
