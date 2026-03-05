import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";

interface WorkCatalogItem {
  id: number;
  code: string;
  name: string;
  norm_hours: number;
  is_active: boolean;
}

const emptyForm = { code: "", name: "", norm_hours: 1 };

const WorksCatalog = () => {
  const [works, setWorks] = useState<WorkCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [normHourPrice, setNormHourPrice] = useState(2000);

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const apiUrl = () => getApiUrl("works-catalog");

  const fetchWorks = async () => {
    const url = apiUrl();
    if (!url) return;
    setLoading(true);
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`${url}${params}`);
      const data = await res.json();
      if (data.works) setWorks(data.works);
    } catch {
      toast.error("Не удалось загрузить каталог работ");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    const url = apiUrl();
    if (!url) return;
    try {
      const res = await fetch(`${url}?action=settings`);
      const data = await res.json();
      if (data.norm_hour_price) setNormHourPrice(data.norm_hour_price);
    } catch (_e) { /* ignore */ }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchWorks(); fetchSettings(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setTimeout(fetchWorks, 300); return () => clearTimeout(t); }, [search]);

  const handleAdd = async () => {
    if (!addForm.code.trim() || !addForm.name.trim()) {
      toast.error("Заполните код и наименование");
      return;
    }
    const url = apiUrl();
    if (!url) return;
    setSaving(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Работа добавлена");
        setShowAdd(false);
        setAddForm({ ...emptyForm });
        fetchWorks();
      } else {
        toast.error("Ошибка при добавлении");
      }
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editForm.code.trim() || !editForm.name.trim()) {
      toast.error("Заполните код и наименование");
      return;
    }
    const url = apiUrl();
    if (!url) return;
    setSaving(true);
    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editForm }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Работа обновлена");
        setEditingId(null);
        fetchWorks();
      }
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить работу из каталога?")) return;
    const url = apiUrl();
    if (!url) return;
    try {
      await fetch(`${url}?id=${id}`, { method: "DELETE" });
      toast.success("Работа удалена");
      fetchWorks();
    } catch {
      toast.error("Ошибка при удалении");
    }
  };

  const normHourTotal = works.reduce((s, w) => s + w.norm_hours, 0);

  return (
    <Layout title="Каталог работ">
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground mb-1">Всего работ</p>
            <p className="text-2xl font-bold text-foreground">{works.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground mb-1">Стоимость нормо-часа</p>
            <p className="text-2xl font-bold text-foreground">
              {normHourPrice.toLocaleString("ru-RU")} ₽
            </p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4 col-span-2 sm:col-span-1">
            <p className="text-xs text-muted-foreground mb-1">Всего нормо-часов в каталоге</p>
            <p className="text-2xl font-bold text-foreground">{normHourTotal.toFixed(1)} н/ч</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Поиск по коду или наименованию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white shrink-0"
            onClick={() => { setShowAdd(true); setEditingId(null); }}
          >
            <Icon name="Plus" size={16} className="mr-1.5" />
            Добавить работу
          </Button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="bg-white rounded-xl border border-blue-200 p-4">
            <h3 className="text-sm font-semibold mb-3">Новая работа</h3>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="w-32">
                <label className="text-xs text-muted-foreground mb-1 block">Код</label>
                <Input
                  placeholder="D001"
                  value={addForm.code}
                  onChange={(e) => setAddForm((f) => ({ ...f, code: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="flex-1 min-w-[220px]">
                <label className="text-xs text-muted-foreground mb-1 block">Наименование</label>
                <Input
                  placeholder="Диагностика двигателя"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                />
              </div>
              <div className="w-28">
                <label className="text-xs text-muted-foreground mb-1 block">Нормо-часы</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  className="text-center"
                  value={addForm.norm_hours}
                  onChange={(e) => setAddForm((f) => ({ ...f, norm_hours: Number(e.target.value) }))}
                />
              </div>
              <div className="w-36 bg-muted/40 rounded px-3 py-2 text-sm">
                <span className="text-muted-foreground text-xs block">Стоимость</span>
                <span className="font-semibold">
                  {(addForm.norm_hours * normHourPrice).toLocaleString("ru-RU")} ₽
                </span>
              </div>
              <div className="flex gap-2">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleAdd} disabled={saving}>
                  <Icon name="Check" size={16} className="mr-1" />Сохранить
                </Button>
                <Button variant="outline" onClick={() => { setShowAdd(false); setAddForm({ ...emptyForm }); }}>
                  Отмена
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">База работ</h3>
            <span className="text-xs text-muted-foreground">{works.length} позиций</span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Загрузка...</div>
          ) : works.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {search ? "Ничего не найдено" : "Каталог работ пуст"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground bg-muted/30">
                    <th className="text-left px-4 py-2.5 w-24">Код</th>
                    <th className="text-left px-4 py-2.5">Наименование</th>
                    <th className="text-center px-4 py-2.5 w-28">Нормо-часы</th>
                    <th className="text-right px-4 py-2.5 w-36">Стоимость</th>
                    <th className="w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {works.map((w) => (
                    <tr key={w.id} className="group hover:bg-muted/20">
                      {editingId === w.id ? (
                        <>
                          <td className="px-4 py-2">
                            <Input
                              className="h-8 text-sm"
                              value={editForm.code}
                              onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value }))}
                              autoFocus
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              className="h-8 text-sm"
                              value={editForm.name}
                              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(w.id); if (e.key === "Escape") setEditingId(null); }}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              type="number"
                              step="0.1"
                              min="0.1"
                              className="h-8 text-sm text-center"
                              value={editForm.norm_hours}
                              onChange={(e) => setEditForm((f) => ({ ...f, norm_hours: Number(e.target.value) }))}
                            />
                          </td>
                          <td className="px-4 py-2 text-right font-semibold text-muted-foreground">
                            {(editForm.norm_hours * normHourPrice).toLocaleString("ru-RU")} ₽
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-1">
                              <Button size="sm" className="h-7 w-7 p-0 bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleUpdate(w.id)} disabled={saving}>
                                <Icon name="Check" size={13} />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingId(null)}>
                                <Icon name="X" size={13} />
                              </Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2.5">
                            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{w.code}</span>
                          </td>
                          <td className="px-4 py-2.5 font-medium">{w.name}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className="inline-flex items-center gap-1 text-blue-600 font-semibold">
                              {w.norm_hours} н/ч
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold">
                            {(w.norm_hours * normHourPrice).toLocaleString("ru-RU")} ₽
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm" variant="ghost" className="h-7 w-7 p-0"
                                onClick={() => { setEditingId(w.id); setEditForm({ code: w.code, name: w.name, norm_hours: w.norm_hours }); setShowAdd(false); }}
                              >
                                <Icon name="Pencil" size={13} className="text-muted-foreground" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDelete(w.id)}>
                                <Icon name="Trash2" size={13} className="text-red-400" />
                              </Button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default WorksCatalog;