import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useAccess } from '@/hooks/use-access';

const steps = [
  {
    number: '1',
    icon: 'Mail',
    title: 'Проверь почту',
    description: 'Письмо с ключом уже летит на твой email. Если не видишь — проверь папку «Спам».',
  },
  {
    number: '2',
    icon: 'Key',
    title: 'Скопируй ключ',
    description: 'В письме будет код из 16 символов. Скопируй его и вставь в поле ниже.',
  },
  {
    number: '3',
    icon: 'Unlock',
    title: 'Активируй доступ',
    description: 'Вставь ключ — и платформа откроется навсегда. Без подписок и повторных оплат.',
  },
];

export default function ThankYou() {
  const navigate = useNavigate();
  const { activate } = useAccess();
  const [key, setKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState('');
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

  if (activated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon name="CheckCircle" size={40} className="text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3 font-orbitron">Доступ открыт!</h1>
          <p className="text-zinc-400 mb-8">Добро пожаловать в TradeBase. Всё готово к работе.</p>
          <div className="flex flex-col gap-3">
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={() => navigate('/trading-basics')}>
              <Icon name="BookOpen" size={16} className="mr-2" />
              Перейти к Практике
            </Button>
            <Button variant="outline" className="w-full border-zinc-700 text-zinc-300" onClick={() => navigate('/bot-builder')}>
              <Icon name="Bot" size={16} className="mr-2" />
              Конструктор ботов
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-16">

        {/* Заголовок */}
        <div className="text-center mb-14">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <Icon name="CheckCircle" size={32} className="text-green-400" />
          </div>
          <h1 className="text-4xl font-bold mb-3 font-orbitron">Оплата прошла!</h1>
          <p className="text-zinc-400 text-lg">Осталось 3 простых шага чтобы получить доступ</p>
        </div>

        {/* Шаги */}
        <div className="space-y-4 mb-12">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex-shrink-0 w-10 h-10 bg-red-600/10 border border-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-red-400 font-bold text-sm font-orbitron">{step.number}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Icon name={step.icon} size={16} className="text-red-400" />
                  <h3 className="font-semibold text-white">{step.title}</h3>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Форма ввода ключа */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
          <h2 className="font-bold text-white text-lg mb-1">Введи ключ из письма</h2>
          <p className="text-zinc-500 text-sm mb-5">Письмо приходит в течение 1-2 минут после оплаты</p>
          <form onSubmit={handleActivate} className="flex gap-3">
            <Input
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              className="font-mono tracking-widest bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 flex-1"
            />
            <Button
              type="submit"
              disabled={activating || !key.trim()}
              className="bg-red-600 hover:bg-red-700 text-white px-6"
            >
              {activating
                ? <Icon name="Loader2" size={16} className="animate-spin" />
                : 'Войти'
              }
            </Button>
          </form>
          {error && (
            <p className="text-red-400 text-sm mt-3 flex items-center gap-2">
              <Icon name="AlertCircle" size={14} />
              {error}
            </p>
          )}
          <p className="text-zinc-600 text-xs mt-4">
            Не пришло письмо? Напиши нам — поможем разобраться.
          </p>
        </div>

        {/* Назад */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="text-zinc-600 hover:text-zinc-400 text-sm flex items-center gap-1 mx-auto transition-colors"
          >
            <Icon name="ArrowLeft" size={14} />
            На главную
          </button>
        </div>
      </div>
    </div>
  );
}