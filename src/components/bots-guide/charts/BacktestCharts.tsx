export function BacktestMetricsTable() {
  const metrics = [
    { metric: "Total Return", desc: "Общая доходность за период", good: "> 50% в год", bad: "< 10% или нереально > 500%" },
    { metric: "Max Drawdown", desc: "Максимальная просадка от пика", good: "< 15%", bad: "> 30%" },
    { metric: "Sharpe Ratio", desc: "Доходность с учётом риска", good: "> 1.5", bad: "< 0.5" },
    { metric: "Win Rate", desc: "Процент прибыльных сделок", good: "45–65%", bad: "> 90% (overfitting)" },
    { metric: "Profit Factor", desc: "Сумма прибылей / сумма убытков", good: "> 1.5", bad: "< 1.0" },
    { metric: "Recovery Factor", desc: "Return / Max Drawdown", good: "> 3", bad: "< 1" },
  ]
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden my-4">
      <div className="px-4 py-2 border-b border-zinc-800">
        <p className="text-zinc-400 text-xs font-space-mono">Ключевые метрики бэктестинга: что означает каждая</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-space-mono">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-4 py-2 text-zinc-500">Метрика</th>
              <th className="text-left px-4 py-2 text-zinc-500">Что показывает</th>
              <th className="text-left px-4 py-2 text-zinc-500">Хорошо</th>
              <th className="text-left px-4 py-2 text-zinc-500">Плохо</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m, i) => (
              <tr key={i} className="border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors">
                <td className="px-4 py-2 text-purple-400 font-bold whitespace-nowrap">{m.metric}</td>
                <td className="px-4 py-2 text-zinc-300">{m.desc}</td>
                <td className="px-4 py-2 text-green-400">{m.good}</td>
                <td className="px-4 py-2 text-red-400">{m.bad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function OverfittingChart() {
  const historical = [100, 110, 108, 120, 118, 130, 125, 140, 138, 150]
  const realWorld = [100, 105, 98, 102, 95, 88, 92, 85, 80, 75]
  const w = 340, h = 120, pad = 25
  const maxV = 160, minV = 70
  const px = (i: number) => pad + (i / (historical.length - 1)) * (w - pad * 2)
  const py = (v: number) => h - ((v - minV) / (maxV - minV)) * (h - 20) - 5
  const hPath = historical.map((v, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${py(v)}`).join(" ")
  const rPath = realWorld.map((v, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${py(v)}`).join(" ")
  const splitX = px(historical.length - 1)
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 my-4">
      <p className="text-zinc-400 text-xs font-space-mono mb-2">Overfitting: идеальный бэктест vs реальная торговля</p>
      <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full h-36">
        <rect x={pad} y="5" width={splitX - pad} height={h - 5} fill="#22c55e08" />
        <rect x={splitX} y="5" width={w - pad - splitX} height={h - 5} fill="#ef444408" />
        <text x={(pad + splitX) / 2} y="18" fontSize="8" fill="#86efac" textAnchor="middle" fontFamily="monospace">Бэктест (история)</text>
        <text x={(splitX + w - pad) / 2} y="18" fontSize="8" fill="#fca5a5" textAnchor="middle" fontFamily="monospace">Реальная торговля</text>
        <line x1={splitX} y1="5" x2={splitX} y2={h} stroke="#52525b" strokeWidth="1" strokeDasharray="4,3" />
        <path d={hPath} stroke="#22c55e" strokeWidth="2.5" fill="none" />
        <path d={rPath} stroke="#ef4444" strokeWidth="2.5" fill="none" />
        <line x1={pad} y1={pad + 20} x2={pad + 30} y2={pad + 20} stroke="#22c55e" strokeWidth="2" />
        <text x={pad + 34} y={pad + 24} fontSize="8" fill="#86efac" fontFamily="monospace">Бэктест: +50%</text>
        <line x1={pad} y1={pad + 35} x2={pad + 30} y2={pad + 35} stroke="#ef4444" strokeWidth="2" />
        <text x={pad + 34} y={pad + 39} fontSize="8" fill="#fca5a5" fontFamily="monospace">Реальность: -25%</text>
      </svg>
    </div>
  )
}

export function BacktestingCodeExample() {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden my-4">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800 bg-zinc-900">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <div className="w-2 h-2 rounded-full bg-yellow-500" />
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-zinc-500 text-xs font-space-mono ml-2">simple_backtest.py</span>
      </div>
      <pre className="p-4 text-xs font-space-mono overflow-x-auto text-zinc-300 leading-relaxed">
{`# Простейший бэктест стратегии EMA Cross на Python
import pandas as pd

def backtest_ema_cross(df, fast=20, slow=50):
    df['ema_fast'] = df['close'].ewm(span=fast).mean()
    df['ema_slow'] = df['close'].ewm(span=slow).mean()
    
    position = 0
    trades, equity = [], [1000]
    
    for i in range(1, len(df)):
        prev_fast = df['ema_fast'].iloc[i-1]
        prev_slow = df['ema_slow'].iloc[i-1]
        curr_fast = df['ema_fast'].iloc[i]
        curr_slow = df['ema_slow'].iloc[i]
        
        # Golden Cross — покупка
        if prev_fast < prev_slow and curr_fast > curr_slow and position == 0:
            position = equity[-1] / df['close'].iloc[i]
            entry = df['close'].iloc[i]
        
        # Death Cross — продажа
        elif prev_fast > prev_slow and curr_fast < curr_slow and position > 0:
            pnl = (df['close'].iloc[i] - entry) / entry
            trades.append(pnl)
            equity.append(equity[-1] * (1 + pnl))
            position = 0
    
    return {
        'total_return': (equity[-1] / 1000 - 1) * 100,
        'win_rate': sum(1 for t in trades if t > 0) / len(trades) * 100,
        'trades': len(trades)
    }`}
      </pre>
    </div>
  )
}
