import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";

interface Account {
  account_id: string;
  name: string;
  currency: string;
  status: string;
  account_number: string;
}

interface Balance {
  type: string;
  amount: number;
  currency: string;
  credit_debit: string;
}

interface Transaction {
  tx_id: string;
  date: string;
  amount: number;
  currency: string;
  credit_debit: string;
  description: string;
  counterparty: string;
  status: string;
}

const fmt = (v: number, currency = "RUB") =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency, maximumFractionDigits: 2 }).format(v);

const fmtDate = (d: string) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return d;
  }
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const monthAgoStr = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
};

interface Cashbox {
  id: number;
  name: string;
  type: string;
  balance: number;
}

export default function FinanceTochkaBank({ onImported, cashboxes = [] }: { onImported?: () => void; cashboxes?: Cashbox[] }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedCashboxId, setSelectedCashboxId] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState(monthAgoStr());
  const [dateTo, setDateTo] = useState(todayStr());
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const [loadingSync, setLoadingSync] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statementRequested, setStatementRequested] = useState(false);
  const [currentStatementId, setCurrentStatementId] = useState<string | null>(null);

  const apiUrl = getApiUrl("tochka-bank");

  const loadAccounts = useCallback(async () => {
    if (!apiUrl) return;
    setLoadingAccounts(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}?section=accounts`);
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setAccounts(data.accounts || []);
      if (data.accounts?.length) {
        setSelectedAccount(data.accounts[0].account_id);
      }
    } catch {
      setError("Не удалось подключиться к банку Точка");
    } finally {
      setLoadingAccounts(false);
    }
  }, [apiUrl]);

  const loadBalance = useCallback(async (accountId: string) => {
    if (!apiUrl || !accountId) return;
    setLoadingBalance(true);
    try {
      const res = await fetch(`${apiUrl}?section=balance&account_id=${encodeURIComponent(accountId)}`);
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      setBalances(data.balances || []);
    } catch {
      toast.error("Ошибка загрузки баланса");
    } finally {
      setLoadingBalance(false);
    }
  }, [apiUrl]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  useEffect(() => {
    if (selectedAccount) {
      loadBalance(selectedAccount);
      setTransactions([]);
      setStatementRequested(false);
    }
  }, [selectedAccount, loadBalance]);

  useEffect(() => {
    if (cashboxes.length > 0 && !selectedCashboxId) {
      setSelectedCashboxId(cashboxes[0].id);
    }
  }, [cashboxes, selectedCashboxId]);

  const handleSyncBalance = async () => {
    if (!apiUrl || !selectedAccount || !selectedCashboxId) {
      toast.error("Выберите счёт и кассу");
      return;
    }
    setLoadingSync(true);
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sync_balance",
          account_id: selectedAccount,
          cashbox_id: selectedCashboxId,
        }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success(`Баланс синхронизирован: ${fmt(data.balance)}`);
      onImported?.();
    } catch {
      toast.error("Ошибка синхронизации баланса");
    } finally {
      setLoadingSync(false);
    }
  };

  const handleLoadStatement = async () => {
    if (!apiUrl || !selectedAccount) return;
    setLoadingStatement(true);
    setTransactions([]);
    try {
      const initRes = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "init_statement",
          account_id: selectedAccount,
          date_from: dateFrom,
          date_to: dateTo,
        }),
      });
      const initData = await initRes.json();
      if (initData.error) { toast.error(initData.error); return; }

      const statementId = initData.statement_id;
      if (!statementId) { toast.error("Не получен ID выписки"); return; }

      const stRes = await fetch(
        `${apiUrl}?section=statement&account_id=${encodeURIComponent(selectedAccount)}&statement_id=${encodeURIComponent(statementId)}`
      );
      const stData = await stRes.json();
      if (stData.error) { toast.error(stData.error); return; }

      setTransactions(stData.transactions || []);
      setStatementRequested(true);
      setCurrentStatementId(statementId);
      toast.success(`Загружено ${stData.transactions?.length || 0} операций`);
    } catch {
      toast.error("Ошибка загрузки выписки");
    } finally {
      setLoadingStatement(false);
    }
  };

  const handleImportToFinance = async () => {
    if (!apiUrl || !selectedAccount || !currentStatementId) return;
    if (!selectedCashboxId) { toast.error("Выберите кассу для импорта"); return; }
    setLoadingImport(true);
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "import_to_finance",
          account_id: selectedAccount,
          statement_id: currentStatementId,
          cashbox_id: selectedCashboxId,
        }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success(`Импортировано ${data.imported} операций, пропущено дублей: ${data.skipped}`);
      onImported?.();
    } catch {
      toast.error("Ошибка импорта в финансы");
    } finally {
      setLoadingImport(false);
    }
  };

  const selectedAccountInfo = accounts.find((a) => a.account_id === selectedAccount);

  const totalIn = transactions.filter((t) => t.credit_debit === "Credit").reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter((t) => t.credit_debit === "Debit").reduce((s, t) => s + t.amount, 0);

  if (loadingAccounts) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        <Icon name="Loader2" size={24} className="mx-auto mb-2 animate-spin" />
        Подключение к банку Точка...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center space-y-3">
        <Icon name="AlertCircle" size={36} className="mx-auto text-red-400" />
        <p className="font-medium text-slate-700">{error}</p>
        {error.includes("TOCHKA_JWT_TOKEN") && (
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Перейди в <strong>i.tochka.com → Интеграции и API</strong>, сгенерируй JWT-ключ и добавь его в секреты проекта как <code>TOCHKA_JWT_TOKEN</code>
          </p>
        )}
        <Button variant="outline" onClick={loadAccounts} className="mt-2">
          <Icon name="RefreshCw" size={14} className="mr-1.5" />
          Повторить
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Счета */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Landmark" size={16} className="text-slate-500" />
            <span className="font-semibold text-sm text-slate-700">Банк Точка — счета</span>
          </div>
          <Button variant="ghost" size="sm" onClick={loadAccounts} className="h-7 text-xs">
            <Icon name="RefreshCw" size={13} className="mr-1" />
            Обновить
          </Button>
        </div>
        {accounts.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm">
            Счета не найдены
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead></TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Номер счёта</TableHead>
                <TableHead>Валюта</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Баланс</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((acc) => {
                const isSelected = acc.account_id === selectedAccount;
                const accBalances = isSelected ? balances : [];
                const mainBalance = accBalances.find((b) => b.type === "ClosingAvailable" || b.type === "InterimAvailable") || accBalances[0];
                return (
                  <TableRow
                    key={acc.account_id}
                    className={`cursor-pointer hover:bg-blue-50/50 ${isSelected ? "bg-blue-50/30" : ""}`}
                    onClick={() => setSelectedAccount(acc.account_id)}
                  >
                    <TableCell className="w-8">
                      <div className={`w-3 h-3 rounded-full border-2 ${isSelected ? "border-blue-500 bg-blue-500" : "border-slate-300"}`} />
                    </TableCell>
                    <TableCell className="font-medium text-sm">{acc.name || "Счёт"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{acc.account_number || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{acc.currency}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${acc.status === "Enabled" ? "text-green-600 border-green-200 bg-green-50" : "text-slate-500"}`}
                      >
                        {acc.status || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {isSelected && loadingBalance ? (
                        <Icon name="Loader2" size={14} className="ml-auto animate-spin text-muted-foreground" />
                      ) : mainBalance ? (
                        <span className="font-bold text-base text-green-700">
                          {fmt(mainBalance.amount, mainBalance.currency)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Все балансы выбранного счёта */}
      {balances.length > 1 && (
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b flex items-center gap-2">
            <Icon name="Wallet" size={16} className="text-slate-500" />
            <span className="font-semibold text-sm text-slate-700">
              Детализация баланса — {selectedAccountInfo?.name || "счёт"}
            </span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Тип</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
                <TableHead>Валюта</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balances.map((b, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm text-muted-foreground">{b.type}</TableCell>
                  <TableCell className="text-right font-semibold text-slate-700">
                    {fmt(b.amount, b.currency)}
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{b.currency}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Синхронизация баланса */}
      {cashboxes.length > 0 && balances.length > 0 && (
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b flex items-center gap-2">
            <Icon name="RefreshCw" size={16} className="text-slate-500" />
            <span className="font-semibold text-sm text-slate-700">Синхронизация баланса кассы</span>
          </div>
          <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Касса:</span>
              <Select value={String(selectedCashboxId || "")} onValueChange={(v) => setSelectedCashboxId(Number(v))}>
                <SelectTrigger className="h-8 text-sm w-48"><SelectValue placeholder="Выберите кассу" /></SelectTrigger>
                <SelectContent>
                  {cashboxes.map((cb) => (
                    <SelectItem key={cb.id} value={String(cb.id)}>{cb.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(() => {
              const mainBalance = balances.find((b) => b.type === "ClosingAvailable" || b.type === "InterimAvailable") || balances[0];
              return mainBalance ? (
                <div className="text-sm">
                  <span className="text-muted-foreground">Баланс в банке: </span>
                  <span className="font-bold text-green-700">{fmt(mainBalance.amount)}</span>
                </div>
              ) : null;
            })()}
            <Button
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white h-8 text-xs"
              onClick={handleSyncBalance}
              disabled={loadingSync || !selectedAccount || !selectedCashboxId}
            >
              {loadingSync ? (
                <><Icon name="Loader2" size={13} className="mr-1.5 animate-spin" />Синхронизация...</>
              ) : (
                <><Icon name="RefreshCw" size={13} className="mr-1.5" />Синхронизировать баланс</>
              )}
            </Button>
            <p className="text-xs text-muted-foreground w-full">Установит баланс выбранной кассы равным текущему остатку на счёте в банке</p>
          </div>
        </div>
      )}

      {/* Выписка */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1">
            <Icon name="FileText" size={16} className="text-slate-500" />
            <span className="font-semibold text-sm text-slate-700">Выписка</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Счёт:</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="h-7 text-xs w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.account_id} value={acc.account_id}>
                      {acc.name || acc.account_number || acc.account_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {cashboxes.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Касса:</Label>
                <Select value={String(selectedCashboxId || "")} onValueChange={(v) => setSelectedCashboxId(Number(v))}>
                  <SelectTrigger className="h-7 text-xs w-36"><SelectValue placeholder="Касса" /></SelectTrigger>
                  <SelectContent>
                    {cashboxes.map((cb) => (
                      <SelectItem key={cb.id} value={String(cb.id)}>{cb.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">С:</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-7 text-xs w-36"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">По:</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-7 text-xs w-36"
              />
            </div>
            <Button
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white h-7 text-xs"
              onClick={handleLoadStatement}
              disabled={loadingStatement || !selectedAccount}
            >
              {loadingStatement ? (
                <><Icon name="Loader2" size={13} className="mr-1 animate-spin" />Загрузка...</>
              ) : (
                <><Icon name="Download" size={13} className="mr-1" />Загрузить</>
              )}
            </Button>
            {statementRequested && transactions.length > 0 && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs"
                onClick={handleImportToFinance}
                disabled={loadingImport}
              >
                {loadingImport ? (
                  <><Icon name="Loader2" size={13} className="mr-1 animate-spin" />Импорт...</>
                ) : (
                  <><Icon name="ArrowDownToLine" size={13} className="mr-1" />В финансы</>
                )}
              </Button>
            )}
          </div>
        </div>

        {statementRequested && transactions.length > 0 && (
          <div className="px-5 py-2.5 bg-slate-50/50 border-b grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Операций</span>
              <p className="font-bold text-slate-700">{transactions.length}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Поступило</span>
              <p className="font-bold text-green-600">+{fmt(totalIn)}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Списано</span>
              <p className="font-bold text-red-600">−{fmt(totalOut)}</p>
            </div>
          </div>
        )}

        {!statementRequested ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            <Icon name="FileText" size={32} className="mx-auto mb-2 opacity-30" />
            <p>Выберите период и нажмите «Загрузить»</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            <p>Операций за выбранный период не найдено</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="w-28">Дата</TableHead>
                <TableHead className="w-44">Контрагент</TableHead>
                <TableHead>Назначение платежа</TableHead>
                <TableHead className="text-right w-36">Сумма</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx, i) => (
                <TableRow key={tx.tx_id || i} className="hover:bg-slate-50/50">
                  <TableCell className="text-sm whitespace-nowrap">{fmtDate(tx.date)}</TableCell>
                  <TableCell className="text-xs font-medium text-slate-800 max-w-[176px] truncate">
                    {tx.counterparty || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 max-w-[320px]">
                    {tx.description || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-semibold ${tx.credit_debit === "Debit" ? "text-red-600" : "text-green-600"}`}>
                      {tx.credit_debit === "Debit" ? "−" : "+"}
                      {fmt(tx.amount, tx.currency)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}