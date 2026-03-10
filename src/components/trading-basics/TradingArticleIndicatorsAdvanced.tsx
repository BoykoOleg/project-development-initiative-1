import React from "react"
import type { Section } from "./TradingArticleTypes"
import { SectionIchimoku } from "./TradingArticleIndicatorsAdvanced/SectionIchimoku"
import { SectionHiddenDivergence } from "./TradingArticleIndicatorsAdvanced/SectionHiddenDivergence"
import { SectionMTF } from "./TradingArticleIndicatorsAdvanced/SectionMTF"
import { SectionAdaptiveMA } from "./TradingArticleIndicatorsAdvanced/SectionAdaptiveMA"
import { SectionJMA } from "./TradingArticleIndicatorsAdvanced/SectionJMA"

export const sectionIndicatorsAdvanced: Section = {
  title: "▲ Продвинутый уровень: Ичимоку, скрытые дивергенции и мультитаймфреймный анализ",
  content: (
    <div className="space-y-4">
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex gap-2 items-center">
        <span className="text-red-400 text-lg">⚠</span>
        <p className="text-red-300 text-xs font-space-mono">Продвинутый раздел. Требует уверенного знания MA, RSI, MACD и базовых принципов теханализа.</p>
      </div>
      <SectionIchimoku />
      <SectionHiddenDivergence />
      <SectionMTF />
      <SectionAdaptiveMA />
      <SectionJMA />
    </div>
  )
}