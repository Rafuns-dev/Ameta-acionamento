import React, { useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  HardHat,
  MapPin,
  Navigation,
  Pause,
  Play,
  Search,
} from 'lucide-react';
import { Acionamento, AcionamentoStatus } from '../types';
import { formatDateTime, toDate } from '../utils/dateUtils';
import { getTipoAcionamento, rotuloAtividade, TipoBadge } from '../utils/tipoAcionamento';

interface AgendaViewProps {
  acionamentos: Acionamento[];
  onUpdateStatusWithPayload: (
    docId: string,
    newStatus: AcionamentoStatus
  ) => Promise<void>;
  onNavigateToAcionamentoDetail?: (item: Acionamento) => void;
  onBackHome: () => void;
  onToast?: (msg: string) => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  acionamentos,
  onUpdateStatusWithPayload,
  onNavigateToAcionamentoDetail,
  onBackHome,
}) => {
  const [search, setSearch] = useState('');

  // Filter ONLY real acionamentos with accepted/active status
  const activeStatuses = ['Aceito', 'Em deslocamento', 'No local', 'Em atendimento', 'Pausado'];
  
  const vistoriasDoDia = acionamentos.filter((item) =>
    activeStatuses.includes(item.status)
  );

  // Sort by aceitoEm timestamp (toDate)
  vistoriasDoDia.sort((a, b) => {
    const timeA = toDate(a.aceitoEm || a.atualizadoEm || a.demandadoEm)?.getTime() || 0;
    const timeB = toDate(b.aceitoEm || b.atualizadoEm || b.demandadoEm)?.getTime() || 0;
    return timeA - timeB;
  });

  const filtered = vistoriasDoDia.filter((item) => {
    const term = search.toLowerCase();
    return (
      (item.protocolo || item.protocol || '').toLowerCase().includes(term) ||
      (item.siteId || '').toLowerCase().includes(term) ||
      (item.siteNome || item.siteName || '').toLowerCase().includes(term) ||
      (item.endereco || item.address || '').toLowerCase().includes(term)
    );
  });

  const hasAnyExecutor = acionamentos.some((a) => getTipoAcionamento(a) === 'EXECUTOR');
  const hasAnyVistoria = acionamentos.some((a) => getTipoAcionamento(a) === 'VISTORIA');
  const pageTitle =
    hasAnyExecutor && !hasAnyVistoria
      ? 'Meus projetos do dia'
      : !hasAnyExecutor && hasAnyVistoria
      ? 'Minhas vistorias do dia'
      : 'Minhas demandas do dia';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="size-5 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">
              {pageTitle}
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Demandas aceitas e em andamento atribuídas à sua conta em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground hover:bg-accent cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Voltar ao início</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por protocolo, site ou endereço..."
            className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="text-xs font-medium text-muted-foreground">
          Total de demandas ativas: <strong className="text-foreground">{vistoriasDoDia.length}</strong>
        </div>
      </div>

      {/* Demands list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-md border border-border p-8 text-center text-sm text-muted-foreground">
            {search
              ? 'Nenhuma demanda encontrada com o termo pesquisado.'
              : 'Nenhuma demanda ativa em andamento no momento.'}
          </div>
        ) : (
          filtered.map((item) => {
            const protocolDisplay = item.protocolo || item.protocol || item.id;
            const siteNameDisplay = item.siteNome || item.siteName || `Site ${item.siteId}`;
            const addressDisplay = item.endereco || item.address || 'Endereço não informado';

            return (
              <div
                key={item.id}
                className="rounded-md border border-border bg-card p-4 sm:p-5 hover:border-primary/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                      {protocolDisplay}
                    </span>
                    <TipoBadge tipoOrItem={item} />
                    <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      Site: {item.siteId}
                    </span>
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${
                        item.status === 'Em atendimento'
                          ? 'bg-emerald-500/20 text-emerald-400 animate-pulse'
                          : item.status === 'Em deslocamento'
                          ? 'bg-primary/20 text-primary animate-pulse'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-foreground">
                    {siteNameDisplay}
                  </p>

                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3.5 text-primary shrink-0" />
                    <span>{addressDisplay} {item.cidade ? `— ${item.cidade}/${item.uf}` : ''}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1">
                    {item.aceitoEm && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Clock className="size-3" />
                        <span>Aceito em: {formatDateTime(item.aceitoEm)}</span>
                      </span>
                    )}
                    {item.demandadoPorNome && (
                      <span>
                        Demandado por: <strong className="text-foreground">{item.demandadoPorNome}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Workflow Buttons */}
                <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2 shrink-0 border-t sm:border-t-0 border-border/70 pt-2 sm:pt-0">
                  {item.status === 'Aceito' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatusWithPayload(item.id, 'Em deslocamento')}
                      className="inline-flex h-8 items-center gap-1 rounded bg-primary hover:bg-primary/90 text-primary-foreground px-3 text-xs font-medium cursor-pointer"
                    >
                      <Navigation className="size-3.5" />
                      <span>Iniciar Deslocamento</span>
                    </button>
                  )}

                  {item.status === 'Em deslocamento' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatusWithPayload(item.id, 'No local')}
                      className="inline-flex h-8 items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white px-3 text-xs font-semibold cursor-pointer"
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>Confirmar Chegada (No local)</span>
                    </button>
                  )}

                  {item.status === 'No local' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatusWithPayload(item.id, 'Em atendimento')}
                      className="inline-flex h-8 items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white px-3 text-xs font-semibold cursor-pointer"
                    >
                      <HardHat className="size-3.5" />
                      <span>Iniciar {rotuloAtividade(item)}</span>
                    </button>
                  )}

                  {item.status === 'Em atendimento' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatusWithPayload(item.id, 'Pausado')}
                      className="inline-flex h-8 items-center gap-1 rounded border border-border bg-sidebar hover:bg-accent text-foreground px-2.5 text-xs font-medium cursor-pointer"
                    >
                      <Pause className="size-3 text-amber-400" />
                      <span>Pausar</span>
                    </button>
                  )}

                  {item.status === 'Pausado' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatusWithPayload(item.id, 'Em atendimento')}
                      className="inline-flex h-8 items-center gap-1 rounded bg-primary hover:bg-primary/90 text-primary-foreground px-3 text-xs font-medium cursor-pointer"
                    >
                      <Play className="size-3.5" />
                      <span>Retomar</span>
                    </button>
                  )}

                  {onNavigateToAcionamentoDetail && (
                    <button
                      type="button"
                      onClick={() => onNavigateToAcionamentoDetail(item)}
                      className="inline-flex h-8 items-center gap-1 rounded border border-input bg-background px-3 text-xs font-medium text-foreground hover:bg-accent cursor-pointer"
                    >
                      <span>Ver detalhes</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
