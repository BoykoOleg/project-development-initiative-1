export const SectionDecisionAlgorithm = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      Этот алгоритм объединяет всё — анализ рынка, подтверждения, риск-менеджмент. Занимает 5 минут.
      Если хотя бы один пункт не выполнен — сделку не открываем.
    </p>
    <div className="space-y-2">
      {[
        { step: "01", category: "Рынок", text: "Открыл M5 BTC/USD. Определил направление тренда через EMA 20/50", color: "text-blue-400" },
        { step: "02", category: "Уровни", text: "Нашёл ближайшие уровни поддержки/сопротивления. Цена у уровня? Да/Нет", color: "text-yellow-400" },
        { step: "03", category: "RSI", text: "Проверил RSI: при PUT — выше 65, при CALL — ниже 35. Подтверждает?", color: "text-purple-400" },
        { step: "04", category: "Конфлюэнс", text: "Все 3 сигнала совпадают? Если только 2 — пропускаем сделку", color: "text-orange-400" },
        { step: "05", category: "Риск", text: "Считаю ставку: 2% от депозита. Проверяю: не превышен ли дневной лимит (-6%)?", color: "text-red-400" },
        { step: "06", category: "Вход", text: "Устанавливаю ставку, выбираю экспирацию 3–5 мин. Открываю сделку.", color: "text-green-400" },
        { step: "07", category: "Журнал", text: "Записываю: дата, сигнал, ставка, причины входа, результат", color: "text-zinc-400" },
      ].map((item, i) => (
        <div key={i} className="flex gap-3 items-start bg-zinc-900 border border-zinc-800 rounded-lg p-3">
          <div className={`font-orbitron text-xs font-bold ${item.color} w-6 shrink-0 mt-0.5`}>{item.step}</div>
          <div>
            <span className={`font-orbitron text-xs font-bold ${item.color}`}>{item.category}: </span>
            <span className="text-zinc-300 text-xs font-space-mono">{item.text}</span>
          </div>
        </div>
      ))}
    </div>

    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
      <div className="text-green-400 font-orbitron text-xs font-bold mb-2">Из жизни: предторговый ритуал Брюса Ковнера</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Брюс Ковнер — один из самых успешных макро-трейдеров мира, управлявший $14 млрд в Caxton Associates —
        каждое утро проходил один и тот же ритуал: проверял новости, ключевые уровни, позиции крупных игроков.
        Только после этого он принимал решения. «Хорошая торговля — это скучно», — говорил он.
        Профессионалы не ищут адреналин. Они ищут повторяемость: один и тот же процесс, снова и снова.
      </p>
    </div>
  </div>
)
