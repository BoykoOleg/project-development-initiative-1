import { useState, useEffect } from "react";
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";

export interface Cashbox {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
  balance: number;
  total_received: number;
}

export interface Payment {
  id: number;
  work_order_id: number;
  cashbox_id: number;
  amount: number;
  payment_method: string;
  comment: string;
  created_at: string;
  cashbox_name: string;
  cashbox_type: string;
  client_name: string;
  work_order_number: string;
}

export interface Dashboard {
  total_revenue: number;
  month_revenue: number;
  today_revenue: number;
  prev_month_revenue: number;
  total_payments: number;
  completed_orders: number;
  total_works: number;
  total_parts: number;
  by_method: Record<string, number>;
  cashboxes: Cashbox[];
}

export interface ExpenseGroup {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  total_spent: number;
  expense_count: number;
}

export interface Expense {
  id: number;
  expense_group_id: number | null;
  cashbox_id: number;
  amount: number;
  comment: string;
  created_at: string;
  cashbox_name: string;
  cashbox_type: string;
  group_name: string | null;
  work_order_id?: number | null;
  stock_receipt_id?: number | null;
  client_id?: number | null;
  client_name?: string | null;
  operation_date?: string | null;
  has_bank_tx?: boolean;
}

export interface IncomeGroup {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  total_received: number;
  income_count: number;
}

export interface Income {
  id: number;
  income_group_id: number | null;
  cashbox_id: number;
  amount: number;
  income_type: string;
  comment: string;
  created_at: string;
  cashbox_name: string;
  cashbox_type: string;
  client_id?: number | null;
  client_name?: string | null;
  operation_date?: string | null;
  work_order_id?: number | null;
  bank_description?: string | null;
  bank_counterparty?: string | null;
}

export interface Transfer {
  id: number;
  from_cashbox_id: number;
  to_cashbox_id: number;
  amount: number;
  comment: string;
  created_at: string;
  from_cashbox_name: string;
  from_cashbox_type: string;
  to_cashbox_name: string;
  to_cashbox_type: string;
}

export const useFinanceData = () => {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseGroups, setExpenseGroups] = useState<ExpenseGroup[]>([]);
  const [incomeGroups, setIncomeGroups] = useState<IncomeGroup[]>([]);

  const fetchDashboard = async () => {
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const res = await fetch(`${url}?section=dashboard`);
      const data = await res.json();
      setDashboard(data);
    } catch {
      toast.error("Ошибка загрузки финансов");
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const res = await fetch(`${url}?section=payments`);
      const data = await res.json();
      if (data.payments) setPayments(data.payments);
    } catch {
      toast.error("Ошибка загрузки платежей");
    }
  };

  const fetchExpenses = async () => {
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const res = await fetch(`${url}?section=expenses`);
      const data = await res.json();
      if (data.expenses) setExpenses(data.expenses);
    } catch {
      toast.error("Ошибка загрузки расходов");
    }
  };

  const fetchExpenseGroups = async () => {
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const res = await fetch(`${url}?section=expense_groups`);
      const data = await res.json();
      if (data.expense_groups) setExpenseGroups(data.expense_groups);
    } catch {
      toast.error("Ошибка загрузки групп расходов");
    }
  };

  const fetchIncomes = async () => {
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const res = await fetch(`${url}?section=incomes`);
      const data = await res.json();
      if (data.incomes) setIncomes(data.incomes);
    } catch {
      toast.error("Ошибка загрузки приходных ордеров");
    }
  };

  const fetchIncomeGroups = async () => {
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const res = await fetch(`${url}?section=income_groups`);
      const data = await res.json();
      if (data.income_groups) setIncomeGroups(data.income_groups);
    } catch {
      toast.error("Ошибка загрузки групп приходов");
    }
  };

  const fetchTransfers = async () => {
    try {
      const url = getApiUrl("finance");
      if (!url) return;
      const res = await fetch(`${url}?section=transfers`);
      const data = await res.json();
      if (data.transfers) setTransfers(data.transfers);
    } catch {
      toast.error("Ошибка загрузки перемещений");
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchPayments();
    fetchExpenses();
    fetchExpenseGroups();
    fetchIncomes();
    fetchIncomeGroups();
    fetchTransfers();
  }, []);

  return {
    dashboard,
    payments,
    incomes,
    incomeGroups,
    transfers,
    loading,
    expenses,
    expenseGroups,
    fetchDashboard,
    fetchPayments,
    fetchExpenses,
    fetchExpenseGroups,
    fetchIncomes,
    fetchIncomeGroups,
    fetchTransfers,
  };
};