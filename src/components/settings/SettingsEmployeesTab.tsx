import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";

interface Employee {
  id: number;
  name: string;
  role: string;
  role_label: string;
  phone: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

interface RoleOption {
  value: string;
  label: string;
}

const FALLBACK_ROLES: RoleOption[] = [
  { value: "director", label: "Директор" },
  { value: "manager", label: "Менеджер" },
  { value: "mechanic", label: "Механик" },
  { value: "electrician", label: "Электрик" },
  { value: "installer", label: "Установщик" },
  { value: "accountant", label: "Бухгалтер" },
];

export const EmployeesTab = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>(FALLBACK_ROLES);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({ name: "", role: "mechanic", phone: "", email: "" });

  const fetchEmployees = useCallback(async () => {
    try {
      const url = getApiUrl("employees");
      if (!url) { setLoading(false); return; }
      const res = await fetch(url);
      const data = await res.json();
      if (data.employees) setEmployees(data.employees);
      if (data.roles) setRoles(data.roles);
    } catch {
      toast.error("Ошибка загрузки сотрудников");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", role: "mechanic", phone: "", email: "" });
    setDialogOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({ name: emp.name, role: emp.role, phone: emp.phone || "", email: emp.email || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Введите имя сотрудника"); return; }
    try {
      const url = getApiUrl("employees");
      if (!url) return;
      const body: Record<string, unknown> = editing
        ? { action: "update", employee_id: editing.id, ...form }
        : { action: "create", ...form };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success(editing ? "Сотрудник обновлён" : "Сотрудник добавлен");
      setDialogOpen(false);
      fetchEmployees();
    } catch {
      toast.error("Ошибка сохранения");
    }
  };

  const handleToggleActive = async (emp: Employee) => {
    try {
      const url = getApiUrl("employees");
      if (!url) return;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", employee_id: emp.id, is_active: !emp.is_active }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success(emp.is_active ? "Сотрудник деактивирован" : "Сотрудник активирован");
      fetchEmployees();
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleDelete = async (emp: Employee) => {
    if (!confirm(`Удалить сотрудника "${emp.name}"?`)) return;
    try {
      const url = getApiUrl("employees");
      if (!url) return;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", employee_id: emp.id }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      if (data.deactivated) toast.info("Сотрудник деактивирован (есть связанные заказ-наряды)");
      else toast.success("Сотрудник удалён");
      fetchEmployees();
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const roleLabel = (role: string) => roles.find((r) => r.value === role)?.label || role;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icon name="Loader2" size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Сотрудники</h3>
          <p className="text-sm text-muted-foreground mt-1">Управление персоналом установочного центра</p>
        </div>
        <Button onClick={openCreate} className="bg-blue-500 hover:bg-blue-600 text-white">
          <Icon name="Plus" size={16} className="mr-2" />Добавить
        </Button>
      </div>

      {employees.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <Icon name="UserPlus" size={48} className="text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Сотрудники не добавлены</p>
          <Button onClick={openCreate} variant="outline" className="mt-4">
            <Icon name="Plus" size={16} className="mr-2" />Добавить первого сотрудника
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className={`bg-white rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${!emp.is_active ? "opacity-60" : ""}`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${emp.is_active ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                  {emp.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground truncate">{emp.name}</p>
                    <Badge variant={emp.is_active ? "secondary" : "outline"} className="text-xs">
                      {roleLabel(emp.role)}
                    </Badge>
                    {!emp.is_active && (
                      <Badge variant="outline" className="text-xs text-red-500 border-red-200">Неактивен</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    {emp.phone && <span className="flex items-center gap-1"><Icon name="Phone" size={12} />{emp.phone}</span>}
                    {emp.email && <span className="flex items-center gap-1"><Icon name="Mail" size={12} />{emp.email}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => handleToggleActive(emp)} title={emp.is_active ? "Деактивировать" : "Активировать"}>
                  <Icon name={emp.is_active ? "UserCheck" : "UserX"} size={16} className={emp.is_active ? "text-green-500" : "text-gray-400"} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(emp)}>
                  <Icon name="Pencil" size={16} className="text-blue-500" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(emp)}>
                  <Icon name="Trash2" size={16} className="text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать сотрудника" : "Новый сотрудник"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">ФИО *</label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Иванов Иван Иванович" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Должность</label>
              <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Телефон</label>
              <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+7 (999) 000-00-00" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="example@mail.ru" type="email" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600 text-white">
              {editing ? "Сохранить" : "Добавить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
