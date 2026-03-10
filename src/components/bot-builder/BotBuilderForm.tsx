import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BotConfig, BotType, BOT_TYPES } from "./BotBuilderTypes"

interface BotBuilderFormProps {
  config: BotConfig
  onChange: (config: BotConfig) => void
  onGenerate: () => void
}

export default function BotBuilderForm({ config, onChange, onGenerate }: BotBuilderFormProps) {
  const set = (patch: Partial<BotConfig>) => onChange({ ...config, ...patch })

  return (
    <div className="space-y-6">
      {/* Bot type */}
      <Card className="bg-zinc-900 border-red-500/20">
        <CardHeader>
          <CardTitle className="font-orbitron text-white text-lg">Тип стратегии</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(BOT_TYPES) as BotType[]).map((type) => (
              <button
                key={type}
                onClick={() => set({ type })}
                className={`p-3 rounded-lg border text-left transition-all ${
                  config.type === type
                    ? BOT_TYPES[type].color + " border-opacity-100"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                <div className="font-orbitron text-sm font-semibold mb-1">{BOT_TYPES[type].label}</div>
                <div className="text-xs opacity-80 leading-tight">{BOT_TYPES[type].description}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Asset & Exchange */}
      <Card className="bg-zinc-900 border-red-500/20">
        <CardHeader>
          <CardTitle className="font-orbitron text-white text-lg">Актив и биржа</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300 font-space-mono text-sm">Торговая пара</Label>
            <Select value={config.asset} onValueChange={(v) => set({ asset: v })}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "AAPL/USD", "EUR/USD"].map((a) => (
                  <SelectItem key={a} value={a} className="text-white hover:bg-zinc-700">{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300 font-space-mono text-sm">Биржа</Label>
            <Select value={config.exchange} onValueChange={(v) => set({ exchange: v })}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {["Binance", "Bybit", "OKX", "Kraken", "KuCoin"].map((e) => (
                  <SelectItem key={e} value={e} className="text-white hover:bg-zinc-700">{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Capital & Risk */}
      <Card className="bg-zinc-900 border-red-500/20">
        <CardHeader>
          <CardTitle className="font-orbitron text-white text-lg">Капитал и риск</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-gray-300 font-space-mono text-sm">Депозит ($)</Label>
            <Input
              type="number"
              value={config.deposit}
              onChange={(e) => set({ deposit: Number(e.target.value) })}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label className="text-gray-300 font-space-mono text-sm">Риск на сделку</Label>
              <span className="text-red-400 font-space-mono text-sm font-bold">{config.riskPercent}%</span>
            </div>
            <Slider
              min={0.1} max={5} step={0.1}
              value={[config.riskPercent]}
              onValueChange={([v]) => set({ riskPercent: v })}
              className="[&>[data-orientation=horizontal]]:h-2"
            />
            <div className="flex justify-between text-xs text-zinc-500 font-space-mono">
              <span>0.1% (консерв.)</span><span>5% (агресс.)</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300 font-space-mono text-sm">Тейк-профит (%)</Label>
              <Input
                type="number"
                value={config.takeProfitPercent}
                onChange={(e) => set({ takeProfitPercent: Number(e.target.value) })}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 font-space-mono text-sm">Стоп-лосс (%)</Label>
              <Input
                type="number"
                value={config.stopLossPercent}
                onChange={(e) => set({ stopLossPercent: Number(e.target.value) })}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategy-specific */}
      {config.type === "grid" && (
        <Card className="bg-zinc-900 border-blue-500/20">
          <CardHeader>
            <CardTitle className="font-orbitron text-white text-lg">Настройки Grid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="text-gray-300 font-space-mono text-sm">Количество уровней сетки</Label>
                <span className="text-blue-400 font-bold font-space-mono text-sm">{config.gridLevels}</span>
              </div>
              <Slider
                min={3} max={20} step={1}
                value={[config.gridLevels]}
                onValueChange={([v]) => set({ gridLevels: v })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {config.type === "dca" && (
        <Card className="bg-zinc-900 border-green-500/20">
          <CardHeader>
            <CardTitle className="font-orbitron text-white text-lg">Настройки DCA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="text-gray-300 font-space-mono text-sm">Шаг усреднения (% падения)</Label>
                <span className="text-green-400 font-bold font-space-mono text-sm">{config.dcaStep}%</span>
              </div>
              <Slider
                min={1} max={15} step={0.5}
                value={[config.dcaStep]}
                onValueChange={([v]) => set({ dcaStep: v })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {config.type === "trend" && (
        <Card className="bg-zinc-900 border-yellow-500/20">
          <CardHeader>
            <CardTitle className="font-orbitron text-white text-lg">Настройки тренда</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label className="text-gray-300 font-space-mono text-sm">Индикатор сигнала</Label>
              <Select value={config.trendIndicator} onValueChange={(v) => set({ trendIndicator: v })}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {["EMA", "MACD", "RSI"].map((ind) => (
                    <SelectItem key={ind} value={ind} className="text-white hover:bg-zinc-700">{ind}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Options */}
      <Card className="bg-zinc-900 border-red-500/20">
        <CardHeader>
          <CardTitle className="font-orbitron text-white text-lg">Дополнительно</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white font-space-mono text-sm">Трейлинг стоп</Label>
              <p className="text-zinc-500 text-xs mt-0.5">Стоп-лосс двигается за ценой</p>
            </div>
            <Switch
              checked={config.trailingStop}
              onCheckedChange={(v) => set({ trailingStop: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white font-space-mono text-sm">Реинвестирование</Label>
              <p className="text-zinc-500 text-xs mt-0.5">Добавлять прибыль к депозиту</p>
            </div>
            <Switch
              checked={config.compounding}
              onCheckedChange={(v) => set({ compounding: v })}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={onGenerate}
        className="w-full bg-red-500 hover:bg-red-600 text-white font-orbitron py-6 text-lg"
      >
        Сгенерировать код бота
      </Button>
    </div>
  )
}
