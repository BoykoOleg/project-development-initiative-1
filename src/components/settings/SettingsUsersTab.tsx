import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/api";
import { useAuth, authHeaders } from "@/contexts/AuthContext";

interface AppUser {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export function UsersTab() {
  const { token } = useAuth();
  const authUrl = getApiUrl("auth");
  const hdrs = { ...authHeaders(token), "Content-Type": "application/json" };

  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("employee");
  const [newActive, setNewActive] = useState(false);
  const [creating, setCreating] = useState(false);

  const [editPwdId, setEditPwdId] = useState<number | null>(null);
  const [newPwd, setNewPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    const res = await fetch(`${authUrl}?action=list-users`, { headers: hdrs });
    const data = await res.json();
    if (data.users) setUsers(data.users);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async () => {
    if (!newEmail || !newPassword) return toast.error("Email и пароль обязательны");
    setCreating(true);
    const res = await fetch(`${authUrl}?action=create-user`, {
      method: "POST",
      headers: hdrs,
      body: JSON.stringify({ email: newEmail, name: newName, password: newPassword, role: newRole, is_active: newActive }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) return toast.error(data.error || "Ошибка");
    toast.success("Пользователь добавлен");
    setShowCreate(false);
    setNewEmail(""); setNewName(""); setNewPassword(""); setNewRole("employee"); setNewActive(false);
    loadUsers();
  };

  const handleToggle = async (u: AppUser) => {
    const res = await fetch(`${authUrl}?action=toggle-active`, {
      method: "POST",
      headers: hdrs,
      body: JSON.stringify({ id: u.id, is_active: !u.is_active }),
    });
    if (res.ok) {
      toast.success(u.is_active ? "Аккаунт деактивирован" : "Аккаунт активирован");
      loadUsers();
    }
  };

  const handleSetPassword = async (id: number) => {
    if (!newPwd || newPwd.length < 6) return toast.error("Пароль не менее 6 символов");
    setSavingPwd(true);
    const res = await fetch(`${authUrl}?action=set-password`, {
      method: "POST",
      headers: hdrs,
      body: JSON.stringify({ id, password: newPwd }),
    });
    setSavingPwd(false);
    if (res.ok) {
      toast.success("Пароль изменён");
      setEditPwdId(null);
      setNewPwd("");
    } else {
      const data = await res.json();
      toast.error(data.error || "Ошибка");
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground py-6 text-center">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Пользователи системы</h2>
          <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
            <Icon name="UserPlus" size={15} className="mr-1.5" />
            Добавить
          </Button>
        </div>

        {showCreate && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 space-y-3">
            <p className="text-sm font-medium text-blue-800">Новый пользователь</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email (логин) *</label>
                <Input placeholder="user@email.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Имя</label>
                <Input placeholder="Иван Иванов" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Пароль *</label>
                <Input type="password" placeholder="Минимум 6 символов" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Роль</label>
                <select
                  className="w-full h-9 border border-input rounded-md px-3 text-sm bg-background"
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                >
                  <option value="employee">Сотрудник</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={newActive} onCheckedChange={setNewActive} id="new-active" />
              <label htmlFor="new-active" className="text-sm cursor-pointer">Активировать сразу</label>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={creating}>
                {creating ? "Создаю..." : "Создать"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>Отмена</Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${u.role === "admin" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}`}>
                    <Icon name={u.role === "admin" ? "ShieldCheck" : "User"} size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{u.name || "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={u.is_active}
                      onCheckedChange={() => handleToggle(u)}
                      id={`active-${u.id}`}
                    />
                    <label htmlFor={`active-${u.id}`} className="text-xs text-muted-foreground cursor-pointer hidden sm:block">
                      {u.is_active ? "Активен" : "Неактивен"}
                    </label>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setEditPwdId(editPwdId === u.id ? null : u.id); setNewPwd(""); }}
                  >
                    <Icon name="KeyRound" size={14} className="mr-1" />
                    Пароль
                  </Button>
                </div>
              </div>

              {editPwdId === u.id && (
                <div className="mt-3 pt-3 border-t border-border flex gap-2">
                  <Input
                    type="password"
                    placeholder="Новый пароль (мин. 6 символов)"
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={() => handleSetPassword(u.id)} disabled={savingPwd}>
                    {savingPwd ? "..." : "Сохранить"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditPwdId(null); setNewPwd(""); }}>
                    <Icon name="X" size={14} />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
