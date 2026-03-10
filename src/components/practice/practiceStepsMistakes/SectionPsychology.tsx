export const SectionPsychology = () => (
  <div className="space-y-4">
    <p className="text-gray-300 leading-relaxed">
      Технический анализ можно освоить за месяц. Психологию трейдинга — годами.
      Именно она определяет разницу между теми, кто зарабатывает, и теми, кто сливает.
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[
        {
          trap: "FOMO — страх пропустить",
          desc: "«Цена уже летит вверх, нужно запрыгнуть!» — входим на самом верху.",
          solution: "Если пропустил сигнал — следующего ждать, а не догонять.",
          icon: "🚀",
          color: "border-yellow-500/30 text-yellow-400",
        },
        {
          trap: "Избегание потерь",
          desc: "«Не закрою сделку — вдруг ещё отыграется» — убыток растёт.",
          solution: "Бот не имеет эмоций — это главное преимущество автоматизации.",
          icon: "🙈",
          color: "border-red-500/30 text-red-400",
        },
        {
          trap: "Излишняя самоуверенность",
          desc: "«Серия побед — я понял рынок» — увеличиваем ставки, рискуем.",
          solution: "Стейк фиксирован. Серия побед — случайность, не мастерство.",
          icon: "💪",
          color: "border-orange-500/30 text-orange-400",
        },
        {
          trap: "Подтверждение своего мнения",
          desc: "Ищем только те сигналы, которые подтверждают нашу позицию.",
          solution: "Алгоритм и чеклист — единственный судья. Мнение не считается.",
          icon: "🔍",
          color: "border-purple-500/30 text-purple-400",
        },
      ].map(({ trap, desc, solution, icon, color }) => (
        <div key={trap} className={`bg-zinc-900 border ${color.split(" ")[0]} rounded-xl p-4 space-y-2`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <div className={`font-orbitron text-xs font-bold ${color.split(" ")[1]}`}>{trap}</div>
          </div>
          <div className="text-zinc-500 text-[10px] font-space-mono leading-relaxed">{desc}</div>
          <div className={`text-[10px] font-space-mono font-bold ${color.split(" ")[1]}`}>→ {solution}</div>
        </div>
      ))}
    </div>

    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">Правило «Контрольной паузы»</div>
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="flex-1 space-y-2">
          {[
            "Перед каждой сделкой: 3 глубоких вдоха",
            "Задать вопрос: «Я торгую по системе или по эмоции?»",
            "Если хоть малейшее сомнение — пропустить сделку",
            "Записать причину входа ДО открытия сделки",
          ].map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-blue-400 text-[10px] font-space-mono shrink-0">{i + 1}.</span>
              <span className="text-zinc-300 text-[10px] font-space-mono">{item}</span>
            </div>
          ))}
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex-1">
          <div className="text-blue-400 font-orbitron text-[10px] font-bold mb-1">Из жизни</div>
          <p className="text-zinc-400 text-[10px] font-space-mono leading-relaxed">
            Пол Тюдор Джонс вешал над монитором табличку: «Losers average losers» —
            проигравшие усредняют убытки. Пауза перед входом — его обязательный ритуал.
          </p>
        </div>
      </div>
    </div>

    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
      <div className="text-green-400 font-orbitron text-xs font-bold mb-2">Почему бот лучше человека в дисциплине</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          ["Бот не паникует при серии убытков", "Строго соблюдает правило 2% и дневной стоп"],
          ["Бот не испытывает FOMO", "Входит только при совпадении всех условий"],
          ["Бот не торгует в новости", "Запрет прописан кодом, а не волей"],
          ["Бот не меняет стратегию после 3 потерь", "Параметры меняются только после 50+ сделок"],
        ].map(([human, bot], i) => (
          <div key={i} className="bg-zinc-900 rounded-xl p-3">
            <div className="text-red-400 text-[10px] font-space-mono mb-1">✗ Человек: {human}</div>
            <div className="text-green-400 text-[10px] font-space-mono">✓ Бот: {bot}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
)
