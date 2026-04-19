import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Icon from "@/components/ui/icon";
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface FixedCost {
  id: number;
  name: string;
  amount: number;
  period: string;
  category: string | null;
  comment: string | null;
  is_active: boolean;
}

interface Economics {
  monthly_fixed: number;
  month_variable: number;
  month_revenue: number;
  prev_month_revenue: number;
  avg_month_revenue: number;
  avg_month_variable: number;
  gross_profit: number;
  margin_pct: number;
  operating_profit: number;
  bep_revenue: number;
  bep_orders: number;
  avg_check: number;
  closed_orders_month: number;
  safety_margin_pct: number;
}

const PERIODS: Record<string, string> = {
  day: "В день",
  week: "В неделю",
  month: "В месяц",
  year: "В год",
};

const CATEGORIES = [
  "Аренда",
  "Зарплата",
  "Коммунальные",
  "Связь и интернет",
  "Реклама",
  "Страхование",
  "Лизинг",
  "Прочее",
];

const fmt = (v: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(v) + " ₽";

const emptyForm = {
  name: "",
  amount: "",
  period: "month",
  category: "",
  comment: "",
};

function getWeekLabel(offset: number) {
  const now = new Date();
  const day = now.getDay() === 0 ? 7 : now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1 + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt2 = (d: Date) =>
    d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  return offset === 0 ? `Эта неделя (${fmt2(monday)}–${fmt2(sunday)})` : `${fmt2(monday)}–${fmt2(sunday)}`;
}

function getMonthLabel(offset: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
}

export default function FinanceEconomics() {
  const [economics, setEconomics] = useState<Economics | null>(null);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<FixedCost | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // Фильтры
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPeriodType, setFilterPeriodType] = useState<"month" | "week">("month");
  const [filterOffset, setFilterOffset] = useState(0);

  // Excel import
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const url = getApiUrl("finance");
    if (!url) return;
    setLoading(true);
    try {
      const [econRes, costsRes] = await Promise.all([
        fetch(`${url}?section=economics`),
        fetch(`${url}?section=fixed_costs`),
      ]);
      const econData = await econRes.json();
      const costsData = await costsRes.json();
      if (!econData.error) setEconomics(econData);
      setFixedCosts(costsData.fixed_costs || []);
    } catch {
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditingCost(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (cost: FixedCost) => {
    setEditingCost(cost);
    setForm({
      name: cost.name,
      amount: String(cost.amount),
      period: cost.period,
      category: cost.category || "",
      comment: cost.comment || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.amount) {
      toast.error("Введите название и сумму");
      return;
    }
    setSubmitting(true);
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const body = editingCost
        ? { action: "update_fixed_cost", id: editingCost.id, name: form.name, amount: Number(form.amount), period: form.period, category: form.category || null, comment: form.comment || null }
        : { action: "create_fixed_cost", name: form.name, amount: Number(form.amount), period: form.period, category: form.category || null, comment: form.comment || null };
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success(editingCost ? "Статья обновлена" : "Статья добавлена");
      setDialogOpen(false);
      load();
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cost: FixedCost) => {
    if (!confirm(`Удалить "${cost.name}"?`)) return;
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete_fixed_cost", id: cost.id }) });
      toast.success("Удалено");
      load();
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const handleToggle = async (cost: FixedCost) => {
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update_fixed_cost", id: cost.id, is_active: !cost.is_active }) });
      load();
    } catch {
      toast.error("Ошибка");
    }
  };

  const monthlyAmount = (cost: FixedCost) => {
    switch (cost.period) {
      case "day": return cost.amount * 30;
      case "week": return cost.amount * 4;
      case "year": return cost.amount / 12;
      default: return cost.amount;
    }
  };

  // Excel import handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
      setImportRows(json);
      setImportOpen(true);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleImport = async () => {
    if (!importRows.length) return;
    setImporting(true);
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      // Маппим колонки Excel -> наши поля
      const rows = importRows.map((r) => ({
        name: r["Название"] || r["name"] || r["наименование"] || r["Наименование"] || "",
        amount: r["Сумма"] || r["amount"] || r["сумма"] || "0",
        period: r["Период"] || r["period"] || r["период"] || "month",
        category: r["Категория"] || r["category"] || r["категория"] || "",
        comment: r["Комментарий"] || r["comment"] || r["комментарий"] || "",
      }));
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "import_fixed_costs", rows }) });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success(`Импортировано: ${data.inserted} статей`);
      setImportOpen(false);
      setImportRows([]);
      load();
    } catch {
      toast.error("Ошибка импорта");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Название", "Сумма", "Период", "Категория", "Комментарий"],
      ["Аренда офиса", "50000", "month", "Аренда", ""],
      ["Зарплата директора", "100000", "month", "Зарплата", ""],
      ["Интернет", "3000", "month", "Связь и интернет", ""],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Расходы");
    XLSX.writeFile(wb, "шаблон_постоянные_расходы.xlsx");
  };

  // Фильтрация статей
  const filteredCosts = fixedCosts.filter((c) => {
    if (filterCategory !== "all" && (c.category || "Прочее") !== filterCategory) return false;
    return true;
  });

  // Уникальные категории для фильтра
  const allCategories = Array.from(new Set(fixedCosts.map((c) => c.category || "Прочее")));

  const bepProgress = economics && economics.bep_revenue > 0
    ? Math.min((economics.month_revenue / economics.bep_revenue) * 100, 100)
    : 0;
  const isAboveBep = economics ? economics.month_revenue >= economics.bep_revenue : false;

  // Метки для переключателей периода (месяц/неделя)
  const periodLabels = filterPeriodType === "month"
    ? [-2, -1, 0].map((o) => ({ offset: o, label: getMonthLabel(o) }))
    : [-2, -1, 0].map((o) => ({ offset: o, label: getWeekLabel(o) }));

  if (loading) {
    return <div className="text-center py-16 text-muted-foreground text-sm">Загрузка...</div>;
  }

  const econ = economics;

  const summaryRows = econ ? [
    { label: "Выручка (текущий месяц)", value: fmt(econ.month_revenue), icon: "TrendingUp", color: "text-green-600" },
    { label: "Постоянные расходы (в месяц)", value: fmt(econ.monthly_fixed), icon: "Building2", color: "text-slate-600" },
    { label: "Переменные расходы (текущий месяц)", value: fmt(econ.month_variable), icon: "TrendingDown", color: "text-orange-600" },
    { label: "Валовая прибыль", value: fmt(econ.gross_profit), icon: "DollarSign", color: econ.gross_profit >= 0 ? "text-green-600" : "text-red-600", sub: `Маржинальность: ${econ.margin_pct}%` },
    { label: "Операционная прибыль", value: fmt(econ.operating_profit), icon: "BarChart2", color: econ.operating_profit >= 0 ? "text-green-600" : "text-red-600" },
    { label: "Средний чек", value: fmt(econ.avg_check), icon: "Receipt", color: "text-blue-600", sub: `Платежей в месяц: ${econ.closed_orders_month}` },
    { label: "Точка безубыточности", value: fmt(econ.bep_revenue), icon: "Target", color: "text-purple-600", sub: `≈ ${econ.bep_orders} платежей в месяц` },
    { label: "Запас прочности", value: `${econ.safety_margin_pct > 0 ? "+" : ""}${econ.safety_margin_pct}%`, icon: "Shield", color: econ.safety_margin_pct >= 0 ? "text-green-600" : "text-red-600", sub: econ.safety_margin_pct >= 0 ? "Выше точки безубыточности" : "Ниже точки безубыточности" },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Фильтры периода */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${filterPeriodType === "month" ? "bg-blue-500 text-white" : "bg-white text-muted-foreground hover:bg-muted/50"}`}
            onClick={() => { setFilterPeriodType("month"); setFilterOffset(0); }}
          >По месяцам</button>
          <button
            className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-border ${filterPeriodType === "week" ? "bg-blue-500 text-white" : "bg-white text-muted-foreground hover:bg-muted/50"}`}
            onClick={() => { setFilterPeriodType("week"); setFilterOffset(0); }}
          >По неделям</button>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="h-7 w-7 flex items-center justify-center rounded border border-border bg-white hover:bg-muted/50 text-muted-foreground"
            onClick={() => setFilterOffset((o) => o - 1)}
          >
            <Icon name="ChevronLeft" size={14} />
          </button>
          <span className="text-sm font-medium min-w-[160px] text-center">
            {filterPeriodType === "month" ? getMonthLabel(filterOffset) : getWeekLabel(filterOffset)}
          </span>
          <button
            className={`h-7 w-7 flex items-center justify-center rounded border border-border bg-white text-muted-foreground ${filterOffset >= 0 ? "opacity-40 cursor-not-allowed" : "hover:bg-muted/50"}`}
            onClick={() => filterOffset < 0 && setFilterOffset((o) => o + 1)}
          >
            <Icon name="ChevronRight" size={14} />
          </button>
        </div>
        <div className="text-xs text-muted-foreground">— выбранный период отображается в показателях</div>
      </div>

      {/* Сводная таблица ключевых показателей */}
      {econ ? (
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b flex items-center gap-2">
            <Icon name="BarChart3" size={16} className="text-slate-500" />
            <span className="font-semibold text-sm text-slate-700">Ключевые экономические показатели</span>
            <span className="text-xs text-muted-foreground ml-1">— текущий месяц</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="w-8"></TableHead>
                <TableHead>Показатель</TableHead>
                <TableHead className="text-right font-semibold">Значение</TableHead>
                <TableHead className="text-right text-muted-foreground text-xs">Примечание</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaryRows.map((row) => (
                <TableRow key={row.label} className="hover:bg-slate-50/50">
                  <TableCell className="py-2.5">
                    <Icon name={row.icon} size={15} className={row.color} />
                  </TableCell>
                  <TableCell className="py-2.5 text-sm font-medium">{row.label}</TableCell>
                  <TableCell className={`py-2.5 text-right font-bold text-base ${row.color}`}>{row.value}</TableCell>
                  <TableCell className="py-2.5 text-right text-xs text-muted-foreground">{row.sub || ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-xl border bg-white p-8 text-center text-muted-foreground text-sm">
          Нет данных для отображения — добавьте статьи расходов и поступления
        </div>
      )}

      {/* Прогресс-бар до точки безубыточности */}
      {econ && econ.bep_revenue > 0 && (
        <div className="rounded-xl border bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="Target" size={16} className="text-purple-500" />
              <span className="font-semibold text-sm">Прогресс до точки безубыточности</span>
            </div>
            <Badge variant={isAboveBep ? "default" : "destructive"} className={isAboveBep ? "bg-green-100 text-green-700 border-green-200" : ""}>
              {isAboveBep ? "Выше ТБУ" : "Ниже ТБУ"}
            </Badge>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 ₽</span>
              <span className="font-medium text-purple-600">ТБУ: {fmt(econ.bep_revenue)}</span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${isAboveBep ? "bg-green-500" : "bg-orange-400"}`} style={{ width: `${bepProgress}%` }} />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Выручка: <span className="font-semibold text-slate-700">{fmt(econ.month_revenue)}</span></span>
              <span className={isAboveBep ? "text-green-600 font-medium" : "text-orange-500 font-medium"}>{Math.round(bepProgress)}% от ТБУ</span>
            </div>
          </div>
        </div>
      )}

      {/* Постоянные расходы */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Icon name="Building2" size={16} className="text-slate-500" />
            <span className="font-semibold text-sm text-slate-700">Постоянные расходы</span>
            {fixedCosts.length > 0 && econ && (
              <span className="text-xs text-muted-foreground">— итого {fmt(econ.monthly_fixed)}/мес</span>
            )}
          </div>
          {/* Фильтр по категории */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-8 text-xs w-40">
              <SelectValue placeholder="Все категории" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              {allCategories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={downloadTemplate}>
              <Icon name="Download" size={13} className="mr-1" />
              Шаблон Excel
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => fileRef.current?.click()}>
              <Icon name="Upload" size={13} className="mr-1" />
              Импорт Excel
            </Button>
            <Button size="sm" onClick={openCreate} className="bg-blue-500 hover:bg-blue-600 text-white h-8 text-xs">
              <Icon name="Plus" size={13} className="mr-1" />
              Добавить
            </Button>
          </div>
        </div>

        {filteredCosts.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            <Icon name="Building2" size={32} className="mx-auto mb-2 opacity-30" />
            <p>{fixedCosts.length === 0 ? "Постоянные расходы не добавлены" : "Нет статей по выбранному фильтру"}</p>
            {fixedCosts.length === 0 && <p className="text-xs mt-1">Аренда, зарплата, лизинг и другие фиксированные платежи</p>}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead>Наименование</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
                <TableHead>Периодичность</TableHead>
                <TableHead className="text-right">В месяц</TableHead>
                <TableHead className="hidden lg:table-cell">Комментарий</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCosts.map((cost) => (
                <TableRow key={cost.id} className={`hover:bg-slate-50/50 ${!cost.is_active ? "opacity-40" : ""}`}>
                  <TableCell className="font-medium text-sm">{cost.name}</TableCell>
                  <TableCell>
                    {cost.category ? (
                      <Badge variant="outline" className="text-xs font-normal">{cost.category}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">{fmt(cost.amount)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{PERIODS[cost.period] || cost.period}</TableCell>
                  <TableCell className="text-right text-sm font-medium text-slate-700">
                    {cost.period !== "month" ? fmt(monthlyAmount(cost)) : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate hidden lg:table-cell">
                    {cost.comment || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="icon" variant="ghost" className="h-7 w-7" title={cost.is_active ? "Деактивировать" : "Активировать"} onClick={() => handleToggle(cost)}>
                        <Icon name={cost.is_active ? "Eye" : "EyeOff"} size={13} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(cost)}>
                        <Icon name="Pencil" size={13} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => handleDelete(cost)}>
                        <Icon name="Trash2" size={13} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Диалог создания/редактирования */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCost ? "Редактировать статью" : "Новая статья расходов"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Наименование *</Label>
              <Input placeholder="Например: Аренда помещения" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Сумма *</Label>
                <Input type="number" placeholder="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Периодичность</Label>
                <Select value={form.period} onValueChange={(v) => setForm((f) => ({ ...f, period: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PERIODS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Категория</Label>
              <Select value={form.category || "_none"} onValueChange={(v) => setForm((f) => ({ ...f, category: v === "_none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Выберите категорию" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Без категории</SelectItem>
                  {CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Комментарий</Label>
              <Input placeholder="Необязательно" value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleSave} disabled={submitting} className="bg-blue-500 hover:bg-blue-600 text-white">
              {submitting ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог предпросмотра Excel импорта */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Импорт из Excel — предпросмотр</DialogTitle>
          </DialogHeader>
          <div className="text-xs text-muted-foreground mb-2">
            Найдено строк: <strong>{importRows.length}</strong>. Колонки: Название, Сумма, Период (day/week/month/year), Категория, Комментарий.
          </div>
          <div className="max-h-64 overflow-y-auto border rounded-lg">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  {importRows[0] && Object.keys(importRows[0]).map((k) => (
                    <th key={k} className="px-3 py-2 text-left font-medium text-muted-foreground border-b">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {importRows.slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="px-3 py-1.5 text-foreground">{String(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {importRows.length > 20 && (
            <div className="text-xs text-muted-foreground text-center">... и ещё {importRows.length - 20} строк</div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setImportOpen(false); setImportRows([]); }}>Отмена</Button>
            <Button onClick={handleImport} disabled={importing} className="bg-blue-500 hover:bg-blue-600 text-white">
              {importing ? "Импорт..." : `Импортировать ${importRows.length} строк`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
