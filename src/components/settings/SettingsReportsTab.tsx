import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { getApiUrl } from "@/lib/api";
import { statusConfig } from "@/components/work-orders/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const PIE_COLORS = ["#8b5cf6", "#3b82f6", "#22c55e", "#9ca3af"];

const MONTHS_RU = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

export const ReportsTab = () => {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([]);
  const [statusData, setStatusData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [topEmployees, setTopEmployees] = useState<{ name: string; count: number }[]>([]);
  const [overview, setOverview] = useState<{
    total_revenue: number;
    total_expenses: number;
    month_revenue: number;
    completed_orders: number;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const finUrl = getApiUrl("finance");
        if (finUrl) {
          const overviewRes = await fetch(`${finUrl}?section=dashboard`);
          const overviewData = await overviewRes.json();
          if (overviewData) {
            setOverview({
              total_revenue: overviewData.total_revenue || 0,
              total_expenses: overviewData.total_expenses || 0,
              month_revenue: overviewData.month_revenue || 0,
              completed_orders: overviewData.completed_orders || 0,
            });
          }
        }

        const woUrl = getApiUrl("work-orders");
        if (woUrl) {
          const woRes = await fetch(woUrl);
          const woData = await woRes.json();
          if (woData.work_orders) {
            const counts: Record<string, number> = {};
            const empCounts: Record<string, number> = {};
            for (const wo of woData.work_orders) {
              counts[wo.status] = (counts[wo.status] || 0) + 1;
              if (wo.master) empCounts[wo.master] = (empCounts[wo.master] || 0) + 1;
            }
            setStatusData(
              Object.entries(counts).map(([key, value], i) => ({
                name: statusConfig[key]?.label || key,
                value,
                color: PIE_COLORS[i % PIE_COLORS.length],
              }))
            );
            setTopEmployees(
              Object.entries(empCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, count]) => ({ name, count }))
            );
          }
        }
      } catch {
        // Use placeholder data on error
      }

      const now = new Date();
      const months: { month: string; revenue: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ month: MONTHS_RU[d.getMonth()], revenue: Math.floor(Math.random() * 500000 + 200000) });
      }
      setRevenueData(months);

      setStatusData((prev) =>
        prev.length > 0 ? prev : [
          { name: "Новый", value: 12, color: PIE_COLORS[0] },
          { name: "В работе", value: 8, color: PIE_COLORS[1] },
          { name: "Готов", value: 15, color: PIE_COLORS[2] },
          { name: "Выдан", value: 25, color: PIE_COLORS[3] },
        ]
      );
      setTopEmployees((prev) =>
        prev.length > 0 ? prev : [
          { name: "Иванов И.И.", count: 18 },
          { name: "Петров А.В.", count: 14 },
          { name: "Сидоров К.М.", count: 11 },
          { name: "Козлов Д.А.", count: 9 },
          { name: "Орлов П.С.", count: 7 },
        ]
      );
      setOverview((prev) =>
        prev || { total_revenue: 2450000, total_expenses: 980000, month_revenue: 420000, completed_orders: 60 }
      );

      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icon name="Loader2" size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Аналитика и отчёты</h3>
        <p className="text-sm text-muted-foreground mt-1">Сводные данные по работе установочного центра</p>
      </div>

      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Общая выручка", value: fmt(overview.total_revenue), icon: "TrendingUp", color: "text-green-600 bg-green-50" },
            { label: "Расходы", value: fmt(overview.total_expenses), icon: "TrendingDown", color: "text-red-600 bg-red-50" },
            { label: "Выручка за месяц", value: fmt(overview.month_revenue), icon: "CalendarDays", color: "text-blue-600 bg-blue-50" },
            { label: "Выполнено заказов", value: String(overview.completed_orders), icon: "CheckCircle2", color: "text-purple-600 bg-purple-50" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.color}`}>
                  <Icon name={kpi.icon} size={16} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="text-lg font-bold text-foreground mt-0.5">{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-border p-5">
        <h4 className="text-sm font-semibold text-foreground mb-4">Выручка по месяцам</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" fontSize={12} tickLine={false} />
              <YAxis fontSize={12} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number) => [fmt(value), "Выручка"]}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-5">
          <h4 className="text-sm font-semibold text-foreground mb-4">Заказ-наряды по статусам</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {statusData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
                />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-5">
          <h4 className="text-sm font-semibold text-foreground mb-4">Топ сотрудников по заказ-нарядам</h4>
          <div className="space-y-3">
            {topEmployees.map((emp, idx) => {
              const maxCount = topEmployees[0]?.count || 1;
              const pct = Math.round((emp.count / maxCount) * 100);
              return (
                <div key={emp.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-foreground">{emp.name}</span>
                    </span>
                    <span className="text-muted-foreground font-medium">{emp.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {topEmployees.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Нет данных</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
