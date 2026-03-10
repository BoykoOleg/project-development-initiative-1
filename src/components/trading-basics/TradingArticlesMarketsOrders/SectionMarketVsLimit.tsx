import React from "react"

export const SectionMarketVsLimit = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">Главный выбор каждого трейдера при входе в сделку — скорость или точность цены.</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-zinc-900 border border-red-500/30 rounded-xl p-4">
        <div className="text-red-400 font-orbitron font-bold mb-2">Market Order</div>
        <div className="space-y-1 text-xs text-zinc-400 font-space-mono">
          <div>✓ Мгновенное исполнение</div>
          <div>✓ 100% вероятность сделки</div>
          <div>✗ Проскальзывание в неликвиде</div>
          <div>✗ Нет контроля цены</div>
        </div>
        <div className="mt-3 bg-zinc-950 rounded p-2 text-xs text-zinc-500">
          <span className="text-white">Используйте:</span> При срочном закрытии позиции, торговле топ-ликвидными активами (BTC, SBER, AAPL)
        </div>
      </div>
      <div className="bg-zinc-900 border border-green-500/30 rounded-xl p-4">
        <div className="text-green-400 font-orbitron font-bold mb-2">Limit Order</div>
        <div className="space-y-1 text-xs text-zinc-400 font-space-mono">
          <div>✓ Точная цена входа</div>
          <div>✓ Нет проскальзывания</div>
          <div>✓ Maker-скидка на комиссию</div>
          <div>✗ Может не исполниться</div>
        </div>
        <div className="mt-3 bg-zinc-950 rounded p-2 text-xs text-zinc-500">
          <span className="text-white">Используйте:</span> Вход на откате, выход на TP, любая работа «по уровням»
        </div>
      </div>
    </div>
    <div className="bg-zinc-900 border border-yellow-500/20 rounded-xl p-4 mt-2">
      <div className="text-yellow-400 font-orbitron text-xs font-bold mb-2">Пример расчёта проскальзывания</div>
      <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">
        Хотите купить 1 BTC по цене $42,850 рыночным ордером. Стакан: лучший аск $42,900 (0.3 BTC) + $42,950 (0.7 BTC). Итог: покупаете по средней ~$42,930. Проскальзывание = $80 (0.19%). На маленьких объёмах незначительно, на крупных — существенно.
      </p>
    </div>
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mt-2">
      <div className="text-blue-400 font-orbitron text-xs font-bold mb-2">Реальный кейс: скальпер и проскальзывание</div>
      <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">Дмитрий торговал SOL рыночными ордерами в скальпинге, целясь на +0.3% с каждой сделки. После 30 сделок оказалось, что комиссия (0.1%) + проскальзывание (0.08–0.15%) съедала половину прибыли. Перешёл на лимитные ордера — стал маркет-мейкером, получил скидку на комиссии и улучшил результат на 40%.</p>
    </div>
    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mt-2">
      <div className="text-green-400 font-orbitron text-xs font-bold mb-2">Из жизни профессионалов: Сим Уи Ли и лимитные ордера</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Профессиональные маркет-мейкеры (такие как команды Jump Trading или Optiver) строят весь бизнес на лимитных ордерах:
        они постоянно стоят и на покупке, и на продаже, зарабатывая спред. По данным Virtu Financial (публичная компания),
        использование исключительно лимитных ордеров позволяет им быть прибыльными в 99%+ торговых дней.
        Для розничного трейдера урок один: лимитный ордер — это терпение, которое буквально конвертируется в деньги.
      </p>
    </div>
  </div>
)
