import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { getApiUrl } from "@/lib/api";

interface ActiveCall {
  id: string;
  phone: string;
  src: string;
  dst: string;
  direction: string;
  state: string;
  started_at: string;
  client_name: string | null;
}

const POLL_INTERVAL = 4000;
const DISMISS_TIMEOUT = 30000;

const formatPhone = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) {
    return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9)}`;
  }
  return phone;
};

const IncomingCallPopup = () => {
  const navigate = useNavigate();
  const [call, setCall] = useState<ActiveCall | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [ringing, setRinging] = useState(false);

  const fetchActive = useCallback(async () => {
    const url = getApiUrl("calls");
    if (!url) return;
    try {
      const res = await fetch(`${url}?action=active`);
      const data = await res.json();
      if (data.active && data.call) {
        const c: ActiveCall = data.call;
        if (!dismissed.has(c.id)) {
          setCall(c);
          setVisible(true);
        }
      } else {
        setCall(null);
        setVisible(false);
      }
    } catch {
      // silent
    }
  }, [dismissed]);

  useEffect(() => {
    fetchActive();
    const interval = setInterval(fetchActive, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchActive]);

  useEffect(() => {
    if (!visible || !call) return;
    setRinging(true);
    const t = setTimeout(() => {
      setDismissed((prev) => new Set(prev).add(call.id));
      setVisible(false);
    }, DISMISS_TIMEOUT);
    return () => {
      clearTimeout(t);
      setRinging(false);
    };
  }, [visible, call?.id]);

  const handleDismiss = () => {
    if (call) setDismissed((prev) => new Set(prev).add(call.id));
    setVisible(false);
  };

  const handleCreateOrder = () => {
    if (!call) return;
    setDismissed((prev) => new Set(prev).add(call.id));
    setVisible(false);
    const params = new URLSearchParams({ client: call.client_name || call.phone });
    navigate(`/orders?from_call=1&${params.toString()}`);
  };

  if (!visible || !call) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] w-80 rounded-xl shadow-2xl border border-border bg-background animate-in slide-in-from-bottom-4 fade-in duration-300"
      style={{ boxShadow: "0 8px 40px 0 rgba(0,0,0,0.18)" }}
    >
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center ${ringing ? "animate-pulse" : ""}`}>
          <Icon name="Phone" size={20} className="text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Входящий звонок</div>
          <div className="text-base font-bold text-foreground truncate">{formatPhone(call.phone)}</div>
          {call.client_name && (
            <div className="text-sm text-muted-foreground truncate">{call.client_name}</div>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon name="X" size={16} />
        </button>
      </div>
      <div className="flex gap-2 px-4 pb-4 pt-1">
        <Button
          size="sm"
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          onClick={handleCreateOrder}
        >
          <Icon name="FilePlus" size={14} className="mr-1" />
          Создать заявку
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => {
            navigate("/calls");
            handleDismiss();
          }}
        >
          <Icon name="PhoneCall" size={14} className="mr-1" />
          Звонки
        </Button>
      </div>
    </div>
  );
};

export default IncomingCallPopup;
