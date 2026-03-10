import React from "react"

export const SectionNeuroscience = () => (
  <div className="space-y-4">
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex gap-2 items-center">
      <span className="text-red-400 text-lg">⚠</span>
      <p className="text-red-300 text-xs font-space-mono">Продвинутый раздел. Нейробиология принятия решений и техники достижения пикового состояния в трейдинге.</p>
    </div>
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="text-white font-orbitron text-xs font-bold mb-3">Нейробиология убытков: почему потери больнее побед</div>
      <p className="text-gray-300 text-sm leading-relaxed mb-3">
        Исследования нобелевских лауреатов Канемана и Тверски показали: потеря $100 вызывает в 2–2.5 раза более сильную эмоциональную реакцию, чем выигрыш $100.
        Это «Loss Aversion» (неприятие потерь) — эволюционный механизм, который спасал людей тысячи лет, но в трейдинге убивает результаты.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { title: "Loss Aversion в трейдинге", color: "text-red-400", bc: "border-red-500/20 bg-red-500/5", desc: "Трейдер держит убыточную позицию слишком долго (не хочет фиксировать потерю), но слишком рано выходит из прибыльной (боится «отдать» прибыль). Результат: маленькие победы, большие поражения." },
          { title: "Дофамин и азарт", color: "text-yellow-400", bc: "border-yellow-500/20 bg-yellow-500/5", desc: "Победная сделка выбрасывает дофамин. Мозг хочет повторения. Следующая сделка открывается быстрее, с большим риском. Именно так работает игровая зависимость — и именно так проигрываются депозиты." },
          { title: "Кортизол и страх", color: "text-blue-400", bc: "border-blue-500/20 bg-blue-500/5", desc: "В период убытков кортизол (гормон стресса) нарушает работу префронтальной коры — части мозга, отвечающей за рациональное мышление. Буквально: стресс делает вас глупее. Пауза — это нейробиологическая необходимость." },
        ].map((item, i) => (
          <div key={i} className={`border rounded-xl p-3 ${item.bc}`}>
            <div className={`font-orbitron text-xs font-bold mb-2 ${item.color}`}>{item.title}</div>
            <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mt-3">
        <div className="text-blue-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Дэниел Канеман и поведенческая экономика рынков</div>
        <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
          Дэниел Канеман получил Нобелевскую премию по экономике в 2002 году именно за открытие Loss Aversion и систематических ошибок мышления в финансовых решениях.
          Он показал, что люди принимают иррациональные финансовые решения предсказуемо и повторяемо — не случайно.
          «Мы не рациональны. Мы рационализируем», — говорил Канеман.
          Понимание своих когнитивных ошибок не устраняет их полностью, но позволяет создавать системы защиты от них — торговый план, чеклисты, дневник.
        </p>
      </div>
    </div>
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="text-white font-orbitron text-xs font-bold mb-3">Состояние потока в трейдинге: как его достичь</div>
      <p className="text-gray-300 text-sm leading-relaxed mb-3">
        Состояние потока (Flow State) — термин психолога Михая Чиксентмихайи. Полное погружение в задачу, отсутствие эмоционального шума, решения принимаются легко и правильно.
        Лучшие трейдеры описывают его так: «Я просто следовал правилам, не думая. Всё шло само».
      </p>
      <div className="space-y-2">
        {[
          { cond: "Физическое состояние", detail: "Сон 7–8 часов. Нет кофеинового перевозбуждения. Лёгкая физическая активность до сессии", color: "text-green-400" },
          { cond: "Ментальная подготовка", detail: "5–10 минут медитации или тихого анализа перед торговлей. Чёткий план на день", color: "text-blue-400" },
          { cond: "Чистое рабочее место", detail: "Закрытые соцсети, телеграм-каналы, новости. Только графики и план", color: "text-purple-400" },
          { cond: "Правильный масштаб", detail: "Торгуйте суммой, потеря которой не вызывает паники. Если сумма слишком большая — вы торгуете страхом", color: "text-yellow-400" },
          { cond: "После торговли", detail: "Записать результат в журнал. Оценить: следовал ли плану? Отметить эмоциональные отклонения", color: "text-orange-400" },
        ].map((item, i) => (
          <div key={i} className="flex gap-3 items-start bg-zinc-900 border border-zinc-800 rounded-lg p-3">
            <div className={`font-orbitron text-xs font-bold ${item.color} shrink-0 w-32`}>{item.cond}</div>
            <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">{item.detail}</p>
          </div>
        ))}
      </div>
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mt-3">
        <div className="text-green-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Стив Коэн и «психология как конкурентное преимущество»</div>
        <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
          Стив Коэн — основатель SAC Capital (впоследствии Point72), один из самых результативных трейдеров Уолл-стрит —
          нанял штатного психолога для всех трейдеров фонда. Это было неслыханно в 1990-х.
          «Разница между хорошим и выдающимся трейдером — не в стратегии. Она в голове».
          Работа с психологом помогала трейдерам SAC быстрее выходить из состояния стресса после убытков и поддерживать стабильность принятия решений.
          Сегодня психологическая подготовка — стандарт во всех топовых хедж-фондах.
        </p>
      </div>
    </div>
  </div>
)
