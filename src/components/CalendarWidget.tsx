import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useNavigate } from "react-router-dom";
import func2url from "../../backend/func2url.json";

const CALENDAR_URL = func2url["google-calendar"];

interface CalEvent {
  id: string;
  summary: string;
  description: string;
  start: string;
  end: string;
  html_link?: string;
}

interface NewEventForm {
  summary: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
}

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];

function parseTime(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso.slice(11, 16) || "";
  }
}

function toDateStr(d: Date): string {
  // Используем локальную дату (МСК), не UTC
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getWeekDays(anchorDate: Date): Date[] {
  const day = anchorDate.getDay();
  const monday = new Date(anchorDate);
  monday.setDate(anchorDate.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const EVENT_COLORS: Record<string, string> = {
  "1": "bg-blue-500",
  "2": "bg-green-500",
  "3": "bg-purple-500",
  "4": "bg-red-500",
  "5": "bg-yellow-500",
  "6": "bg-orange-500",
  "7": "bg-teal-500",
  "8": "bg-gray-500",
  "9": "bg-blue-700",
  "10": "bg-green-700",
  "11": "bg-red-700",
};

export default function CalendarWidget() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [weekEvents, setWeekEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewEventForm>({
    summary: "",
    description: "",
    date: toDateStr(new Date()),
    startTime: "10:00",
    endTime: "11:00",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekDays = getWeekDays(currentDate);

  const loadWeekEvents = async (anchor: Date) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${CALENDAR_URL}?action=week&date=${toDateStr(anchor)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setWeekEvents(data.events || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeekEvents(currentDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const ds = toDateStr(selectedDate);
    setEvents(weekEvents.filter(ev => {
      if (!ev.start) return false;
      // Конвертируем дату события в локальную (МСК)
      return toDateStr(new Date(ev.start)) === ds;
    }));
  }, [weekEvents, selectedDate]);

  const prevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
    loadWeekEvents(d);
  };

  const nextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
    loadWeekEvents(d);
  };

  const selectDay = (date: Date) => {
    setSelectedDate(date);
    setForm(f => ({ ...f, date: toDateStr(date) }));
  };

  const eventsForDay = (date: Date) => {
    const ds = toDateStr(date);
    return weekEvents.filter(ev => ev.start && toDateStr(new Date(ev.start)) === ds);
  };

  const createEvent = async () => {
    if (!form.summary.trim()) return;
    setSaving(true);
    try {
      const start = `${form.date}T${form.startTime}:00+03:00`;
      const end = `${form.date}T${form.endTime}:00+03:00`;
      const res = await fetch(CALENDAR_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: form.summary, description: form.description, start, end }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowForm(false);
      setForm(f => ({ ...f, summary: "", description: "" }));
      await loadWeekEvents(currentDate);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка создания события");
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      await fetch(`${CALENDAR_URL}?event_id=${encodeURIComponent(eventId)}`, { method: "DELETE" });
      setWeekEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка удаления");
    }
  };

  const today = toDateStr(new Date());
  const selectedStr = toDateStr(selectedDate);
  const monthYear = `${MONTHS[weekDays[0].getMonth()]}${weekDays[0].getMonth() !== weekDays[6].getMonth() ? " — " + MONTHS[weekDays[6].getMonth()] : ""} ${weekDays[0].getFullYear()}`;

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="CalendarDays" size={18} className="text-blue-500" />
          <h3 className="font-semibold text-foreground">Расписание</h3>
          <span className="text-xs text-muted-foreground">{monthYear}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={prevWeek}>
            <Icon name="ChevronLeft" size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={nextWeek}>
            <Icon name="ChevronRight" size={16} />
          </Button>
          <Button size="sm" className="h-7 text-xs ml-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={() => { setShowForm(true); setForm(f => ({ ...f, date: selectedStr })); }}>
            <Icon name="Plus" size={13} className="mr-1" />
            Запись
          </Button>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((date, i) => {
          const ds = toDateStr(date);
          const isToday = ds === today;
          const isSelected = ds === selectedStr;
          const dayEvs = eventsForDay(date);
          return (
            <button
              key={i}
              onClick={() => selectDay(date)}
              className={`flex flex-col items-center py-2 px-1 transition-colors hover:bg-muted/50 ${isSelected ? "bg-blue-50" : ""}`}
            >
              <span className="text-xs text-muted-foreground mb-1">{DAYS[i]}</span>
              <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium transition-colors
                ${isToday ? "bg-blue-500 text-white" : isSelected ? "bg-blue-100 text-blue-700" : "text-foreground"}`}>
                {date.getDate()}
              </span>
              <div className="flex gap-0.5 mt-1 min-h-[6px]">
                {dayEvs.slice(0, 3).map((ev, j) => (
                  <div key={j} className={`w-1.5 h-1.5 rounded-full ${EVENT_COLORS[ev.color || ""] || "bg-blue-400"}`} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Day events */}
      <div className="p-4 min-h-[120px]">
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-500 mb-3 p-2 bg-red-50 rounded-lg">
            <Icon name="AlertCircle" size={14} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-20 text-muted-foreground text-sm gap-2">
            <Icon name="Loader2" size={16} className="animate-spin" />
            Загрузка...
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-20 text-muted-foreground text-sm gap-1">
            <Icon name="CalendarX" size={20} className="text-muted-foreground/50" />
            <span>Нет записей на {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()].toLowerCase()}</span>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map(ev => (
              <div key={ev.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 group transition-colors">
                <div className={`w-1 rounded-full self-stretch min-h-[36px] shrink-0 ${EVENT_COLORS[ev.color || ""] || "bg-blue-400"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{ev.summary}</div>
                  <div className="text-xs text-muted-foreground">
                    {parseTime(ev.start)} — {parseTime(ev.end)}
                  </div>
                  {ev.description && (
                    <div className="text-xs text-muted-foreground truncate mt-0.5">{ev.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                    title="Создать заказ-наряд"
                    onClick={() => navigate(`/work-orders?from_calendar=${encodeURIComponent(ev.summary)}`)}
                  >
                    <Icon name="ClipboardPlus" size={12} />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400 hover:text-red-600" onClick={() => deleteEvent(ev.id)}>
                    <Icon name="Trash2" size={12} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New event form */}
      {showForm && (
        <div className="border-t border-border p-4 bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Новая запись</span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowForm(false)}>
              <Icon name="X" size={14} />
            </Button>
          </div>
          <div className="space-y-2">
            <input
              className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="Название (клиент, услуга...)"
              value={form.summary}
              onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
            />
            <input
              className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="Описание (необязательно)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="date"
                className="text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />
              <input
                type="time"
                className="text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
              />
              <input
                type="time"
                className="text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.endTime}
                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
              />
            </div>
            <Button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              size="sm"
              onClick={createEvent}
              disabled={saving || !form.summary.trim()}
            >
              {saving ? <Icon name="Loader2" size={14} className="animate-spin mr-1.5" /> : <Icon name="CalendarPlus" size={14} className="mr-1.5" />}
              {saving ? "Сохраняем..." : "Создать запись"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}