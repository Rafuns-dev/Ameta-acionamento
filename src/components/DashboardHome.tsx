import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Copy,
  HardHat,
  Key,
  MapPin,
  MessageSquare,
  Navigation,
  Radio,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  Acionamento,
  AgendaItem,
  AuthUser,
  Executor,
  NavSection,
  ReportItem,
  ResponsiblePerson,
} from '../types';
import { USER_PROFILE } from '../data/initialData';

interface DashboardHomeProps {
  currentUser?: AuthUser;
  agenda: AgendaItem[];
  acionamentos: Acionamento[];
  responsibles: ResponsiblePerson[];
  reports: ReportItem[];
  executors: Executor[];
  unreadMessagesCount: number;
  onNavigate: (section: NavSection) => void;
  onOpenAcionamentoDetail: (item: Acionamento) => void;
  onOpenAgendaDetail: (item: AgendaItem) => void;
  onOpenDeslocamentoModal?: (site?: Acionamento) => void;
  onStartChatWith: (responsibleId: string, prefillMessage?: string) => void;
  onUpdateAcionamentoStatus: (
    id: string,
    status: Acionamento['status']
  ) => void;
  onContinueReport: (type: 'RAC' | 'RAT') => void;
  onToast?: (msg: string) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  currentUser,
  agenda,
  acionamentos,
  responsibles,
  reports,
  executors,
  unreadMessagesCount,
  onNavigate,
  onOpenAcionamentoDetail,
  onOpenAgendaDetail,
  onOpenDeslocamentoModal,
  onStartChatWith,
  onUpdateAcionamentoStatus,
  onContinueReport,
  onToast,
}) => {
  const user = currentUser || USER_PROFILE;
  // Operational counters as requested by user:
  // "site em atendimento, sites restantes, em deslocamento, menssagens tecnico"
  const sitesEmAtendimento = acionamentos.filter(
    (a) => a.status === 'Em atendimento'
  ).length;

  const sitesRestantes = acionamentos.filter(
    (a) => a.status === 'Aguardando aceite' || a.status === 'Aceito'
  ).length;

  const emDeslocamento = acionamentos.filter(
    (a) => a.status === 'Em deslocamento'
  ).length;

  const siteEmDeslocamento = acionamentos.find(
    (a) => a.status === 'Em deslocamento'
  );

  const mensagensTecnico = unreadMessagesCount;

  // Active / priority site
  const prioritySite =
    acionamentos.find((a) => a.status === 'Em atendimento') ||
    acionamentos.find((a) => a.status === 'Em deslocamento') ||
    acionamentos.find((a) => a.priority === 'Crítica' || a.priority === 'Alta') ||
    acionamentos[0];

  const racDraftsCount = reports.filter(
    (r) => r.type === 'RAC' && r.status === 'Rascunho'
  ).length;
  const ratDraftsCount = reports.filter(
    (r) => r.type === 'RAT' && r.status === 'Rascunho'
  ).length;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    onToast?.(`${label} copiado para a área de transferência!`);
  };

  return (
    <div className="space-y-6">
      {/* Personalized Greeting Header */}
      <header className="grid grid-cols-1 items-start gap-4 border-b border-border pb-5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="break-words text-xl font-semibold text-foreground sm:text-2xl">
              Olá, {user.shortName}
            </h1>
            <span className="inline-flex items-center rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
              {user.roleBadge}
            </span>
            <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              Vistorias & Rotas
            </span>
          </div>
          <p className="mt-1 max-w-2xl break-words text-sm text-muted-foreground">
            Painel do {user.roleLabel} em {user.companyFull} · {user.base}.
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">
          <button
            type="button"
            onClick={() => onNavigate(NavSection.ACIONAMENTOS)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-sidebar hover:bg-accent px-3 text-xs font-medium text-foreground transition-colors cursor-pointer"
          >
            <Radio className="size-3.5 text-primary" />
            <span>Sites de Telecom ({acionamentos.length})</span>
          </button>
        </div>
      </header>

      {/* Main Operational 4-Card Grid - Exact names requested */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Sua operação do dia
          </h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            Hoje · {new Date().toLocaleDateString('pt-BR')}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Site em atendimento */}
          <button
            type="button"
            onClick={() => onNavigate(NavSection.ACIONAMENTOS)}
            className="rounded-md border border-border bg-background p-3.5 text-left transition-colors hover:border-emerald-500/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer group"
          >
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>Site em atendimento</span>
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-semibold text-foreground tabular-nums group-hover:text-emerald-400 transition-colors">
                {sitesEmAtendimento}
              </span>
              <span className="text-xs text-emerald-400 font-medium">
                Vistoria ativa no local
              </span>
            </div>
          </button>

          {/* Card 2: Sites restantes */}
          <button
            type="button"
            onClick={() => onNavigate(NavSection.ACIONAMENTOS)}
            className="rounded-md border border-border bg-background p-3.5 text-left transition-colors hover:border-amber-500/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer group"
          >
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>Sites restantes</span>
              <span className="size-2 rounded-full bg-amber-400"></span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-semibold text-amber-400 tabular-nums">
                {sitesRestantes}
              </span>
              <span className="text-xs text-amber-400/80">
                Torres na fila hoje
              </span>
            </div>
          </button>

          {/* Card 3: Em deslocamento */}
          <button
            type="button"
            onClick={() => {
              if (onOpenDeslocamentoModal) {
                onOpenDeslocamentoModal(siteEmDeslocamento);
              } else {
                onNavigate(NavSection.ACIONAMENTOS);
              }
            }}
            className="rounded-md border border-border bg-background p-3.5 text-left transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer group"
          >
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>Em deslocamento</span>
              <Navigation className="size-3 text-primary animate-bounce" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-semibold text-foreground tabular-nums group-hover:text-primary transition-colors">
                {emDeslocamento}
              </span>
              <span className="text-xs text-primary font-medium">
                A caminho do site
              </span>
            </div>
          </button>

          {/* Card 4: Mensagens técnico */}
          <button
            type="button"
            onClick={() => onNavigate(NavSection.CHAT_RESPONSAVEIS)}
            className="rounded-md border border-border bg-background p-3.5 text-left transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer group"
          >
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>Mensagens técnico</span>
              <MessageSquare className="size-3 text-primary" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-semibold text-foreground tabular-nums group-hover:text-primary transition-colors">
                {mensagensTecnico}
              </span>
              {mensagensTecnico > 0 ? (
                <span className="text-xs text-primary font-medium animate-pulse">
                  Despacho / NOC
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Sem pendências
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Live Displacement Strip if any site is currently in transit */}
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
                    {siteEmDeslocamento.siteName}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    ({siteEmDeslocamento.operator})
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  Destino: {siteEmDeslocamento.address} · Previsão: {siteEmDeslocamento.displacement?.estimatedArrival || '11:10 (~25 min)'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenDeslocamentoModal?.(siteEmDeslocamento)}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 text-xs font-semibold hover:bg-primary/90 cursor-pointer shadow-xs transition-colors"
              >
                <Navigation className="size-3.5" />
                <span>Abrir Controle de Rota</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onUpdateAcionamentoStatus(siteEmDeslocamento.id, 'No local')
                }
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white px-3 text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              >
                <CheckCircle2 className="size-3.5" />
                <span>Confirmar Chegada (Check-in GPS)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Destaque da Vistoria / Site Ativo */}
      <section className="rounded-md border border-border bg-background p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Radio className="size-4 text-amber-400 animate-pulse" />
            <h2 className="text-sm font-semibold text-foreground">
              Demanda de Vistoria em Site de Telecom (Torre)
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate(NavSection.ACIONAMENTOS)}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
          >
            <span>Ver todos os sites ({acionamentos.length})</span>
            <ArrowRight className="size-3" />
          </button>
        </div>

        {prioritySite ? (
          <div className="mt-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-sm text-primary tabular-nums">
                    {prioritySite.siteId}
                  </span>
                  <span className="font-semibold text-base text-foreground truncate">
                    {prioritySite.siteName}
                  </span>
                  <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold bg-primary/20 text-primary">
                    {prioritySite.towerType} ({prioritySite.towerHeightMeters}m)
                  </span>
                  <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                    {prioritySite.operator}
                  </span>
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${
                      prioritySite.status === 'Em atendimento'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : prioritySite.status === 'Em deslocamento'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {prioritySite.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-primary shrink-0" />
                    <span>{prioritySite.address}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(prioritySite.coordinates || '', 'Coordenadas GPS')}
                    className="flex items-center gap-1 hover:text-foreground cursor-pointer text-primary"
                    title="Copiar Coordenadas GPS"
                  >
                    <Compass className="size-3" />
                    <span>GPS: {prioritySite.coordinates || 'N/A'}</span>
                    <Copy className="size-3" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs rounded-md bg-muted/40 px-2.5 py-1.5 border border-border/80 w-fit">
                  <Key className="size-3.5 text-amber-400 shrink-0" />
                  <span className="font-medium text-foreground">
                    Acesso / Chave: {prioritySite.accessKeyProtocol || 'Acesso liberado NOC'}
                  </span>
                </div>
              </div>

              <div className="rounded-md border border-border/80 bg-muted/40 p-3 sm:text-right shrink-0">
                <p className="text-[11px] text-muted-foreground flex items-center sm:justify-end gap-1">
                  <Clock className="size-3 text-amber-400" />
                  <span>Limite de SLA da Vistoria</span>
                </p>
                <p className="text-xs font-semibold text-amber-400 tabular-nums mt-0.5">
                  {prioritySite.slaLimit || 'SLA Padrao'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Despacho: {prioritySite.dispatcher?.name || 'Central NOC'}
                </p>
              </div>
            </div>

            <p className="text-xs text-foreground/90 bg-muted/20 p-3 rounded-md border border-border leading-relaxed">
              <strong>Escopo da Vistoria:</strong> {prioritySite.problemDescription}
            </p>

            {/* Executores escalados na demanda */}
            <div className="rounded-md border border-border bg-sidebar p-3 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Users className="size-3.5 text-primary" />
                  <span>Vistoriadores Escalados no Site:</span>
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {prioritySite.executors?.length || 1} profissional(is)
                </span>
              </div>
              <div className="grid gap-1 sm:grid-cols-2">
                {(prioritySite.executors || [executors[0]]).map((ex) => (
                  <div key={ex.id} className="flex items-center justify-between text-[11px] bg-background/60 px-2 py-1 rounded border border-border/50">
                    <span className="text-foreground font-medium">{ex.name}</span>
                    <span className="text-muted-foreground">
                      {ex.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Workflow Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {prioritySite.status === 'Aguardando aceite' && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateAcionamentoStatus(prioritySite.id, 'Aceito')
                  }
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-black px-3.5 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <UserCheck className="size-3.5" />
                  <span>Aceitar Vistoria no Site</span>
                </button>
              )}

              {prioritySite.status === 'Aceito' && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateAcionamentoStatus(
                      prioritySite.id,
                      'Em deslocamento'
                    )
                  }
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground px-3.5 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Navigation className="size-3.5" />
                  <span>Iniciar Deslocamento para o Site</span>
                </button>
              )}

              {prioritySite.status === 'Em deslocamento' && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateAcionamentoStatus(
                      prioritySite.id,
                      'No local'
                    )
                  }
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 text-xs font-medium transition-colors cursor-pointer"
                >
                  <MapPin className="size-3.5" />
                  <span>Confirmar Chegada no Site (Check-in GPS)</span>
                </button>
              )}

              {prioritySite.status === 'No local' && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateAcionamentoStatus(
                      prioritySite.id,
                      'Em atendimento'
                    )
                  }
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 text-xs font-medium transition-colors cursor-pointer"
                >
                  <HardHat className="size-3.5" />
                  <span>Iniciar Vistoria na Torre (Subida)</span>
                </button>
              )}

              {prioritySite.status === 'Em atendimento' && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateAcionamentoStatus(
                      prioritySite.id,
                      'Concluído'
                    )
                  }
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 text-xs font-medium transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>Concluir Vistoria & Emitir RAT</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onOpenAcionamentoDetail(prioritySite)}
                className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground hover:bg-accent cursor-pointer"
              >
                Ver checklist da torre e fotos
              </button>

              <button
                type="button"
                onClick={() =>
                  onStartChatWith(
                    prioritySite.dispatcher?.responsibleId || 'resp-fernanda',
                    `Olá, sobre a vistoria na torre ${prioritySite.siteId} (${prioritySite.siteName}): `
                  )
                }
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 px-3 text-xs font-medium cursor-pointer"
              >
                <MessageSquare className="size-3.5" />
                <span>Falar com {prioritySite.dispatcher?.name || 'Despacho'}</span>
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhum site de telecom pendente no momento. Todas as vistorias de hoje foram concluídas.
          </p>
        )}
      </section>

      {/* Grid: Agenda de Vistorias em Torres + Responsáveis / NOC */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Agenda de Vistorias em Torres */}
        <section className="rounded-md border border-border p-4 bg-background">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Agenda de Vistorias em Sites
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate(NavSection.AGENDA)}
              className="text-xs text-primary hover:underline cursor-pointer"
            >
              Ver agenda completa
            </button>
          </div>

          <ul className="mt-3 divide-y divide-border">
            {agenda.slice(0, 3).map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground tabular-nums">
                      {item.time} · {item.siteId || item.code}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                        item.status === 'Concluído'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : item.status === 'Em andamento'
                          ? 'bg-primary/15 text-primary'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {item.title} — {item.client}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenAgendaDetail(item)}
                  className="text-xs text-primary hover:underline cursor-pointer whitespace-nowrap shrink-0"
                >
                  Abrir
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Responsáveis & NOC de Plantão */}
        <section className="rounded-md border border-border p-4 bg-background">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">
                Coordenação, NOC & Engenharia
              </h2>
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate(NavSection.CHAT_RESPONSAVEIS)}
              className="text-xs text-primary hover:underline cursor-pointer"
            >
              Abrir chat interno
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {responsibles.slice(0, 3).map((resp) => (
              <div
                key={resp.id}
                className="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-accent/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative size-8 rounded-full bg-secondary flex items-center justify-center font-semibold text-xs text-foreground shrink-0">
                    {resp.name.charAt(0)}
                    <span
                      className={`absolute bottom-0 right-0 size-2.5 rounded-full border border-background ${
                        resp.status === 'online'
                          ? 'bg-emerald-500'
                          : resp.status === 'ausente'
                          ? 'bg-amber-500'
                          : 'bg-zinc-500'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {resp.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {resp.role}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onStartChatWith(resp.id)}
                  className="inline-flex h-7 items-center gap-1 rounded border border-input bg-background px-2.5 text-xs font-medium text-foreground hover:bg-accent cursor-pointer whitespace-nowrap shrink-0"
                >
                  <MessageSquare className="size-3 text-primary" />
                  <span>Mensagem</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Relatórios de Vistoria de Torres (RAT e RAC) */}
      <section className="rounded-md border border-border p-4 bg-background">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              RAT e RAC — Laudos de Vistoria em Torres
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              RAT (Relatório de Atividade Técnica / Fotográfico) e RAC (Relatório de Atendimento em Campo).
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border border-border bg-sidebar p-3">
            <p className="text-xs text-muted-foreground">RAT em rascunho</p>
            <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
              {ratDraftsCount}
            </p>
            <span className="text-[10px] text-muted-foreground">Aguardando fotos da torre</span>
          </div>
          <div className="rounded-md border border-border bg-sidebar p-3">
            <p className="text-xs text-muted-foreground">RAC em rascunho</p>
            <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
              {racDraftsCount}
            </p>
            <span className="text-[10px] text-muted-foreground">Aguardando assinatura</span>
          </div>
          <div className="rounded-md border border-border bg-sidebar p-3">
            <p className="text-xs text-muted-foreground">Laudos validados</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-400 tabular-nums">
              {reports.filter((r) => r.status === 'Enviado').length}
            </p>
            <span className="text-[10px] text-emerald-400/80">Transmitidos ao NOC</span>
          </div>
          <div className="rounded-md border border-border bg-sidebar p-3">
            <p className="text-xs text-muted-foreground">Vistorias em carteira</p>
            <p className="mt-1 text-2xl font-semibold text-primary tabular-nums">
              {acionamentos.length}
            </p>
            <span className="text-[10px] text-primary/80">Sites cadastrados</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onContinueReport('RAT')}
            className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-xs transition-opacity hover:opacity-90 cursor-pointer"
          >
            Continuar RAT Fotográfico
          </button>
          <button
            type="button"
            onClick={() => onContinueReport('RAC')}
            className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground shadow-xs transition-colors hover:bg-accent cursor-pointer"
          >
            Continuar RAC
          </button>
        </div>
      </section>
    </div>
  );
};
