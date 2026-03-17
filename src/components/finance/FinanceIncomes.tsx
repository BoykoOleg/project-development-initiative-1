import Icon from "@/components/ui/icon";

interface Income {
  id: number;
  cashbox_id: number;
  amount: number;
  income_type: string;
  comment: string;
  created_at: string;
  cashbox_name: string;
  cashbox_type: string;
}

const typeLabels: Record<string, string> = {
  other: "Прочее",
  loan: "Займ",
  founder: "Взнос учредителя",
  sale: "Продажа имущества",
  return: "Возврат",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

interface Props {
  incomes: Income[];
}

const FinanceIncomes = ({ incomes }: Props) => {
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
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Тип</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Касса</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Комментарий</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {incomes.map((inc) => (
                <tr key={inc.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-3.5 text-sm">{new Date(inc.created_at).toLocaleDateString("ru-RU")}</td>
                  <td className="px-5 py-3.5 text-sm">{typeLabels[inc.income_type] || inc.income_type}</td>
                  <td className="px-5 py-3.5 text-sm hidden md:table-cell">{inc.cashbox_name}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground hidden md:table-cell">{inc.comment || "—"}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-right text-green-600">+{fmt(Number(inc.amount))}</td>
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
