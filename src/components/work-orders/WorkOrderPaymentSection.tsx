import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

const methodLabels: Record<string, string> = {
  cash: "Наличные",
  card: "Карта",
  transfer: "Перевод",
  online: "Онлайн",
};

interface Cashbox {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
}

interface Payment {
  id: number;
  amount: number;
  payment_method: string;
  cashbox_name: string;
  created_at: string;
}

interface LinkedIncome {
  id: number;
  amount: number;
  income_type: string;
  comment: string;
  cashbox_name: string;
  created_at: string;
}

interface Props {
  total: number;
  worksTotal: number;
  partsMargin: number;
  partsCost: number;
  totalPaid: number;
  payments: Payment[];
  linkedIncomes?: LinkedIncome[];
  cashboxes: Cashbox[];
  onPayment: (form: { amount: number; payment_method: string; cashbox_id: number; comment: string }) => Promise<void>;
}

const incomeTypeLabels: Record<string, string> = {
  other: "Прочее",
  deposit: "Взнос",
  refund: "Возврат",
  investment: "Инвестиции",
  loan: "Займ",
  bank: "Банк",
};

const WorkOrderPaymentSection = ({
  total, worksTotal, partsMargin, partsCost,
  totalPaid, payments, linkedIncomes = [], cashboxes, onPayment,
}: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ amount: 0, payment_method: "cash", cashbox_id: 0, comment: "" });

  const cashCashboxes = cashboxes.filter((cb) => cb.type !== "bank");
  const bankCashboxes = cashboxes.filter((cb) => cb.type === "bank");

  const openDialog = () => {
    const defaultCashbox = cashCashboxes[0]?.id || cashboxes[0]?.id || 0;
    setForm({
      amount: Math.max(0, total - totalPaid),
      payment_method: "cash",
      cashbox_id: defaultCashbox,
      comment: "",
    });
    setDialogOpen(true);
  };

  const handleMethodChange = (method: string) => {
    if (method === "card") {
      const bankBox = bankCashboxes[0];
      setForm((f) => ({ ...f, payment_method: method, cashbox_id: bankBox?.id || f.cashbox_id }));
    } else {
      const currentCashbox = cashboxes.find((cb) => cb.id === form.cashbox_id);
      const cashboxId = currentCashbox?.type === "bank"
        ? (cashCashboxes[0]?.id || form.cashbox_id)
        : form.cashbox_id;
      setForm((f) => ({ ...f, payment_method: method, cashbox_id: cashboxId }));
    }
  };

  const handleSubmit = async () => {
    await onPayment(form);
    setDialogOpen(false);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-xs text-muted-foreground">Итого</div>
              <div className="text-2xl font-bold text-foreground">{fmt(total)}</div>
            </div>
            {totalPaid > 0 && (
              <>
                <div>
                  <div className="text-xs text-green-600">Оплачено</div>
                  <div className="text-lg font-bold text-green-600">{fmt(totalPaid)}</div>
                </div>
                {total - totalPaid > 0 && (
                  <div>
                    <div className="text-xs text-orange-600">Остаток</div>
                    <div className="text-lg font-bold text-orange-600">{fmt(total - totalPaid)}</div>
                  </div>
                )}
              </>
            )}
            {partsCost > 0 && (
              <div>
                <div className="text-xs text-muted-foreground">Прибыль</div>
                <div className={`text-lg font-bold ${worksTotal + partsMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {fmt(worksTotal + partsMargin)}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {payments.length > 0 && (
              <div className="text-xs text-muted-foreground text-right hidden sm:block">
                {payments.length} {payments.length === 1 ? "платёж" : "платежей"}
              </div>
            )}
            <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={openDialog}>
              <Icon name="Banknote" size={16} className="mr-1.5" />
              Принять оплату
            </Button>
          </div>
        </div>

        {(payments.length > 0 || linkedIncomes.length > 0) && (
          <div className="mt-4 pt-4 border-t border-border divide-y divide-border">
            {payments.map((p) => (
              <div key={p.id} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
                <div>
                  <span className="text-sm font-medium text-green-600">+{fmt(Number(p.amount))}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {methodLabels[p.payment_method] || p.payment_method} · {p.cashbox_name}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString("ru-RU")}
                </div>
              </div>
            ))}
            {linkedIncomes.map((inc) => (
              <div key={`inc-${inc.id}`} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-600">+{fmt(Number(inc.amount))}</span>
                  <span className="text-xs text-muted-foreground">
                    {incomeTypeLabels[inc.income_type] || inc.income_type} · {inc.cashbox_name}
                  </span>
                  {payments.length > 0 && (
                    <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded px-1.5 py-0.5 font-medium">
                      подтверждающий
                    </span>
                  )}
                  {inc.comment && (
                    <span className="text-xs text-muted-foreground">· {inc.comment}</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(inc.created_at).toLocaleDateString("ru-RU")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Принять оплату</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Итого по наряду</span>
                <span className="font-semibold">{fmt(total)}</span>
              </div>
              {totalPaid > 0 && (
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-green-600">Уже оплачено</span>
                  <span className="font-semibold text-green-600">{fmt(totalPaid)}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Сумма *</label>
              <Input type="number" value={form.amount || ""} onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))} placeholder="0" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Способ оплаты</label>
              <Select value={form.payment_method} onValueChange={handleMethodChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Наличные</SelectItem>
                  <SelectItem value="card">Карта</SelectItem>
                  <SelectItem value="transfer">Перевод</SelectItem>
                  <SelectItem value="online">Онлайн</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Касса *</label>
              <Select value={String(form.cashbox_id)} onValueChange={(v) => setForm((f) => ({ ...f, cashbox_id: Number(v) }))}>
                <SelectTrigger><SelectValue placeholder="Выберите кассу" /></SelectTrigger>
                <SelectContent>
                  {(form.payment_method === "card" ? bankCashboxes : cashCashboxes).map((cb) => (
                    <SelectItem key={cb.id} value={String(cb.id)}>{cb.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Комментарий</label>
              <Input value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} placeholder="Необязательно" />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white" onClick={handleSubmit}>
                <Icon name="Check" size={16} className="mr-1.5" />
                Принять {form.amount ? fmt(form.amount) : ""}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WorkOrderPaymentSection;