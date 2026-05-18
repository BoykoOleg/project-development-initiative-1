import { useState, FormEvent, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

const BIOMETRIC_KEY = "biometric_enabled";
const BIOMETRIC_EMAIL_KEY = "biometric_email";

function isBiometricAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function"
  );
}

async function checkBiometricAvailable(): Promise<boolean> {
  if (!isBiometricAvailable()) return false;
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [biometricReady, setBiometricReady] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  useEffect(() => {
    const enabled = localStorage.getItem(BIOMETRIC_KEY) === "true";
    const savedEmail = localStorage.getItem(BIOMETRIC_EMAIL_KEY) || "";
    if (enabled && savedEmail) {
      checkBiometricAvailable().then((ok) => {
        setBiometricReady(ok);
      });
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err = await login(email.trim(), password);
    if (err) {
      setError(err);
    } else {
      const biometricOk = await checkBiometricAvailable();
      const alreadyEnabled = localStorage.getItem(BIOMETRIC_KEY) === "true";
      if (biometricOk && !alreadyEnabled) {
        setPendingEmail(email.trim());
        setShowBiometricPrompt(true);
      }
    }
    setLoading(false);
  };

  const enableBiometric = async () => {
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
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60000,
        },
      });

      if (credential) {
        localStorage.setItem(BIOMETRIC_KEY, "true");
        localStorage.setItem(BIOMETRIC_EMAIL_KEY, pendingEmail);
        setShowBiometricPrompt(false);
      }
    } catch {
      setShowBiometricPrompt(false);
    }
  };

  const loginWithBiometric = async () => {
    setBiometricLoading(true);
    setError("");
    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          userVerification: "required",
          timeout: 60000,
        },
      });

      if (assertion) {
        const savedEmail = localStorage.getItem(BIOMETRIC_EMAIL_KEY) || "";
        const savedToken = localStorage.getItem("auth_token");
        if (savedToken && savedEmail) {
          window.location.reload();
        } else {
          setError("Сессия истекла, войдите по паролю");
          localStorage.removeItem(BIOMETRIC_KEY);
          localStorage.removeItem(BIOMETRIC_EMAIL_KEY);
          setBiometricReady(false);
        }
      }
    } catch (err: unknown) {
      const name = (err as { name?: string })?.name;
      if (name !== "NotAllowedError") {
        setError("Биометрия не прошла, войдите по паролю");
      }
    }
    setBiometricLoading(false);
  };

  const savedEmail = localStorage.getItem(BIOMETRIC_EMAIL_KEY) || "";

  if (showBiometricPrompt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-border w-full max-w-sm p-8 text-center space-y-5">
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
            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white" onClick={enableBiometric}>
              Включить
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setShowBiometricPrompt(false)}>
              Пропустить
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-border w-full max-w-sm p-8">
        <div className="mb-8 text-center">
          <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon name="Car" size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-foreground">АвтоСервис CRM</h1>
          <p className="text-sm text-muted-foreground mt-1">Войдите в систему</p>
        </div>

        {biometricReady && (
          <div className="mb-4">
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center gap-2 h-11 border-blue-200 text-blue-600 hover:bg-blue-50"
              onClick={loginWithBiometric}
              disabled={biometricLoading}
            >
              {biometricLoading ? (
                <Icon name="Loader2" size={18} className="animate-spin" />
              ) : (
                <Icon name="Fingerprint" size={18} />
              )}
              {biometricLoading ? "Проверка..." : `Войти как ${savedEmail}`}
            </Button>
            <div className="flex items-center gap-2 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">или по паролю</span>
              <div className="flex-1 h-px bg-border" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus={!biometricReady}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Пароль</label>
            <div className="relative">
              <Input
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <Icon name={showPwd ? "EyeOff" : "Eye"} size={16} />
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <Icon name="AlertCircle" size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Icon name="Loader2" size={16} className="animate-spin" />
                Вход...
              </span>
            ) : (
              "Войти"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
