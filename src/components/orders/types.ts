export interface Car {
  id: number;
  brand: string;
  model: string;
  year: string;
  vin: string;
  license_plate?: string;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
  cars: Car[];
}

export interface Order {
  id: number;
  number: string;
  date: string;
  client: string;
  client_id?: number;
  phone: string;
  car: string;
  service: string;
  status: "new" | "contacted" | "approved" | "rejected";
  comment: string;
  source?: string;
}

export const statusConfig: Record<string, { label: string; className: string }> = {
  new: { label: "Новая", className: "bg-purple-100 text-purple-700" },
  contacted: { label: "Связались", className: "bg-blue-100 text-blue-700" },
  approved: { label: "Одобрена", className: "bg-green-100 text-green-700" },
  rejected: { label: "Отклонена", className: "bg-red-100 text-red-700" },
};

export const ASSIGNEES = ["Артем", "Олег", "Алексей"] as const;
export type Assignee = typeof ASSIGNEES[number];

export interface OrderTask {
  id: number;
  order_id: number;
  assignee: string;
  text: string;
  done: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderMessage {
  id: number;
  order_id: number;
  user_id: number | null;
  user_name: string;
  text: string;
  created_at: string;
}