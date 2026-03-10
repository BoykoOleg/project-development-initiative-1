import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

const CONSENT_KEY = "cookie_consent_accepted";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(CONSENT_KEY);
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom duration-500">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="shrink-0 mt-0.5">
              <Icon name="Cookie" size={24} fallback="Shield" />
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed">
              Мы используем файлы cookie и обрабатываем персональные данные для улучшения работы сайта.
              Продолжая использовать сайт, вы даёте согласие на обработку персональных данных
              в соответствии с{" "}
              <a
                href="/privacy"
                className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
              >
                Политикой конфиденциальности
              </a>.
            </div>
          </div>
          <div className="flex gap-2 shrink-0 w-full md:w-auto">
            <Button
              onClick={accept}
              className="flex-1 md:flex-none"
            >
              Принимаю
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
