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
import type { Cashbox, ExpenseGroup } from "./useFinanceData";

export interface ClientRef {
  id: number;
  name: string;
  phone: string;
}

export interface WorkOrderRef {
  id: number;
  number: string;
  client_name: string;
  car_info: string;
}

export interface ReceiptRef {
  id: number;
  receipt_number: string;
  supplier_name: string | null;
  total_amount: number;
  document_date: string;
}

const formatRub = (amount: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount);

interface CashboxDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingCashbox: Cashbox | null;
  cashboxForm: { name: string; type: string };
  setCashboxForm: React.Dispatch<
    React.SetStateAction<{ name: string; type: string }>
  >;
  onSave: () => void;
}

export const CashboxDialog = ({
  open,
  onOpenChange,
  editingCashbox,
  cashboxForm,
  setCashboxForm,
  onSave,
}: CashboxDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {editingCashbox ? "Редактировать кассу" : "Новая касса"}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Название</label>
          <Input
            value={cashboxForm.name}
            onChange={(e) =>
              setCashboxForm((f) => ({ ...f, name: e.target.value }))
            }
            placeholder="Например: Основная касса"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Тип</label>
          <Select
            value={cashboxForm.type}
            onValueChange={(v) => setCashboxForm((f) => ({ ...f, type: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Наличные</SelectItem>
              <SelectItem value="bank">Расчётный счёт</SelectItem>
              <SelectItem value="card">Терминал</SelectItem>
              <SelectItem value="online">Онлайн</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            onClick={onSave}
          >
            {editingCashbox ? "Сохранить" : "Создать"}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  expenseForm: {
    amount: number;
    cashbox_id: number;
    expense_group_id: string;
    comment: string;
    work_order_id: string;
    stock_receipt_id: string;
    client_id: string;
    operation_date: string;
  };
  setExpenseForm: React.Dispatch<
    React.SetStateAction<{
      amount: number;
      cashbox_id: number;
      expense_group_id: string;
      comment: string;
      work_order_id: string;
      stock_receipt_id: string;
      client_id: string;
      operation_date: string;
    }>
  >;
  activeCashboxes: Cashbox[];
  expenseGroups: ExpenseGroup[];
  workOrders: WorkOrderRef[];
  receipts: ReceiptRef[];
  clients: ClientRef[];
  onCreate: () => void;
  submitting?: boolean;
}

const SUPPLIER_PAYMENT_NAME = "Оплата поставщиков";

export const ExpenseDialog = ({
  open,
  onOpenChange,
  expenseForm,
  setExpenseForm,
  activeCashboxes,
  expenseGroups,
  workOrders,
  receipts,
  clients,
  onCreate,
  submitting,
}: ExpenseDialogProps) => {
  const selectedGroup = expenseGroups.find(
    (g) => String(g.id) === expenseForm.expense_group_id
  );
  const isSupplierPayment = selectedGroup?.name === SUPPLIER_PAYMENT_NAME;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Расходно-кассовый ордер</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Сумма *</label>
            <Input
              type="number"
              value={expenseForm.amount || ""}
              onChange={(e) =>
                setExpenseForm((f) => ({ ...f, amount: Number(e.target.value) }))
              }
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Касса *</label>
            <Select
              value={String(expenseForm.cashbox_id)}
              onValueChange={(v) =>
                setExpenseForm((f) => ({ ...f, cashbox_id: Number(v) }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите кассу" />
              </SelectTrigger>
              <SelectContent>
                {activeCashboxes.map((cb) => (
                  <SelectItem key={cb.id} value={String(cb.id)}>
                    {cb.name} ({formatRub(Number(cb.balance))})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Группа расходов</label>
            <Select
              value={expenseForm.expense_group_id}
              onValueChange={(v) =>
                setExpenseForm((f) => ({
                  ...f,
                  expense_group_id: v,
                  stock_receipt_id: "",
                  work_order_id: "",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Без группы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без группы</SelectItem>
                {expenseGroups
                  .filter((g) => g.is_active)
                  .map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {isSupplierPayment ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Поступление товара</label>
              <Select
                value={expenseForm.stock_receipt_id || "none"}
                onValueChange={(v) =>
                  setExpenseForm((f) => ({ ...f, stock_receipt_id: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Без привязки" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без привязки</SelectItem>
                  {receipts.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.receipt_number}
                      {r.supplier_name ? ` · ${r.supplier_name}` : ""}
                      {r.document_date
                        ? ` · ${new Date(r.document_date).toLocaleDateString("ru-RU")}`
                        : ""}
                      {` · ${formatRub(Number(r.total_amount))}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Привязка к заказ-наряду</label>
              <Select
                value={expenseForm.work_order_id || "none"}
                onValueChange={(v) =>
                  setExpenseForm((f) => ({ ...f, work_order_id: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Без привязки" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без привязки</SelectItem>
                  {workOrders.map((wo) => (
                    <SelectItem key={wo.id} value={String(wo.id)}>
                      {wo.number} · {wo.client_name}
                      {wo.car_info ? ` · ${wo.car_info}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Дата операции</label>
              <Input
                type="date"
                value={expenseForm.operation_date}
                onChange={(e) => setExpenseForm((f) => ({ ...f, operation_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Контрагент</label>
              <Select
                value={expenseForm.client_id || "none"}
                onValueChange={(v) => setExpenseForm((f) => ({ ...f, client_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Без контрагента" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без контрагента</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Комментарий</label>
            <Input
              value={expenseForm.comment}
              onChange={(e) =>
                setExpenseForm((f) => ({ ...f, comment: e.target.value }))
              }
              placeholder="За что расход"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={onCreate} disabled={submitting}>
              <Icon name="Minus" size={16} className="mr-1.5" />
              {submitting ? "Списание..." : `Списать ${expenseForm.amount ? formatRub(expenseForm.amount) : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export interface EditExpenseForm {
  id: number;
  cashbox_id: number;
  expense_group_id: string;
  comment: string;
  work_order_id: string;
  stock_receipt_id: string;
  amount: number;
  client_id: string;
  operation_date: string;
  has_bank_tx?: boolean;
}

interface EditExpenseDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: EditExpenseForm;
  setForm: React.Dispatch<React.SetStateAction<EditExpenseForm>>;
  activeCashboxes: Cashbox[];
  expenseGroups: ExpenseGroup[];
  workOrders: WorkOrderRef[];
  receipts: ReceiptRef[];
  clients: ClientRef[];
  onSave: () => void;
  submitting?: boolean;
}

export const EditExpenseDialog = ({
  open,
  onOpenChange,
  form,
  setForm,
  activeCashboxes,
  expenseGroups,
  workOrders,
  receipts,
  clients,
  onSave,
  submitting,
}: EditExpenseDialogProps) => {
  const selectedGroup = expenseGroups.find(
    (g) => String(g.id) === form.expense_group_id
  );
  const isSupplierPayment = selectedGroup?.name === "Оплата поставщиков";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Редактирование расхода</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">

          <div className="px-3 py-2 bg-red-50 rounded-md flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Сумма (не изменяется)</span>
            <span className="text-sm font-bold text-red-600">−{formatRub(form.amount)}</span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Контрагент</label>
            <Select
              value={form.client_id || "none"}
              onValueChange={(v) => setForm((f) => ({ ...f, client_id: v }))}
            >
              <SelectTrigger><SelectValue placeholder="Без контрагента" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без контрагента</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Группа расходов</label>
            <Select
              value={form.expense_group_id}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, expense_group_id: v, stock_receipt_id: "", work_order_id: "" }))
              }
            >
              <SelectTrigger><SelectValue placeholder="Без группы" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без группы</SelectItem>
                {expenseGroups.filter((g) => g.is_active).map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isSupplierPayment ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Поступление товара</label>
              <Select
                value={form.stock_receipt_id || "none"}
                onValueChange={(v) => setForm((f) => ({ ...f, stock_receipt_id: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Без привязки" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без привязки</SelectItem>
                  {receipts.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.receipt_number}{r.supplier_name ? ` · ${r.supplier_name}` : ""}
                      {r.document_date ? ` · ${new Date(r.document_date).toLocaleDateString("ru-RU")}` : ""}
                      {` · ${formatRub(Number(r.total_amount))}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Заказ-наряд</label>
              <Select
                value={form.work_order_id || "none"}
                onValueChange={(v) => setForm((f) => ({ ...f, work_order_id: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Без привязки" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без привязки</SelectItem>
                  {workOrders.map((wo) => (
                    <SelectItem key={wo.id} value={String(wo.id)}>
                      {wo.number} · {wo.client_name}{wo.car_info ? ` · ${wo.car_info}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Комментарий</label>
            <Input
              value={form.comment}
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder="За что расход"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Касса</label>
              <Select
                value={String(form.cashbox_id)}
                onValueChange={(v) => setForm((f) => ({ ...f, cashbox_id: Number(v) }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {activeCashboxes.map((cb) => (
                    <SelectItem key={cb.id} value={String(cb.id)}>{cb.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Дата{form.has_bank_tx && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(из банка)</span>}
              </label>
              <Input
                type="date"
                value={form.operation_date}
                readOnly={form.has_bank_tx}
                disabled={form.has_bank_tx}
                onChange={(e) => !form.has_bank_tx && setForm((f) => ({ ...f, operation_date: e.target.value }))}
                className={form.has_bank_tx ? "bg-muted cursor-not-allowed opacity-70" : ""}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={onSave} disabled={submitting}>
              <Icon name="Save" size={16} className="mr-1.5" />
              {submitting ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export interface EditPaymentForm {
  id: number;
  cashbox_id: number;
  payment_method: string;
  comment: string;
  amount: number;
  client_name: string;
  work_order_number: string;
}

interface EditPaymentDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: EditPaymentForm;
  setForm: React.Dispatch<React.SetStateAction<EditPaymentForm>>;
  activeCashboxes: Cashbox[];
  onSave: () => void;
  submitting?: boolean;
}

export const EditPaymentDialog = ({
  open,
  onOpenChange,
  form,
  setForm,
  activeCashboxes,
  onSave,
  submitting,
}: EditPaymentDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Редактирование платежа</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Заказ-наряд</label>
              <div className="px-3 py-2 bg-muted/50 rounded-md text-sm font-medium text-blue-600">
                {form.work_order_number}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Сумма</label>
              <div className="px-3 py-2 bg-muted/50 rounded-md text-sm font-semibold text-green-600">
                +{formatRub(form.amount)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Касса *</label>
            <Select
              value={String(form.cashbox_id)}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, cashbox_id: Number(v) }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите кассу" />
              </SelectTrigger>
              <SelectContent>
                {activeCashboxes.map((cb) => (
                  <SelectItem key={cb.id} value={String(cb.id)}>
                    {cb.name} ({formatRub(Number(cb.balance))})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Способ оплаты</label>
            <Select
              value={form.payment_method}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, payment_method: v }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Наличные</SelectItem>
                <SelectItem value="card">Карта</SelectItem>
                <SelectItem value="transfer">Перевод</SelectItem>
                <SelectItem value="online">Онлайн</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Комментарий</label>
            <Input
              value={form.comment}
              onChange={(e) =>
                setForm((f) => ({ ...f, comment: e.target.value }))
              }
              placeholder="Комментарий к платежу"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={onSave} disabled={submitting}>
              <Icon name="Save" size={16} className="mr-1.5" />
              {submitting ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface GroupDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groupForm: { name: string; description: string };
  setGroupForm: React.Dispatch<
    React.SetStateAction<{ name: string; description: string }>
  >;
  onCreate: () => void;
}

export const GroupDialog = ({
  open,
  onOpenChange,
  groupForm,
  setGroupForm,
  onCreate,
}: GroupDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Новая группа расходов</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Название *</label>
          <Input
            value={groupForm.name}
            onChange={(e) =>
              setGroupForm((f) => ({ ...f, name: e.target.value }))
            }
            placeholder="Например: Аренда"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Описание</label>
          <Input
            value={groupForm.description}
            onChange={(e) =>
              setGroupForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Необязательно"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            onClick={onCreate}
          >
            Создать
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

interface EditGroupDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groupForm: { name: string; description: string; is_active: boolean };
  setGroupForm: React.Dispatch<React.SetStateAction<{ name: string; description: string; is_active: boolean }>>;
  onSave: () => void;
}

export const EditGroupDialog = ({ open, onOpenChange, groupForm, setGroupForm, onSave }: EditGroupDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Редактирование группы</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Название *</label>
          <Input
            value={groupForm.name}
            onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Например: Аренда"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Описание</label>
          <Input
            value={groupForm.description}
            onChange={(e) => setGroupForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Необязательно"
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="group-active"
            checked={groupForm.is_active}
            onChange={(e) => setGroupForm((f) => ({ ...f, is_active: e.target.checked }))}
            className="w-4 h-4"
          />
          <label htmlFor="group-active" className="text-sm font-medium cursor-pointer">Активна</label>
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={onSave}>Сохранить</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export interface EditIncomeForm {
  id: number;
  cashbox_id: number;
  income_type: string;
  comment: string;
  work_order_id: string;
  amount: number;
  client_id: string;
  operation_date: string;
  bank_description?: string | null;
  bank_counterparty?: string | null;
}

interface IncomeDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  incomeForm: {
    amount: number;
    cashbox_id: number;
    income_type: string;
    comment: string;
    work_order_id: string;
    client_id: string;
    operation_date: string;
  };
  setIncomeForm: React.Dispatch<
    React.SetStateAction<{
      amount: number;
      cashbox_id: number;
      income_type: string;
      comment: string;
      work_order_id: string;
      client_id: string;
      operation_date: string;
    }>
  >;
  activeCashboxes: Cashbox[];
  workOrders: WorkOrderRef[];
  clients: ClientRef[];
  onCreate: () => void;
}

export const IncomeDialog = ({
  open,
  onOpenChange,
  incomeForm,
  setIncomeForm,
  activeCashboxes,
  workOrders,
  clients,
  onCreate,
}: IncomeDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Приходный ордер</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Сумма *</label>
          <Input
            type="number"
            value={incomeForm.amount || ""}
            onChange={(e) =>
              setIncomeForm((f) => ({
                ...f,
                amount: Number(e.target.value),
              }))
            }
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Касса *</label>
          <Select
            value={String(incomeForm.cashbox_id)}
            onValueChange={(v) =>
              setIncomeForm((f) => ({ ...f, cashbox_id: Number(v) }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите кассу" />
            </SelectTrigger>
            <SelectContent>
              {activeCashboxes.map((cb) => (
                <SelectItem key={cb.id} value={String(cb.id)}>
                  {cb.name} ({formatRub(Number(cb.balance))})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Тип прихода</label>
          <Select
            value={incomeForm.income_type}
            onValueChange={(v) =>
              setIncomeForm((f) => ({ ...f, income_type: v }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите тип" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="other">Прочее</SelectItem>
              <SelectItem value="deposit">Взнос</SelectItem>
              <SelectItem value="refund">Возврат</SelectItem>
              <SelectItem value="investment">Инвестиции</SelectItem>
              <SelectItem value="loan">Займ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Привязка к заказ-наряду</label>
          <Select
            value={incomeForm.work_order_id || "none"}
            onValueChange={(v) =>
              setIncomeForm((f) => ({ ...f, work_order_id: v }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Без привязки" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Без привязки</SelectItem>
              {workOrders.map((wo) => (
                <SelectItem key={wo.id} value={String(wo.id)}>
                  {wo.number} · {wo.client_name}
                  {wo.car_info ? ` · ${wo.car_info}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Дата операции</label>
            <Input
              type="date"
              value={incomeForm.operation_date}
              onChange={(e) => setIncomeForm((f) => ({ ...f, operation_date: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Контрагент</label>
            <Select
              value={incomeForm.client_id || "none"}
              onValueChange={(v) => setIncomeForm((f) => ({ ...f, client_id: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Без контрагента" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без контрагента</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Комментарий</label>
          <Input
            value={incomeForm.comment}
            onChange={(e) =>
              setIncomeForm((f) => ({ ...f, comment: e.target.value }))
            }
            placeholder="За что приход"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button
            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            onClick={onCreate}
          >
            <Icon name="Plus" size={16} className="mr-1.5" />
            Зачислить{" "}
            {incomeForm.amount ? formatRub(incomeForm.amount) : ""}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

interface EditIncomeDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: EditIncomeForm;
  setForm: React.Dispatch<React.SetStateAction<EditIncomeForm>>;
  activeCashboxes: Cashbox[];
  workOrders: WorkOrderRef[];
  clients: ClientRef[];
  onSave: () => void;
  submitting?: boolean;
}

export const EditIncomeDialog = ({
  open,
  onOpenChange,
  form,
  setForm,
  activeCashboxes,
  workOrders,
  clients,
  onSave,
  submitting,
}: EditIncomeDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Редактирование прихода</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">

        {(form.bank_counterparty || form.bank_description) && (
          <div className="px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-md space-y-1">
            <p className="text-xs font-medium text-blue-600 mb-1">Из банка</p>
            {form.bank_counterparty && (
              <p className="text-xs text-slate-700"><span className="text-muted-foreground">Контрагент: </span>{form.bank_counterparty}</p>
            )}
            {form.bank_description && (
              <p className="text-xs text-slate-700 break-words"><span className="text-muted-foreground">Назначение: </span>{form.bank_description}</p>
            )}
          </div>
        )}

        <div className="px-3 py-2 bg-green-50 rounded-md flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Сумма (не изменяется)</span>
          <span className="text-sm font-bold text-green-600">+{formatRub(form.amount)}</span>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Контрагент</label>
          <Select
            value={form.client_id || "none"}
            onValueChange={(v) => setForm((f) => ({ ...f, client_id: v }))}
          >
            <SelectTrigger><SelectValue placeholder="Без контрагента" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Без контрагента</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Заказ-наряд</label>
          <Select
            value={form.work_order_id || "none"}
            onValueChange={(v) => setForm((f) => ({ ...f, work_order_id: v }))}
          >
            <SelectTrigger><SelectValue placeholder="Без привязки" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Без привязки</SelectItem>
              {workOrders.map((wo) => (
                <SelectItem key={wo.id} value={String(wo.id)}>
                  {wo.number} · {wo.client_name}{wo.car_info ? ` · ${wo.car_info}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Комментарий</label>
          <Input
            value={form.comment}
            onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
            placeholder="Комментарий"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Тип прихода</label>
            <Select
              value={form.income_type}
              onValueChange={(v) => setForm((f) => ({ ...f, income_type: v }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="other">Прочее</SelectItem>
                <SelectItem value="bank">Банк</SelectItem>
                <SelectItem value="deposit">Взнос</SelectItem>
                <SelectItem value="refund">Возврат</SelectItem>
                <SelectItem value="investment">Инвестиции</SelectItem>
                <SelectItem value="loan">Займ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Касса</label>
            <Select
              value={String(form.cashbox_id)}
              onValueChange={(v) => setForm((f) => ({ ...f, cashbox_id: Number(v) }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {activeCashboxes.map((cb) => (
                  <SelectItem key={cb.id} value={String(cb.id)}>{cb.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Дата</label>
          <Input
            type="date"
            value={form.operation_date}
            onChange={(e) => setForm((f) => ({ ...f, operation_date: e.target.value }))}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={onSave} disabled={submitting}>
            <Icon name="Save" size={16} className="mr-1.5" />
            {submitting ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  transferForm: {
    amount: number;
    from_cashbox_id: number;
    to_cashbox_id: number;
    comment: string;
  };
  setTransferForm: React.Dispatch<
    React.SetStateAction<{
      amount: number;
      from_cashbox_id: number;
      to_cashbox_id: number;
      comment: string;
    }>
  >;
  activeCashboxes: Cashbox[];
  onCreate: () => void;
}

export const TransferDialog = ({
  open,
  onOpenChange,
  transferForm,
  setTransferForm,
  activeCashboxes,
  onCreate,
}: TransferDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Перемещение между кассами</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Сумма *</label>
          <Input
            type="number"
            value={transferForm.amount || ""}
            onChange={(e) =>
              setTransferForm((f) => ({
                ...f,
                amount: Number(e.target.value),
              }))
            }
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Из кассы *</label>
          <Select
            value={String(transferForm.from_cashbox_id)}
            onValueChange={(v) =>
              setTransferForm((f) => ({ ...f, from_cashbox_id: Number(v) }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите кассу" />
            </SelectTrigger>
            <SelectContent>
              {activeCashboxes.map((cb) => (
                <SelectItem key={cb.id} value={String(cb.id)}>
                  {cb.name} ({formatRub(Number(cb.balance))})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">В кассу *</label>
          <Select
            value={String(transferForm.to_cashbox_id)}
            onValueChange={(v) =>
              setTransferForm((f) => ({ ...f, to_cashbox_id: Number(v) }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите кассу" />
            </SelectTrigger>
            <SelectContent>
              {activeCashboxes.map((cb) => (
                <SelectItem key={cb.id} value={String(cb.id)}>
                  {cb.name} ({formatRub(Number(cb.balance))})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Комментарий</label>
          <Input
            value={transferForm.comment}
            onChange={(e) =>
              setTransferForm((f) => ({ ...f, comment: e.target.value }))
            }
            placeholder="Причина перемещения"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button
            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
            onClick={onCreate}
          >
            <Icon name="ArrowRightLeft" size={16} className="mr-1.5" />
            Перевести{" "}
            {transferForm.amount ? formatRub(transferForm.amount) : ""}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);