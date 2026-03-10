const signalEngineCode = `import pandas as pd
import numpy as np

class SignalEngine:
    def __init__(self, ema_fast=20, ema_slow=50, rsi_period=14):
        self.ema_fast = ema_fast
        self.ema_slow = ema_slow
        self.rsi_period = rsi_period

    def calculate_ema(self, prices: list, period: int) -> float:
        """Считает EMA по последним n свечам."""
        series = pd.Series(prices)
        ema = series.ewm(span=period, adjust=False).mean()
        return round(ema.iloc[-1], 2)

    def calculate_rsi(self, prices: list) -> float:
        """Считает RSI(14) по последним свечам."""
        series = pd.Series(prices)
        delta = series.diff()
        gain = delta.where(delta > 0, 0).rolling(self.rsi_period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(self.rsi_period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return round(rsi.iloc[-1], 2)

    def get_signal(self, close_prices: list) -> dict:
        """
        Принимает список цен закрытия (минимум 60 свечей M5).
        Возвращает: {'signal': 'CALL'|'PUT'|'WAIT', 'ema_fast': x,
                     'ema_slow': x, 'rsi': x, 'confluence': int}
        """
        if len(close_prices) < self.ema_slow + 10:
            return {"signal": "WAIT", "reason": "Недостаточно данных"}

        ema_fast = self.calculate_ema(close_prices, self.ema_fast)
        ema_slow = self.calculate_ema(close_prices, self.ema_slow)
        rsi = self.calculate_rsi(close_prices)
        current_price = close_prices[-1]

        confluence = 0
        direction = None

        # Фактор 1: тренд по EMA
        if ema_fast > ema_slow:
            confluence += 1
            direction = "CALL"
        elif ema_fast < ema_slow:
            confluence += 1
            direction = "PUT"

        # Фактор 2: RSI фильтр
        if direction == "CALL" and rsi < 35:
            confluence += 1
        elif direction == "PUT" and rsi > 65:
            confluence += 1

        # Фактор 3: расстояние от EMA (цена близко к линии)
        ema_distance = abs(current_price - ema_fast) / current_price
        if ema_distance < 0.003:  # 0.3% — цена у EMA
            confluence += 1

        signal = direction if confluence >= 3 else "WAIT"

        return {
            "signal": signal,
            "ema_fast": ema_fast,
            "ema_slow": ema_slow,
            "rsi": rsi,
            "confluence": confluence,
            "current_price": current_price,
        }`

const signalEngineUsage = `engine = SignalEngine()

# close_prices — список из 60+ цен закрытия M5 свечей
close_prices = [95800, 95850, 95900, ..., 96420]

result = engine.get_signal(close_prices)
# {'signal': 'PUT', 'ema_fast': 96420.0, 'ema_slow': 96180.0,
#  'rsi': 68.3, 'confluence': 3, 'current_price': 96420}`

const dataFeedCode = `import json
import asyncio
import websockets
from collections import deque
from signal_engine import SignalEngine

class DataFeed:
    def __init__(self, symbol="btcusdt", interval="5m", max_candles=100):
        self.symbol = symbol
        self.interval = interval
        self.close_prices = deque(maxlen=max_candles)
        self.engine = SignalEngine()
        self.url = (
            "wss://stream.binance.com:9443/ws/"
            + symbol + "@kline_" + interval
        )

    async def on_message(self, data: dict):
        """Обработчик каждого обновления свечи."""
        kline = data["k"]
        is_closed = kline["x"]   # True = свеча закрылась
        close_price = float(kline["c"])

        if is_closed:
            self.close_prices.append(close_price)
            print("Новая свеча M5: " + str(close_price))

            # Генерируем сигнал на закрытой свече
            if len(self.close_prices) >= 60:
                result = self.engine.get_signal(list(self.close_prices))
                signal = result["signal"]

                if signal != "WAIT":
                    print("СИГНАЛ: " + signal + " | RSI: " + str(result['rsi'])
                          + " | Конфлюэнс: " + str(result['confluence']) + "/3")
                    # Здесь вызываем Risk Manager → Executor
                    await self.on_signal(result)

    async def on_signal(self, result: dict):
        """Переопределите этот метод для подключения исполнения."""
        pass  # Risk Manager и Executor подключаются здесь

    async def run(self):
        """Запускает поток данных."""
        print("Подключение к Binance WS: " + self.symbol + " " + self.interval)
        async with websockets.connect(self.url) as ws:
            async for raw in ws:
                data = json.loads(raw)
                await self.on_message(data)

if __name__ == "__main__":
    feed = DataFeed()
    asyncio.run(feed.run())`

const binanceWsFormat = `{
  "e": "kline",          // тип события
  "E": 1735900000000,    // время события (ms)
  "s": "BTCUSDT",        // символ
  "k": {
    "t": 1735900000000,  // время открытия свечи
    "T": 1735900299999,  // время закрытия свечи
    "o": "96100.00",     // цена открытия
    "h": "96450.00",     // максимум
    "l": "96050.00",     // минимум
    "c": "96380.00",     // цена ЗАКРЫТИЯ ← используем
    "v": "124.853",      // объём BTC
    "x": true            // true = свеча закрылась (ВАЖНО!)
  }
}`

export const SectionSignalEngine = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      Ниже — готовый рабочий код Signal Engine на Python. Он считает EMA 20/50, RSI и определяет сигнал.
      Это основа бота — самая важная часть.
    </p>

    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">signal_engine.py</div>
      <pre className="text-xs font-space-mono text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre">{signalEngineCode}</pre>
    </div>

    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">Пример использования</div>
      <pre className="text-xs font-space-mono text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre">{signalEngineUsage}</pre>
    </div>

    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
      <div className="text-yellow-400 font-orbitron text-xs font-bold mb-2">Важно: зачем нужен pandas</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Библиотека <span className="text-white">pandas</span> — стандарт для финансовых вычислений.
        EMA через <span className="text-white">ewm()</span> точнее ручного расчёта, потому что учитывает все исторические данные с убывающим весом.
        Установка: <span className="text-green-400">pip install pandas numpy</span>
      </p>
    </div>
  </div>
)

export const SectionDataFeed = () => (
  <div className="space-y-3">
    <p className="text-gray-300 leading-relaxed">
      Для расчёта EMA и RSI боту нужны реальные свечные данные. Binance предоставляет бесплатный WebSocket
      с M5-свечами BTC/USDT в режиме реального времени.
    </p>

    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">data_feed.py — получение свечей с Binance</div>
      <pre className="text-xs font-space-mono text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre">{dataFeedCode}</pre>
    </div>

    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">Формат данных от Binance WebSocket</div>
      <pre className="text-xs font-space-mono text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre">{binanceWsFormat}</pre>
    </div>

    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
      <div className="text-green-400 font-orbitron text-xs font-bold mb-2">Почему только закрытые свечи</div>
      <p className="text-zinc-300 text-xs font-space-mono leading-relaxed">
        Поле <span className="text-white">x: true</span> означает, что свеча закрылась и цена зафиксирована.
        EMA и RSI нужно считать только на закрытых свечах — иначе значения будут меняться каждую секунду
        и генерировать ложные сигналы. Это классическая ошибка новичков в алго-трейдинге.
      </p>
    </div>
  </div>
)