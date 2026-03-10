export const SectionRegimeDetection = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      Два индикатора дают полную картину режима рынка. Добавь их на график один раз — и пользуйся постоянно.
    </p>
    <div className="space-y-3">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="text-purple-400 font-orbitron text-xs font-bold mb-2">ADX (Average Directional Index)</div>
        <p className="text-zinc-300 text-xs font-space-mono leading-relaxed mb-3">
          Показывает <span className="text-white">силу тренда</span> — не направление, а именно силу. Значение от 0 до 100.
        </p>
        <div className="space-y-1.5">
          {[
            { val: "ADX < 20", label: "Боковик или переход", color: "text-blue-400" },
            { val: "ADX 20–25", label: "Переходный режим — ждём", color: "text-zinc-400" },
            { val: "ADX 25–40", label: "Умеренный тренд — можно торговать", color: "text-green-400" },
            { val: "ADX > 40", label: "Сильный тренд или высокая волатильность", color: "text-yellow-400" },
          ].map((row, i) => (
            <div key={i} className="flex gap-3 items-center">
              <span className={`font-orbitron text-xs font-bold w-24 shrink-0 ${row.color}`}>{row.val}</span>
              <span className="text-zinc-400 text-xs font-space-mono">{row.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="text-yellow-400 font-orbitron text-xs font-bold mb-2">ATR (Average True Range)</div>
        <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
          Показывает <span className="text-white">волатильность</span> — насколько большие свечи прямо сейчас по сравнению с нормой.
          Сравни текущий ATR со средним за 50 свечей: если текущий больше в 1.5 раза — режим высокой волатильности.
        </p>
      </div>
    </div>

    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-300 mb-3">Алгоритм определения режима (30 секунд)</div>
      <div className="space-y-2">
        {[
          { step: "1", text: "Открываем график BTC/USD M5, добавляем ADX(14) и ATR(14)", color: "text-blue-400" },
          { step: "2", text: "Смотрим ADX: ниже 20 → боковик; выше 25 → потенциальный тренд", color: "text-purple-400" },
          { step: "3", text: "Смотрим ATR: больше нормы в 1.5× → высокая волатильность, независимо от ADX", color: "text-yellow-400" },
          { step: "4", text: "Выбираем стратегию под режим → переходим к Шагу 1 (EMA + уровни)", color: "text-green-400" },
        ].map((item, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className={`font-orbitron text-sm font-bold ${item.color} w-4 shrink-0`}>{item.step}</div>
            <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
)
