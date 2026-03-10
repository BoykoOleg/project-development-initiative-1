import Icon from "@/components/ui/icon"
import { colorMap, type PracticeStep } from "./practiceSteps"

type Props = {
  steps: PracticeStep[]
}

export default function PracticeProgressBar({ steps }: Props) {
  return (
    <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center gap-2 shrink-0">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-orbitron font-bold border ${colorMap[step.color]}`}>
            <Icon name={step.icon as "BarChart2"} size={12} />
            {step.badge}
          </div>
          {i < steps.length - 1 && <div className="w-6 h-px bg-zinc-700 shrink-0"/>}
        </div>
      ))}
    </div>
  )
}
