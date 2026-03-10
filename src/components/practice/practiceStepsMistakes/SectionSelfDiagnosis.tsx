export const SectionSelfDiagnosis = () => (
  <div className="space-y-4">
    <p className="text-gray-300 leading-relaxed">
      Еженедельный самоаудит — 15 минут в воскресенье — позволяет выявить ошибки до того,
      как они превратятся в серьёзные потери.
    </p>

    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">Еженедельный чеклист самоаудита</div>
      <div className="space-y-2">
        {[
          { q: "Win Rate за неделю ≥ 54%?", yes: "Продолжаем", no: "Анализируем последние 20 сделок", color: "text-green-400" },
          { q: "Все сделки открыты по алгоритму (не по ощущению)?", yes: "Отлично, продолжаем", no: "Выявить причины нарушений", color: "text-blue-400" },
          { q: "Ни разу не нарушили дневной стоп-лосс?", yes: "Дисциплина на уровне", no: "Зафиксировать случай, понять триггер", color: "text-yellow-400" },
          { q: "Журнал сделок заполнен полностью?", yes: "Есть аналитика для решений", no: "Завести привычку — записывать сразу", color: "text-purple-400" },
          { q: "Бот работал без сбоев всю неделю?", yes: "Система стабильна", no: "Проверить логи, добавить reconnect", color: "text-cyan-400" },
          { q: "Максимальный стейк не превысил 2%?", yes: "Риск-менеджмент соблюдён", no: "Жёстко зафиксировать в коде/правилах", color: "text-red-400" },
        ].map(({ q, yes, no, color }) => (
          <div key={q} className="bg-zinc-900 rounded-xl p-3">
            <div className={`font-space-mono text-xs font-bold ${color} mb-1`}>? {q}</div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 bg-green-500/5 border border-green-500/20 rounded-lg px-2 py-1">
                <span className="text-green-400 text-[10px] font-space-mono font-bold">Да → </span>
                <span className="text-zinc-400 text-[10px] font-space-mono">{yes}</span>
              </div>
              <div className="flex-1 bg-red-500/5 border border-red-500/20 rounded-lg px-2 py-1">
                <span className="text-red-400 text-[10px] font-space-mono font-bold">Нет → </span>
                <span className="text-zinc-400 text-[10px] font-space-mono">{no}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">3 ключевые метрики оценки результата</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            metric: "Win Rate",
            formula: "Wins / Total × 100",
            threshold: "≥ 54%",
            note: "Минимум для прибыли при payout 82%",
            color: "text-green-400 border-green-500/30",
          },
          {
            metric: "Profit Factor",
            formula: "Сумма побед / Сумма поражений",
            threshold: "≥ 1.3",
            note: "Ниже 1.0 = стратегия убыточная",
            color: "text-blue-400 border-blue-500/30",
          },
          {
            metric: "Max Drawdown",
            formula: "Макс. падение от пика",
            threshold: "≤ 15%",
            note: "Выше 20% = пересмотр риск-менеджмента",
            color: "text-yellow-400 border-yellow-500/30",
          },
        ].map(({ metric, formula, threshold, note, color }) => (
          <div key={metric} className={`bg-zinc-900 border ${color.split(" ")[1]} rounded-xl p-3`}>
            <div className={`font-orbitron text-xs font-bold ${color.split(" ")[0]} mb-1`}>{metric}</div>
            <div className="text-zinc-500 text-[10px] font-space-mono mb-2">{formula}</div>
            <div className={`font-orbitron text-sm font-bold ${color.split(" ")[0]}`}>{threshold}</div>
            <div className="text-zinc-600 text-[9px] font-space-mono mt-1">{note}</div>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-700 rounded-xl p-5">
      <div className="font-orbitron text-xs font-bold text-white mb-3">Ключевой вывод Шага 6</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed mb-3">
        Успех в трейдинге — это не про то, как угадать движение рынка. Это про то,
        как не мешать правильной стратегии работать. Большинство ошибок совершаются не от незнания,
        а от нарушения известных правил.
      </p>
      <div className="space-y-1.5">
        {[
          "Автоматизация убирает эмоциональные ошибки (1–4, 7 из списка 10)",
          "Дисциплина убирает системные ошибки (5, 6, 8–10 из списка 10)",
          "Еженедельный аудит позволяет поймать ошибки до их накопления",
          "Оценивайте стратегию по 3 метрикам: win rate, profit factor, max drawdown",
        ].map((item, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span className="text-green-400 text-xs shrink-0">✓</span>
            <span className="text-zinc-400 text-xs font-space-mono">{item}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
)
