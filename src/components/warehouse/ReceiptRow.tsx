import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Receipt } from "@/components/warehouse/WarehouseReceiptsTab";
import { getApiUrl } from "@/lib/api";

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

interface ReceiptDetail {
  id: number;
  receipt_number: string;
  supplier_name: string | null;
  document_number: string;
  document_date: string;
  total_amount: number;
  notes: string;
  created_at: string;
  items: { id: number; product_name: string; sku: string; unit: string; quantity: number; price: number; total: number }[];
}

const ReceiptRow = ({ receipt }: { receipt: Receipt }) => {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ReceiptDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!open && !detail) {
      setLoading(true);
      try {
        const url = getApiUrl("warehouse");
        const res = await fetch(`${url}?section=receipt&receipt_id=${receipt.id}`);
        const data = await res.json();
        if (data.receipt) setDetail(data.receipt);
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    }
    setOpen((v) => !v);
  };

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={handleToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-green-600">{receipt.receipt_number}</span>
            {receipt.supplier_name && (
              <span className="text-xs px-2 py-0.5 rounded border bg-blue-50 text-blue-600 border-blue-200 font-medium">
                {receipt.supplier_name}
              </span>
            )}
            {receipt.is_paid ? (
              <span className="text-xs px-2 py-0.5 rounded border bg-green-50 text-green-700 border-green-200 font-medium flex items-center gap-1">
                <Icon name="CheckCircle" size={11} />
                Оплачено {receipt.paid_amount ? fmt(Number(receipt.paid_amount)) : ""}
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded border bg-red-50 text-red-600 border-red-200 font-medium flex items-center gap-1">
                <Icon name="Clock" size={11} />
                Не оплачено
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {receipt.document_date
              ? new Date(receipt.document_date).toLocaleDateString("ru-RU")
              : new Date(receipt.created_at).toLocaleDateString("ru-RU")}
            {receipt.document_number && ` · №${receipt.document_number}`}
            {` · ${receipt.item_count} поз. · `}
            <span className="font-medium text-green-600">+{fmt(Number(receipt.total_amount))}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {loading
            ? <Icon name="Loader2" size={16} className="animate-spin text-muted-foreground" />
            : <Icon name={open ? "ChevronUp" : "ChevronDown"} size={16} className="text-muted-foreground" />
          }
        </div>
      </div>

      {open && detail && (
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
              {detail.items.map((item) => (
                <tr key={item.id} className="border-t border-border/50">
                  <td className="py-1.5 pr-2 font-medium text-foreground">{item.product_name}</td>
                  <td className="py-1.5 pr-2 text-muted-foreground">{item.sku}</td>
                  <td className="py-1.5 text-right">{item.quantity} {item.unit}</td>
                  <td className="py-1.5 text-right text-muted-foreground">{fmt(Number(item.price))}</td>
                  <td className="py-1.5 text-right font-semibold">{fmt(Number(item.total))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border">
                <td colSpan={4} className="pt-2 text-right font-medium text-muted-foreground">Итого:</td>
                <td className="pt-2 text-right font-bold text-green-600">+{fmt(Number(detail.total_amount))}</td>
              </tr>
            </tfoot>
          </table>
          {detail.notes && (
            <div className="mt-2 text-xs text-muted-foreground">
              <span className="font-medium">Примечание:</span> {detail.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReceiptRow;
