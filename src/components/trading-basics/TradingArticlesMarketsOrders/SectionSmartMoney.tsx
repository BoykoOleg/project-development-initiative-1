import React from "react"

export const SectionSmartMoney = () => (
  <div className="space-y-4">
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex gap-2 items-center">
      <span className="text-red-400 text-lg">⚠</span>
      <p className="text-red-300 text-xs font-space-mono">Этот раздел для продвинутых трейдеров. Концепции основаны на методологии ICT (Inner Circle Trader) и SMC (Smart Money Concepts).</p>
    </div>
    <p className="text-gray-300 leading-relaxed">Smart Money — это крупные институциональные игроки (банки, фонды), которые двигают рынок. Их задача: набрать позицию по лучшей цене, не показывая намерений. Для этого они создают ловушки для розничных трейдеров.</p>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {[
        { title: "Stop Hunt (Охота за стопами)", color: "border-red-500/40 bg-red-500/5", tc: "text-red-400", desc: "Цена намеренно пробивает очевидные уровни поддержки/сопротивления, выбивает стоп-лоссы большинства розничных трейдеров — и разворачивается. Это не случайность, это ликвидность для Smart Money." },
        { title: "Fair Value Gap (FVG)", color: "border-blue-500/40 bg-blue-500/5", tc: "text-blue-400", desc: "Разрыв в ценовом диапазоне из трёх свечей, где не было двустороннего обмена. Рынок часто возвращается заполнить FVG перед продолжением тренда. Мощная зона для входа." },
        { title: "Order Block (OB)", color: "border-purple-500/40 bg-purple-500/5", tc: "text-purple-400", desc: "Последняя бычья/медвежья свеча перед импульсным движением. Место накопления позиций Smart Money. Цена часто возвращается к OB для добора позиции." },
      ].map((item, i) => (
        <div key={i} className={`border rounded-xl p-3 ${item.color}`}>
          <div className={`font-orbitron text-xs font-bold mb-2 ${item.tc}`}>{item.title}</div>
          <p className="text-zinc-400 text-xs leading-relaxed">{item.desc}</p>
        </div>
      ))}
    </div>
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="text-white font-orbitron text-xs font-bold mb-3">Структура рынка (Market Structure)</div>
      <svg viewBox="0 0 360 120" className="w-full h-28">
        <polyline points="20,100 60,80 80,90 120,55 140,70 190,30 210,45 250,20 280,35 320,15" fill="none" stroke="#e5e7eb" strokeWidth="1.5" />
        {[[120,55],[190,30],[250,20]].map(([x,y],i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="4" fill="#22c55e" />
            <text x={x} y={y-8} fontSize="7" fill="#22c55e" textAnchor="middle" fontFamily="monospace">HH</text>
          </g>
        ))}
        {[[80,90],[140,70],[210,45]].map(([x,y],i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="4" fill="#60a5fa" />
            <text x={x} y={y+14} fontSize="7" fill="#60a5fa" textAnchor="middle" fontFamily="monospace">HL</text>
          </g>
        ))}
        <text x="180" y="115" fontSize="8" fill="#52525b" textAnchor="middle" fontFamily="monospace">Бычий тренд: HH (Higher High) + HL (Higher Low)</text>
      </svg>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="bg-zinc-900 rounded-lg p-3">
          <div className="text-green-400 font-orbitron text-xs font-bold mb-1">Бычья структура</div>
          <p className="text-zinc-400 text-xs font-space-mono">HH + HL — каждый максимум и минимум выше предыдущего. Торгуем только лонги на HL.</p>
        </div>
        <div className="bg-zinc-900 rounded-lg p-3">
          <div className="text-red-400 font-orbitron text-xs font-bold mb-1">Медвежья структура</div>
          <p className="text-zinc-400 text-xs font-space-mono">LH + LL — каждый максимум и минимум ниже предыдущего. Торгуем только шорты на LH.</p>
        </div>
      </div>
    </div>
    <div className="bg-zinc-900 border border-yellow-500/20 rounded-xl p-4">
      <div className="text-yellow-400 font-orbitron text-xs font-bold mb-2">Смена структуры (BOS / CHoCH)</div>
      <div className="space-y-2 text-xs font-space-mono text-zinc-400">
        <div className="flex gap-2 items-start"><span className="text-blue-400 font-bold shrink-0">BOS</span><span>(Break of Structure) — пробой предыдущего HH или LL. Подтверждает продолжение тренда. Используется для входа в направлении доминирующей структуры.</span></div>
        <div className="flex gap-2 items-start"><span className="text-orange-400 font-bold shrink-0">CHoCH</span><span>(Change of Character) — первый признак смены тренда. Цена впервые пробивает структуру против тренда. Сигнал к переходу к нейтралитету или развороту.</span></div>
      </div>
    </div>
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="text-white font-orbitron text-xs font-bold mb-2">Манипуляция перед движением: схема Wyckoff</div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs font-space-mono">
        {[
          { n: "1. Накопление", c: "text-blue-400", d: "Smart Money накапливают позицию в боковике. Объём растёт, цена не двигается. Большинство думает «ничего не происходит»." },
          { n: "2. Разметка (Markup)", c: "text-green-400", d: "Импульсный рост после накопления. FOMO-трейдеры входят на хаях. Smart Money продолжают добирать." },
          { n: "3. Распределение", c: "text-yellow-400", d: "Боковик на вершине. Smart Money тихо выходят из позиций, перекладывая их на розничных покупателей." },
          { n: "4. Уценка (Markdown)", c: "text-red-400", d: "Резкое падение. Розничные трейдеры держат убытки. Smart Money откупают внизу — цикл повторяется." },
        ].map((s, i) => (
          <div key={i} className="bg-zinc-950 rounded-lg p-2">
            <div className={`font-bold mb-1 ${s.c}`}>{s.n}</div>
            <p className="text-zinc-500 leading-relaxed">{s.d}</p>
          </div>
        ))}
      </div>
    </div>
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
      <div className="text-blue-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Майкл Бьюрри и Stop Hunt перед кризисом 2008</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Майкл Бьюрри (герой «Игры на понижение») ставил против ипотечных облигаций США с 2005 года.
        В течение двух лет его позиции показывали убыток, инвесторы требовали вернуть деньги — это был классический «Stop Hunt» на институциональном уровне.
        Рынок продолжал расти, будто нарочно выбивая его из позиции. Бьюрри устоял.
        В 2007–2008 году рынок рухнул, и его фонд Scion Capital заработал 489%.
        Урок: даже правильная позиция может сначала идти против тебя — именно это и используют Smart Money.
      </p>
    </div>
    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
      <div className="text-purple-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Билл Вильямс и «умная» структура рынка</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Билл Вильямс — психолог и трейдер, автор книги «Торговый хаос» — разработал собственную версию анализа структуры рынка через фракталы и «зоны» (аналог Order Block).
        Он утверждал: рынок движется не случайно, а по повторяющимся фрактальным паттернам, созданным действиями крупных игроков.
        «Рынок — это живой организм. Он создан людьми и отражает коллективную психологию».
        Его индикаторы (Alligator, Fractals, Awesome Oscillator) до сих пор встроены в MetaTrader 4 и 5.
      </p>
    </div>
  </div>
)
