export const SectionCourseSummary = () => (
  <div className="space-y-4">
    <p className="text-gray-300 leading-relaxed">
      Вы прошли полный путь: от понимания рынка до работающего бота с риск-менеджментом.
      Вот всё, что разобрали в курсе — в одном месте.
    </p>

    <div className="space-y-2">
      {[
        {
          step: "Шаг 1", title: "Анализ рынка",
          items: ["Тренд через EMA 20/50", "Уровни поддержки и сопротивления", "Таймфрейм M5 для BTC/USDT"],
          color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/5",
        },
        {
          step: "Шаг 2", title: "Формирование сигнала",
          items: ["RSI-фильтр (< 35 CALL, > 65 PUT)", "Свечной паттерн как третье подтверждение", "Конфлюэнс: только 3 из 3"],
          color: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/5",
        },
        {
          step: "Шаг 3", title: "Риск-менеджмент",
          items: ["2% депозита на сделку", "Дневной стоп-лосс −6%", "Журнал каждой сделки"],
          color: "text-red-400", border: "border-red-500/30", bg: "bg-red-500/5",
        },
        {
          step: "Шаг 4", title: "Выбор платформы и стратегии",
          items: ["Pocket Option, 3Commas, Pionex — сравнение", "DCA-бот и Grid-бот: когда применять", "Матрица выбора под задачу"],
          color: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/5",
        },
        {
          step: "Шаг 5", title: "Автоматизация на Python",
          items: ["Готовый бот «Три подтверждения» (~200 строк)", "Деплой на VPS 24/7 + supervisor", "Telegram-алерты и мониторинг"],
          color: "text-indigo-400", border: "border-indigo-500/30", bg: "bg-indigo-500/5",
        },
        {
          step: "Шаг 6", title: "Устранение ошибок",
          items: ["10 поведенческих ошибок и как их избежать", "Психологические ловушки: FOMO, мартингейл", "Еженедельный аудит: win rate, profit factor"],
          color: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/5",
        },
      ].map(({ step, title, items, color, border, bg }) => (
        <div key={step} className={`${bg} border ${border} rounded-xl p-4`}>
          <div className="flex items-center gap-3 mb-2">
            <span className={`font-orbitron text-xs font-bold ${color}`}>{step}</span>
            <span className="font-orbitron text-xs font-bold text-white">{title}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5">
            {items.map((item) => (
              <div key={item} className="flex gap-1.5 items-center">
                <span className={`text-[9px] ${color}`}>✓</span>
                <span className="text-zinc-400 text-[10px] font-space-mono">{item}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>

    <div className="bg-gradient-to-r from-green-500/10 to-zinc-950 border border-green-500/30 rounded-xl p-5">
      <div className="text-green-400 font-orbitron text-xs font-bold mb-2">Главный вывод курса</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Прибыльная торговля — это не про угадывание рынка. Это про систему, которая повторяется:
        один и тот же анализ, одни и те же правила входа, один и тот же риск-менеджмент.
        Автоматизация убирает эмоции. Дисциплина убирает ошибки. Аудит убирает слепые пятна.
      </p>
    </div>
  </div>
)
