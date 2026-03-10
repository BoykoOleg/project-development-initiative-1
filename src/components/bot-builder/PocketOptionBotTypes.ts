export type POStrategy = "rsi_reversal" | "ema_cross" | "martingale" | "candle_pattern" | "support_resistance"
export type POExpiry = "1" | "2" | "3" | "5" | "15"
export type POComboLogic = "AND" | "OR"

export interface POBotConfig {
  strategy: POStrategy
  // combo
  comboMode: boolean
  comboStrategies: POStrategy[]
  comboLogic: POComboLogic
  asset: string
  expiry: POExpiry
  betAmount: number
  betPercent: boolean
  martingaleEnabled: boolean
  martingaleMultiplier: number
  martingaleSteps: number
  takeProfitRub: number
  stopLossRub: number
  dailyLimit: number
  rsiPeriod: number
  rsiOverbought: number
  rsiOversold: number
  emaFast: number
  emaSlow: number
  useOTC: boolean
  autoRestart: boolean
  isDemo: boolean
  tgToken: string
  tgChatId: string
}

export interface StrategyMeta {
  label: string
  description: string
  color: string
  risk: string
  icon: string
  winrateEst: string
  signalsPerDay: string
  bestExpiry: string
  bestAssets: string
  pros: string[]
  cons: string[]
  combosWith: POStrategy[]
}

export const PO_STRATEGIES: Record<POStrategy, StrategyMeta> = {
  rsi_reversal: {
    label: "RSI Разворот",
    description: "Покупаем CALL при перепроданности, PUT при перекупленности",
    color: "bg-blue-500/20 border-blue-500/40 text-blue-400",
    risk: "Средний",
    icon: "📊",
    winrateEst: "52–60%",
    signalsPerDay: "10–25",
    bestExpiry: "1–5 мин",
    bestAssets: "EUR/USD OTC, GBP/USD OTC",
    pros: [
      "Универсален для любого рынка",
      "Работает на флете и слабом тренде",
      "Легко настраивается под стиль торговли",
    ],
    cons: [
      "Даёт ложные сигналы при сильном тренде",
      "Нужна правильная калибровка уровней",
    ],
    combosWith: ["ema_cross", "candle_pattern", "support_resistance"],
  },
  ema_cross: {
    label: "EMA Пересечение",
    description: "Сигналы по пересечению быстрой и медленной EMA",
    color: "bg-green-500/20 border-green-500/40 text-green-400",
    risk: "Низкий",
    icon: "📈",
    winrateEst: "55–65%",
    signalsPerDay: "5–15",
    bestExpiry: "3–5 мин",
    bestAssets: "USD/JPY OTC, EUR/USD OTC",
    pros: [
      "Лучшая стратегия для новичков",
      "Чёткие и понятные сигналы",
      "Хорошо работает при трендовом рынке",
    ],
    cons: [
      "Запаздывает при резких разворотах",
      "Мало сигналов в боковике",
    ],
    combosWith: ["rsi_reversal", "candle_pattern"],
  },
  martingale: {
    label: "Мартингейл",
    description: "Удвоение ставки после проигрыша до достижения профита",
    color: "bg-red-500/20 border-red-500/40 text-red-400",
    risk: "Высокий",
    icon: "🎰",
    winrateEst: "40–55%",
    signalsPerDay: "20–50",
    bestExpiry: "1–2 мин",
    bestAssets: "Любые OTC-пары",
    pros: [
      "Компенсирует убытки при первом выигрыше",
      "Не требует анализа рынка",
      "Прост в реализации",
    ],
    cons: [
      "Серия из 6–7 потерь уничтожает депозит",
      "Требует большого буфера капитала",
      "Не рекомендован новичкам",
    ],
    combosWith: ["rsi_reversal", "ema_cross"],
  },
  candle_pattern: {
    label: "Паттерны свечей",
    description: "Молот, поглощение, доджи — разворотные паттерны японских свечей",
    color: "bg-yellow-500/20 border-yellow-500/40 text-yellow-400",
    risk: "Средний",
    icon: "🕯️",
    winrateEst: "55–68%",
    signalsPerDay: "3–10",
    bestExpiry: "5–15 мин",
    bestAssets: "EUR/USD, GBP/USD, Gold OTC",
    pros: [
      "Высокая точность при правильном паттерне",
      "Хорошо работает на разворотах тренда",
      "Легко комбинируется с другими стратегиями",
    ],
    cons: [
      "Мало сигналов — нужно терпение",
      "Требует чистого ценового движения",
    ],
    combosWith: ["rsi_reversal", "support_resistance", "ema_cross"],
  },
  support_resistance: {
    label: "Поддержка / Сопротивление",
    description: "Вход от уровней поддержки и сопротивления с подтверждением",
    color: "bg-purple-500/20 border-purple-500/40 text-purple-400",
    risk: "Средний",
    icon: "🧱",
    winrateEst: "58–70%",
    signalsPerDay: "2–8",
    bestExpiry: "5–15 мин",
    bestAssets: "EUR/USD OTC, USD/JPY OTC, Gold OTC",
    pros: [
      "Самый высокий потенциальный winrate",
      "Работает на любом таймфрейме",
      "Уровни видны без индикаторов",
    ],
    cons: [
      "Очень мало сигналов — нужно ждать",
      "Требует минимум 30 свечей для расчёта",
    ],
    combosWith: ["candle_pattern", "rsi_reversal"],
  },
}

export const PO_ASSETS = [
  "EUR/USD (OTC)", "GBP/USD (OTC)", "USD/JPY (OTC)", "AUD/USD (OTC)",
  "EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD",
  "EUR/GBP", "EUR/JPY", "NZD/USD",
  "BTC/USD (OTC)", "ETH/USD (OTC)", "Gold (OTC)", "Oil (OTC)",
]

export const PO_EXPIRY_LABELS: Record<POExpiry, string> = {
  "1": "1 минута",
  "2": "2 минуты",
  "3": "3 минуты",
  "5": "5 минут",
  "15": "15 минут",
}

export const PO_DEFAULT_CONFIG: POBotConfig = {
  strategy: "rsi_reversal",
  comboMode: false,
  comboStrategies: ["rsi_reversal", "ema_cross"],
  comboLogic: "AND",
  asset: "EUR/USD (OTC)",
  expiry: "1",
  betAmount: 500,
  betPercent: false,
  martingaleEnabled: false,
  martingaleMultiplier: 2.1,
  martingaleSteps: 3,
  takeProfitRub: 3000,
  stopLossRub: 1500,
  dailyLimit: 20,
  rsiPeriod: 14,
  rsiOverbought: 70,
  rsiOversold: 30,
  emaFast: 9,
  emaSlow: 21,
  useOTC: true,
  autoRestart: false,
  isDemo: true,
  tgToken: "",
  tgChatId: "",
}

// Helper to avoid TS template literal conflicts with Python f-strings
const S = "$"

export function generatePOCode(cfg: POBotConfig): string {
  const strategyLabel = PO_STRATEGIES[cfg.strategy].label

  const strategyFunctions: Record<POStrategy, string> = {
    rsi_reversal: `
def calculate_rsi(prices, period=${cfg.rsiPeriod}):
    """RSI индикатор"""
    deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
    gains = [d if d > 0 else 0 for d in deltas]
    losses = [-d if d < 0 else 0 for d in deltas]
    avg_gain = sum(gains[-period:]) / period
    avg_loss = sum(losses[-period:]) / period
    if avg_loss == 0:
        return 100
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))

def get_signal(prices, candles=None):
    """Сигнал разворота по RSI"""
    rsi = calculate_rsi(prices)
    if rsi <= ${cfg.rsiOversold}:
        return "CALL"  # Перепроданность — ждём рост
    elif rsi >= ${cfg.rsiOverbought}:
        return "PUT"   # Перекупленность — ждём падение
    return None`,

    ema_cross: `
def calculate_ema(prices, period):
    """EMA индикатор"""
    k = 2 / (period + 1)
    ema = [prices[0]]
    for price in prices[1:]:
        ema.append(price * k + ema[-1] * (1 - k))
    return ema

def get_signal(prices, candles=None):
    """Сигнал по пересечению EMA ${cfg.emaFast} / EMA ${cfg.emaSlow}"""
    if len(prices) < ${cfg.emaSlow} + 2:
        return None
    ema_fast = calculate_ema(prices, ${cfg.emaFast})
    ema_slow = calculate_ema(prices, ${cfg.emaSlow})
    if ema_fast[-1] > ema_slow[-1] and ema_fast[-2] <= ema_slow[-2]:
        return "CALL"
    if ema_fast[-1] < ema_slow[-1] and ema_fast[-2] >= ema_slow[-2]:
        return "PUT"
    return None`,

    martingale: `
def get_signal(prices, candles=None):
    """Мартингейл: сигнал по последней свече"""
    if len(prices) < 2:
        return None
    if prices[-1] < prices[-2]:
        return "CALL"
    elif prices[-1] > prices[-2]:
        return "PUT"
    return None`,

    candle_pattern: `
def get_signal(prices, candles=None):
    """Паттерны японских свечей"""
    if candles is None or len(candles) < 3:
        return None
    o1, h1, l1, c1 = candles[-2]
    o2, h2, l2, c2 = candles[-1]
    body2 = abs(c2 - o2)
    lower_shadow = min(o2, c2) - l2
    upper_shadow = h2 - max(o2, c2)
    # Молот — разворот вверх
    if lower_shadow > body2 * 2 and upper_shadow < body2 * 0.5 and c1 < o1:
        return "CALL"
    # Падающая звезда — разворот вниз
    if upper_shadow > body2 * 2 and lower_shadow < body2 * 0.5 and c1 > o1:
        return "PUT"
    # Бычье поглощение
    if c1 < o1 and c2 > o2 and c2 > o1 and o2 < c1:
        return "CALL"
    # Медвежье поглощение
    if c1 > o1 and c2 < o2 and c2 < o1 and o2 > c1:
        return "PUT"
    return None`,

    support_resistance: `
def find_levels(prices, window=10):
    """Поиск уровней поддержки и сопротивления"""
    supports, resistances = [], []
    for i in range(window, len(prices) - window):
        if prices[i] == min(prices[i-window:i+window]):
            supports.append(prices[i])
        if prices[i] == max(prices[i-window:i+window]):
            resistances.append(prices[i])
    return supports[-3:], resistances[-3:]

def get_signal(prices, candles=None):
    """Вход от уровней поддержки/сопротивления"""
    if len(prices) < 30:
        return None
    supports, resistances = find_levels(prices)
    current = prices[-1]
    threshold = current * 0.001
    for sup in supports:
        if abs(current - sup) < threshold:
            return "CALL"
    for res in resistances:
        if abs(current - res) < threshold:
            return "PUT"
    return None`,
  }

  const martingaleBlock = cfg.martingaleEnabled
    ? `
# === МАРТИНГЕЙЛ ===
current_bet = BASE_BET
loss_streak = 0

def adjust_bet(won):
    global current_bet, loss_streak
    if won:
        current_bet = BASE_BET
        loss_streak = 0
    else:
        loss_streak += 1
        if loss_streak <= MARTINGALE_STEPS:
            current_bet = round(current_bet * MARTINGALE_MULT, 2)
        else:
            current_bet = BASE_BET
            loss_streak = 0
    return current_bet
`
    : `
current_bet = BASE_BET

def adjust_bet(won):
    return BASE_BET
`

  const assetMap: Record<string, string> = {
    "EUR/USD (OTC)": "EURUSD_otc",
    "GBP/USD (OTC)": "GBPUSD_otc",
    "USD/JPY (OTC)": "USDJPY_otc",
    "AUD/USD (OTC)": "AUDUSD_otc",
    "EUR/GBP (OTC)": "EURGBP_otc",
    "EUR/JPY (OTC)": "EURJPY_otc",
    "USD/CAD (OTC)": "USDCAD_otc",
    "NZD/USD (OTC)": "NZDUSD_otc",
    "BTC/USD (OTC)": "BTCUSD_otc",
    "ETH/USD (OTC)": "ETHUSD_otc",
    "Gold (OTC)":    "XAUUSD_otc",
    "Oil (OTC)":     "USOIL_otc",
    "EUR/USD":       "EURUSD",
    "GBP/USD":       "GBPUSD",
    "USD/JPY":       "USDJPY",
    "AUD/USD":       "AUDUSD",
    "USD/CAD":       "USDCAD",
    "EUR/GBP":       "EURGBP",
    "EUR/JPY":       "EURJPY",
    "NZD/USD":       "NZDUSD",
  }
  const assetSymbol = assetMap[cfg.asset] ?? cfg.asset.replace("/", "").replace(" (OTC)", "_otc").replace(/\s/g, "")

  return (
`#!/usr/bin/env python3
"""
Pocket Option Bot — ${strategyLabel}
Актив: ${assetSymbol} | Экспирация: ${cfg.expiry} мин
Ставка: ${cfg.betAmount}${cfg.betPercent ? "%" : "₽"} | Стратегия: ${strategyLabel}
Сгенерировано: TradeBase Bot Builder

Установка зависимостей (из папки PocketOptionAPI-main):
    pip install .
"""

import asyncio
import os
from datetime import datetime
from pocketoptionapi_async import AsyncPocketOptionClient, OrderDirection

# ===== НАСТРОЙКИ =====
ASSET        = os.environ.get("PO_ASSET", "${assetSymbol}")
EXPIRY_SEC   = ${String(parseInt(cfg.expiry) * 60)}             # Экспирация в секундах
BASE_BET     = ${cfg.betAmount}          # Базовая ставка ₽
BET_PERCENT  = ${cfg.betPercent ? "True" : "False"}        # True = % от баланса
IS_DEMO      = ${cfg.isDemo ? "True" : "False"}                   # True = демо, False = реальный счёт

TAKE_PROFIT  = ${cfg.takeProfitRub}      # Стоп профит (₽ за сессию)
STOP_LOSS    = ${cfg.stopLossRub}        # Стоп лосс (₽ за сессию)
DAILY_LIMIT  = ${cfg.dailyLimit}         # Макс. сделок в день
AUTO_RESTART = ${cfg.autoRestart ? "True" : "False"}       # Перезапуск после TP/SL

MARTINGALE       = ${cfg.martingaleEnabled ? "True" : "False"}
MARTINGALE_MULT  = ${cfg.martingaleMultiplier}
MARTINGALE_STEPS = ${cfg.martingaleSteps}

try:
    from dotenv import load_dotenv; load_dotenv()
except ImportError:
    pass

SESSION_ID = os.environ.get("PO_SESSION_ID", "")
if not SESSION_ID:
    _env = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(_env):
        with open(_env, encoding="utf-8") as _f:
            for _line in _f:
                if _line.startswith("PO_SESSION_ID="):
                    SESSION_ID = _line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
if not SESSION_ID:
    print("[ERROR] Не задан PO_SESSION_ID.")
    print("Создайте файл .env рядом с bot.py:")
    print('  PO_SESSION_ID=42["auth",{...}]')
    exit(1)

# ===== TELEGRAM =====
TG_TOKEN   = "${cfg.tgToken}"
TG_CHAT_ID = "${cfg.tgChatId}"
TG_ENABLED = bool(TG_TOKEN and TG_CHAT_ID)

def tg(text):
    if not TG_ENABLED:
        return
    try:
        import urllib.request, urllib.parse
        url = f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage"
        data = urllib.parse.urlencode({"chat_id": TG_CHAT_ID, "text": text, "parse_mode": "HTML"}).encode()
        urllib.request.urlopen(url, data, timeout=5)
    except Exception as e:
        print(f"[TG] Ошибка: {e}")

# ===== СОСТОЯНИЕ =====
total_profit = 0.0
trades_today = 0
trade_log    = []
${martingaleBlock}
${strategyFunctions[cfg.strategy]}

async def get_candles_data(client):
    """Получение свечей"""
    try:
        raw = await client.get_candles(asset=ASSET, timeframe=EXPIRY_SEC)
        if not raw:
            print(f"[ERROR] Актив {ASSET} не найден или нет данных")
            try:
                assets = await client.get_available_assets()
                if assets:
                    names = [str(a) for a in list(assets)[:20]]
                    print(f"[HINT] Доступные активы: {', '.join(names)}")
            except Exception:
                print(f"[HINT] Попробуй: #EURUSD_otc или EURUSD или GBPUSD_otc")
            return [], []
        candles = [(c.open, c.high, c.low, c.close) for c in raw]
        prices  = [c.close for c in raw]
        return candles, prices
    except Exception as e:
        print(f"[ERROR] Свечи: {e}")
        return [], []

async def place_trade(client, direction, amount):
    """Открытие опциона"""
    try:
        dir_val = OrderDirection.CALL if direction == "CALL" else OrderDirection.PUT
        order = await client.place_order(asset=ASSET, amount=amount, direction=dir_val, duration=EXPIRY_SEC)
        print(f"[TRADE] {direction} | {amount}₽ | {EXPIRY_SEC//60} мин | ID: {order.order_id}")
        return order.order_id
    except Exception as e:
        print(f"[ERROR] Сделка: {e}")
        return None

async def check_result(client, order_id, balance_before):
    """Ожидание результата через сравнение баланса"""
    print(f"[WAIT] Ожидаем результат {EXPIRY_SEC//60} мин...")
    await asyncio.sleep(EXPIRY_SEC + 5)
    try:
        for attempt in range(15):
            balance_after, _ = await get_balance(client)
            if balance_after == 0.0:
                await asyncio.sleep(5)
                continue
            profit = round(balance_after - balance_before, 2)
            if profit == 0.0 and attempt < 10:
                await asyncio.sleep(5)
                continue
            won = profit > 0
            status = "ВЫИГРЫШ ✅" if won else "ПРОИГРЫШ ❌"
            print(f"[RESULT] {status} | Профит: {profit}")
            return won, profit
        print("[WARN] Не удалось определить результат сделки")
        return False, 0.0
    except Exception as e:
        print(f"[ERROR] Результат: {e}")
        return False, 0.0

async def get_balance(client):
    """Текущий баланс"""
    try:
        b = await client.get_balance()

        if b is None:
            return 0.0, "RUB"
        amount = 0.0
        if hasattr(b, "balance") and b.balance is not None:
            amount = float(b.balance)
        elif hasattr(b, "amount") and b.amount is not None:
            amount = float(b.amount)
        elif isinstance(b, (int, float)):
            amount = float(b)
        elif isinstance(b, dict):
            amount = float(b.get("balance") or b.get("amount") or 0)
        else:
            try:
                amount = float(b)
            except:
                pass
        currency = getattr(b, "currency", None) or (b.get("currency") if isinstance(b, dict) else None) or "RUB"
        return amount, currency
    except Exception as e:
        print(f"[ERROR] get_balance: {e}")
        return 0.0, "RUB"

def print_stats():
    wins    = sum(1 for t in trade_log if t["won"])
    total   = len(trade_log)
    winrate = (wins / total * 100) if total else 0
    print(f"\\n[STATS] {wins}/{total} сделок | Winrate: {winrate:.1f}% | Сессия: {round(total_profit, 2)}₽\\n")

async def main():
    global total_profit, trades_today, current_bet

    print("Подключение к Pocket Option...")
    client = AsyncPocketOptionClient(SESSION_ID, is_demo=IS_DEMO, enable_logging=False)
    await client.connect()
    for i in range(15):
        await asyncio.sleep(2)
        try:
            balance, currency = await get_balance(client)
            if balance > 0:
                break
        except Exception:
            pass
        print(f"[WAIT] Ожидание соединения... ({i+1}/15)")
    else:
        print("[ERROR] Не удалось подключиться за 30 сек. Проверь SESSION_ID.")
        return



    account_type = "🟡 ДЕМО-СЧЁТ" if IS_DEMO else "🔴 РЕАЛЬНЫЙ СЧЁТ"

    print("=" * 50)
    print("  Pocket Option Bot — ${strategyLabel}")
    print(f"  Счёт: {account_type}")
    print(f"  Актив: {ASSET} | Экспирация: {EXPIRY_SEC//60} мин")
    print(f"  Баланс: {round(balance, 2)} | TP: {TAKE_PROFIT} | SL: {STOP_LOSS}")
    print("=" * 50 + "\\n")
    tg(f"🤖 <b>Бот запущен</b>\\nСчёт: {account_type}\\nСтратегия: ${strategyLabel}\\nАктив: {ASSET} | Экспирация: {EXPIRY_SEC//60} мин\\nБаланс: {balance:.2f} | TP: {TAKE_PROFIT} | SL: {STOP_LOSS}")

    while True:
        if total_profit >= TAKE_PROFIT:
            msg = f"[TP] Take Profit достигнут: +{round(total_profit, 2)}₽"
            print(msg)
            tg(f"✅ <b>Take Profit достигнут!</b>\\n+{total_profit:.2f}₽ за сессию")
            if AUTO_RESTART:
                total_profit = 0
                trades_today = 0
                await asyncio.sleep(300)
                continue
            break

        if total_profit <= -STOP_LOSS:
            msg = f"[SL] Stop Loss достигнут: {round(total_profit, 2)}₽"
            print(msg)
            tg(f"🛑 <b>Stop Loss достигнут!</b>\\n{total_profit:.2f}₽ за сессию")
            if AUTO_RESTART:
                total_profit = 0
                trades_today = 0
                await asyncio.sleep(300)
                continue
            break

        if trades_today >= DAILY_LIMIT:
            print(f"[LIMIT] Дневной лимит {DAILY_LIMIT} сделок исчерпан")
            tg(f"⚠️ <b>Дневной лимит исчерпан</b>\\n{DAILY_LIMIT} сделок | Итог: {total_profit:.2f}₽")
            break

        candles, prices = await get_candles_data(client)
        if not prices:
            await asyncio.sleep(30)
            continue

        signal = get_signal(prices, candles)

        if signal:
            if BET_PERCENT:
                balance = await get_balance(client)
                bet = round(balance * (BASE_BET / 100), 2)
            else:
                bet = current_bet

            emoji = "📈" if signal == "CALL" else "📉"
            tg(f"{emoji} <b>Сделка открыта</b>\\n{signal} | {bet}₽ | {ASSET} | {EXPIRY_SEC//60} мин")
            balance_before, _ = await get_balance(client)
            order_id = await place_trade(client, signal, bet)
            if order_id:
                won, profit = await check_result(client, order_id, balance_before)
                total_profit += profit
                trades_today += 1
                current_bet   = adjust_bet(won)
                trade_log.append({
                    "time": datetime.now().strftime("%H:%M:%S"),
                    "direction": signal,
                    "amount": bet,
                    "won": won,
                    "profit": profit,
                })
                wins  = sum(1 for t in trade_log if t["won"])
                wr    = wins / len(trade_log) * 100
                res_emoji = "✅" if won else "❌"
                tg(f"{res_emoji} <b>{'Выигрыш' if won else 'Проигрыш'}</b>\\nПрофит: {profit:+.2f}₽\\nСессия: {total_profit:+.2f}₽ | WR: {wr:.0f}% ({wins}/{len(trade_log)})")
                print_stats()
        else:
            ts = datetime.now().strftime("%H:%M:%S")
            print(f"[{ts}] Нет сигнала, ожидание 30 сек...")
            await asyncio.sleep(30)

    await client.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
`
  )
}

// ===== COMBO CODE GENERATOR =====
export function generatePOComboCode(cfg: POBotConfig): string {
  const selected = cfg.comboStrategies.filter((s) => s !== "martingale")
  const labels = selected.map((s) => PO_STRATEGIES[s].label).join(" + ")
  const logicWord = cfg.comboLogic === "AND" ? "все подтверждают" : "хотя бы одна подтверждает"

  const martingaleBlock = cfg.martingaleEnabled
    ? `
current_bet = BASE_BET
loss_streak = 0

def adjust_bet(won):
    global current_bet, loss_streak
    if won:
        current_bet = BASE_BET
        loss_streak = 0
    else:
        loss_streak += 1
        if loss_streak <= ${cfg.martingaleSteps}:
            current_bet = round(current_bet * ${cfg.martingaleMultiplier}, 2)
        else:
            current_bet = BASE_BET
            loss_streak = 0
    return current_bet
`
    : `
current_bet = BASE_BET

def adjust_bet(won):
    return BASE_BET
`

  const fnBlocks: string[] = []
  const callLines: string[] = []

  if (selected.includes("rsi_reversal")) {
    fnBlocks.push(`
def calculate_rsi(prices, period=${cfg.rsiPeriod}):
    deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
    gains  = [d if d > 0 else 0 for d in deltas]
    losses = [-d if d < 0 else 0 for d in deltas]
    avg_gain = sum(gains[-period:]) / period
    avg_loss = sum(losses[-period:]) / period
    if avg_loss == 0:
        return 100
    return 100 - (100 / (1 + avg_gain / avg_loss))

def signal_rsi(prices, candles):
    rsi = calculate_rsi(prices)
    if rsi <= ${cfg.rsiOversold}: return "CALL"
    if rsi >= ${cfg.rsiOverbought}: return "PUT"
    return None`)
    callLines.push("signal_rsi(prices, candles)")
  }

  if (selected.includes("ema_cross")) {
    fnBlocks.push(`
def calculate_ema(prices, period):
    k = 2 / (period + 1)
    ema = [prices[0]]
    for p in prices[1:]:
        ema.append(p * k + ema[-1] * (1 - k))
    return ema

def signal_ema(prices, candles):
    if len(prices) < ${cfg.emaSlow} + 2:
        return None
    fast = calculate_ema(prices, ${cfg.emaFast})
    slow = calculate_ema(prices, ${cfg.emaSlow})
    if fast[-1] > slow[-1] and fast[-2] <= slow[-2]: return "CALL"
    if fast[-1] < slow[-1] and fast[-2] >= slow[-2]: return "PUT"
    return None`)
    callLines.push("signal_ema(prices, candles)")
  }

  if (selected.includes("candle_pattern")) {
    fnBlocks.push(`
def signal_candle_pattern(prices, candles):
    if not candles or len(candles) < 3:
        return None
    o1, h1, l1, c1 = candles[-2]
    o2, h2, l2, c2 = candles[-1]
    body2 = abs(c2 - o2)
    low_sh = min(o2, c2) - l2
    up_sh  = h2 - max(o2, c2)
    if low_sh > body2 * 2 and up_sh < body2 * 0.5 and c1 < o1: return "CALL"
    if up_sh > body2 * 2 and low_sh < body2 * 0.5 and c1 > o1: return "PUT"
    if c1 < o1 and c2 > o2 and c2 > o1 and o2 < c1: return "CALL"
    if c1 > o1 and c2 < o2 and c2 < o1 and o2 > c1: return "PUT"
    return None`)
    callLines.push("signal_candle_pattern(prices, candles)")
  }

  if (selected.includes("support_resistance")) {
    fnBlocks.push(`
def find_levels(prices, window=10):
    sup, res = [], []
    for i in range(window, len(prices) - window):
        if prices[i] == min(prices[i-window:i+window]): sup.append(prices[i])
        if prices[i] == max(prices[i-window:i+window]): res.append(prices[i])
    return sup[-3:], res[-3:]

def signal_support_resistance(prices, candles):
    if len(prices) < 30:
        return None
    sup, res = find_levels(prices)
    cur = prices[-1]
    thr = cur * 0.001
    for s in sup:
        if abs(cur - s) < thr: return "CALL"
    for r in res:
        if abs(cur - r) < thr: return "PUT"
    return None`)
    callLines.push("signal_support_resistance(prices, candles)")
  }

  const combineLogic = cfg.comboLogic === "AND"
    ? `
def get_combined_signal(prices, candles):
    """Комбо AND — все стратегии должны совпасть"""
    signals = [${callLines.join(", ")}]
    signals = [s for s in signals if s is not None]
    if len(signals) < ${selected.length}:
        return None  # Не все дали сигнал
    calls = signals.count("CALL")
    puts  = signals.count("PUT")
    if calls == len(signals): return "CALL"
    if puts  == len(signals): return "PUT"
    return None  # Сигналы противоречат друг другу`
    : `
def get_combined_signal(prices, candles):
    """Комбо OR — достаточно хотя бы одного сигнала"""
    signals = [${callLines.join(", ")}]
    signals = [s for s in signals if s is not None]
    if not signals:
        return None
    calls = signals.count("CALL")
    puts  = signals.count("PUT")
    if calls > puts: return "CALL"
    if puts > calls: return "PUT"
    return None  # Равенство голосов — пропускаем`

  const comboAssetMap: Record<string, string> = {
    "EUR/USD (OTC)": "EURUSD_otc",
    "GBP/USD (OTC)": "GBPUSD_otc",
    "USD/JPY (OTC)": "USDJPY_otc",
    "AUD/USD (OTC)": "AUDUSD_otc",
    "EUR/GBP (OTC)": "EURGBP_otc",
    "EUR/JPY (OTC)": "EURJPY_otc",
    "USD/CAD (OTC)": "USDCAD_otc",
    "NZD/USD (OTC)": "NZDUSD_otc",
    "BTC/USD (OTC)": "BTCUSD_otc",
    "ETH/USD (OTC)": "ETHUSD_otc",
    "Gold (OTC)":    "XAUUSD_otc",
    "Oil (OTC)":     "USOIL_otc",
    "EUR/USD":       "EURUSD",
    "GBP/USD":       "GBPUSD",
    "USD/JPY":       "USDJPY",
    "AUD/USD":       "AUDUSD",
    "USD/CAD":       "USDCAD",
    "EUR/GBP":       "EURGBP",
    "EUR/JPY":       "EURJPY",
    "NZD/USD":       "NZDUSD",
  }
  const comboAssetSymbol = comboAssetMap[cfg.asset] ?? cfg.asset.replace("/", "").replace(" (OTC)", "_otc").replace(/\s/g, "")

  return (
`#!/usr/bin/env python3
"""
Pocket Option КОМБО-Бот
Стратегии: ${labels}
Логика: ${cfg.comboLogic} (${logicWord})
Актив: ${comboAssetSymbol} | Экспирация: ${cfg.expiry} мин | Ставка: ${cfg.betAmount}₽
Сгенерировано: TradeBase Bot Builder

Установка зависимостей (из папки PocketOptionAPI-main):
    pip install .
"""

import asyncio
import os
from datetime import datetime
from pocketoptionapi_async import AsyncPocketOptionClient, OrderDirection

# ===== НАСТРОЙКИ =====
ASSET        = "${comboAssetSymbol}"
EXPIRY_SEC   = ${String(parseInt(cfg.expiry) * 60)}
BASE_BET     = ${cfg.betAmount}
BET_PERCENT  = ${cfg.betPercent ? "True" : "False"}
IS_DEMO      = True
TAKE_PROFIT  = ${cfg.takeProfitRub}
STOP_LOSS    = ${cfg.stopLossRub}
DAILY_LIMIT  = ${cfg.dailyLimit}
AUTO_RESTART = ${cfg.autoRestart ? "True" : "False"}
MARTINGALE   = ${cfg.martingaleEnabled ? "True" : "False"}

try:
    from dotenv import load_dotenv; load_dotenv()
except ImportError:
    pass

SESSION_ID = os.environ.get("PO_SESSION_ID", "")
if not SESSION_ID:
    _env = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(_env):
        with open(_env, encoding="utf-8") as _f:
            for _line in _f:
                if _line.startswith("PO_SESSION_ID="):
                    SESSION_ID = _line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
if not SESSION_ID:
    print("[ERROR] Не задан PO_SESSION_ID.")
    print("Создайте файл .env рядом с bot.py:")
    print('  PO_SESSION_ID=42["auth",{...}]')
    exit(1)

# ===== TELEGRAM =====
TG_TOKEN   = "${cfg.tgToken}"
TG_CHAT_ID = "${cfg.tgChatId}"
TG_ENABLED = bool(TG_TOKEN and TG_CHAT_ID)

def tg(text):
    if not TG_ENABLED:
        return
    try:
        import urllib.request, urllib.parse
        url = f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage"
        data = urllib.parse.urlencode({"chat_id": TG_CHAT_ID, "text": text, "parse_mode": "HTML"}).encode()
        urllib.request.urlopen(url, data, timeout=5)
    except Exception as e:
        print(f"[TG] Ошибка: {e}")

# ===== СОСТОЯНИЕ =====
total_profit = 0.0
trades_today = 0
trade_log    = []
${martingaleBlock}
# ===== СТРАТЕГИИ =====
${fnBlocks.join("\n")}

# ===== КОМБО-ЛОГИКА (${cfg.comboLogic}) =====
${combineLogic}

async def get_candles_data(client):
    try:
        raw = await client.get_candles(asset=ASSET, timeframe=EXPIRY_SEC)
        candles = [(c.open, c.high, c.low, c.close) for c in raw]
        prices  = [c.close for c in raw]
        return candles, prices
    except Exception as e:
        print(f"[ERROR] get_candles: {e}")
        return [], []

async def place_trade(client, direction, amount):
    try:
        dir_val = OrderDirection.CALL if direction == "CALL" else OrderDirection.PUT
        order = await client.place_order(asset=ASSET, amount=amount, direction=dir_val, duration=EXPIRY_SEC)
        print(f"[TRADE] {direction} | {amount}₽ | {EXPIRY_SEC//60} мин | ID: {order.order_id}")
        return order.order_id
    except Exception as e:
        print(f"[ERROR] place_trade: {e}")
        return None

async def check_result(client, order_id, balance_before):
    print(f"[WAIT] Ожидаем результат {EXPIRY_SEC//60} мин...")
    await asyncio.sleep(EXPIRY_SEC + 5)
    try:
        for attempt in range(10):
            b = await client.get_balance()
            if b is None:
                await asyncio.sleep(3)
                continue
            balance_after = float(b) if not hasattr(b, '__iter__') else float(list(b)[0])
            profit = round(balance_after - balance_before, 2)
            if profit == 0.0 and attempt < 3:
                await asyncio.sleep(3)
                continue
            won = profit > 0
            print(f"[RESULT] {'ВЫИГРЫШ ✅' if won else 'ПРОИГРЫШ ❌'} | Профит: {profit}")
            return won, profit
        print("[WARN] Не удалось определить результат сделки")
        return False, 0.0
    except Exception as e:
        print(f"[ERROR] check_result: {e}")
        return False, 0.0

async def get_balance(client):
    try:
        b = await client.get_balance()
        if b is None:
            return 0.0
        if hasattr(b, "balance") and b.balance is not None:
            return float(b.balance)
        if hasattr(b, "amount") and b.amount is not None:
            return float(b.amount)
        try:
            return float(b)
        except:
            return 0.0
    except:
        return 0.0

def print_stats():
    wins  = sum(1 for t in trade_log if t["won"])
    total = len(trade_log)
    wr    = (wins / total * 100) if total else 0
    print(f"[STATS] {wins}/{total} | WR: {wr:.1f}% | Сессия: {total_profit:.2f}₽")

async def main():
    global total_profit, trades_today, current_bet

    client = AsyncPocketOptionClient(SESSION_ID, is_demo=IS_DEMO, enable_logging=False)
    await client.connect()
    for i in range(15):
        await asyncio.sleep(2)
        try:
            balance, currency = await get_balance(client)
            if balance > 0:
                break
        except Exception:
            pass
        print(f"[WAIT] Ожидание соединения... ({i+1}/15)")
    else:
        print("[ERROR] Не удалось подключиться за 30 сек. Проверь SESSION_ID.")
        return

    account_type = "🟡 ДЕМО-СЧЁТ" if IS_DEMO else "🔴 РЕАЛЬНЫЙ СЧЁТ"

    print("=" * 55)
    print("  КОМБО-Бот: ${labels}")
    print(f"  Счёт: {account_type}")
    print("  Логика: ${cfg.comboLogic} — ${logicWord}")
    print(f"  Актив: {ASSET} | Экспирация: {EXPIRY_SEC//60} мин | Баланс: {balance:.2f}")
    print("  TP: " + str(TAKE_PROFIT) + " | SL: " + str(STOP_LOSS) + " | Лимит: " + str(DAILY_LIMIT))
    print("=" * 55 + "\\n")
    tg(f"🤖 <b>КОМБО-Бот запущен</b>\\nСчёт: {account_type}\\n${labels} (${cfg.comboLogic})\\nАктив: {ASSET} | {EXPIRY_SEC//60} мин\\nБаланс: {balance:.2f} | TP: {TAKE_PROFIT} | SL: {STOP_LOSS}")

    while True:
        if total_profit >= TAKE_PROFIT:
            print(f"[TP] +{total_profit:.2f}₽")
            tg(f"✅ <b>Take Profit достигнут!</b>\\n+{total_profit:.2f}₽ за сессию")
            if AUTO_RESTART:
                total_profit = 0; trades_today = 0; await asyncio.sleep(300); continue
            break
        if total_profit <= -STOP_LOSS:
            print(f"[SL] {total_profit:.2f}₽")
            tg(f"🛑 <b>Stop Loss достигнут!</b>\\n{total_profit:.2f}₽ за сессию")
            if AUTO_RESTART:
                total_profit = 0; trades_today = 0; await asyncio.sleep(300); continue
            break
        if trades_today >= DAILY_LIMIT:
            print(f"[LIMIT] Лимит {DAILY_LIMIT} сделок исчерпан")
            tg(f"⚠️ <b>Дневной лимит исчерпан</b>\\n{DAILY_LIMIT} сделок | Итог: {total_profit:.2f}₽")
            break

        candles, prices = await get_candles_data(client)
        if not prices:
            await asyncio.sleep(30)
            continue

        signal = get_combined_signal(prices, candles)

        if signal:
            if BET_PERCENT:
                balance = await get_balance(client)
                bet = round(balance * (BASE_BET / 100), 2)
            else:
                bet = current_bet
            emoji = "📈" if signal == "CALL" else "📉"
            tg(f"{emoji} <b>Комбо-сделка</b>\\n{signal} | {bet}₽ | {ASSET}")
            balance_before, _ = await get_balance(client)
            order_id = await place_trade(client, signal, bet)
            if order_id:
                won, profit = await check_result(client, order_id, balance_before)
                total_profit += profit
                trades_today += 1
                current_bet   = adjust_bet(won)
                trade_log.append({"won": won, "profit": profit})
                wins = sum(1 for t in trade_log if t["won"])
                wr   = wins / len(trade_log) * 100
                res_emoji = "✅" if won else "❌"
                tg(f"{res_emoji} <b>{'Выигрыш' if won else 'Проигрыш'}</b>\\n{profit:+.2f}₽ | Сессия: {total_profit:+.2f}₽ | WR: {wr:.0f}%")
                print_stats()
        else:
            ts = datetime.now().strftime("%H:%M:%S")
            print(f"[{ts}] Нет подтверждённого сигнала, ожидание...")
            await asyncio.sleep(30)

    await client.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
`
  )
}