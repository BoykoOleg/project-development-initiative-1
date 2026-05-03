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
import ReceiptItemsTable, { ReceiptItem } from "@/components/warehouse/ReceiptItemsTable";

const PHOTO_RECOGNIZE_URL = getApiUrl("photo-recognize");

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

interface ReceiptPayload {
  supplier_id: number | null;
  document_number: string;
  document_date: string | null;
  notes: string;
  items: { product_id: number; quantity: number; price: number }[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  suppliers: Supplier[];
  onCreate: (payload: ReceiptPayload) => Promise<void>;
  initialForm: { supplier_id: string; document_number: string; document_date: string; notes: string };
  initialItems: ReceiptItem[];
}

const ReceiptFormDialog = ({ open, onOpenChange, products, suppliers, onCreate, initialForm, initialItems }: Props) => {
  const [form, setForm] = useState(initialForm);
  const [items, setItems] = useState<ReceiptItem[]>(initialItems);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState<string | null>(null);
  const [aiError, setAiError] = useState("");
  const [aiCount, setAiCount] = useState<number | null>(null);

  const receiptTotal = items.reduce((s, i) => s + i.quantity * i.price, 0);

  // Sync state when dialog opens with fresh initial values
  const handleOpenChange = (val: boolean) => {
    if (val) {
      setForm(initialForm);
      setItems(initialItems);
      setAiPreview(null);
      setAiError("");
      setAiCount(null);
    }
    onOpenChange(val);
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
    onOpenChange(false);
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

      setForm((f) => ({
        ...f,
        document_number: f.document_number || receipt.document_number || "",
        document_date: f.document_date || receipt.document_date || f.document_date,
      }));

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Новое поступление товара</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2 max-h-[80vh] overflow-y-auto pr-1">

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

          <ReceiptItemsTable
            items={items}
            products={products}
            aiPreview={aiPreview}
            receiptTotal={receiptTotal}
            onAdd={addItem}
            onRemove={removeItem}
            onUpdate={updateItem}
            onSetItems={setItems}
            onPhotoClick={() => photoInputRef.current?.click()}
            aiLoading={aiLoading}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Примечание</label>
            <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Необязательно" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white" onClick={handleCreate}>
              <Icon name="FileInput" size={16} className="mr-1.5" />
              Оприходовать
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptFormDialog;
