import { useState, useRef } from "react";
import { PartItem, Product, AddPartPayload, AiPart, emptyAddForm, matchStock, fmt } from "@/components/work-orders/parts-types";
import { getApiUrl } from "@/lib/api";
import { compressImageToBase64 } from "@/lib/imageUtils";
import PartsTable from "@/components/work-orders/PartsTable";
import AiPartsPanel from "@/components/work-orders/AiPartsPanel";
import AddPartForm from "@/components/work-orders/AddPartForm";

const PHOTO_RECOGNIZE_URL = getApiUrl("photo-recognize");

interface Props {
  parts: PartItem[];
  products: Product[];
  isIssued: boolean;
  onAdd: (payload: AddPartPayload) => Promise<void>;
  onUpdate: (p: PartItem, form: { name: string; qty: number; price: number; purchase_price: number }) => Promise<void>;
  onDelete: (p: PartItem) => Promise<void>;
}

const WorkOrderPartsSection = ({ parts, products, isIssued, onAdd, onUpdate, onDelete }: Props) => {
  const [addForm, setAddForm] = useState({ ...emptyAddForm });
  const nameInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string>("");
  const [singleMatch, setSingleMatch] = useState<Product | null | undefined>(undefined);

  const [aiList, setAiList] = useState<AiPart[]>([]);
  const [addingAll, setAddingAll] = useState(false);

  const partsTotal = parts.reduce((s, p) => s + p.price * p.qty, 0);
  const partsCost = parts.reduce((s, p) => s + (p.purchase_price || 0) * p.qty, 0);
  const partsMargin = partsTotal - partsCost;

  const handleAdd = async () => {
    if (!addForm.name.trim()) return;
    await onAdd({ product_id: addForm.product_id, name: addForm.name, qty: addForm.qty, price: addForm.price, purchase_price: addForm.purchase_price });
    setAddForm({ ...emptyAddForm });
    setAiPreview(null);
    setAiError("");
    setSingleMatch(undefined);
    nameInputRef.current?.focus();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const previewUrl = URL.createObjectURL(file);
    setAiPreview(previewUrl);
    setAiLoading(true);
    setAiError("");
    setAiList([]);
    setSingleMatch(undefined);

    try {
      const base64 = await compressImageToBase64(file);
      const res = await fetch(PHOTO_RECOGNIZE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mode: "parts_bulk" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка ИИ");

      const recognized: AiPart[] = (data.parts as AiPart[]).map((p) => ({
        ...p,
        selected: true,
        price: 0,
        purchase_price: 0,
        stockMatch: matchStock(p, products),
      }));

      if (recognized.length === 1) {
        const single = recognized[0];
        const match = single.stockMatch ?? null;
        setSingleMatch(match);
        setAddForm((f) => ({
          ...f,
          name: match ? match.name : (single.name || f.name),
          qty: single.qty || f.qty,
          product_id: match?.id,
          purchase_price: match ? Number(match.purchase_price) : f.purchase_price,
        }));
        setAiList([]);
      } else {
        setAiList(recognized);
      }
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : "Не удалось распознать. Введите название вручную.");
    } finally {
      setAiLoading(false);
      nameInputRef.current?.focus();
    }
  };

  const handleAddSelected = async () => {
    const selected = aiList.filter((p) => p.selected && p.name.trim());
    if (!selected.length) return;
    setAddingAll(true);
    for (const p of selected) {
      const match = p.stockMatch;
      await onAdd({
        name: match ? match.name : p.name,
        qty: p.qty,
        price: p.price,
        purchase_price: match ? Number(match.purchase_price) : p.purchase_price,
        product_id: match?.id,
      });
    }
    setAiList([]);
    setAiPreview(null);
    setAiError("");
    setAddingAll(false);
  };

  const dismissAi = () => {
    setAiPreview(null);
    setAiError("");
    setAiList([]);
    setSingleMatch(undefined);
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

      <PartsTable
        parts={parts}
        isIssued={isIssued}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />

      {!isIssued && (
        <div className="border-t border-border px-3 py-3 space-y-2">
          <AiPartsPanel
            aiLoading={aiLoading}
            aiPreview={aiPreview}
            aiError={aiError}
            aiList={aiList}
            singleMatch={singleMatch}
            addingAll={addingAll}
            onDismiss={dismissAi}
            onAiListChange={setAiList}
            onAddSelected={handleAddSelected}
          />

          <AddPartForm
            products={products}
            addForm={addForm}
            aiLoading={aiLoading}
            onFormChange={setAddForm}
            onAdd={handleAdd}
            onPhotoClick={() => photoInputRef.current?.click()}
            photoInputRef={photoInputRef}
            nameInputRef={nameInputRef}
            onPhotoChange={handlePhotoChange}
          />
        </div>
      )}
    </div>
  );
};

export default WorkOrderPartsSection;
