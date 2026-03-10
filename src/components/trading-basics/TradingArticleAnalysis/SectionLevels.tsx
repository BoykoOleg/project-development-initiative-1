import { SupportResistanceChart } from "../TradingCharts"

export const SectionLevels = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">Уровни — основа технического анализа. Цена «помнит» исторические уровни и часто возвращается к ним снова и снова.</p>
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
      <div className="text-blue-400 font-orbitron text-xs font-bold mb-2">Реальный пример: $30,000 как ключевой уровень BTC</div>
      <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">Уровень $30,000 для Bitcoin держался как поддержка в июле 2021, был пробит в июне 2022 (стал сопротивлением), снова стал поддержкой в марте–июне 2023 (четыре отбоя от него за 3 месяца). Трейдеры, знавшие об этом уровне, имели чёткие зоны покупки и продажи вместо «торговли наугад».</p>
    </div>
    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
      <div className="text-orange-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Виктор Сперандео и уровни поддержки</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Виктор Сперандео («Трейдер Вик») — управляющий, показавший 70.7% среднегодовой доходности за 18 лет без убыточного года —
        строил всю свою торговлю вокруг ключевых уровней и линий тренда.
        Его книга «Trader Vic: Methods of a Wall Street Master» описывает метод «1-2-3»: уровень пробивается, цена возвращается к нему (тест), и только потом начинается настоящее движение.
        «Самые надёжные уровни — те, которые рынок проверял много раз», — утверждал он.
      </p>
    </div>
    <SupportResistanceChart />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
        <div className="text-green-400 font-orbitron text-xs font-bold mb-1">Поддержка</div>
        <p className="text-zinc-400 text-xs">Уровень, где покупатели «защищают» цену. Много раз останавливал падение. Хорошее место для покупки.</p>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
        <div className="text-red-400 font-orbitron text-xs font-bold mb-1">Сопротивление</div>
        <p className="text-zinc-400 text-xs">Уровень, где продавцы «давят» цену вниз. Много раз тормозил рост. Хорошее место для продажи.</p>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
        <div className="text-yellow-400 font-orbitron text-xs font-bold mb-1">Смена ролей</div>
        <p className="text-zinc-400 text-xs">После пробоя поддержка становится сопротивлением и наоборот. Это одна из самых надёжных закономерностей в ТА.</p>
      </div>
    </div>
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="text-white font-orbitron text-xs font-bold mb-2">Как определять сильные уровни</div>
      <ul className="text-zinc-400 text-xs font-space-mono space-y-1 list-none">
        <li>→ Минимум 2–3 касания — слабый уровень, 4+ — сильный</li>
        <li>→ Много объёма при формировании уровня — он значимее</li>
        <li>→ Психологические числа: $40,000, $50,000, $100 — работают как магниты</li>
        <li>→ Уровни на D1 и W1 сильнее, чем на M15 или H1</li>
        <li>→ Недельные и месячные закрытия цены — особенно важные уровни</li>
      </ul>
    </div>
  </div>
)
