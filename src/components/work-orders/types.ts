export interface WorkItem {
  id?: number;
  name: string;
  price: number;
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
  client: string;
  car: string;
  status: "new" | "in-progress" | "done" | "issued";
  works: WorkItem[];
  parts: PartItem[];
  master: string;
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