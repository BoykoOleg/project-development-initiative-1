import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";
import { WorkOrder, statusConfig } from "@/components/work-orders/types";

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

const WorkOrderPrint = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [telegramId, setTelegramId] = useState("");
  const [showTgDialog, setShowTgDialog] = useState(false);

  useEffect(() => {
    const fetchWorkOrder = async () => {
      try {
        const url = getApiUrl("work-orders");
        if (!url) { setLoading(false); return; }
        const res = await fetch(url);
        const data = await res.json();
        if (data.work_orders) {
          const found = data.work_orders.find((wo: WorkOrder) => wo.id === Number(id));
          if (found) setWorkOrder(found);
        }
      } catch {
        toast.error("Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    };
    fetchWorkOrder();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleSendTelegram = async () => {
    if (!telegramId.trim() || !workOrder) {
      toast.error("Введите Telegram ID или номер телефона клиента");
      return;
    }
    setSending(true);
    try {
      const url = getApiUrl("tgsend");
      if (!url) { toast.error("Бэкенд не подключён"); return; }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_telegram",
          work_order_id: workOrder.id,
          telegram_id: telegramId.trim(),
        }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("Заказ-наряд отправлен клиенту в Telegram");
        setShowTgDialog(false);
      }
    } catch {
      toast.error("Ошибка отправки");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-500 text-lg">Заказ-наряд не найден</p>
        <button onClick={() => navigate("/work-orders")} className="text-blue-600 underline">
          К списку
        </button>
      </div>
    );
  }

  const worksTotal = workOrder.works.reduce((s, w) => s + w.price, 0);
  const partsTotal = workOrder.parts.reduce((s, p) => s + p.price * p.qty, 0);
  const total = worksTotal + partsTotal;
  const statusInfo = statusConfig[workOrder.status];

  return (
    <>
      <div className="no-print fixed top-0 left-0 right-0 bg-white border-b z-50 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => navigate(`/work-orders/${id}`)}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Назад
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setShowTgDialog(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#2AABEE] hover:bg-[#229ED9] rounded-lg transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
          Отправить в Telegram
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
          Печать / PDF
        </button>
      </div>

      {showTgDialog && (
        <div className="no-print fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold">Отправить в Telegram</h3>
            <p className="text-sm text-gray-500">
              Введите Telegram ID клиента (числовой) или username (без @). Клиент должен предварительно начать чат с ботом.
            </p>
            <input
              type="text"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              placeholder="Например: 123456789 или username"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowTgDialog(false)}
                className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleSendTelegram}
                disabled={sending}
                className="flex-1 px-4 py-2 text-sm text-white bg-[#2AABEE] hover:bg-[#229ED9] rounded-lg disabled:opacity-50"
              >
                {sending ? "Отправка..." : "Отправить"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div ref={printRef} className="print-area max-w-[800px] mx-auto p-8 pt-20 print:pt-0">
        <div className="border-b-2 border-gray-900 pb-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Smartline</h1>
              <p className="text-sm text-gray-500">Установочный центр</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-gray-900">ЗАКАЗ-НАРЯД</h2>
              <p className="text-lg font-semibold text-blue-600">{workOrder.number}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-8 text-sm">
          <div className="flex gap-2">
            <span className="text-gray-500 shrink-0">Дата:</span>
            <span className="font-medium">{workOrder.date}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 shrink-0">Статус:</span>
            <span className={`font-medium px-2 py-0.5 rounded text-xs ${statusInfo.className}`}>
              {statusInfo.label}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 shrink-0">Клиент:</span>
            <span className="font-medium">{workOrder.client}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 shrink-0">Мастер:</span>
            <span className="font-medium">{workOrder.master || "—"}</span>
          </div>
          <div className="flex gap-2 col-span-2">
            <span className="text-gray-500 shrink-0">Автомобиль:</span>
            <span className="font-medium">{workOrder.car || "—"}</span>
          </div>
        </div>

        {workOrder.works.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 border-b pb-2">
              Работы
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase">
                  <th className="text-left py-2 pr-4 font-medium w-12">№</th>
                  <th className="text-left py-2 pr-4 font-medium">Наименование</th>
                  <th className="text-right py-2 font-medium w-32">Стоимость</th>
                </tr>
              </thead>
              <tbody>
                {workOrder.works.map((w, i) => (
                  <tr key={w.id || i} className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-gray-400">{i + 1}</td>
                    <td className="py-2 pr-4">{w.name}</td>
                    <td className="py-2 text-right font-medium">{fmt(w.price)}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td colSpan={2} className="py-2 text-right pr-4">Итого работы:</td>
                  <td className="py-2 text-right">{fmt(worksTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {workOrder.parts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 border-b pb-2">
              Запасные части и материалы
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase">
                  <th className="text-left py-2 pr-4 font-medium w-12">№</th>
                  <th className="text-left py-2 pr-4 font-medium">Наименование</th>
                  <th className="text-right py-2 pr-4 font-medium w-16">Кол-во</th>
                  <th className="text-right py-2 pr-4 font-medium w-28">Цена</th>
                  <th className="text-right py-2 font-medium w-28">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {workOrder.parts.map((p, i) => (
                  <tr key={p.id || i} className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-gray-400">{i + 1}</td>
                    <td className="py-2 pr-4">{p.name}</td>
                    <td className="py-2 pr-4 text-right">{p.qty}</td>
                    <td className="py-2 pr-4 text-right">{fmt(p.price)}</td>
                    <td className="py-2 text-right font-medium">{fmt(p.price * p.qty)}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td colSpan={4} className="py-2 text-right pr-4">Итого запчасти:</td>
                  <td className="py-2 text-right">{fmt(partsTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t-2 border-gray-900 pt-4 mt-8">
          <div className="flex justify-end">
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">ИТОГО К ОПЛАТЕ</div>
              <div className="text-3xl font-bold text-gray-900">{fmt(total)}</div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-8 text-sm">
          <div>
            <div className="text-gray-500 mb-8">Исполнитель:</div>
            <div className="border-b border-gray-300 pb-1 mb-1" />
            <div className="text-xs text-gray-400">подпись / ФИО</div>
          </div>
          <div>
            <div className="text-gray-500 mb-8">Заказчик:</div>
            <div className="border-b border-gray-300 pb-1 mb-1" />
            <div className="text-xs text-gray-400">подпись / ФИО</div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400 print:mt-12">
          Smartline — Установочный центр
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20mm; }
          .no-print { display: none !important; }
          @page { margin: 0; size: A4; }
        }
      `}</style>
    </>
  );
};

export default WorkOrderPrint;