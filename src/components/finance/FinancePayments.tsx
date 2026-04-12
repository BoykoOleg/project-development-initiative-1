import Icon from "@/components/ui/icon";

interface Payment {
  id: number;
  work_order_id: number;
  cashbox_id: number;
  amount: number;
  payment_method: string;
  comment: string;
  created_at: string;
  cashbox_name: string;
  cashbox_type: string;
  client_name: string;
  work_order_number: string;
}

const methodLabels: Record<string, string> = {
  cash: "Наличные",
  card: "Карта",
  transfer: "Перевод",
  online: "Онлайн",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

interface Props {
  payments: Payment[];
  onEditPayment?: (payment: Payment) => void;
}

const FinancePayments = ({ payments, onEditPayment }: Props) => {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm">
      {payments.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="Receipt" size={28} className="text-blue-500" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Платежей пока нет</h3>
          <p className="text-sm text-muted-foreground">Принимайте оплату в заказ-нарядах</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Дата</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Наряд</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Клиент</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Способ</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Касса</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => onEditPayment?.(p)}>
                  <td className="px-5 py-3.5 text-sm">{new Date(p.created_at).toLocaleDateString("ru-RU")}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-blue-600">{p.work_order_number}</td>
                  <td className="px-5 py-3.5 text-sm">{p.client_name}</td>
                  <td className="px-5 py-3.5 text-sm hidden md:table-cell">{methodLabels[p.payment_method] || p.payment_method}</td>
                  <td className="px-5 py-3.5 text-sm hidden md:table-cell">{p.cashbox_name}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-right text-green-600">+{fmt(Number(p.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FinancePayments;