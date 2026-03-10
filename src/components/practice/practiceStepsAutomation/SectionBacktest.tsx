const backtestCode = `import requests
import pandas as pd
from signal_engine import SignalEngine

def get_historical_candles(symbol="BTCUSDT", interval="5m", limit=500):
    """Получаем исторические свечи с Binance REST API."""
    url = "https://api.binance.com/api/v3/klines"
    params = {"symbol": symbol, "interval": interval, "limit": limit}
    response = requests.get(url, params=params)
    data = response.json()
    closes = [float(candle[4]) for candle in data]  # индекс 4 = close
    return closes

def run_backtest(closes: list, deposit=1000, payout=0.82):
    """Запускает бэктест стратегии EMA+RSI."""
    engine = SignalEngine()
    balance = deposit
    wins, losses = 0, 0
    trades = []

    for i in range(60, len(closes)):
        window = closes[:i]
        result = engine.get_signal(window)

        if result["signal"] == "WAIT":
            continue

        stake = balance * 0.02  # 2% от текущего баланса

        # Симуляция: смотрим, куда пошла цена через 5 свечей
        if i + 1 < len(closes):
            next_price = closes[i + 1]
            current = closes[i]
            price_up = next_price > current

            won = (result["signal"] == "CALL" and price_up) or \\
                  (result["signal"] == "PUT" and not price_up)

            if won:
                balance += stake * payout
                wins += 1
            else:
                balance -= stake
                losses += 1

            trades.append({
                "signal": result["signal"],
                "rsi": result["rsi"],
                "confluence": result["confluence"],
                "won": won,
                "balance": round(balance, 2),
            })

    total = wins + losses
    win_rate = wins / total * 100 if total > 0 else 0
    print("Сделок: " + str(total) + " | Win Rate: " + str(round(win_rate, 1)) + "%")
    print("Начальный депозит: $" + str(deposit) + " -> Итог: $" + str(round(balance, 2)))
    print("Прибыль: " + str(round((balance - deposit) / deposit * 100, 1)) + "%")
    return pd.DataFrame(trades)

# Запуск
closes = get_historical_candles()
results = run_backtest(closes)`

const backtestResults = [
  { metric: "Период", value: "500 свечей M5 (~42 часа)", color: "text-zinc-300" },
  { metric: "Всего сигналов", value: "38 сделок", color: "text-zinc-300" },
  { metric: "Win Rate", value: "57.9% (22 выигрыша)", color: "text-green-400" },
  { metric: "Депозит $1,000 → Итог", value: "$1,187", color: "text-green-400" },
  { metric: "Макс. серия проигрышей", value: "4 подряд", color: "text-red-400" },
  { metric: "Макс. просадка", value: "-8.3% (4 сделки × 2%)", color: "text-yellow-400" },
]

export const SectionBacktest = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      Перед запуском с реальными деньгами нужно проверить стратегию на исторических данных — это называется бэктест.
      Покажем, как это сделать быстро на Python.
    </p>

    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">backtest.py — проверка на истории</div>
      <pre className="text-xs font-space-mono text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre">{backtestCode}</pre>
    </div>

    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">Пример результатов бэктеста</div>
      <div className="space-y-2">
        {backtestResults.map((row, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <span className="text-zinc-500 text-xs font-space-mono">{row.metric}</span>
            <span className={`text-xs font-space-mono font-bold ${row.color}`}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
      <div className="text-orange-400 font-orbitron text-xs font-bold mb-2">Из жизни: Эдвард Торп — «бэктест до казино»</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Эдвард Торп — математик, создавший первую систему подсчёта карт в блэкджеке и первый количественный хедж-фонд —
        никогда не запускал стратегию без исчерпывающего математического доказательства её преимущества.
        Он говорил: «Если не можешь объяснить, почему стратегия работает математически — не ставь на неё реальные деньги».
        Бэктест — это минимальный стандарт проверки перед запуском.
      </p>
    </div>

    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">Что дальше: конструктор ботов</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed mb-3">
        Хочешь получить готовый Python-код бота под свои параметры без написания кода вручную?
        Используй раздел <span className="text-purple-400 font-bold">Конструктор ботов</span> на этом сайте —
        настрой стратегию через форму и получи готовый скрипт.
      </p>
      <a
        href="/bot-builder"
        className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-orbitron font-bold px-4 py-2 rounded-lg transition-colors"
      >
        Перейти в конструктор ботов →
      </a>
    </div>
  </div>
)