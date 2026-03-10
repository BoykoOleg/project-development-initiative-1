const riskManagerCode = `from datetime import datetime, time

class RiskManager:
    def __init__(self, deposit: float, max_risk_pct=0.02, daily_loss_pct=0.06):
        self.deposit = deposit
        self.max_risk_pct = max_risk_pct      # 2% на сделку
        self.daily_loss_pct = daily_loss_pct  # 6% дневной стоп
        self.daily_pnl = 0.0
        self.trades_today = 0

    def get_stake(self) -> float:
        """Возвращает размер ставки по правилу 2%."""
        return round(self.deposit * self.max_risk_pct, 2)

    def is_trading_allowed(self) -> tuple[bool, str]:
        """Проверяет, можно ли открывать новую сделку."""

        # 1. Дневной стоп-лосс
        daily_loss = self.daily_pnl / self.deposit
        if daily_loss <= -self.daily_loss_pct:
            return False, "Дневной стоп: " + str(round(daily_loss*100, 1)) + "%"

        # 2. Дневной тейк-профит
        if daily_loss >= 0.10:
            return False, "Дневной тейк: +" + str(round(daily_loss*100, 1)) + "%"

        # 3. Запрещённые часы (высокая волатильность)
        now = datetime.utcnow().time()
        bad_hours = [
            (time(12, 25), time(12, 35)),  # Публикация NFP (пятница)
            (time(8, 25),  time(8, 35)),   # Открытие Европы
        ]
        for start, end in bad_hours:
            if start <= now <= end:
                return False, "Запрещённое время: высокая волатильность"

        return True, "OK"

    def record_result(self, won: bool, stake: float, payout_pct=0.82):
        """Записывает результат сделки."""
        if won:
            self.daily_pnl += stake * payout_pct
        else:
            self.daily_pnl -= stake
        self.trades_today += 1
        sign = "+" if self.daily_pnl >= 0 else ""
        print("PnL за день: " + sign + str(round(self.daily_pnl, 2)) + " | Сделок: " + str(self.trades_today))`

const riskChecks = [
  { check: "Сигнал валиден?", condition: "confluence == 3", pass: "CALL или PUT", fail: "WAIT — ждём", color: "text-blue-400" },
  { check: "Торговля разрешена?", condition: "is_trading_allowed()", pass: "Продолжаем", fail: "Стоп — пропускаем", color: "text-yellow-400" },
  { check: "Депозит не нулевой?", condition: "deposit > 0", pass: "Считаем ставку", fail: "Остановка бота", color: "text-red-400" },
  { check: "Размер ставки", condition: "deposit × 2%", pass: "Отправляем ордер", fail: "", color: "text-green-400" },
]

const poTokenCode = `# Pocket Option использует авторизацию через session token.
# Как получить токен:
# 1. Войди на pocketoption.com в Chrome/Firefox
# 2. Открой DevTools → Application → Cookies
# 3. Найди cookie с именем: ph_session или _ga_* 
# 4. Либо: DevTools → Network → WS соединения → 
#    найди headers Authorization или Bearer token

SESSION_TOKEN = "твой_токен_из_браузера"  # Вставь сюда
DEMO_MODE = True  # True = демо, False = реальный счёт`

const poClientCode = `import asyncio
import json
import websockets
import time

class PocketOptionClient:
    """WebSocket-клиент для Pocket Option Traderoom API."""

    WS_URL = "wss://api.pocketoption.com/socket.io/?EIO=4&transport=websocket"

    def __init__(self, session_token: str, demo: bool = True):
        self.token = session_token
        self.demo = demo
        self.ws = None
        self.balance = 0.0
        self.pending_orders = {}

    async def connect(self):
        """Устанавливает WebSocket-соединение с Pocket Option."""
        headers = {
            "Cookie": "session=" + self.token,
            "Origin": "https://pocketoption.com",
            "User-Agent": "Mozilla/5.0 (compatible; TradingBot/1.0)",
        }
        self.ws = await websockets.connect(
            self.WS_URL,
            extra_headers=headers,
            ping_interval=20,
            ping_timeout=30,
        )
        print("[PO] WebSocket подключён")

        # Шаг 1: ответить на handshake Socket.IO
        await self.ws.recv()       # "0{...}" — приветствие сервера
        await self.ws.send("40")   # "40" — подтверждение подключения
        response = await self.ws.recv()
        print("[PO] Handshake: " + str(response[:80]))

        # Шаг 2: авторизация с токеном
        auth_payload = json.dumps({
            "session": self.token,
            "isDemo": 1 if self.demo else 0,
            "uid": 0,
        })
        await self.ws.send('42["auth",' + auth_payload + ']')
        auth_response = await self.ws.recv()
        print("[PO] Auth ответ: " + str(auth_response[:120]))

    async def open_order(
        self,
        asset: str,
        direction: str,
        amount: float,
        expiration: int = 60,
    ) -> dict:
        """
        Открывает бинарный опцион.
        
        asset       — 'BTCUSDT_otc' (OTC) или 'BTCUSDT' (реальный рынок)
        direction   — 'call' или 'put'
        amount      — ставка в USD (например 20.0)
        expiration  — время экспирации в секундах (60, 120, 300...)
        """
        order_id = str(int(time.time() * 1000))  # уникальный ID
        
        order_payload = json.dumps({
            "asset": asset,
            "requestId": order_id,
            "optionType": 100,          # 100 = турбо-опцион
            "direction": direction,
            "amount": amount,
            "time": expiration,
            "isDemo": 1 if self.demo else 0,
        })
        
        await self.ws.send('42["openOrder",' + order_payload + ']')
        print("[PO] Ордер отправлен: " + direction.upper() + " " + asset + " $" + str(amount))
        
        # Ждём подтверждение
        response = await asyncio.wait_for(self.ws.recv(), timeout=10)
        data = json.loads(response[2:])  # убираем "42" префикс
        
        return {
            "order_id": order_id,
            "status": data[0],
            "response": data[1] if len(data) > 1 else {},
        }

    async def get_balance(self) -> float:
        """Запрашивает текущий баланс аккаунта."""
        await self.ws.send('42["getBalance",{}]')
        response = await asyncio.wait_for(self.ws.recv(), timeout=5)
        data = json.loads(response[2:])
        balance = data[1].get("balance", 0)
        self.balance = float(balance)
        return self.balance

    async def close(self):
        """Закрывает WebSocket-соединение."""
        if self.ws:
            await self.ws.close()
            print("[PO] Соединение закрыто")`

const mainBotCode = `import asyncio
import websockets
import json
from signal_engine import SignalEngine
from risk_manager import RiskManager
from pocket_option_client import PocketOptionClient
from data_feed import BinanceDataFeed  # из предыдущего шага

SESSION_TOKEN = "твой_токен"
ASSET = "BTCUSDT_otc"  # BTC OTC на Pocket Option
EXPIRY = 300           # 5 минут = 300 секунд

async def run_bot():
    # Инициализация компонентов
    client = PocketOptionClient(SESSION_TOKEN, demo=True)
    signal_engine = SignalEngine()
    risk = RiskManager(deposit=1000.0)
    feed = BinanceDataFeed()

    await client.connect()
    balance = await client.get_balance()
    print("[BOT] Баланс: $" + str(round(balance, 2)) + " (Демо)")

    close_prices = []

    async def on_candle_close(prices: list):
        """Вызывается при закрытии каждой M5-свечи."""
        nonlocal close_prices
        close_prices = prices

        # 1. Получаем сигнал
        result = signal_engine.get_signal(close_prices)
        signal = result["signal"]
        print("[SIGNAL] " + signal + " | RSI=" + str(result['rsi']) + " | Conf=" + str(result['confluence']) + "/3")

        if signal == "WAIT":
            return

        # 2. Проверяем риск-менеджмент
        allowed, reason = risk.is_trading_allowed()
        if not allowed:
            print("[RISK] Торговля запрещена: " + reason)
            return

        # 3. Определяем ставку
        stake = risk.get_stake()
        direction = signal.lower()  # "call" или "put"

        # 4. Отправляем ордер
        order = await client.open_order(
            asset=ASSET,
            direction=direction,
            amount=stake,
            expiration=EXPIRY,
        )
        print("[ORDER] ID=" + str(order['order_id']) + " Status=" + str(order['status']))

    # Запускаем поток данных с Binance
    await feed.start(callback=on_candle_close)

if __name__ == "__main__":
    asyncio.run(run_bot())`

const requirementsCode = `websockets>=11.0
pandas>=2.0
numpy>=1.24
requests>=2.28
python-dotenv>=1.0  # для хранения SESSION_TOKEN в .env файле`

const dotenvCode = `# .env файл (НЕ загружай в GitHub!)
SESSION_TOKEN=твой_секретный_токен_здесь

# В коде читаем так:
from dotenv import load_dotenv
import os
load_dotenv()
SESSION_TOKEN = os.getenv("SESSION_TOKEN")`

export const SectionRiskManager = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      Перед каждой сделкой Risk Manager проверяет правила безопасности.
      Только после его одобрения Executor отправляет ордер.
    </p>

    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">risk_manager.py</div>
      <pre className="text-xs font-space-mono text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre">{riskManagerCode}</pre>
    </div>

    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">Схема проверки перед входом</div>
      <div className="space-y-2">
        {riskChecks.map((item, i) => (
          <div key={i} className="flex gap-3 items-start bg-zinc-900 border border-zinc-800 rounded-lg p-2">
            <div className={`font-orbitron text-xs font-bold ${item.color} w-5 shrink-0`}>{i + 1}.</div>
            <div className="flex-1">
              <span className={`font-orbitron text-xs font-bold ${item.color}`}>{item.check} </span>
              <span className="text-zinc-500 text-xs font-space-mono">[{item.condition}]</span>
            </div>
            <div className="text-right">
              {item.pass && <div className="text-green-400 text-xs font-space-mono">✓ {item.pass}</div>}
              {item.fail && <div className="text-red-400 text-xs font-space-mono">✗ {item.fail}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
      <div className="text-purple-400 font-orbitron text-xs font-bold mb-2">Из жизни: Circuit Breakers в хедж-фондах</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Профессиональные трейдинговые системы имеют «автоматические выключатели» (circuit breakers) —
        именно то, что делает наш Risk Manager. Citadel и AQR автоматически останавливают торговлю
        при превышении дневной просадки. Это не слабость — это архитектурное требование к любой серьёзной системе.
      </p>
    </div>
  </div>
)

export const SectionPocketOptionAPI = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      Pocket Option имеет WebSocket API для автоматической торговли. Вот как подключить Python-бота
      к реальному аккаунту и отправлять ордеры программно.
    </p>

    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
      <div className="text-yellow-400 font-orbitron text-xs font-bold mb-2">Важно: демо-аккаунт сначала</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Всегда тестируй бота на демо-аккаунте минимум 2 недели, прежде чем переключиться на реальные деньги.
        Даже идеальный бэктест не гарантирует реального результата — слипаж, задержки сети, изменения в API.
      </p>
    </div>

    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">Шаг 1: получаем session token из браузера</div>
      <pre className="text-xs font-space-mono text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre">{poTokenCode}</pre>
    </div>

    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">pocket_option_client.py</div>
      <pre className="text-xs font-space-mono text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre">{poClientCode}</pre>
    </div>

    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">main.py — главный цикл бота</div>
      <pre className="text-xs font-space-mono text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre">{mainBotCode}</pre>
    </div>

    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">requirements.txt для установки зависимостей</div>
      <pre className="text-xs font-space-mono text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre">{requirementsCode}</pre>
      <div className="mt-3 text-zinc-500 text-xs font-space-mono">
        Установка: <span className="text-zinc-300">pip install -r requirements.txt</span>
      </div>
    </div>

    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
      <div className="text-red-400 font-orbitron text-xs font-bold mb-2">Безопасность: храни токен в .env</div>
      <pre className="text-xs font-space-mono text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre">{dotenvCode}</pre>
    </div>

    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
      <div className="text-blue-400 font-orbitron text-xs font-bold mb-2">Из жизни: Renaissance Technologies и API-трейдинг</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Медальон-фонд Джима Саймонса — самый прибыльный хедж-фонд в истории (+66% годовых до комиссий) —
        работает исключительно через автоматические API-подключения к биржам. Ни один трейдер не нажимает
        кнопки вручную. Цель — устранить человеческую эмоциональность и задержки. Тот же принцип
        работает и для розничного трейдера: автоматизация исполнения убирает страх и жадность из уравнения.
      </p>
    </div>
  </div>
)