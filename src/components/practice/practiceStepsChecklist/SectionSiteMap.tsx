export const SectionSiteMap = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      Каждый раздел TradeBase решает конкретную задачу. Вот как они связаны в реальной торговле:
    </p>
    <div className="space-y-2">
      {[
        {
          section: "Основы трейдинга",
          href: "/trading-basics",
          role: "Фундамент",
          desc: "Тренд, уровни, RSI, свечи — всё для анализа сигнала перед входом в сделку",
          color: "text-red-400",
          border: "border-red-500/30",
          bg: "bg-red-500/5",
        },
        {
          section: "Гайд по ботам",
          href: "/bots-guide",
          role: "Автоматизация",
          desc: "Grid, DCA, бэктест, платформы, риск-менеджмент бота — для автоматической торговли",
          color: "text-blue-400",
          border: "border-blue-500/30",
          bg: "bg-blue-500/5",
        },
        {
          section: "Конструктор ботов",
          href: "/bot-builder",
          role: "Инструмент",
          desc: "Генерирует готовый Python-код стратегии под ваши параметры — без программирования",
          color: "text-purple-400",
          border: "border-purple-500/30",
          bg: "bg-purple-500/5",
        },
        {
          section: "Практический кейс",
          href: "/practice",
          role: "Применение",
          desc: "6 шагов: анализ → сигнал → риск → платформа → Python-бот → устранение ошибок",
          color: "text-green-400",
          border: "border-green-500/30",
          bg: "bg-green-500/5",
        },
      ].map((item, i) => (
        <a key={i} href={item.href} className={`flex gap-3 items-start ${item.bg} border ${item.border} rounded-lg p-3 hover:opacity-80 transition-opacity`}>
          <div className={`font-orbitron text-xs font-bold ${item.color} shrink-0 mt-0.5 w-20`}>{item.role}</div>
          <div>
            <div className={`font-orbitron text-xs font-bold mb-0.5 ${item.color}`}>{item.section}</div>
            <p className="text-zinc-400 text-xs font-space-mono">{item.desc}</p>
          </div>
        </a>
      ))}
    </div>

    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
      <div className="text-green-400 font-orbitron text-xs font-bold mb-2">Из жизни: «торговая система» Ричарда Денниса</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        В 1983 году Ричард Деннис поспорил: можно ли научить случайных людей торговать системно?
        Он набрал 13 человек без опыта — «черепах» — и за 2 недели обучил их конкретной системе правил.
        Результат: за 5 лет «черепахи» заработали суммарно $175 млн.
        Вывод прост: система важнее опыта. Правильные правила + дисциплина = результат.
        Именно это и даёт TradeBase — структурированный путь от анализа до автоматизации.
      </p>
    </div>
  </div>
)
