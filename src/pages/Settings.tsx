import { useState, useEffect } from "react";
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
import { getApiUrl } from "@/lib/api";
import { ClientsTab, CarsTab } from "@/components/settings/SettingsFieldsTab";
import { EmployeesTab } from "@/components/settings/SettingsEmployeesTab";
import { TelegramTab } from "@/components/settings/SettingsTelegramTab";
import { ReportsTab } from "@/components/settings/SettingsReportsTab";
import { ImportTab } from "@/components/settings/SettingsImportTab";

// ── Types ──────────────────────────────────────────────────────────────────

type TabId =
  | "clients"
  | "cars"
  | "work-orders"
  | "print"
  | "employees"
  | "reports"
  | "telegram"
  | "telephony"
  | "data"
  | "import";

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
  { id: "telephony", label: "Телефония", icon: "Phone" },
  { id: "data", label: "Данные", icon: "Database" },
  { id: "import", label: "Импорт", icon: "FileSpreadsheet" },
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
  const [normHourPrice, setNormHourPrice] = useState<number>(2000);
  const [normHourInput, setNormHourInput] = useState<string>("2000");
  const [savingNormHour, setSavingNormHour] = useState(false);

  useEffect(() => {
    const url = getApiUrl("works-catalog");
    if (!url) return;
    fetch(`${url}?action=settings`)
      .then((r) => r.json())
      .then((d) => {
        if (d.norm_hour_price) {
          setNormHourPrice(d.norm_hour_price);
          setNormHourInput(String(d.norm_hour_price));
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveNormHour = async () => {
    const price = Number(normHourInput);
    if (!price || price <= 0) { toast.error("Введите корректную стоимость"); return; }
    const url = getApiUrl("works-catalog");
    if (!url) return;
    setSavingNormHour(true);
    try {
      await fetch(`${url}?action=settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ norm_hour_price: price }),
      });
      setNormHourPrice(price);
      toast.success("Стоимость нормо-часа сохранена");
    } catch {
      toast.error("Ошибка при сохранении");
    } finally {
      setSavingNormHour(false);
    }
  };

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
        {/* Norm hour price */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Стоимость нормо-часа, ₽</label>
          <div className="flex items-center gap-3 max-w-xs">
            <Input
              type="number"
              min="1"
              className="text-right"
              value={normHourInput}
              onChange={(e) => setNormHourInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveNormHour(); }}
            />
            <Button
              className="shrink-0 bg-blue-500 hover:bg-blue-600 text-white"
              onClick={handleSaveNormHour}
              disabled={savingNormHour}
            >
              Сохранить
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Пример: 2 н/ч × {normHourPrice.toLocaleString("ru-RU")} ₽ = {(2 * normHourPrice).toLocaleString("ru-RU")} ₽
          </p>
        </div>

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

// ── Telephony tab ──────────────────────────────────────────────────────────

const TelephonyTab = () => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const url = getApiUrl("calls");
      if (!url) { setTestResult({ ok: false, message: "Backend функция calls не найдена" }); return; }
      const res = await fetch(`${url}?action=ping`);
      const data = await res.json();
      if (data.ok) {
        setTestResult({ ok: true, message: "Соединение с МОБИЛОН установлено успешно!" });
      } else {
        setTestResult({ ok: false, message: data.error || "Ошибка соединения с МОБИЛОН API" });
      }
    } catch {
      setTestResult({ ok: false, message: "Ошибка соединения с сервером" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Телефония МОБИЛОН</h3>
        <p className="text-sm text-muted-foreground mt-1">Интеграция с виртуальной АТС для отображения истории звонков</p>
      </div>

      <div className="bg-white rounded-xl border border-border p-5 space-y-5">
        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <Icon name="Info" size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-800">Как подключить МОБИЛОН</p>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Войдите в личный кабинет МОБИЛОН</li>
              <li>Перейдите в раздел <b>Настройки → API</b></li>
              <li>Скопируйте <b>API Token</b> и вставьте в секрет <code className="bg-blue-100 px-1 rounded text-xs">MOBILON_API_TOKEN</code></li>
              <li>Ваш <b>User Key</b> = <code className="bg-blue-100 px-1 rounded text-xs">105</code> — уже сохранён в <code className="bg-blue-100 px-1 rounded text-xs">MOBILON_USER_KEY</code></li>
            </ol>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon name="Key" size={15} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">MOBILON_API_TOKEN</p>
                <p className="text-xs text-muted-foreground">API токен из кабинета МОБИЛОН</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Секрет</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon name="Hash" size={15} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">MOBILON_USER_KEY</p>
                <p className="text-xs text-muted-foreground">Числовой ID пользователя (105)</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Секрет</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleTest}
            disabled={testing}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {testing
              ? <><Icon name="Loader2" size={16} className="mr-2 animate-spin" />Проверяем...</>
              : <><Icon name="Wifi" size={16} className="mr-2" />Проверить соединение</>}
          </Button>

          {testResult && (
            <div className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg ${
              testResult.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}>
              <Icon name={testResult.ok ? "CheckCircle" : "XCircle"} size={16} />
              {testResult.message}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-5 space-y-3">
        <p className="text-sm font-semibold text-foreground">Что даёт интеграция</p>
        <ul className="space-y-2">
          {[
            { icon: "PhoneIncoming", text: "История всех входящих, исходящих и пропущенных звонков" },
            { icon: "Clock", text: "Дата, время и длительность каждого разговора" },
            { icon: "Mic", text: "Прослушивание записей разговоров (при наличии в тарифе)" },
            { icon: "Users", text: "Привязка звонков к клиентам системы" },
          ].map((item) => (
            <li key={item.text} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <Icon name={item.icon} size={15} className="text-blue-500 shrink-0 mt-0.5" />
              {item.text}
            </li>
          ))}
        </ul>
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
      case "telephony":    return <TelephonyTab />;
      case "data":         return <DataTab />;
      case "import":       return <ImportTab />;
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