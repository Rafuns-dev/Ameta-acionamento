import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Compass,
  Copy,
  ExternalLink,
  HardHat,
  Key,
  MapPin,
  MessageSquare,
  Navigation,
  Plus,
  Radio,
  Search,
  TowerControl as TowerIcon,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import {
  Acionamento,
  AcionamentoPriority,
  SurveyType,
  TowerType,
} from '../types';

interface AcionamentosViewProps {
  acionamentos: Acionamento[];
  initialFilter?: 'todos' | 'restantes' | 'em_deslocamento' | 'em_curso' | 'concluidos';
  onUpdateStatus: (id: string, status: Acionamento['status']) => void;
  onAddAcionamento: (item: Omit<Acionamento, 'id' | 'notes'>) => void;
  onOpenChatWithDispatcher: (responsibleId: string, protocol: string) => void;
  onOpenDeslocamentoModal?: (site?: Acionamento) => void;
  onBackHome: () => void;
  onToast?: (msg: string) => void;
}

export const AcionamentosView: React.FC<AcionamentosViewProps> = ({
  acionamentos,
  initialFilter = 'todos',
  onUpdateStatus,
  onAddAcionamento,
  onOpenChatWithDispatcher,
  onOpenDeslocamentoModal,
  onBackHome,
  onToast,
}) => {
  const [filter, setFilter] = useState<
    'todos' | 'restantes' | 'em_deslocamento' | 'em_curso' | 'concluidos'
  >(initialFilter);
  const [search, setSearch] = useState('');
  const [selectedAcionamento, setSelectedAcionamento] = useState<Acionamento | null>(null);
  const [newNote, setNewNote] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Form states for new Telecom Site Demand
  const [siteId, setSiteId] = useState('');
  const [siteName, setSiteName] = useState('');
  const [towerType, setTowerType] = useState<TowerType>('Autoportante');
  const [towerHeightMeters, setTowerHeightMeters] = useState('50');
  const [operator, setOperator] = useState('American Tower / Vivo');
  const [coordinates, setCoordinates] = useState('-23.5505, -46.6333');
  const [address, setAddress] = useState('');
  const [accessKeyProtocol, setAccessKeyProtocol] = useState('Cadeado segredo 8820');
  const [contactName, setContactName] = useState('Central NOC');
  const [contactPhone, setContactPhone] = useState('(11) 98000-1122');
  const [priority, setPriority] = useState<AcionamentoPriority>('Alta');
  const [type, setType] = useState<SurveyType>('Vistoria Estrutural');
  const [problemDescription, setProblemDescription] = useState('');
  const [systemEquipment, setSystemEquipment] = useState('');

  const filtered = acionamentos.filter((a) => {
    const matchesSearch =
      a.protocol.toLowerCase().includes(search.toLowerCase()) ||
      a.siteId.toLowerCase().includes(search.toLowerCase()) ||
      a.siteName.toLowerCase().includes(search.toLowerCase()) ||
      a.operator.toLowerCase().includes(search.toLowerCase()) ||
      a.problemDescription.toLowerCase().includes(search.toLowerCase());

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
    if (filter === 'concluidos') return a.status === 'Concluído';
    return true;
  });

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    onToast?.(`${label} copiado!`);
  };

  const handleCreateSiteDemand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId.trim() || !siteName.trim() || !problemDescription.trim()) return;

    const nextProtocolNum = 1056 + acionamentos.length;
    onAddAcionamento({
      protocol: `AC-2026-00${nextProtocolNum}`,
      siteId: siteId.trim().toUpperCase(),
      siteName: siteName.trim(),
      towerType,
      towerHeightMeters: parseInt(towerHeightMeters, 10) || 45,
      operator: operator.trim(),
      coordinates: coordinates.trim() || '-23.5505, -46.6333',
      address: address.trim() || 'São Paulo - SP',
      accessKeyProtocol: accessKeyProtocol.trim() || 'Chave com a supervisão',
      contactName: contactName.trim() || 'Despacho de Campo',
      contactPhone: contactPhone.trim() || '(11) 98000-0000',
      priority,
      type,
      status: 'Aguardando aceite',
      requestedAt: 'Hoje · Agora',
      slaLimit: priority === 'Crítica' ? '2h00 (SLA Crítico)' : '4h00 (SLA Padrão)',
      slaRemainingMinutes: priority === 'Crítica' ? 120 : 240,
      problemDescription: problemDescription.trim(),
      systemEquipment: systemEquipment.trim() || `Torre ${towerType} + Esteiramento`,
      dispatcher: {
        responsibleId: 'resp-fernanda',
        name: 'Fernanda Costa',
        role: 'Coordenadora de Campo & Despacho',
      },
      executors: [],
      documents: [],
      checklistItems: [
        { id: 'c1', title: 'Inspeção visual da fundação e chumbadores da base', checked: false },
        { id: 'c2', title: 'Medição da malha de aterramento (TMGB < 5 ohms)', checked: false },
        { id: 'c3', title: 'Inspeção do esteiramento vertical e horizontal', checked: false },
        { id: 'c4', title: 'Aperto e torqueamento dos parafusos e tirantes', checked: false },
        { id: 'c5', title: 'Verificação do balizamento noturno e fiação', checked: false },
        { id: 'c6', title: 'Registro fotográfico 360° para laudo RAT', checked: false },
      ],
    });

    setIsNewModalOpen(false);
    setSiteId('');
    setSiteName('');
    setAddress('');
    setProblemDescription('');
    setSystemEquipment('');
    onToast?.(`Demanda de vistoria no site ${siteId} criada e despachada para campo!`);
  };

  const handleToggleChecklist = (itemIndex: number) => {
    if (!selectedAcionamento || !selectedAcionamento.checklistItems) return;
    const updatedItems = [...selectedAcionamento.checklistItems];
    updatedItems[itemIndex].checked = !updatedItems[itemIndex].checked;
    selectedAcionamento.checklistItems = updatedItems;
    setSelectedAcionamento({ ...selectedAcionamento });
  };

  const handleAddNoteToSelected = () => {
    if (!newNote.trim() || !selectedAcionamento) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    selectedAcionamento.notes.push(`${timeStr} - ${newNote.trim()}`);
    setNewNote('');
    onToast?.('Nota operacional adicionada ao histórico da torre.');
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
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhamento do fluxo de vistoria em campo, envio de sites (torres) aos vistoriadores e controle de rotas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground px-3 text-xs font-semibold cursor-pointer shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Mandar Novo Site (Torre)</span>
          </button>
        </div>
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
            className={`h-8 rounded-md px-3 text-xs font-medium transition-colors cursor-pointer ${
              filter === 'restantes'
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            Sites Restantes ({acionamentos.filter((a) => a.status === 'Aguardando aceite' || a.status === 'Aceito').length})
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
            Em Atendimento / No Local ({acionamentos.filter((a) => a.status === 'Em atendimento' || a.status === 'No local').length})
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
            Concluídos ({acionamentos.filter((a) => a.status === 'Concluído').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar site, torre, operadora..."
            className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Main Sites List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-md border border-border bg-background p-8 text-center text-sm text-muted-foreground">
            Nenhum site encontrado para o filtro selecionado.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`rounded-md border p-4 sm:p-5 transition-all bg-background ${
                item.status === 'Em atendimento'
                  ? 'border-emerald-500/50 ring-1 ring-emerald-500/20'
                  : item.status === 'Em deslocamento'
                  ? 'border-primary/50 ring-1 ring-primary/20 bg-primary/[0.02]'
                  : item.priority === 'Crítica'
                  ? 'border-amber-500/40'
                  : 'border-border'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs text-primary px-2 py-0.5 rounded bg-primary/10">
                      {item.siteId}
                    </span>
                    <span className="font-semibold text-base text-foreground">
                      {item.siteName}
                    </span>
                    <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                      {item.towerType} ({item.towerHeightMeters}m)
                    </span>
                    <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                      {item.operator}
                    </span>
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${
                        item.status === 'Concluído'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : item.status === 'Em atendimento'
                          ? 'bg-emerald-500/20 text-emerald-400 animate-pulse'
                          : item.status === 'Em deslocamento'
                          ? 'bg-primary/20 text-primary animate-pulse'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {item.status}
                    </span>
                    {item.externalId && (
                      <span className="text-[11px] text-muted-foreground font-mono">
                        Ref: {item.externalId}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-primary shrink-0" />
                      <span>{item.address}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.coordinates, 'Coordenadas GPS')}
                      className="flex items-center gap-1 hover:text-foreground cursor-pointer text-primary"
                    >
                      <Compass className="size-3" />
                      <span>GPS: {item.coordinates}</span>
                      <Copy className="size-3" />
                    </button>
                    <span className="flex items-center gap-1 text-amber-300 font-medium">
                      <Key className="size-3" />
                      <span>{item.accessKeyProtocol}</span>
                    </span>
                  </div>

                  {/* Dedicated Transit Banner for Sites in Displacement */}
                  {item.status === 'Em deslocamento' && (
                    <div className="rounded-md border border-primary/40 bg-primary/10 p-3 space-y-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Navigation className="size-3.5 text-primary animate-bounce" />
                          <span className="font-semibold text-primary">
                            Deslocamento em Tempo Real Rumo à Torre
                          </span>
                        </div>
                        <span className="font-medium text-foreground bg-primary/20 px-2 py-0.5 rounded text-[11px]">
                          ETA: {item.displacement?.estimatedArrival || 'A caminho (~25 min)'}
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 text-[11px] text-foreground/90">
                        <div>
                          <span className="text-muted-foreground">Veículo da Frota: </span>
                          <span className="font-medium">{item.displacement?.vehicle || 'Fiat Strada Freedom 1.3 · Frota #04'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Trânsito: </span>
                          <span className="text-amber-400 font-medium">{item.displacement?.trafficCondition || 'Trânsito moderado'}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-primary/20">
                        <button
                          type="button"
                          onClick={() => onOpenDeslocamentoModal?.(item)}
                          className="inline-flex h-6 items-center gap-1 rounded bg-primary text-primary-foreground px-2.5 text-[11px] font-medium hover:bg-primary/90 cursor-pointer"
                        >
                          <Navigation className="size-3" />
                          <span>Abrir Painel de Deslocamento</span>
                        </button>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.coordinates || item.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-6 items-center gap-1 rounded border border-border bg-sidebar hover:bg-accent px-2 text-[11px] font-medium text-foreground cursor-pointer"
                        >
                          <ExternalLink className="size-2.5 text-primary" />
                          <span>Google Maps</span>
                        </a>
                        <a
                          href={`https://waze.com/ul?ll=${encodeURIComponent(item.coordinates)}&navigate=yes`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-6 items-center gap-1 rounded border border-border bg-sidebar hover:bg-accent px-2 text-[11px] font-medium text-foreground cursor-pointer"
                        >
                          <Navigation className="size-2.5 text-primary" />
                          <span>Waze</span>
                        </a>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-foreground/90 leading-relaxed bg-muted/20 p-2.5 rounded border border-border/80">
                    <strong>Escopo da Vistoria:</strong> {item.problemDescription}
                  </p>

                  {/* Executores & Documentos vinculados */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="size-3.5 text-primary" />
                      <span>Executores:</span>
                      <span className="font-semibold text-foreground">
                        {item.executors?.map((ex) => ex.name.split(' ')[0]).join(', ') || 'Rafael'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Status & Workflow Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0">
                  <div className="text-left lg:text-right">
                    <p className="text-[11px] text-muted-foreground flex items-center lg:justify-end gap-1">
                      <Clock className="size-3 text-amber-400" />
                      <span>Janela / SLA</span>
                    </p>
                    <p className="text-xs font-semibold text-amber-400 tabular-nums">
                      {item.slaLimit}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Despachado: {item.requestedAt}
                    </p>
                  </div>

                  {/* Operational workflow buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.status === 'Aguardando aceite' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(item.id, 'Aceito')}
                        className="inline-flex h-7 items-center gap-1 rounded bg-amber-500 hover:bg-amber-600 text-black px-2.5 text-xs font-semibold cursor-pointer"
                      >
                        <UserCheck className="size-3" />
                        <span>Aceitar</span>
                      </button>
                    )}

                    {item.status === 'Aceito' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(item.id, 'Em deslocamento')}
                        className="inline-flex h-7 items-center gap-1 rounded bg-primary hover:bg-primary/90 text-primary-foreground px-2.5 text-xs font-medium cursor-pointer"
                      >
                        <Navigation className="size-3" />
                        <span>Iniciar Deslocamento</span>
                      </button>
                    )}

                    {item.status === 'Em deslocamento' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(item.id, 'No local')}
                        className="inline-flex h-7 items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 text-xs font-semibold cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="size-3.5" />
                        <span>Confirmar Chegada (Check-in GPS)</span>
                      </button>
                    )}

                    {item.status === 'No local' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(item.id, 'Em atendimento')}
                        className="inline-flex h-7 items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 text-xs font-medium cursor-pointer"
                      >
                        <HardHat className="size-3" />
                        <span>Iniciar Subida na Torre</span>
                      </button>
                    )}

                    {item.status === 'Em atendimento' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(item.id, 'Concluído')}
                        className="inline-flex h-7 items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 text-xs font-medium cursor-pointer"
                      >
                        <CheckCircle2 className="size-3" />
                        <span>Concluir Vistoria</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedAcionamento(item)}
                      className="inline-flex h-7 items-center gap-1 rounded border border-input bg-background hover:bg-accent px-2.5 text-xs font-medium text-foreground cursor-pointer"
                    >
                      <span>Checklist & Detalhes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onOpenChatWithDispatcher(
                          item.dispatcher.responsibleId,
                          item.protocol
                        )
                      }
                      className="inline-flex h-7 items-center gap-1 rounded border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 px-2 text-xs font-medium cursor-pointer"
                      title="Conversar com o responsável pelo despacho"
                    >
                      <MessageSquare className="size-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail & Checklist Modal for Selected Site */}
      {selectedAcionamento && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs"
        >
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg border border-border bg-sidebar text-foreground shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-muted/20">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-primary">
                  {selectedAcionamento.siteId}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  — {selectedAcionamento.siteName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAcionamento(null)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Site Specifications Banner */}
              <div className="grid gap-2 sm:grid-cols-3 rounded-md bg-background p-3 border border-border text-xs">
                <div>
                  <span className="text-muted-foreground">Tipo de Torre:</span>
                  <p className="font-semibold text-foreground">
                    {selectedAcionamento.towerType} ({selectedAcionamento.towerHeightMeters}m)
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Operadora / Cliente:</span>
                  <p className="font-semibold text-foreground">
                    {selectedAcionamento.operator}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Segredo do Cadeado / Acesso:</span>
                  <p className="font-semibold text-amber-300">
                    {selectedAcionamento.accessKeyProtocol}
                  </p>
                </div>
              </div>

              {/* Checklist de Vistoria da Torre */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-primary" />
                    <span>Checklist Técnico de Vistoria em Campo (Estrutural & Infra)</span>
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    {selectedAcionamento.checklistItems?.filter((c) => c.checked).length || 0} de{' '}
                    {selectedAcionamento.checklistItems?.length || 0} itens checados
                  </span>
                </div>
                <div className="space-y-1.5 rounded-md border border-border bg-background p-3 text-xs">
                  {selectedAcionamento.checklistItems?.map((item, idx) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2.5 p-1 rounded hover:bg-accent/40 cursor-pointer text-foreground/90"
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleToggleChecklist(idx)}
                        className="size-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className={item.checked ? 'line-through text-muted-foreground' : ''}>
                        {item.title}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Diário de Campo / Notas */}
              <div>
                <h4 className="text-xs font-semibold text-foreground mb-1.5">
                  Diário Operacional da Vistoria
                </h4>
                <div className="max-h-36 overflow-y-auto space-y-1.5 rounded-md border border-border bg-background p-3 text-xs">
                  {selectedAcionamento.notes.map((n, i) => (
                    <p key={i} className="text-muted-foreground text-[11px] leading-relaxed">
                      {n}
                    </p>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Adicionar nota sobre a torre ou acesso..."
                    className="h-8 flex-1 rounded-md border border-input bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddNoteToSelected}
                    className="h-8 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border px-5 py-3 bg-muted/20 flex justify-between items-center text-xs">
              <span className="text-muted-foreground">
                Protocolo: {selectedAcionamento.protocol}
              </span>
              <button
                type="button"
                onClick={() => setSelectedAcionamento(null)}
                className="rounded-md border border-input bg-background px-3 py-1 text-xs font-medium text-foreground hover:bg-accent cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Despachar Novo Site (Torre) para Vistoria */}
      {isNewModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs"
        >
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border border-border bg-sidebar text-foreground shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-muted/20">
              <div className="flex items-center gap-2">
                <TowerIcon className="size-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Mandar Site (Torre) para Vistoria de Campo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSiteDemand} className="flex-1 overflow-y-auto p-5 space-y-3.5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    ID do Site / Torre *
                  </label>
                  <input
                    type="text"
                    required
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    placeholder="Ex: SP-SPO-0912"
                    className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Nome da Torre / Estação *
                  </label>
                  <input
                    type="text"
                    required
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="Ex: ERB Pinheiros Marginal"
                    className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Tipo de Estrutura
                  </label>
                  <select
                    value={towerType}
                    onChange={(e) => setTowerType(e.target.value as TowerType)}
                    className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  >
                    <option value="Autoportante">Autoportante</option>
                    <option value="Estaiada">Estaiada</option>
                    <option value="Rooftop (Topo de Prédio)">Rooftop (Topo de Prédio)</option>
                    <option value="Monopolo">Monopolo</option>
                    <option value="Greenfield (Solo Rural)">Greenfield (Solo Rural)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Altura da Torre (Metros)
                  </label>
                  <input
                    type="number"
                    value={towerHeightMeters}
                    onChange={(e) => setTowerHeightMeters(e.target.value)}
                    placeholder="Ex: 55"
                    className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Operadora / Detentora
                  </label>
                  <input
                    type="text"
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    placeholder="Ex: American Tower / Vivo"
                    className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Coordenadas GPS (Lat, Long)
                  </label>
                  <input
                    type="text"
                    value={coordinates}
                    onChange={(e) => setCoordinates(e.target.value)}
                    placeholder="Ex: -23.5505, -46.6333"
                    className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Endereço Completo do Site
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex: Av. das Nações Unidas, 4000 - São Paulo, SP"
                    className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Chave & Protocolo de Acesso
                  </label>
                  <input
                    type="text"
                    value={accessKeyProtocol}
                    onChange={(e) => setAccessKeyProtocol(e.target.value)}
                    placeholder="Ex: Cadeado segredo 8820"
                    className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Tipo de Vistoria
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as SurveyType)}
                    className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  >
                    <option value="Vistoria Estrutural">Vistoria Estrutural</option>
                    <option value="Vistoria de Infra & Energia">Vistoria de Infra & Energia</option>
                    <option value="Compartilhamento (Colocation)">Compartilhamento (Colocation)</option>
                    <option value="Auditoria Preventiva">Auditoria Preventiva</option>
                    <option value="Emergencial / Vandalismo">Emergencial / Vandalismo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Escopo Detalhado da Vistoria para os Vistoriadores *
                </label>
                <textarea
                  required
                  rows={3}
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Descreva os itens a vistoriar na torre, laudos solicitados e pontos de atenção para os executores..."
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="h-8 rounded-md border border-input px-3 text-xs font-medium text-foreground hover:bg-accent cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-8 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
                >
                  Despachar Site para Campo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
