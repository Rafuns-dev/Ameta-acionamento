import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  ExternalLink,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  Radio,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import {
  Acionamento,
  AgendaItem,
  NavSection,
  ReportItem,
  ResponsiblePerson,
} from '../types';
import { USER_PROFILE } from '../data/initialData';

interface DashboardHomeProps {
  agenda: AgendaItem[];
  acionamentos: Acionamento[];
  responsibles: ResponsiblePerson[];
  reports: ReportItem[];
  unreadMessagesCount: number;
  onNavigate: (section: NavSection) => void;
  onOpenAcionamentoDetail: (item: Acionamento) => void;
  onOpenAgendaDetail: (item: AgendaItem) => void;
  onStartChatWith: (responsibleId: string, prefillMessage?: string) => void;
  onUpdateAcionamentoStatus: (
    id: string,
    status: Acionamento['status']
  ) => void;
  onContinueReport: (type: 'RAC' | 'RAT') => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  agenda,
  acionamentos,
  responsibles,
  reports,
  unreadMessagesCount,
  onNavigate,
  onOpenAcionamentoDetail,
  onOpenAgendaDetail,
  onStartChatWith,
  onUpdateAcionamentoStatus,
  onContinueReport,
}) => {
  const activeAcionamentos = acionamentos.filter(
    (a) => a.status !== 'Concluído'
  );

  const completedTodayCount = agenda.filter(
    (a) => a.status === 'Concluído'
  ).length;

  const inTransitCount = acionamentos.filter(
    (a) => a.status === 'Em deslocamento'
  ).length;

  // Most urgent active acionamento
  const priorityAcionamento =
    activeAcionamentos.find((a) => a.priority === 'Crítica' || a.priority === 'Alta') ||
    activeAcionamentos[0];

  const racDraftsCount = reports.filter(
    (r) => r.type === 'RAC' && r.status === 'Rascunho'
  ).length;
  const ratDraftsCount = reports.filter(
    (r) => r.type === 'RAT' && r.status === 'Rascunho'
  ).length;

  return (
    <div className="space-y-6">
      {/* Personalized Greeting Header */}
      <header className="grid grid-cols-1 items-start gap-4 border-b border-border pb-5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <h1 className="break-words text-xl font-semibold text-foreground sm:text-2xl">
            Olá, {USER_PROFILE.shortName}
          </h1>
          <p className="mt-1 max-w-2xl break-words text-sm text-muted-foreground">
            Painel do perfil {USER_PROFILE.roleBadge} em {USER_PROFILE.company} · {USER_PROFILE.base}.
          </p>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">
          <div className="inline-flex items-center rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
            {USER_PROFILE.roleBadge}
          </div>
        </div>
      </header>

      {/* Main Operational 4-Card Grid */}
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
          {/* Card 1: Atendimentos Hoje */}
          <button
            type="button"
            onClick={() => onNavigate(NavSection.AGENDA)}
            className="rounded-md border border-border bg-background p-3 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
          >
            <p className="text-xs text-muted-foreground">Atendimentos hoje</p>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-semibold text-foreground tabular-nums">
                {agenda.length}
              </span>
              <span className="text-xs text-emerald-400 font-medium">
                {completedTodayCount} concluído
              </span>
            </div>
          </button>

          {/* Card 2: Acionamentos Ativos */}
          <button
            type="button"
            onClick={() => onNavigate(NavSection.ACIONAMENTOS)}
            className="rounded-md border border-border bg-background p-3 text-left transition-colors hover:border-amber-500/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer relative overflow-hidden"
          >
            <p className="text-xs text-muted-foreground">Acionamentos ativos</p>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-semibold text-amber-400 tabular-nums">
                {activeAcionamentos.length}
              </span>
              <span className="text-xs text-amber-400/80">
                {activeAcionamentos.filter((a) => a.status === 'Aguardando aceite').length} pendente(s)
              </span>
            </div>
          </button>

          {/* Card 3: Em Deslocamento */}
          <button
            type="button"
            onClick={() => onNavigate(NavSection.ACIONAMENTOS)}
            className="rounded-md border border-border bg-background p-3 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
          >
            <p className="text-xs text-muted-foreground">Em deslocamento</p>
            <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
              {inTransitCount}
            </p>
          </button>

          {/* Card 4: Chat com Responsáveis */}
          <button
            type="button"
            onClick={() => onNavigate(NavSection.CHAT_RESPONSAVEIS)}
            className="rounded-md border border-border bg-background p-3 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
          >
            <p className="text-xs text-muted-foreground">Mensagens de responsáveis</p>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-semibold text-foreground tabular-nums">
                {unreadMessagesCount}
              </span>
              {unreadMessagesCount > 0 ? (
                <span className="text-xs text-primary font-medium animate-pulse">
                  Nova mensagem
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Sem pendências
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Destaque do Acionamento Prioritário */}
      <section className="rounded-md border border-border bg-background p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Radio className="size-4 text-amber-400 animate-pulse" />
            <h2 className="text-sm font-semibold text-foreground">
              Acionamento Imediato / Despacho Ativo
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate(NavSection.ACIONAMENTOS)}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
          >
            <span>Ver todos os acionamentos ({activeAcionamentos.length})</span>
            <ArrowRight className="size-3" />
          </button>
        </div>

        {priorityAcionamento ? (
          <div className="mt-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-base text-foreground tabular-nums">
                    {priorityAcionamento.protocol}
                  </span>
                  <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold bg-red-500/20 text-red-400">
                    Prioridade {priorityAcionamento.priority}
                  </span>
                  <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-300">
                    {priorityAcionamento.type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Status: <strong className="text-foreground">{priorityAcionamento.status}</strong>
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {priorityAcionamento.client} — {priorityAcionamento.unit}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 text-primary shrink-0" />
                  <span>{priorityAcionamento.address}</span>
                </p>
              </div>

              <div className="rounded-md border border-border/80 bg-muted/40 p-3 sm:text-right shrink-0">
                <p className="text-[11px] text-muted-foreground flex items-center sm:justify-end gap-1">
                  <Clock className="size-3 text-amber-400" />
                  <span>Limite de SLA</span>
                </p>
                <p className="text-xs font-semibold text-amber-400 tabular-nums mt-0.5">
                  {priorityAcionamento.slaLimit}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Despachado por: {priorityAcionamento.dispatcher.name}
                </p>
              </div>
            </div>

            <p className="text-xs text-foreground/90 bg-muted/20 p-3 rounded-md border border-border leading-relaxed">
              {priorityAcionamento.problemDescription}
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {priorityAcionamento.status === 'Aguardando aceite' && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateAcionamentoStatus(priorityAcionamento.id, 'Aceito')
                  }
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-black px-3.5 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <UserCheck className="size-3.5" />
                  <span>Aceitar acionamento</span>
                </button>
              )}

              {priorityAcionamento.status === 'Aceito' && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateAcionamentoStatus(
                      priorityAcionamento.id,
                      'Em deslocamento'
                    )
                  }
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground px-3.5 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Navigation className="size-3.5" />
                  <span>Iniciar deslocamento</span>
                </button>
              )}

              {priorityAcionamento.status === 'Em deslocamento' && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateAcionamentoStatus(
                      priorityAcionamento.id,
                      'No local'
                    )
                  }
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 text-xs font-medium transition-colors cursor-pointer"
                >
                  <MapPin className="size-3.5" />
                  <span>Confirmar chegada no local</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onOpenAcionamentoDetail(priorityAcionamento)}
                className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground hover:bg-accent cursor-pointer"
              >
                Ver detalhes e checklist
              </button>

              <button
                type="button"
                onClick={() =>
                  onStartChatWith(
                    priorityAcionamento.dispatcher.responsibleId,
                    `Olá, sobre o acionamento ${priorityAcionamento.protocol} (${priorityAcionamento.client}): `
                  )
                }
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 px-3 text-xs font-medium cursor-pointer"
              >
                <MessageSquare className="size-3.5" />
                <span>Falar com {priorityAcionamento.dispatcher.name}</span>
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhum acionamento pendente neste momento. Todos os chamados de campo estão atendidos.
          </p>
        )}
      </section>

      {/* Grid: Agenda de Hoje + Responsáveis de Plantão */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Agenda de Hoje */}
        <section className="rounded-md border border-border p-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-semibold text-foreground">Agenda de hoje</h2>
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
                      {item.time} · {item.code}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                        item.status === 'Concluído'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : item.status === 'Confirmado'
                          ? 'bg-primary/15 text-primary'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {item.client}
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

        {/* Responsáveis de Plantão no Chat */}
        <section className="rounded-md border border-border p-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">
                Responsáveis de Plantão
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

      {/* RAC e RAT (Relatórios Operacionais) */}
      <section className="rounded-md border border-border p-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-sm font-semibold text-foreground">RAC e RAT</h2>
          <span className="text-xs text-muted-foreground">
            Relatórios e laudos técnicos
          </span>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">RAC em rascunho</p>
            <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
              {racDraftsCount}
            </p>
          </div>
          <div className="rounded-md border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">RAT em rascunho</p>
            <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
              {ratDraftsCount}
            </p>
          </div>
          <div className="rounded-md border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Ajustes pendentes</p>
            <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
              0
            </p>
          </div>
          <div className="rounded-md border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Relatórios atrasados</p>
            <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
              0
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onContinueReport('RAC')}
            className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow-xs transition-opacity hover:opacity-90 cursor-pointer"
          >
            Continuar RAC
          </button>
          <button
            type="button"
            onClick={() => onContinueReport('RAT')}
            className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
          >
            Continuar RAT
          </button>
          <button
            type="button"
            onClick={() => onContinueReport('RAC')}
            className="inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent cursor-pointer"
          >
            Meus rascunhos RAC
          </button>
        </div>
      </section>
    </div>
  );
};
