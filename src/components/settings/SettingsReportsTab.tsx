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

const PIE_COLORS = ["#8b5cf6", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#9ca3af"];

const MONTHS_RU: Record<string, string> = {
  "01": "Янв", "02": "Фев", "03": "Мар", "04": "Апр",
  "05": "Май", "06": "Июн", "07": "Июл", "08": "Авг",
  "09": "Сен", "10": "Окт", "11": "Ноя", "12": "Дек",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

interface EarningRow {
  id: number;
  name: string;
  orders_count: number;
  total_norm_hours: number;
  total_earned: number;
}

interface Overview {
  total_revenue: number;
  total_expenses: number;
  month_revenue: number;
  completed_orders: number;
  revenue_by_months: { month: string; revenue: number }[];
}

export const ReportsTab = () => {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([]);
  const [statusData, setStatusData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [topEmployees, setTopEmployees] = useState<{ name: string; count: number }[]>([]);
  const [earnings, setEarnings] = useState<EarningRow[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);

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
              revenue_by_months: overviewData.revenue_by_months || [],
            });

            if (overviewData.revenue_by_months) {
              setRevenueData(
                overviewData.revenue_by_months.map((r: { month: string; revenue: number }) => ({
                  month: MONTHS_RU[r.month.split("-")[1]] || r.month,
                  revenue: r.revenue,
                }))
              );
            }
          }
        }

        const woUrl = getApiUrl("work-orders");
        if (woUrl) {
          const earningsRes = await fetch(`${woUrl}?action=employee_earnings`);
          const earningsData = await earningsRes.json();
          if (earningsData.earnings) setEarnings(earningsData.earnings);

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
        /* errors silently handled */
      }

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

      {revenueData.length > 0 && (
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
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {statusData.length > 0 && (
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
        )}

        {topEmployees.length > 0 && (
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
                        <span className="text-foreground">{emp.name}</span>
                      </span>
                      <span className="font-medium text-foreground">{emp.count} ЗН</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {earnings.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h4 className="text-sm font-semibold text-foreground mb-4">Выработка исполнителей (нормо-часы)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Сотрудник</th>
                  <th className="text-center py-2 text-muted-foreground font-medium">Заказ-нарядов</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Нормо-часы</th>
                </tr>
              </thead>
              <tbody>
                {earnings.filter(e => e.total_norm_hours > 0 || e.orders_count > 0).map((row) => (
                  <tr key={row.id} className="border-b border-border/50">
                    <td className="py-2.5 text-foreground font-medium">{row.name}</td>
                    <td className="py-2.5 text-center text-foreground">{row.orders_count}</td>
                    <td className="py-2.5 text-right font-semibold text-foreground">
                      {row.total_norm_hours.toFixed(1)} н/ч
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border">
                  <td className="py-2.5 font-semibold text-foreground">Итого</td>
                  <td className="py-2.5 text-center font-semibold text-foreground">
                    {earnings.reduce((s, r) => s + r.orders_count, 0)}
                  </td>
                  <td className="py-2.5 text-right font-bold text-foreground">
                    {earnings.reduce((s, r) => s + r.total_norm_hours, 0).toFixed(1)} н/ч
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsTab;
