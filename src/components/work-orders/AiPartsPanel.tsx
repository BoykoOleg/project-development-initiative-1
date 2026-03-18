import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AiPart, fmt } from "@/components/work-orders/parts-types";

interface Props {
  aiLoading: boolean;
  aiPreview: string | null;
  aiError: string;
  aiList: AiPart[];
  singleMatch: import("@/components/work-orders/parts-types").Product | null | undefined;
  addingAll: boolean;
  onDismiss: () => void;
  onAiListChange: (list: AiPart[]) => void;
  onAddSelected: () => void;
}

const AiPartsPanel = ({
  aiLoading,
  aiPreview,
  aiError,
  aiList,
  singleMatch,
  addingAll,
  onDismiss,
  onAiListChange,
  onAddSelected,
}: Props) => {
  const showSingleStrip = aiLoading || aiError || (aiPreview && aiList.length === 0);

  return (
    <>
      {showSingleStrip && (
        <div className={`flex items-start gap-3 rounded-lg px-3 py-2 border ${aiError ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100"}`}>
          {aiPreview && (
            <img src={aiPreview} alt="фото" className="w-14 h-14 object-cover rounded-md shrink-0 border border-blue-200" />
          )}
          <div className="flex-1 min-w-0 space-y-1">
            {aiLoading ? (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Icon name="Loader" size={14} className="animate-spin" />
                ИИ анализирует фото и проверяет склад…
              </div>
            ) : aiError ? (
              <div className="text-sm text-red-600">{aiError}</div>
            ) : singleMatch !== undefined ? (
              singleMatch ? (
                <>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700">
                    <Icon name="PackageCheck" size={13} />
                    Найдено на складе
                  </div>
                  <div className="text-sm font-medium text-foreground">{singleMatch.name}</div>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                    {singleMatch.sku && <span className="font-mono bg-white border border-border rounded px-1">{singleMatch.sku}</span>}
                    <span className={singleMatch.quantity > 0 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                      {singleMatch.quantity > 0 ? `${singleMatch.quantity} ${singleMatch.unit} в наличии` : "Нет в наличии"}
                    </span>
                    {singleMatch.purchase_price > 0 && <span>Закуп: {fmt(singleMatch.purchase_price)}</span>}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                    <Icon name="PackageX" size={13} />
                    Не найдено на складе
                  </div>
                  <div className="text-xs text-muted-foreground">Введите цену и добавьте вручную</div>
                </>
              )
            ) : (
              <div className="text-xs text-blue-700">Деталь определена, введите цену продажи</div>
            )}
          </div>
          <button className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5" onClick={onDismiss}>
            <Icon name="X" size={14} />
          </button>
        </div>
      )}

      {aiList.length > 0 && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-blue-100">
            <div className="flex items-center gap-2">
              {aiPreview && <img src={aiPreview} alt="" className="w-8 h-8 object-cover rounded border border-blue-200" />}
              <div>
                <div className="text-xs font-semibold text-blue-700">ИИ распознал {aiList.length} позиций</div>
                <div className="text-[10px] text-muted-foreground">
                  {aiList.filter((x) => x.stockMatch).length > 0
                    ? `${aiList.filter((x) => x.stockMatch).length} найдено на складе · `
                    : ""}
                  Отметьте нужные и нажмите «Добавить выбранные»
                </div>
              </div>
            </div>
            <button className="text-muted-foreground hover:text-foreground" onClick={onDismiss}>
              <Icon name="X" size={14} />
            </button>
          </div>

          <div className="divide-y divide-blue-100 max-h-80 overflow-y-auto">
            {aiList.map((item, idx) => {
              const match = item.stockMatch;
              return (
                <div key={idx} className={`flex items-start gap-2 px-3 py-2 transition-colors ${item.selected ? "bg-white" : "bg-blue-50/40 opacity-60"}`}>
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={(e) => onAiListChange(aiList.map((x, i) => i === idx ? { ...x, selected: e.target.checked } : x))}
                    className="mt-1 h-4 w-4 accent-blue-500 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <Input
                      className="h-7 text-sm mb-0.5 border-0 border-b rounded-none px-0 focus-visible:ring-0 bg-transparent"
                      value={item.name}
                      onChange={(e) => onAiListChange(aiList.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                    />
                    {match ? (
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                        <span className="flex items-center gap-0.5 text-green-600 font-medium">
                          <Icon name="PackageCheck" size={10} />
                          На складе
                        </span>
                        {match.sku && <span className="font-mono bg-muted px-1 rounded">{match.sku}</span>}
                        <span className={match.quantity > 0 ? "text-green-600" : "text-red-500"}>
                          {match.quantity} {match.unit}
                        </span>
                        {match.purchase_price > 0 && <span className="text-muted-foreground">· {fmt(match.purchase_price)}</span>}
                      </div>
                    ) : (
                      item.comment && <div className="text-[10px] text-muted-foreground truncate">{item.sku ? `${item.sku} · ` : ""}{item.comment}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Input
                      inputMode="numeric"
                      className="w-12 h-7 text-center text-xs"
                      placeholder="кол."
                      value={item.qty || ""}
                      onChange={(e) => onAiListChange(aiList.map((x, i) => i === idx ? { ...x, qty: Number(e.target.value) } : x))}
                    />
                    <Input
                      inputMode="numeric"
                      className="w-20 h-7 text-right text-xs font-semibold"
                      placeholder="цена ₽"
                      value={item.price || ""}
                      onChange={(e) => onAiListChange(aiList.map((x, i) => i === idx ? { ...x, price: Number(e.target.value) } : x))}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center px-3 py-2 border-t border-blue-100 bg-blue-50">
            <button
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onAiListChange(aiList.map((x) => ({ ...x, selected: !aiList.every((y) => y.selected) })))}
            >
              {aiList.every((x) => x.selected) ? "Снять все" : "Выбрать все"}
            </button>
            <Button size="sm" className="h-8 bg-blue-500 hover:bg-blue-600 text-white px-4" disabled={addingAll || !aiList.some((x) => x.selected)} onClick={onAddSelected}>
              {addingAll ? <Icon name="Loader" size={13} className="animate-spin mr-1.5" /> : <Icon name="Plus" size={13} className="mr-1.5" />}
              Добавить выбранные ({aiList.filter((x) => x.selected).length})
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default AiPartsPanel;
