import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  HelpCircle,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { AuthUser } from '../types';
import { AmetaLogo } from './AmetaLogo';

interface LoginViewProps {
  onLogin: (user: AuthUser, rememberMe: boolean) => void;
  theme: 'escuro' | 'claro';
  onToggleTheme: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  theme,
  onToggleTheme,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail) {
      setError('Informe seu e-mail corporativo Ameta.');
      return;
    }

    if (!cleanEmail.endsWith('@ametaservicos.com.br')) {
      setError('Apenas e-mails corporativos @ametaservicos.com.br são permitidos.');
      return;
    }

    if (!cleanPass) {
      setError('Informe sua senha de acesso.');
      return;
    }

    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      // Auth state listener in App.tsx handles login transition
    } catch (err: any) {
      console.error('Firebase Auth sign in error:', err);
      setIsLoading(false);
      const code = err?.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setError('E-mail ou senha incorretos. Verifique se a conta está cadastrada no Firebase Auth.');
      } else if (code === 'auth/invalid-email') {
        setError('Formato de e-mail inválido.');
      } else if (code === 'auth/too-many-requests') {
        setError('Acesso temporariamente bloqueado por excesso de tentativas. Tente novamente em instantes.');
      } else {
        setError('Erro ao autenticar no Firebase. Verifique suas credenciais.');
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Top Bar with Brand & Theme Switcher */}
      <header className="flex h-16 w-full items-center justify-between border-b border-border/80 px-4 sm:px-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <AmetaLogo className="h-9 w-auto" />
          <div className="hidden h-5 w-px bg-border sm:block" />
          <span className="hidden text-xs font-medium text-muted-foreground sm:inline-block">
            Portal de Vistorias e Operações de Campo
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'escuro' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            title={theme === 'escuro' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
          >
            {theme === 'escuro' ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4" />}
          </button>
        </div>
      </header>

      {/* Main Login Container */}
      <main className="flex flex-1 items-center justify-center p-4 py-8 sm:p-6 lg:p-10">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <ShieldCheck className="size-4" />
            <span>Autenticação Segura · Ameta Telecom</span>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Acesse sua conta
          </h1>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Digite suas credenciais corporativas do Firebase Auth para gerenciar suas vistorias.
          </p>

          {/* Error Alert */}
          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive animate-in fade-in duration-200"
            >
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="ameta-email"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                E-mail Corporativo (@ametaservicos.com.br)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <Mail className="size-4" />
                </div>
                <input
                  id="ameta-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="nome.sobrenome@ametaservicos.com.br"
                  className="block w-full rounded-lg border border-input bg-background/60 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="ameta-password"
                  className="block text-xs font-semibold text-foreground"
                >
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                >
                  Esqueci a senha
                </button>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <Lock className="size-4" />
                </div>
                <input
                  id="ameta-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••"
                  className="block w-full rounded-lg border border-input bg-background/60 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-4 rounded border-input bg-background text-primary accent-primary focus:ring-primary/30"
                />
                <span className="text-xs text-muted-foreground">Lembrar meu acesso</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 px-4 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-95 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="size-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              Firebase Auth Conectado
            </span>
            <span>Central NOC: 0800 770 2026</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 py-4 px-4 sm:px-8 text-center text-xs text-muted-foreground">
        <p>
          Ameta Telecomunicações & Infraestrutura S.A. · Sistema de Gestão de Vistorias e Torres · Conexão Segura
        </p>
      </footer>

      {/* Password Recovery Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-primary">
                <HelpCircle className="size-5" />
                <h3 className="text-base font-bold text-foreground">
                  Suporte de Acesso Corporativo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              As contas corporativas são cadastradas no Firebase Auth pela administração do sistema. Caso tenha esquecido sua senha, contate a coordenação.
            </p>

            <div className="mt-4 rounded-lg border border-border bg-background p-3.5 space-y-2 text-xs">
              <p className="font-semibold text-foreground">
                Contatos de suporte:
              </p>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Central NOC (Plantão 24h):</span>
                <span className="font-mono font-medium text-foreground">0800 770 2026</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>E-mail da Coordenação:</span>
                <span className="font-mono font-medium text-foreground">noc.despacho@ametaservicos.com.br</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
