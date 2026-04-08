export const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(n);

export const fmtDate = (s: string) =>
  new Date(s).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export interface FinanceRow {
  id: number;
  amount: string | number;
  comment: string;
  created_at: string;
  cashbox_name: string;
}

export interface PaymentRow extends FinanceRow {
  payment_method: string;
}

export interface ExpenseRow extends FinanceRow {
  group_name?: string;
}

export interface IncomeRow extends FinanceRow {
  income_type: string;
}

export interface WorkItem {
  name: string;
  qty: number;
  price: number;
  norm_hours: number;
  discount: number;
}

export interface PartItem {
  name: string;
  qty: number;
  sell_price: number;
  purchase_price: number;
}

export interface StockTransferItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  unit: string;
  qty: number;
  price: number;
}

export interface StockTransfer {
  id: number;
  transfer_number: string;
  direction: "to_order" | "to_stock";
  status: "draft" | "confirmed";
  notes: string;
  created_at: string;
  confirmed_at: string;
  items: StockTransferItem[];
}

export interface WOFinanceData {
  work_order: {
    id: number;
    number: string;
    client_name: string;
    car_info: string;
    status: string;
  };
  works_total: number;
  parts_total: number;
  parts_purchase_total: number;
  parts_margin: number;
  order_total: number;
  paid: number;
  debt: number;
  total_income: number;
  total_expense: number;
  profit: number;
  works: WorkItem[];
  parts: PartItem[];
  payments: PaymentRow[];
  expenses: ExpenseRow[];
  incomes: IncomeRow[];
  transfers: StockTransfer[];
}

export interface Cashbox {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
  balance: number;
}

export interface ExpenseGroup {
  id: number;
  name: string;
  is_active: boolean;
}

export const paymentMethodLabel: Record<string, string> = {
  cash: "Наличные",
  card: "Карта",
  transfer: "Перевод",
  online: "Онлайн",
};

export const incomeTypeLabel: Record<string, string> = {
  other: "Прочее",
  deposit: "Взнос",
  refund: "Возврат",
  investment: "Инвестиции",
  loan: "Займ",
};