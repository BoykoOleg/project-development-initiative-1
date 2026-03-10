import React from "react"
import { OrderBookChart } from "../TradingCharts"

export const SectionMarketParticipants = () => (
  <>
    <div className="space-y-3">
      <p className="text-gray-300 leading-relaxed">Рынок — это экосистема с разными игроками. Понимание мотивов каждого помогает читать движения цены.</p>
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
        <div className="text-yellow-400 font-orbitron text-xs font-bold mb-2">Реальный пример: январь 2021, GameStop (GME)</div>
        <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">Хедж-фонды (институционалы) массово шортили акции GameStop. Тысячи розничных трейдеров с Reddit скоординировались и начали покупать GME. Акция взлетела с $17 до $483 за 2 недели. Хедж-фонд Melvin Capital потерял $6.8 млрд. Это наглядно показывает: <span className="text-white">розничные трейдеры вместе могут двигать рынок</span> — но не рекомендуется строить торговлю на таких событиях.</p>
      </div>
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="text-blue-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Пол Тюдор Джонс и понимание игроков</div>
        <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
          Пол Тюдор Джонс — легендарный макро-трейдер, предсказавший крах 1987 года и заработавший 200% за тот год —
          всегда изучал, кто находится «по другую сторону его сделки».
          «Я думаю о рынке как о большом аукционе. Чтобы выиграть, нужно понять, кто продаёт и почему».
          Именно понимание мотивов разных участников рынка позволило ему открыть короткую позицию на весь рынок акций за несколько недель до краха Чёрного понедельника.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { title: "Маркет-мейкеры", color: "border-blue-500/40 bg-blue-500/5", tc: "text-blue-400", desc: "Крупные банки и брокеры, которые постоянно выставляют заявки на покупку и продажу. Обеспечивают ликвидность. Зарабатывают на спреде. Без них рынок не работает." },
          { title: "Институционалы", color: "border-purple-500/40 bg-purple-500/5", tc: "text-purple-400", desc: "Хедж-фонды, банки, пенсионные фонды. Торгуют миллиардами — их сделки буквально двигают рынок. Часто используют алгоритмы и ИИ." },
          { title: "Розничные трейдеры", color: "border-yellow-500/40 bg-yellow-500/5", tc: "text-yellow-400", desc: "Частные лица с небольшим капиталом. Это мы с вами. Составляем меньшую часть объёма, но в сумме влияем на настроения рынка." },
          { title: "Алгоритмы (HFT)", color: "border-red-500/40 bg-red-500/5", tc: "text-red-400", desc: "Высокочастотные торговые боты. Совершают тысячи сделок в секунду. Обеспечивают около 70% объёма на американских биржах. Конкурировать с ними в скорости невозможно." },
        ].map((p, i) => (
          <div key={i} className={`border rounded-lg p-3 ${p.color}`}>
            <div className={`font-orbitron text-xs font-bold mb-1 ${p.tc}`}>{p.title}</div>
            <p className="text-zinc-400 text-xs leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
    <div className="space-y-3 mt-4">
      <p className="text-gray-300 leading-relaxed">Order Book — главный инструмент понимания текущего баланса спроса и предложения. Именно здесь видно, где стоят крупные игроки.</p>
      <OrderBookChart />
      <div className="space-y-2 text-sm text-zinc-300 leading-relaxed">
        <div className="flex gap-2"><span className="text-green-400 font-bold">Биды (зелёные)</span><span>— заявки на покупку. Чем выше цена — тем меньше желающих покупать.</span></div>
        <div className="flex gap-2"><span className="text-red-400 font-bold">Аски (красные)</span><span>— заявки на продажу. Стена продаж выше рынка тормозит рост цены.</span></div>
        <div className="flex gap-2"><span className="text-yellow-400 font-bold">Спред</span><span>— разница между лучшим аском и лучшим бидом. Это «стоимость» мгновенной сделки.</span></div>
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs text-zinc-400 mt-2">
          <span className="text-white font-semibold">Совет:</span> Большой объём на уровне поддержки в стакане — не гарантия. Крупные игроки могут снять свои заявки прямо перед достижением цены (манипуляция «стеной»). Анализируйте стакан в динамике.
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mt-2">
          <div className="text-green-400 font-orbitron text-xs font-bold mb-2">Реальный пример: «стена» как ловушка</div>
          <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">Март 2023, BTC торгуется по $27,800. В стакане на $28,000 — огромная стена продаж в 500 BTC. Розничные трейдеры ждут: «пока стена не исчезнет — не покупаем». Через 20 минут стена пропадает (заявку сняли), BTC за 3 часа вырастает до $28,500. Крупный игрок создал «потолок» чтобы дёшево набрать позицию, пока все стоят в стороне.</p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mt-2">
          <div className="text-orange-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Питер Линч о чтении рыночного «настроения»</div>
          <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
            Питер Линч — управляющий фондом Magellan Fund (Fidelity), показавший 29% годовых за 13 лет —
            анализировал не только цифры, но и поведение участников рынка.
            Он говорил: «Когда таксисты начинают давать советы по акциям — пора продавать».
            Именно массовое поведение розничных участников создаёт «стены» и ловушки в стакане, которые умные игроки используют для набора позиций.
          </p>
        </div>
      </div>
    </div>
  </>
)
