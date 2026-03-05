import Icon from "@/components/ui/icon";

interface Cashbox {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
  balance: number;
  total_received: number;
}

interface Dashboard {
  total_revenue: number;
  month_revenue: number;
  today_revenue: number;
  prev_month_revenue: number;
  total_payments: number;
  completed_orders: number;
  total_works: number;
  total_parts: number;
  by_method: Record<string, number>;
  cashboxes: Cashbox[];
}

const methodLabels: Record<string, string> = {
  cash: "Наличные",
  card: "Карта",
  transfer: "Перевод",
  online: "Онлайн",
};

const typeIcons: Record<string, string> = {
  cash: "Banknote",
  bank: "Building2",
  card: "CreditCard",
  online: "Globe",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

const StatCard = ({ title, value, icon, color, badge, badgePositive }: {
  title: string;
  value: string;
  icon: string;
  color: string;
  badge?: string;
  badgePositive?: boolean;
}) => {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-500",
    green: "bg-green-50 text-green-500",
    purple: "bg-purple-50 text-purple-500",
    orange: "bg-orange-50 text-orange-500",
  };
  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon name={icon} size={20} />
        </div>
        {badge && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgePositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="text-xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{title}</div>
    </div>
  );
};

interface Props {
  dashboard: Dashboard;
  totalExpenses: number;
  monthDiff: number;
}

const FinanceDashboard = ({ dashboard, totalExpenses, monthDiff }: Props) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Выручка сегодня"
          value={fmt(dashboard.today_revenue)}
          icon="CalendarDays"
          color="blue"
        />
        <StatCard
          title="Выручка за месяц"
          value={fmt(dashboard.month_revenue)}
          icon="TrendingUp"
          color="green"
          badge={monthDiff !== 0 ? `${monthDiff > 0 ? "+" : ""}${monthDiff}%` : undefined}
          badgePositive={monthDiff >= 0}
        />
        <StatCard
          title="Всего выручка"
          value={fmt(dashboard.total_revenue)}
          icon="DollarSign"
          color="purple"
        />
        <StatCard
          title="Расходы"
          value={fmt(totalExpenses)}
          icon="TrendingDown"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Стоимость работ и запчастей</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Работы (итого)</span>
              <span className="text-sm font-semibold">{fmt(dashboard.total_works)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Запчасти (итого)</span>
              <span className="text-sm font-semibold">{fmt(dashboard.total_parts)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-sm font-medium">Итого начислено</span>
              <span className="text-base font-bold text-foreground">{fmt(dashboard.total_works + dashboard.total_parts)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-600">Оплачено</span>
              <span className="text-base font-bold text-green-600">{fmt(dashboard.total_revenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-red-600">Расходы</span>
              <span className="text-base font-bold text-red-600">{fmt(totalExpenses)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Оплата по способам (месяц)</h3>
          {Object.keys(dashboard.by_method).length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет данных за текущий месяц</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(dashboard.by_method).map(([method, amount]) => (
                <div key={method} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{methodLabels[method] || method}</span>
                  <span className="text-sm font-semibold">{fmt(amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Кассы</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboard.cashboxes.map((cb) => (
            <div key={cb.id} className={`rounded-lg border p-4 ${cb.is_active ? "border-border" : "border-border bg-gray-50 opacity-60"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon name={typeIcons[cb.type] || "Wallet"} size={18} className="text-muted-foreground" />
                <span className="text-sm font-medium">{cb.name}</span>
              </div>
              <div className="text-lg font-bold text-foreground">{fmt(Number(cb.balance))}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Получено: {fmt(Number(cb.total_received))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;
