export const SectionTopMistakes = () => (
  <div className="space-y-4">
    <p className="text-gray-300 leading-relaxed">
      Анализ 500+ сливов депозита показывает: 90% потерь вызваны одними и теми же 10 ошибками.
      Ни одна из них не связана с незнанием индикаторов — все они поведенческие.
    </p>

    <div className="space-y-2">
      {[
        {
          num: "01",
          title: "Вход без системы — «по ощущению»",
          problem: "Кажется, что цена точно пойдёт вверх — открываем без проверки сигналов.",
          fix: "Входить только при полном совпадении всех 3 условий конфлюэнса. Нет 3 — нет сделки.",
          cost: "−15–20% депо за неделю",
          color: "border-red-500/30",
          num_color: "text-red-400",
        },
        {
          num: "02",
          title: "Мартингейл — удвоение ставки после проигрыша",
          problem: "«Следующая точно выиграет» — удваиваем ставку, чтобы отыграться.",
          fix: "Фиксированные 2% на каждую сделку, независимо от результата предыдущей.",
          cost: "Слив за 5–7 сделок при серии проигрышей",
          color: "border-orange-500/30",
          num_color: "text-orange-400",
        },
        {
          num: "03",
          title: "Игнорирование дневного стоп-лосса",
          problem: "−6% за день — продолжаем торговать, чтобы вернуть потери.",
          fix: "Достигли −6% — платформа закрыта до следующего дня. Без исключений.",
          cost: "Дополнительный −10–15% за одну сессию",
          color: "border-yellow-500/30",
          num_color: "text-yellow-400",
        },
        {
          num: "04",
          title: "Торговля в новостные часы",
          problem: "Открываем сделку за 5 минут до выхода NFP или заседания ФРС.",
          fix: "Запрет торговли за 30 минут до и после крупных новостей. Список на Investing.com.",
          cost: "Резкий выброс цены уничтожает стратегию",
          color: "border-purple-500/30",
          num_color: "text-purple-400",
        },
        {
          num: "05",
          title: "Слишком большой стейк на «очевидный» сигнал",
          problem: "«Сигнал идеальный» — ставим 20% вместо 2%.",
          fix: "Размер ставки никогда не зависит от уверенности. Всегда 2%.",
          cost: "Один убыток = потеря 20% депозита",
          color: "border-blue-500/30",
          num_color: "text-blue-400",
        },
        {
          num: "06",
          title: "Отсутствие журнала сделок",
          problem: "Не записываем сделки — не видим паттерны своих ошибок.",
          fix: "CSV или таблица: дата, актив, сигнал, ставка, результат, причина входа.",
          cost: "Повторяем одни и те же ошибки бесконечно",
          color: "border-cyan-500/30",
          num_color: "text-cyan-400",
        },
        {
          num: "07",
          title: "Торговля при плохом психологическом состоянии",
          problem: "Поссорились, устали, выпили — открываем сделки.",
          fix: "Торговать можно только в ресурсном состоянии. Эмоции = ошибки = деньги.",
          cost: "−5–10% за сессию при нарушенной дисциплине",
          color: "border-pink-500/30",
          num_color: "text-pink-400",
        },
        {
          num: "08",
          title: "Смена стратегии после 3 проигрышей",
          problem: "«Стратегия не работает» — переходим на другую. Потом ещё на одну.",
          fix: "Оценивать стратегию минимум по 50 сделкам. 3 проигрыша — статистический шум.",
          cost: "Никогда не накапливается реальная статистика",
          color: "border-green-500/30",
          num_color: "text-green-400",
        },
        {
          num: "09",
          title: "Торговля на несколько активов одновременно",
          problem: "Открываем BTC, EURUSD и AAPL в одно время — не успеваем следить.",
          fix: "Один актив, один таймфрейм, одна стратегия. Масштабироваться после 3 месяцев плюса.",
          cost: "Пропускаем сигналы, входим в хаосе",
          color: "border-zinc-500/30",
          num_color: "text-zinc-400",
        },
        {
          num: "10",
          title: "Переход на реальные деньги без демо-статистики",
          problem: "«Зачем демо — деньги же не реальные» — сразу торгуем на живые.",
          fix: "Минимум 50 сделок на демо с win rate ≥54% до первого реального депозита.",
          cost: "Сливаем первый депозит на обучение стратегии",
          color: "border-amber-500/30",
          num_color: "text-amber-400",
        },
      ].map(({ num, title, problem, fix, cost, color, num_color }) => (
        <div key={num} className={`bg-zinc-900 border ${color} rounded-xl p-4`}>
          <div className="flex gap-3 items-start">
            <div className={`font-orbitron text-sm font-bold ${num_color} shrink-0 w-7`}>{num}</div>
            <div className="flex-1 space-y-2">
              <div className={`font-orbitron text-xs font-bold ${num_color}`}>{title}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <div className="text-red-400 text-[10px] font-space-mono font-bold mb-0.5">Ошибка:</div>
                  <div className="text-zinc-400 text-[10px] font-space-mono leading-relaxed">{problem}</div>
                </div>
                <div>
                  <div className="text-green-400 text-[10px] font-space-mono font-bold mb-0.5">Решение:</div>
                  <div className="text-zinc-300 text-[10px] font-space-mono leading-relaxed">{fix}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-space-mono text-zinc-600">Цена ошибки:</span>
                <span className={`text-[9px] font-space-mono font-bold ${num_color}`}>{cost}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)
