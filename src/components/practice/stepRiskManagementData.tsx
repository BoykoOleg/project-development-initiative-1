import type { PracticeStep } from "./practiceStepTypes"
import { SectionRiskRule2, SectionDailyLimit, SectionTraderJournal } from "./practiceStepsRiskBot/SectionRiskRule2"
import { SectionRiskCheatsheet } from "./practiceStepsRiskBot/SectionRiskCheatsheet"

export const stepRiskManagement: PracticeStep = {
  id: "risk-management",
  badge: "Шаг 4",
  color: "red",
  icon: "Shield",
  title: "Риск-менеджмент: сколько ставить на сделку",
  summary: "Правила управления капиталом на Pocket Option. Без этого даже 70% правильных сигналов превращаются в слив депозита.",
  relevance2026: {
    score: 99,
    label: "Вечная необходимость",
    aiImpact: 38,
    botImpact: 70,
    aiNote: "ИИ не устраняет риск — он лишь быстрее его считает. Правило 2% и ограничение дневных потерь актуальны независимо от уровня автоматизации.",
    botNote: "Большинство публичных кейсов слива ботов в 2025-2026 — это отсутствие лимита дневных потерь. Шаг 3 — первое, что нужно прошить в код любого бота.",
  },
  aibotInsight: {
    aiExamples: [
      {
        label: "ИИ не отменяет риск",
        text: "Даже самые продвинутые ИИ-системы (Renaissance Technologies, Two Sigma) имеют жёсткий риск-менеджмент. Лимит потерь — первое, что настраивается, последнее, что снимается.",
      },
      {
        label: "Динамический риск",
        text: "Передовые ИИ-фонды автоматически снижают размер позиции при росте VIX (индекса страха). Логика: чем выше волатильность, тем меньше ставка. Это противоположно тому, как действует большинство трейдеров.",
      },
    ],
    botExamples: [
      {
        label: "Daily Stop Loss в коде",
        text: "MAX_DAILY_LOSS = 0.05 (5%). После каждой сделки бот проверяет: если sum(дневные убытки) >= MAX_DAILY_LOSS → останавливается до 00:00 UTC. Один параметр, который спас тысячи депозитов.",
      },
      {
        label: "Правило 2% автоматически",
        text: "Бот не спрашивает «сколько поставить?». Он считает: position_size = balance × 0.02. Если баланс $500 → размер сделки всегда $10, независимо от «уверенности» в сигнале.",
      },
    ],
    codeSnippet: {
      title: "Risk Manager: лимит потерь за день в коде бота",
      code: `class RiskManager:
    def __init__(self, balance, risk_pct=0.02, daily_limit_pct=0.05):
        self.balance = balance
        self.risk_pct = risk_pct
        self.daily_limit_pct = daily_limit_pct
        self.daily_loss = 0

    def can_trade(self):
        """Проверяет, можно ли открывать новые сделки"""
        if self.daily_loss >= self.balance * self.daily_limit_pct:
            print("⛔ Дневной лимит достигнут: -" + str(round(self.daily_loss, 2)) + " USDT. Торговля остановлена.")
            return False
        return True

    def get_position_size(self):
        """Возвращает размер позиции по правилу 2%"""
        return round(self.balance * self.risk_pct, 2)

    def record_loss(self, amount):
        self.daily_loss += amount`,
    },
    comparison: {
      human: "Ставит «чуть больше» когда кажется что сигнал надёжный, забывает про дневной стоп",
      bot: "Автоматически считает 2% от баланса и останавливается при достижении дневного лимита",
      ai: "Снижает риск при росте волатильности рынка, увеличивает при благоприятных условиях",
    },
  },
  sections: [
    { title: "Правило 2% на Pocket Option", content: <SectionRiskRule2 /> },
    { title: "Дневной лимит: когда останавливаться", content: <SectionDailyLimit /> },
    { title: "Журнал трейдера: как его вести", content: <SectionTraderJournal /> },
    { title: "Шпаргалка: риск-менеджмент — всё в одном", content: <SectionRiskCheatsheet /> },
  ],
}