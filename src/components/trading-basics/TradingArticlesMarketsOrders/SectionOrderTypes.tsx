import React from "react"
import { OrderTypesTable } from "../TradingCharts"

export const SectionOrderTypes = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">Каждый тип ордера решает конкретную задачу. Ошибка в выборе типа ордера может стоить процентов прибыли или части капитала.</p>
    <OrderTypesTable />
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
      <div className="text-red-400 font-orbitron text-xs font-bold mb-2">История из жизни: «я думал, это стоп-лосс»</div>
      <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">Михаил купил ETH по $1,850 и поставил «стоп» на $1,700. Но выставил обычный Limit Sell, а не Stop-Loss. Когда ETH упал до $1,680 — ордер просто не сработал (лимитка ждала цену $1,700, а не $1,680). ETH продолжил падение до $1,520. Разница: <span className="text-white">Stop-Loss срабатывает при достижении цены и хуже</span>, Limit — только точно по вашей цене.</p>
    </div>
    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
      <div className="text-purple-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Ларри Вильямс и точность исполнения</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Ларри Вильямс — трейдер, превративший $10,000 в $1,147,000 за один год в реальном чемпионате по торговле (1987) —
        утверждал, что понимание типов ордеров дало ему несправедливое преимущество над конкурентами.
        Он активно использовал стоп-ордера не только как защиту, но и как инструмент входа:
        покупал стоп-бай выше ключевого уровня, чтобы войти только при подтверждении пробоя — не гадая заранее.
      </p>
    </div>
  </div>
)
