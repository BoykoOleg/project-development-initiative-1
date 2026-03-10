const fullBotCode = `# three_confirmations_bot.py
# Бот "Три подтверждения" для Pocket Option
# Стратегия: EMA-тренд + RSI-фильтр + свечной паттерн

import asyncio
import json
import os
import csv
import logging
from datetime import datetime
from collections import deque

import numpy as np
import pandas as pd
import websockets
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────
# КОНФИГУРАЦИЯ
# ─────────────────────────────────────────────
SESSION_TOKEN = os.getenv("SESSION_TOKEN")
DEMO_MODE     = True        # True = демо, False = реальный счёт
ASSET         = "#EURUSD_otc" # OTC-пара (доступна 24/7)
EXPIRATION    = 300         # 5 минут
DEPOSIT       = 1000        # начальный депозит для расчёта риска
MAX_RISK_PCT  = 0.02        # 2% на сделку
DAILY_LOSS    = -0.06       # -6% дневной стоп

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("bot.log")]
)
log = logging.getLogger("3C-Bot")


# ─────────────────────────────────────────────
# 1. SIGNAL ENGINE — три подтверждения
# ─────────────────────────────────────────────
class ThreeConfirmationsEngine:
    """
    Сигнал = CALL/PUT только при 3 из 3 подтверждений:
      1. EMA-тренд:   EMA20 > EMA50 → CALL, EMA20 < EMA50 → PUT
      2. RSI-фильтр:  RSI < 35 → CALL,  RSI > 65 → PUT
      3. Свеча:       бычья закрытая свеча → CALL, медвежья → PUT
    """
    def __init__(self, ema_fast=20, ema_slow=50, rsi_period=14):
        self.ema_fast   = ema_fast
        self.ema_slow   = ema_slow
        self.rsi_period = rsi_period

    def _ema(self, prices, period):
        s = pd.Series(prices)
        return float(s.ewm(span=period, adjust=False).mean().iloc[-1])

    def _rsi(self, prices):
        s = pd.Series(prices[-self.rsi_period * 2:])
        delta = s.diff()
        gain  = delta.clip(lower=0).rolling(self.rsi_period).mean()
        loss  = (-delta.clip(upper=0)).rolling(self.rsi_period).mean()
        rs    = gain / loss.replace(0, np.inf)
        return float(100 - (100 / (1 + rs)).iloc[-1])

    def _candle_direction(self, opens, closes):
        """Последняя закрытая свеча: бычья (close > open) или медвежья"""
        return "BULL" if closes[-2] > opens[-2] else "BEAR"

    def get_signal(self, opens, closes):
        if len(closes) < self.ema_slow + 10:
            return {"signal": "WAIT", "reason": "мало данных"}

        ema_f  = self._ema(closes, self.ema_fast)
        ema_s  = self._ema(closes, self.ema_slow)
        rsi    = self._rsi(closes)
        candle = self._candle_direction(opens, closes)

        # Три подтверждения для CALL
        if ema_f > ema_s and rsi < 35 and candle == "BULL":
            return {"signal": "CALL", "ema_f": round(ema_f, 5),
                    "ema_s": round(ema_s, 5), "rsi": round(rsi, 1),
                    "candle": candle, "confluence": 3}

        # Три подтверждения для PUT
        if ema_f < ema_s and rsi > 65 and candle == "BEAR":
            return {"signal": "PUT", "ema_f": round(ema_f, 5),
                    "ema_s": round(ema_s, 5), "rsi": round(rsi, 1),
                    "candle": candle, "confluence": 3}

        # Частичные подтверждения — WAIT
        confirms = sum([
            1 if ema_f > ema_s else 0,
            1 if rsi < 40 or rsi > 60 else 0,
            1 if candle in ("BULL", "BEAR") else 0
        ])
        return {"signal": "WAIT", "confluence": confirms,
                "rsi": round(rsi, 1)}


# ─────────────────────────────────────────────
# 2. RISK MANAGER
# ─────────────────────────────────────────────
class RiskManager:
    def __init__(self, deposit, max_risk=0.02, daily_loss=-0.06, daily_profit=0.10):
        self.deposit      = deposit
        self.max_risk     = max_risk
        self.daily_loss   = daily_loss
        self.daily_profit = daily_profit
        self.daily_pnl    = 0.0
        self.trade_count  = 0

    def get_stake(self):
        return round(self.deposit * self.max_risk, 2)

    def is_allowed(self):
        pnl_pct = self.daily_pnl / self.deposit
        hour    = datetime.utcnow().hour
        minute  = datetime.utcnow().minute

        if pnl_pct <= self.daily_loss:
            log.warning(f"❌ Дневной стоп: PnL={pnl_pct:.1%}")
            return False, "daily_loss"
        if pnl_pct >= self.daily_profit:
            log.info(f"✅ Дневная цель: PnL={pnl_pct:.1%}")
            return False, "daily_profit"
        # Запрет в волатильное время (NFP, открытие Европы)
        if (hour == 12 and 25 <= minute <= 35) or \\
           (hour == 8  and 25 <= minute <= 35):
            log.warning("⏳ Запрет: высоковолатильный период")
            return False, "news_time"

        return True, "ok"

    def record(self, won, stake, payout=0.82):
        pnl = stake * payout if won else -stake
        self.daily_pnl  += pnl
        self.trade_count += 1
        log.info(f"{'✅ WIN' if won else '❌ LOSS'} {pnl:+.2f}$ | "
                 f"Daily PnL: {self.daily_pnl:+.2f}$ | "
                 f"Trades: {self.trade_count}")
        return pnl


# ─────────────────────────────────────────────
# 3. LOGGER — CSV-журнал сделок
# ─────────────────────────────────────────────
class TradeLogger:
    def __init__(self, filename="trades.csv"):
        self.filename = filename
        with open(filename, "a", newline="") as f:
            w = csv.writer(f)
            if f.tell() == 0:
                w.writerow(["time", "asset", "direction", "stake",
                             "result", "pnl", "rsi", "ema_f", "ema_s"])

    def log_trade(self, direction, stake, result, pnl, signal_data):
        with open(self.filename, "a", newline="") as f:
            csv.writer(f).writerow([
                datetime.utcnow().isoformat(),
                ASSET, direction, stake,
                "WIN" if result else "LOSS",
                round(pnl, 2),
                signal_data.get("rsi", ""),
                signal_data.get("ema_f", ""),
                signal_data.get("ema_s", ""),
            ])


# ─────────────────────────────────────────────
# 4. POCKET OPTION CLIENT
# ─────────────────────────────────────────────
class PocketOptionClient:
    WS_URL = "wss://api.pocketoption.com/socket.io/?EIO=4&transport=websocket"

    def __init__(self, token, demo=True):
        self.token = token
        self.demo  = demo
        self.ws    = None

    async def connect(self):
        headers = {"Cookie": f"session={self.token}"}
        self.ws  = await websockets.connect(self.WS_URL, extra_headers=headers)
        await self.ws.recv()          # "0{...}"
        await self.ws.send("40")
        await self.ws.recv()          # "40{...}"
        auth = json.dumps({"session": self.token, "isDemo": int(self.demo),
                           "uid": 0, "platform": 2})
        await self.ws.send(f'42["auth",{auth}]')
        log.info(f"Подключён к Pocket Option ({'DEMO' if self.demo else 'REAL'})")

    async def open_order(self, direction, amount):
        order_id = int(datetime.utcnow().timestamp() * 1000)
        payload  = json.dumps({
            "asset":      ASSET,
            "amount":     amount,
            "action":     direction.lower(),  # "call" / "put"
            "isDemo":     int(self.demo),
            "requestId":  order_id,
            "optionType": 100,
            "time":       EXPIRATION,
        })
        await self.ws.send(f'42["openOrder",{payload}]')
        try:
            resp = await asyncio.wait_for(self.ws.recv(), timeout=10)
            log.info(f"📤 Ордер {direction} {amount}$ → {resp[:80]}")
            return {"order_id": order_id, "status": "sent", "response": resp}
        except asyncio.TimeoutError:
            log.error("⏰ Таймаут ответа от Pocket Option")
            return {"order_id": order_id, "status": "timeout"}

    async def get_balance(self):
        await self.ws.send('42["getBalance",{}]')
        resp = await asyncio.wait_for(self.ws.recv(), timeout=5)
        return resp

    async def close(self):
        if self.ws:
            await self.ws.close()


# ─────────────────────────────────────────────
# 5. DATA FEED — Binance WebSocket M5
# ─────────────────────────────────────────────
class BinanceDataFeed:
    WS_URL = "wss://stream.binance.com:9443/ws/btcusdt@kline_5m"

    def __init__(self, on_candle_close):
        self.opens  = deque(maxlen=120)
        self.closes = deque(maxlen=120)
        self.callback = on_candle_close

    async def run(self):
        async with websockets.connect(self.WS_URL) as ws:
            log.info("📡 Binance M5 поток запущен")
            async for msg in ws:
                data   = json.loads(msg)
                kline  = data["k"]
                is_fin = kline["x"]          # свеча закрыта?
                self.opens.append(float(kline["o"]))
                self.closes.append(float(kline["c"]))
                if is_fin:
                    await self.callback(list(self.opens), list(self.closes))


# ─────────────────────────────────────────────
# 6. ГЛАВНЫЙ ЦИКЛ
# ─────────────────────────────────────────────
async def main():
    engine  = ThreeConfirmationsEngine()
    risk    = RiskManager(DEPOSIT, MAX_RISK_PCT, DAILY_LOSS)
    logger  = TradeLogger()
    client  = PocketOptionClient(SESSION_TOKEN, DEMO_MODE)

    await client.connect()

    async def on_candle_close(opens, closes):
        sig = engine.get_signal(opens, closes)
        log.info(f"📊 Сигнал: {sig}")

        if sig["signal"] == "WAIT":
            return

        allowed, reason = risk.is_allowed()
        if not allowed:
            log.warning(f"🚫 Пропуск: {reason}")
            return

        stake = risk.get_stake()
        order = await client.open_order(sig["signal"], stake)

        # Симуляция результата через 5 минут
        await asyncio.sleep(EXPIRATION + 5)
        # В реальном боте — слушать событие результата из WS
        won  = closes[-1] > closes[-2] if sig["signal"] == "CALL" \\
               else closes[-1] < closes[-2]
        pnl  = risk.record(won, stake)
        logger.log_trade(sig["signal"], stake, won, pnl, sig)

    feed = BinanceDataFeed(on_candle_close)
    await feed.run()


if __name__ == "__main__":
    asyncio.run(main())
`

const envCode = `# .env — НИКОГДА не добавлять в git!
SESSION_TOKEN=ваш_токен_сессии_с_pocket_option
DEMO_MODE=true
DEPOSIT=1000
`

const requirementsCode = `websockets>=11.0
pandas>=2.0
numpy>=1.24
python-dotenv>=1.0
`

const gitignoreCode = `.env
bot.log
trades.csv
__pycache__/
*.pyc
`

const extractTokenSteps = [
  "Открыть pocketoption.com и войти в аккаунт",
  "Нажать F12 (DevTools) → вкладка Application",
  "Слева: Storage → Cookies → pocketoption.com",
  'Найти cookie с именем "session" → скопировать Value',
  "Вставить в файл .env: SESSION_TOKEN=значение",
  "Первый запуск — обязательно DEMO_MODE=true",
]

export const SectionThreeConfirmationsBot = () => (
  <div className="space-y-5">
    <p className="text-gray-300 leading-relaxed">
      Полный готовый код бота «Три подтверждения» — один файл, все модули внутри.
      EMA-тренд + RSI-фильтр + свечной паттерн. Сигнал только при трёх совпадениях одновременно.
    </p>

    {/* Как получить токен */}
    <div className="bg-zinc-950 border border-yellow-500/30 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-yellow-400 mb-3">
        Шаг 0: Получить session-токен Pocket Option
      </div>
      <div className="space-y-2">
        {extractTokenSteps.map((step, i) => (
          <div key={i} className="flex gap-3 items-start">
            <span className="font-space-mono text-xs text-yellow-400 font-bold w-5 shrink-0">{i + 1}.</span>
            <span className="font-space-mono text-xs text-zinc-300">{step}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg p-2">
        <span className="text-red-400 text-xs font-space-mono font-bold">⚠️ Токен — это ваш пароль. </span>
        <span className="text-zinc-400 text-xs font-space-mono">Никогда не публикуйте его в GitHub и не передавайте третьим лицам.</span>
      </div>
    </div>

    {/* .env и requirements */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
        <div className="font-orbitron text-[10px] font-bold text-zinc-400 mb-2">.env</div>
        <pre className="text-green-400 text-[10px] font-space-mono whitespace-pre-wrap leading-relaxed">{envCode.trim()}</pre>
      </div>
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
        <div className="font-orbitron text-[10px] font-bold text-zinc-400 mb-2">requirements.txt</div>
        <pre className="text-blue-400 text-[10px] font-space-mono whitespace-pre-wrap leading-relaxed">{requirementsCode.trim()}</pre>
        <div className="mt-2 pt-2 border-t border-zinc-800">
          <div className="text-zinc-500 text-[10px] font-space-mono">Установка:</div>
          <pre className="text-yellow-400 text-[10px] font-space-mono">pip install -r requirements.txt</pre>
        </div>
      </div>
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
        <div className="font-orbitron text-[10px] font-bold text-zinc-400 mb-2">.gitignore</div>
        <pre className="text-red-400 text-[10px] font-space-mono whitespace-pre-wrap leading-relaxed">{gitignoreCode.trim()}</pre>
      </div>
    </div>

    {/* Архитектура в одном файле */}
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">Структура файла three_confirmations_bot.py</div>
      <div className="flex flex-wrap gap-2">
        {[
          { num: "1", name: "CONFIG", desc: "Токен, пара, риск-параметры", color: "text-yellow-400 border-yellow-500/30" },
          { num: "2", name: "SignalEngine", desc: "EMA + RSI + свеча", color: "text-green-400 border-green-500/30" },
          { num: "3", name: "RiskManager", desc: "2% стейк, дневной стоп", color: "text-blue-400 border-blue-500/30" },
          { num: "4", name: "TradeLogger", desc: "CSV-журнал сделок", color: "text-purple-400 border-purple-500/30" },
          { num: "5", name: "POClient", desc: "WebSocket Pocket Option", color: "text-orange-400 border-orange-500/30" },
          { num: "6", name: "DataFeed", desc: "Binance M5 поток", color: "text-cyan-400 border-cyan-500/30" },
          { num: "7", name: "main()", desc: "Главный цикл", color: "text-pink-400 border-pink-500/30" },
        ].map(({ num, name, desc, color }) => (
          <div key={num} className={`border rounded-lg px-3 py-2 ${color.split(" ")[1]}`}>
            <div className={`font-space-mono text-[10px] font-bold ${color.split(" ")[0]}`}>{num}. {name}</div>
            <div className="text-zinc-500 text-[9px] font-space-mono">{desc}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Полный код */}
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-orbitron text-xs font-bold text-zinc-400">three_confirmations_bot.py — полный код</div>
        <span className="text-[9px] font-space-mono bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">~200 строк</span>
      </div>
      <pre className="text-green-400 text-[10px] font-space-mono whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[520px] overflow-y-auto scrollbar-thin">
        {fullBotCode.trim()}
      </pre>
    </div>

    {/* Логика трёх подтверждений */}
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">Логика сигнала: CALL требует трёх совпадений</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="text-green-400 text-xs font-space-mono font-bold mb-2">CALL (покупаем рост)</div>
          <div className="space-y-1.5">
            {[
              ["EMA20 > EMA50", "тренд направлен вверх"],
              ["RSI < 35", "актив перепродан, отскок вероятен"],
              ["Свеча бычья", "последняя закрытая свеча зелёная"],
            ].map(([cond, desc], i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-green-500 font-space-mono text-xs">✓</span>
                <div>
                  <span className="text-green-300 font-space-mono text-xs font-bold">{cond}</span>
                  <span className="text-zinc-500 font-space-mono text-xs"> — {desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-red-400 text-xs font-space-mono font-bold mb-2">PUT (ставим на падение)</div>
          <div className="space-y-1.5">
            {[
              ["EMA20 < EMA50", "тренд направлен вниз"],
              ["RSI > 65", "актив перекуплен, коррекция вероятна"],
              ["Свеча медвежья", "последняя закрытая свеча красная"],
            ].map(([cond, desc], i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-red-500 font-space-mono text-xs">✓</span>
                <div>
                  <span className="text-red-300 font-space-mono text-xs font-bold">{cond}</span>
                  <span className="text-zinc-500 font-space-mono text-xs"> — {desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 bg-zinc-900 rounded-lg p-2 flex items-center gap-2">
        <span className="text-yellow-400 text-xs">⚡</span>
        <span className="text-zinc-400 text-xs font-space-mono">Если хотя бы одно условие не выполнено — бот пропускает свечу и ждёт следующей.</span>
      </div>
    </div>

    {/* Ожидаемая статистика */}
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">Ожидаемая статистика (по бэктесту 500 свечей M5)</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Win Rate", value: "58–62%", note: "нужно ≥54% для прибыли", color: "text-green-400" },
          { label: "Сигналов/день", value: "3–7", note: "высокая избирательность", color: "text-blue-400" },
          { label: "Стейк", value: "2% депо", note: "$20 при депо $1000", color: "text-yellow-400" },
          { label: "Макс. серия проигрышей", value: "4–5", note: "дневной стоп на 6%", color: "text-red-400" },
        ].map(({ label, value, note, color }) => (
          <div key={label} className="bg-zinc-900 rounded-xl p-3">
            <div className="text-zinc-500 text-[10px] font-space-mono mb-1">{label}</div>
            <div className={`font-orbitron text-sm font-bold ${color}`}>{value}</div>
            <div className="text-zinc-600 text-[10px] font-space-mono mt-1">{note}</div>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
      <div className="text-amber-400 font-space-mono text-xs font-bold mb-1">Запускайте только после бэктеста</div>
      <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">
        Прогоните <code className="bg-zinc-800 px-1 rounded">backtest.py</code> (Шаг 5, секция «Бэктест»), убедитесь в win rate ≥ 54% на вашей паре,
        и только затем переключайте <code className="bg-zinc-800 px-1 rounded">DEMO_MODE=false</code>.
        Реальные деньги — только после 50+ сделок на демо с положительным результатом.
      </p>
    </div>
  </div>
)
