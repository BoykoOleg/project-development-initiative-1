export const SectionEmaTrend = (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      Открываем BTC/USD на таймфрейме M5. Добавляем две EMA: 20-периодную (быстрая) и 50-периодную (медленная).
      Правило простое: <span className="text-blue-400 font-semibold">EMA 20 выше EMA 50 = восходящий тренд (CALL), ниже = нисходящий (PUT).</span>
    </p>
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex gap-3 items-start">
        <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0"></div>
        <div>
          <span className="text-green-400 font-orbitron text-xs font-bold">Бычий сигнал: </span>
          <span className="text-zinc-300 text-xs font-space-mono">EMA 20 пересекает EMA 50 снизу вверх. Цена выше обеих линий. Открываем CALL.</span>
        </div>
      </div>
      <div className="flex gap-3 items-start">
        <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0"></div>
        <div>
          <span className="text-red-400 font-orbitron text-xs font-bold">Медвежий сигнал: </span>
          <span className="text-zinc-300 text-xs font-space-mono">EMA 20 пересекает EMA 50 сверху вниз. Цена ниже обеих линий. Открываем PUT.</span>
        </div>
      </div>
      <div className="flex gap-3 items-start">
        <div className="w-2 h-2 rounded-full bg-yellow-400 mt-1.5 shrink-0"></div>
        <div>
          <span className="text-yellow-400 font-orbitron text-xs font-bold">Флэт — пропускаем: </span>
          <span className="text-zinc-300 text-xs font-space-mono">EMA переплетаются, цена ходит между линиями. В этот период профессионалы не торгуют.</span>
        </div>
      </div>
    </div>

    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
      <div className="text-blue-400 font-orbitron text-xs font-bold mb-2">Из жизни: как торгует Пол Тюдор Джонс</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Легендарный трейдер Пол Тюдор Джонс говорил: «Я смотрю на 200-дневную скользящую среднюю. Если цена ниже — у меня нет длинных позиций, точка».
        Он использует скользящие средние как фильтр — торгует только по тренду, никогда против него.
        Тот же принцип работает на M5: EMA показывает тебе направление — иди за рынком, не против него.
      </p>
    </div>
  </div>
)

export const SectionSupportResistance = (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      Уровни — это психологические зоны, где рынок многократно разворачивался. Профессиональные трейдеры ждут именно момента, когда цена подходит к уровню.
    </p>
    <div className="space-y-2">
      {[
        {
          step: "1",
          title: "Ищем локальные максимумы и минимумы",
          desc: "На M5 BTC/USD смотрим последние 3–4 часа. Где цена разворачивалась минимум 2 раза — это уровень.",
          color: "text-blue-400"
        },
        {
          step: "2",
          title: "Смотрим на круглые числа",
          desc: "BTC часто разворачивается у круглых уровней: $95,000, $96,000, $97,000. Это зоны скопления ордеров крупных игроков.",
          color: "text-purple-400"
        },
        {
          step: "3",
          title: "Ждём приближения цены к уровню",
          desc: "Не входим в середине движения. Ждём, когда цена придёт к уровню — именно здесь вероятность разворота максимальна.",
          color: "text-green-400"
        },
      ].map((item, i) => (
        <div key={i} className="flex gap-3 items-start bg-zinc-900 border border-zinc-800 rounded-lg p-3">
          <div className={`font-orbitron text-sm font-bold ${item.color} w-5 shrink-0`}>{item.step}</div>
          <div>
            <div className={`font-orbitron text-xs font-bold mb-1 ${item.color}`}>{item.title}</div>
            <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>

    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
      <div className="text-purple-400 font-orbitron text-xs font-bold mb-2">Из жизни: метод Вайкоффа в трейдинге</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Ричард Вайкофф в 1930-х годах описал, как «умные деньги» (крупные банки, фонды) накапливают позиции у ключевых уровней.
        Сегодня крипто-трейдеры используют тот же принцип: круглые уровни BTC ($95K, $100K) — это зоны, где институционалы
        выставляют лимитные ордера. Когда цена касается такого уровня, вероятность разворота резко возрастает — именно здесь и входят профессионалы.
      </p>
    </div>
  </div>
)

export const SectionBtcPracticalExample = (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      Разберём конкретную ситуацию шаг за шагом — так, как это делает профессиональный трейдер перед входом.
    </p>
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-300 mb-3">Сценарий: BTC/USD, 14:35, M5</div>
      <div className="space-y-2">
        {[
          { label: "Смотрим EMA", value: "EMA 20 = $96,420. EMA 50 = $96,180. EMA 20 выше → восходящий тренд ✓", ok: true },
          { label: "Ищем уровень", value: "Ближайший уровень сопротивления: $96,600 (разворот был дважды 2 часа назад)", ok: true },
          { label: "Позиция цены", value: "Цена на $96,580 — у уровня сопротивления. Это сигнал к PUT (отскок вниз)", ok: true },
          { label: "Решение", value: "Ждём подтверждения RSI. Без него — не входим (смотри Шаг 2)", ok: null },
        ].map((row, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className={`text-xs shrink-0 mt-0.5 font-space-mono ${row.ok === true ? "text-green-400" : row.ok === false ? "text-red-400" : "text-yellow-400"}`}>
              {row.ok === true ? "✓" : row.ok === false ? "✗" : "→"}
            </div>
            <div className="text-xs font-space-mono">
              <span className="text-zinc-500">{row.label}: </span>
              <span className="text-zinc-300">{row.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
      <div className="text-green-400 font-orbitron text-xs font-bold mb-2">Из жизни: утренний ритуал профи-трейдера</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Том Данте — известный трейдер с YouTube-каналом о Price Action — публично рассказывал о своей рутине:
        каждое утро он 15 минут смотрит на дневные и часовые графики, рисует ключевые уровни на день.
        И весь день он торгует только от этих уровней, не входя в «середине воздуха».
        Его результат: из 10 сделок 7–8 прибыльных. Секрет — терпение и ожидание уровня.
      </p>
    </div>
  </div>
)
