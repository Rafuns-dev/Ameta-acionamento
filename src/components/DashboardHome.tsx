import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Copy,
  HardHat,
  Key,
  Mail,
  MapPin,
  Navigation,
  Radio,
  UserCheck,
  UserX,
} from 'lucide-react';
import {
  Acionamento,
  AcionamentoStatus,
  AuthUser,
  NavSection,
} from '../types';
import { formatDateTime, toDate } from '../utils/dateUtils';

interface DashboardHomeProps {
  currentUser: AuthUser;
  acionamentos: Acionamento[];
  onNavigate: (section: NavSection) => void;
  onOpenDeslocamentoModal?: (site?: Acionamento) => void;
  onUpdateAcionamentoStatus: (
    id: string,
    status: AcionamentoStatus
  ) => void;
  onToast?: (msg: string) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  currentUser,
  acionamentos,
  onNavigate,
  onOpenDeslocamentoModal,
  onUpdateAcionamentoStatus,
  onToast,
}) => {
  const user = currentUser;
  const userEmail = (currentUser?.email || '').toLowerCase();
  const isCoord = userEmail.includes('coord') || userEmail.includes('admin') || userEmail.includes('gerente') || userEmail.includes('gestao') || userEmail.includes('dono') || userEmail.includes('operacao') || userEmail.includes('telecom') || userEmail.includes('ameta');

  // Operational real counters calculated directly from user's acionamentos
  const aguardandoCount = acionamentos.filter(
    (a) => a.status === 'Aguardando aceite'
  ).length;

  const emAndamentoCount = acionamentos.filter((a) =>
    ['Aceito', 'Em deslocamento', 'No local', 'Em atendimento', 'Pausado'].includes(a.status)
  ).length;

  const concluidosCount = acionamentos.filter(
    (a) => a.status === 'Concluído'
  ).length;

  // Active displacement item if any
  const siteEmDeslocamento = acionamentos.find(
    (a) => a.status === 'Em deslocamento'
  );

  // Requirement 4: Destaque o acionamento mais antigo aguardando aceite
  const aguardandoItems = acionamentos.filter(
    (a) => a.status === 'Aguardando aceite'
  );
  aguardandoItems.sort((a, b) => {
    const timeA = toDate(a.demandadoEm || a.atualizadoEm)?.getTime() || 0;
    const timeB = toDate(b.demandadoEm || b.atualizadoEm)?.getTime() || 0;
    return timeA - timeB; // Ascending: oldest first
  });

  const oldestPendingItem = aguardandoItems[0] || null;

  // Active / in-progress site if no pending item
  const activeSite =
    oldestPendingItem ||
    acionamentos.find((a) => a.status === 'Em atendimento') ||
    acionamentos.find((a) => a.status === 'Em deslocamento') ||
    acionamentos.find((a) => a.status === 'No local') ||
    acionamentos.find((a) => a.status === 'Aceito') ||
    acionamentos[0] ||
    null;

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    onToast?.(`${label} copiado!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="grid grid-cols-1 items-start gap-4 border-b border-border pb-5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="break-words text-xl font-semibold text-foreground sm:text-2xl">
              Olá, {user.shortName}
            </h1>
            {user.roleBadge && (
              <span className="inline-flex items-center rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                {user.roleBadge}
              </span>
            )}
            <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              Vistorias em Campo
            </span>
          </div>
          <p className="mt-1 max-w-2xl break-words text-sm text-muted-foreground">
            Painel de Vistorias e Operações de Campo Ameta Telecom.
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">
          <button
            type="button"
            onClick={() => onNavigate(NavSection.ACIONAMENTOS)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-sidebar hover:bg-accent px-3 text-xs font-medium text-foreground transition-colors cursor-pointer"
          >
            <Radio className="size-3.5 text-primary" />
            <span>Ver todos os acionamentos ({acionamentos.length})</span>
          </button>
        </div>
      </header>

      {/* Main Operational 3-Card Real Numbers Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Resumo dos seus acionamentos reais
          </h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            Hoje · {new Date().toLocaleDateString('pt-BR')}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {/* Card 1: Aguardando Aceite */}
          <button
            type="button"
            onClick={() => onNavigate(NavSection.ACIONAMENTOS)}
            className={`rounded-md border p-4 text-left transition-all cursor-pointer group ${
              aguardandoCount > 0
                ? 'border-amber-500/80 bg-amber-500/10 hover:border-amber-500'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Aguardando aceite</span>
              <Clock className="size-4 text-amber-400 animate-spin" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-amber-400 tabular-nums">
                {aguardandoCount}
              </span>
              <span className="text-xs text-amber-400 font-medium">
                {aguardandoCount > 0 ? 'Demanda(s) pendente(s)' : 'Sem pendências'}
              </span>
            </div>
          </button>

          {/* Card 2: Em andamento */}
          <button
            type="button"
            onClick={() => onNavigate(NavSection.AGENDA)}
            className="rounded-md border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Em andamento</span>
              <Navigation className="size-4 text-primary" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-primary tabular-nums">
                {emAndamentoCount}
              </span>
              <span className="text-xs text-primary font-medium">
                Aceitos e em curso
              </span>
            </div>
          </button>

          {/* Card 3: Concluídos */}
          <button
            type="button"
            onClick={() => onNavigate(NavSection.ACIONAMENTOS)}
            className="rounded-md border border-border bg-card p-4 text-left transition-colors hover:border-emerald-500/50 cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Concluídos</span>
              <CheckCircle2 className="size-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-emerald-400 tabular-nums">
                {concluidosCount}
              </span>
              <span className="text-xs text-emerald-400 font-medium">
                Vistorias finalizadas
              </span>
            </div>
          </button>
        </div>

        {/* Live Displacement Banner if any site is currently in transit */}
        {siteEmDeslocamento && (
          <div className="mt-3 rounded-md border border-primary/40 bg-primary/10 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-start md:items-center gap-3 min-w-0">
              <div className="size-9 rounded-md bg-primary/20 flex items-center justify-center text-primary shrink-0">
                <Navigation className="size-4 animate-bounce" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">
                    Em Deslocamento Agora:
                  </span>
                  <span className="font-mono font-bold text-xs text-foreground bg-background px-1.5 py-0.5 rounded border border-border">
                    {siteEmDeslocamento.siteId}
                  </span>
                  <span className="text-xs text-foreground font-semibold truncate">
                    {siteEmDeslocamento.siteNome || siteEmDeslocamento.siteName}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  Destino: {siteEmDeslocamento.endereco || siteEmDeslocamento.address}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {onOpenDeslocamentoModal && (
                <button
                  type="button"
                  onClick={() => onOpenDeslocamentoModal(siteEmDeslocamento)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 text-xs font-semibold hover:bg-primary/90 cursor-pointer shadow-xs transition-colors"
                >
                  <Navigation className="size-3.5" />
                  <span>Controle de Rota</span>
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  onUpdateAcionamentoStatus(siteEmDeslocamento.id, 'No local')
                }
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white px-3 text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              >
                <CheckCircle2 className="size-3.5" />
                <span>Confirmar Chegada (No local)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Destaque do Acionamento Mais Antigo Aguardando Aceite (ou acionamento ativo) */}
      <section className="rounded-md border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Radio className="size-4 text-amber-400 animate-pulse" />
            <h2 className="text-sm font-semibold text-foreground">
              {oldestPendingItem
                ? 'Destaque: Vistoria Mais Antiga Aguardando Aceite'
                : 'Destaque de Acionamento Ativo'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate(NavSection.ACIONAMENTOS)}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
          >
            <span>Ver todos os acionamentos ({acionamentos.length})</span>
            <ArrowRight className="size-3" />
          </button>
        </div>

        {activeSite ? (
          <div className="mt-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-xs text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                    {activeSite.protocolo || activeSite.protocol || activeSite.id}
                  </span>
                  <span className="font-semibold text-base text-foreground truncate">
                    {activeSite.siteNome || activeSite.siteName || `Site ${activeSite.siteId}`}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    Site: {activeSite.siteId}
                  </span>
                  {activeSite.vendor && (
                    <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-foreground/10 text-foreground">
                      {activeSite.vendor}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-semibold ${
                      activeSite.status === 'Em atendimento'
                        ? 'bg-emerald-500/20 text-emerald-400 animate-pulse'
                        : activeSite.status === 'Em deslocamento'
                        ? 'bg-primary/20 text-primary animate-pulse'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {activeSite.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {(activeSite.endereco || activeSite.address) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5 text-primary shrink-0" />
                      <span>{activeSite.endereco || activeSite.address} {activeSite.cidade ? `— ${activeSite.cidade}/${activeSite.uf}` : ''}</span>
                    </span>
                  )}
                  {activeSite.coordinates && (
                    <button
                      type="button"
                      onClick={() => handleCopy(activeSite.coordinates || '', 'Coordenadas GPS')}
                      className="flex items-center gap-1 hover:text-foreground cursor-pointer text-primary"
                      title="Copiar Coordenadas GPS"
                    >
                      <Compass className="size-3" />
                      <span>GPS: {activeSite.coordinates}</span>
                      <Copy className="size-3" />
                    </button>
                  )}
                </div>

                {/* Contact Requirement 2 */}
                <div className="text-xs text-muted-foreground pt-1">
                  Demandado por: <strong className="text-foreground">{activeSite.demandadoPorNome || 'Sistema Telecom'}</strong>
                  {activeSite.demandadoPorEmail && (
                    <a
                      href={`mailto:${activeSite.demandadoPorEmail}`}
                      className="ml-2 text-primary hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      <Mail className="size-3" />
                      <span>Enviar e-mail</span>
                    </a>
                  )}
                  {activeSite.demandadoEm && (
                    <span className="ml-3 text-muted-foreground">
                      ({formatDateTime(activeSite.demandadoEm)})
                    </span>
                  )}
                </div>

                {activeSite.accessKeyProtocol && (
                  <div className="flex items-center gap-2 text-xs rounded-md bg-muted/40 px-2.5 py-1.5 border border-border/80 w-fit">
                    <Key className="size-3.5 text-amber-400 shrink-0" />
                    <span className="font-medium text-foreground">
                      Acesso / Chave: {activeSite.accessKeyProtocol}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {(activeSite.observacao || activeSite.problemDescription) && (
              <p className="text-xs text-foreground/90 bg-background p-3 rounded-md border border-border leading-relaxed">
                <strong>Observação / Escopo:</strong> {activeSite.observacao || activeSite.problemDescription}
              </p>
            )}

            {/* Workflow Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {activeSite.status === 'Aguardando aceite' && !isCoord && (
                <>
                  <button
                    type="button"
                    onClick={() => onUpdateAcionamentoStatus(activeSite.id, 'Aceito')}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                  >
                    <UserCheck className="size-3.5" />
                    <span>Aceitar Vistoria</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateAcionamentoStatus(activeSite.id, 'Recusado')}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md bg-destructive/15 hover:bg-destructive/25 text-destructive border border-destructive/30 px-3.5 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <UserX className="size-3.5" />
                    <span>Recusar</span>
                  </button>
                </>
              )}

              {isCoord && (
                <div className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-1.5 flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-300">⚙️ Coordenador — Alterar Status:</span>
                  <select
                    value={activeSite.status}
                    onChange={(e) => onUpdateAcionamentoStatus(activeSite.id, e.target.value as AcionamentoStatus)}
                    className="rounded border border-input bg-background px-2 py-1 text-xs font-bold text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Aguardando aceite">Aguardando aceite</option>
                    <option value="Aceito">Aceito</option>
                    <option value="Recusado">Recusado</option>
                    <option value="Em deslocamento">Em deslocamento</option>
                    <option value="No local">No local</option>
                    <option value="Em atendimento">Em atendimento</option>
                    <option value="Pausado">Pausado</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              )}

              {activeSite.status === 'Aceito' && (
                <button
                  type="button"
                  onClick={() => onUpdateAcionamentoStatus(activeSite.id, 'Em deslocamento')}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground px-3.5 text-xs font-medium cursor-pointer"
                >
                  <Navigation className="size-3.5" />
                  <span>Iniciar Deslocamento</span>
                </button>
              )}

              {activeSite.status === 'Em deslocamento' && (
                <button
                  type="button"
                  onClick={() => onUpdateAcionamentoStatus(activeSite.id, 'No local')}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 text-xs font-semibold cursor-pointer"
                >
                  <MapPin className="size-3.5" />
                  <span>Confirmar Chegada (No local)</span>
                </button>
              )}

              {activeSite.status === 'No local' && (
                <button
                  type="button"
                  onClick={() => onUpdateAcionamentoStatus(activeSite.id, 'Em atendimento')}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 text-xs font-semibold cursor-pointer"
                >
                  <HardHat className="size-3.5" />
                  <span>Iniciar Atendimento</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onNavigate(NavSection.ACIONAMENTOS)}
                className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground hover:bg-accent cursor-pointer"
              >
                Ver todos na lista
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhuma vistoria demandada no momento.
          </p>
        )}
      </section>
    </div>
  );
};
