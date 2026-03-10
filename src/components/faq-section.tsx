import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function FAQSection() {
  const faqs = [
    {
      question: "Для кого этот курс?",
      answer:
        "Для всех — от полных новичков до трейдеров с опытом. Новичкам помогут разобраться в основах без лишней воды. Опытным — систематизировать знания и освоить алгоритмическую торговлю.",
    },
    {
      question: "Нужно ли уметь программировать для работы с ботами?",
      answer:
        "Нет. Конструктор ботов генерирует готовый Python-код автоматически — просто выбираешь параметры и скачиваешь. Если хочешь разобраться глубже — в курсе есть материалы по Python для трейдинга.",
    },
    {
      question: "Какие рынки охватывает курс?",
      answer:
        "Криптовалютный рынок, фондовый и форекс. Принципы управления рисками и алгоритмической торговли универсальны — примеры есть для каждого рынка.",
    },
    {
      question: "Как оплатить доступ?",
      answer:
        "Оплата через Lava.ru — принимаются банковские карты (Visa, Mastercard, Мир) и СБП. Оплата безопасная, данные карты не хранятся. После оплаты ключ доступа придёт на твою почту автоматически.",
    },
    {
      question: "Что такое ключ доступа и как его использовать?",
      answer:
        "После оплаты на твой email придёт уникальный код из 16 символов. Введи его на странице «Получить доступ» или прямо в закрытом разделе сайта — и доступ откроется навсегда.",
    },
    {
      question: "Доступ — разовый или по подписке?",
      answer:
        "Разовый платёж 2 000 ₽ — и доступ навсегда. Никаких ежемесячных списаний. Все обновления курса тоже входят в эту цену.",
    },
    {
      question: "Что делать если ключ не пришёл на email?",
      answer:
        "Проверь папку «Спам». Если там тоже нет — напиши нам в поддержку, пришли номер заказа и мы вышлем ключ вручную.",
    },
    {
      question: "Как часто обновляется контент?",
      answer:
        "Регулярно. Мы добавляем новые кейсы, разборы стратегий и обновляем материалы по мере изменений на рынках. Всё это доступно без доплат.",
    },
  ]

  return (
    <section className="py-24 bg-zinc-950" id="faq">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-red-400 text-sm font-medium uppercase tracking-widest mb-3 font-orbitron">FAQ</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-orbitron">Частые вопросы</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Всё что нужно знать перед покупкой доступа
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-2 hover:border-red-500/30 transition-colors"
              >
                <AccordionTrigger className="text-left text-base font-semibold text-white hover:text-red-400 font-orbitron px-4 py-4 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-400 leading-relaxed px-4 pb-4 text-sm">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
