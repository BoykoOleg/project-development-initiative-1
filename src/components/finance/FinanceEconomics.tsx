import { useState, useEffect, useCallback } from "react";
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

const pct = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;

const emptyForm = {
  name: "",
  amount: "",
  period: "month",
  category: "",
  comment: "",
};

export default function FinanceEconomics() {
  const [economics, setEconomics] = useState<Economics | null>(null);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<FixedCost | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

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
      setEconomics(econData);
      setFixedCosts(costsData.fixed_costs || []);
    } catch {
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
        ? {
            action: "update_fixed_cost",
            id: editingCost.id,
            name: form.name,
            amount: Number(form.amount),
            period: form.period,
            category: form.category || null,
            comment: form.comment || null,
          }
        : {
            action: "create_fixed_cost",
            name: form.name,
            amount: Number(form.amount),
            period: form.period,
            category: form.category || null,
            comment: form.comment || null,
          };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success(editingCost ? "Расход обновлён" : "Расход добавлен");
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
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_fixed_cost", id: cost.id }),
      });
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
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_fixed_cost", id: cost.id, is_active: !cost.is_active }),
      });
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

  const bepProgress =
    economics && economics.bep_revenue > 0
      ? Math.min((economics.month_revenue / economics.bep_revenue) * 100, 100)
      : 0;

  const isAboveBep = economics ? economics.month_revenue >= economics.bep_revenue : false;

  if (loading) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        Загрузка...
      </div>
    );
  }

  const econ = economics!;

  const summaryRows = [
    {
      label: "Выручка (текущий месяц)",
      value: fmt(econ.month_revenue),
      icon: "TrendingUp",
      color: "text-green-600",
    },
    {
      label: "Постоянные расходы (в месяц)",
      value: fmt(econ.monthly_fixed),
      icon: "Building2",
      color: "text-slate-600",
    },
    {
      label: "Переменные расходы (текущий месяц)",
      value: fmt(econ.month_variable),
      icon: "TrendingDown",
      color: "text-orange-600",
    },
    {
      label: "Валовая прибыль",
      value: fmt(econ.gross_profit),
      icon: "DollarSign",
      color: econ.gross_profit >= 0 ? "text-green-600" : "text-red-600",
      sub: `Маржинальность: ${econ.margin_pct}%`,
    },
    {
      label: "Операционная прибыль",
      value: fmt(econ.operating_profit),
      icon: "BarChart2",
      color: econ.operating_profit >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      label: "Средний чек",
      value: fmt(econ.avg_check),
      icon: "Receipt",
      color: "text-blue-600",
      sub: `Закрыто заказов: ${econ.closed_orders_month}`,
    },
    {
      label: "Точка безубыточности",
      value: fmt(econ.bep_revenue),
      icon: "Target",
      color: "text-purple-600",
      sub: `≈ ${econ.bep_orders} заказов в месяц`,
    },
    {
      label: "Запас прочности",
      value: `${econ.safety_margin_pct > 0 ? "+" : ""}${econ.safety_margin_pct}%`,
      icon: "Shield",
      color: econ.safety_margin_pct >= 0 ? "text-green-600" : "text-red-600",
      sub:
        econ.safety_margin_pct >= 0
          ? "Выше точки безубыточности"
          : "Ниже точки безубыточности",
    },
  ];

  const groupedCosts: Record<string, FixedCost[]> = {};
  fixedCosts.forEach((c) => {
    const key = c.category || "Прочее";
    if (!groupedCosts[key]) groupedCosts[key] = [];
    groupedCosts[key].push(c);
  });

  return (
    <div className="space-y-6">
      {/* Сводная таблица ключевых показателей */}
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
                <TableCell className={`py-2.5 text-right font-bold text-base ${row.color}`}>
                  {row.value}
                </TableCell>
                <TableCell className="py-2.5 text-right text-xs text-muted-foreground">
                  {row.sub || ""}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Прогресс-бар до точки безубыточности */}
      {econ.bep_revenue > 0 && (
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
              <div
                className={`h-full rounded-full transition-all ${isAboveBep ? "bg-green-500" : "bg-orange-400"}`}
                style={{ width: `${bepProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                Выручка: <span className="font-semibold text-slate-700">{fmt(econ.month_revenue)}</span>
              </span>
              <span className={isAboveBep ? "text-green-600 font-medium" : "text-orange-500 font-medium"}>
                {Math.round(bepProgress)}% от ТБУ
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Список постоянных расходов */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Building2" size={16} className="text-slate-500" />
            <span className="font-semibold text-sm text-slate-700">Постоянные расходы</span>
            {fixedCosts.length > 0 && (
              <span className="text-xs text-muted-foreground">
                — итого {fmt(econ.monthly_fixed)}/мес
              </span>
            )}
          </div>
          <Button size="sm" onClick={openCreate} className="bg-blue-500 hover:bg-blue-600 text-white h-8">
            <Icon name="Plus" size={14} className="mr-1" />
            Добавить
          </Button>
        </div>

        {fixedCosts.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            <Icon name="Building2" size={32} className="mx-auto mb-2 opacity-30" />
            <p>Постоянные расходы не добавлены</p>
            <p className="text-xs mt-1">Аренда, зарплата, лизинг и другие фиксированные платежи</p>
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
                <TableHead>Комментарий</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fixedCosts.map((cost) => (
                <TableRow
                  key={cost.id}
                  className={`hover:bg-slate-50/50 ${!cost.is_active ? "opacity-40" : ""}`}
                >
                  <TableCell className="font-medium text-sm">{cost.name}</TableCell>
                  <TableCell>
                    {cost.category ? (
                      <Badge variant="outline" className="text-xs font-normal">
                        {cost.category}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {fmt(cost.amount)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {PERIODS[cost.period] || cost.period}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium text-slate-700">
                    {cost.period !== "month" ? fmt(monthlyAmount(cost)) : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                    {cost.comment || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title={cost.is_active ? "Деактивировать" : "Активировать"}
                        onClick={() => handleToggle(cost)}
                      >
                        <Icon name={cost.is_active ? "Eye" : "EyeOff"} size={13} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => openEdit(cost)}
                      >
                        <Icon name="Pencil" size={13} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(cost)}
                      >
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
            <DialogTitle>
              {editingCost ? "Редактировать расход" : "Новый постоянный расход"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Наименование *</Label>
              <Input
                placeholder="Например: Аренда помещения"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Сумма *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Периодичность</Label>
                <Select
                  value={form.period}
                  onValueChange={(v) => setForm((f) => ({ ...f, period: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
              <Select
                value={form.category || "_none"}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v === "_none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Без категории</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Комментарий</Label>
              <Input
                placeholder="Необязательно"
                value={form.comment}
                onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
            <Button
              onClick={handleSave}
              disabled={submitting}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {submitting ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}