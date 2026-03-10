export type { Section, Article } from "./TradingArticleTypes"
export { articlesMarketsOrders } from "./TradingArticlesMarketsOrders"
export { articlesAnalysisIndicators } from "./TradingArticlesAnalysisIndicators"
export { articlesRisk } from "./TradingArticlesRisk"
export { articlesPsychology } from "./TradingArticlesPsychology"

import { articlesMarketsOrders } from "./TradingArticlesMarketsOrders"
import { articlesAnalysisIndicators } from "./TradingArticlesAnalysisIndicators"
import { articlesRisk } from "./TradingArticlesRisk"
import { articlesPsychology } from "./TradingArticlesPsychology"

export const articles = [
  ...articlesMarketsOrders,
  ...articlesAnalysisIndicators,
  ...articlesRisk,
  ...articlesPsychology,
]