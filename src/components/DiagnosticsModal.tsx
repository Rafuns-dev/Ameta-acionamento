import React, { useState } from 'react';
import { Activity, Check, Copy, Shield, X } from 'lucide-react';
import { AuthUser } from '../types';

export interface UserDocDiagnosticData {
  exists: boolean;
  error?: string | null;
  name?: string;
  role?: string;
  situacao?: string;
  accessReleased?: boolean;
  tipo?: string;
  plataforma?: string;
  assignedPlatform?: string;
  equipe?: string;
  raw?: Record<string, any>;
}

interface DiagnosticsModalProps {
  open: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  userDocData: UserDocDiagnosticData | null;
  acionamentosCount: number;
  countVistoria?: number;
  countExecutor?: number;
  tipoUsuario?: string;
  acionamentosError: string | null;
  onToast?: (msg: string) => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  open,
  onClose,
  currentUser,
  userDocData,
  acionamentosCount,
  countVistoria = 0,
  countExecutor = 0,
  tipoUsuario,
  acionamentosError,
  onToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const buildDiagnosticText = (): string => {
    const timestamp = new Date().toISOString();
    const email = currentUser?.email || 'N/A';
    const uid = currentUser?.id || 'N/A';
    const isCoord = currentUser?.isCoord ? 'true' : 'false';
    const userTipoResolved = tipoUsuario || currentUser?.tipoUsuario || 'N/A';

    let docStatus = 'Não carregado';
    if (userDocData?.error) {
      docStatus = `ERRO: ${userDocData.error}`;
    } else if (userDocData?.exists) {
      docStatus = 'Encontrado com sucesso';
    } else if (userDocData) {
      docStatus = 'Documento NÃO encontrado no Firestore';
    }

    const fields = [
      `name: ${userDocData?.name ?? 'null'}`,
      `role: ${userDocData?.role ?? 'null'}`,
      `situacao: ${userDocData?.situacao ?? 'null'}`,
      `accessReleased: ${userDocData?.accessReleased !== undefined ? String(userDocData.accessReleased) : 'null'}`,
      `tipo: ${userDocData?.tipo ?? 'null'}`,
      `plataforma: ${userDocData?.plataforma ?? 'null'}`,
      `assignedPlatform: ${userDocData?.assignedPlatform ?? 'null'}`,
      `equipe: ${userDocData?.equipe ?? 'null'}`,
    ].join('\n  ');

    const acionamentosStatus = acionamentosError
      ? `ERRO: ${acionamentosError}`
      : `${acionamentosCount} acionamento(s) recebido(s) (VISTORIA: ${countVistoria} | EXECUTOR: ${countExecutor})`;

    return [
      '=== DIAGNÓSTICO DO USUÁRIO & SISTEMA ===',
      `Data/Hora: ${timestamp}`,
      `E-mail: ${email}`,
      `UID: ${uid}`,
      `Documento usuarios/{uid}: ${docStatus}`,
      `Campos lidos de usuarios:`,
      `  ${fields}`,
      `isCoord: ${isCoord}`,
      `tipoUsuario: ${userTipoResolved}`,
      `Acionamentos no Listener: ${acionamentosStatus}`,
      `  - VISTORIA: ${countVistoria}`,
      `  - EXECUTOR: ${countExecutor}`,
      '========================================',
    ].join('\n');
  };

  const handleCopy = async () => {
    const text = buildDiagnosticText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onToast?.('Diagnóstico copiado para a área de transferência.');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onToast?.('Não foi possível copiar o diagnóstico automaticamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Activity className="size-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              Diagnóstico de Permissões & Cadastro
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground cursor-pointer rounded-md p-1"
            title="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content details (Read-only) */}
        <div className="space-y-3 text-xs">
          {/* Auth info */}
          <div className="rounded-lg border border-border bg-background/60 p-3 space-y-1.5 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-muted-foreground">E-mail:</span>
              <span className="font-semibold text-foreground select-all">
                {currentUser?.email || 'N/A'}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-muted-foreground">UID:</span>
              <span className="font-semibold text-foreground text-[11px] select-all">
                {currentUser?.id || 'N/A'}
              </span>
            </div>
          </div>

          {/* Firestore 'usuarios' doc info */}
          <div className="rounded-lg border border-border bg-background/60 p-3 space-y-2">
            <div className="flex items-center justify-between border-b border-border/70 pb-1.5">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Shield className="size-3.5 text-primary" />
                <span>Documento em usuarios/{currentUser?.id}</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  userDocData?.error
                    ? 'bg-destructive/20 text-destructive border border-destructive/30'
                    : userDocData?.exists
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {userDocData?.error
                  ? 'Erro na leitura'
                  : userDocData?.exists
                  ? 'Encontrado'
                  : 'Não Encontrado'}
              </span>
            </div>

            {userDocData?.error ? (
              <div className="rounded bg-destructive/10 border border-destructive/30 p-2 text-destructive text-[11px]">
                {userDocData.error}
              </div>
            ) : !userDocData?.exists ? (
              <div className="text-muted-foreground text-[11px] leading-relaxed">
                Nenhum documento encontrado com o UID deste usuário na coleção <code className="text-primary font-mono">usuarios</code>.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-mono">
                <div>
                  <span className="text-muted-foreground">name: </span>
                  <span className="text-foreground font-semibold">{userDocData.name || '(vazio)'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">role: </span>
                  <span className="text-foreground font-semibold">{userDocData.role || '(vazio)'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">situacao: </span>
                  <span className="text-foreground font-semibold">{userDocData.situacao || '(vazio)'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">accessReleased: </span>
                  <span className="text-foreground font-semibold">
                    {userDocData.accessReleased !== undefined ? String(userDocData.accessReleased) : '(vazio)'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">tipo: </span>
                  <span className="text-foreground font-semibold">{userDocData.tipo || '(vazio)'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">plataforma: </span>
                  <span className="text-foreground font-semibold">{userDocData.plataforma || '(vazio)'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">assignedPlatform: </span>
                  <span className="text-foreground font-semibold">{userDocData.assignedPlatform || '(vazio)'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">equipe: </span>
                  <span className="text-foreground font-semibold">{userDocData.equipe || '(vazio)'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Coordination status */}
          <div className="rounded-lg border border-border bg-background/60 p-3 flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Perfil de Coordenação (isCoord):</span>
            <span
              className={`px-2.5 py-1 rounded font-bold text-xs ${
                currentUser?.isCoord
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-muted text-muted-foreground border border-border'
              }`}
            >
              {currentUser?.isCoord ? 'true (Coordenação)' : 'false (Campo)'}
            </span>
          </div>

          {/* Tipo do Usuário */}
          <div className="rounded-lg border border-border bg-background/60 p-3 flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Tipo do Usuário (tipoUsuario):</span>
            <span className="px-2.5 py-1 rounded font-bold text-xs bg-primary/15 text-primary border border-primary/30">
              {tipoUsuario || currentUser?.tipoUsuario || 'N/A'}
            </span>
          </div>

          {/* Acionamentos count / error */}
          <div className="rounded-lg border border-border bg-background/60 p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Acionamentos no Listener:</span>
              {acionamentosError ? (
                <span className="text-destructive font-mono text-[11px] text-right truncate max-w-[200px]" title={acionamentosError}>
                  Erro: {acionamentosError}
                </span>
              ) : (
                <span className="font-mono font-bold text-foreground">
                  {acionamentosCount} total recebido(s)
                </span>
              )}
            </div>

            {!acionamentosError && (
              <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-border/60">
                <div className="rounded border border-blue-500/30 bg-blue-500/10 p-2 text-center">
                  <span className="block text-[10px] uppercase font-bold text-blue-400">Vistoria</span>
                  <span className="font-mono font-extrabold text-sm text-blue-300">{countVistoria}</span>
                </div>
                <div className="rounded border border-orange-500/30 bg-orange-500/10 p-2 text-center">
                  <span className="block text-[10px] uppercase font-bold text-orange-400">Executor</span>
                  <span className="font-mono font-extrabold text-sm text-orange-300">{countExecutor}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-sidebar hover:bg-accent px-3 py-2 text-xs font-medium text-foreground cursor-pointer transition-colors"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-xs font-semibold cursor-pointer transition-colors shadow-xs"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar diagnóstico'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
