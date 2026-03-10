import { RRTable } from "../TradingCharts"

export const SectionRiskRR = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">R:R позволяет быть прибыльным даже с низким процентом выигрышей. Это контр-интуитивно, но математически верно.</p>
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
      <div className="text-yellow-400 font-orbitron text-xs font-bold mb-2">Реальный пример: 35% побед — и плюс</div>
      <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">Профессиональный трейдер Иван публично ведёт статистику: win rate 35%, но средний R:R 1:3.8. За 100 сделок: 35 прибыльных × 3.8R = +133R. 65 убыточных × 1R = -65R. Итого: <span className="text-white">+68R чистой прибыли</span>. Большинство новичков смотрят на win rate как на главный показатель — это грубая ошибка. Важна математика на длинной дистанции.</p>
    </div>
    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
      <div className="text-purple-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Питер Брандт и R:R как основа системы</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Питер Брандт — ветеран трейдинга с 1975 года, публично ведёт статистику своих сделок в Twitter/X —
        регулярно демонстрирует win rate около 40–45%, при этом показывая устойчивую прибыль за десятилетия.
        Его секрет: средний R:R около 1:2.5–3. «Я проигрываю больше сделок, чем выигрываю. Но математика на моей стороне».
        Это лучшее доказательство того, что win rate — второстепенный показатель. R:R и дисциплина — вот что определяет результат.
      </p>
    </div>
    <RRTable />
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="text-white font-orbitron text-xs font-bold mb-3">Пример расчёта прибыльности за 100 сделок</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-space-mono">
        {[
          { rr: "1:1", win: 60, lose: 40, profit: "+20R", color: "text-yellow-400" },
          { rr: "1:2", win: 40, lose: 60, profit: "+20R", color: "text-green-400" },
          { rr: "1:3", win: 30, lose: 70, profit: "+20R", color: "text-emerald-400" },
        ].map((ex, i) => (
          <div key={i} className="bg-zinc-950 rounded-lg p-3">
            <div className={`font-bold text-base mb-2 ${ex.color}`}>R:R = {ex.rr}</div>
            <div className="text-green-400">{ex.win} побед × {ex.rr.split(":")[1]}R = +{ex.win * parseInt(ex.rr.split(":")[1])}R</div>
            <div className="text-red-400">{ex.lose} потерь × 1R = -{ex.lose}R</div>
            <div className="border-t border-zinc-800 mt-2 pt-2 text-white font-bold">Итого: {ex.profit}</div>
          </div>
        ))}
      </div>
      <p className="text-zinc-500 text-xs mt-3">При R:R 1:2 — выигрывайте только 40% сделок и всё равно будете в прибыли.</p>
    </div>
  </div>
)
