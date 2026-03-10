import React from "react"

export const SectionAdvancedOrders = () => (
  <div className="space-y-4">
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex gap-2 items-center">
      <span className="text-red-400 text-lg">⚠</span>
      <p className="text-red-300 text-xs font-space-mono">Продвинутый раздел. Требует понимания базовых типов ордеров и принципов маржинальной торговли.</p>
    </div>
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="text-white font-orbitron text-xs font-bold mb-3">OCO (One Cancels the Other)</div>
      <p className="text-gray-300 text-sm leading-relaxed mb-3">Пара ордеров: при исполнении одного второй автоматически отменяется. Позволяет одновременно зафиксировать прибыль или ограничить убыток без ручного контроля.</p>
      <div className="bg-zinc-900 rounded-xl p-3">
        <svg viewBox="0 0 360 100" className="w-full h-24">
          <line x1="30" y1="50" x2="330" y2="50" stroke="#e5e7eb" strokeWidth="1.5" />
          <circle cx="180" cy="50" r="5" fill="#60a5fa" />
          <text x="180" y="42" fontSize="8" fill="#60a5fa" textAnchor="middle" fontFamily="monospace">ПОЗИЦИЯ $100</text>
          <line x1="30" y1="25" x2="330" y2="25" stroke="#22c55e" strokeWidth="1" strokeDasharray="5,3" />
          <text x="60" y="20" fontSize="8" fill="#22c55e" fontFamily="monospace">TP: $115 (+15%)</text>
          <line x1="30" y1="78" x2="330" y2="78" stroke="#ef4444" strokeWidth="1" strokeDasharray="5,3" />
          <text x="60" y="92" fontSize="8" fill="#ef4444" fontFamily="monospace">SL: $93 (-7%)</text>
          <text x="280" y="52" fontSize="8" fill="#a78bfa" fontFamily="monospace">OCO</text>
          <line x1="320" y1="25" x2="320" y2="78" stroke="#a78bfa" strokeWidth="1" />
          <text x="270" y="90" fontSize="7" fill="#52525b" fontFamily="monospace">Сработает одно — другое отменится</text>
        </svg>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        <div className="bg-zinc-900 rounded-lg p-3">
          <div className="text-green-400 font-orbitron text-xs font-bold mb-1">Применение</div>
          <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">Входите в сделку и сразу выставляете OCO: если цена достигает TP — позиция закрывается с прибылью, SL-ордер отменяется. Если цена падает до SL — убыток зафиксирован, TP отменён.</p>
        </div>
        <div className="bg-zinc-900 rounded-lg p-3">
          <div className="text-blue-400 font-orbitron text-xs font-bold mb-1">Где доступно</div>
          <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">Bybit, Binance Futures, OKX — все крупные биржи поддерживают OCO. На споте — иногда ограничено. Всегда проверяйте исполнение в тестовой сети перед реальными деньгами.</p>
        </div>
      </div>
    </div>
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="text-white font-orbitron text-xs font-bold mb-3">Фьючерсы: лонг, шорт и ликвидация</div>
      <p className="text-gray-300 text-sm leading-relaxed mb-3">Фьючерсные контракты позволяют торговать с кредитным плечом и открывать позиции на падение (шорт) без владения активом. Высокий потенциал прибыли = высокий риск ликвидации.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { title: "Плечо (Leverage)", color: "text-yellow-400", bc: "border-yellow-500/30 bg-yellow-500/5", desc: "10x плечо: 1000$ управляет позицией 10 000$. Прибыль и убыток умножаются на 10. Движение против вас на 10% = потеря всего депозита (ликвидация)." },
          { title: "Шорт (Short)", color: "text-red-400", bc: "border-red-500/30 bg-red-500/5", desc: "Продаёте актив, которого у вас нет (берёте в долг у биржи). Зарабатываете на падении цены. При росте — убыток. Риск шорта теоретически неограничен." },
          { title: "Ликвидация", color: "text-orange-400", bc: "border-orange-500/30 bg-orange-500/5", desc: "Биржа принудительно закрывает позицию при достижении уровня ликвидации. Вы теряете весь маржинальный залог. Никогда не торгуйте без стопа на фьючерсах." },
        ].map((item, i) => (
          <div key={i} className={`border rounded-xl p-3 ${item.bc}`}>
            <div className={`font-orbitron text-xs font-bold mb-1 ${item.color}`}>{item.title}</div>
            <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
      <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-3 mt-3">
        <div className="text-red-400 font-orbitron text-xs font-bold mb-1">Формула цены ликвидации (лонг):</div>
        <code className="text-green-400 font-space-mono text-xs block bg-zinc-950 rounded p-2 mt-1">
          Цена ликвидации = Цена входа × (1 - 1/Плечо + Ставка обслуживания)
        </code>
        <p className="text-zinc-500 text-xs font-space-mono mt-2">Пример: Лонг BTC по $50,000 с плечом 10x → ликвидация ≈ $45,500 (падение ~9%)</p>
      </div>
    </div>
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="text-white font-orbitron text-xs font-bold mb-3">Алгоритм выставления ордеров: профессиональный чеклист</div>
      <div className="space-y-2">
        {[
          { n: "1", text: "Определяю направление на D1/H4 (только по тренду или чёткая зона разворота)", color: "text-blue-400" },
          { n: "2", text: "Нахожу точку входа на H1/M15 — ближе к уровню или OB, не в середине движения", color: "text-blue-400" },
          { n: "3", text: "Ставлю лимитный ордер на уровень, а не рыночный — экономлю на комиссии и цене", color: "text-green-400" },
          { n: "4", text: "Сразу выставляю SL за ближайшую структуру (не в процентах вслепую)", color: "text-red-400" },
          { n: "5", text: "Рассчитываю размер позиции: риск 1% депо / размер стопа в $ = количество единиц", color: "text-yellow-400" },
          { n: "6", text: "Выставляю TP или переношу в OCO. Ухожу от экрана. Не слежу каждую минуту.", color: "text-purple-400" },
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3 bg-zinc-900 rounded-lg px-3 py-2">
            <span className={`font-orbitron font-bold text-sm shrink-0 ${step.color}`}>{step.n}</span>
            <span className="text-zinc-300 text-xs font-space-mono leading-relaxed">{step.text}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
)
