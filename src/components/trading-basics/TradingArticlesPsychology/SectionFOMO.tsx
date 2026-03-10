import React from "react"

export const SectionFOMO = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      FOMO (Fear Of Missing Out) — страх пропустить движение. Один из самых дорогих эмоциональных паттернов в трейдинге.
      Он заставляет входить поздно, без сигнала, с завышенным риском.
    </p>
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="text-white font-orbitron text-xs font-bold mb-3">Симптомы FOMO-входа</div>
      <div className="space-y-2">
        {[
          { sign: "Цена уже выросла на 10–15%", risk: "Вы покупаете у тех, кто продаёт с прибылью", color: "text-red-400" },
          { sign: "Вход без чёткого сигнала", risk: "«Все покупают» — не является торговым сигналом", color: "text-orange-400" },
          { sign: "Размер ставки выше обычного", risk: "Жадность отключила риск-менеджмент", color: "text-yellow-400" },
          { sign: "Нет плана выхода", risk: "Вы не знаете, где стоп и где тейк", color: "text-red-400" },
        ].map((item, i) => (
          <div key={i} className="flex gap-3 items-start bg-zinc-900 border border-zinc-800 rounded-lg p-3">
            <div className={`text-xs font-space-mono ${item.color} shrink-0 mt-0.5`}>✗</div>
            <div>
              <div className={`font-orbitron text-xs font-bold mb-0.5 ${item.color}`}>{item.sign}</div>
              <p className="text-zinc-500 text-xs font-space-mono">{item.risk}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="bg-zinc-900 border border-green-500/20 rounded-xl p-4">
      <div className="text-green-400 font-orbitron text-xs font-bold mb-2">Правило «5-минутной паузы»</div>
      <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">
        Почувствовали FOMO — обязательно подождите 5 минут. Встаньте, выйдите из комнаты, сделайте чай.
        Если через 5 минут всё ещё есть чёткий сетап по вашим правилам — можно рассматривать вход.
        Если нет — значит, это было FOMO, а не сигнал. Рынок даст следующую возможность.
      </p>
    </div>
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
      <div className="text-yellow-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Джордж Сорос и умение «ничего не делать»</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Джордж Сорос в своей книге «Алхимия финансов» описывал периоды, когда лучшая сделка — никакой сделки.
        «Я заработал деньги на нескольких крупных ставках. Остальное время я просто ждал».
        Он открыто говорил, что умение сидеть в кэше и ничего не делать — один из самых сложных и прибыльных навыков.
        По его оценке, более 70% его времени занимало именно ожидание — наблюдение и подготовка, а не активная торговля.
      </p>
    </div>
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
      <div className="text-blue-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Марк Дуглас и «вероятностное мышление»</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Марк Дуглас в «Трейдинге в зоне» объяснял: FOMO возникает из убеждения, что «эта сделка — особенная, и её нельзя пропустить».
        Профессионал думает иначе: «Это просто одна из следующих 100 сделок. Если я пропущу её — ничего не изменится».
        Именно это «вероятностное мышление» убивает FOMO: любая конкретная сделка перестаёт казаться уникальной возможностью.
        Рынок работает каждый день. Возможности будут всегда.
      </p>
    </div>
  </div>
)
