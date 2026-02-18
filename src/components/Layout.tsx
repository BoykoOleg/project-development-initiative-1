import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

const menuItems = [
  { icon: "LayoutDashboard", label: "Главная", id: "dashboard", path: "/" },
  {
    icon: "ClipboardList",
    label: "Заявки",
    id: "orders",
    path: "/orders",
    badge: 5,
  },
  {
    icon: "FileText",
    label: "Заказ-наряды",
    id: "work-orders",
    path: "/work-orders",
  },
  { icon: "Users", label: "Клиенты", id: "clients", path: "/clients" },
  { icon: "Package", label: "Склад", id: "warehouse", path: "/warehouse" },
  { icon: "TrendingUp", label: "Финансы", id: "finance", path: "/finance" },
  { icon: "Settings", label: "Настройки", id: "settings", path: "/settings" },
];

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
}

const Layout = ({ children, title, actions }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const activeMenu =
    menuItems.find((item) => item.path === location.pathname)?.id ||
    "dashboard";

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-[#0f172a] text-white flex flex-col shrink-0
        transform transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
      `}
      >
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Icon name="Wrench" size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Smartline</h1>
              <p className="text-xs text-white/50">Установочный центр</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={`sidebar-nav-item ${activeMenu === item.id ? "active" : "text-white/60"}`}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
            >
              <Icon name={item.icon} size={20} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="sidebar-nav-item text-white/60">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
              АМ
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                Администратор
              </div>
              <div className="text-xs text-white/40">admin@avtomaster.ru</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-border flex items-center px-4 sm:px-6 gap-4 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Icon name="Menu" size={20} />
          </Button>

          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" className="relative">
              <Icon name="Bell" size={20} className="text-muted-foreground" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                3
              </span>
            </Button>
            {actions}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
