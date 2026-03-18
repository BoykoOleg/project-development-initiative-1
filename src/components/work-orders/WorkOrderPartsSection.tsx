import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PartItem } from "@/components/work-orders/types";
import func2url from "@/../func2url.json";

const PHOTO_RECOGNIZE_URL = (func2url as Record<string, string>)["photo-recognize"];

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

interface Product {
  id: number;
  sku: string;
  name: string;
  purchase_price: number;
  quantity: number;
  unit: string;
}

interface AddPartPayload {
  product_id?: number;
  name: string;
  qty: number;
  price: number;
  purchase_price: number;
}

interface Props {
  parts: PartItem[];
  products: Product[];
  isIssued: boolean;
  onAdd: (payload: AddPartPayload) => Promise<void>;
  onUpdate: (p: PartItem, form: { name: string; qty: number; price: number; purchase_price: number }) => Promise<void>;
  onDelete: (p: PartItem) => Promise<void>;
}

const emptyAddForm = { product_id: undefined as number | undefined, name: "", qty: 1, price: 0, purchase_price: 0 };

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",", 2)[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const WorkOrderPartsSection = ({ parts, products, isIssued, onAdd, onUpdate, onDelete }: Props) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", qty: 1, price: 0, purchase_price: 0 });

  const [addForm, setAddForm] = useState({ ...emptyAddForm });
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestIdx, setSuggestIdx] = useState(-1);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const suggestRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState<string | null>(null);
  const [aiComment, setAiComment] = useState<string>("");

  const partsTotal = parts.reduce((s, p) => s + p.price * p.qty, 0);
  const partsCost = parts.reduce((s, p) => s + (p.purchase_price || 0) * p.qty, 0);
  const partsMargin = partsTotal - partsCost;

  const suggestList = addForm.name.trim().length > 0
    ? products.filter((p) =>
        p.name.toLowerCase().includes(addForm.name.toLowerCase()) ||
        p.sku.toLowerCase().includes(addForm.name.toLowerCase())
      ).slice(0, 8)
    : [];

  const selectProduct = (prod: Product) => {
    setAddForm((f) => ({
      ...f,
      product_id: prod.id,
      name: prod.name,
      purchase_price: Number(prod.purchase_price),
    }));
    setShowSuggest(false);
    setSuggestIdx(-1);
    setTimeout(() => nameInputRef.current?.blur(), 0);
  };

  const handleAdd = async () => {
    if (!addForm.name.trim()) return;
    await onAdd({ product_id: addForm.product_id, name: addForm.name, qty: addForm.qty, price: addForm.price, purchase_price: addForm.purchase_price });
    setAddForm({ ...emptyAddForm });
    setSuggestIdx(-1);
    setShowSuggest(false);
    setAiPreview(null);
    setAiComment("");
    nameInputRef.current?.focus();
  };

  const handleUpdate = async (p: PartItem) => {
    if (!editForm.name.trim()) return;
    await onUpdate(p, editForm);
    setEditingId(null);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const previewUrl = URL.createObjectURL(file);
    setAiPreview(previewUrl);
    setAiLoading(true);
    setAiComment("");

    try {
      const base64 = await fileToBase64(file);
      const res = await fetch(PHOTO_RECOGNIZE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mode: "part" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка ИИ");

      const part = data.part as { name: string; sku: string; category: string; qty: number; comment: string };
      setAddForm((f) => ({
        ...f,
        name: part.name || f.name,
        qty: part.qty || f.qty,
        product_id: undefined,
      }));
      const hints: string[] = [];
      if (part.sku) hints.push(`Артикул: ${part.sku}`);
      if (part.category) hints.push(part.category);
      if (part.comment) hints.push(part.comment);
      setAiComment(hints.join(" · "));
    } catch (err: unknown) {
      setAiComment("Не удалось распознать. Введите название вручную.");
      console.error(err);
    } finally {
      setAiLoading(false);
      nameInputRef.current?.focus();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-border">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Запчасти и материалы</h3>
          {partsCost > 0 && (
            <div className="text-xs text-muted-foreground mt-0.5">
              Закупка: {fmt(partsCost)} · Наценка: <span className={partsMargin >= 0 ? "text-green-600" : "text-red-600"}>{fmt(partsMargin)}</span>
            </div>
          )}
        </div>
        <span className="text-sm font-semibold text-foreground">{fmt(partsTotal)}</span>
      </div>

      {parts.length > 0 ? (
        <div className="divide-y divide-border">
          {parts.map((p, i) => (
            <div key={p.id || i}>
              {editingId === p.id ? (
                <div className="flex flex-col gap-2 px-4 py-3">
                  <Input className="h-9 w-full" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(p); if (e.key === "Escape") setEditingId(null); }} autoFocus placeholder="Наименование" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Кол.</span>
                      <Input type="number" className="w-16 h-9" placeholder="1" value={editForm.qty || ""} onChange={(e) => setEditForm((f) => ({ ...f, qty: Number(e.target.value) }))} />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Закуп</span>
                      <Input type="number" className="w-24 h-9 bg-gray-50 text-muted-foreground" placeholder="0" value={editForm.purchase_price || ""} readOnly title="Цена прихода устанавливается через приход товара на склад" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Продажа</span>
                      <Input type="number" className="w-24 h-9" placeholder="0" value={editForm.price || ""} onChange={(e) => setEditForm((f) => ({ ...f, price: Number(e.target.value) }))} onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(p); }} />
                    </div>
                    <Button size="sm" className="h-9 bg-blue-500 hover:bg-blue-600 text-white px-3" onClick={() => handleUpdate(p)}><Icon name="Check" size={14} /></Button>
                    <Button size="sm" variant="ghost" className="h-9" onClick={() => setEditingId(null)}><Icon name="X" size={14} /></Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center px-4 sm:px-5 py-2.5 group hover:bg-muted/30">
                  <span className="text-sm text-muted-foreground w-7 shrink-0 hidden sm:block">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm text-foreground">{p.name}</span>
                      <span className="text-muted-foreground text-sm">× {p.qty}</span>
                      {p.product_id && <Icon name="Package" size={12} className="text-blue-400" />}
                    </div>
                    {(p.purchase_price || 0) > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Закуп: {fmt(p.purchase_price || 0)} → Продажа: {fmt(p.price)}
                        {p.price > (p.purchase_price || 0) && (
                          <span className="text-green-600 ml-1">+{fmt((p.price - (p.purchase_price || 0)) * p.qty)}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-foreground shrink-0 ml-3">
                    {(p.price * p.qty).toLocaleString("ru-RU")} ₽
                  </span>
                  {!isIssued && (
                    <div className="flex gap-1 ml-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setEditingId(p.id!); setEditForm({ name: p.name, qty: p.qty, price: p.price, purchase_price: p.purchase_price || 0 }); }}>
                        <Icon name="Pencil" size={13} className="text-muted-foreground" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onDelete(p)}>
                        <Icon name="Trash2" size={13} className="text-red-400" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground py-8 text-center">Запчасти не добавлены</div>
      )}

      {!isIssued && (
        <div className="border-t border-border px-3 py-3 space-y-2">
          {/* AI preview strip */}
          {(aiLoading || aiPreview) && (
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              {aiPreview && (
                <img src={aiPreview} alt="фото" className="w-14 h-14 object-cover rounded-md shrink-0 border border-blue-200" />
              )}
              <div className="flex-1 min-w-0">
                {aiLoading ? (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Icon name="Loader" size={14} className="animate-spin" />
                    ИИ распознаёт деталь…
                  </div>
                ) : (
                  <>
                    <div className="text-xs font-semibold text-blue-700">Распознано ИИ</div>
                    {aiComment && <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{aiComment}</div>}
                  </>
                )}
              </div>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
                onClick={() => { setAiPreview(null); setAiComment(""); }}
              >
                <Icon name="X" size={14} />
              </button>
            </div>
          )}

          {/* Input row */}
          <div className="flex flex-wrap gap-2 items-end">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoChange}
            />

            {/* Camera button */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block invisible">.</label>
              <Button
                type="button"
                variant="outline"
                className="h-9 w-9 p-0 shrink-0"
                title="Сфотографировать деталь — ИИ определит название"
                onClick={() => photoInputRef.current?.click()}
                disabled={aiLoading}
              >
                {aiLoading
                  ? <Icon name="Loader" size={15} className="animate-spin text-blue-500" />
                  : <Icon name="Camera" size={15} className="text-blue-500" />
                }
              </Button>
            </div>

            <div className="flex-1 min-w-[160px] relative">
              <label className="text-xs text-muted-foreground mb-1 block">Название или артикул</label>
              <Input
                ref={nameInputRef}
                placeholder="Начните вводить или сфотографируйте…"
                className="h-9"
                value={addForm.name}
                autoComplete="off"
                onChange={(e) => {
                  setAddForm((f) => ({ ...f, name: e.target.value, product_id: undefined }));
                  setShowSuggest(true);
                  setSuggestIdx(-1);
                }}
                onFocus={() => { setShowSuggest(true); setSuggestIdx(-1); }}
                onBlur={() => setTimeout(() => { setShowSuggest(false); setSuggestIdx(-1); }, 150)}
                onKeyDown={(e) => {
                  if (showSuggest && suggestList.length > 0) {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      const next = Math.min(suggestIdx + 1, suggestList.length - 1);
                      setSuggestIdx(next);
                      suggestRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
                      return;
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      const prev = Math.max(suggestIdx - 1, -1);
                      setSuggestIdx(prev);
                      if (prev >= 0) suggestRef.current?.children[prev]?.scrollIntoView({ block: "nearest" });
                      return;
                    }
                    if (e.key === "Enter" && suggestIdx >= 0) {
                      e.preventDefault();
                      selectProduct(suggestList[suggestIdx]);
                      return;
                    }
                  }
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") { setShowSuggest(false); setSuggestIdx(-1); }
                }}
              />
              {showSuggest && suggestList.length > 0 && (
                <div ref={suggestRef} className="absolute z-50 left-0 top-full mt-1 w-full bg-white border border-border rounded-lg shadow-xl max-h-52 overflow-y-auto">
                  {suggestList.map((prod, idx) => (
                    <div
                      key={prod.id}
                      className={`flex items-center justify-between px-3 py-2 cursor-pointer text-sm transition-colors ${idx === suggestIdx ? "bg-blue-50 text-blue-700" : "hover:bg-muted/40"}`}
                      onMouseDown={() => selectProduct(prod)}
                      onMouseEnter={() => setSuggestIdx(idx)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-xs bg-muted px-1 rounded shrink-0">{prod.sku}</span>
                        <span className="truncate">{prod.name}</span>
                      </div>
                      <div className="text-xs shrink-0 ml-2 text-right">
                        <span className="text-muted-foreground">{prod.quantity} {prod.unit}</span>
                        {prod.purchase_price > 0 && <span className="text-blue-600 ml-1.5">{fmt(prod.purchase_price)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="w-16">
              <label className="text-xs text-muted-foreground mb-1 block">Кол.</label>
              <Input inputMode="numeric" className="h-9 text-center" value={addForm.qty || ""} onChange={(e) => setAddForm((f) => ({ ...f, qty: Number(e.target.value) }))} onWheel={(e) => e.currentTarget.blur()} />
            </div>
            <div className="w-24">
              <label className="text-xs text-muted-foreground mb-1 block">Закуп, ₽</label>
              <Input
                inputMode="numeric"
                className={`h-9 text-right ${addForm.product_id ? "bg-gray-50 text-muted-foreground" : ""}`}
                value={addForm.purchase_price || ""}
                readOnly={!!addForm.product_id}
                onChange={(e) => !addForm.product_id && setAddForm((f) => ({ ...f, purchase_price: Number(e.target.value) }))}
                onWheel={(e) => e.currentTarget.blur()}
              />
            </div>
            <div className="w-28">
              <label className="text-xs text-muted-foreground mb-1 block">Продажа, ₽</label>
              <Input
                inputMode="numeric"
                className="h-9 text-right font-semibold"
                value={addForm.price || ""}
                onChange={(e) => setAddForm((f) => ({ ...f, price: Number(e.target.value) }))}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                onWheel={(e) => e.currentTarget.blur()}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block invisible">.</label>
              <Button className="h-9 bg-blue-500 hover:bg-blue-600 text-white px-4" onClick={handleAdd}>
                <Icon name="Plus" size={15} className="mr-1" />
                Добавить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrderPartsSection;
