import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

interface Income {
  id: number;
  cashbox_id: number;
  amount: number;
  income_type: string;
  comment: string;
  created_at: string;
  cashbox_name: string;
  cashbox_type: string;
  client_id?: number | null;
  client_name?: string | null;
  operation_date?: string | null;
  work_order_id?: number | null;
}

const typeLabels: Record<string, string> = {
  other: "Прочее",
  bank: "Банк",
  loan: "Займ",
  deposit: "Взнос",
  founder: "Взнос учредителя",
  refund: "Возврат",
  investment: "Инвестиции",
  sale: "Продажа имущества",
  return: "Возврат",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU");
};

interface Props {
  incomes: Income[];
  onEditIncome?: (income: Income) => void;
}

const FinanceIncomes = ({ incomes, onEditIncome }: Props) => {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm">
      {incomes.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="ArrowDownCircle" size={28} className="text-green-500" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Приходов пока нет</h3>
          <p className="text-sm text-muted-foreground">Создайте первый приходный ордер</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Дата</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Контрагент</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Тип</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Касса</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden lg:table-cell">Комментарий</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Сумма</th>
                {onEditIncome && <th className="w-10 px-2 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {incomes.map((inc) => (
                <tr key={inc.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-3.5 text-sm whitespace-nowrap">
                    {fmtDate(inc.operation_date || inc.created_at)}
                  </td>
                  <td className="px-5 py-3.5 text-sm">
                    {inc.client_name
                      ? <span className="font-medium">{inc.client_name}</span>
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-sm hidden md:table-cell">
                    {typeLabels[inc.income_type] || inc.income_type}
                  </td>
                  <td className="px-5 py-3.5 text-sm hidden md:table-cell">{inc.cashbox_name}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground hidden lg:table-cell max-w-xs truncate">
                    {inc.comment || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-right text-green-600 whitespace-nowrap">
                    +{fmt(Number(inc.amount))}
                  </td>
                  {onEditIncome && (
                    <td className="px-2 py-3.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => onEditIncome(inc)}
                      >
                        <Icon name="Pencil" size={13} />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FinanceIncomes;
