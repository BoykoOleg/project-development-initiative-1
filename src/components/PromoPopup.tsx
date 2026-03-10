import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAccess } from '@/hooks/use-access';
import Icon from '@/components/ui/icon';

const STORAGE_KEY = 'tb_promo_seen';
const DELAY_MS = 5000;
const SKIP_PATHS = ['/payment', '/admin'];

export default function PromoPopup() {
  const [visible, setVisible] = useState(false);
  const { hasAccess, isLoading } = useAccess();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (hasAccess) return;
    if (SKIP_PATHS.includes(location.pathname)) return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const timer = setTimeout(() => {
      setVisible(true);
    }, DELAY_MS);

    return () => clearTimeout(timer);
  }, [isLoading, hasAccess, location.pathname]);

  function close() {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  function handlePay() {
    close();
    navigate('/payment');
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-4" onClick={close}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-zinc-900 border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Верхняя полоса */}
        <div className="h-1 w-full bg-gradient-to-r from-red-600 via-red-400 to-red-600" />

        <div className="p-6">
          <button
            onClick={close}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
          >
            <Icon name="X" size={18} />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
              <Icon name="TrendingUp" size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-xs text-red-400 font-medium uppercase tracking-wider">Закрытый доступ</p>
              <h2 className="text-white font-bold text-lg leading-tight">Начни торговать правильно</h2>
            </div>
          </div>

          <ul className="space-y-2 mb-6">
            {[
              'Практический курс по трейдингу',
              'Конструктор торговых ботов с кодом',
              'Разбор реальных сделок',
            ].map(item => (
              <li key={item} className="flex items-center gap-2 text-zinc-300 text-sm">
                <Icon name="Check" size={14} className="text-red-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-3xl font-bold text-white">2 000 ₽</span>
              <span className="text-zinc-500 text-sm ml-2">разово</span>
            </div>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full">доступ навсегда</span>
          </div>

          <Button
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-5 text-base border-0"
            onClick={handlePay}
          >
            Получить доступ
          </Button>

          <button
            onClick={close}
            className="w-full text-center text-zinc-500 hover:text-zinc-400 text-sm mt-3 transition-colors"
          >
            Пока не нужно
          </button>
        </div>
      </div>
    </div>
  );
}
