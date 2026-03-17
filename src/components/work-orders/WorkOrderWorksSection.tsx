import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkItem } from "@/components/work-orders/types";
import { getApiUrl } from "@/lib/api";

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 2 }).format(n);

interface CatalogWork {
  id: number;
  code: string;
  name: string;
  norm_hours: number;
}

interface Employee {
  id: number;
  name: string;
  is_active: boolean;
}

interface WorkForm {
  name: string;
  price: number;
  qty: number;
  norm_hours: number;
  norm_hour_price: number;
  discount: number;
  employee_id: number | null;
}

interface Props {
  works: WorkItem[];
  isIssued: boolean;
  onAdd: (form: WorkForm) => Promise<void>;
  onUpdate: (w: WorkItem, form: WorkForm) => Promise<void>;
  onDelete: (w: WorkItem) => Promise<void>;
}

const emptyForm: WorkForm = { name: "", price: 0, qty: 1, norm_hours: 0, norm_hour_price: 0, discount: 0, employee_id: null };

const WorkOrderWorksSection = ({ works, isIssued, onAdd, onUpdate, onDelete }: Props) => {
  const [addForm, setAddForm] = useState<WorkForm>({ ...emptyForm });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<WorkForm>({ ...emptyForm });
  const [normHourPrice, setNormHourPrice] = useState(2000);
  const [catalog, setCatalog] = useState<CatalogWork[]>([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [showCatalog, setShowCatalog] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empPickerId, setEmpPickerId] = useState<number | null>(null);
  const empPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const woUrl = getApiUrl("works-catalog");
    const empUrl = getApiUrl("employees");
    const promises: Promise<void>[] = [];
    if (woUrl) {
      promises.push(
        Promise.all([
          fetch(`${woUrl}?action=settings`).then((r) => r.json()),
          fetch(woUrl).then((r) => r.json()),
        ]).then(([settings, catalogData]) => {
          if (settings.norm_hour_price) setNormHourPrice(settings.norm_hour_price);
          if (catalogData.works) setCatalog(catalogData.works);
        }).catch(() => {})
      );
    }
    if (empUrl) {
      promises.push(
        fetch(empUrl)
          .then((r) => r.json())
          .then((d) => { if (d.employees) setEmployees(d.employees.filter((e: Employee) => e.is_active)); })
          .catch(() => {})
      );
    }
    Promise.all(promises);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (empPickerRef.current && !empPickerRef.current.contains(e.target as Node)) {
        setEmpPickerId(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const worksTotal = works.reduce((s, w) => s + w.price, 0);

  const calcPrice = (norm_hours: number, nh_price: number, qty: number, discount: number) =>
    Math.max(0, norm_hours * nh_price * qty - discount);

  const handleAdd = async () => {
    if (!addForm.name.trim()) return;
    await onAdd(addForm);
    setAddForm({ ...emptyForm });
    setShowCatalog(false);
    setCatalogSearch("");
  };

  const handleUpdate = async (w: WorkItem) => {
    if (!editForm.name.trim()) return;
    await onUpdate(w, editForm);
    setEditingId(null);
  };

  const selectFromCatalog = (item: CatalogWork) => {
    const price = calcPrice(item.norm_hours, normHourPrice, 1, 0);
    setAddForm((f) => ({ ...f, name: item.name, price, qty: 1, norm_hours: item.norm_hours, norm_hour_price: normHourPrice, discount: 0 }));
    setShowCatalog(false);
    setCatalogSearch("");
  };

  const filteredCatalog = catalogSearch
    ? catalog.filter((c) =>
        c.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        c.code.toLowerCase().includes(catalogSearch.toLowerCase())
      )
    : catalog;

  const updateAddFormNormHours = (norm_hours: number) => {
    const price = calcPrice(norm_hours, addForm.norm_hour_price || normHourPrice, addForm.qty, addForm.discount);
    setAddForm((f) => ({ ...f, norm_hours, norm_hour_price: f.norm_hour_price || normHourPrice, price }));
  };

  const updateAddFormNormHourPrice = (nh_price: number) => {
    const price = calcPrice(addForm.norm_hours, nh_price, addForm.qty, addForm.discount);
    setAddForm((f) => ({ ...f, norm_hour_price: nh_price, price }));
  };

  const updateEditFormNormHours = (norm_hours: number) => {
    const price = calcPrice(norm_hours, editForm.norm_hour_price || normHourPrice, editForm.qty, editForm.discount);
    setEditForm((f) => ({ ...f, norm_hours, price }));
  };

  const updateEditFormNormHourPrice = (nh_price: number) => {
    const price = calcPrice(editForm.norm_hours, nh_price, editForm.qty, editForm.discount);
    setEditForm((f) => ({ ...f, norm_hour_price: nh_price, price }));
  };

  const startEdit = (w: WorkItem) => {
    setEditingId(w.id!);
    setEditForm({
      name: w.name, price: w.price, qty: w.qty,
      norm_hours: w.norm_hours, norm_hour_price: w.norm_hour_price || normHourPrice,
      discount: w.discount, employee_id: w.employee_id ?? null,
    });
  };

  const handleEmpPickForWork = async (w: WorkItem, empId: number | null) => {
    setEmpPickerId(null);
    await onUpdate(w, {
      name: w.name, price: w.price, qty: w.qty,
      norm_hours: w.norm_hours, norm_hour_price: w.norm_hour_price || normHourPrice,
      discount: w.discount, employee_id: empId,
    });
  };

  const getShortName = (fullName: string) => {
    const parts = fullName.trim().split(" ");
    if (parts.length === 1) return parts[0];
    return parts[0] + " " + parts.slice(1).map((p) => p[0] + ".").join("");
  };

  return (
    <div className="bg-white rounded-xl border border-border">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Работы</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">1 н/ч = {normHourPrice.toLocaleString("ru-RU")} ₽</span>
          <span className="text-sm font-semibold text-foreground">{fmt(worksTotal)}</span>
        </div>
      </div>

      {works.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left px-3 py-1.5 w-8 hidden sm:table-cell">№</th>
                <th className="text-left px-3 py-1.5">Наименование</th>
                <th className="text-center px-3 py-1.5 w-12 hidden sm:table-cell">Кол.</th>
                <th className="text-center px-3 py-1.5 w-16 hidden md:table-cell">Н/ч</th>
                <th className="text-right px-3 py-1.5 w-24 hidden md:table-cell">Цена н/ч</th>
                <th className="text-right px-3 py-1.5 w-16 hidden md:table-cell">Скидка</th>
                <th className="text-right px-3 py-1.5 w-24">Итого</th>
                <th className="text-left px-3 py-1.5 w-24 hidden sm:table-cell">Исполнитель</th>
                {!isIssued && <th className="w-16"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {works.map((w, i) => (
                <tr key={w.id || i} className="group hover:bg-muted/30">
                  {editingId === w.id ? (
                    <>
                      <td className="px-3 py-1.5 text-muted-foreground hidden sm:table-cell">{i + 1}</td>
                      <td className="px-3 py-1.5">
                        <Input className="h-8 text-sm" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(w); if (e.key === "Escape") setEditingId(null); }} />
                      </td>
                      <td className="px-3 py-1.5 hidden sm:table-cell"><Input type="number" className="h-8 w-12 text-sm text-center" value={editForm.qty || ""} onChange={(e) => setEditForm((f) => ({ ...f, qty: Number(e.target.value) }))} /></td>
                      <td className="px-3 py-1.5 hidden md:table-cell">
                        <Input type="number" step="0.1" className="h-8 w-16 text-sm text-center" value={editForm.norm_hours || ""} onChange={(e) => updateEditFormNormHours(Number(e.target.value))} />
                      </td>
                      <td className="px-3 py-1.5 hidden md:table-cell">
                        <Input type="number" className="h-8 w-20 text-sm text-right" value={editForm.norm_hour_price || ""} onChange={(e) => updateEditFormNormHourPrice(Number(e.target.value))} />
                      </td>
                      <td className="px-3 py-1.5 hidden md:table-cell"><Input type="number" className="h-8 w-16 text-sm text-right" value={editForm.discount || ""} onChange={(e) => setEditForm((f) => ({ ...f, discount: Number(e.target.value) }))} /></td>
                      <td className="px-3 py-1.5">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs font-semibold text-blue-600">{fmt(editForm.price)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 hidden sm:table-cell">
                        <select
                          className="h-8 text-xs border border-border rounded px-1 w-full bg-white"
                          value={editForm.employee_id ?? ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, employee_id: e.target.value ? Number(e.target.value) : null }))}
                        >
                          <option value="">— не выбран</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="flex gap-1">
                          <Button size="sm" className="h-7 w-7 p-0 bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleUpdate(w)}><Icon name="Check" size={13} /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingId(null)}><Icon name="X" size={13} /></Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-1.5 text-muted-foreground hidden sm:table-cell">{i + 1}</td>
                      <td className="px-3 py-1.5 cursor-text select-none" onDoubleClick={() => { if (!isIssued) startEdit(w); }}>{w.name}</td>
                      <td className="px-3 py-1.5 text-center cursor-text select-none hidden sm:table-cell" onDoubleClick={() => { if (!isIssued) startEdit(w); }}>{w.qty}</td>
                      <td className="px-3 py-1.5 text-center text-blue-600 font-medium cursor-text select-none hidden md:table-cell" onDoubleClick={() => { if (!isIssued) startEdit(w); }}>{w.norm_hours ? `${w.norm_hours} н/ч` : "—"}</td>
                      <td className="px-3 py-1.5 text-right cursor-text select-none hidden md:table-cell" onDoubleClick={() => { if (!isIssued) startEdit(w); }}>{w.norm_hour_price ? w.norm_hour_price.toLocaleString("ru-RU") : "—"}</td>
                      <td className="px-3 py-1.5 text-right cursor-text select-none hidden md:table-cell" onDoubleClick={() => { if (!isIssued) startEdit(w); }}>{w.discount ? fmt(w.discount) : "—"}</td>
                      <td className="px-3 py-1.5 text-right font-semibold cursor-text select-none" onDoubleClick={() => { if (!isIssued) startEdit(w); }}>{fmt(w.price)}</td>
                      <td className="px-3 py-1.5 relative hidden sm:table-cell">
                        {!isIssued ? (
                          <div className="relative">
                            <button
                              className="text-xs text-left w-full rounded px-1.5 py-0.5 hover:bg-muted/60 transition-colors"
                              onDoubleClick={() => setEmpPickerId(empPickerId === w.id ? null : w.id!)}
                              title="Двойной клик — выбрать исполнителя"
                            >
                              {w.employee_name ? (
                                <span className="font-medium text-foreground">{getShortName(w.employee_name)}</span>
                              ) : (
                                <span className="text-muted-foreground/60 italic">не задан</span>
                              )}
                            </button>
                            {empPickerId === w.id && (
                              <div ref={empPickerRef} className="absolute z-50 top-full left-0 mt-1 bg-white border border-border rounded-lg shadow-lg min-w-[160px] overflow-hidden">
                                <button
                                  className="w-full text-left text-xs px-3 py-2 hover:bg-muted/40 text-muted-foreground italic"
                                  onClick={() => handleEmpPickForWork(w, null)}
                                >
                                  — не задан
                                </button>
                                {employees.map((emp) => (
                                  <button
                                    key={emp.id}
                                    className={`w-full text-left text-xs px-3 py-2 hover:bg-blue-50 hover:text-blue-700 transition-colors ${w.employee_id === emp.id ? "bg-blue-50 text-blue-700 font-medium" : ""}`}
                                    onClick={() => handleEmpPickForWork(w, emp.id)}
                                  >
                                    {emp.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-foreground">{w.employee_name || "—"}</span>
                        )}
                      </td>
                      {!isIssued && (
                        <td className="px-3 py-1.5">
                          <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => startEdit(w)}>
                              <Icon name="Pencil" size={13} className="text-muted-foreground" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onDelete(w)}>
                              <Icon name="Trash2" size={13} className="text-red-400" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground py-8 text-center">Работы не добавлены</div>
      )}

      {!isIssued && (
        <div className="border-t border-border px-3 py-3 space-y-3">
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => setShowCatalog((v) => !v)}
            >
              <Icon name="BookOpen" size={14} />
              Выбрать из каталога
            </Button>
            {addForm.name && (
              <span className="text-xs text-muted-foreground">Выбрано: <span className="font-medium text-foreground">{addForm.name}</span></span>
            )}
          </div>

          {showCatalog && (
            <div className="border border-border rounded-lg bg-white shadow-sm max-h-48 overflow-hidden flex flex-col">
              <div className="p-2 border-b border-border">
                <Input
                  className="h-8 text-sm"
                  placeholder="Поиск по каталогу..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto">
                {filteredCatalog.length === 0 ? (
                  <div className="text-center py-4 text-xs text-muted-foreground">Ничего не найдено</div>
                ) : filteredCatalog.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-muted/40 cursor-pointer text-sm"
                    onClick={() => selectFromCatalog(item)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-muted px-1 rounded">{item.code}</span>
                      <span>{item.name}</span>
                    </div>
                    <span className="text-blue-600 font-medium text-xs shrink-0 ml-2">{item.norm_hours} н/ч · {(item.norm_hours * normHourPrice).toLocaleString("ru-RU")} ₽</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground mb-1 block">Название</label>
              <Input placeholder="Название работы" className="h-9" value={addForm.name} onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }} />
            </div>
            <div className="w-16">
              <label className="text-xs text-muted-foreground mb-1 block">Кол.</label>
              <Input type="number" className="h-9 text-center" value={addForm.qty || ""} onChange={(e) => setAddForm((p) => ({ ...p, qty: Number(e.target.value) }))} />
            </div>
            <div className="w-20">
              <label className="text-xs text-muted-foreground mb-1 block">Н/ч</label>
              <Input type="number" step="0.1" className="h-9 text-center" value={addForm.norm_hours || ""} onChange={(e) => updateAddFormNormHours(Number(e.target.value))} />
            </div>
            <div className="w-24">
              <label className="text-xs text-muted-foreground mb-1 block">Цена н/ч</label>
              <Input type="number" className="h-9 text-right" value={addForm.norm_hour_price || normHourPrice} onChange={(e) => updateAddFormNormHourPrice(Number(e.target.value))} />
            </div>
            <div className="w-24">
              <label className="text-xs text-muted-foreground mb-1 block">Скидка, ₽</label>
              <Input type="number" className="h-9 text-right" value={addForm.discount || ""} onChange={(e) => setAddForm((p) => ({ ...p, discount: Number(e.target.value) }))} />
            </div>
            <div className="w-28">
              <label className="text-xs text-muted-foreground mb-1 block">Итого, ₽</label>
              <Input type="number" placeholder="Цена" className="h-9 text-right font-semibold" value={addForm.price || ""} onChange={(e) => setAddForm((p) => ({ ...p, price: Number(e.target.value) }))} onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }} />
            </div>
            <div className="w-36">
              <label className="text-xs text-muted-foreground mb-1 block">Исполнитель</label>
              <select
                className="h-9 text-sm border border-border rounded-md px-2 w-full bg-white"
                value={addForm.employee_id ?? ""}
                onChange={(e) => setAddForm((p) => ({ ...p, employee_id: e.target.value ? Number(e.target.value) : null }))}
              >
                <option value="">— не выбран</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white shrink-0 h-9" onClick={handleAdd}>
              <Icon name="Plus" size={16} className="mr-1.5" />Добавить
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrderWorksSection;