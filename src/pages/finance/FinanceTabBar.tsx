import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

type Tab =
  | "dashboard"
  | "payments"
  | "expenses"
  | "cashboxes"
  | "incomes"
  | "transfers";

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
    <div className="flex gap-2 flex-wrap">
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
  );
};

export default FinanceTabBar;
