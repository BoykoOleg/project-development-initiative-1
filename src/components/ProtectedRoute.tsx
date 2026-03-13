import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Login from "@/pages/Login";

interface Props {
  children: ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-muted-foreground text-sm">Загрузка...</div>
      </div>
    );
  }

  if (!user) return <Login />;
  if (requireAdmin && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">Нет доступа</p>
          <p className="text-sm text-muted-foreground mt-1">Эта страница только для администратора</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
