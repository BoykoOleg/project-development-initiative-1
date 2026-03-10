import { useState, useEffect } from 'react';

const ACCESS_KEY_STORAGE = 'synapse_access_key';
const VALIDATE_URL = 'https://functions.poehali.dev/cc94a441-3b9a-471c-94ce-7ac22db0a8f9';

export function useAccess() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(ACCESS_KEY_STORAGE);
    if (!stored) {
      setHasAccess(false);
      setIsLoading(false);
      return;
    }
    validateKey(stored).then((valid) => {
      setHasAccess(valid);
      if (!valid) localStorage.removeItem(ACCESS_KEY_STORAGE);
      setIsLoading(false);
    });
  }, []);

  async function validateKey(key: string): Promise<boolean> {
    try {
      const res = await fetch(VALIDATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      return data?.valid === true;
    } catch {
      return false;
    }
  }

  async function activate(key: string): Promise<{ success: boolean; error?: string }> {
    const valid = await validateKey(key.trim().toUpperCase());
    if (valid) {
      localStorage.setItem(ACCESS_KEY_STORAGE, key.trim().toUpperCase());
      setHasAccess(true);
      return { success: true };
    }
    return { success: false, error: 'Ключ не найден или уже использован' };
  }

  function logout() {
    localStorage.removeItem(ACCESS_KEY_STORAGE);
    setHasAccess(false);
  }

  return { hasAccess, isLoading, activate, logout };
}
