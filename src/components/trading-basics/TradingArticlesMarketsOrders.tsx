import React from "react"
import type { Article } from "./TradingArticleTypes"
import { SectionMarketTypes } from "./TradingArticlesMarketsOrders/SectionMarketTypes"
import { SectionMarketParticipants } from "./TradingArticlesMarketsOrders/SectionMarketParticipants"
import { SectionSmartMoney } from "./TradingArticlesMarketsOrders/SectionSmartMoney"
import { SectionOrderTypes } from "./TradingArticlesMarketsOrders/SectionOrderTypes"
import { SectionMarketVsLimit } from "./TradingArticlesMarketsOrders/SectionMarketVsLimit"
import { SectionStopOrders } from "./TradingArticlesMarketsOrders/SectionStopOrders"
import { SectionAdvancedOrders } from "./TradingArticlesMarketsOrders/SectionAdvancedOrders"

export const articleMarkets: Article = {
  id: "markets",
  badge: "Глава 1",
  title: "Что такое финансовые рынки",
  summary: "Финансовые рынки — это площадки, где покупатели и продавцы обменивают активы: акции, валюту, криптовалюту, товары. Понимание структуры рынка — фундамент любой торговли.",
  relevance2026: {
    score: 95,
    label: "Фундамент — вечен",
    aiImpact: 45,
    botImpact: 30,
    aiNote: "ИИ изменил скорость анализа данных и появление новых инструментов (токенизированные активы, AI-ETF), но базовая структура рынков не изменилась.",
    botNote: "Боты занимают ~70% объёма на крипторынках, создавая специфические паттерны ликвидности. Понимание их поведения стало частью базовой грамотности.",
  },
  aibotInsight: {
    aiExamples: [
      {
        label: "AI-ETF",
        text: "В 2025–2026 гг. появились ETF на базе ИИ-стратегий (ARK AI, WisdomTree AI). Они торгуются как обычные акции, но портфель перебалансируется алгоритмами ежедневно.",
      },
      {
        label: "Токенизация активов",
        text: "ИИ-платформы (Securitize, Ondo Finance) начали токенизировать реальные активы — недвижимость, облигации. Это новый класс рынков, работающих 24/7 без бирж.",
      },
      {
        label: "Анализ настроений",
        text: "GPT-модели обрабатывают новостной поток и соцсети в реальном времени, формируя «индекс настроений» по каждому инструменту — недоступный ранее срез рынка.",
      },
    ],
    botExamples: [
      {
        label: "70% объёма — боты",
        text: "На Binance/Bybit большинство объёма создают алго-трейдеры и маркетмейкеры. Это означает, что «классические» паттерны спроса/предложения работают иначе, чем в учебниках.",
      },
      {
        label: "Паттерны ликвидности",
        text: "Боты массово охотятся за ликвидностью у очевидных уровней. Стоп-лоссы большинства трейдеров стоят у круглых цифр — туда боты направляют цену, прежде чем развернуться.",
      },
      {
        label: "Флэш-крэши",
        text: "В 2024–2025 гг. участились «флэш-крэши» на 5–15% за секунды — это каскадные ликвидации, запущенные алгоритмами. Без понимания этого механизма — стоп всегда будет не там.",
      },
    ],
    comparison: {
      human: "Смотрит на биржевой стакан и новости, принимает решение за минуты",
      bot: "Сканирует 50 пар за секунду, исполняет ордер за миллисекунды",
      ai: "Анализирует 100 000 новостей + on-chain данные + соцсети одновременно",
    },
  },
  sections: [
    {
      title: "Основные типы рынков и их сравнение",
      content: <SectionMarketTypes />,
    },
    {
      title: "Участники рынка и их роли",
      content: <SectionMarketParticipants />,
    },
    {
      title: "▲ Продвинутый уровень: Smart Money и структура рынка (ICT)",
      content: <SectionSmartMoney />,
    },
  ],
}

export const articleOrders: Article = {
  id: "orders",
  badge: "Глава 2",
  title: "Типы ордеров и исполнение сделок",
  summary: "Правильный выбор типа ордера влияет на цену входа, исполнение и итоговый результат. Разберём все основные типы и когда их применять.",
  relevance2026: {
    score: 90,
    label: "Актуально полностью",
    aiImpact: 35,
    botImpact: 65,
    aiNote: "ИИ-алгоритмы маркетмейкеров всё чаще «охотятся» на стоп-лоссы — понимание ордеров помогает размещать их правильно.",
    botNote: "90% исполнения ордеров в крипте — алгоритмическое. Знание типов ордеров критично для настройки любого бота.",
  },
  aibotInsight: {
    aiExamples: [
      {
        label: "Stop hunting",
        text: "ИИ-алгоритмы маркетмейкеров анализируют скопление лимитных ордеров и целенаправленно двигают цену к ним, чтобы собрать ликвидность. После этого цена разворачивается.",
      },
      {
        label: "Smart order routing",
        text: "Крупные ИИ-системы автоматически разбивают большой ордер на мелкие части (TWAP/VWAP алгоритмы), чтобы минимизировать проскальзывание. Ваш брокер делает это без вашего ведома.",
      },
    ],
    botExamples: [
      {
        label: "Типы ордеров в 3Commas",
        text: "При настройке бота на 3Commas вы выбираете: Market (мгновенно по рынку), Limit (ждём цену), Stop-Loss (защита). От этого выбора зависит реальная цена входа.",
      },
      {
        label: "OCO в торговле",
        text: "Профессиональные боты используют OCO (One-Cancels-Other): одновременно стоит тейк-профит и стоп-лосс. Сработал один — второй отменяется автоматически.",
      },
      {
        label: "Лимитный вход в DCA-боте",
        text: "DCA-боты ставят лимитные ордера на каждую следующую покупку ниже текущей цены. Это снижает среднюю цену входа без ручного вмешательства.",
      },
    ],
    codeSnippet: {
      title: "Пример: как бот выставляет лимитный ордер через API (Python)",
      code: `import ccxt

exchange = ccxt.binance({'apiKey': 'KEY', 'secret': 'SECRET'})

# Лимитный ордер на покупку BTC по цене 60 000 USDT
order = exchange.create_limit_buy_order(
    symbol='BTC/USDT',
    amount=0.001,      # количество BTC
    price=60000        # желаемая цена входа
)
print(f"Ордер создан: {order['id']}, статус: {order['status']}")`,
    },
    comparison: {
      human: "Вручную выставляет лимитный ордер, забывает про стоп-лосс",
      bot: "Одновременно ставит лимит + стоп + тейк через OCO за 0.01 сек",
      ai: "Динамически меняет цену ордера на основе анализа стакана в реальном времени",
    },
  },
  sections: [
    {
      title: "Полная таблица типов ордеров",
      content: <SectionOrderTypes />,
    },
    {
      title: "Рыночный vs Лимитный: что выбрать",
      content: <SectionMarketVsLimit />,
    },
    {
      title: "Стоп-ордера: защита капитала",
      content: <SectionStopOrders />,
    },
    {
      title: "▲ Продвинутый уровень: OCO, фьючерсы и продвинутые типы ордеров",
      content: <SectionAdvancedOrders />,
    },
  ],
}

export const articlesMarketsOrders: Article[] = [articleMarkets, articleOrders]