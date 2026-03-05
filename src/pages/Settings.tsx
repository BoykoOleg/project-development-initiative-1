import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { COMPANY_INFO, statusConfig } from "@/components/work-orders/types";
import { ClientsTab, CarsTab } from "@/components/settings/SettingsFieldsTab";
import { EmployeesTab } from "@/components/settings/SettingsEmployeesTab";
import { TelegramTab } from "@/components/settings/SettingsTelegramTab";
import { ReportsTab } from "@/components/settings/SettingsReportsTab";

// ── Types ──────────────────────────────────────────────────────────────────

type TabId =
  | "clients"
  | "cars"
  | "work-orders"
  | "print"
  | "employees"
  | "reports"
  | "telegram"
  | "data";

interface TabDef {
  id: TabId;
  label: string;
  icon: string;
}

interface CompanyInfo {
  name: string;
  inn: string;
  kpp: string;
  ogrn: string;
  address: string;
  director: string;
  email: string;
}

interface WoSettings {
  defaultStatus: string;
  numberPrefix: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const TABS: TabDef[] = [
  { id: "clients", label: "Клиенты", icon: "Users" },
  { id: "cars", label: "Автомобили", icon: "Car" },
  { id: "work-orders", label: "Заказ-наряды", icon: "FileText" },
  { id: "print", label: "Печатная форма", icon: "Printer" },
  { id: "employees", label: "Сотрудники", icon: "UserCog" },
  { id: "reports", label: "Отчёты", icon: "BarChart3" },
  { id: "telegram", label: "Telegram-бот", icon: "Bot" },
  { id: "data", label: "Данные", icon: "Database" },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Work Orders tab ────────────────────────────────────────────────────────

const WorkOrdersTab = () => {
  const [settings, setSettings] = useState<WoSettings>(() =>
    loadJson("settings_wo", { defaultStatus: "new", numberPrefix: "ЗН-" })
  );

  const update = (patch: Partial<WoSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveJson("settings_wo", next);
    toast.success("Настройки заказ-нарядов сохранены");
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Настройки заказ-нарядов</h3>
        <p className="text-sm text-muted-foreground mt-1">Параметры создания и нумерации заказ-нарядов</p>
      </div>

      <div className="bg-white rounded-xl border border-border p-5 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Статус по умолчанию при создании</label>
          <Select value={settings.defaultStatus} onValueChange={(v) => update({ defaultStatus: v })}>
            <SelectTrigger className="w-full max-w-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Префикс нумерации</label>
          <Input
            className="max-w-xs"
            value={settings.numberPrefix}
            onChange={(e) => update({ numberPrefix: e.target.value })}
            placeholder="ЗН-"
          />
          <p className="text-xs text-muted-foreground">Пример: {settings.numberPrefix}00001</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Статусы заказ-нарядов</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <span key={key} className={`px-3 py-1 rounded-full text-xs font-medium ${cfg.className}`}>
                {cfg.label}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Системные статусы. Для изменения обратитесь к разработчику.</p>
        </div>
      </div>
    </div>
  );
};

// ── Print Form tab ─────────────────────────────────────────────────────────

const PrintFormTab = () => {
  const [info, setInfo] = useState<CompanyInfo>(() =>
    loadJson("settings_company_info", COMPANY_INFO)
  );

  const fieldDefs: { key: keyof CompanyInfo; label: string; icon: string }[] = [
    { key: "name", label: "Наименование организации", icon: "Building2" },
    { key: "inn", label: "ИНН", icon: "Hash" },
    { key: "kpp", label: "КПП", icon: "Hash" },
    { key: "ogrn", label: "ОГРН", icon: "Hash" },
    { key: "address", label: "Юридический адрес", icon: "MapPin" },
    { key: "director", label: "Руководитель", icon: "User" },
    { key: "email", label: "Email", icon: "Mail" },
  ];

  const save = () => {
    saveJson("settings_company_info", info);
    toast.success("Реквизиты компании сохранены");
  };

  const reset = () => {
    setInfo({ ...COMPANY_INFO });
    saveJson("settings_company_info", COMPANY_INFO);
    toast.success("Реквизиты сброшены к значениям по умолчанию");
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Реквизиты организации</h3>
        <p className="text-sm text-muted-foreground mt-1">Эти данные будут использоваться в печатных формах документов</p>
      </div>

      <div className="bg-white rounded-xl border border-border p-5 space-y-5">
        {fieldDefs.map((fd) => (
          <div key={fd.key} className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Icon name={fd.icon} size={14} className="text-muted-foreground" />
              {fd.label}
            </label>
            {fd.key === "address" ? (
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={info[fd.key]}
                onChange={(e) => setInfo((prev) => ({ ...prev, [fd.key]: e.target.value }))}
              />
            ) : (
              <Input
                value={info[fd.key]}
                onChange={(e) => setInfo((prev) => ({ ...prev, [fd.key]: e.target.value }))}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={save} className="bg-blue-500 hover:bg-blue-600 text-white">
          <Icon name="Save" size={16} className="mr-2" />Сохранить
        </Button>
        <Button variant="outline" onClick={reset}>
          <Icon name="RotateCcw" size={16} className="mr-2" />Сбросить по умолчанию
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-border p-5 space-y-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Icon name="Eye" size={16} className="text-muted-foreground" />Предпросмотр
        </h4>
        <div className="border border-dashed border-border rounded-lg p-4 text-sm space-y-1">
          <p className="font-semibold">{info.name}</p>
          <p className="text-muted-foreground">ИНН {info.inn} / КПП {info.kpp} / ОГРН {info.ogrn}</p>
          <p className="text-muted-foreground">{info.address}</p>
          <p className="text-muted-foreground">Руководитель: {info.director}</p>
          <p className="text-muted-foreground">{info.email}</p>
        </div>
      </div>
    </div>
  );
};

// ── Data tab ───────────────────────────────────────────────────────────────

const DataTab = () => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleClear = async () => {
    setLoading(true);
    try {
      const { getApiUrl } = await import("@/lib/api");
      const url = getApiUrl("admin-clear");
      if (!url) { toast.error("Функция не найдена"); return; }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "YES_CLEAR_ALL" }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
        toast.success("База очищена — клиенты, машины, заявки и заказ-наряды удалены");
      } else {
        toast.error(data.error || "Ошибка");
      }
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setLoading(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Управление данными</h3>
        <p className="text-sm text-muted-foreground mt-1">Очистка тестовых данных перед началом работы</p>
      </div>

      <div className="bg-white rounded-xl border border-red-200 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
            <Icon name="Trash2" size={16} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Очистить базу данных</p>
            <p className="text-sm text-muted-foreground mt-1">
              Удалит всех клиентов, автомобили, заявки и заказ-наряды. Это действие нельзя отменить.
            </p>
          </div>
        </div>

        {done ? (
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
            <Icon name="CheckCircle" size={16} />База успешно очищена
          </div>
        ) : !confirmDelete ? (
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
            <Icon name="Trash2" size={16} className="mr-2" />Очистить данные
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-red-600">
              Вы уверены? Это удалит все данные без возможности восстановления.
            </p>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleClear} disabled={loading}>
                {loading ? <Icon name="Loader2" size={16} className="mr-2 animate-spin" /> : <Icon name="Trash2" size={16} className="mr-2" />}
                Да, удалить всё
              </Button>
              <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={loading}>Отмена</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Settings Page ─────────────────────────────────────────────────────

const Settings = () => {
  const [activeTab, setActiveTab] = useState<TabId>("clients");

  const renderTab = () => {
    switch (activeTab) {
      case "clients":      return <ClientsTab />;
      case "cars":         return <CarsTab />;
      case "work-orders":  return <WorkOrdersTab />;
      case "print":        return <PrintFormTab />;
      case "employees":    return <EmployeesTab />;
      case "reports":      return <ReportsTab />;
      case "telegram":     return <TelegramTab />;
      case "data":         return <DataTab />;
    }
  };

  return (
    <Layout title="Настройки">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mobile: horizontal scroll */}
        <div className="lg:hidden">
          <div className="flex gap-1 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                  activeTab === tab.id
                    ? "bg-blue-500 text-white"
                    : "bg-white border border-border text-muted-foreground hover:text-foreground hover:bg-gray-50"
                }`}
              >
                <Icon name={tab.icon} size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop: vertical sidebar */}
        <div className="hidden lg:block w-56 shrink-0">
          <div className="bg-white rounded-xl border border-border p-2 sticky top-6">
            <nav className="space-y-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
                  }`}
                >
                  <Icon
                    name={tab.icon}
                    size={18}
                    className={activeTab === tab.id ? "text-blue-500" : "text-muted-foreground"}
                  />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 min-w-0">{renderTab()}</div>
      </div>
    </Layout>
  );
};

export default Settings;
