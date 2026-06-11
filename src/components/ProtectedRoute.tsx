import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Login from "@/pages/Login";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

interface Props {
  children: ReactNode;
  requireAdmin?: boolean;
}

function BiometricPrompt() {
  const [visible, setVisible] = useState(false);
  const pendingEmail = localStorage.getItem("biometric_pending_email") || "";

  useEffect(() => {
    if (localStorage.getItem("biometric_show_prompt") === "true") {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.removeItem("biometric_show_prompt");
    localStorage.removeItem("biometric_pending_email");
    setVisible(false);
  };

  const enable = async () => {
    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "АвтоСервис CRM", id: window.location.hostname },
          user: {
            id: new TextEncoder().encode(pendingEmail),
            name: pendingEmail,
            displayName: pendingEmail,
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },
            { alg: -257, type: "public-key" },
          ],
          authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
          timeout: 60000,
        },
      });
      if (credential) {
        localStorage.setItem("biometric_enabled", "true");
        localStorage.setItem("biometric_email", pendingEmail);
      }
    } catch {
      // пользователь отказался
    }
    dismiss();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center space-y-5">
        <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto">
          <Icon name="Fingerprint" size={28} className="text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Включить биометрию?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Для быстрого входа через Face ID или отпечаток пальца
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white" onClick={enable}>
            Включить
          </Button>
          <Button variant="ghost" className="w-full" onClick={dismiss}>
            Пропустить
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children, requireAdmin = false }: Props) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-border w-full max-w-sm p-8 flex flex-col items-center gap-5">
        <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center">
          <Icon name="Car" size={28} className="text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">АвтоСервис CRM</h1>
          <p className="text-sm text-muted-foreground mt-1">Загрузка...</p>
        </div>
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

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

  return (
    <>
      {children}
      <BiometricPrompt />
    </>
  );
}