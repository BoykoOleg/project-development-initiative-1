import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

type Tab =
  | "dashboard"
  | "payments"
  | "expenses"
  | "cashboxes"
  | "incomes"
  | "transfers"
  | "economics";

interface FinanceTabBarProps {
  tab: Tab;
  onSetTab: (tab: Tab) => void;
}

const TABS = [
  { key: "dashboard", label: "Обзор", icon: "BarChart3" },
  { key: "payments", label: "Платежи", icon: "Receipt" },
  { key: "expenses", label: "Расходы", icon: "TrendingDown" },
  { key: "cashboxes", label: "Кассы", icon: "Wallet" },
  { key: "incomes", label: "Приходы", icon: "ArrowDownCircle" },
  { key: "transfers", label: "Перемещения", icon: "ArrowRightLeft" },
] as const;

const FinanceTabBar = ({ tab, onSetTab }: FinanceTabBarProps) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex gap-2 flex-wrap flex-1">
        {TABS.map((t) => (
          <Button
            key={t.key}
            variant={tab === t.key ? "default" : "outline"}
            size="sm"
            className={
              tab === t.key ? "bg-blue-500 hover:bg-blue-600 text-white" : ""
            }
            onClick={() => onSetTab(t.key)}
          >
            <Icon name={t.icon} size={16} className="mr-1.5" />
            {t.label}
          </Button>
        ))}
      </div>
      <Button
        variant={tab === "economics" ? "default" : "outline"}
        size="sm"
        className={
          tab === "economics"
            ? "bg-purple-600 hover:bg-purple-700 text-white ml-auto"
            : "ml-auto border-purple-300 text-purple-700 hover:bg-purple-50"
        }
        onClick={() => onSetTab("economics")}
      >
        <Icon name="LineChart" size={16} className="mr-1.5" />
        Экономика предприятия
      </Button>
    </div>
  );
};

export default FinanceTabBar;