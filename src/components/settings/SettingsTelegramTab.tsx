import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";

const AI_MODELS = [
  { value: "deepseek-v3-20250324", label: "DeepSeek V3 (рекомендуется)" },
  { value: "deepseek-r1", label: "DeepSeek R1 (аналитика)" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini (быстрый)" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
  { value: "custom", label: "Другая модель..." },
];

const LANGUAGES = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
  { value: "uk", label: "Українська" },
  { value: "kk", label: "Қазақша" },
  { value: "custom", label: "Свой язык..." },
];

const HISTORY_OPTIONS = [
  { value: "0", label: "Не помнить (каждый раз с нуля)" },
  { value: "5", label: "5 сообщений" },
  { value: "10", label: "10 сообщений" },
  { value: "20", label: "20 сообщений (рекомендуется)" },
  { value: "40", label: "40 сообщений" },
  { value: "80", label: "80 сообщений (максимум)" },
];

const COMMANDS = [
  { cmd: "/start, /menu", desc: "Открыть главное меню с кнопками" },
  { cmd: "📋 Заявки", desc: "Показать последние 30 заявок с их статусами" },
  { cmd: "🔧 Заказ-наряды", desc: "Показать последние 30 заказ-нарядов с суммами" },
  { cmd: "💰 Финансовый отчёт", desc: "Отчёт за текущий месяц: доходы, расходы, прибыль" },
  { cmd: "➕ Создать заявку", desc: "Пошаговое создание новой заявки через диалог" },
  { cmd: "📊 Сводка по кассам", desc: "Текущие остатки по всем кассам" },
  { cmd: "Любой вопрос", desc: "ИИ-ответ на основе реальных данных из базы" },
];

const StatusBadge = ({ ok, label }: { ok: boolean; label: string }) => (
  <div className="flex items-center gap-2">
    <div className={`w-2 h-2 rounded-full ${ok ? "bg-green-500" : "bg-red-400"}`} />
    <span className="text-sm text-foreground">{label}</span>
    <span className={`text-xs font-medium ${ok ? "text-green-600" : "text-red-500"}`}>
      {ok ? "подключено" : "не настроено"}
    </span>
  </div>
);

export const TelegramTab = () => {
  const [status, setStatus] = useState<{
    bot_token_set: boolean;
    openai_key_set: boolean;
    db_ok: boolean;
    webhook?: { ok: boolean; result?: { url?: string } };
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [aiModel, setAiModel] = useState("deepseek-v3-20250324");
  const [customModel, setCustomModel] = useState("");
  const [language, setLanguage] = useState("ru");
  const [customLanguage, setCustomLanguage] = useState("");
  const [historyLimit, setHistoryLimit] = useState<string>("20");
  const [clearingHistory, setClearingHistory] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const url = getApiUrl("telegram-bot");
        if (!url) return;
        const res = await fetch(url);
        const data = await res.json();
        setStatus(data);
      } catch {
        // ignore
      } finally {
        setStatusLoading(false);
      }
    };
    check();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const url = getApiUrl("bot-settings");
        if (!url) return;
        const res = await fetch(url);
        const data = await res.json();
        if (data.system_prompt) setSystemPrompt(data.system_prompt);
        if (data.language) {
          const known = LANGUAGES.find((l) => l.value === data.language && l.value !== "custom");
          if (known) setLanguage(data.language);
          else { setLanguage("custom"); setCustomLanguage(data.language); }
        }
        if (data.ai_model) {
          const known = AI_MODELS.find((m) => m.value === data.ai_model && m.value !== "custom");
          if (known) setAiModel(data.ai_model);
          else { setAiModel("custom"); setCustomModel(data.ai_model); }
        }
        if (data.history_limit !== undefined) setHistoryLimit(String(data.history_limit));
      } catch {
        // ignore
      } finally {
        setSettingsLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = getApiUrl("bot-settings");
      if (!url) return;
      const payload = {
        system_prompt: systemPrompt,
        ai_model: aiModel === "custom" ? customModel : aiModel,
        language: language === "custom" ? customLanguage : language,
        history_limit: historyLimit,
      };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) toast.success("Настройки сохранены");
      else toast.error("Ошибка сохранения");
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setSaving(false);
    }
  };

  const handleRestart = async () => {
    setRestarting(true);
    try {
      const url = getApiUrl("bot-settings");
      if (!url) return;
      const res = await fetch(`${url}/history`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Бот перезагружен — история очищена, бот готов к работе");
      } else {
        toast.error("Ошибка перезагрузки");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setRestarting(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Удалить всю историю переписки с ботом? Это действие необратимо.")) return;
    setClearingHistory(true);
    try {
      const url = getApiUrl("bot-settings");
      if (!url) return;
      const res = await fetch(`${url}/history`, { method: "DELETE" });
      if (res.ok) toast.success("История переписки удалена");
      else toast.error("Ошибка удаления истории");
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setClearingHistory(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Telegram-бот</h3>
        <p className="text-sm text-muted-foreground mt-1">
          ИИ-помощник автосервиса в Telegram — работает с заявками, заказ-нарядами и финансами
        </p>
      </div>

      {/* Status */}
      <div className="bg-white rounded-xl border border-border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Статус подключения</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestart}
            disabled={restarting}
            className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
          >
            {restarting ? (
              <><Icon name="Loader2" size={14} className="animate-spin mr-2" />Перезагружаю...</>
            ) : (
              <><Icon name="RefreshCw" size={14} className="mr-2" />Перезагрузить бот</>
            )}
          </Button>
        </div>
        {statusLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="Loader2" size={14} className="animate-spin" />Проверяю...
          </div>
        ) : status ? (
          <div className="space-y-2">
            <StatusBadge ok={status.bot_token_set} label="Telegram Bot Token" />
            <StatusBadge ok={status.openai_key_set} label="OpenAI API Key" />
            <StatusBadge ok={status.db_ok} label="База данных" />
            {status.webhook?.result?.url && (
              <div className="pt-2 border-t border-border mt-2">
                <p className="text-xs text-muted-foreground">Webhook URL:</p>
                <p className="text-xs font-mono text-foreground break-all mt-0.5">
                  {status.webhook.result.url}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Не удалось получить статус</p>
        )}
      </div>

      {/* AI Settings */}
      <div className="bg-white rounded-xl border border-border p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Icon name="Sparkles" size={16} className="text-blue-600" />
          <h4 className="text-sm font-semibold text-foreground">Настройки ИИ</h4>
        </div>

        {settingsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="Loader2" size={14} className="animate-spin" />Загружаю настройки...
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Модель ИИ</label>
              <Select value={aiModel} onValueChange={setAiModel}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {aiModel === "custom" && (
                <Input placeholder="Введите название модели, например: gpt-4-turbo" value={customModel} onChange={(e) => setCustomModel(e.target.value)} />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Язык общения</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {language === "custom" && (
                <Input placeholder="Введите язык, например: Беларуская" value={customLanguage} onChange={(e) => setCustomLanguage(e.target.value)} />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Характер и стиль ИИ</label>
              <p className="text-xs text-muted-foreground">
                Опишите, как должен общаться бот — его имя, тон, что он знает и умеет
              </p>
              <textarea
                className="w-full min-h-[180px] text-sm border border-border rounded-lg p-3 resize-y focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Ты — помощник в автосервисе. Общаешься дружелюбно и по делу..."
              />
            </div>
          </>
        )}
      </div>

      {/* History settings */}
      <div className="bg-white rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Icon name="History" size={16} className="text-purple-600" />
          <h4 className="text-sm font-semibold text-foreground">История переписки</h4>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Сколько сообщений помнит бот</label>
          <p className="text-xs text-muted-foreground">
            Чем больше история — тем точнее контекст, но выше стоимость запроса к ИИ
          </p>
          <Select value={historyLimit} onValueChange={setHistoryLimit}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {HISTORY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="pt-1 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3">
            Очистка удалит всю историю диалогов со всеми пользователями бота — бот начнёт общение заново
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearHistory}
            disabled={clearingHistory}
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            {clearingHistory ? (
              <><Icon name="Loader2" size={14} className="animate-spin mr-2" />Удаляю...</>
            ) : (
              <><Icon name="Trash2" size={14} className="mr-2" />Удалить историю переписки</>
            )}
          </Button>
        </div>
      </div>

      {/* Commands */}
      <div className="bg-white rounded-xl border border-border divide-y divide-border">
        <div className="px-5 py-3">
          <h4 className="text-sm font-semibold text-foreground">Команды и кнопки бота</h4>
        </div>
        {COMMANDS.map((c) => (
          <div key={c.cmd} className="flex items-start gap-4 px-5 py-3.5">
            <div className="min-w-[160px]">
              <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-foreground">{c.cmd}</span>
            </div>
            <p className="text-sm text-muted-foreground">{c.desc}</p>
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saving || settingsLoading} className="min-w-[160px]">
          {saving ? (
            <><Icon name="Loader2" size={14} className="animate-spin mr-2" />Сохраняю...</>
          ) : (
            <><Icon name="Save" size={14} className="mr-2" />Сохранить настройки</>
          )}
        </Button>
      </div>
    </div>
  );
};