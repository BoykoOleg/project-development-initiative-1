import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
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

export const MaxBotTab = () => {
  const [status, setStatus] = useState<{
    token_set: boolean;
    openai_set: boolean;
    enabled: boolean;
    history_count: number;
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [aiModel, setAiModel] = useState("deepseek-v3-20250324");
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [restarting, setRestarting] = useState(false);

  const botUrl = getApiUrl("max-bot");

  useEffect(() => {
    const load = async () => {
      if (!botUrl) return;
      try {
        const res = await fetch(botUrl);
        const data = await res.json();
        setStatus(data);
        if (data.ai_model) setAiModel(data.ai_model);
        if (data.enabled !== undefined) setEnabled(data.enabled);
      } catch { /* ignore */ } finally {
        setStatusLoading(false);
      }
    };
    load();
  }, [botUrl]);

  const handleSave = async () => {
    if (!botUrl) return;
    setSaving(true);
    try {
      const res = await fetch(botUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "settings", ai_model: aiModel, enabled }),
      });
      if (res.ok) toast.success("Настройки сохранены");
      else toast.error("Ошибка сохранения");
    } catch { toast.error("Ошибка сети"); } finally {
      setSaving(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Удалить всю историю диалогов с клиентами? Это действие необратимо.")) return;
    if (!botUrl) return;
    setClearingHistory(true);
    try {
      const res = await fetch(`${botUrl}?action=clear_history`, { method: "DELETE" });
      if (res.ok) {
        toast.success("История диалогов очищена");
        setStatus((s) => s ? { ...s, history_count: 0 } : s);
      } else toast.error("Ошибка очистки истории");
    } catch { toast.error("Ошибка сети"); } finally {
      setClearingHistory(false);
    }
  };

  const handleRestart = async () => {
    if (!botUrl) return;
    setRestarting(true);
    try {
      const res = await fetch(`${botUrl}?action=clear_history`, { method: "DELETE" });
      if (res.ok) toast.success("Бот перезапущен — история очищена");
      else toast.error("Ошибка перезапуска");
    } catch { toast.error("Ошибка сети"); } finally {
      setRestarting(false);
    }
  };

  const handleRegisterWebhook = async () => {
    if (!botUrl) return;
    try {
      const res = await fetch(`${botUrl}?register=1&url=${encodeURIComponent(botUrl)}`);
      const data = await res.json();
      if (data.webhook_register?.success) toast.success("Вебхук зарегистрирован");
      else toast.error("Ошибка регистрации: " + JSON.stringify(data.webhook_register));
    } catch { toast.error("Ошибка сети"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Бот Макс</h3>
        <p className="text-sm text-muted-foreground mt-1">
          ИИ-помощник принимает заявки от клиентов в мессенджере Макс и создаёт их в системе
        </p>
      </div>

      {/* Статус */}
      <div className="bg-white rounded-xl border border-border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Статус подключения</h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestart}
              disabled={restarting}
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              {restarting
                ? <><Icon name="Loader2" size={14} className="animate-spin mr-1.5" />Перезапуск...</>
                : <><Icon name="RefreshCw" size={14} className="mr-1.5" />Перезапустить</>}
            </Button>
          </div>
        </div>

        {statusLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="Loader2" size={14} className="animate-spin" />Проверяю...
          </div>
        ) : status ? (
          <div className="space-y-2">
            <StatusBadge ok={status.token_set} label="MAX_BOT_TOKEN" />
            <StatusBadge ok={status.openai_set} label="OpenAI API Key" />
            {status.history_count !== undefined && (
              <div className="text-xs text-muted-foreground pt-1">
                Диалогов в истории: <span className="font-medium text-foreground">{status.history_count}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-red-500">Бот недоступен</div>
        )}
      </div>

      {/* Управление ботом */}
      <div className="bg-white rounded-xl border border-border p-5 space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Управление</h4>

        {/* Вкл/Выкл */}
        <div className="flex items-center justify-between py-2 border-b border-border">
          <div>
            <div className="text-sm font-medium">Бот активен</div>
            <div className="text-xs text-muted-foreground mt-0.5">Принимает сообщения от клиентов</div>
          </div>
          <button
            onClick={() => setEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-green-500" : "bg-gray-300"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        {/* Языковая модель */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Языковая модель ИИ</label>
          <Select value={aiModel} onValueChange={setAiModel}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Модель используется для ведения диалога с клиентами</p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="bg-blue-500 hover:bg-blue-600 text-white">
          {saving ? <><Icon name="Loader2" size={14} className="animate-spin mr-1.5" />Сохранение...</> : "Сохранить настройки"}
        </Button>
      </div>

      {/* Очистка истории */}
      <div className="bg-white rounded-xl border border-border p-5 space-y-3">
        <h4 className="text-sm font-semibold text-foreground">История диалогов</h4>
        <p className="text-sm text-muted-foreground">
          Бот помнит контекст каждого клиента. Очистка удалит историю всех переписок — клиенты начнут диалог с нуля.
        </p>
        <Button
          variant="outline"
          onClick={handleClearHistory}
          disabled={clearingHistory}
          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          {clearingHistory
            ? <><Icon name="Loader2" size={14} className="animate-spin mr-1.5" />Очищаю...</>
            : <><Icon name="Trash2" size={14} className="mr-1.5" />Очистить историю диалогов</>}
        </Button>
      </div>

      {/* Вебхук */}
      <div className="bg-white rounded-xl border border-border p-5 space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Вебхук</h4>
        <p className="text-sm text-muted-foreground">
          Если бот перестал получать сообщения — зарегистрируй вебхук заново.
        </p>
        <div className="flex items-center gap-2">
          <code className="text-xs bg-muted px-2 py-1.5 rounded border border-border flex-1 truncate text-muted-foreground">
            {botUrl || "URL не найден"}
          </code>
          <Button variant="outline" size="sm" onClick={handleRegisterWebhook}>
            <Icon name="Link" size={14} className="mr-1.5" />
            Зарегистрировать
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MaxBotTab;