import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Icon from "@/components/ui/icon"
import { colorMap, borderMap, type PracticeStep } from "./practiceSteps"
import { Relevance2026Badge } from "@/components/Relevance2026Badge"
import { AIBotInsightBlock } from "@/components/AIBotInsightBlock"

type Props = {
  step: PracticeStep
  open: string[]
  onOpenChange: (value: string[]) => void
}

export default function PracticeStepCard({ step, open, onOpenChange }: Props) {
  return (
    <div id={step.id} className="scroll-mt-24">
      <Card className={`border bg-zinc-900 ${borderMap[step.color]}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 mb-3">
            <Badge className={colorMap[step.color]}>{step.badge}</Badge>
            <Icon name={step.icon as "BarChart2"} size={16} className="text-zinc-400" />
          </div>
          <CardTitle className="font-orbitron text-2xl leading-tight text-white">
            {step.title}
          </CardTitle>
          <p className="text-gray-400 leading-relaxed mt-2">{step.summary}</p>
          {step.relevance2026 && <Relevance2026Badge data={step.relevance2026} />}
          {step.aibotInsight && <AIBotInsightBlock data={step.aibotInsight} />}
        </CardHeader>
        <CardContent>
          <Accordion
            type="multiple"
            value={open}
            onValueChange={onOpenChange}
            className="w-full"
          >
            {step.sections.map((section, idx) => (
              <AccordionItem
                key={idx}
                value={`${step.id}-${idx}`}
                className="border-zinc-700/50"
              >
                <AccordionTrigger className="text-left text-base font-semibold text-white hover:text-green-400 font-orbitron">
                  {section.title}
                </AccordionTrigger>
                <AccordionContent>
                  {section.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}