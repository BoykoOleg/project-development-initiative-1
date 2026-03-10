import React from "react"

export const SectionTradingPlan = () => (
  <>
    <div className="space-y-3">
      <p className="text-gray-300 leading-relaxed">
        Торговый план — это ваша конституция. Написан заранее, в спокойном состоянии. Во время торговли вы не принимаете решений — вы только следуете плану.
      </p>
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
        <div className="text-white font-orbitron text-xs font-bold mb-3">Структура торгового плана</div>
        <div className="space-y-2">
          {[
            { n: "01", title: "Рынок и инструмент", desc: "Какой актив торгую, в какое время (сессии), какой тайм-фрейм", color: "text-blue-400" },
            { n: "02", title: "Условия входа", desc: "Точный набор условий: тренд + уровень + индикатор. Если не все — не вхожу", color: "text-purple-400" },
            { n: "03", title: "Размер позиции", desc: "Риск 1–2% на сделку. Формула расчёта. Максимальный дневной убыток", color: "text-red-400" },
            { n: "04", title: "Место стоп-лосса", desc: "Где стоп — за уровень, за структуру, фиксированный %", color: "text-orange-400" },
            { n: "05", title: "Цель (Take Profit)", desc: "Минимальный R:R 1:2. Частичная фиксация или полный выход", color: "text-green-400" },
            { n: "06", title: "Правила остановки", desc: "3 убытка подряд = стоп на день. -6% от депо = стоп на день", color: "text-yellow-400" },
            { n: "07", title: "Запрещённые действия", desc: "Торговля без сигнала, сдвиг стопа, увеличение после убытка", color: "text-zinc-400" },
          ].map((item, i) => (
            <div key={i} className="flex gap-3 items-start bg-zinc-900 border border-zinc-800 rounded-lg p-3">
              <div className={`font-orbitron text-xs font-bold ${item.color} w-6 shrink-0`}>{item.n}</div>
              <div>
                <div className={`font-orbitron text-xs font-bold mb-0.5 ${item.color}`}>{item.title}</div>
                <p className="text-zinc-500 text-xs font-space-mono">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
        <div className="text-green-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Рэй Далио и «принципы» как торговый план</div>
        <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
          Рэй Далио потратил 30 лет на создание своих «Принципов» — детальных правил принятия решений в любой ситуации.
          Его подход: задокументировать каждое правило, которое привело к успеху, и следовать ему автоматически.
          «Когда ты принимаешь решение в момент стресса — ты принимаешь плохое решение. Хорошие решения принимаются заранее».
          Именно поэтому Bridgewater Associates превратила торговые правила в алгоритмы: чтобы исключить человеческие эмоции из процесса.
        </p>
      </div>
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
        <div className="text-orange-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Ричард Деннис и «Черепахи» — система вместо интуиции</div>
        <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
          В 1983 году Ричард Деннис поспорил, что можно научить любого человека торговать прибыльно — если дать ему чёткий план.
          Он взял 13 человек без опыта, за 2 недели передал им торговый план («Систему Черепах») и дал реальные деньги.
          За 5 лет они заработали суммарно $175 млн. Большинство следовало плану без исключений.
          Те, кто отступал от правил «по интуиции», — теряли деньги. Это доказательство: план важнее интуиции.
        </p>
      </div>
    </div>
    <div className="space-y-3 mt-4">
      <p className="text-gray-300 leading-relaxed">
        Серии убытков — нормальная часть любой торговой системы. Даже при win rate 60% возможны серии из 8–10 проигрышей подряд.
        Как вы реагируете на просадку — определяет долгосрочный результат.
      </p>
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
        <div className="text-white font-orbitron text-xs font-bold mb-3">Вероятность серий проигрышей при разном Win Rate</div>
        <div className="space-y-2">
          {[
            { wr: "60%", streak5: "1.02%", streak8: "0.17%", streak10: "0.04%" },
            { wr: "55%", streak5: "1.84%", streak8: "0.42%", streak10: "0.12%" },
            { wr: "50%", streak5: "3.13%", streak8: "0.78%", streak10: "0.25%" },
          ].map((row, i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-space-mono">
              <span className="text-purple-400 font-bold w-12 shrink-0">WR {row.wr}</span>
              <div className="flex-1 grid grid-cols-3 gap-2">
                <div className="bg-zinc-900 rounded p-1.5 text-center">
                  <div className="text-zinc-500 text-xs">5 подряд</div>
                  <div className="text-yellow-400 font-bold">{row.streak5}</div>
                </div>
                <div className="bg-zinc-900 rounded p-1.5 text-center">
                  <div className="text-zinc-500 text-xs">8 подряд</div>
                  <div className="text-orange-400 font-bold">{row.streak8}</div>
                </div>
                <div className="bg-zinc-900 rounded p-1.5 text-center">
                  <div className="text-zinc-500 text-xs">10 подряд</div>
                  <div className="text-red-400 font-bold">{row.streak10}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-zinc-500 text-xs font-space-mono mt-3">При 1000 сделках с WR 55% серия из 8 убытков случится ~4 раза. Это норма, не катастрофа.</p>
      </div>
      <div className="space-y-2">
        {[
          {
            step: "1",
            title: "Снизьте размер позиции вдвое",
            desc: "При серии из 3+ убытков — уменьшите ставку до 1%. Это сохранит капитал и снизит эмоциональный стресс.",
            color: "text-blue-400",
            border: "border-blue-500/30"
          },
          {
            step: "2",
            title: "Сделайте паузу и проверьте систему",
            desc: "Проанализируйте последние сделки: вы нарушали правила? Изменился рынок? Система сломана или просто полоса?",
            color: "text-yellow-400",
            border: "border-yellow-500/30"
          },
          {
            step: "3",
            title: "Не меняйте систему в просадке",
            desc: "Самая частая ошибка — менять стратегию в момент убытков. Это гарантированный способ потерять ещё больше.",
            color: "text-red-400",
            border: "border-red-500/30"
          },
          {
            step: "4",
            title: "Возвращайтесь постепенно",
            desc: "После паузы — сначала торгуйте минимальным лотом. Восстановите уверенность на малых ставках, потом возвращайтесь к обычному размеру.",
            color: "text-green-400",
            border: "border-green-500/30"
          },
        ].map((item, i) => (
          <div key={i} className={`flex gap-3 items-start bg-zinc-900 border ${item.border} rounded-lg p-3`}>
            <div className={`font-orbitron text-sm font-bold ${item.color} shrink-0 w-5`}>{item.step}</div>
            <div>
              <div className={`font-orbitron text-xs font-bold mb-1 ${item.color}`}>{item.title}</div>
              <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
        <div className="text-purple-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Брюс Ковнер — «я просто жду»</div>
        <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
          Брюс Ковнер — управляющий Caxton Associates ($14 млрд), один из самых прибыльных макро-трейдеров мира —
          рассказывал, что в периоды убытков он не торговал активнее, а, наоборот, полностью останавливался.
          «Когда у меня просадка 10% — я закрываю все позиции и просто смотрю. Жду, пока не почувствую ясность».
          За 28 лет управления Caxton он не показал ни одного убыточного года. Умение остановиться — часть этого результата.
        </p>
      </div>
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
        <div className="text-red-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Пол Тюдор Джонс — правило «5%»</div>
        <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
          Пол Тюдор Джонс публично говорил о своём железном правиле: если за день потеряно 5% капитала — торговля на сегодня закончена.
          «Я не торгую, когда я в минусе на 5%. Потому что знаю: в таком состоянии я приму плохие решения».
          Он также снижал размер позиций после каждого убыточного периода — автоматически, без дискуссий.
          Это позволяло ему «пережить» плохие полосы с минимальными потерями и вернуться в игру свежим.
        </p>
      </div>
    </div>
  </>
)
