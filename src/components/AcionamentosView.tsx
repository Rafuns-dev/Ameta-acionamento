import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Compass,
  Copy,
  ExternalLink,
  HardHat,
  Info,
  Key,
  MapPin,
  MessageSquare,
  Navigation,
  Pause,
  Play,
  Radio,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react';
import {
  Acionamento,
  AcionamentoStatus,
  AuthUser,
} from '../types';

interface AcionamentosViewProps {
  acionamentos: Acionamento[];
  currentUser?: AuthUser | null;
  initialFilter?: 'todos' | 'restantes' | 'em_deslocamento' | 'em_curso' | 'concluidos';
  onUpdateStatusWithPayload: (
    docId: string,
    newStatus: AcionamentoStatus,
    extraFields?: {
      aceitoEm?: string;
      recusadoEm?: string;
      motivoRecusa?: string;
      checkinEm?: string;
      checkinLocal?: string;
      checkoutEm?: string;
      checkoutLocal?: string;
      concluidoEm?: string;
      resumoConclusao?: string;
      pendencias?: string;
    }
  ) => Promise<void>;
  onOpenChatWithDispatcher: (responsibleId: string, protocol: string) => void;
  onOpenDeslocamentoModal?: (site?: Acionamento) => void;
  onBackHome: () => void;
  onToast?: (msg: string) => void;
  isLoadingFirestore?: boolean;
}

export const AcionamentosView: React.FC<AcionamentosViewProps> = ({
  acionamentos,
  currentUser,
  initialFilter = 'todos',
  onUpdateStatusWithPayload,
  onOpenChatWithDispatcher,
  onOpenDeslocamentoModal,
  onBackHome,
  onToast,
  isLoadingFirestore = false,
}) => {
  const [filter, setFilter] = useState<
    'todos' | 'restantes' | 'em_deslocamento' | 'em_curso' | 'concluidos'
  >(initialFilter);
  const [search, setSearch] = useState('');
  const [selectedAcionamento, setSelectedAcionamento] = useState<Acionamento | null>(null);

  // Custom Modals state (no window.confirm)
  const [recusarItem, setRecusarItem] = useState<Acionamento | null>(null);
  const [motivoRecusaInput, setMotivoRecusaInput] = useState('');

  const [checkinItem, setCheckinItem] = useState<Acionamento | null>(null);
  const [checkinLocalInput, setCheckinLocalInput] = useState('');

  const [concluirItem, setConcluirItem] = useState<Acionamento | null>(null);
  const [resumoConclusaoInput, setResumoConclusaoInput] = useState('');
  const [pendenciasInput, setPendenciasInput] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  // Count pending items in 'Aguardando aceite'
  const pendingCount = acionamentos.filter((a) => a.status === 'Aguardando aceite').length;

  const filtered = acionamentos.filter((a) => {
    const protocolStr = a.protocolo || a.protocol || '';
    const siteIdStr = a.siteId || '';
    const siteNameStr = a.siteNome || a.siteName || '';
    const vendorStr = a.vendor || '';
    const cityStr = a.cidade || '';
    const addressStr = a.endereco || a.address || '';
    const obsStr = a.observacao || a.problemDescription || '';

    const matchesSearch =
      protocolStr.toLowerCase().includes(search.toLowerCase()) ||
      siteIdStr.toLowerCase().includes(search.toLowerCase()) ||
      siteNameStr.toLowerCase().includes(search.toLowerCase()) ||
      vendorStr.toLowerCase().includes(search.toLowerCase()) ||
      cityStr.toLowerCase().includes(search.toLowerCase()) ||
      addressStr.toLowerCase().includes(search.toLowerCase()) ||
      obsStr.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'restantes')
      return a.status === 'Aguardando aceite' || a.status === 'Aceito';
    if (filter === 'em_deslocamento')
      return a.status === 'Em deslocamento';
    if (filter === 'em_curso')
      return (
        a.status === 'No local' ||
        a.status === 'Em atendimento' ||
        a.status === 'Pausado'
      );
    if (filter === 'concluidos')
      return a.status === 'Concluído' || a.status === 'Cancelado' || a.status === 'Recusado';
    return true;
  });

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    onToast?.(`${label} copiado!`);
  };

  // Actions
  const handleConfirmAceitar = async (item: Acionamento) => {
    setActionLoading(true);
    try {
      await onUpdateStatusWithPayload(item.id, 'Aceito');
      onToast?.(`Vistoria no site ${item.siteId} aceita com sucesso!`);
    } catch (e) {
      onToast?.('Erro ao aceitar demanda no Firebase.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmRecusar = async () => {
    if (!recusarItem) return;
    if (!motivoRecusaInput.trim()) {
      onToast?.('Por favor, informe o motivo da recusa.');
      return;
    }

    setActionLoading(true);
    try {
      await onUpdateStatusWithPayload(recusarItem.id, 'Recusado', {
        motivoRecusa: motivoRecusaInput.trim(),
        recusadoEm: new Date().toLocaleString('pt-BR'),
      });
      onToast?.(`Demanda do site ${recusarItem.siteId} recusada.`);
      setRecusarItem(null);
      setMotivoRecusaInput('');
    } catch (e) {
      onToast?.('Erro ao registrar recusa no Firebase.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCheckin = async () => {
    if (!checkinItem) return;
    setActionLoading(true);
    try {
      const formattedTime = new Date().toLocaleString('pt-BR');
      await onUpdateStatusWithPayload(checkinItem.id, 'No local', {
        checkinEm: formattedTime,
        checkinLocal: checkinLocalInput.trim() || checkinItem.endereco || checkinItem.siteNome,
      });
      onToast?.(`Check-in de chegada ao site ${checkinItem.siteId} confirmado!`);
      setCheckinItem(null);
      setCheckinLocalInput('');
    } catch (e) {
      onToast?.('Erro ao registrar check-in no Firebase.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmConcluir = async () => {
    if (!concluirItem) return;
    if (!resumoConclusaoInput.trim()) {
      onToast?.('Por favor, descreva o resumo da conclusão da vistoria.');
      return;
    }

    setActionLoading(true);
    try {
      const formattedTime = new Date().toLocaleString('pt-BR');
      await onUpdateStatusWithPayload(concluirItem.id, 'Concluído', {
        concluidoEm: formattedTime,
        checkoutEm: formattedTime,
        checkoutLocal: concluirItem.endereco || concluirItem.siteNome,
        resumoConclusao: resumoConclusaoInput.trim(),
        pendencias: pendenciasInput.trim() || 'Nenhuma pendência informada.',
      });
      onToast?.(`Vistoria no site ${concluirItem.siteId} finalizada e transmitida ao NOC!`);
      setConcluirItem(null);
      setResumoConclusaoInput('');
      setPendenciasInput('');
    } catch (e) {
      onToast?.('Erro ao registrar conclusão no Firebase.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="size-5 text-amber-400" />
            <h1 className="text-xl font-semibold text-foreground">
              Vistorias em Sites de Telecom & Torres
            </h1>
            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/30">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Tempo Real · Firebase Firestore
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhamento em tempo real das vistorias demandadas pelo sistema Telecom para{' '}
            <strong className="text-foreground">{currentUser?.email || 'seu usuário'}</strong>.
          </p>
        </div>

        {/* Counter of Pending Demands */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs text-amber-300 shadow-sm animate-pulse">
            <Clock className="size-4 shrink-0 text-amber-400" />
            <div>
              <span className="font-bold">{pendingCount} demanda(s)</span> aguardando seu aceite!
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilter('todos')}
            className={`h-8 rounded-md px-3 text-xs font-medium transition-colors cursor-pointer ${
              filter === 'todos'
                ? 'bg-secondary text-secondary-foreground font-semibold'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            Todos os Sites ({acionamentos.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('restantes')}
            className={`h-8 rounded-md px-3 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              filter === 'restantes'
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <span>Pendentes / Restantes ({acionamentos.filter((a) => a.status === 'Aguardando aceite' || a.status === 'Aceito').length})</span>
            {pendingCount > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setFilter('em_deslocamento')}
            className={`h-8 rounded-md px-3 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              filter === 'em_deslocamento'
                ? 'bg-primary/20 text-primary font-semibold border border-primary/40'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <Navigation className="size-3 text-primary animate-bounce" />
            <span>Em Deslocamento ({acionamentos.filter((a) => a.status === 'Em deslocamento').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('em_curso')}
            className={`h-8 rounded-md px-3 text-xs font-medium transition-colors cursor-pointer ${
              filter === 'em_curso'
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            Em Atendimento / No Local ({acionamentos.filter((a) => a.status === 'Em atendimento' || a.status === 'No local' || a.status === 'Pausado').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('concluidos')}
            className={`h-8 rounded-md px-3 text-xs font-medium transition-colors cursor-pointer ${
              filter === 'concluidos'
                ? 'bg-muted text-foreground font-semibold border border-border'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            Concluídos / Encerrados ({acionamentos.filter((a) => a.status === 'Concluído' || a.status === 'Cancelado' || a.status === 'Recusado').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por protocolo, site, cidade..."
            className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Loading state indicator */}
      {isLoadingFirestore && (
        <div className="rounded-lg border border-border bg-card p-6 text-center text-xs text-muted-foreground">
          <div className="inline-flex items-center gap-2">
            <span className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Sincronizando vistorias com o Firebase Firestore...</span>
          </div>
        </div>
      )}

      {/* Main Sites List */}
      <div className="space-y-3">
        {!isLoadingFirestore && filtered.length === 0 ? (
          <div className="rounded-md border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {search
              ? 'Nenhuma vistoria localizada com esse termo de busca.'
              : 'Nenhuma demanda de vistoria encontrada para este filtro.'}
          </div>
        ) : (
          filtered.map((item) => {
            const isAguardando = item.status === 'Aguardando aceite';
            const isConcluido = item.status === 'Concluído';
            const isCancelado = item.status === 'Cancelado';
            const isRecusado = item.status === 'Recusado';
            const isReadOnly = isConcluido || isCancelado || isRecusado;

            const siteNameDisplay = item.siteNome || item.siteName || `Site ${item.siteId}`;
            const protocolDisplay = item.protocolo || item.protocol || item.id;
            const addressDisplay = item.endereco || item.address || 'Endereço não especificado';
            const vendorDisplay = item.vendor || 'TELECOM';

            return (
              <div
                key={item.id}
                className={`rounded-lg border p-4 sm:p-5 transition-all bg-card ${
                  isAguardando
                    ? 'border-amber-500/80 ring-2 ring-amber-500/30 bg-amber-500/[0.04]'
                    : item.status === 'Em atendimento'
                    ? 'border-emerald-500/50 ring-1 ring-emerald-500/20'
                    : item.status === 'Em deslocamento'
                    ? 'border-primary/50 ring-1 ring-primary/20 bg-primary/[0.02]'
                    : isCancelado || isRecusado
                    ? 'border-border/60 bg-muted/20 opacity-80'
                    : 'border-border'
                }`}
              >
                {/* Aguardando Aceite Banner Alert */}
                {isAguardando && (
                  <div className="mb-3.5 flex items-center justify-between rounded-md bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5 animate-spin text-amber-400" />
                      NOVA DEMANDA DE VISTORIA — AGUARDANDO SEU ACEITE
                    </span>
                    <span className="text-[10px] font-mono text-amber-400">
                      Demandado por: {item.demandadoPorNome || 'Sistema Telecom'}
                    </span>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                        {protocolDisplay}
                      </span>
                      <span className="font-bold text-base text-foreground">
                        {siteNameDisplay}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        Site: {item.siteId}
                      </span>
                      <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-foreground/10 text-foreground">
                        {vendorDisplay}
                      </span>

                      {/* Status Tag */}
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-xs font-semibold ${
                          isConcluido
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : item.status === 'Em atendimento'
                            ? 'bg-emerald-500/20 text-emerald-400 animate-pulse'
                            : item.status === 'Em deslocamento'
                            ? 'bg-primary/20 text-primary animate-pulse'
                            : isRecusado || isCancelado
                            ? 'bg-destructive/20 text-destructive'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-primary shrink-0" />
                        <span>{addressDisplay} {item.cidade ? `— ${item.cidade}/${item.uf}` : ''}</span>
                      </span>

                      {item.equipe && (
                        <span className="flex items-center gap-1 text-foreground/80 font-medium">
                          <Users className="size-3.5 text-primary" />
                          <span>Equipe: {item.equipe}</span>
                        </span>
                      )}

                      {item.tipoDestinatario && (
                        <span className="text-[11px] bg-secondary/80 px-2 py-0.5 rounded text-secondary-foreground font-medium">
                          {item.tipoDestinatario}
                        </span>
                      )}
                    </div>

                    {/* Observação / Escopo */}
                    {(item.observacao || item.problemDescription) && (
                      <div className="rounded-lg border border-border/80 bg-background/50 p-2.5 text-xs text-foreground/90 leading-relaxed">
                        <span className="font-semibold text-primary">Observação / Escopo: </span>
                        {item.observacao || item.problemDescription}
                      </div>
                    )}

                    {/* Details if Recusado */}
                    {isRecusado && item.motivoRecusa && (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive leading-relaxed">
                        <span className="font-bold">Motivo da Recusa: </span>
                        {item.motivoRecusa}
                        <div className="mt-1 text-[11px] opacity-80">
                          Recusado por: {item.recusadoPorNome || item.recusadoPorEmail} em {item.recusadoEm}
                        </div>
                      </div>
                    )}

                    {/* Details if Concluído */}
                    {isConcluido && (item.resumoConclusao || item.concluidoEm) && (
                      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-300 leading-relaxed space-y-1">
                        <div>
                          <span className="font-bold">Resumo da Conclusão: </span>
                          {item.resumoConclusao || 'Vistoria finalizada.'}
                        </div>
                        {item.pendencias && (
                          <div className="text-[11px] text-amber-300">
                            <span className="font-semibold">Pendências registradas: </span>
                            {item.pendencias}
                          </div>
                        )}
                        <div className="text-[10px] text-emerald-400/80">
                          Concluído em: {item.concluidoEm} · Check-in: {item.checkinEm || 'Registrado'}
                        </div>
                      </div>
                    )}

                    {/* Historical entries */}
                    {item.historico && item.historico.length > 0 && (
                      <div className="pt-1">
                        <p className="text-[11px] font-semibold text-muted-foreground mb-1">
                          Histórico de Mudanças no Firebase:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.historico.map((h, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-background border border-border/80 px-2 py-0.5 rounded text-muted-foreground"
                            >
                              <strong className="text-foreground">{h.status}</strong> por {h.por.split('@')[0]} ({h.em})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Status Actions */}
                  <div className="flex flex-col items-start lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
                    <div className="text-left lg:text-right text-[11px] text-muted-foreground">
                      <div>Demandado em: <span className="font-medium text-foreground">{item.demandadoEm || 'Recentemente'}</span></div>
                      <div>Por: <span className="font-medium text-foreground">{item.demandadoPorNome || 'Telecom'}</span></div>
                    </div>

                    {/* Operational Actions */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Aguardando Aceite: Aceitar & Recusar */}
                      {isAguardando && (
                        <>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleConfirmAceitar(item)}
                            className="inline-flex h-8 items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white px-3 text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                          >
                            <UserCheck className="size-3.5" />
                            <span>Aceitar</span>
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => {
                              setRecusarItem(item);
                              setMotivoRecusaInput('');
                            }}
                            className="inline-flex h-8 items-center gap-1 rounded bg-destructive/15 hover:bg-destructive/25 text-destructive border border-destructive/30 px-3 text-xs font-semibold cursor-pointer transition-colors"
                          >
                            <UserX className="size-3.5" />
                            <span>Recusar</span>
                          </button>
                        </>
                      )}

                      {/* Aceito -> Iniciar Deslocamento */}
                      {item.status === 'Aceito' && (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => onUpdateStatusWithPayload(item.id, 'Em deslocamento')}
                          className="inline-flex h-8 items-center gap-1 rounded bg-primary hover:bg-primary/90 text-primary-foreground px-3 text-xs font-medium cursor-pointer shadow-xs"
                        >
                          <Navigation className="size-3.5" />
                          <span>Iniciar Deslocamento</span>
                        </button>
                      )}

                      {/* Em deslocamento -> Check-in (No local) */}
                      {item.status === 'Em deslocamento' && (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => {
                            setCheckinItem(item);
                            setCheckinLocalInput(item.endereco || item.siteNome || '');
                          }}
                          className="inline-flex h-8 items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white px-3 text-xs font-semibold cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="size-3.5" />
                          <span>Confirmar Chegada (Check-in)</span>
                        </button>
                      )}

                      {/* No local -> Iniciar Atendimento */}
                      {item.status === 'No local' && (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => onUpdateStatusWithPayload(item.id, 'Em atendimento')}
                          className="inline-flex h-8 items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white px-3 text-xs font-medium cursor-pointer"
                        >
                          <HardHat className="size-3.5" />
                          <span>Iniciar Atendimento</span>
                        </button>
                      )}

                      {/* Em atendimento -> Pausar ou Concluir */}
                      {item.status === 'Em atendimento' && (
                        <>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => onUpdateStatusWithPayload(item.id, 'Pausado')}
                            className="inline-flex h-8 items-center gap-1 rounded border border-border bg-sidebar hover:bg-accent text-foreground px-2.5 text-xs font-medium cursor-pointer"
                          >
                            <Pause className="size-3 text-amber-400" />
                            <span>Pausar</span>
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => {
                              setConcluirItem(item);
                              setResumoConclusaoInput('');
                              setPendenciasInput('');
                            }}
                            className="inline-flex h-8 items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white px-3 text-xs font-semibold cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="size-3.5" />
                            <span>Concluir Vistoria</span>
                          </button>
                        </>
                      )}

                      {/* Pausado -> Retomar */}
                      {item.status === 'Pausado' && (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => onUpdateStatusWithPayload(item.id, 'Em atendimento')}
                          className="inline-flex h-8 items-center gap-1 rounded bg-primary hover:bg-primary/90 text-primary-foreground px-3 text-xs font-medium cursor-pointer"
                        >
                          <Play className="size-3.5" />
                          <span>Retomar Atendimento</span>
                        </button>
                      )}

                      {/* Read-Only Status Indicator */}
                      {isReadOnly && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded border border-border">
                          <Info className="size-3 text-muted-foreground" />
                          <span>Apenas Leitura ({item.status})</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Custom Recusar Modal (No window.confirm) */}
      {recusarItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-destructive/40 bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-destructive">
                <UserX className="size-5" />
                <h3 className="text-base font-bold text-foreground">
                  Recusar Demanda de Vistoria
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRecusarItem(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Você está recusando a demanda para o site{' '}
                <strong className="text-foreground font-mono">{recusarItem.siteId}</strong> ({recusarItem.siteNome}).
              </p>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Motivo da Recusa (obrigatório para envio ao NOC):
                </label>
                <textarea
                  rows={3}
                  value={motivoRecusaInput}
                  onChange={(e) => setMotivoRecusaInput(e.target.value)}
                  placeholder="Ex: Falta de equipamentos adequados, conflito de agenda urgente..."
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRecusarItem(null)}
                className="rounded-lg border border-border bg-sidebar hover:bg-accent px-3.5 py-2 text-xs font-medium text-foreground cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={actionLoading || !motivoRecusaInput.trim()}
                onClick={handleConfirmRecusar}
                className="rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Registrando...' : 'Confirmar Recusa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Check-in Modal */}
      {checkinItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="size-5" />
                <h3 className="text-base font-bold text-foreground">
                  Confirmar Check-in no Site
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCheckinItem(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Confirmando chegada ao site{' '}
                <strong className="text-foreground font-mono">{checkinItem.siteId}</strong>.
              </p>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Local / Referência de Check-in GPS:
                </label>
                <input
                  type="text"
                  value={checkinLocalInput}
                  onChange={(e) => setCheckinLocalInput(e.target.value)}
                  placeholder="Endereço ou coordenadas de chegada"
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCheckinItem(null)}
                className="rounded-lg border border-border bg-sidebar hover:bg-accent px-3.5 py-2 text-xs font-medium text-foreground cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmCheckin}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Gravando...' : 'Confirmar Check-in'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Concluir Modal */}
      {concluirItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl border border-emerald-500/40 bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="size-5" />
                <h3 className="text-base font-bold text-foreground">
                  Concluir Vistoria em Campo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConcluirItem(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Finalizando vistoria no site{' '}
                <strong className="text-foreground font-mono">{concluirItem.siteId}</strong> ({concluirItem.siteNome}).
              </p>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Resumo da Conclusão / Laudo Sumário (obrigatório):
                </label>
                <textarea
                  rows={3}
                  value={resumoConclusaoInput}
                  onChange={(e) => setResumoConclusaoInput(e.target.value)}
                  placeholder="Ex: Vistoria concluída sem anomalias estruturais. Parafusos torqueados e balizamento operando perfeitamente..."
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Pendências ou Observações de Retorno (opcional):
                </label>
                <input
                  type="text"
                  value={pendenciasInput}
                  onChange={(e) => setPendenciasInput(e.target.value)}
                  placeholder="Ex: Necessário retorno com pintura anticorrosiva no patamar de 30m"
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConcluirItem(null)}
                className="rounded-lg border border-border bg-sidebar hover:bg-accent px-3.5 py-2 text-xs font-medium text-foreground cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={actionLoading || !resumoConclusaoInput.trim()}
                onClick={handleConfirmConcluir}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Finalizando...' : 'Concluir & Transmitir ao Firebase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
