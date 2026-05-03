import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";

const SECTIONS = [
  { value: "schedule", label: "График работы" },
  { value: "contacts", label: "Контакты и адрес" },
  { value: "staff", label: "Сотрудники" },
  { value: "services", label: "Услуги и цены" },
  { value: "products", label: "Товары" },
  { value: "rules", label: "Правила общения" },
  { value: "other", label: "Другое" },
];

interface KnowledgeItem {
  id: number;
  section: string;
  title: string;
  content: string;
  is_active: boolean;
  sort_order: number;
}

const emptyItem = (): Omit<KnowledgeItem, "id"> => ({
  section: "services",
  title: "",
  content: "",
  is_active: true,
  sort_order: 0,
});

export const KnowledgeTab = () => {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState(emptyItem());
  const [saving, setSaving] = useState(false);

  const apiUrl = getApiUrl("bot-knowledge");

  const load = async () => {
    if (!apiUrl) return;
    try {
      const res = await fetch(apiUrl);
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      toast.error("Не удалось загрузить базу знаний");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [apiUrl]);

  const startEdit = (item: KnowledgeItem) => {
    setEditingId(item.id);
    setForm({
      section: item.section,
      title: item.title,
      content: item.content,
      is_active: item.is_active,
      sort_order: item.sort_order,
    });
  };

  const startNew = () => {
    setEditingId("new");
    setForm(emptyItem());
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Заполните заголовок и содержимое");
      return;
    }
    if (!apiUrl) return;
    setSaving(true);
    try {
      const body = editingId === "new" ? form : { ...form, id: editingId };
      const res = await fetch(apiUrl, {
        method: editingId === "new" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(editingId === "new" ? "Раздел добавлен" : "Раздел сохранён");
        setEditingId(null);
        load();
      } else {
        toast.error("Ошибка сохранения");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить этот раздел из базы знаний?")) return;
    if (!apiUrl) return;
    try {
      const res = await fetch(apiUrl, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success("Раздел удалён");
        load();
      } else {
        toast.error("Ошибка удаления");
      }
    } catch {
      toast.error("Ошибка сети");
    }
  };

  const handleToggle = async (item: KnowledgeItem) => {
    if (!apiUrl) return;
    try {
      await fetch(apiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, is_active: !item.is_active }),
      });
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
    } catch {
      toast.error("Ошибка сети");
    }
  };

  const sectionLabel = (val: string) => SECTIONS.find((s) => s.value === val)?.label || val;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">База знаний бота</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Информация, которую бот использует в разговорах с клиентами — цены, график, сотрудники
        </p>
      </div>

      {/* Форма редактирования */}
      {editingId !== null && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 space-y-4">
          <h4 className="text-sm font-semibold text-foreground">
            {editingId === "new" ? "Новый раздел" : "Редактирование раздела"}
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Категория</label>
              <select
                value={form.section}
                onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
                className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background"
              >
                {SECTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Порядок сортировки</label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Заголовок</label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Например: Услуги и цены"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Содержимое</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={8}
              placeholder="Опишите информацию, которую бот должен знать и использовать..."
              className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background resize-y min-h-[120px] focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Пишите обычным текстом. Бот прочитает и использует при общении с клиентами.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button onClick={handleSave} disabled={saving} className="bg-blue-500 hover:bg-blue-600 text-white">
              {saving
                ? <><Icon name="Loader2" size={14} className="animate-spin mr-1.5" />Сохранение...</>
                : <><Icon name="Save" size={14} className="mr-1.5" />Сохранить</>}
            </Button>
            <Button variant="outline" onClick={cancelEdit}>Отмена</Button>
          </div>
        </div>
      )}

      {/* Список разделов */}
      <div className="bg-white rounded-xl border border-border divide-y divide-border">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground text-sm">
            <Icon name="Loader2" size={16} className="animate-spin" /> Загрузка...
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm">
            База знаний пуста — добавьте первый раздел
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className={`flex items-start gap-4 p-4 ${!item.is_active ? "opacity-50" : ""}`}>
              <button
                onClick={() => handleToggle(item)}
                className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${item.is_active ? "bg-green-500" : "bg-gray-300"}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${item.is_active ? "translate-x-4.5" : "translate-x-0.5"}`} />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{item.title}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {sectionLabel(item.section)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 whitespace-pre-line">{item.content}</p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit(item)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                >
                  <Icon name="Pencil" size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                >
                  <Icon name="Trash2" size={14} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Button onClick={startNew} variant="outline" className="w-full border-dashed">
        <Icon name="Plus" size={15} className="mr-2" />
        Добавить раздел
      </Button>
    </div>
  );
};
