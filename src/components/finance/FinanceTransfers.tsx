import Icon from "@/components/ui/icon";

interface Transfer {
  id: number;
  from_cashbox_id: number;
  to_cashbox_id: number;
  amount: number;
  comment: string;
  created_at: string;
  from_cashbox_name: string;
  from_cashbox_type: string;
  to_cashbox_name: string;
  to_cashbox_type: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

interface Props {
  transfers: Transfer[];
}

const FinanceTransfers = ({ transfers }: Props) => {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm">
      {transfers.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="ArrowRightLeft" size={28} className="text-purple-500" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Перемещений пока нет</h3>
          <p className="text-sm text-muted-foreground">Создайте первое перемещение между кассами</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Дата</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Откуда</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Куда</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Комментарий</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-3.5 text-sm">{new Date(t.created_at).toLocaleDateString("ru-RU")}</td>
                  <td className="px-5 py-3.5 text-sm">
                    <span className="text-red-500 font-medium">{t.from_cashbox_name}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm">
                    <span className="text-green-600 font-medium">{t.to_cashbox_name}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground hidden md:table-cell">{t.comment || "—"}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-right text-purple-600">{fmt(Number(t.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FinanceTransfers;
