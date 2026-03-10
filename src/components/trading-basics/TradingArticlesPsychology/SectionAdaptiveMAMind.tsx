import React from "react"

const MindChart = () => (
  <svg viewBox="0 0 380 150" className="w-full h-36">
    {/* Grid */}
    {[40, 70, 100, 130].map(y => (
      <line key={y} x1="0" y1={y} x2="380" y2={y} stroke="#27272a" strokeWidth="1" />
    ))}

    {/* Зоны рынка */}
    <rect x="0" y="30" width="120" height="110" fill="#ef4444" fillOpacity="0.04" />
    <text x="60" y="25" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="monospace">боковик / хаос</text>

    <rect x="130" y="30" width="120" height="110" fill="#f59e0b" fillOpacity="0.04" />
    <text x="190" y="25" textAnchor="middle" fill="#f59e0b" fontSize="9" fontFamily="monospace">неопределённость</text>

    <rect x="260" y="30" width="120" height="110" fill="#22c55e" fillOpacity="0.04" />
    <text x="320" y="25" textAnchor="middle" fill="#22c55e" fontSize="9" fontFamily="monospace">тренд / ясность</text>

    {/* Поведение трейдера без MA */}
    <polyline
      points="10,80 25,55 40,100 55,65 70,110 85,50 100,90 115,70 130,95 145,55 160,85 175,50 190,95 205,65 220,80 235,55 250,70 265,65 280,80 295,70 310,60 325,68 340,62 355,58"
      fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.7"
    />

    {/* Поведение трейдера с адаптивной MA */}
    <polyline
      points="10,85 25,85 40,86 55,85 70,87 85,86 100,87 115,86 130,90 145,82 160,78 175,70 190,65 205,62 220,60 235,58 250,57 265,56 280,57 295,58 310,57 325,58 340,56 355,55"
      fill="none" stroke="#22c55e" strokeWidth="2" opacity="0.9"
    />

    {/* Легенда */}
    <line x1="10" y1="142" x2="28" y2="142" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,3" />
    <text x="31" y="146" fill="#ef4444" fontSize="9" fontFamily="monospace">эмоциональные решения</text>

    <line x1="200" y1="142" x2="218" y2="142" stroke="#22c55e" strokeWidth="2" />
    <text x="221" y="146" fill="#22c55e" fontSize="9" fontFamily="monospace">решения по адаптивной MA</text>
  </svg>
)

export const SectionAdaptiveMAMind = () => (
  <div className="space-y-4">
    <p className="text-gray-300 text-sm leading-relaxed">
      Адаптивные скользящие — KAMA, VIDYA, JMA — это не только технический инструмент.
      Для трейдера они выполняют важнейшую психологическую функцию: <span className="text-sky-300">убирают необходимость принимать субъективные решения в момент неопределённости</span>.
    </p>

    {/* График */}
    <div className="bg-zinc-900 rounded-xl p-3">
      <div className="text-zinc-500 font-space-mono text-xs mb-2">Качество решений: эмоции vs адаптивная MA</div>
      <MindChart />
      <p className="text-zinc-600 text-xs font-space-mono mt-1 text-center">
        В боковике эмоциональный трейдер хаотичен — адаптивная MA даёт чёткий ответ: «не торгуй»
      </p>
    </div>

    {/* Три психологические ловушки */}
    <div className="text-sky-400 font-orbitron text-xs font-bold">Три ловушки, которые закрывает адаптивная MA</div>

    <div className="space-y-2">
      {[
        {
          trap: "Ловушка 1: «Кажется, сейчас пойдёт»",
          color: "red",
          problem: "Трейдер видит свечу, чувствует движение — и входит без подтверждения. Обычная EMA в боковике тоже «кажется» растёт.",
          solution: "KAMA в боковике почти не движется — нет сигнала, нет сделки. Субъективное «кажется» больше не работает.",
        },
        {
          trap: "Ловушка 2: Ранний выход из тренда",
          color: "yellow",
          problem: "Тренд идёт, но откат на 2% вызывает панику: «Всё, разворот! Фиксирую!». Страх потерять бумажную прибыль сильнее логики.",
          solution: "JMA/VIDYA как трейлинг-стоп: пока цена выше линии — сделка живёт. Решение принимает математика, не адреналин.",
        },
        {
          trap: "Ловушка 3: Месть рынку после убытка",
          color: "orange",
          problem: "После стоп-лосса трейдер «знает», что рынок вернётся — и открывает удвоенную позицию против тренда. Классика.",
          solution: "Адаптивная MA направлена против — значит сделка не открывается. Фильтр убирает эмоциональный реванш.",
        },
      ].map(({ trap, color, problem, solution }) => (
        <div key={trap} className={`bg-zinc-900 border border-${color}-500/20 rounded-xl p-4`}>
          <div className={`text-${color}-400 font-orbitron text-xs font-bold mb-2`}>{trap}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-zinc-950 rounded-lg p-3">
              <div className="text-red-400 font-space-mono text-xs mb-1">Без адаптивной MA:</div>
              <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">{problem}</p>
            </div>
            <div className="bg-zinc-950 rounded-lg p-3">
              <div className="text-green-400 font-space-mono text-xs mb-1">С адаптивной MA:</div>
              <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">{solution}</p>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Правило системной торговли */}
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
      <div className="text-blue-400 font-orbitron text-xs font-bold mb-2">Принцип: превратить решение в правило</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed mb-3">
        Каждый раз, когда вы принимаете решение «в моменте» — вы конкурируете со своим мозгом под давлением.
        Нейробиология говорит: в стрессе кора головного мозга (логика) проигрывает амигдале (страх/жадность).
        Правило, написанное заранее, исполняется корой. Импульс — амигдалой.
      </p>
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-space-mono text-xs space-y-1">
        <div className="text-zinc-500">Пример торгового правила с адаптивной MA:</div>
        <div className="text-blue-300">ЕСЛИ цена выше KAMA(10) И RSI {">"} 50 И объём выше среднего</div>
        <div className="text-blue-300">ТО открыть лонг. Стоп — закрытие ниже JMA(14, −50).</div>
        <div className="text-zinc-500 mt-1">Всё. Больше нечего «решать» в моменте.</div>
      </div>
    </div>

    {/* Bot connection */}
    <div className="bg-zinc-900 border border-violet-500/20 rounded-xl p-4">
      <div className="text-violet-400 font-orbitron text-xs font-bold mb-2">Почему это и есть путь к боту</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Когда вы формализуете правило входа через адаптивную MA — вы фактически написали алгоритм.
        Следующий шаг: отдать его боту. Бот исполнит правило 100 раз без единого отступления.
        Человек — в лучшем случае 7 из 10. Именно эта разница и определяет долгосрочный результат.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-xs font-space-mono">
        {[
          { label: "Человек без правил", val: "~40% соблюдение", color: "red" },
          { label: "Человек с MA-правилом", val: "~70% соблюдение", color: "yellow" },
          { label: "Бот с MA-правилом", val: "100% соблюдение", color: "green" },
        ].map(({ label, val, color }) => (
          <div key={label} className={`bg-${color}-500/10 border border-${color}-500/20 rounded-lg p-2 text-center`}>
            <div className="text-zinc-400 mb-1">{label}</div>
            <div className={`text-${color}-400 font-bold`}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
)
