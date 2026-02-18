import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Layout from "@/components/Layout";
import { useNavigate } from "react-router-dom";

const recentOrders = [
  { id: "ЗН-0042", client: "Иванов А.С.", car: "Toyota Camry", service: "Установка сигнализации", status: "in-progress", total: 18500 },
  { id: "ЗН-0041", client: "Петров В.И.", car: "Kia Rio", service: "Тонировка стёкол", status: "done", total: 8000 },
  { id: "ЗН-0040", client: "Сидорова М.К.", car: "BMW X5", service: "Шумоизоляция", status: "done", total: 45000 },
  { id: "ЗН-0039", client: "Козлов Д.А.", car: "Hyundai Creta", service: "Установка магнитолы", status: "waiting", total: 12000 },
  { id: "ЗН-0038", client: "Николаев П.Р.", car: "Lada Vesta", service: "Установка парктроника", status: "in-progress", total: 6500 },
];

const warehouseAlerts = [
  { name: "Сигнализация StarLine A93", qty: 2, min: 5 },
  { name: "Плёнка тонировочная 35%", qty: 1, min: 3 },
  { name: "Магнитола Pioneer MVH-S120", qty: 0, min: 2 },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  "in-progress": { label: "В работе", className: "bg-blue-100 text-blue-700" },
  "done": { label: "Готов", className: "bg-green-100 text-green-700" },
  "waiting": { label: "Ожидание", className: "bg-amber-100 text-amber-700" },
  "new": { label: "Новая", className: "bg-purple-100 text-purple-700" },
};

const Index = () => {
  const navigate = useNavigate();

  return (
    <Layout
      title="Главная панель"
      actions={
        <>
          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white hidden sm:flex"
            onClick={() => navigate("/orders")}
          >
            <Icon name="Plus" size={16} className="mr-1.5" />
            Новая заявка
          </Button>
          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white sm:hidden"
            size="sm"
            onClick={() => navigate("/orders")}
          >
            <Icon name="Plus" size={16} />
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Icon name="ClipboardList" size={20} className="text-blue-500" />
              </div>
              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                <Icon name="TrendingUp" size={14} />
                +12%
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">24</div>
            <div className="text-sm text-muted-foreground">Заявки за месяц</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Icon name="CircleDollarSign" size={20} className="text-green-500" />
              </div>
              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                <Icon name="TrendingUp" size={14} />
                +8%
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">342 000 ₽</div>
            <div className="text-sm text-muted-foreground">Доход за месяц</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Icon name="Wallet" size={20} className="text-amber-500" />
              </div>
              <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                <Icon name="TrendingDown" size={14} />
                -3%
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">187 000 ₽</div>
            <div className="text-sm text-muted-foreground">Расходы за месяц</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Icon name="Package" size={20} className="text-purple-500" />
              </div>
              <span className="text-xs text-amber-500 font-medium flex items-center gap-1">
                <Icon name="AlertTriangle" size={14} />
                3
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">156</div>
            <div className="text-sm text-muted-foreground">Товаров на складе</div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-xl border border-border shadow-sm">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Последние заказ-наряды</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-500 hover:text-blue-600"
                onClick={() => navigate("/work-orders")}
              >
                Все наряды
                <Icon name="ArrowRight" size={16} className="ml-1" />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Номер</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden sm:table-cell">Клиент</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Авто</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Услуга</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Статус</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-blue-600">{order.id}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="text-sm text-foreground">{order.client}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-foreground">{order.car}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">{order.service}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[order.status]?.className}`}>
                          {statusConfig[order.status]?.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-sm font-medium text-foreground">
                          {order.total.toLocaleString("ru-RU")} ₽
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-border shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Склад — мало</h3>
                <Icon name="AlertTriangle" size={18} className="text-amber-500" />
              </div>
              <div className="space-y-4">
                {warehouseAlerts.map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-foreground truncate mr-2">{item.name}</span>
                      <span className={`text-xs font-medium ${item.qty === 0 ? "text-red-500" : "text-amber-500"}`}>
                        {item.qty} / {item.min}
                      </span>
                    </div>
                    <Progress value={item.min > 0 ? (item.qty / item.min) * 100 : 0} className="h-2" />
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4 text-muted-foreground"
                onClick={() => navigate("/warehouse")}
              >
                <Icon name="Package" size={14} className="mr-1.5" />
                Перейти на склад
              </Button>
            </div>

            <div className="bg-white rounded-xl border border-border shadow-sm p-5">
              <h3 className="font-semibold text-foreground mb-4">Сегодня в работе</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">Toyota Camry — сигнализация</div>
                    <div className="text-xs text-muted-foreground">Мастер: Алексей К.</div>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">60%</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">Lada Vesta — парктроник</div>
                    <div className="text-xs text-muted-foreground">Мастер: Дмитрий П.</div>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">30%</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">Hyundai Creta — магнитола</div>
                    <div className="text-xs text-muted-foreground">Ожидает деталь</div>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    <Icon name="Clock" size={12} className="mr-1" />
                    Пауза
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;