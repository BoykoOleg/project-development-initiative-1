export type { PracticeStep } from "./practiceStepTypes"
export { colorMap, borderMap } from "./practiceStepTypes"

import { stepMarketAnalysis, stepSignalFormation } from "./practiceStepsMarketSignal"
import { stepMarketRegimes } from "./practiceStepsMarketRegimes"
import { stepRiskManagement, stepBotAutomation } from "./practiceStepsRiskBot"
import { stepAutomation } from "./practiceStepsAutomation"
import { stepMistakes } from "./practiceStepsMistakes"
import { stepFullChecklist } from "./practiceStepsChecklist"
import type { PracticeStep } from "./practiceStepTypes"

export const steps: PracticeStep[] = [
  stepMarketAnalysis,
  stepMarketRegimes,
  stepSignalFormation,
  stepRiskManagement,
  stepBotAutomation,
  stepAutomation,
  stepMistakes,
  stepFullChecklist,
]