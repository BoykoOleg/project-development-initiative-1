export type BotType = "grid" | "dca" | "trend" | "scalping"

export interface BotConfig {
  type: BotType
  asset: string
  exchange: string
  deposit: number
  riskPercent: number
  takeProfitPercent: number
  stopLossPercent: number
  gridLevels: number
  dcaStep: number
  trendIndicator: string
  trailingStop: boolean
  compounding: boolean
}

export const BOT_TYPES: Record<BotType, { label: string; description: string; color: string }> = {
  grid: { label: "Grid-бот", description: "Торговля в диапазоне, покупка снизу — продажа сверху", color: "bg-blue-500/20 border-blue-500/40 text-blue-400" },
  dca: { label: "DCA-бот", description: "Усреднение по времени или при падении цены", color: "bg-green-500/20 border-green-500/40 text-green-400" },
  trend: { label: "Трендовый бот", description: "Следование тренду по сигналам индикаторов", color: "bg-yellow-500/20 border-yellow-500/40 text-yellow-400" },
  scalping: { label: "Скальпинг-бот", description: "Множество быстрых сделок на малых тайм-фреймах", color: "bg-red-500/20 border-red-500/40 text-red-400" },
}

export const DEFAULT_CONFIG: BotConfig = {
  type: "dca",
  asset: "BTC/USDT",
  exchange: "Binance",
  deposit: 1000,
  riskPercent: 1,
  takeProfitPercent: 3,
  stopLossPercent: 1.5,
  gridLevels: 5,
  dcaStep: 3,
  trendIndicator: "EMA",
  trailingStop: false,
  compounding: false,
}

export function generateCode(cfg: BotConfig): string {
  const typeComments: Record<BotType, string> = {
    grid: "# Grid-стратегия: покупка на нижних уровнях, продажа на верхних",
    dca: "# DCA-стратегия: усреднение при падении цены",
    trend: `# Трендовая стратегия на основе ${cfg.trendIndicator}`,
    scalping: "# Скальпинг-стратегия: быстрые сделки на M1-M5",
  }

  const strategyCode: Record<BotType, string> = {
    grid: `
def calculate_grid_levels(current_price, levels=${cfg.gridLevels}, spread=0.01):
    """Расчёт уровней сетки вокруг текущей цены"""
    step = current_price * spread
    return [current_price + step * i for i in range(-levels, levels + 1)]

def check_grid_signal(price, grid_levels, open_orders):
    """Проверяет, нужно ли открыть ордер на уровне сетки"""
    for level in grid_levels:
        if abs(price - level) / level < 0.001:  # цена близка к уровню
            if level not in open_orders:
                direction = "BUY" if price <= level else "SELL"
                return direction, level
    return None, None`,

    dca: `
def check_dca_signal(current_price, avg_price, position_count):
    """Сигнал для усреднения при падении цены"""
    if avg_price is None:
        return "BUY"  # Первая покупка
    
    drop_percent = (avg_price - current_price) / avg_price * 100
    
    if drop_percent >= ${cfg.dcaStep} and position_count < 5:
        return "BUY"  # Усредняем при падении на ${cfg.dcaStep}%
    
    profit_percent = (current_price - avg_price) / avg_price * 100
    if profit_percent >= ${cfg.takeProfitPercent}:
        return "SELL"  # Закрываем при достижении цели
    
    return None`,

    trend: `
def check_trend_signal(df):
    """Трендовый сигнал на основе ${cfg.trendIndicator}"""
    ${cfg.trendIndicator === "EMA" ? `
    ema_fast = df['close'].ewm(span=9).mean()
    ema_slow = df['close'].ewm(span=21).mean()
    
    if ema_fast.iloc[-1] > ema_slow.iloc[-1] and ema_fast.iloc[-2] <= ema_slow.iloc[-2]:
        return "BUY"   # Золотой крест
    elif ema_fast.iloc[-1] < ema_slow.iloc[-1] and ema_fast.iloc[-2] >= ema_slow.iloc[-2]:
        return "SELL"  # Мёртвый крест` : cfg.trendIndicator === "MACD" ? `
    exp1 = df['close'].ewm(span=12).mean()
    exp2 = df['close'].ewm(span=26).mean()
    macd = exp1 - exp2
    signal = macd.ewm(span=9).mean()
    
    if macd.iloc[-1] > signal.iloc[-1] and macd.iloc[-2] <= signal.iloc[-2]:
        return "BUY"
    elif macd.iloc[-1] < signal.iloc[-1] and macd.iloc[-2] >= signal.iloc[-2]:
        return "SELL"` : `
    delta = df['close'].diff()
    gain = delta.where(delta > 0, 0).rolling(14).mean()
    loss = -delta.where(delta < 0, 0).rolling(14).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    
    if rsi.iloc[-1] < 30:
        return "BUY"   # Перепроданность
    elif rsi.iloc[-1] > 70:
        return "SELL"  # Перекупленность`}
    return None`,

    scalping: `
def check_scalping_signal(df, spread_threshold=0.001):
    """Скальпинг сигнал на основе краткосрочного импульса"""
    # Быстрый RSI на M1
    delta = df['close'].diff()
    gain = delta.where(delta > 0, 0).rolling(7).mean()
    loss = -delta.where(delta < 0, 0).rolling(7).mean()
    rsi = 100 - (100 / (1 + gain / loss))
    
    volume_ma = df['volume'].rolling(20).mean()
    volume_surge = df['volume'].iloc[-1] > volume_ma.iloc[-1] * 1.5
    
    if rsi.iloc[-1] < 35 and volume_surge:
        return "BUY"
    elif rsi.iloc[-1] > 65 and volume_surge:
        return "SELL"
    return None`,
  }

  return `#!/usr/bin/env python3
"""
Торговый бот: ${BOT_TYPES[cfg.type].label}
Актив: ${cfg.asset} | Биржа: ${cfg.exchange}
Депозит: $${cfg.deposit} | Риск: ${cfg.riskPercent}% на сделку
Сгенерировано: TradeBase Bot Builder
"""

import time
import ccxt
import pandas as pd
import os

${typeComments[cfg.type]}

# === НАСТРОЙКИ ===
EXCHANGE_ID = "${cfg.exchange.toLowerCase()}"
SYMBOL = "${cfg.asset}"
DEPOSIT = ${cfg.deposit}          # Депозит в USD
RISK_PERCENT = ${cfg.riskPercent}        # % риска на сделку
TAKE_PROFIT = ${cfg.takeProfitPercent}       # % тейк-профит
STOP_LOSS = ${cfg.stopLossPercent}         # % стоп-лосс
COMPOUNDING = ${cfg.compounding ? "True" : "False"}      # Реинвестирование прибыли

# === ПОДКЛЮЧЕНИЕ К БИРЖЕ ===
exchange = getattr(ccxt, EXCHANGE_ID)({
    "apiKey": os.environ.get("API_KEY"),
    "secret": os.environ.get("API_SECRET"),
    "enableRateLimit": True,
    "options": {"defaultType": "spot"},
})

def get_ohlcv(timeframe="1m", limit=100):
    """Получение исторических свечей"""
    ohlcv = exchange.fetch_ohlcv(SYMBOL, timeframe, limit=limit)
    df = pd.DataFrame(ohlcv, columns=["timestamp", "open", "high", "low", "close", "volume"])
    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
    return df

def get_position_size(price, risk_pct=RISK_PERCENT):
    """Расчёт размера позиции по риску"""
    balance = exchange.fetch_balance()["USDT"]["free"]
    risk_amount = balance * (risk_pct / 100)
    stop_distance = price * (STOP_LOSS / 100)
    quantity = risk_amount / stop_distance
    return round(quantity, 6)

def place_order(side, quantity, price=None):
    """Размещение ордера"""
    order_type = "limit" if price else "market"
    order = exchange.create_order(
        symbol=SYMBOL,
        type=order_type,
        side=side.lower(),
        amount=quantity,
        price=price,
    )
    print(f"[ORDER] {side} {quantity} {SYMBOL} @ {price or 'market'} | ID: {order['id']}")
    return order
${strategyCode[cfg.type]}

def main():
    """Основной цикл бота"""
    print(f"🤖 Запуск бота: {BOT_TYPES_LABEL}")
    print(f"   Актив: {SYMBOL} | Биржа: {EXCHANGE_ID}")
    print(f"   Депозит: $${cfg.deposit} | Риск: ${cfg.riskPercent}%\\n")
    
    ${cfg.type === "grid" ? "grid_levels = []\n    open_orders = set()" : cfg.type === "dca" ? "avg_price = None\n    position_count = 0" : ""}
    
    while True:
        try:
            df = get_ohlcv()
            current_price = df["close"].iloc[-1]
            
            ${cfg.type === "grid" ? `if not grid_levels:
                grid_levels = calculate_grid_levels(current_price)
            
            signal, level = check_grid_signal(current_price, grid_levels, open_orders)
            if signal:
                qty = get_position_size(current_price)
                place_order(signal, qty, level)
                open_orders.add(level)` : cfg.type === "dca" ? `signal = check_dca_signal(current_price, avg_price, position_count)
            if signal == "BUY":
                qty = get_position_size(current_price)
                place_order("BUY", qty)
                position_count += 1
                avg_price = current_price if avg_price is None else (avg_price + current_price) / 2
            elif signal == "SELL":
                place_order("SELL", get_position_size(current_price))
                avg_price = None
                position_count = 0` : `signal = check_${cfg.type === "trend" ? "trend" : "scalping"}_signal(df)
            if signal:
                qty = get_position_size(current_price)
                place_order(signal, qty)`}
            
            time.sleep(${cfg.type === "scalping" ? 5 : cfg.type === "grid" ? 10 : 60})
            
        except Exception as e:
            print(f"[ERROR] {e}")
            time.sleep(30)

BOT_TYPES_LABEL = "${BOT_TYPES[cfg.type].label}"

if __name__ == "__main__":
    main()
`
}
