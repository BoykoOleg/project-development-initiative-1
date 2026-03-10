import React from "react"

export const SectionMTF = () => (
  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
    <div className="text-white font-orbitron text-xs font-bold mb-3">Мультитаймфреймный анализ (MTF): торговая система</div>
    <p className="text-gray-300 text-sm leading-relaxed mb-3">Профессиональная система состоит из 3 тайм-фреймов: старший задаёт контекст, средний — зону, младший — точку входа.</p>
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-space-mono">
        <thead>
          <tr className="border-b border-zinc-800">
            {["Тайм-фрейм", "Роль", "Что смотрим", "Индикаторы"].map(h => (
              <th key={h} className="text-left px-3 py-2 text-zinc-500 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            { tf: "W1 / D1", role: "Старший (контекст)", what: "Глобальный тренд, крупные уровни", ind: "MA200, Ичимоку, ключевые S/R" },
            { tf: "H4 / H1", role: "Средний (зона)", what: "Зоны входа, структура, паттерны", ind: "RSI, MACD, EMA50" },
            { tf: "M15 / M5", role: "Младший (триггер)", what: "Точный вход, стоп, паттерн свечи", ind: "EMA9/21, объём, стакан" },
          ].map((row, i) => (
            <tr key={i} className="border-b border-zinc-900 hover:bg-zinc-900/40">
              <td className="px-3 py-2 text-blue-400 font-bold">{row.tf}</td>
              <td className="px-3 py-2 text-zinc-300">{row.role}</td>
              <td className="px-3 py-2 text-zinc-400">{row.what}</td>
              <td className="px-3 py-2 text-purple-400">{row.ind}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="bg-zinc-900 border border-yellow-500/20 rounded-xl p-3 mt-3">
      <div className="text-yellow-400 font-orbitron text-xs font-bold mb-1">Правило согласования таймфреймов</div>
      <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">Входите в сделку только если все три таймфрейма согласованы: D1 бычий → H4 показывает зону входа → M15 даёт триггер. При конфликте ТФ — пропускайте сетап. Ждать лучшего момента — тоже работа.</p>
    </div>
    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mt-3">
      <div className="text-green-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Марк Минервини и мультитаймфреймный отбор акций</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Марк Минервини — четырёхкратный чемпион US Investing Championship (средняя доходность 220%+ в год) —
        использует строгую MTF-систему: сначала смотрит на недельный тренд и фундаментал, затем на дневной для поиска зоны входа, и только потом на часовой для точного триггера.
        «Я никогда не куплю акцию на H1, если D1 в нисходящем тренде. Это как ловить падающий нож».
        Его подход называется SEPA (Specific Entry Point Analysis) — и в его основе лежит именно принцип согласования тайм-фреймов.
      </p>
    </div>
  </div>
)
