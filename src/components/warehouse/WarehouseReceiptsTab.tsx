import { useState, useRef } from "react";
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
import { Product } from "@/components/warehouse/WarehouseProductsTab";
import { Supplier } from "@/components/warehouse/WarehouseSuppliersTab";
import { getApiUrl } from "@/lib/api";
import { compressImageToBase64 } from "@/lib/imageUtils";

const PHOTO_RECOGNIZE_URL = getApiUrl("photo-recognize");

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

export interface Receipt {
  id: number;
  receipt_number: string;
  supplier_id: number | null;
  supplier_name: string | null;
  document_number: string;
  document_date: string;
  total_amount: number;
  notes: string;
  item_count: number;
  created_at: string;
}

interface ReceiptItem {
  product_id: number;
  quantity: number;
  price: number;
  _aiName?: string;
  _matched?: boolean;
}

interface ReceiptPayload {
  supplier_id: number | null;
  document_number: string;
  document_date: string | null;
  notes: string;
  items: { product_id: number; quantity: number; price: number }[];
}

interface Props {
  receipts: Receipt[];
  products: Product[];
  suppliers: Supplier[];
  onCreate: (payload: ReceiptPayload) => Promise<void>;
}

function findProductMatch(name: string, sku: string, products: Product[]): Product | null {
  const skuLow = sku.toLowerCase().trim();
  const nameLow = name.toLowerCase().trim();

  if (skuLow) {
    const exact = products.find((p) => p.sku.toLowerCase().trim() === skuLow);
    if (exact) return exact;
    const partial = products.find((p) => p.sku.toLowerCase().includes(skuLow) || skuLow.includes(p.sku.toLowerCase()));
    if (partial) return partial;
  }

  if (nameLow.length >= 4) {
    const byName = products.find((p) => p.name.toLowerCase().includes(nameLow) || nameLow.includes(p.name.toLowerCase()));
    if (byName) return byName;

    const words = nameLow.split(/\s+/).filter((w) => w.length >= 4);
    if (words.length >= 2) {
      const byWords = products.find((p) => {
        const pLow = p.name.toLowerCase();
        return words.filter((w) => pLow.includes(w)).length >= Math.min(2, Math.floor(words.length * 0.6));
      });
      if (byWords) return byWords;
    }
  }

  return null;
}

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

const WarehouseReceiptsTab = ({ receipts, products, suppliers, onCreate }: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    supplier_id: "", document_number: "", document_date: "", notes: "",
  });
  const [items, setItems] = useState<ReceiptItem[]>([{ product_id: 0, quantity: 1, price: 0 }]);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState<string | null>(null);
  const [aiError, setAiError] = useState("");
  const [aiCount, setAiCount] = useState<number | null>(null);

  const receiptTotal = items.reduce((s, i) => s + i.quantity * i.price, 0);

  const openCreate = () => {
    setForm({ supplier_id: "", document_number: "", document_date: new Date().toISOString().slice(0, 10), notes: "" });
    setItems([{ product_id: 0, quantity: 1, price: 0 }]);
    setAiPreview(null);
    setAiError("");
    setAiCount(null);
    setDialogOpen(true);
  };

  const addItem = () => {
    setItems((prev) => [...prev, { product_id: 0, quantity: 1, price: 0 }]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof ReceiptItem, value: number) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleCreate = async () => {
    const validItems = items.filter((i) => i.product_id && i.quantity > 0);
    await onCreate({
      supplier_id: form.supplier_id && form.supplier_id !== "none" ? Number(form.supplier_id) : null,
      document_number: form.document_number,
      document_date: form.document_date || null,
      notes: form.notes,
      items: validItems.map(({ product_id, quantity, price }) => ({ product_id, quantity, price })),
    });
    setDialogOpen(false);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setAiPreview(URL.createObjectURL(file));
    setAiLoading(true);
    setAiError("");
    setAiCount(null);

    try {
      const base64 = await compressImageToBase64(file, 1600, 0.88);
      const res = await fetch(PHOTO_RECOGNIZE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mode: "receipt_doc" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка ИИ");

      const receipt = data.receipt as {
        document_number: string;
        document_date: string;
        supplier: string;
        items: { name: string; sku: string; quantity: number; price: number; unit: string }[];
      };

      // Заполняем реквизиты если ещё не заполнены
      setForm((f) => ({
        ...f,
        document_number: f.document_number || receipt.document_number || "",
        document_date: f.document_date || receipt.document_date || f.document_date,
      }));

      // Сопоставляем строки с номенклатурой
      const newItems: ReceiptItem[] = receipt.items.map((it) => {
        const match = findProductMatch(it.name, it.sku, products);
        return {
          product_id: match?.id ?? 0,
          quantity: it.quantity || 1,
          price: it.price || (match ? Number(match.purchase_price) : 0),
          _aiName: it.name,
          _matched: !!match,
        };
      });

      if (newItems.length > 0) {
        // Заменяем пустые строки или добавляем
        const hasOnlyEmpty = items.length === 1 && !items[0].product_id;
        setItems(hasOnlyEmpty ? newItems : [...items, ...newItems]);
        setAiCount(newItems.length);
      } else {
        setAiError("ИИ не нашёл товарных строк в документе");
      }
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : "Не удалось распознать документ");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={openCreate}>
            <Icon name="FileInput" size={16} className="mr-1.5" />
            Новое поступление
          </Button>
        </div>

        {receipts.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-12 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="FileInput" size={28} className="text-green-500" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Поступлений пока нет</h3>
            <p className="text-sm text-muted-foreground mb-4">Оформите приход товара на склад</p>
            <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={openCreate}>
              <Icon name="FileInput" size={16} className="mr-1.5" />
              Оформить поступление
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {receipts.map((r) => (
              <ReceiptRow key={r.id} receipt={r} />
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Новое поступление товара</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 max-h-[80vh] overflow-y-auto pr-1">

            {/* AI документ */}
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

            {aiPreview ? (
              <div className={`flex items-start gap-3 rounded-lg px-3 py-2.5 border ${aiLoading ? "bg-blue-50 border-blue-100" : aiError ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}>
                <img src={aiPreview} alt="" className="w-12 h-12 object-cover rounded-md shrink-0 border border-border" />
                <div className="flex-1 min-w-0">
                  {aiLoading ? (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Icon name="Loader" size={14} className="animate-spin" />
                      ИИ читает документ и ищет строки…
                    </div>
                  ) : aiError ? (
                    <div className="text-sm text-red-600">{aiError}</div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700">
                        <Icon name="Sparkles" size={12} />
                        Добавлено {aiCount} строк из документа
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Строки с жёлтым фоном — не найдены в номенклатуре, выберите товар вручную
                      </div>
                    </>
                  )}
                </div>
                <button className="text-muted-foreground hover:text-foreground shrink-0" onClick={() => { setAiPreview(null); setAiError(""); setAiCount(null); }}>
                  <Icon name="X" size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-green-200 bg-green-50 hover:bg-green-100 transition-colors py-2.5 text-sm text-green-700 font-medium"
              >
                <Icon name="ScanLine" size={16} />
                Сфотографировать накладную / УПД / счёт — ИИ заполнит строки
              </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Поставщик</label>
                <Select value={form.supplier_id} onValueChange={(v) => setForm((f) => ({ ...f, supplier_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без поставщика</SelectItem>
                    {suppliers.filter((s) => s.is_active).map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Номер документа</label>
                <Input value={form.document_number} onChange={(e) => setForm((f) => ({ ...f, document_number: e.target.value }))} placeholder="УПД-123" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Дата документа</label>
                <Input type="date" value={form.document_date} onChange={(e) => setForm((f) => ({ ...f, document_date: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Товары</label>
                <div className="flex items-center gap-2">
                  {!aiPreview && (
                    <Button variant="outline" size="sm" className="text-green-700 border-green-200 hover:bg-green-50" onClick={() => photoInputRef.current?.click()} disabled={aiLoading}>
                      <Icon name="ScanLine" size={14} className="mr-1" />
                      Фото документа
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={addItem}>
                    <Icon name="Plus" size={14} className="mr-1" />
                    Добавить строку
                  </Button>
                </div>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Товар</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-3 py-2 w-20">Кол-во</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-3 py-2 w-28">Цена</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-3 py-2 w-28">Сумма</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className={`border-b border-border last:border-0 ${item._aiName && !item._matched ? "bg-amber-50" : ""}`}>
                        <td className="px-3 py-2">
                          {item._aiName && !item._matched && (
                            <div className="text-[10px] text-amber-600 mb-1 flex items-center gap-1">
                              <Icon name="AlertCircle" size={10} />
                              ИИ: «{item._aiName}» — не найдено в номенклатуре
                            </div>
                          )}
                          {item._aiName && item._matched && (
                            <div className="text-[10px] text-green-600 mb-1 flex items-center gap-1">
                              <Icon name="PackageCheck" size={10} />
                              ИИ: «{item._aiName}»
                            </div>
                          )}
                          <Select
                            value={String(item.product_id || "")}
                            onValueChange={(v) => {
                              const pid = Number(v);
                              const prod = products.find((p) => p.id === pid);
                              setItems((prev) => prev.map((it, i) => i === idx ? {
                                ...it,
                                product_id: pid,
                                price: prod ? Number(prod.purchase_price) : it.price,
                                _matched: true,
                              } : it));
                            }}
                          >
                            <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Выберите товар" /></SelectTrigger>
                            <SelectContent>
                              {products.filter((p) => p.is_active).map((p) => (
                                <SelectItem key={p.id} value={String(p.id)}>{p.sku} — {p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2">
                          <Input type="number" className="h-8 text-sm text-right" value={item.quantity || ""} onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))} />
                        </td>
                        <td className="px-3 py-2">
                          <Input type="number" className="h-8 text-sm text-right" value={item.price || ""} onChange={(e) => updateItem(idx, "price", Number(e.target.value))} />
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-medium">
                          {fmt(item.quantity * item.price)}
                        </td>
                        <td className="px-1 py-2">
                          {items.length > 1 && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeItem(idx)}>
                              <Icon name="X" size={14} className="text-red-400" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="bg-green-50 rounded-lg px-4 py-2">
                  <span className="text-sm text-muted-foreground mr-2">Итого:</span>
                  <span className="text-lg font-bold text-green-600">{fmt(receiptTotal)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Примечание</label>
              <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Необязательно" />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white" onClick={handleCreate}>
                <Icon name="FileInput" size={16} className="mr-1.5" />
                Оприходовать
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WarehouseReceiptsTab;