export type { Section, Chapter } from "./BotsChapterTypes"
export { chaptersWhatStrategies } from "./BotsChaptersWhatStrategies"
export { chaptersBacktestPlatforms } from "./BotsChaptersBacktestPlatforms"
export { chaptersLaunch } from "./BotsChaptersLaunch"

import { chaptersWhatStrategies } from "./BotsChaptersWhatStrategies"
import { chaptersBacktestPlatforms } from "./BotsChaptersBacktestPlatforms"
import { chaptersLaunch } from "./BotsChaptersLaunch"

export const chapters = [
  ...chaptersWhatStrategies,
  ...chaptersBacktestPlatforms,
  ...chaptersLaunch,
]
