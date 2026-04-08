import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmt, fmtDate, paymentMethodLabel, WOFinanceData, StockTransfer } from "./woFinanceTypes";

const directionLabel = (d: string) => d === "to_order" ? "Склад → ЗН" : "ЗН → Склад";
const directionColor = (d: string) =>
  d === "to_order" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-orange-50 text-orange-600 border-orange-200";
const statusLabel = (s: string) => s === "confirmed" ? "Подтверждено" : "Черновик";
const statusColor = (s: string) =>
  s === "confirmed" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200";

const TransferRow = ({ tr }: { tr: StockTransfer }) => {
  const [open, setOpen] = useState(false);
  const total = tr.items.reduce((s, i) => s + Number(i.qty) * Number(i.price), 0);
  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{tr.transfer_number}</span>
            <span className={`text-xs px-2 py-0.5 rounded border font-medium ${directionColor(tr.direction)}`}>
              {directionLabel(tr.direction)}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded border ${statusColor(tr.status)}`}>
              {statusLabel(tr.status)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {tr.items.length} поз. · {fmt(total)}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">
            {tr.created_at ? new Date(tr.created_at).toLocaleDateString("ru-RU") : ""}
          </span>
          <Icon name={open ? "ChevronUp" : "ChevronDown"} size={16} className="text-muted-foreground" />
        </div>
      </div>
      {open && (
        <div className="border-t border-border px-3 py-3 bg-muted/20">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left pb-1 font-medium">Товар</th>
                <th className="text-left pb-1 font-medium">Артикул</th>
                <th className="text-right pb-1 font-medium">Кол-во</th>
                <th className="text-right pb-1 font-medium">Цена</th>
                <th className="text-right pb-1 font-medium">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {tr.items.map((item) => (
                <tr key={item.id} className="border-t border-border/50">
                  <td className="py-1.5 pr-2 font-medium text-foreground">{item.product_name}</td>
                  <td className="py-1.5 pr-2 text-muted-foreground">{item.sku}</td>
                  <td className="py-1.5 text-right">{item.qty} {item.unit}</td>
                  <td className="py-1.5 text-right text-muted-foreground">{fmt(Number(item.price))}</td>
                  <td className="py-1.5 text-right font-semibold">{fmt(Number(item.qty) * Number(item.price))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border">
                <td colSpan={4} className="pt-2 text-right font-medium text-muted-foreground">Итого:</td>
                <td className="pt-2 text-right font-bold text-foreground">{fmt(total)}</td>
              </tr>
            </tfoot>
          </table>
          {tr.notes && (
            <div className="mt-2 text-xs text-muted-foreground">
              <span className="font-medium">Примечание:</span> {tr.notes}
            </div>
          )}
          {tr.status === "confirmed" && tr.confirmed_at && (
            <div className="mt-2 text-xs text-green-600">
              Подтверждено: {new Date(tr.confirmed_at).toLocaleString("ru-RU")}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface Props {
  data: WOFinanceData;
  onAddExpense: () => void;
}

const WOFinanceSummary = ({ data, onAddExpense }: Props) => {
  return (
    <div className="space-y-5 pt-1">
      {/* Сводные показатели */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border bg-card p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">Стоимость</div>
          <div className="font-semibold text-sm">{fmt(data.order_total)}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            раб. {fmt(data.works_total)} + зч. {fmt(data.parts_total)}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">Оплачено</div>
          <div className="font-semibold text-sm text-green-600">{fmt(data.paid)}</div>
          {data.debt > 0 && (
            <div className="text-xs text-red-500 mt-0.5">долг {fmt(data.debt)}</div>
          )}
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">Расходы</div>
          <div className="font-semibold text-sm text-red-500">{fmt(data.total_expense)}</div>
          <div className="text-xs text-muted-foreground mt-0.5">по ордерам</div>
        </div>
        <div className={`rounded-lg border p-3 text-center ${data.profit >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <div className="text-xs text-muted-foreground mb-1">Прибыль</div>
          <div className={`font-semibold text-sm ${data.profit >= 0 ? "text-green-700" : "text-red-600"}`}>
            {fmt(data.profit)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">доход − расход</div>
        </div>
      </div>

      {/* Платежи от клиента */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Icon name="CreditCard" size={15} className="text-blue-500" />
            Платежи от клиента
            <Badge variant="secondary" className="text-xs">{data.payments.length}</Badge>
          </h3>
        </div>
        {data.payments.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Нет платежей</p>
        ) : (
          <div className="rounded-md border divide-y text-sm">
            {data.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">{fmtDate(p.created_at)}</span>
                  <span>{p.cashbox_name} · {paymentMethodLabel[p.payment_method] || p.payment_method}</span>
                  {p.comment && <span className="text-xs text-muted-foreground">{p.comment}</span>}
                </div>
                <span className="font-medium text-green-600 shrink-0 ml-3">+{fmt(Number(p.amount))}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Доход с запчастей */}
      {data.parts.length > 0 && data.parts_purchase_total > 0 && (
        <section>
          <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
            <Icon name="Package" size={15} className="text-blue-500" />
            Доход с запчастей
          </h3>
          <div className="rounded-md border px-3 py-2 flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground shrink-0">
              Себест. <span className="text-foreground font-medium">{fmt(data.parts_purchase_total)}</span>
              <span className="mx-2 text-border">·</span>
              Наценка <span className={data.parts_margin >= 0 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>{fmt(data.parts_margin)}</span>
            </span>
            <span className="font-semibold text-foreground shrink-0">{fmt(data.parts_total)}</span>
          </div>
        </section>
      )}

      {/* Перемещения товаров */}
      {data.transfers && data.transfers.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
            <Icon name="ArrowLeftRight" size={15} className="text-blue-500" />
            Перемещения со склада
            <Badge variant="secondary" className="text-xs">{data.transfers.length}</Badge>
          </h3>
          <div className="space-y-2">
            {data.transfers.map((tr) => (
              <TransferRow key={tr.id} tr={tr} />
            ))}
          </div>
        </section>
      )}

      {/* Расходы */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Icon name="TrendingDown" size={15} className="text-red-500" />
            Расходы
            <Badge variant="secondary" className="text-xs">{data.expenses.length}</Badge>
          </h3>
          <Button size="sm" variant="outline" onClick={onAddExpense} className="h-7 text-xs">
            <Icon name="Plus" size={13} className="mr-1" />
            Добавить
          </Button>
        </div>
        {data.expenses.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Нет расходов</p>
        ) : (
          <div className="rounded-md border divide-y text-sm">
            {data.expenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">{fmtDate(e.created_at)}</span>
                  <span>
                    {e.cashbox_name}
                    {e.group_name && <> · <span className="text-muted-foreground">{e.group_name}</span></>}
                  </span>
                  {e.comment && <span className="text-xs text-muted-foreground">{e.comment}</span>}
                </div>
                <span className="font-medium text-red-500 shrink-0 ml-3">−{fmt(Number(e.amount))}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Итог строка */}
      <div className="rounded-lg bg-muted/50 px-4 py-3 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Итого движение денег</span>
        <div className="flex gap-4">
          <span className="text-green-600">+{fmt(data.total_income)}</span>
          <span className="text-red-500">−{fmt(data.total_expense)}</span>
          <span className={`font-semibold ${data.profit >= 0 ? "text-green-700" : "text-red-600"}`}>
            = {fmt(data.profit)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WOFinanceSummary;