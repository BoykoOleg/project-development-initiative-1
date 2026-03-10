import React from "react"
import type { Section } from "./TradingArticleTypes"
import { SectionOverview } from "./TradingArticleIndicatorsBasic/SectionOverview"
import { SectionMA } from "./TradingArticleIndicatorsBasic/SectionMA"
import { SectionRSI } from "./TradingArticleIndicatorsBasic/SectionRSI"
import { SectionMACD } from "./TradingArticleIndicatorsBasic/SectionMACD"

export const sectionIndicatorsOverview: Section = {
  title: "Обзор популярных индикаторов",
  content: <SectionOverview />,
}

export const sectionMA: Section = {
  title: "Скользящие средние (MA): тренд и точки входа",
  content: <SectionMA />,
}

export const sectionRSI: Section = {
  title: "RSI и дивергенция — как распознать разворот",
  content: <SectionRSI />,
}

export const sectionMACD: Section = {
  title: "MACD и объём: подтверждение движений",
  content: <SectionMACD />,
}
