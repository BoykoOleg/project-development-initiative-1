import React from "react"

export const SectionFearGreed = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      Уоррен Баффетт сформулировал главный принцип поведения на рынке лаконично: «Бойтесь, когда другие жадны, и будьте жадны, когда другие боятся».
      Звучит просто. Выполнять — крайне сложно, потому что наш мозг устроен ровно наоборот.
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
        <div className="text-red-400 font-orbitron text-xs font-bold mb-2">Страх — враг №1</div>
        <div className="space-y-2 text-xs font-space-mono text-zinc-400">
          <div className="flex gap-2"><span className="text-red-400">→</span><span>Выход из прибыльной сделки слишком рано («а вдруг развернётся»)</span></div>
          <div className="flex gap-2"><span className="text-red-400">→</span><span>Пропуск хороших сетапов («боюсь ошибиться»)</span></div>
          <div className="flex gap-2"><span className="text-red-400">→</span><span>Сдвиг стоп-лосса в убыток («не хочу фиксировать потерю»)</span></div>
          <div className="flex gap-2"><span className="text-red-400">→</span><span>Паника и закрытие позиций на дне</span></div>
        </div>
      </div>
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
        <div className="text-yellow-400 font-orbitron text-xs font-bold mb-2">Жадность — враг №2</div>
        <div className="space-y-2 text-xs font-space-mono text-zinc-400">
          <div className="flex gap-2"><span className="text-yellow-400">→</span><span>Увеличение ставки после серии побед («я поймал волну»)</span></div>
          <div className="flex gap-2"><span className="text-yellow-400">→</span><span>Вход без сигнала («надо же что-то делать»)</span></div>
          <div className="flex gap-2"><span className="text-yellow-400">→</span><span>Удержание убыточной позиции («должно отрасти»)</span></div>
          <div className="flex gap-2"><span className="text-yellow-400">→</span><span>FOMO — вход на хаях из-за страха пропустить движение</span></div>
        </div>
      </div>
    </div>
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
      <div className="text-blue-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Джесси Ливермор и «рынок мести»</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Джесси Ливермор трижды терял многомиллионные состояния — и каждый раз по одной причине: «торговля мести».
        После убыточной позиции он нарушал собственные правила, увеличивал размер, торговал чаще — пытаясь «отыграться» у рынка.
        «Рынок никому не должен. Мстить ему так же бессмысленно, как мстить океану за шторм», — написал он в мемуарах.
        Осознание страха и жадности как физиологических реакций мозга — первый шаг к профессиональной торговле.
      </p>
    </div>
    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
      <div className="text-purple-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Дэниел Канеман и «система 1 vs система 2»</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Нобелевский лауреат по экономике Дэниел Канеман описал два режима мышления человека.
        «Система 1» — быстрая, интуитивная, эмоциональная: именно она кричит «покупай!» на хаях и «продавай!» на паниках.
        «Система 2» — медленная, аналитическая, логическая: она следует правилам и чеклистам.
        Профессиональный трейдер — это человек, научившийся в критические моменты переключаться на Систему 2.
        Торговый план и чеклист — это буквально инструмент принудительного включения Системы 2.
      </p>
    </div>
  </div>
)
