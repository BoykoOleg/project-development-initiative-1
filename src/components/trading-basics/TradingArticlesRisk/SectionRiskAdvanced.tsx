export const SectionRiskAdvanced = () => (
  <div className="space-y-4">
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex gap-2 items-center">
      <span className="text-red-400 text-lg">⚠</span>
      <p className="text-red-300 text-xs font-space-mono">Продвинутый раздел. Математика управления капиталом для опытных трейдеров с реальной статистикой сделок.</p>
    </div>
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="text-white font-orbitron text-xs font-bold mb-3">Критерий Келли: оптимальный размер позиции</div>
      <p className="text-gray-300 text-sm leading-relaxed mb-3">Формула Келли рассчитывает оптимальный % капитала для каждой сделки, максимизируя рост с учётом вашей win rate и R:R. Используется хедж-фондами и профессиональными трейдерами.</p>
      <div className="bg-zinc-900 rounded-xl p-4 mb-3">
        <div className="text-purple-400 font-orbitron text-xs font-bold mb-2">Формула Келли:</div>
        <code className="block bg-zinc-950 rounded p-3 font-space-mono text-sm text-green-400 mb-2">
          K% = W - (1 - W) / R
        </code>
        <div className="text-xs font-space-mono text-zinc-400 space-y-1">
          <div><span className="text-blue-400">W</span> — Win Rate (доля прибыльных сделок, от 0 до 1)</div>
          <div><span className="text-blue-400">R</span> — отношение средней прибыли к среднему убытку (avg win / avg loss)</div>
          <div><span className="text-blue-400">K%</span> — % капитала на одну сделку</div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-space-mono">
        {[
          { wr: "55%", r: "1.5", k: "21.7%", rec: "10.8%", color: "text-yellow-400" },
          { wr: "45%", r: "2.0", k: "17.5%", rec: "8.7%", color: "text-green-400" },
          { wr: "40%", r: "2.5", k: "16%", rec: "8%", color: "text-emerald-400" },
        ].map((ex, i) => (
          <div key={i} className="bg-zinc-900 rounded-xl p-3">
            <div className={`font-bold mb-2 ${ex.color}`}>WR={ex.wr}, R={ex.r}</div>
            <div className="text-zinc-300">Формула: {ex.k}</div>
            <div className="text-zinc-500 mt-1">Рекомендую: {ex.rec}</div>
            <div className="text-zinc-600 text-xs mt-1">(половина Келли)</div>
          </div>
        ))}
      </div>
      <div className="bg-zinc-900 border border-yellow-500/20 rounded-xl p-3 mt-3">
        <div className="text-yellow-400 font-orbitron text-xs font-bold mb-1">Важно: половина Келли</div>
        <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">На практике используют половину от полного Келли (Fractional Kelly). Это снижает волатильность капитала на 50%, теряя лишь незначительную часть прироста. Полный Келли — слишком агрессивен даже для профессионалов.</p>
      </div>
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mt-3">
        <div className="text-purple-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Эдвард Торп и происхождение формулы Келли</div>
        <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
          Эдвард Торп — математик, создавший первую систему счёта карт в блэкджеке и впоследствии основавший один из первых квантовых хедж-фондов Princeton/Newport Partners.
          Он первым применил критерий Келли к финансовым рынкам, показав в книге «Beat the Market» (1967), что оптимальный размер ставки математически вычислим.
          Его фонд показывал 19% годовых на протяжении 20+ лет с минимальными просадками — именно благодаря строгому соблюдению дробного критерия Келли.
          «Размер позиции — это единственное, что вы полностью контролируете», — говорил Торп.
        </p>
      </div>
    </div>
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="text-white font-orbitron text-xs font-bold mb-3">Drawdown-анализ: когда остановиться</div>
      <p className="text-gray-300 text-sm leading-relaxed mb-3">Drawdown (просадка) — снижение капитала от пиковой отметки. Понимание просадок — ключ к психологической устойчивости и защите депозита.</p>
      <div className="bg-zinc-900 rounded-xl p-3 mb-3">
        <svg viewBox="0 0 360 120" className="w-full h-28">
          <polyline points="20,90 50,80 80,65 110,55 130,70 155,85 170,95 185,90 210,75 240,60 270,45 310,30 340,20" fill="none" stroke="#e5e7eb" strokeWidth="1.5" />
          <circle cx="110" cy="55" r="3" fill="#22c55e" />
          <line x1="110" y1="55" x2="110" y2="110" stroke="#22c55e" strokeWidth="0.8" strokeDasharray="3,2" />
          <text x="112" y="50" fontSize="7" fill="#22c55e" fontFamily="monospace">Пик</text>
          <circle cx="170" cy="95" r="3" fill="#ef4444" />
          <line x1="170" y1="95" x2="170" y2="110" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="3,2" />
          <text x="172" y="104" fontSize="7" fill="#ef4444" fontFamily="monospace">Дно</text>
          <line x1="110" y1="55" x2="170" y2="55" stroke="#a78bfa" strokeWidth="0.8" />
          <line x1="170" y1="55" x2="170" y2="95" stroke="#a78bfa" strokeWidth="1" />
          <text x="175" y="78" fontSize="7" fill="#a78bfa" fontFamily="monospace">DD</text>
          <line x1="170" y1="55" x2="240" y2="55" stroke="#fbbf24" strokeWidth="0.8" strokeDasharray="3,2" />
          <text x="195" y="50" fontSize="7" fill="#fbbf24" fontFamily="monospace">Восстановление</text>
          <text x="100" y="118" fontSize="7" fill="#52525b" textAnchor="middle" fontFamily="monospace">Время</text>
        </svg>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-space-mono">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Просадка", "Нужно заработать", "Сигнал", "Действие"].map(h => (
                <th key={h} className="text-left px-3 py-2 text-zinc-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { dd: "5%", need: "5.3%", signal: "Норма", action: "Продолжаем торговать", color: "text-green-400" },
              { dd: "10%", need: "11.1%", signal: "Обратить внимание", action: "Снизить объёмы на 50%", color: "text-yellow-400" },
              { dd: "20%", need: "25%", signal: "Стоп-день/неделя", action: "Пауза, анализ ошибок", color: "text-orange-400" },
              { dd: "30%", need: "42.8%", signal: "Критическая просадка", action: "Пауза 2+ недели, пересмотр системы", color: "text-red-400" },
              { dd: "50%", need: "100%", signal: "Катастрофа", action: "Полная остановка, работа с психологом", color: "text-red-600" },
            ].map((row, i) => (
              <tr key={i} className="border-b border-zinc-900 hover:bg-zinc-900/40">
                <td className={`px-3 py-2 font-bold ${row.color}`}>{row.dd}</td>
                <td className="px-3 py-2 text-zinc-300">{row.need}</td>
                <td className={`px-3 py-2 ${row.color}`}>{row.signal}</td>
                <td className="px-3 py-2 text-zinc-400">{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="text-white font-orbitron text-xs font-bold mb-3">Портфельный риск: торговля несколькими позициями</div>
      <p className="text-gray-300 text-sm leading-relaxed mb-3">При открытии нескольких позиций одновременно риски складываются. Коррелированные активы увеличивают общий портфельный риск, даже если каждая позиция маленькая.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-red-400 font-orbitron text-xs font-bold mb-2">Опасная ситуация</div>
          {[
            { pos: "BTC/USDT Long", risk: "2%" },
            { pos: "ETH/USDT Long", risk: "2%" },
            { pos: "SOL/USDT Long", risk: "2%" },
          ].map((p, i) => (
            <div key={i} className="flex justify-between bg-zinc-900 rounded-lg px-3 py-2 text-xs font-space-mono">
              <span className="text-zinc-300">{p.pos}</span>
              <span className="text-red-400">{p.risk}</span>
            </div>
          ))}
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-xs font-space-mono text-red-300">
            Реальный риск ≈ 6% (все упадут вместе при крипто-распродаже)
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-green-400 font-orbitron text-xs font-bold mb-2">Правильная диверсификация</div>
          {[
            { pos: "BTC/USDT Long", risk: "2%" },
            { pos: "GOLD/USD Long", risk: "1%" },
            { pos: "USD/JPY Short", risk: "1%" },
          ].map((p, i) => (
            <div key={i} className="flex justify-between bg-zinc-900 rounded-lg px-3 py-2 text-xs font-space-mono">
              <span className="text-zinc-300">{p.pos}</span>
              <span className="text-green-400">{p.risk}</span>
            </div>
          ))}
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-xs font-space-mono text-green-300">
            Реальный риск ≈ 2–3% (активы слабо коррелированы)
          </div>
        </div>
      </div>
      <div className="bg-zinc-900 border border-blue-500/20 rounded-xl p-3 mt-4">
        <div className="text-blue-400 font-orbitron text-xs font-bold mb-1">Правило максимального портфельного риска</div>
        <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">Суммарный риск всех открытых позиций не должен превышать 5–6% депозита одновременно. Это защищает от «чёрных лебедей» — непредвиденных рыночных событий, которые двигают все активы сразу.</p>
      </div>
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mt-4">
        <div className="text-red-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: LTCM и провал портфельного риска</div>
        <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
          Long-Term Capital Management (LTCM) — хедж-фонд с двумя нобелевскими лауреатами в совете директоров — в 1998 году потерял $4.6 млрд за несколько недель.
          Причина: все позиции были коррелированы. Когда российский дефолт ударил по рынкам, упало всё сразу — акции, облигации, деривативы.
          Суммарное плечо достигало 25:1. Не хватило простого правила: «суммарный портфельный риск не должен превышать 5–6%».
          Этот случай стал учебником о том, почему диверсификация по некоррелированным активам — не теория, а вопрос выживания.
        </p>
      </div>
    </div>
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="text-white font-orbitron text-xs font-bold mb-3">Ключевые метрики оценки торговой системы</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-space-mono">
        {[
          { name: "Expectancy (Матожидание)", formula: "E = (WR × avg_win) - (LR × avg_loss)", color: "text-green-400", desc: "Сколько R в среднем приносит одна сделка. Должно быть > 0. Цель: 0.3R и выше." },
          { name: "Profit Factor (PF)", formula: "PF = Gross Profit / Gross Loss", color: "text-blue-400", desc: "Отношение всей прибыли к всем убыткам. PF > 1.5 — хорошая система. PF > 2 — отличная." },
          { name: "Sharpe Ratio", formula: "SR = (Доходность - Rf) / Волатильность", color: "text-purple-400", desc: "Доходность относительно риска. SR > 1 — приемлемо. SR > 2 — профессиональный уровень." },
          { name: "Max Drawdown (MDD)", formula: "MDD = (Пик - Дно) / Пик × 100%", color: "text-red-400", desc: "Максимальная просадка за всю историю. Должна быть < 20% для комфортной торговли." },
        ].map((m, i) => (
          <div key={i} className="bg-zinc-900 rounded-xl p-3">
            <div className={`font-bold mb-1 ${m.color}`}>{m.name}</div>
            <code className="block bg-zinc-950 rounded px-2 py-1 text-zinc-400 mb-2 text-xs">{m.formula}</code>
            <p className="text-zinc-500 leading-relaxed">{m.desc}</p>
          </div>
        ))}
      </div>
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mt-4">
        <div className="text-blue-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Бернард Мэдофф и фальшивый Sharpe Ratio</div>
        <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
          Мошенник Берни Мэдофф привлекал инвесторов именно фантастическими метриками: стабильные 10–12% годовых, минимальная просадка, Sharpe Ratio выше 3.
          Настоящие профессионалы — Гарри Маркополос и команда аналитиков Bear Stearns — подозревали обман именно потому, что «слишком хорошие» метрики в реальных рыночных условиях невозможны.
          Урок: понимание нормальных значений Sharpe Ratio и MDD защищает не только от собственных ошибок, но и от чужого мошенничества.
          Реальный Medallion Fund (Renaissance) показывает SR ≈ 2.5. Это считается выдающимся результатом.
        </p>
      </div>
    </div>
  </div>
)
