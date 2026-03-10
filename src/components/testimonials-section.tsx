import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const testimonials = [
  {
    name: "Алексей М.",
    role: "Фондовый рынок · 7 лет",
    initials: "АМ",
    color: "bg-red-500",
    stars: 5,
    result: "+34% за квартал",
    resultColor: "text-green-400",
    content:
      "Раздел по риск-менеджменту кардинально изменил мой подход. Наконец-то перестал сливать депозит на эмоциях — всё структурировано и по делу.",
  },
  {
    name: "Дмитрий С.",
    role: "Алго-трейдинг · Python",
    initials: "ДС",
    color: "bg-blue-500",
    stars: 5,
    result: "Бот окупился за 3 недели",
    resultColor: "text-green-400",
    content:
      "Лучший ресурс по алгоритмической торговле на русском. Конструктор ботов — огонь, сгенерировал рабочий код за 10 минут без копипасты из Stack Overflow.",
  },
  {
    name: "Ирина В.",
    role: "Крипто · Новичок",
    initials: "ИВ",
    color: "bg-purple-500",
    stars: 5,
    result: "С нуля до первой прибыли",
    resultColor: "text-green-400",
    content:
      "Начала с нуля — всё объяснено понятно, без воды. За месяц разобралась в основах и закрыла первые сделки в плюс. Очень рада что купила доступ.",
  },
  {
    name: "Михаил К.",
    role: "Форекс · 3 года",
    initials: "МК",
    color: "bg-orange-500",
    stars: 5,
    result: "Winrate вырос с 48% до 61%",
    resultColor: "text-green-400",
    content:
      "Практические кейсы разборов реальных сделок — это именно то чего не хватало. Пересмотрел свою стратегию и результат сразу пошёл вверх.",
  },
  {
    name: "Сергей Л.",
    role: "Криптовалюты · DeFi",
    initials: "СЛ",
    color: "bg-cyan-500",
    stars: 5,
    result: "×2.3 за полгода",
    resultColor: "text-green-400",
    content:
      "Курс помог систематизировать то что знал интуитивно. Особенно понравился раздел про управление позицией — теперь не выхожу раньше времени.",
  },
  {
    name: "Анна Р.",
    role: "Фондовый · Дивиденды",
    initials: "АР",
    color: "bg-pink-500",
    stars: 5,
    result: "Стабильный доход каждый месяц",
    resultColor: "text-green-400",
    content:
      "Думала трейдинг — это казино. После курса поняла что это ремесло. Теперь торгую по системе и сплю спокойно. Цена доступа окупилась в первую неделю.",
  },
]

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="text-yellow-400 text-sm">★</span>
      ))}
    </div>
  )
}

export function TestimonialsSection() {
  return (
    <section className="py-24 px-6 bg-black">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-red-400 text-sm font-medium uppercase tracking-widest mb-3 font-orbitron">Отзывы учеников</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-orbitron">
            Реальные результаты
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Трейдеры, которые уже применяют знания из курса на практике
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <Card
              key={index}
              className="bg-zinc-900 border-zinc-800 hover:border-red-500/40 transition-colors duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                {/* Шапка */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className={`${t.color} text-white text-sm font-bold`}>
                        {t.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-white text-sm">{t.name}</p>
                      <p className="text-xs text-zinc-500">{t.role}</p>
                    </div>
                  </div>
                  <Stars count={t.stars} />
                </div>

                {/* Результат */}
                <div className="bg-zinc-800/60 rounded-lg px-3 py-2 mb-4 inline-flex items-center gap-2">
                  <span className="text-green-400 text-xs">↑</span>
                  <span className={`text-sm font-bold ${t.resultColor}`}>{t.result}</span>
                </div>

                {/* Отзыв */}
                <p className="text-zinc-300 text-sm leading-relaxed">"{t.content}"</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Итоговая статистика */}
        <div className="mt-16 grid grid-cols-3 gap-6 max-w-2xl mx-auto text-center">
          {[
            { value: '500+', label: 'учеников' },
            { value: '4.9', label: 'средняя оценка' },
            { value: '94%', label: 'рекомендуют' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-red-400 font-orbitron">{s.value}</div>
              <div className="text-zinc-500 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
