import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Product, AddPartPayload, fmt } from "@/components/work-orders/parts-types";

interface AddFormState {
  product_id?: number;
  part_number?: string;
  name: string;
  qty: number;
  price: number;
  purchase_price: number;
}

interface Props {
  products: Product[];
  addForm: AddFormState;
  aiLoading: boolean;
  onFormChange: (form: AddFormState) => void;
  onAdd: () => void;
  onPhotoClick: () => void;
  photoInputRef: React.RefObject<HTMLInputElement>;
  nameInputRef: React.RefObject<HTMLInputElement>;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AddPartForm = ({
  products,
  addForm,
  aiLoading,
  onFormChange,
  onAdd,
  onPhotoClick,
  photoInputRef,
  nameInputRef,
  onPhotoChange,
}: Props) => {
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestIdx, setSuggestIdx] = useState(-1);
  const suggestRef = useRef<HTMLDivElement>(null);

  const suggestList = addForm.name.trim().length > 0
    ? products.filter((p) =>
        p.name.toLowerCase().includes(addForm.name.toLowerCase()) ||
        p.sku.toLowerCase().includes(addForm.name.toLowerCase())
      ).slice(0, 8)
    : [];

  const selectProduct = (prod: Product) => {
    onFormChange({
      ...addForm,
      product_id: prod.id,
      part_number: prod.sku || addForm.part_number,
      name: prod.name,
      purchase_price: Number(prod.purchase_price),
    });
    setShowSuggest(false);
    setSuggestIdx(-1);
    setTimeout(() => nameInputRef.current?.blur(), 0);
  };

  return (
    <div className="flex flex-wrap gap-2 items-end">
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPhotoChange}
      />
      <div>
        <label className="text-xs text-muted-foreground mb-1 block invisible">.</label>
        <Button
          type="button"
          variant="outline"
          className="h-9 w-9 p-0 shrink-0"
          title="Сфотографируйте деталь — ИИ определит название и проверит наличие на складе"
          onClick={onPhotoClick}
          disabled={aiLoading}
        >
          {aiLoading
            ? <Icon name="Loader" size={15} className="animate-spin text-blue-500" />
            : <Icon name="Camera" size={15} className="text-blue-500" />
          }
        </Button>
      </div>

      <div className="w-32">
        <label className="text-xs text-muted-foreground mb-1 block">Номер детали</label>
        <Input
          className="h-9 font-mono text-sm"
          placeholder="Арт./номер"
          value={addForm.part_number || ""}
          onChange={(e) => onFormChange({ ...addForm, part_number: e.target.value })}
          onKeyDown={(e) => { if (e.key === "Enter") onAdd(); }}
        />
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
            onFormChange({ ...addForm, name: e.target.value, product_id: undefined });
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
            if (e.key === "Enter") onAdd();
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
        <Input inputMode="numeric" className="h-9 text-center" value={addForm.qty || ""} onChange={(e) => onFormChange({ ...addForm, qty: Number(e.target.value) })} onWheel={(e) => e.currentTarget.blur()} />
      </div>

      <div className="w-24">
        <label className="text-xs text-muted-foreground mb-1 block">Закуп, ₽</label>
        <Input
          inputMode="numeric"
          className={`h-9 text-right ${addForm.product_id ? "bg-gray-50 text-muted-foreground" : ""}`}
          value={addForm.purchase_price || ""}
          readOnly={!!addForm.product_id}
          onChange={(e) => !addForm.product_id && onFormChange({ ...addForm, purchase_price: Number(e.target.value) })}
          onWheel={(e) => e.currentTarget.blur()}
        />
      </div>

      <div className="w-28">
        <label className="text-xs text-muted-foreground mb-1 block">Продажа, ₽</label>
        <Input
          inputMode="numeric"
          className="h-9 text-right font-semibold"
          value={addForm.price || ""}
          onChange={(e) => onFormChange({ ...addForm, price: Number(e.target.value) })}
          onKeyDown={(e) => { if (e.key === "Enter") onAdd(); }}
          onWheel={(e) => e.currentTarget.blur()}
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block invisible">.</label>
        <Button className="h-9 bg-blue-500 hover:bg-blue-600 text-white px-4" onClick={onAdd}>
          <Icon name="Plus" size={15} className="mr-1" />
          Добавить
        </Button>
      </div>
    </div>
  );
};

export default AddPartForm;