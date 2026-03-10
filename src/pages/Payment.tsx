import { useState } from 'react';
import { useAccess } from '@/hooks/use-access';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';

const LAVA_SHOP_ID = import.meta.env.VITE_LAVA_SHOP_ID || '';

export default function Payment() {
  const { hasAccess, activate } = useAccess();
  const navigate = useNavigate();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;
    setActivating(true);
    setError('');
    const result = await activate(key);
    if (result.success) {
      setActivated(true);
    } else {
      setError(result.error || 'Неверный ключ');
    }
    setActivating(false);
  }

  function handlePay() {
    window.open('https://app.lava.top/products/2ca1bd64-0350-4566-9a72-3838d0b8810f', '_blank');
  }

  if (activated || hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon name="CheckCircle" size={28} className="text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Доступ открыт!</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Теперь тебе доступны Практика и Конструктор ботов
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/trading-basics')}>
                Перейти к Практике
              </Button>
              <Button variant="outline" onClick={() => navigate('/bot-builder')}>
                Перейти к Конструктору
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 mx-auto mb-6">
            <Icon name="ArrowLeft" size={14} />
            На главную
          </button>
          <h1 className="text-3xl font-bold text-foreground mb-2">Получить доступ</h1>
          <p className="text-muted-foreground">Разовая оплата — навсегда</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
              <Icon name="Zap" size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-lg">Полный доступ</h2>
              <p className="text-muted-foreground text-sm">Практика и Конструктор ботов</p>
            </div>
            <div className="ml-auto text-right">
              <div className="text-2xl font-bold text-foreground">2 000 ₽</div>
              <div className="text-muted-foreground text-xs">разово</div>
            </div>
          </div>

          <ul className="space-y-2 mb-6">
            {[
              'Практический курс по торговле',
              'Конструктор торговых ботов',
              'Генерация Python-кода',
              'Доступ навсегда',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                <Icon name="Check" size={16} className="text-green-500 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          <Button className="w-full text-base py-5" onClick={handlePay}>
            <Icon name="CreditCard" size={18} className="mr-2" />
            Оплатить 2 000 ₽
          </Button>
          <p className="text-muted-foreground text-xs text-center mt-3">
            Карты, СБП · Безопасная оплата через Lava.ru
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-1">Уже оплатил?</h3>
          <p className="text-muted-foreground text-sm mb-4">
            После оплаты ключ придёт на email. Введи его здесь:
          </p>
          <form onSubmit={handleActivate} className="flex gap-2">
            <Input
              placeholder="Ключ доступа"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              className="font-mono tracking-wider"
            />
            <Button type="submit" disabled={activating || !key.trim()} variant="outline">
              {activating ? <Icon name="Loader2" size={16} className="animate-spin" /> : 'Войти'}
            </Button>
          </form>
          {error && <p className="text-destructive text-sm mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}