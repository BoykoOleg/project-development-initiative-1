import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Icon from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";

interface ExpenseGroupItem {
  id: number;
  name: string;
  parent_id: number | null;
  cost_type: "fixed" | "variable";
  total_spent: number;
  expense_count: number;
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
  expense_groups: ExpenseGroupItem[];
  month_start: string;
  services_revenue: number;
  parts_revenue: number;
  parts_cost: number;
  total_revenue_orders: number;
  services_share: number;
  parts_share: number;
  gross_profit_parts: number;
  parts_margin_pct: number;
  parts_ratio_to_services: number;
  avg_check_services: number;
  avg_check_parts: number;
  avg_revenue_per_day: number;
  revenue_forecast: number;
  total_orders: number;
  unique_clients: number;
  repeat_clients_orders: number;
  new_clients_orders: number;
  repeat_rate: number;
  new_clients_rate: number;
  orders_per_day: number;
  norm_hours_closed: number;
  norm_hours_sold: number;
  norm_hour_rate: number;
  avg_norm_hours_per_order: number;
  cash_amount: number;
  card_amount: number;
  bank_amount: number;
  sbp_amount: number;
  cash_share: number;
  card_share: number;
  bank_share: number;
  days_in_month: number;
  days_passed: number;
  working_days: number;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(v) + " ₽";

function getMonthLabel(offset: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
}

const COLOR_MAP: Record<string, string> = {
  green: "text-green-500",
  blue: "text-blue-500",
  orange: "text-orange-500",
  slate: "text-slate-500",
  purple: "text-purple-500",
};

function KpiSection({ title, icon, color, children }: { title: string; icon: string; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="px-5 py-3 bg-slate-50 border-b flex items-center gap-2">
        <Icon name={icon} size={16} className={COLOR_MAP[color] || "text-slate-500"} />
        <span className="font-semibold text-sm text-slate-700">{title}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 divide-x divide-y divide-border">
        {children}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, highlight, positive, muted }: {
  label: string; value: string; sub?: string; highlight?: boolean; positive?: boolean; muted?: boolean;
}) {
  const valueColor = positive === undefined
    ? (highlight ? "text-slate-800" : muted ? "text-muted-foreground" : "text-slate-700")
    : (positive ? "text-green-600" : "text-red-600");
  return (
    <div className="p-4 flex flex-col gap-0.5">
      <div className="text-xs text-muted-foreground leading-tight">{label}</div>
      <div className={`text-base font-bold leading-tight ${valueColor}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

interface GroupExpense {
  id: number;
  amount: number;
  comment: string;
  created_at: string;
  operation_date?: string | null;
  client_name?: string | null;
  cashbox_name: string;
}

// ── Колонка групп расходов (постоянные или переменные) ─────────────────────────
function ExpenseGroupColumn({
  title,
  colorClass,
  bgClass,
  groups,
  monthOffset,
  isDragOver,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onGroupDragStart,
  onGroupDragEnd,
}: {
  title: string;
  colorClass: string;
  bgClass: string;
  groups: ExpenseGroupItem[];
  monthOffset: number;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onGroupDragStart: (e: React.DragEvent, group: ExpenseGroupItem) => void;
  onGroupDragEnd: () => void;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [groupExpenses, setGroupExpenses] = useState<Record<number, GroupExpense[]>>({});
  const [loadingGroups, setLoadingGroups] = useState<Set<number>>(new Set());
  const [loadedGroups, setLoadedGroups] = useState<Set<number>>(new Set());
  const [expandedExpenses, setExpandedExpenses] = useState<Set<number>>(new Set());

  useEffect(() => {
    setGroupExpenses({});
    setLoadedGroups(new Set());
    setExpandedExpenses(new Set());
  }, [monthOffset]);

  const roots = groups.filter((g) => g.parent_id === null || g.parent_id === undefined);
  const children = (parentId: number) => groups.filter((g) => g.parent_id === parentId);

  const toggle = (id: number) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const toggleExpenses = async (id: number) => {
    if (!loadedGroups.has(id)) {
      setLoadingGroups((prev) => new Set(prev).add(id));
      try {
        const url = getApiUrl("finance");
        const res = await fetch(`${url}?section=expenses_by_group&group_id=${id}&month_offset=${monthOffset}`);
        const data = await res.json();
        if (data.expenses) setGroupExpenses((prev) => ({ ...prev, [id]: data.expenses }));
        setLoadedGroups((prev) => new Set(prev).add(id));
      } catch { /* ignore */ } finally {
        setLoadingGroups((prev) => { const next = new Set(prev); next.delete(id); return next; });
      }
    }
    setExpandedExpenses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const total = roots.reduce((sum, g) => {
    const childSum = children(g.id).reduce((s, c) => s + Number(c.total_spent), 0);
    return sum + Number(g.total_spent) + childSum;
  }, 0);

  return (
    <div
      className={`rounded-xl border overflow-hidden flex flex-col transition-all ${isDragOver ? "ring-2 ring-blue-400 bg-blue-50/30" : "bg-white"}`}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className={`px-4 py-3 border-b flex items-center justify-between ${bgClass}`}>
        <div className="flex items-center gap-2">
          <Icon name="PieChart" size={15} className={colorClass} />
          <span className={`font-semibold text-sm ${colorClass}`}>{title}</span>
          {isDragOver && <span className="text-xs text-blue-500 animate-pulse">Перетащи сюда</span>}
        </div>
        <span className={`text-sm font-bold ${colorClass}`}>{fmt(total)}</span>
      </div>

      {roots.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-muted-foreground text-xs gap-1.5 border-2 border-dashed border-transparent">
          <Icon name="FolderOpen" size={24} className="opacity-30" />
          <span>Перетащи группы сюда</span>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="w-6 pl-2"></TableHead>
              <TableHead className="text-xs py-2">Группа</TableHead>
              <TableHead className="text-right text-xs py-2">Расходов</TableHead>
              <TableHead className="text-right text-xs py-2 pr-8">Сумма</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roots.map((group) => {
              const subs = children(group.id);
              const isOpen = expanded.has(group.id);
              const isExpensesOpen = expandedExpenses.has(group.id);
              const isLoadingExpenses = loadingGroups.has(group.id);
              const expenses = groupExpenses[group.id] || [];
              const subsTotal = subs.reduce((s, c) => s + Number(c.total_spent), 0);
              const groupTotal = Number(group.total_spent) + subsTotal;
              return (
                <React.Fragment key={group.id}>
                  <TableRow
                    className="hover:bg-slate-50/50 cursor-grab active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => onGroupDragStart(e, group)}
                    onDragEnd={onGroupDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => subs.length > 0 && toggle(group.id)}
                  >
                    <TableCell className="py-2 pl-2 text-center">
                      <Icon name="GripVertical" size={13} className="text-muted-foreground/50" />
                    </TableCell>
                    <TableCell className="py-2 text-sm font-semibold">
                      <div className="flex items-center gap-1.5">
                        {subs.length > 0 && (
                          <Icon name={isOpen ? "ChevronDown" : "ChevronRight"} size={13} className="text-muted-foreground shrink-0" />
                        )}
                        {group.name}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-right text-xs text-muted-foreground">
                      {group.expense_count + subs.reduce((s, c) => s + Number(c.expense_count), 0)}
                    </TableCell>
                    <TableCell className="py-2 text-right pr-2">
                      <div className="flex items-center justify-end gap-1">
                        <span className={`font-bold text-sm ${colorClass}`}>{fmt(groupTotal)}</span>
                        <button
                          className="text-muted-foreground hover:text-orange-600 transition-colors p-0.5 rounded ml-1"
                          title="Показать расходы"
                          onClick={(e) => { e.stopPropagation(); toggleExpenses(group.id); }}
                        >
                          {isLoadingExpenses
                            ? <Icon name="Loader2" size={12} className="animate-spin" />
                            : <Icon name={isExpensesOpen ? "ChevronUp" : "List"} size={12} />}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {isOpen && subs.map((sub) => {
                    const isSubExpensesOpen = expandedExpenses.has(sub.id);
                    const isSubLoading = loadingGroups.has(sub.id);
                    const subExpenses = groupExpenses[sub.id] || [];
                    return (
                      <React.Fragment key={sub.id}>
                        <TableRow className="bg-slate-50/30 hover:bg-slate-50">
                          <TableCell className="py-1.5 pl-2"></TableCell>
                          <TableCell className="py-1.5 text-xs text-muted-foreground pl-6">↳ {sub.name}</TableCell>
                          <TableCell className="py-1.5 text-right text-xs text-muted-foreground">{sub.expense_count}</TableCell>
                          <TableCell className="py-1.5 text-right pr-2">
                            <div className="flex items-center justify-end gap-1">
                              <span className={`text-xs font-medium ${colorClass} opacity-80`}>{fmt(Number(sub.total_spent))}</span>
                              <button
                                className="text-muted-foreground hover:text-orange-600 p-0.5 rounded"
                                onClick={(e) => { e.stopPropagation(); toggleExpenses(sub.id); }}
                              >
                                {isSubLoading
                                  ? <Icon name="Loader2" size={11} className="animate-spin" />
                                  : <Icon name={isSubExpensesOpen ? "ChevronUp" : "List"} size={11} />}
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isSubExpensesOpen && (
                          <TableRow key={`sub-exp-${sub.id}`} className="bg-slate-50/20">
                            <TableCell colSpan={4} className="p-0">
                              <div className="border-t border-dashed border-border">
                                {subExpenses.length === 0 ? (
                                  <div className="px-8 py-2 text-xs text-muted-foreground">Расходов нет</div>
                                ) : (
                                  <table className="w-full">
                                    <tbody>
                                      {subExpenses.map((e) => (
                                        <tr key={e.id} className="border-b border-dashed border-border last:border-0 hover:bg-slate-100/50">
                                          <td className="pl-10 pr-2 py-1.5 text-xs text-muted-foreground whitespace-nowrap">{new Date(e.operation_date || e.created_at).toLocaleDateString("ru-RU")}</td>
                                          <td className="px-2 py-1.5 text-xs">{e.comment || e.client_name || "—"}</td>
                                          <td className="px-4 py-1.5 text-xs font-semibold text-right text-orange-600 whitespace-nowrap">-{fmt(Number(e.amount))}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {isExpensesOpen && (
                    <TableRow key={`exp-${group.id}`} className="bg-orange-50/20">
                      <TableCell colSpan={4} className="p-0">
                        <div className="border-t border-dashed border-border">
                          {expenses.length === 0 ? (
                            <div className="px-6 py-2 text-xs text-muted-foreground">Расходов нет</div>
                          ) : (
                            <table className="w-full">
                              <tbody>
                                {expenses.map((e) => (
                                  <tr key={e.id} className="border-b border-dashed border-border last:border-0 hover:bg-orange-50/40">
                                    <td className="pl-6 pr-2 py-1.5 text-xs text-muted-foreground whitespace-nowrap">{new Date(e.operation_date || e.created_at).toLocaleDateString("ru-RU")}</td>
                                    <td className="px-2 py-1.5 text-xs">{e.comment || e.client_name || "—"}</td>
                                    <td className="px-4 py-1.5 text-xs font-semibold text-right text-orange-600 whitespace-nowrap">-{fmt(Number(e.amount))}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// ── Блок с двумя колонками + drag & drop ──────────────────────────────────────
function ExpenseGroupsBlock({ groups: initialGroups, monthLabel, monthOffset }: {
  groups: ExpenseGroupItem[];
  monthLabel: string;
  monthOffset: number;
}) {
  const [overrides, setOverrides] = useState<Record<number, "fixed" | "variable">>({});
  const [dragOverTarget, setDragOverTarget] = useState<"fixed" | "variable" | null>(null);
  // Счётчики входов для корректной работы dragLeave при наличии дочерних элементов
  const dragCounters = useRef<Record<string, number>>({ fixed: 0, variable: 0 });
  const draggingGroup = useRef<{ id: number; name: string; costType: "fixed" | "variable" } | null>(null);

  const groups = initialGroups.map((g) =>
    overrides[g.id] !== undefined ? { ...g, cost_type: overrides[g.id] } : g
  );

  const fixedGroups = groups.filter((g) => (g.cost_type || "variable") === "fixed" && (g.parent_id === null || g.parent_id === undefined));
  const variableGroups = groups.filter((g) => (g.cost_type || "variable") === "variable" && (g.parent_id === null || g.parent_id === undefined));

  const handleDragStart = (e: React.DragEvent, group: ExpenseGroupItem) => {
    const costType = (overrides[group.id] ?? group.cost_type ?? "variable") as "fixed" | "variable";
    draggingGroup.current = { id: group.id, name: group.name, costType };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(group.id));
  };

  const handleDragEnd = () => {
    dragCounters.current = { fixed: 0, variable: 0 };
    setDragOverTarget(null);
  };

  const makeDragOver = (col: "fixed" | "variable") => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverTarget !== col) setDragOverTarget(col);
  };

  const makeDragEnter = (col: "fixed" | "variable") => (e: React.DragEvent) => {
    e.preventDefault();
    dragCounters.current[col] = (dragCounters.current[col] || 0) + 1;
    setDragOverTarget(col);
  };

  const makeDragLeave = (col: "fixed" | "variable") => () => {
    dragCounters.current[col] = Math.max(0, (dragCounters.current[col] || 0) - 1);
    if (dragCounters.current[col] === 0) setDragOverTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, targetType: "fixed" | "variable") => {
    e.preventDefault();
    dragCounters.current = { fixed: 0, variable: 0 };
    setDragOverTarget(null);

    const g = draggingGroup.current;
    draggingGroup.current = null;
    if (!g || g.costType === targetType) return;

    // Применяем override для root-группы и всех её дочерних
    const childIds = initialGroups
      .filter((x) => x.parent_id === g.id)
      .map((x) => x.id);
    setOverrides((prev) => {
      const next = { ...prev, [g.id]: targetType };
      childIds.forEach((id) => { next[id] = targetType; });
      return next;
    });

    try {
      const url = getApiUrl("finance");
      const res = await fetch(url!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_expense_group", group_id: g.id, cost_type: targetType }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error("Ошибка переноса группы");
        setOverrides((prev) => {
          const next = { ...prev };
          delete next[g.id];
          childIds.forEach((id) => delete next[id]);
          return next;
        });
      } else {
        toast.success(`«${g.name}» → ${targetType === "fixed" ? "постоянные" : "переменные"}`);
      }
    } catch {
      toast.error("Ошибка соединения");
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[g.id];
        childIds.forEach((id) => delete next[id]);
        return next;
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Icon name="PieChart" size={15} className="text-slate-400" />
        <span className="font-semibold text-sm text-slate-700">Расходы по группам</span>
        <span className="text-xs text-muted-foreground">— {monthLabel}</span>
        <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
          <Icon name="GripVertical" size={12} />
          Перетащи группу для смены типа
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ExpenseGroupColumn
          title="Постоянные расходы"
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
          groups={[
            ...fixedGroups,
            ...groups.filter((g) => (g.cost_type || "variable") === "fixed" && g.parent_id !== null && g.parent_id !== undefined),
          ]}
          monthOffset={monthOffset}
          isDragOver={dragOverTarget === "fixed"}
          onDragOver={makeDragOver("fixed")}
          onDragEnter={makeDragEnter("fixed")}
          onDragLeave={makeDragLeave("fixed")}
          onDrop={(e) => handleDrop(e, "fixed")}
          onGroupDragStart={handleDragStart}
          onGroupDragEnd={handleDragEnd}
        />
        <ExpenseGroupColumn
          title="Переменные расходы"
          colorClass="text-orange-600"
          bgClass="bg-orange-50"
          groups={[
            ...variableGroups,
            ...groups.filter((g) => (g.cost_type || "variable") === "variable" && g.parent_id !== null && g.parent_id !== undefined),
          ]}
          monthOffset={monthOffset}
          isDragOver={dragOverTarget === "variable"}
          onDragOver={makeDragOver("variable")}
          onDragEnter={makeDragEnter("variable")}
          onDragLeave={makeDragLeave("variable")}
          onDrop={(e) => handleDrop(e, "variable")}
          onGroupDragStart={handleDragStart}
          onGroupDragEnd={handleDragEnd}
        />
      </div>
    </div>
  );
}

// ── Блок ВЕР (точки безубыточности) ───────────────────────────────────────────
function BepBlock({ econ }: { econ: Economics }) {
  const fmtNum = (v: number) => new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(v);
  const fmtPct = (v: number) => `${v.toFixed(1)}%`;

  // Маржинальная прибыль со среднего чека = avg_check * margin_pct / 100
  const marginPerCheck = econ.avg_check > 0
    ? econ.avg_check * (econ.margin_pct / 100)
    : 0;

  // ВЕР по заказ-нарядам = Постоянные / Маржинальная прибыль со среднего чека
  const bepOrders = marginPerCheck > 0
    ? Math.ceil(econ.monthly_fixed / marginPerCheck)
    : 0;

  // Маржинальная прибыль с одного клиента ≈ avg_check * (unique/orders) * margin_pct/100
  const ordersPerClient = econ.unique_clients > 0
    ? econ.closed_orders_month / econ.unique_clients
    : 1;
  const marginPerClient = marginPerCheck * ordersPerClient;

  // ВЕР по клиентам = Постоянные / Маржинальная прибыль с клиента
  const bepClients = marginPerClient > 0
    ? Math.ceil(econ.monthly_fixed / marginPerClient)
    : 0;

  // Маржинальная прибыль с дневной выручки = avg_revenue_per_day * margin_pct / 100
  const marginPerDay = econ.avg_revenue_per_day > 0
    ? econ.avg_revenue_per_day * (econ.margin_pct / 100)
    : 0;

  // ВЕР в днях = Постоянные / Маржинальная прибыль в день
  const bepDays = marginPerDay > 0
    ? Math.ceil(econ.monthly_fixed / marginPerDay)
    : 0;

  const isAboveBep = econ.month_revenue >= econ.bep_revenue;
  const bepProgress = econ.bep_revenue > 0
    ? Math.min((econ.month_revenue / econ.bep_revenue) * 100, 100)
    : 0;

  const currentOrders = econ.closed_orders_month;
  const currentClients = econ.unique_clients;
  const currentDays = econ.days_passed;

  const progressOrders = bepOrders > 0 ? Math.min((currentOrders / bepOrders) * 100, 100) : 0;
  const progressClients = bepClients > 0 ? Math.min((currentClients / bepClients) * 100, 100) : 0;
  const progressDays = bepDays > 0 ? Math.min((currentDays / bepDays) * 100, 100) : 0;

  const BepCard = ({
    label,
    formula,
    numerator,
    denominator,
    target,
    current,
    unit,
    progress,
    colorClass,
  }: {
    label: string;
    formula: string;
    numerator: string;
    denominator: string;
    target: number;
    current: number;
    unit: string;
    progress: number;
    colorClass: string;
  }) => {
    const done = current >= target && target > 0;
    return (
      <div className={`rounded-xl border bg-white overflow-hidden flex flex-col`}>
        <div className={`px-4 py-2.5 border-b flex items-center justify-between ${done ? "bg-green-50" : "bg-slate-50"}`}>
          <div className="flex items-center gap-2">
            <Icon name="Target" size={14} className={done ? "text-green-500" : "text-purple-500"} />
            <span className="font-semibold text-sm text-slate-700">{label}</span>
          </div>
          <Badge className={done ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}>
            {done ? "Достигнута" : "Не достигнута"}
          </Badge>
        </div>
        <div className="p-4 space-y-3 flex-1">
          {/* Формула */}
          <div className="bg-slate-50 rounded-lg px-4 py-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">{formula}</div>
            <div className="flex items-center justify-center gap-2">
              <div className="text-center">
                <div className="text-xs font-medium text-slate-600 border-b border-slate-300 pb-1 mb-1">{numerator}</div>
                <div className="text-xs text-muted-foreground">{denominator}</div>
              </div>
            </div>
          </div>
          {/* Результат */}
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {target > 0 ? fmtNum(target) : "—"}
                <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
              </div>
              <div className="text-xs text-muted-foreground">Нужно для безубыточности</div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${colorClass}`}>{fmtNum(current)}</div>
              <div className="text-xs text-muted-foreground">Сейчас</div>
            </div>
          </div>
          {/* Прогресс */}
          <div className="space-y-1">
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${done ? "bg-green-500" : progress > 70 ? "bg-yellow-400" : "bg-blue-400"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(progress)}% выполнено</span>
              {!done && target > 0 && (
                <span className="text-slate-500">Ещё {fmtNum(Math.max(0, target - current))} {unit}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Заголовок + общий прогресс */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Target" size={16} className="text-purple-500" />
            <span className="font-semibold text-sm text-slate-700">Точки безубыточности (ВЕР)</span>
          </div>
          <Badge className={isAboveBep ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}>
            {isAboveBep ? "Выше ТБУ" : "Ниже ТБУ"}
          </Badge>
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b">
          <div>
            <div className="text-xs text-muted-foreground">Постоянные расходы</div>
            <div className="text-base font-bold text-blue-600">{fmt(econ.monthly_fixed)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Маржа</div>
            <div className="text-base font-bold text-slate-700">{fmtPct(econ.margin_pct)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">ТБУ по выручке</div>
            <div className="text-base font-bold text-purple-600">{fmt(econ.bep_revenue)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Запас прочности</div>
            <div className={`text-base font-bold ${econ.safety_margin_pct >= 0 ? "text-green-600" : "text-red-600"}`}>
              {econ.safety_margin_pct > 0 ? "+" : ""}{fmtPct(econ.safety_margin_pct)}
            </div>
          </div>
        </div>
        <div className="px-5 py-3 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 ₽</span>
            <span className="text-purple-600 font-medium">ТБУ: {fmt(econ.bep_revenue)}</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isAboveBep ? "bg-green-500" : "bg-orange-400"}`}
              style={{ width: `${bepProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Текущая выручка: {fmt(econ.month_revenue)}</span>
            <span>{Math.round(bepProgress)}% от ТБУ</span>
          </div>
        </div>
      </div>

      {/* 3 карточки ВЕР */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BepCard
          label="ВЕР (заказ-наряды)"
          formula="Постоянные расходы ÷ Маржинальная прибыль со среднего чека"
          numerator={fmt(econ.monthly_fixed)}
          denominator={`${fmt(marginPerCheck)} / чек`}
          target={bepOrders}
          current={currentOrders}
          unit="заказов"
          progress={progressOrders}
          colorClass="text-blue-600"
        />
        <BepCard
          label="ВЕР (клиенты)"
          formula="Постоянные расходы ÷ Маржинальная прибыль с одного клиента"
          numerator={fmt(econ.monthly_fixed)}
          denominator={`${fmt(marginPerClient)} / клиент`}
          target={bepClients}
          current={currentClients}
          unit="клиентов"
          progress={progressClients}
          colorClass="text-purple-600"
        />
        <BepCard
          label="ВЕР (дни)"
          formula="Постоянные расходы ÷ Маржинальная прибыль с дневной выручки"
          numerator={fmt(econ.monthly_fixed)}
          denominator={`${fmt(marginPerDay)} / день`}
          target={bepDays}
          current={currentDays}
          unit="дней"
          progress={progressDays}
          colorClass="text-green-600"
        />
      </div>
    </div>
  );
}

export default function FinanceEconomics() {
  const [economics, setEconomics] = useState<Economics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterOffset, setFilterOffset] = useState(0);

  const loadData = useCallback(async (offset: number) => {
    const url = getApiUrl("finance");
    if (!url) return;
    setLoading(true);
    try {
      const econRes = await fetch(`${url}?section=economics&month_offset=${offset}`);
      const econData = await econRes.json();
      if (!econData.error) setEconomics(econData);
    } catch {
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  }, []);

  const load = useCallback(() => loadData(filterOffset), [loadData, filterOffset]);
  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="text-center py-16 text-muted-foreground text-sm">Загрузка...</div>;
  }

  const econ = economics;
  const monthLabel = getMonthLabel(filterOffset);
  const fmtPct = (v: number) => `${v.toFixed(1)}%`;
  const fmtNum = (v: number) => new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(v);

  return (
    <div className="space-y-6">
      {/* Переключатель месяца */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-white hover:bg-muted/50 text-muted-foreground"
            onClick={() => setFilterOffset((o) => o - 1)}
          >
            <Icon name="ChevronLeft" size={15} />
          </button>
          <span className="text-sm font-semibold min-w-[180px] text-center capitalize">
            {getMonthLabel(filterOffset)}
          </span>
          <button
            className={`h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-white text-muted-foreground ${filterOffset >= 0 ? "opacity-40 cursor-not-allowed" : "hover:bg-muted/50"}`}
            onClick={() => filterOffset < 0 && setFilterOffset((o) => o + 1)}
          >
            <Icon name="ChevronRight" size={15} />
          </button>
        </div>
        {econ && <span className="text-xs text-muted-foreground">Прошло дней: {econ.days_passed} из {econ.days_in_month}</span>}
      </div>

      {!econ ? (
        <div className="rounded-xl border bg-white p-8 text-center text-muted-foreground text-sm">
          Нет данных для отображения
        </div>
      ) : (<>

      {/* БЛОК 1: Выручка */}
      <KpiSection title="Выручка" icon="TrendingUp" color="green">
        <KpiCard label="Общая валовая выручка" value={fmt(econ.month_revenue)} sub={`Прогноз на месяц: ${fmt(econ.revenue_forecast)}`} highlight />
        <KpiCard label="Выручка от услуг" value={fmt(econ.services_revenue)} sub={`Доля: ${fmtPct(econ.services_share)}`} />
        <KpiCard label="Выручка от запчастей" value={fmt(econ.parts_revenue)} sub={`Доля: ${fmtPct(econ.parts_share)}`} />
        <KpiCard label="Выручка за рабочий день" value={fmt(econ.avg_revenue_per_day)} />
        <KpiCard label="Выручка прошлого месяца" value={fmt(econ.prev_month_revenue)} sub="Для сравнения" muted />
      </KpiSection>

      {/* БЛОК 2: Прибыль */}
      <KpiSection title="Прибыль и маржинальность" icon="DollarSign" color="blue">
        <KpiCard label="Валовая прибыль (GP)" value={fmt(econ.gross_profit)} sub={`Маржа: ${fmtPct(econ.margin_pct)}`} highlight positive={econ.gross_profit >= 0} />
        <KpiCard label="Операционная прибыль" value={fmt(econ.operating_profit)} sub={`Рентабельность: ${fmtPct(econ.month_revenue > 0 ? (econ.operating_profit / econ.month_revenue) * 100 : 0)}`} positive={econ.operating_profit >= 0} />
        <KpiCard label="Прибыль по запчастям" value={fmt(econ.gross_profit_parts)} sub={`Наценка: ${fmtPct(econ.parts_margin_pct)}`} positive={econ.gross_profit_parts >= 0} />
        <KpiCard label="Себестоимость запчастей" value={fmt(econ.parts_cost)} muted />
        <KpiCard label="Запчасти / Услуги" value={`${fmtPct(econ.parts_ratio_to_services)}`} sub="Коэффициент" />
      </KpiSection>

      {/* БЛОК 3: Расходы */}
      <KpiSection title="Расходы" icon="TrendingDown" color="orange">
        <KpiCard label="Постоянные расходы" value={fmt(econ.monthly_fixed)} sub="В месяц" highlight />
        <KpiCard label="Переменные расходы" value={fmt(econ.month_variable)} sub={monthLabel} />
        <KpiCard label="Итого расходов" value={fmt(econ.monthly_fixed + econ.month_variable)} />
      </KpiSection>

      {/* БЛОК 4: Точки безубыточности ВЕР */}
      {econ.bep_revenue > 0 && <BepBlock econ={econ} />}

      {/* БЛОК 5: Машинозаезды и клиенты */}
      <KpiSection title="Машинозаезды и клиенты" icon="Car" color="blue">
        <KpiCard label="Машинозаездов" value={fmtNum(econ.total_orders)} sub="Заказ-нарядов" highlight />
        <KpiCard label="Уникальных клиентов" value={fmtNum(econ.unique_clients)} />
        <KpiCard label="Повторные клиенты" value={fmtNum(econ.repeat_clients_orders)} sub={`${fmtPct(econ.repeat_rate)} от всех`} />
        <KpiCard label="Новые клиенты" value={fmtNum(econ.new_clients_orders)} sub={`${fmtPct(econ.new_clients_rate)} от всех`} />
        <KpiCard label="Заездов в день" value={fmtNum(econ.orders_per_day)} sub="Среднее" />
      </KpiSection>

      {/* БЛОК 6: Средний чек */}
      <KpiSection title="Средний чек" icon="Receipt" color="green">
        <KpiCard label="Средний чек (общий)" value={fmt(econ.avg_check)} highlight />
        <KpiCard label="Средний чек по услугам" value={fmt(econ.avg_check_services)} />
        <KpiCard label="Средний чек по запчастям" value={fmt(econ.avg_check_parts)} />
      </KpiSection>

      {/* БЛОК 7: Нормочасы */}
      {econ.norm_hours_closed > 0 && (
        <KpiSection title="Нормочасы" icon="Clock" color="slate">
          <KpiCard label="Закрыто нормочасов" value={`${fmtNum(econ.norm_hours_closed)} нч`} highlight />
          <KpiCard label="Продано нормочасов" value={`${fmtNum(econ.norm_hours_sold)} нч`} />
          <KpiCard label="Стоимость нормочаса" value={fmt(econ.norm_hour_rate)} sub="Фактическая" />
          <KpiCard label="Нч на заказ-наряд" value={`${fmtNum(econ.avg_norm_hours_per_order)} нч`} sub="Средняя наполняемость" />
        </KpiSection>
      )}

      {/* БЛОК 8: Структура оплат */}
      <KpiSection title="Структура поступлений" icon="Wallet" color="slate">
        <KpiCard label="Наличные" value={fmt(econ.cash_amount)} sub={fmtPct(econ.cash_share)} />
        <KpiCard label="Карта" value={fmt(econ.card_amount)} sub={fmtPct(econ.card_share)} />
        <KpiCard label="Банк (р/с)" value={fmt(econ.bank_amount)} sub={fmtPct(econ.bank_share)} />
        {econ.sbp_amount > 0 && <KpiCard label="СБП" value={fmt(econ.sbp_amount)} />}
      </KpiSection>

      </>)}

      {/* Расходы по группам — две колонки с drag & drop */}
      {econ && econ.expense_groups && econ.expense_groups.length > 0 && (
        <ExpenseGroupsBlock
          groups={econ.expense_groups}
          monthLabel={monthLabel}
          monthOffset={filterOffset}
        />
      )}

    </div>
  );
}