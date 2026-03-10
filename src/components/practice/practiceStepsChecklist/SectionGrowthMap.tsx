export const SectionGrowthMap = () => (
  <div className="space-y-4">
    <p className="text-gray-300 leading-relaxed">
      Прохождение курса — это старт, не финиш. Вот конкретный план действий после завершения всех 6 шагов.
    </p>

    <div className="space-y-2">
      {[
        {
          phase: "Неделя 1–2",
          label: "Демо-режим",
          tasks: [
            "50 сделок на демо-счёте Pocket Option строго по алгоритму",
            "Заполнять журнал сделок после каждого входа",
            "Цель: win rate ≥ 54% на 50 сделках",
          ],
          color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/5",
        },
        {
          phase: "Неделя 3–4",
          label: "Бэктест бота",
          tasks: [
            "Запустить backtest.py на 500+ свечах M5",
            "Убедиться: win rate ≥ 54%, max drawdown ≤ 15%",
            "Настроить Telegram-алерты",
          ],
          color: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/5",
        },
        {
          phase: "Месяц 2",
          label: "Реальный счёт (мин. депозит)",
          tasks: [
            "Пополнить счёт от $50–100, не больше",
            "Запустить бота на VPS в демо-режиме ещё 2 недели",
            "Переключить DEMO_MODE=false только при стабильном плюсе",
          ],
          color: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/5",
        },
        {
          phase: "Месяц 3+",
          label: "Масштабирование",
          tasks: [
            "Еженедельный аудит по чеклисту Шага 6",
            "Добавить второй актив только после 3 прибыльных месяцев",
            "Изучить Grid-бот на Pionex для BTC/USDT как параллельную стратегию",
          ],
          color: "text-green-400", border: "border-green-500/30", bg: "bg-green-500/5",
        },
      ].map(({ phase, label, tasks, color, border, bg }) => (
        <div key={phase} className={`${bg} border ${border} rounded-xl p-4`}>
          <div className="flex items-center gap-3 mb-2">
            <span className={`font-orbitron text-[10px] font-bold ${color} bg-black/30 px-2 py-0.5 rounded-full shrink-0`}>{phase}</span>
            <span className={`font-orbitron text-xs font-bold ${color}`}>{label}</span>
          </div>
          <div className="space-y-1">
            {tasks.map((t) => (
              <div key={t} className="flex gap-2 items-start">
                <span className={`text-[10px] ${color} shrink-0 mt-0.5`}>→</span>
                <span className="text-zinc-400 text-[10px] font-space-mono leading-relaxed">{t}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>

    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">Полезные разделы для продолжения</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {[
          { label: "Основы трейдинга", href: "/trading-basics", desc: "Тренд, уровни, RSI — фундамент анализа", color: "text-red-400" },
          { label: "Гайд по ботам", href: "/bots-guide", desc: "Grid, DCA, сравнение платформ", color: "text-blue-400" },
          { label: "Конструктор ботов", href: "/bot-builder", desc: "Python-код под вашу стратегию", color: "text-purple-400" },
          { label: "Шаг 6: ошибки", href: "/practice", desc: "Психология, аудит, метрики результата", color: "text-orange-400" },
        ].map(({ label, href, desc, color }) => (
          <a key={label} href={href}
            className="flex gap-2 items-start bg-zinc-900 border border-zinc-800 rounded-xl p-3 hover:border-zinc-600 transition-colors">
            <div>
              <div className={`font-orbitron text-xs font-bold ${color}`}>{label}</div>
              <div className="text-zinc-500 text-[10px] font-space-mono mt-0.5">{desc}</div>
            </div>
          </a>
        ))}
      </div>
    </div>

    <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-5 text-center">
      <div className="font-orbitron text-sm font-bold text-white mb-2">Вы прошли полный курс</div>
      <p className="text-zinc-400 text-xs font-space-mono leading-relaxed max-w-md mx-auto">
        6 шагов · 20+ секций · готовый Python-бот · система риск-менеджмента · еженедельный аудит.
        Теперь у вас есть всё для системной торговли. Следующий шаг — первые 50 сделок на демо.
      </p>
    </div>
  </div>
)
