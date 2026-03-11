import { useState, useEffect, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiUrl } from "@/lib/api";

interface Call {
  id: string;
  phone: string;
  dst?: string;
  client_name?: string;
  direction: "in" | "out" | "missed";
  duration: number;
  started_at: string;
  record_url?: string | null;
  has_record?: boolean;
  transcript?: string;
  transcript_loading?: boolean;
  status?: string;
}

interface Stats {
  total: number;
  incoming: number;
  outgoing: number;
  missed: number;
}

const formatDuration = (seconds: number) => {
  if (seconds === 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} мин ${s} сек` : `${s} сек`;
};

const formatTime = (raw: string | number) => {
  if (!raw) return "—";
  const num = Number(raw);
  const d = !isNaN(num) && num > 1000000000 ? new Date(num * 1000) : new Date(raw as string);
  if (isNaN(d.getTime())) return String(raw);
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
  const [calls, setCalls] = useState<Call[]>([]);
  const [dstNumbers, setDstNumbers] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, incoming: 0, outgoing: 0, missed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "in" | "out" | "missed">("all");
  const [dstFilter, setDstFilter] = useState<string>("all");
  const [transcriptCall, setTranscriptCall] = useState<Call | null>(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);

  const loadCalls = useCallback(async () => {
    const url = getApiUrl("calls");
    if (!url) {
      setNotConfigured(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Сначала загружаем из БД (вебхуки реального времени)
      const dbRes = await fetch(`${url}?action=list_db&date_from=${dateFrom}&date_to=${dateTo}`);
      const dbData = await dbRes.json();

      if (dbData.calls && dbData.calls.length > 0) {
        setCalls(dbData.calls);
        setStats(dbData.stats || { total: 0, incoming: 0, outgoing: 0, missed: 0 });
        setDstNumbers(dbData.dst_numbers || []);
        setNotConfigured(false);
        setLoading(false);
        return;
      }

      // Если в БД нет данных — пробуем API Мобилон
      const res = await fetch(`${url}?action=list&date_from=${dateFrom}&date_to=${dateTo}`);
      const data = await res.json();
      if (data.error === "not_configured") {
        setNotConfigured(true);
        setCalls([]);
      } else if (data.error) {
        setError(data.error);
        setCalls([]);
      } else {
        setNotConfigured(false);
        setCalls(data.calls || []);
        setStats(data.stats || { total: 0, incoming: 0, outgoing: 0, missed: 0 });
      }
    } catch (e) {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  const filtered = calls.filter((c) => {
    const matchSearch =
      c.phone.includes(search) ||
      (c.client_name?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchFilter = filter === "all" || c.direction === filter;
    const matchDst = dstFilter === "all" || c.dst === dstFilter;
    return matchSearch && matchFilter && matchDst;
  });

  const handleTranscript = async (call: Call) => {
    if (call.transcript) {
      setTranscriptCall(call);
      return;
    }
    setLoadingTranscript(true);
    setTranscriptCall({ ...call, transcript_loading: true });
    await new Promise((r) => setTimeout(r, 1500));
    setTranscriptCall({
      ...call,
      transcript:
        "Расшифровка разговоров доступна при подключении ИИ-транскрибации.\nЗапись сохранена в АТС МОБИЛОН — нажмите «Слушать» для воспроизведения.",
    });
    setLoadingTranscript(false);
  };

  return (
    <Layout title="Звонки">
      <div className="space-y-4">
        {/* Статус подключения */}
        {notConfigured && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Icon name="AlertCircle" size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Телефония не подключена</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Введите API Token в разделе <b>Настройки → Телефония</b>, чтобы видеть реальные звонки.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <Icon name="XCircle" size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Ошибка загрузки</p>
              <p className="text-sm text-red-600 mt-0.5 font-mono text-xs">{error}</p>
            </div>
          </div>
        )}

        {/* Статистика */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Всего звонков", value: String(stats.total), icon: "Phone", color: "text-foreground" },
            { label: "Входящих", value: String(stats.incoming), icon: "PhoneIncoming", color: "text-green-600" },
            { label: "Исходящих", value: String(stats.outgoing), icon: "PhoneOutgoing", color: "text-blue-600" },
            { label: "Пропущенных", value: String(stats.missed), icon: "PhoneMissed", color: "text-red-500" },
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

        {/* Фильтры */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Поиск по номеру..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              className="border border-border rounded-md px-3 py-2 text-sm bg-white"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <span className="text-muted-foreground text-sm">—</span>
            <input
              type="date"
              className="border border-border rounded-md px-3 py-2 text-sm bg-white"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            <Button variant="outline" size="sm" onClick={loadCalls} disabled={loading}>
              <Icon name={loading ? "Loader2" : "RefreshCw"} size={14} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
          {dstNumbers.length > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <Icon name="PhoneForwarded" size={14} className="text-muted-foreground" />
              <Select value={dstFilter} onValueChange={setDstFilter}>
                <SelectTrigger className="h-8 text-xs w-44 bg-white">
                  <SelectValue placeholder="Номер назначения" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все номера</SelectItem>
                  {dstNumbers.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Список звонков */}
        <div className="bg-white rounded-xl border border-border divide-y divide-border">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">
              <Icon name="Loader2" size={28} className="mx-auto mb-3 animate-spin text-blue-400" />
              <p className="text-sm">Загружаем историю звонков...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Icon name="PhoneOff" size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{notConfigured ? "Подключите телефонию для отображения звонков" : "Звонки за выбранный период не найдены"}</p>
            </div>
          ) : (
            filtered.map((call) => (
              <div key={call.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/30 transition-colors">
                <div className="shrink-0 w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                  {call.direction === "in" && <Icon name="PhoneIncoming" size={16} className="text-green-600" />}
                  {call.direction === "out" && <Icon name="PhoneOutgoing" size={16} className="text-blue-600" />}
                  {call.direction === "missed" && <Icon name="PhoneMissed" size={16} className="text-red-500" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground">{call.phone || "—"}</span>
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

                <div className="flex items-center gap-2 shrink-0">
                  {call.record_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 gap-1.5"
                      onClick={() => window.open(call.record_url!, "_blank")}
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
                <span>{formatTime(transcriptCall.started_at)}</span>
                <span>{formatDuration(transcriptCall.duration)}</span>
              </div>
              {loadingTranscript || transcriptCall.transcript_loading ? (
                <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
                  <Icon name="Loader2" size={24} className="animate-spin text-purple-500" />
                  <p className="text-sm">Обрабатываю запись...</p>
                </div>
              ) : (
                <div className="bg-muted/40 rounded-lg p-4 text-sm text-foreground whitespace-pre-line leading-relaxed">
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