import { RiskCalcTable } from "../TradingCharts"

export const SectionRisk1Percent = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">Главное правило трейдинга: сначала думай о том, сколько можешь потерять — и только потом о том, сколько заработаешь.</p>
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
      <div className="text-red-400 font-orbitron text-xs font-bold mb-2">Реальная история: $50,000 за 3 недели</div>
      <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">Андрей начал с депозитом $50,000. Видя, как все вокруг зарабатывают на крипте в 2021, рисковал 15–25% на каждую сделку. После 7 убыточных сделок подряд (обычная серия даже для профи) у него осталось $11,800. Чтобы вернуться к $50,000 — нужно было заработать +323%. Он увеличил размер ставок, чтобы «отыграться» — и потерял всё. <span className="text-white">При риске 2% та же серия из 7 потерь оставила бы $43,200.</span></p>
    </div>
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
      <div className="text-blue-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Уоррен Баффетт и правило №1</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Уоррен Баффетт сформулировал свои правила инвестирования предельно просто:
        «Правило №1: никогда не теряй деньги. Правило №2: никогда не забывай правило №1».
        Баффетт никогда не вкладывает в то, что может привести к катастрофическим потерям.
        В трейдинге это прямо соответствует риску 1–2%: даже при плохой серии сделок капитал остаётся достаточным, чтобы продолжать.
        Выживаемость важнее доходности — это принцип всех успешных управляющих капиталом.
      </p>
    </div>
    <RiskCalcTable />
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <svg viewBox="0 0 360 120" className="w-full h-28">
        {[
          { label: "10% риска", values: [100, 90, 81, 73, 66, 59, 53, 48, 43, 39], color: "#ef4444" },
          { label: "2% риска", values: [100, 98, 96.1, 94.2, 92.3, 90.5, 88.7, 86.9, 85.2, 83.5], color: "#eab308" },
          { label: "0.5% риска", values: [100, 99.5, 99, 98.5, 98, 97.5, 97, 96.5, 96, 95.5], color: "#22c55e" },
        ].map((line, li) => {
          const maxV = 100, minV = 35, w2 = 320, h = 90, pad2 = 20
          const px2 = (i: number) => pad2 + (i / (line.values.length - 1)) * (w2 - pad2)
          const py2 = (v: number) => h - ((v - minV) / (maxV - minV)) * (h - 15) - 5
          const path = line.values.map((v, i) => `${i === 0 ? "M" : "L"} ${px2(i)} ${py2(v)}`).join(" ")
          return <path key={li} d={path} stroke={line.color} strokeWidth="2" fill="none" />
        })}
        <text x="180" y="115" fontSize="8" fill="#52525b" textAnchor="middle" fontFamily="monospace">10 последовательных убыточных сделок</text>
        <text x="20" y="12" fontSize="7" fill="#fca5a5" fontFamily="monospace">-10%/сд: капитал $39</text>
        <text x="20" y="52" fontSize="7" fill="#fde68a" fontFamily="monospace">-2%/сд: капитал $83.5</text>
        <text x="20" y="72" fontSize="7" fill="#86efac" fontFamily="monospace">-0.5%/сд: капитал $95.5</text>
      </svg>
    </div>
    <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-4">
      <div className="text-red-400 font-orbitron text-xs font-bold mb-2">Математика ловушки</div>
      <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">Потеряли 50% — нужно заработать 100% чтобы вернуться. Потеряли 25% — нужно 33%. Именно поэтому главное правило — не потерять много, а не заработать много.</p>
    </div>
  </div>
)
