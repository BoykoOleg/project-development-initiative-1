import { TradingJournalTemplate } from "../TradingCharts"

export const SectionRiskJournal = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">Журнал — единственный способ расти как трейдер. Без данных нет анализа, без анализа нет роста.</p>
    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
      <div className="text-green-400 font-orbitron text-xs font-bold mb-2">Реальный кейс: журнал изменил результат за 60 дней</div>
      <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">Мария вела журнал 60 дней (82 сделки). Анализ выявил неожиданное: win rate в понедельник — 68%, в пятницу — 31% (торговала нервно перед выходными). На M15 — минус, на H1 — плюс. После 15:00 по МСК — только убытки. Она просто убрала торговлю по пятницам и после 15:00. <span className="text-white">Следующие 60 дней: win rate вырос с 44% до 58%</span> без изменения стратегии.</p>
    </div>
    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
      <div className="text-orange-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Рэй Далио и «петля обратной связи»</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Рэй Далио, основатель Bridgewater Associates (крупнейший хедж-фонд в мире с активами $150+ млрд),
        построил всю культуру компании вокруг записи, анализа и обсуждения ошибок.
        Каждое совещание в Bridgewater записывается, каждое решение фиксируется.
        «Боль + осознание = прогресс», — главный принцип Далио из книги «Принципы».
        Трейдерский журнал — это та же система: фиксируй ошибки, анализируй паттерны, улучшай процесс.
        Без этой петли обратной связи невозможен профессиональный рост ни в трейдинге, ни в бизнесе.
      </p>
    </div>
    <TradingJournalTemplate />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
        <div className="text-white font-orbitron text-xs font-bold mb-2">Что анализировать через 50 сделок</div>
        <ul className="text-zinc-400 text-xs font-space-mono space-y-1">
          <li>→ Win Rate по каждому активу</li>
          <li>→ Средний R:R реально vs планируемый</li>
          <li>→ Лучшее время суток для торговли</li>
          <li>→ Какой тайм-фрейм даёт лучший результат</li>
          <li>→ Повторяющиеся ошибки</li>
        </ul>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
        <div className="text-white font-orbitron text-xs font-bold mb-2">Психологические ошибки в журнале</div>
        <ul className="text-zinc-400 text-xs font-space-mono space-y-1">
          <li>→ Ранний выход из прибыльных сделок</li>
          <li>→ Сдвиг Stop-Loss в убыток («чуть подождать»)</li>
          <li>→ Месть рынку после серии потерь</li>
          <li>→ Слишком ранний вход без подтверждения</li>
          <li>→ Игнорирование собственного плана</li>
        </ul>
      </div>
    </div>
    <div className="bg-zinc-950 border border-green-500/20 rounded-xl p-4 space-y-4">
      <div>
        <div className="text-green-400 font-orbitron text-xs font-bold mb-2">Инструменты для ведения журнала</div>
        <p className="text-gray-300 text-sm leading-relaxed">Журнал сделок — главный инструмент роста трейдера. Без него невозможно понять, что работает, а что нет. Вот четыре подхода — от простого к профессиональному.</p>
      </div>

      {/* Google Sheets */}
      <div className="border border-zinc-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-white font-orbitron text-xs font-bold">Google Sheets / Excel</div>
          <span className="text-xs font-space-mono bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Бесплатно</span>
        </div>
        <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">Самый доступный вариант. Гибко настраивается под любой стиль торговли. Подходит для старта — можно сделать всё самому.</p>
        <div className="bg-zinc-900 rounded-lg p-3 overflow-x-auto">
          <div className="text-zinc-500 text-xs font-space-mono mb-2">Минимальный набор колонок:</div>
          <table className="w-full text-xs font-space-mono min-w-[480px]">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Дата", "Актив", "Вход", "Стоп", "Тейк", "Результат", "Причина входа", "Ошибки"].map(h => (
                  <th key={h} className="text-left px-2 py-1 text-zinc-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["12.03", "BTC", "$82,400", "$80,900", "$85,000", "+$310", "Бычья дивергенция D1", "—"],
                ["13.03", "ETH", "$2,180", "$2,050", "$2,400", "−$130", "Уровень поддержки", "Вошёл без объёма"],
              ].map((row, i) => (
                <tr key={i} className="border-b border-zinc-800/50">
                  {row.map((cell, j) => (
                    <td key={j} className={`px-2 py-1.5 whitespace-nowrap ${cell.startsWith("+") ? "text-green-400" : cell.startsWith("−") ? "text-red-400" : "text-zinc-300"}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href="/trading-journal-template.csv"
            download="trading-journal-template.csv"
            className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-colors rounded-lg px-4 py-2.5 w-fit"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-green-400 shrink-0">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5z"/>
            </svg>
            <span className="text-green-400 font-space-mono text-xs font-bold">Скачать шаблон журнала (.csv) →</span>
          </a>
          <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2.5 w-fit">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-zinc-400 shrink-0">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <span className="text-zinc-400 font-space-mono text-xs">Открыть через Google Sheets: Файл → Импорт</span>
          </div>
        </div>
        <div className="flex gap-4 text-xs font-space-mono">
          <span className="text-green-400">✓ Полный контроль структуры</span>
          <span className="text-green-400">✓ Бесплатно</span>
          <span className="text-red-400">✗ Нет автоматики и графиков</span>
        </div>
      </div>

      {/* Notion */}
      <div className="border border-zinc-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-white font-orbitron text-xs font-bold">Notion</div>
          <span className="text-xs font-space-mono bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Бесплатно / от $10/мес</span>
        </div>
        <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">Идеально для тех, кто хочет вести не только таблицу сделок, но и торговый план, разбор ошибок и заметки по рынку — всё в одном месте.</p>
        <div className="bg-zinc-900 rounded-lg p-3 space-y-2">
          <div className="text-zinc-500 text-xs font-space-mono mb-1">Что добавить в Notion сверх таблицы:</div>
          {[
            ["Торговый план", "Правила входа, запрещённые ситуации, цели на неделю"],
            ["Разбор ошибок", "Что пошло не так — скрин + текст + эмоции в момент"],
            ["Недельный отчёт", "Win rate, средний RR, сколько сделок по плану"],
            ["Психологический дневник", "Настроение перед торговлей, причины импульсивных входов"],
          ].map(([title, desc]) => (
            <div key={title} className="flex gap-2 items-start">
              <span className="text-blue-400 font-space-mono text-xs shrink-0">→</span>
              <span className="text-zinc-300 text-xs font-space-mono"><span className="text-white font-bold">{title}:</span> {desc}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 text-xs font-space-mono">
          <span className="text-green-400">✓ Гибкость и визуальность</span>
          <span className="text-green-400">✓ Всё в одном</span>
          <span className="text-red-400">✗ Нет аналитики по сделкам</span>
        </div>
      </div>

      {/* Tradervue */}
      <div className="border border-zinc-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-white font-orbitron text-xs font-bold">Tradervue</div>
          <span className="text-xs font-space-mono bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">от $29/мес</span>
        </div>
        <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">Специализированный журнал трейдера с автоимпортом сделок из большинства брокеров. Строит статистику автоматически — без ручного ввода.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { label: "Автоимпорт", desc: "Загружает историю сделок из брокера одним файлом" },
            { label: "Статистика по времени", desc: "В какое время суток вы торгуете лучше всего" },
            { label: "Статистика по активам", desc: "Какие инструменты приносят прибыль, а какие — убыток" },
            { label: "Анализ ошибок", desc: "Паттерны убыточных сделок: что их объединяет" },
          ].map(({ label, desc }) => (
            <div key={label} className="bg-zinc-900 rounded-lg p-2">
              <div className="text-yellow-400 text-xs font-space-mono font-bold mb-1">{label}</div>
              <div className="text-zinc-400 text-xs font-space-mono">{desc}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 text-xs font-space-mono">
          <span className="text-green-400">✓ Автоматическая статистика</span>
          <span className="text-green-400">✓ Импорт из брокера</span>
          <span className="text-red-400">✗ Платный, нет крипто-брокеров</span>
        </div>
      </div>

      {/* Edgewonk */}
      <div className="border border-zinc-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-white font-orbitron text-xs font-bold">Edgewonk</div>
          <span className="text-xs font-space-mono bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">€169 раз и навсегда</span>
        </div>
        <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">Самый глубокий аналитический журнал для серьёзных трейдеров. Акцент не просто на записи сделок, а на поиске вашего реального «эджа» — статистического преимущества.</p>
        <div className="bg-zinc-900 rounded-lg p-3 space-y-2">
          <div className="text-zinc-500 text-xs font-space-mono mb-1">Уникальные функции Edgewonk:</div>
          {[
            ["Tilt Meter", "Определяет момент, когда вы начинаете торговать эмоционально — по паттернам поведения"],
            ["Trade Management Simulation", "Симулирует «что было бы», если бы вы двигали стоп иначе"],
            ["Custom Setups", "Статистика отдельно по каждому вашему паттерну входа"],
            ["R-Multiple анализ", "Гистограмма распределения соотношения прибыль/риск по всем сделкам"],
          ].map(([title, desc]) => (
            <div key={title} className="flex gap-2 items-start">
              <span className="text-purple-400 font-space-mono text-xs shrink-0">→</span>
              <span className="text-zinc-300 text-xs font-space-mono"><span className="text-white font-bold">{title}:</span> {desc}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 text-xs font-space-mono">
          <span className="text-green-400">✓ Самая глубокая аналитика</span>
          <span className="text-green-400">✓ Разовая оплата</span>
          <span className="text-red-400">✗ Требует времени на освоение</span>
        </div>
      </div>

      {/* Сравнение */}
      <div className="bg-zinc-900 rounded-xl p-3 overflow-x-auto">
        <div className="text-zinc-400 font-orbitron text-xs font-bold mb-2">Что выбрать?</div>
        <table className="w-full text-xs font-space-mono min-w-[380px]">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Инструмент", "Для кого", "Главный плюс"].map(h => (
                <th key={h} className="text-left px-2 py-2 text-zinc-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {[
              ["Google Sheets", "Новичок, который только начинает", "Бесплатно, полный контроль"],
              ["Notion", "Тот, кто хочет структурировать всё мышление", "Торговый план + журнал + разбор"],
              ["Tradervue", "Акции/фьючерсы, нужна автоматика", "Импорт из брокера, готовые отчёты"],
              ["Edgewonk", "Серьёзный трейдер, ищет своё преимущество", "Психология + глубокая статистика"],
            ].map(([tool, who, plus]) => (
              <tr key={tool} className="hover:bg-zinc-800/50">
                <td className="px-2 py-2 text-white font-bold">{tool}</td>
                <td className="px-2 py-2 text-zinc-400">{who}</td>
                <td className="px-2 py-2 text-zinc-300">{plus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)
