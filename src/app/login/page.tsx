'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, User, Eye, EyeOff, Loader2, Sparkles, Check, ArrowRight } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Check if already authenticated on mount
  useEffect(() => {
    async function checkExistingSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data?.authenticated) {
            router.replace(redirectPath);
          }
        }
      } catch {
        // Not logged in, stay on page
      }
    }
    checkExistingSession();
  }, [redirectPath, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor completa todos los campos requeridos.');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = mode === 'login'
        ? { email: email.trim(), password }
        : { email: email.trim(), password, name: name.trim() };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Ocurrió un error. Por favor intenta nuevamente.');
        setIsLoading(false);
        return;
      }

      setSuccessMsg(
        mode === 'login'
          ? `¡Bienvenido de nuevo, ${data.user?.name || data.user?.email}!`
          : '¡Cuenta creada con éxito! Redirigiendo...'
      );

      setTimeout(() => {
        router.push(redirectPath);
        router.refresh();
      }, 600);
    } catch (err) {
      console.error('Auth submit error:', err);
      setErrorMsg('No se pudo conectar con el servidor. Revisa tu conexión.');
      setIsLoading(false);
    }
  };

  const handleFillDefaultAdmin = () => {
    setMode('login');
    setEmail('gaos.storeco@gmail.com');
    setPassword('G40sC@ndles');
    setErrorMsg(null);
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-stone-200/80 p-8 sm:p-10 backdrop-blur-md">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-stone-900 mx-auto flex items-center justify-center p-2 shadow-sm mb-3">
          <img
            src="/gaos-candles.svg"
            alt="GAOS CANDLES"
            className="w-full h-full object-contain invert brightness-0 invert"
          />
        </div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-wide">
          GAOS CANDLES
        </h1>
        <p className="text-xs text-stone-500 uppercase tracking-widest mt-1">
          Estudio de Catálogos & Edición
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex bg-stone-100 p-1 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setErrorMsg(null);
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            mode === 'login'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Iniciar Sesión
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setErrorMsg(null);
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            mode === 'register'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Crear Cuenta
        </button>
      </div>

      {/* Quick access banner for GAOS store admin */}
      <div className="mb-6 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <span className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider text-amber-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Cuenta Principal GAOS
          </span>
          <p className="text-[11px] text-amber-800/90 leading-tight">
            gaos.storeco@gmail.com
          </p>
        </div>
        <button
          type="button"
          onClick={handleFillDefaultAdmin}
          className="px-2.5 py-1.5 text-[11px] font-semibold bg-amber-200/70 hover:bg-amber-200 text-amber-950 rounded-lg transition-colors shrink-0"
        >
          Autocompletar
        </button>
      </div>

      {/* Alert Error Message */}
      {errorMsg && (
        <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed animate-in fade-in">
          {errorMsg}
        </div>
      )}

      {/* Alert Success Message */}
      {successMsg && (
        <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Tu Nombre o Marca
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del creador o taller"
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none transition-all"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Correo Electrónico
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-10 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Verificando...</span>
            </>
          ) : (
            <>
              <span>{mode === 'login' ? 'Entrar al Estudio' : 'Crear Mi Cuenta'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Customer Notice */}
      <div className="mt-8 pt-6 border-t border-stone-100 text-center">
        <p className="text-[11px] text-stone-400 leading-relaxed">
          ¿Eres un cliente buscando ver un catálogo?
          <span className="block text-stone-500 font-medium mt-0.5">
            Los enlaces públicos compartidos (<code className="font-mono text-[10px] bg-stone-100 px-1 py-0.5 rounded">/c/[slug]</code>) son de libre acceso y no requieren inicio de sesión.
          </span>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white rounded-2xl p-10 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-stone-500 mx-auto mb-2" />
            <p className="text-xs text-stone-500">Cargando acceso...</p>
          </div>
        }
      >
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
