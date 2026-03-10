export const SectionBotMistakes = () => (
  <div className="space-y-4">
    <p className="text-gray-300 leading-relaxed">
      Боты тоже совершают ошибки — но по другим причинам. Это не эмоции, а ошибки в коде,
      настройках или логике стратегии. Вот самые распространённые.
    </p>

    <div className="space-y-3">
      {[
        {
          title: "Оптимизация под прошлое (overfitting)",
          problem: "Настроили EMA и RSI так, чтобы бэктест показал 80% win rate — но на реальном рынке 40%.",
          fix: "Тестировать на данных, которые НЕ использовались при настройке. Минимум 3 месяца out-of-sample.",
          icon: "📈",
          color: "text-red-400 border-red-500/30",
        },
        {
          title: "Бэктест без учёта комиссий и спреда",
          problem: "Стратегия даёт +18% в бэктесте, но после вычета комиссий Pocket Option (18%) — в минусе.",
          fix: "В backtest.py учитывать payout = 0.82 (а не 1.0) и реалистичный win rate.",
          icon: "💸",
          color: "text-orange-400 border-orange-500/30",
        },
        {
          title: "Бот не обрабатывает потерю соединения",
          problem: "WS-соединение упало в момент открытой сделки — бот не знает, чем она завершилась.",
          fix: "Добавить обработку reconnect и проверку результата сделки после переподключения.",
          icon: "🔌",
          color: "text-yellow-400 border-yellow-500/30",
        },
        {
          title: "Нет защиты от дублирования ордеров",
          problem: "При переподключении бот отправляет ордер дважды — удваивается ставка.",
          fix: "Хранить order_id, проверять уникальность перед отправкой нового ордера.",
          icon: "🔁",
          color: "text-purple-400 border-purple-500/30",
        },
        {
          title: "Торговля в флэте без адаптации",
          problem: "EMA+RSI — трендовая стратегия. На боковом рынке генерирует ложные сигналы.",
          fix: "Добавить фильтр флэта: если EMA20 и EMA50 ближе 0.1% — сигнал WAIT.",
          icon: "↔️",
          color: "text-blue-400 border-blue-500/30",
        },
        {
          title: "Запуск без алертов о критических событиях",
          problem: "Бот упал ночью, торгует в убыток 6 часов — узнали утром.",
          fix: "Telegram-бот для алертов: при ошибке, при дневном стопе, при win rate < 50%.",
          icon: "🔔",
          color: "text-cyan-400 border-cyan-500/30",
        },
      ].map(({ title, problem, fix, icon, color }) => (
        <div key={title} className={`bg-zinc-900 border ${color.split(" ")[1]} rounded-xl p-4`}>
          <div className="flex gap-3 items-start">
            <span className="text-2xl shrink-0">{icon}</span>
            <div className="flex-1 space-y-2">
              <div className={`font-orbitron text-xs font-bold ${color.split(" ")[0]}`}>{title}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <div className="text-red-400 text-[10px] font-space-mono font-bold mb-0.5">Проблема:</div>
                  <div className="text-zinc-400 text-[10px] font-space-mono leading-relaxed">{problem}</div>
                </div>
                <div>
                  <div className="text-green-400 text-[10px] font-space-mono font-bold mb-0.5">Решение:</div>
                  <div className="text-zinc-300 text-[10px] font-space-mono leading-relaxed">{fix}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>

    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-2">Добавляем Telegram-алерты в бота (10 строк)</div>
      <pre className="text-green-400 text-[10px] font-space-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">{`import requests

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
TELEGRAM_CHAT  = os.getenv("TELEGRAM_CHAT_ID")

def send_alert(text):
    if not TELEGRAM_TOKEN:
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    requests.post(url, json={"chat_id": TELEGRAM_CHAT, "text": text})

# Использование в боте:
# send_alert(f"✅ WIN +{pnl:.2f}$ | Win Rate: {wr:.1f}%")
# send_alert(f"❌ Дневной стоп. Итог: {daily_pnl:+.2f}$")
# send_alert(f"🔴 Ошибка подключения: {str(e)}")`}</pre>
    </div>

    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
      <p className="text-blue-300 text-xs font-space-mono leading-relaxed">
        <span className="font-bold">Как создать Telegram-бота:</span> напишите @BotFather → /newbot → получите TOKEN.
        Затем напишите своему боту любое сообщение и получите CHAT_ID через
        <code className="bg-zinc-800 px-1 mx-1 rounded">api.telegram.org/bot&#123;TOKEN&#125;/getUpdates</code>.
      </p>
    </div>
  </div>
)
