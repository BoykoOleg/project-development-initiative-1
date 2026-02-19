export interface WorkItem {
  id?: number;
  name: string;
  price: number;
  qty: number;
  norm_hours: number;
  norm_hour_price: number;
  discount: number;
}

export interface PartItem {
  id?: number;
  name: string;
  qty: number;
  price: number;
  purchase_price?: number;
  product_id?: number | null;
}

export interface WorkOrder {
  id: number;
  number: string;
  date: string;
  created_at: string;
  issued_at: string;
  client: string;
  client_id?: number;
  car_id?: number;
  car: string;
  status: "new" | "in-progress" | "done" | "issued";
  works: WorkItem[];
  parts: PartItem[];
  master: string;
  payer_client_id?: number | null;
  payer_name: string;
  car_vin?: string;
  client_phone?: string;
  employee_id?: number | null;
  employee_name?: string;
}

export const statusConfig: Record<string, { label: string; className: string }> = {
  "new": { label: "Новый", className: "bg-purple-100 text-purple-700" },
  "in-progress": { label: "В работе", className: "bg-blue-100 text-blue-700" },
  "done": { label: "Готов", className: "bg-green-100 text-green-700" },
  "issued": { label: "Выдан", className: "bg-gray-100 text-gray-700" },
};

export const getTotal = (wo: WorkOrder) => {
  const worksTotal = wo.works.reduce((s, w) => s + w.price, 0);
  const partsTotal = wo.parts.reduce((s, p) => s + p.price * p.qty, 0);
  return worksTotal + partsTotal;
};

export const COMPANY_INFO = {
  name: 'ООО "КОНТАВТО"',
  inn: '2465155610',
  kpp: '246501001',
  ogrn: '1162468118010',
  address: '660020, Красноярский край, г. Красноярск, Советский р-н, ул. Дудинская, д. 3, стр. 2, офис 202',
  director: 'Бойко Олег Сергеевич',
  email: 'osmolovskaya1707@mail.ru',
};