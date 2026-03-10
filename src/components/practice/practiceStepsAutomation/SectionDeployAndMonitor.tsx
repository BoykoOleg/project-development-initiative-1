const screenScript = `#!/bin/bash
# start_bot.sh — запуск бота в фоне на VPS

# Установка зависимостей (первый раз)
pip install -r requirements.txt

# Запуск в screen-сессии (не прерывается при закрытии SSH)
screen -dmS trading-bot python three_confirmations_bot.py

echo "✅ Бот запущен. Подключиться: screen -r trading-bot"
echo "   Отключиться от screen: Ctrl+A, затем D"
echo "   Остановить бот: screen -X -S trading-bot quit"
`

const supervisorConf = `; /etc/supervisor/conf.d/trading-bot.conf
; Автоперезапуск бота при падении

[program:trading-bot]
command=python /home/ubuntu/bot/three_confirmations_bot.py
directory=/home/ubuntu/bot
autostart=true
autorestart=true
startretries=5
stderr_logfile=/var/log/trading-bot.err.log
stdout_logfile=/var/log/trading-bot.out.log
environment=HOME="/home/ubuntu"
`

const monitorScript = `# monitor.py — читает trades.csv и выводит статистику
import pandas as pd

df = pd.read_csv("trades.csv")

total  = len(df)
wins   = (df["result"] == "WIN").sum()
losses = (df["result"] == "LOSS").sum()
pnl    = df["pnl"].sum()
wr     = wins / total * 100 if total > 0 else 0

print("─"*40)
print("  Всего сделок : " + str(total))
print("  Победы       : " + str(wins))
print("  Поражения    : " + str(losses))
print("  Win Rate     : " + str(round(wr, 1)) + "%")
sign = "+" if pnl >= 0 else ""
print("  Итого P&L    : " + sign + str(round(pnl, 2)) + "$")
print("─"*40)

# Последние 5 сделок
print("\\nПоследние 5 сделок:")
print(df.tail(5)[["time","direction","stake","result","pnl"]].to_string(index=False))
`

const vpsProviders = [
  { name: "DigitalOcean", plan: "Droplet $6/мес", os: "Ubuntu 22.04", note: "Простейший старт, оплата картой" },
  { name: "Hetzner", plan: "CX11 €4.5/мес", os: "Ubuntu 22.04", note: "Лучший выбор по цене/качеству" },
  { name: "Timeweb Cloud", plan: "от ₽200/мес", os: "Ubuntu 22.04", note: "Оплата рублями, техподдержка на русском" },
  { name: "Google Colab", plan: "Бесплатно", os: "Linux", note: "Только для тестов! Сессия прерывается через 12 ч" },
]

const setupCommands = [
  { step: "1. Подключение к VPS", cmd: "ssh ubuntu@ВАШ_IP_АДРЕС" },
  { step: "2. Установка Python", cmd: "sudo apt update && sudo apt install -y python3-pip" },
  { step: "3. Копирование файлов", cmd: "scp three_confirmations_bot.py .env requirements.txt ubuntu@IP:~/bot/" },
  { step: "4. Установка зависимостей", cmd: "cd ~/bot && pip3 install -r requirements.txt" },
  { step: "5. Запуск в фоне", cmd: "bash start_bot.sh" },
  { step: "6. Просмотр логов", cmd: "tail -f bot.log" },
  { step: "7. Статистика сделок", cmd: "python3 monitor.py" },
]

export const SectionDeployAndMonitor = () => (
  <div className="space-y-5">
    <p className="text-gray-300 leading-relaxed">
      Запустить бота на ноутбуке — не вариант: он работает, пока открыт ноутбук. Правильный способ —
      арендовать VPS-сервер за $5–6/месяц и запустить там. Бот будет торговать 24/7 без вашего участия.
    </p>

    {/* VPS-провайдеры */}
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">Где арендовать VPS-сервер</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {vpsProviders.map(({ name, plan, os, note }) => (
          <div key={name} className="bg-zinc-900 rounded-xl p-3 flex gap-3 items-start">
            <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
            <div>
              <div className="font-orbitron text-xs font-bold text-white">{name}</div>
              <div className="text-yellow-400 text-[10px] font-space-mono">{plan} · {os}</div>
              <div className="text-zinc-500 text-[10px] font-space-mono mt-0.5">{note}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
        <span className="text-blue-400 text-xs font-space-mono">Минимальные характеристики VPS: 1 vCPU, 1 GB RAM, Ubuntu 22.04.</span>
      </div>
    </div>

    {/* Пошаговые команды */}
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">Пошаговая установка</div>
      <div className="space-y-2">
        {setupCommands.map(({ step, cmd }) => (
          <div key={step} className="bg-zinc-900 rounded-xl p-3">
            <div className="text-zinc-500 text-[10px] font-space-mono mb-1">{step}</div>
            <pre className="text-green-400 text-xs font-space-mono whitespace-pre-wrap">{cmd}</pre>
          </div>
        ))}
      </div>
    </div>

    {/* start_bot.sh */}
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-2">start_bot.sh — запуск в фоновой сессии</div>
      <pre className="text-green-400 text-[10px] font-space-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
        {screenScript.trim()}
      </pre>
    </div>

    {/* Supervisor — автоперезапуск */}
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-1">Supervisor — автоперезапуск при падении</div>
      <p className="text-zinc-500 text-xs font-space-mono mb-2">Если бот упал (пропал интернет, ошибка) — supervisor перезапустит его автоматически</p>
      <pre className="text-blue-400 text-[10px] font-space-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
        {supervisorConf.trim()}
      </pre>
      <div className="mt-2 space-y-1">
        {[
          "sudo apt install -y supervisor",
          "sudo nano /etc/supervisor/conf.d/trading-bot.conf",
          "sudo supervisorctl reread && sudo supervisorctl update",
          "sudo supervisorctl status trading-bot",
        ].map((cmd) => (
          <pre key={cmd} className="bg-zinc-900 text-yellow-400 text-[10px] font-space-mono px-2 py-1 rounded">{cmd}</pre>
        ))}
      </div>
    </div>

    {/* monitor.py */}
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-2">monitor.py — мониторинг статистики</div>
      <pre className="text-green-400 text-[10px] font-space-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
        {monitorScript.trim()}
      </pre>
      <div className="mt-3 bg-zinc-900 rounded-lg p-3">
        <div className="text-zinc-500 text-[10px] font-space-mono mb-1">Пример вывода:</div>
        <pre className="text-cyan-400 text-[10px] font-space-mono">{`────────────────────────────────────────
  Всего сделок : 47
  Победы       : 27
  Поражения    : 20
  Win Rate     : 57.4%
  Итого P&L    : +143.20$
────────────────────────────────────────`}</pre>
      </div>
    </div>

    {/* Стоп-условия */}
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <div className="font-orbitron text-xs font-bold text-zinc-400 mb-3">Когда останавливать бота вручную</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {[
          { cond: "Win Rate упал ниже 50%", action: "Остановить, проверить сигналы", color: "border-red-500/30 text-red-400" },
          { cond: "3+ дня убытков подряд", action: "Остановить, проанализировать рынок", color: "border-red-500/30 text-red-400" },
          { cond: "Крупные новости (FOMC, CPI)", action: "Остановить за час до события", color: "border-yellow-500/30 text-yellow-400" },
          { cond: "Win Rate стабильно >57%", action: "Продолжать, не трогать настройки", color: "border-green-500/30 text-green-400" },
        ].map(({ cond, action, color }) => (
          <div key={cond} className={`border rounded-xl p-3 ${color.split(" ")[0]}`}>
            <div className={`font-space-mono text-xs font-bold ${color.split(" ")[1]}`}>{cond}</div>
            <div className="text-zinc-400 text-[10px] font-space-mono mt-1">→ {action}</div>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
      <div className="text-green-400 font-orbitron text-xs font-bold mb-1">Итог: полный стек готов</div>
      <p className="text-zinc-400 text-xs font-space-mono leading-relaxed">
        VPS + <code className="bg-zinc-800 px-1 rounded">three_confirmations_bot.py</code> + supervisor +{" "}
        <code className="bg-zinc-800 px-1 rounded">monitor.py</code> — это боевая система, которая торгует 24/7,
        сама перезапускается при падении и ведёт журнал каждой сделки.
        Начните с демо-счёта минимум 2 недели, прежде чем переключать на реальные деньги.
      </p>
    </div>
  </div>
)