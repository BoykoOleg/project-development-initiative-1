import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import { getApiUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface LogEntry {
  id: number;
  user_id: number | null;
  user_name: string;
  user_email: string;
  module: string;
  action: string;
  entity_type: string;
  entity_id: number | null;
  entity_label: string;
  description: string;
  ip_address: string | null;
  created_at: string;
}

interface LogUser {
  user_id: number | null;
  user_name: string;
  user_email: string;
}

const MODULE_LABELS: Record<string, string> = {
  "work-orders": "Заказ-наряды",
  "finance": "Финансы",
  "warehouse": "Склад",
};

const MODULE_COLORS: Record<string, string> = {
  "work-orders": "bg-blue-100 text-blue-700",
  "finance":     "bg-green-100 text-green-700",
  "warehouse":   "bg-orange-100 text-orange-700",
};

const PAGE_SIZE = 50;

export const ActivityTab = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [users, setUsers] = useState<LogUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);

  const [filterModule, setFilterModule] = useState("all");
  const [filterUser, setFilterUser] = useState("all");
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async (p: number = 0) => {
    const url = getApiUrl("auth");
    if (!url || !token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ action: "activity-log", limit: String(PAGE_SIZE), offset: String(p * PAGE_SIZE) });
      if (filterModule !== "all") params.set("module", filterModule);
      if (filterUser !== "all") params.set("user_id", filterUser);
      const res = await fetch(`${url}?${params}`, { headers: { "X-Auth-Token": token } });
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
        setTotal(data.total ?? 0);
        setUsers(data.users ?? []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token, filterModule, filterUser]);

  useEffect(() => {
    setPage(0);
    fetchLogs(0);
  }, [fetchLogs]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchLogs(p);
  };

  const formatDate = (ts: string) => {
    if (!ts) return "";
    return new Date(ts).toLocaleString("ru-RU", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const filtered = search.trim()
    ? logs.filter((l) =>
        l.user_name.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.entity_label.toLowerCase().includes(search.toLowerCase()) ||
        l.description.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="ScrollText" size={16} className="text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Журнал действий</p>
          <span className="ml-auto text-xs text-muted-foreground">{total} записей</span>
        </div>

        {/* Фильтры */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[180px]">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по действию, объекту..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>

          <Select value={filterModule} onValueChange={setFilterModule}>
            <SelectTrigger className="w-[160px] h-8 text-sm">
              <SelectValue placeholder="Модуль" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все модули</SelectItem>
              <SelectItem value="work-orders">Заказ-наряды</SelectItem>
              <SelectItem value="finance">Финансы</SelectItem>
              <SelectItem value="warehouse">Склад</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="w-[160px] h-8 text-sm">
              <SelectValue placeholder="Сотрудник" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все сотрудники</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.user_id ?? "sys"} value={String(u.user_id ?? "")}>
                  {u.user_name || u.user_email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="h-8" onClick={() => fetchLogs(page)}>
            <Icon name="RefreshCw" size={14} className={`mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Обновить
          </Button>
        </div>

        {/* Таблица */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Icon name="Loader2" size={20} className="animate-spin mr-2" />
            Загрузка...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/50">
            <Icon name="ScrollText" size={32} />
            <p className="text-sm mt-2">Нет записей</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground w-36">Дата и время</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground w-32">Сотрудник</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground w-28">Модуль</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Действие</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Объект</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Детали</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-xs font-medium text-foreground truncate max-w-[120px]">
                        {log.user_name || "—"}
                      </div>
                      {log.user_email && (
                        <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                          {log.user_email}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${MODULE_COLORS[log.module] ?? "bg-muted text-muted-foreground"}`}>
                        {MODULE_LABELS[log.module] ?? log.module}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-foreground max-w-[180px]">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground max-w-[160px]">
                      <span className="truncate block">{log.entity_label || "—"}</span>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground max-w-[180px]">
                      <span className="truncate block">{log.description || "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Страница {page + 1} из {totalPages} · {total} записей
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline" size="sm"
                disabled={page === 0}
                onClick={() => handlePageChange(page - 1)}
              >
                <Icon name="ChevronLeft" size={14} />
              </Button>
              <Button
                variant="outline" size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => handlePageChange(page + 1)}
              >
                <Icon name="ChevronRight" size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Легенда */}
      <div className="bg-muted/40 rounded-xl border border-border p-4">
        <p className="text-xs font-medium text-muted-foreground mb-3">Что фиксируется в журнале</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { module: "work-orders", items: ["Создание наряда", "Изменение статуса", "Добавление работ и запчастей", "Удаление наряда"] },
            { module: "finance",     items: ["Платежи (создание, изменение)", "Приходы и расходы", "Перемещения между кассами", "Постоянные расходы"] },
            { module: "warehouse",   items: ["Создание и изменение товаров", "Поступления товара", "Перемещения по складу", "Создание поставщиков"] },
          ].map(({ module, items }) => (
            <div key={module} className="space-y-1.5">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${MODULE_COLORS[module]}`}>
                {MODULE_LABELS[module]}
              </span>
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon name="Dot" size={12} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
