import { useState } from "react";
import Layout from "@/components/Layout";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Call {
  id: string;
  phone: string;
  client_name?: string;
  direction: "in" | "out" | "missed";
  duration: number;
  started_at: string;
  record_url?: string;
  transcript?: string;
  transcript_loading?: boolean;
}

const DEMO_CALLS: Call[] = [
  {
    id: "1",
    phone: "+7 (918) 234-56-78",
    client_name: "Алексей Петров",
    direction: "in",
    duration: 183,
    started_at: "2026-03-05T10:14:00",
    record_url: "#",
  },
  {
    id: "2",
    phone: "+7 (903) 111-22-33",
    direction: "missed",
    duration: 0,
    started_at: "2026-03-05T09:47:00",
  },
  {
    id: "3",
    phone: "+7 (961) 500-77-88",
    client_name: "ООО Автотранс",
    direction: "out",
    duration: 67,
    started_at: "2026-03-05T09:02:00",
    record_url: "#",
  },
  {
    id: "4",
    phone: "+7 (928) 777-44-55",
    client_name: "Марина Козлова",
    direction: "in",
    duration: 312,
    started_at: "2026-03-04T17:33:00",
    record_url: "#",
    transcript:
      "— Алло, добрый день!\n— Здравствуйте, Марина. Чем могу помочь?\n— Хотела уточнить, когда будет готова моя машина?\n— Ваш автомобиль Toyota Camry будет готов сегодня к 18:00. Мастер уже заканчивает работу.\n— Отлично, спасибо большое!\n— Пожалуйста, до свидания.",
  },
  {
    id: "5",
    phone: "+7 (989) 600-11-99",
    direction: "missed",
    duration: 0,
    started_at: "2026-03-04T14:22:00",
  },
  {
    id: "6",
    phone: "+7 (918) 234-56-78",
    client_name: "Алексей Петров",
    direction: "out",
    duration: 44,
    started_at: "2026-03-04T11:05:00",
    record_url: "#",
  },
];

const formatDuration = (seconds: number) => {
  if (seconds === 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} мин ${s} сек` : `${s} сек`;
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const timeStr = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === today.toDateString()) return `Сегодня, ${timeStr}`;
  if (d.toDateString() === yesterday.toDateString()) return `Вчера, ${timeStr}`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) + `, ${timeStr}`;
};

const DirectionBadge = ({ direction }: { direction: Call["direction"] }) => {
  if (direction === "in")
    return (
      <div className="flex items-center gap-1.5 text-green-600">
        <Icon name="PhoneIncoming" size={14} />
        <span className="text-xs font-medium">Входящий</span>
      </div>
    );
  if (direction === "out")
    return (
      <div className="flex items-center gap-1.5 text-blue-600">
        <Icon name="PhoneOutgoing" size={14} />
        <span className="text-xs font-medium">Исходящий</span>
      </div>
    );
  return (
    <div className="flex items-center gap-1.5 text-red-500">
      <Icon name="PhoneMissed" size={14} />
      <span className="text-xs font-medium">Пропущенный</span>
    </div>
  );
};

export default function Calls() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "in" | "out" | "missed">("all");
  const [transcriptCall, setTranscriptCall] = useState<Call | null>(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);

  const filtered = DEMO_CALLS.filter((c) => {
    const matchSearch =
      c.phone.includes(search) ||
      (c.client_name?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchFilter = filter === "all" || c.direction === filter;
    return matchSearch && matchFilter;
  });

  const handleTranscript = async (call: Call) => {
    if (call.transcript) {
      setTranscriptCall(call);
      return;
    }
    setLoadingTranscript(true);
    setTranscriptCall({ ...call, transcript_loading: true });
    // Имитация запроса к API расшифровки
    await new Promise((r) => setTimeout(r, 2000));
    setTranscriptCall({
      ...call,
      transcript:
        "Расшифровка доступна после подключения телефонии МОБИЛОН.\n\nКак только интеграция будет настроена — здесь появится полный текст разговора.",
    });
    setLoadingTranscript(false);
  };

  const missedCount = DEMO_CALLS.filter((c) => c.direction === "missed").length;

  return (
    <Layout title="Звонки">
      <div className="space-y-4">
        {/* Плашка о подключении */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Icon name="Info" size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Телефония не подключена</p>
            <p className="text-sm text-blue-600 mt-0.5">
              Ниже показаны демо-данные. Для отображения реальных звонков подключите МОБИЛОН в разделе Настройки.
            </p>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Всего за сегодня", value: "3", icon: "Phone", color: "text-foreground" },
            { label: "Входящих", value: "1", icon: "PhoneIncoming", color: "text-green-600" },
            { label: "Исходящих", value: "1", icon: "PhoneOutgoing", color: "text-blue-600" },
            { label: "Пропущенных", value: String(missedCount), icon: "PhoneMissed", color: "text-red-500" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-border p-4">
              <div className={`flex items-center gap-2 ${s.color} mb-1`}>
                <Icon name={s.icon} size={16} />
                <span className="text-2xl font-bold">{s.value}</span>
              </div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Фильтры и поиск */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Поиск по номеру или имени..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {(["all", "in", "out", "missed"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
                className="text-xs"
              >
                {f === "all" ? "Все" : f === "in" ? "Входящие" : f === "out" ? "Исходящие" : "Пропущенные"}
              </Button>
            ))}
          </div>
        </div>

        {/* Список звонков */}
        <div className="bg-white rounded-xl border border-border divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Icon name="PhoneOff" size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Звонки не найдены</p>
            </div>
          ) : (
            filtered.map((call) => (
              <div key={call.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/30 transition-colors">
                {/* Иконка направления */}
                <div className="shrink-0 w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                  {call.direction === "in" && <Icon name="PhoneIncoming" size={16} className="text-green-600" />}
                  {call.direction === "out" && <Icon name="PhoneOutgoing" size={16} className="text-blue-600" />}
                  {call.direction === "missed" && <Icon name="PhoneMissed" size={16} className="text-red-500" />}
                </div>

                {/* Основная информация */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground">{call.phone}</span>
                    {call.client_name ? (
                      <Badge variant="secondary" className="text-xs">{call.client_name}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Неизвестный</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <DirectionBadge direction={call.direction} />
                    <span className="text-xs text-muted-foreground">{formatTime(call.started_at)}</span>
                    {call.duration > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Icon name="Clock" size={11} />
                        {formatDuration(call.duration)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Действия */}
                <div className="flex items-center gap-2 shrink-0">
                  {call.record_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 gap-1.5"
                      onClick={() => window.open(call.record_url, "_blank")}
                    >
                      <Icon name="Play" size={12} />
                      Слушать
                    </Button>
                  )}
                  {call.direction !== "missed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 gap-1.5 text-purple-600 border-purple-200 hover:bg-purple-50"
                      onClick={() => handleTranscript(call)}
                    >
                      <Icon name="FileText" size={12} />
                      Расшифровка
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Диалог расшифровки */}
      <Dialog open={!!transcriptCall} onOpenChange={(o) => !o && setTranscriptCall(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="FileText" size={18} className="text-purple-600" />
              Расшифровка разговора
            </DialogTitle>
          </DialogHeader>
          {transcriptCall && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground border-b border-border pb-3">
                <span className="font-medium text-foreground">{transcriptCall.phone}</span>
                {transcriptCall.client_name && (
                  <Badge variant="secondary">{transcriptCall.client_name}</Badge>
                )}
                <span>{formatTime(transcriptCall.started_at)}</span>
                <span>{formatDuration(transcriptCall.duration)}</span>
              </div>
              {loadingTranscript || transcriptCall.transcript_loading ? (
                <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
                  <Icon name="Loader2" size={24} className="animate-spin text-purple-500" />
                  <p className="text-sm">Расшифровываю запись через ИИ...</p>
                </div>
              ) : (
                <div className="bg-muted/40 rounded-lg p-4 text-sm text-foreground whitespace-pre-line leading-relaxed max-h-80 overflow-y-auto">
                  {transcriptCall.transcript}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
