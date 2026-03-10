export function PlatformsComparisonTable() {
  const platforms = [
    { name: "3Commas", type: "Облачный", price: "$29–99/мес", bots: "DCA, Grid, Options", risk: "Средний", level: "Начинающий" },
    { name: "Pionex", type: "Биржа", price: "Бесплатно", bots: "16 типов (Grid, DCA, TWAP...)", risk: "Низкий", level: "Новичок" },
    { name: "Freqtrade", type: "Open-source", price: "Бесплатно", bots: "Любые (Python)", risk: "Требует знаний", level: "Продвинутый" },
    { name: "Hummingbot", type: "Open-source", price: "Бесплатно", bots: "Market-making, Arb", risk: "Требует знаний", level: "Эксперт" },
    { name: "Cryptohopper", type: "Облачный", price: "$19–99/мес", bots: "Trend, DCA, Grid", risk: "Средний", level: "Начинающий" },
    { name: "Bybit Bot", type: "Биржа", price: "Бесплатно", bots: "Grid, DCA, Spot", risk: "Низкий", level: "Новичок" },
  ]
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden my-4">
      <div className="px-4 py-2 border-b border-zinc-800">
        <p className="text-zinc-400 text-xs font-space-mono">Сравнение платформ для торговых ботов</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-space-mono">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-4 py-2 text-zinc-500">Платформа</th>
              <th className="text-left px-4 py-2 text-zinc-500">Тип</th>
              <th className="text-left px-4 py-2 text-zinc-500">Цена</th>
              <th className="text-left px-4 py-2 text-zinc-500">Боты</th>
              <th className="text-left px-4 py-2 text-zinc-500">Уровень</th>
            </tr>
          </thead>
          <tbody>
            {platforms.map((p, i) => (
              <tr key={i} className="border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors">
                <td className="px-4 py-2 text-blue-400 font-bold whitespace-nowrap">{p.name}</td>
                <td className="px-4 py-2 text-zinc-400">{p.type}</td>
                <td className="px-4 py-2 text-green-400">{p.price}</td>
                <td className="px-4 py-2 text-zinc-300">{p.bots}</td>
                <td className="px-4 py-2 text-yellow-400">{p.level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function APIKeysGuide() {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 my-4">
      <p className="text-zinc-400 text-xs font-space-mono mb-3">Как безопасно настроить API-ключи</p>
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 text-xs font-bold flex-shrink-0 mt-0.5">1</div>
          <div>
            <div className="text-white text-xs font-orbitron font-bold mb-1">Создайте API-ключ на бирже</div>
            <p className="text-zinc-400 text-xs font-space-mono">Binance: Профиль → API Management → Create API. Обязательно включите Google 2FA перед созданием.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-6 h-6 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400 text-xs font-bold flex-shrink-0 mt-0.5">2</div>
          <div>
            <div className="text-white text-xs font-orbitron font-bold mb-1">Ограничьте права ключа</div>
            <p className="text-zinc-400 text-xs font-space-mono">Разрешите только: "Enable Trading". НИКОГДА не включайте "Enable Withdrawals". Добавьте IP Restriction — только ваш VPS.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 text-xs font-bold flex-shrink-0 mt-0.5">3</div>
          <div>
            <div className="text-white text-xs font-orbitron font-bold mb-1">Сохраните Secret в безопасном месте</div>
            <p className="text-zinc-400 text-xs font-space-mono">Secret показывается ОДИН РАЗ. Сохраните в password manager (Bitwarden, 1Password). В коде — через переменные окружения, не хардкодить.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 text-xs font-bold flex-shrink-0 mt-0.5">!</div>
          <div>
            <div className="text-red-400 text-xs font-orbitron font-bold mb-1">Никогда не делайте</div>
            <p className="text-zinc-400 text-xs font-space-mono">Не передавайте ключи в чатах/скриншотах. Не используйте общий VPS. Не давайте права вывода сторонним сервисам. Ключи с правом вывода = полный доступ к счёту.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LaunchChecklist() {
  const items = [
    { category: "Тестирование", color: "text-blue-400", borderColor: "border-blue-500/30", bgColor: "bg-blue-500/5", checks: [
      "Бэктестинг на минимум 6 месяцев данных",
      "Paper trading от 2 недель с реальным рынком",
      "Стратегия протестирована на нескольких активах",
      "Проверены экстремальные сценарии (flash crash, делистинг)",
    ]},
    { category: "Безопасность", color: "text-yellow-400", borderColor: "border-yellow-500/30", bgColor: "bg-yellow-500/5", checks: [
      "API-ключи созданы без права вывода средств",
      "IP-whitelist для API (только ваш VPS/IP)",
      "Secret ключ хранится в зашифрованном виде",
      "Резервные копии конфигурации бота",
    ]},
    { category: "Инфраструктура", color: "text-purple-400", borderColor: "border-purple-500/30", bgColor: "bg-purple-500/5", checks: [
      "VPS с низкой задержкой до биржи (<50мс)",
      "Автоперезапуск при падении процесса (systemd/pm2)",
      "Мониторинг и алерты в Telegram при ошибках",
      "Логирование всех сделок и ошибок",
    ]},
    { category: "Риск-менеджмент", color: "text-red-400", borderColor: "border-red-500/30", bgColor: "bg-red-500/5", checks: [
      "Установлен дневной лимит потерь (Daily Stop Loss)",
      "Запуск с 10–20% от планируемого капитала",
      "Глобальный стоп при потере X% от депозита",
      "План действий при аномальном поведении рынка",
    ]},
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
      {items.map((cat, i) => (
        <div key={i} className={`border rounded-xl p-4 ${cat.borderColor} ${cat.bgColor}`}>
          <div className={`font-orbitron text-xs font-bold mb-3 ${cat.color}`}>{cat.category}</div>
          <ul className="space-y-2">
            {cat.checks.map((c, j) => (
              <li key={j} className="flex gap-2 text-xs font-space-mono text-zinc-400">
                <span className={`${cat.color} flex-shrink-0`}>□</span>{c}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function MonitoringDashboard() {
  const daily = [
    { metric: "P&L сегодня", value: "+$127", color: "text-green-400" },
    { metric: "Кол-во сделок", value: "34", color: "text-blue-400" },
    { metric: "Win Rate", value: "58%", color: "text-yellow-400" },
    { metric: "Открытые позиции", value: "3", color: "text-purple-400" },
    { metric: "Нереализованный P&L", value: "+$45", color: "text-green-300" },
    { metric: "Дневной лимит убытка", value: "73% использ.", color: "text-orange-400" },
  ]
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 my-4">
      <p className="text-zinc-400 text-xs font-space-mono mb-3">Пример дашборда мониторинга бота (Telegram-отчёт)</p>
      <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs">🤖</div>
          <span className="text-blue-400 text-xs font-space-mono font-bold">@MyGridBot_BTC · Ежедневный отчёт</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {daily.map((d, i) => (
            <div key={i} className="bg-zinc-950 rounded-lg p-2">
              <div className="text-zinc-500 text-xs font-space-mono mb-0.5">{d.metric}</div>
              <div className={`font-orbitron text-sm font-bold ${d.color}`}>{d.value}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-xs font-space-mono text-yellow-400">
          ⚠️ 73% дневного лимита потерь достигнуто. Рекомендуется снизить активность.
        </div>
      </div>
    </div>
  )
}
