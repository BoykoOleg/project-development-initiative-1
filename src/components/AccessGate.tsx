import { useState } from 'react';
import { useAccess } from '@/hooks/use-access';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';

interface AccessGateProps {
  children: React.ReactNode;
}

export default function AccessGate({ children }: AccessGateProps) {
  const { hasAccess, isLoading, activate } = useAccess();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [activating, setActivating] = useState(false);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Icon name="Loader2" size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (hasAccess) return <>{children}</>;

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;
    setActivating(true);
    setError('');
    const result = await activate(key);
    if (!result.success) {
      setError(result.error || 'Неверный ключ');
    }
    setActivating(false);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon name="Lock" size={28} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Закрытый раздел</h1>
            <p className="text-muted-foreground text-sm">
              Введите ключ доступа, чтобы продолжить
            </p>
          </div>

          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <Input
                placeholder="Ключ доступа (например: AB12CD34EF56GH78)"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                className="text-center font-mono tracking-widest"
                autoFocus
              />
              {error && (
                <p className="text-destructive text-sm mt-2 text-center">{error}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={activating || !key.trim()}>
              {activating ? (
                <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Проверяем...</>
              ) : (
                'Активировать доступ'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-muted-foreground text-sm mb-3">Ещё нет ключа?</p>
            <Button variant="outline" className="w-full" onClick={() => navigate('/payment')}>
              <Icon name="CreditCard" size={16} className="mr-2" />
              Получить доступ — 2 000 ₽
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
