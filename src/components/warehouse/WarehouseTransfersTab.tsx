import { useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";

export interface TransferItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  unit: string;
  qty: number;
  price: number;
}

export interface Transfer {
  id: number;
  transfer_number: string;
  work_order_id: number;
  work_order_number: string;
  client_name: string;
  direction: "to_order" | "to_stock";
  status: "draft" | "confirmed";
  notes: string;
  created_at: string;
  confirmed_at: string;
  items: TransferItem[];
}

interface WarehouseTransfersTabProps {
  transfers: Transfer[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

const directionLabel = (d: string) =>
  d === "to_order" ? "Склад → ЗН" : "ЗН → Склад";

const directionColor = (d: string) =>
  d === "to_order" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-orange-50 text-orange-600 border-orange-200";

const statusLabel = (s: string) => (s === "confirmed" ? "Подтверждено" : "Черновик");
const statusColor = (s: string) =>
  s === "confirmed" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200";

export default function WarehouseTransfersTab({ transfers }: WarehouseTransfersTabProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (transfers.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Icon name="ArrowLeftRight" size={40} className="mx-auto mb-3 opacity-30" />
        <div className="text-sm">Перемещений пока нет</div>
        <div className="text-xs mt-1">Создайте перемещение из заказ-наряда</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transfers.map((tr) => {
        const total = tr.items.reduce((s, i) => s + i.qty * i.price, 0);
        const isOpen = expanded === tr.id;
        return (
          <div key={tr.id} className="bg-white border border-border rounded-xl overflow-hidden">
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setExpanded(isOpen ? null : tr.id)}
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
                  {tr.work_order_number} · {tr.client_name} · {tr.items.length} поз. · {fmt(total)}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {tr.created_at ? new Date(tr.created_at).toLocaleDateString("ru-RU") : ""}
                </span>
                <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={16} className="text-muted-foreground" />
              </div>
            </div>

            {isOpen && (
              <div className="border-t border-border px-4 py-3 bg-muted/20">
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
                        <td className="py-1.5 text-right">
                          {item.qty} {item.unit}
                        </td>
                        <td className="py-1.5 text-right text-muted-foreground">{fmt(item.price)}</td>
                        <td className="py-1.5 text-right font-semibold">{fmt(item.qty * item.price)}</td>
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
      })}
    </div>
  );
}
