import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";
import { WorkOrder, statusConfig, COMPANY_INFO } from "@/components/work-orders/types";

const fmtNum = (n: number) =>
  new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const fmtCur = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 2 }).format(n);

function numberToWordsRu(n: number): string {
  const units = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
  const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
  const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

  const intPart = Math.floor(n);
  const kopPart = Math.round((n - intPart) * 100);

  if (intPart === 0) return `ноль рублей ${String(kopPart).padStart(2, '0')} копеек`;

  const convertGroup = (num: number): string => {
    if (num === 0) return '';
    let result = '';
    const h = Math.floor(num / 100);
    const t = Math.floor((num % 100) / 10);
    const u = num % 10;
    if (h > 0) result += hundreds[h] + ' ';
    if (t === 1) { result += teens[u] + ' '; return result.trim(); }
    if (t > 1) result += tens[t] + ' ';
    if (u > 0) result += units[u] + ' ';
    return result.trim();
  };

  const parts: string[] = [];
  const millions = Math.floor(intPart / 1000000);
  const thousands = Math.floor((intPart % 1000000) / 1000);
  const remainder = intPart % 1000;

  if (millions > 0) {
    const ml = millions % 10;
    const mt = Math.floor((millions % 100) / 10);
    let suffix = 'миллионов';
    if (mt !== 1) { if (ml === 1) suffix = 'миллион'; else if (ml >= 2 && ml <= 4) suffix = 'миллиона'; }
    parts.push(convertGroup(millions) + ' ' + suffix);
  }
  if (thousands > 0) {
    let tg = convertGroup(thousands);
    const tl = thousands % 10;
    const tt = Math.floor((thousands % 100) / 10);
    if (tt !== 1) {
      if (tl === 1) tg = tg.replace(/один$/, 'одна');
      if (tl === 2) tg = tg.replace(/два$/, 'две');
    }
    let suffix = 'тысяч';
    if (tt !== 1) { if (tl === 1) suffix = 'тысяча'; else if (tl >= 2 && tl <= 4) suffix = 'тысячи'; }
    parts.push(tg + ' ' + suffix);
  }
  if (remainder > 0) parts.push(convertGroup(remainder));

  const rubWord = (() => {
    const r = intPart % 10;
    const rt = Math.floor((intPart % 100) / 10);
    if (rt === 1) return 'рублей';
    if (r === 1) return 'рубль';
    if (r >= 2 && r <= 4) return 'рубля';
    return 'рублей';
  })();

  const kopWord = (() => {
    const k = kopPart % 10;
    const kt = Math.floor((kopPart % 100) / 10);
    if (kt === 1) return 'копеек';
    if (k === 1) return 'копейка';
    if (k >= 2 && k <= 4) return 'копейки';
    return 'копеек';
  })();

  const text = parts.join(' ') + ' ' + rubWord + ' ' + String(kopPart).padStart(2, '0') + ' ' + kopWord;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

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

  const handlePrint = () => { window.print(); };

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
      if (data.error) { toast.error(data.error); } else {
        toast.success("Заказ-наряд отправлен клиенту в Telegram");
        setShowTgDialog(false);
      }
    } catch { toast.error("Ошибка отправки"); } finally { setSending(false); }
  };

  if (loading) {
    return (<div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">Загрузка...</p></div>);
  }

  if (!workOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-500 text-lg">Заказ-наряд не найден</p>
        <button onClick={() => navigate("/work-orders")} className="text-blue-600 underline">К списку</button>
      </div>
    );
  }

  const worksTotal = workOrder.works.reduce((s, w) => s + w.price, 0);
  const partsTotal = workOrder.parts.reduce((s, p) => s + p.price * p.qty, 0);
  const total = worksTotal + partsTotal;
  const worksDiscountTotal = workOrder.works.reduce((s, w) => s + (w.discount || 0), 0);
  const totalQtyWorks = workOrder.works.reduce((s, w) => s + (w.qty || 1), 0);
  const totalNormHours = workOrder.works.reduce((s, w) => s + (w.norm_hours || 0), 0);
  const partsDiscountTotal = 0;
  const totalQtyParts = workOrder.parts.reduce((s, p) => s + p.qty, 0);
  const payerName = workOrder.payer_name || workOrder.client;
  const statusLabel = statusConfig[workOrder.status]?.label || workOrder.status;
  const issuedDate = workOrder.issued_at ? new Date(workOrder.issued_at).toLocaleDateString("ru-RU") : '';

  return (
    <>
      <div className="no-print fixed top-0 left-0 right-0 bg-white border-b z-50 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate(`/work-orders/${id}`)} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Назад
        </button>
        <div className="flex-1" />
        <button onClick={() => setShowTgDialog(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#2AABEE] hover:bg-[#229ED9] rounded-lg transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
          Telegram
        </button>
        <button onClick={handlePrint} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
          Печать / PDF
        </button>
      </div>

      {showTgDialog && (
        <div className="no-print fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold">Отправить в Telegram</h3>
            <p className="text-sm text-gray-500">Введите Telegram ID клиента (числовой) или username (без @).</p>
            <input type="text" value={telegramId} onChange={(e) => setTelegramId(e.target.value)} placeholder="Например: 123456789" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
            <div className="flex gap-3">
              <button onClick={() => setShowTgDialog(false)} className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Отмена</button>
              <button onClick={handleSendTelegram} disabled={sending} className="flex-1 px-4 py-2 text-sm text-white bg-[#2AABEE] hover:bg-[#229ED9] rounded-lg disabled:opacity-50">{sending ? "Отправка..." : "Отправить"}</button>
            </div>
          </div>
        </div>
      )}

      <div ref={printRef} className="print-area max-w-[900px] mx-auto p-6 pt-20 print:pt-0 print:p-4 text-[11px] leading-tight text-black">

        {/* ШАПКА КОМПАНИИ */}
        <div className="mb-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[15px] font-bold">{COMPANY_INFO.name}</div>
              <div className="text-[10px] text-gray-600 mt-0.5">ИНН {COMPANY_INFO.inn} / КПП {COMPANY_INFO.kpp} / ОГРН {COMPANY_INFO.ogrn}</div>
              <div className="text-[10px] text-gray-600">Адрес: {COMPANY_INFO.address}</div>
              <div className="text-[10px] text-gray-600">Директор: {COMPANY_INFO.director}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-500">Телефон: {workOrder.client_phone || '—'}</div>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-black mb-4"></div>

        {/* ЗАГОЛОВОК */}
        <div className="text-center mb-4">
          <div className="text-[16px] font-bold">Квитанция к заказ-наряду № {workOrder.number} от {workOrder.date}</div>
        </div>

        {/* ЗАКАЗЧИК / АВТО / ПЛАТЕЛЬЩИК */}
        <div className="border border-black mb-3">
          <div className="flex border-b border-black">
            <div className="flex-1 p-1.5 border-r border-black">
              <span className="font-bold">Заказчик: </span>{workOrder.client}
              {workOrder.client_phone && <span className="ml-2 text-gray-600">тел. {workOrder.client_phone}</span>}
            </div>
          </div>
          <div className="flex border-b border-black">
            <div className="flex-1 p-1.5 border-r border-black">
              <span className="font-bold">Автомобиль: </span>{workOrder.car || '—'}
            </div>
            <div className="p-1.5 w-[200px]">
              <span className="font-bold">VIN: </span>{workOrder.car_vin || '—'}
            </div>
          </div>
          <div className="flex">
            <div className="flex-1 p-1.5">
              <span className="font-bold">Плательщик: </span>{payerName}
              {workOrder.payer_client_id && workOrder.payer_client_id !== workOrder.client_id && (
                <span className="ml-1 text-gray-500">(отличается от заказчика)</span>
              )}
            </div>
          </div>
        </div>

        {/* ДАТЫ И СТАТУС */}
        <div className="flex gap-4 mb-4 text-[10px]">
          <div className="border border-black px-2 py-1">
            <span className="font-bold">Принят: </span>{workOrder.date}
          </div>
          {issuedDate && (
            <div className="border border-black px-2 py-1">
              <span className="font-bold">Выдан: </span>{issuedDate}
            </div>
          )}
          <div className="border border-black px-2 py-1">
            <span className="font-bold">Статус: </span>{statusLabel}
          </div>
          {workOrder.master && (
            <div className="border border-black px-2 py-1">
              <span className="font-bold">Мастер-приёмщик: </span>{workOrder.master}
            </div>
          )}
          {workOrder.employee_name && (
            <div className="border border-black px-2 py-1">
              <span className="font-bold">Ответственный: </span>{workOrder.employee_name}
            </div>
          )}
        </div>

        {/* === ВЫПОЛНЕННЫЕ РАБОТЫ === */}
        <div className="font-bold mb-1">Выполненные работы по заказ-наряду № {workOrder.number} от {workOrder.date}</div>
        <table className="w-full border-collapse border border-black mb-1">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black px-1 py-1 text-center w-8">№</th>
              <th className="border border-black px-1 py-1 text-left">Наименование</th>
              <th className="border border-black px-1 py-1 text-center w-14">Кол.&nbsp;оп.</th>
              <th className="border border-black px-1 py-1 text-center w-16">Норма</th>
              <th className="border border-black px-1 py-1 text-center w-14">н/ч</th>
              <th className="border border-black px-1 py-1 text-right w-20">Цена н/ч</th>
              <th className="border border-black px-1 py-1 text-right w-16">Скидка</th>
              <th className="border border-black px-1 py-1 text-right w-24">Всего</th>
            </tr>
          </thead>
          <tbody>
            {workOrder.works.map((w, i) => (
              <tr key={w.id || i}>
                <td className="border border-black px-1 py-0.5 text-center">{i + 1}</td>
                <td className="border border-black px-1 py-0.5">{w.name}</td>
                <td className="border border-black px-1 py-0.5 text-center">{w.qty}</td>
                <td className="border border-black px-1 py-0.5 text-center">{w.norm_hours ? fmtNum(w.norm_hours) : ''}</td>
                <td className="border border-black px-1 py-0.5 text-center">{w.norm_hour_price ? '' : ''}</td>
                <td className="border border-black px-1 py-0.5 text-right">{w.norm_hour_price ? fmtNum(w.norm_hour_price) : ''}</td>
                <td className="border border-black px-1 py-0.5 text-right">{w.discount ? fmtNum(w.discount) : ''}</td>
                <td className="border border-black px-1 py-0.5 text-right font-medium">{fmtNum(w.price)}</td>
              </tr>
            ))}
            <tr className="font-bold bg-gray-50">
              <td colSpan={2} className="border border-black px-1 py-1 text-right">Итого работ:</td>
              <td className="border border-black px-1 py-1 text-center">{totalQtyWorks}</td>
              <td className="border border-black px-1 py-1 text-center">{totalNormHours ? fmtNum(totalNormHours) : ''}</td>
              <td className="border border-black px-1 py-1"></td>
              <td className="border border-black px-1 py-1 text-right"></td>
              <td className="border border-black px-1 py-1 text-right">{worksDiscountTotal ? fmtNum(worksDiscountTotal) : ''}</td>
              <td className="border border-black px-1 py-1 text-right">{fmtNum(worksTotal)}</td>
            </tr>
          </tbody>
        </table>
        <div className="mb-4 text-[10px] italic">{numberToWordsRu(worksTotal)}</div>

        {/* === РАСХОДНАЯ НАКЛАДНАЯ (ЗАПЧАСТИ) === */}
        {workOrder.parts.length > 0 && (
          <>
            <div className="font-bold mb-1">Расходная накладная к заказ-наряду № {workOrder.number} от {workOrder.date}</div>
            <table className="w-full border-collapse border border-black mb-1">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black px-1 py-1 text-center w-8">№</th>
                  <th className="border border-black px-1 py-1 text-left">Наименование</th>
                  <th className="border border-black px-1 py-1 text-center w-14">Кол-во</th>
                  <th className="border border-black px-1 py-1 text-center w-14">Ед.изм.</th>
                  <th className="border border-black px-1 py-1 text-right w-20">Цена</th>
                  <th className="border border-black px-1 py-1 text-right w-16">Скидка</th>
                  <th className="border border-black px-1 py-1 text-right w-24">Всего</th>
                </tr>
              </thead>
              <tbody>
                {workOrder.parts.map((p, i) => (
                  <tr key={p.id || i}>
                    <td className="border border-black px-1 py-0.5 text-center">{i + 1}</td>
                    <td className="border border-black px-1 py-0.5">{p.name}</td>
                    <td className="border border-black px-1 py-0.5 text-center">{p.qty}</td>
                    <td className="border border-black px-1 py-0.5 text-center">шт</td>
                    <td className="border border-black px-1 py-0.5 text-right">{fmtNum(p.price)}</td>
                    <td className="border border-black px-1 py-0.5 text-right">{partsDiscountTotal ? '' : ''}</td>
                    <td className="border border-black px-1 py-0.5 text-right font-medium">{fmtNum(p.price * p.qty)}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-gray-50">
                  <td colSpan={2} className="border border-black px-1 py-1 text-right">Итого материалов:</td>
                  <td className="border border-black px-1 py-1 text-center">{totalQtyParts}</td>
                  <td className="border border-black px-1 py-1"></td>
                  <td className="border border-black px-1 py-1"></td>
                  <td className="border border-black px-1 py-1"></td>
                  <td className="border border-black px-1 py-1 text-right">{fmtNum(partsTotal)}</td>
                </tr>
              </tbody>
            </table>
            <div className="mb-4 text-[10px] italic">{numberToWordsRu(partsTotal)}</div>
          </>
        )}

        {/* ОБЩИЙ ИТОГ */}
        <div className="border-t-2 border-black pt-2 mb-6">
          <div className="flex justify-between items-center">
            <div className="text-[13px] font-bold">ИТОГО К ОПЛАТЕ:</div>
            <div className="text-[15px] font-bold">{fmtCur(total)}</div>
          </div>
          <div className="text-[10px] italic mt-1">{numberToWordsRu(total)}</div>
        </div>

        {/* ПОДПИСИ */}
        <div className="mt-10 grid grid-cols-3 gap-8 text-[10px]">
          <div>
            <div className="font-bold mb-6">Мастер-приёмщик:</div>
            <div className="border-b border-black mb-1 h-6"></div>
            <div className="text-center text-gray-500 text-[9px]">(подпись / ФИО)</div>
          </div>
          <div>
            <div className="font-bold mb-6">Владелец (заказчик):</div>
            <div className="border-b border-black mb-1 h-6"></div>
            <div className="text-center text-gray-500 text-[9px]">(подпись / ФИО)</div>
          </div>
          <div>
            <div className="font-bold mb-6">Плательщик:</div>
            <div className="border-b border-black mb-1 h-6"></div>
            <div className="text-center text-gray-500 text-[9px]">(подпись / ФИО)</div>
          </div>
        </div>

        <div className="mt-8 text-center text-[9px] text-gray-400">
          {COMPANY_INFO.name} / ИНН {COMPANY_INFO.inn} / {COMPANY_INFO.address}
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { padding: 0 !important; margin: 0 !important; max-width: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 10mm; size: A4; }
        }
      `}</style>
    </>
  );
};

export default WorkOrderPrint;