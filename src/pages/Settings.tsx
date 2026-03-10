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

interface DiagLog {
  ts: string;
  level: "info" | "ok" | "error" | "warn";
  msg: string;
}

const WEBHOOK_URL = "https://functions.poehali.dev/0389a6f3-a315-4f7b-ba16-8dc9c3abde73";

const TelephonyTab = () => {
  const [diagLogs, setDiagLogs] = useState<DiagLog[]>([]);
  const [diagRunning, setDiagRunning] = useState(false);

  const addLog = (logs: DiagLog[], level: DiagLog["level"], msg: string): DiagLog[] => {
    const ts = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    return [...logs, { ts, level, msg }];
  };

  const runDiagnostics = async () => {
    setDiagRunning(true);
    setDiagLogs([]);
    let logs: DiagLog[] = [];

    const push = (level: DiagLog["level"], msg: string) => {
      logs = addLog(logs, level, msg);
      setDiagLogs([...logs]);
    };

    push("info", "Запуск диагностики подключения к МОБИЛОН...");

    // 1. Проверка наличия URL функции
    const url = getApiUrl("calls");
    if (!url) {
      push("error", "Backend-функция 'calls' не найдена в func2url.json");
      setDiagRunning(false);
      return;
    }
    push("ok", `Backend URL найден: ${url}`);

    // 2. CORS / доступность сервера
    push("info", "Проверка доступности backend-сервера...");
    try {
      const t0 = Date.now();
      const corsRes = await fetch(url, { method: "OPTIONS" });
      const ms = Date.now() - t0;
      if (corsRes.ok) {
        push("ok", `Сервер отвечает (${ms} мс), CORS настроен корректно`);
      } else {
        push("warn", `Сервер вернул статус ${corsRes.status} на OPTIONS-запрос`);
      }
    } catch (e) {
      push("error", `Сервер недоступен: ${e}`);
      setDiagRunning(false);
      return;
    }

    // 3. Проверка конфигурации (токен/ключ)
    push("info", "Проверка наличия API-ключей МОБИЛОН...");
    try {
      const t0 = Date.now();
      const listRes = await fetch(`${url}?action=list&date_from=${new Date().toISOString().split("T")[0]}&date_to=${new Date().toISOString().split("T")[0]}`);
      const ms = Date.now() - t0;
      const listData = await listRes.json();
      if (listData.error === "not_configured") {
        push("error", "Секреты MOBILON_API_TOKEN и/или MOBILON_USER_KEY не заданы");
        push("warn", "Укажите токен в разделе Секреты проекта (поле MOBILON_API_TOKEN)");
        setDiagRunning(false);
        return;
      }
      push("ok", `Ключи найдены, запрос к БД выполнен за ${ms} мс`);
      if (listData.error) {
        push("warn", `Ответ содержит ошибку: ${listData.error}`);
      }
    } catch (e) {
      push("error", `Ошибка при проверке ключей: ${e}`);
    }

    // 4. Ping МОБИЛОН API
    push("info", "Отправка тестового запроса к API МОБИЛОН...");
    try {
      const t0 = Date.now();
      const pingRes = await fetch(`${url}?action=ping`);
      const ms = Date.now() - t0;
      const pingData = await pingRes.json();

      if (pingData.debug) {
        const d = pingData.debug;
        push("info", `MOBILON_API_TOKEN: ${d.token_preview} (длина: ${d.token_len} симв.)`);
        push("ok", `MOBILON_USER_KEY: ${d.userkey}`);
      }

      if (pingData.ok) {
        push("ok", `API МОБИЛОН ответил за ${ms} мс — проверяем варианты запросов:`);
        const results: Array<{name: string; url: string; http_status: number|null; is_xml: boolean; preview: string; error?: string}> = pingData.results || [];
        for (const r of results) {
          if (r.is_xml) {
            push("ok", `[${r.name}] HTTP ${r.http_status} — XML получен! Токен работает`);
            push("info", `Превью: ${r.preview.slice(0, 150)}`);
          } else if (r.error) {
            push("warn", `[${r.name}] HTTP ${r.http_status ?? "?"} — ${r.error}`);
            if (r.preview) push("info", `Ответ: ${r.preview.slice(0, 100)}`);
          } else {
            push("error", `[${r.name}] HTTP ${r.http_status} — вернул HTML (токен не принят)`);
            push("info", `URL: ${r.url}`);
          }
        }
        if (!pingData.is_xml) {
          push("error", "Ни один вариант не вернул XML — токен недействителен");
          push("warn", "Зайди в личный кабинет МОБИЛОН → Настройки → API, сгенерируй новый токен и обнови секрет MOBILON_API_TOKEN");
        }
      } else {
        push("error", `API МОБИЛОН недоступен: ${pingData.error || "неизвестная ошибка"}`);
      }
    } catch (e) {
      push("error", `Ошибка ping: ${e}`);
    }

    // 5. Webhook URL
    push("info", "Проверка адреса для вебхуков...");
    push("ok", `Адрес webhook: ${WEBHOOK_URL}`);
    push("info", "Укажите этот адрес в настройках МОБИЛОН → Вебхуки");

    // 6. Итог
    const hasErrors = logs.some(l => l.level === "error");
    const hasWarnings = logs.some(l => l.level === "warn");
    if (hasErrors) {
      push("error", "Диагностика завершена с ошибками — проверьте пункты выше");
    } else if (hasWarnings) {
      push("warn", "Диагностика завершена с предупреждениями");
    } else {
      push("ok", "Диагностика завершена успешно — интеграция работает корректно");
    }

    setDiagRunning(false);
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(WEBHOOK_URL);
    toast.success("Адрес скопирован");
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Телефония МОБИЛОН</h3>
        <p className="text-sm text-muted-foreground mt-1">Интеграция с виртуальной АТС для отображения истории звонков</p>
      </div>

      {/* Настройка */}
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

        <div className="space-y-0 divide-y divide-border">
          {[
            { icon: "Key", label: "MOBILON_API_TOKEN", desc: "API токен из кабинета МОБИЛОН" },
            { icon: "Hash", label: "MOBILON_USER_KEY", desc: "Числовой ID пользователя (105)" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Icon name={item.icon} size={15} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Секрет</span>
            </div>
          ))}
        </div>
      </div>

      {/* Webhook URL */}
      <div className="bg-white rounded-xl border border-border p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Icon name="Webhook" size={16} className="text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Адрес для вебхуков</p>
        </div>
        <p className="text-xs text-muted-foreground">Укажите этот адрес в настройках МОБИЛОН → Вебхуки</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-muted px-3 py-2.5 rounded-lg font-mono text-foreground break-all">
            {WEBHOOK_URL}
          </code>
          <Button variant="outline" size="sm" onClick={copyWebhook} className="shrink-0">
            <Icon name="Copy" size={14} className="mr-1.5" />Скопировать
          </Button>
        </div>
      </div>

      {/* Диагностика */}
      <div className="bg-white rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Terminal" size={16} className="text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Диагностика подключения</p>
          </div>
          <Button
            onClick={runDiagnostics}
            disabled={diagRunning}
            className="bg-blue-500 hover:bg-blue-600 text-white"
            size="sm"
          >
            {diagRunning
              ? <><Icon name="Loader2" size={14} className="mr-1.5 animate-spin" />Выполняется...</>
              : <><Icon name="Play" size={14} className="mr-1.5" />Запустить</>}
          </Button>
        </div>

        {diagLogs.length > 0 && (
          <div className="bg-gray-950 rounded-lg p-4 font-mono text-xs space-y-1.5 max-h-80 overflow-y-auto">
            {diagLogs.map((log, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="text-gray-500 shrink-0">{log.ts}</span>
                <span className={`shrink-0 ${
                  log.level === "ok" ? "text-green-400" :
                  log.level === "error" ? "text-red-400" :
                  log.level === "warn" ? "text-yellow-400" :
                  "text-blue-400"
                }`}>
                  {log.level === "ok" ? "✓" : log.level === "error" ? "✗" : log.level === "warn" ? "⚠" : "›"}
                </span>
                <span className={`${
                  log.level === "ok" ? "text-green-300" :
                  log.level === "error" ? "text-red-300" :
                  log.level === "warn" ? "text-yellow-300" :
                  "text-gray-300"
                }`}>{log.msg}</span>
              </div>
            ))}
            {diagRunning && (
              <div className="flex items-center gap-2 text-gray-500">
                <Icon name="Loader2" size={11} className="animate-spin" />
                <span>выполняется...</span>
              </div>
            )}
          </div>
        )}

        {diagLogs.length === 0 && !diagRunning && (
          <p className="text-xs text-muted-foreground">
            Запустите диагностику для проверки всех этапов подключения: доступность сервера, ключи API, соединение с МОБИЛОН и адрес вебхука.
          </p>
        )}
      </div>

      {/* Возможности */}
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