import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  FileBarChart2,
  MapPin,
  Plus,
  Radio,
  Search,
  Wallet,
  X,
} from 'lucide-react';
import { AgendaItem, NavSection, ReportItem } from '../types';

/* ============================================================================
   RELATÓRIOS (RAC / RAT) VIEW
============================================================================ */
interface ReportsViewProps {
  type: 'RAC' | 'RAT';
  reports: ReportItem[];
  onEditReport: (report: ReportItem) => void;
  onSwitchType: (type: 'RAC' | 'RAT') => void;
  onBackHome: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  type,
  reports,
  onEditReport,
  onSwitchType,
  onBackHome,
}) => {
  const [statusFilter, setStatusFilter] = useState<'todos' | 'rascunhos' | 'enviados'>('rascunhos');

  const items = reports.filter((r) => {
    if (r.type !== type) return false;
    if (statusFilter === 'rascunhos') return r.status === 'Rascunho';
    if (statusFilter === 'enviados') return r.status === 'Enviado';
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileBarChart2 className="size-5 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">
              Relatórios {type}
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {type === 'RAC'
              ? 'Relatórios de Atendimento ao Cliente em elaboração e enviados.'
              : 'Relatórios de Atendimento Técnico e laudos operacionais Ameta.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-border bg-muted p-0.5">
            <button
              type="button"
              onClick={() => onSwitchType('RAC')}
              className={`h-7 rounded px-3 text-xs font-medium cursor-pointer ${
                type === 'RAC'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              RAC
            </button>
            <button
              type="button"
              onClick={() => onSwitchType('RAT')}
              className={`h-7 rounded px-3 text-xs font-medium cursor-pointer ${
                type === 'RAT'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              RAT
            </button>
          </div>

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

      <div className="inline-flex items-center gap-1 rounded-md border border-border bg-muted p-1">
        {(['rascunhos', 'enviados', 'todos'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusFilter(tab)}
            className={`h-7 rounded px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === tab
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'rascunhos'
              ? 'Meus rascunhos'
              : tab === 'enviados'
              ? 'Enviados'
              : 'Todos'}
          </button>
        ))}
      </div>

      <div className="rounded-md border border-border divide-y divide-border">
        {items.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Nenhum relatório {type} encontrado nesta visualização.
          </div>
        ) : (
          items.map((rep) => (
            <div
              key={rep.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-accent/40 transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{rep.title}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {rep.code} · Chamado/Acionamento {rep.ticketProtocol} · {rep.client} · {rep.status} ·{' '}
                  {rep.updatedAt}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {rep.summary}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onEditReport(rep)}
                className="self-start sm:self-center inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground hover:bg-accent cursor-pointer whitespace-nowrap shrink-0"
              >
                {rep.status === 'Rascunho' ? `Continuar ${rep.type}` : 'Visualizar'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   MODALS: AGENDA DETAIL & REPORT DRAFT EDITOR
============================================================================ */
export const AgendaDetailModal: React.FC<{
  item: AgendaItem | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: AgendaItem['status']) => void;
  onOpenAcionamento?: (protocol: string) => void;
}> = ({ item, onClose, onUpdateStatus, onOpenAcionamento }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-md border border-border bg-sidebar p-5 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground tabular-nums">
                {item.date} · {item.time} · {item.code}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground font-semibold">
                {item.status}
              </span>
            </div>
            <h2 className="mt-1 text-base font-semibold text-foreground">
              {item.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <p className="text-foreground font-medium">{item.client}</p>
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-3.5 shrink-0 text-primary" />
            <span>{item.location}</span>
          </p>

          {item.acionamentoRef && (
            <div className="flex items-center justify-between rounded border border-amber-500/30 bg-amber-500/10 p-2.5">
              <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                <Radio className="size-3.5" />
                <span>Vinculado ao Acionamento {item.acionamentoRef}</span>
              </span>
              {onOpenAcionamento && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenAcionamento(item.acionamentoRef!);
                    onClose();
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Abrir acionamento
                </button>
              )}
            </div>
          )}

          <div className="rounded-md border border-border bg-background p-3">
            <p className="text-[11px] font-medium text-muted-foreground">
              Observações e instruções de visita
            </p>
            <p className="mt-1 text-xs text-foreground leading-relaxed">
              {item.notes}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            <select
              value={item.status}
              onChange={(e) =>
                onUpdateStatus(item.id, e.target.value as AgendaItem['status'])
              }
              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
            >
              <option value="Confirmado">Confirmado</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Pendente">Pendente</option>
              <option value="Concluído">Concluído</option>
            </select>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-md bg-secondary px-3 text-xs font-medium text-secondary-foreground hover:bg-accent cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export const ReportEditorModal: React.FC<{
  report: ReportItem | null;
  onClose: () => void;
  onSaveReport: (id: string, summary: string, finalize: boolean) => void;
}> = ({ report, onClose, onSaveReport }) => {
  const [summary, setSummary] = useState(report?.summary ?? '');

  React.useEffect(() => {
    setSummary(report?.summary ?? '');
  }, [report]);

  if (!report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl rounded-md border border-border bg-sidebar p-5 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
          <div>
            <p className="text-xs text-muted-foreground tabular-nums">
              {report.code} · Acionamento {report.ticketProtocol} · {report.status}
            </p>
            <h2 className="mt-1 text-base font-semibold text-foreground">
              {report.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar editor"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Cliente: <strong className="text-foreground">{report.client}</strong>
          </p>
          <label className="block text-xs font-medium text-foreground">
            Parecer técnico / laudo de encerramento
          </label>
          <textarea
            rows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full rounded-md border border-input bg-background p-3 text-xs text-foreground leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-md px-3 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSaveReport(report.id, summary, false)}
            className="h-8 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground hover:bg-accent cursor-pointer"
          >
            Salvar rascunho
          </button>
          {report.status !== 'Enviado' && (
            <button
              type="button"
              onClick={() => onSaveReport(report.id, summary, true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90 cursor-pointer"
            >
              <Check className="size-3.5" />
              <span>Concluir e enviar {report.type}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
