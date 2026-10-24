import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  Plus,
  Radio,
  Search,
  User,
  X,
} from 'lucide-react';
import { Acionamento, AcionamentoPriority, AcionamentoType } from '../types';

interface AcionamentosViewProps {
  acionamentos: Acionamento[];
  onUpdateStatus: (id: string, status: Acionamento['status']) => void;
  onAddAcionamento: (item: Omit<Acionamento, 'id' | 'notes'>) => void;
  onOpenChatWithDispatcher: (responsibleId: string, protocol: string) => void;
  onBackHome: () => void;
}

export const AcionamentosView: React.FC<AcionamentosViewProps> = ({
  acionamentos,
  onUpdateStatus,
  onAddAcionamento,
  onOpenChatWithDispatcher,
  onBackHome,
}) => {
  const [filter, setFilter] = useState<'todos' | 'pendentes' | 'em_curso' | 'concluidos'>('todos');
  const [search, setSearch] = useState('');
  const [selectedAcionamento, setSelectedAcionamento] = useState<Acionamento | null>(null);
  const [newNote, setNewNote] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Form states for new Acionamento
  const [client, setClient] = useState('');
  const [unit, setUnit] = useState('');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [priority, setPriority] = useState<AcionamentoPriority>('Alta');
  const [type, setType] = useState<AcionamentoType>('Emergencial');
  const [problemDescription, setProblemDescription] = useState('');
  const [systemEquipment, setSystemEquipment] = useState('');

  const filtered = acionamentos.filter((a) => {
    const matchesSearch =
      a.protocol.toLowerCase().includes(search.toLowerCase()) ||
      a.client.toLowerCase().includes(search.toLowerCase()) ||
      a.problemDescription.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'pendentes') return a.status === 'Aguardando aceite';
    if (filter === 'em_curso')
      return (
        a.status === 'Aceito' ||
        a.status === 'Em deslocamento' ||
        a.status === 'No local' ||
        a.status === 'Em atendimento' ||
        a.status === 'Pausado'
      );
    if (filter === 'concluidos') return a.status === 'Concluído';
    return true;
  });

  const handleCreateAcionamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.trim() || !problemDescription.trim()) return;

    const nextProtocolNum = 1056 + acionamentos.length;
    onAddAcionamento({
      protocol: `AC-2026-00${nextProtocolNum}`,
      client: client.trim(),
      unit: unit.trim() || 'Sede Operacional',
      address: address.trim() || 'São Paulo - SP',
      contactName: contactName.trim() || 'Recepção / TI',
      contactPhone: contactPhone.trim() || '(11) 98000-0000',
      priority,
      type,
      status: 'Aguardando aceite',
      requestedAt: 'Hoje · Agora',
      slaLimit: priority === 'Crítica' ? '1h30 (SLA Crítico)' : '3h00 (SLA Normal)',
      slaRemainingMinutes: priority === 'Crítica' ? 90 : 180,
      problemDescription: problemDescription.trim(),
      systemEquipment: systemEquipment.trim() || 'Infraestrutura de Telecom',
      dispatcher: {
        responsibleId: 'resp-fernanda',
        name: 'Fernanda Costa',
        role: 'Coordenadora de Operações',
      },
    });

    setIsNewModalOpen(false);
    setClient('');
    setUnit('');
    setAddress('');
    setProblemDescription('');
    setSystemEquipment('');
  };

  const handleAddNoteToSelected = () => {
    if (!newNote.trim() || !selectedAcionamento) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    selectedAcionamento.notes.push(`${timeStr} - ${newNote.trim()}`);
    setNewNote('');
  };

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="size-5 text-amber-400" />
            <h1 className="text-xl font-semibold text-foreground">
              Acionamentos de Campo
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestão de chamadas técnicas, emergências, SLA e despacho operacional Ameta.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground px-3 text-xs font-medium cursor-pointer shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Novo acionamento</span>
          </button>
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

      {/* Controls: Search and Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por protocolo, cliente ou problema..."
            className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="inline-flex items-center gap-1 rounded-md border border-border bg-muted p-1">
          {(
            [
              { key: 'todos', label: 'Todos' },
              { key: 'pendentes', label: 'Aguardando aceite' },
              { key: 'em_curso', label: 'Em atendimento' },
              { key: 'concluidos', label: 'Concluídos' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`h-7 rounded px-2.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List of Acionamentos */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-md border border-border p-8 text-center text-sm text-muted-foreground">
            Nenhum acionamento encontrado para o filtro selecionado.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-md border border-border bg-background p-4 sm:p-5 hover:border-primary/40 transition-colors space-y-3"
            >
              {/* Header line */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-base text-foreground tabular-nums">
                    {item.protocol}
                  </span>
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${
                      item.priority === 'Crítica'
                        ? 'bg-red-500/20 text-red-400'
                        : item.priority === 'Alta'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}
                  >
                    {item.priority}
                  </span>
                  <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">
                    {item.type}
                  </span>
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                      item.status === 'Concluído'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : item.status === 'Em deslocamento'
                        ? 'bg-primary/20 text-primary'
                        : item.status === 'No local' || item.status === 'Em atendimento'
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="size-3.5 text-amber-400" />
                  <span>SLA: {item.slaLimit}</span>
                </div>
              </div>

              {/* Body Info */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.client}</p>
                  <p className="text-xs text-muted-foreground">{item.unit}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <MapPin className="size-3.5 text-primary shrink-0" />
                    <span>{item.address}</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Contato: <strong className="text-foreground">{item.contactName}</strong> ·{' '}
                    {item.contactPhone}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Equipamento: <span className="text-foreground">{item.systemEquipment}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Despachante: <span className="text-primary">{item.dispatcher.name}</span>
                  </p>
                </div>
              </div>

              <p className="text-xs text-foreground/90 bg-muted/20 p-2.5 rounded border border-border leading-relaxed">
                {item.problemDescription}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/70">
                <div className="flex flex-wrap items-center gap-2">
                  {item.status === 'Aguardando aceite' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(item.id, 'Aceito')}
                      className="inline-flex h-8 items-center gap-1 rounded bg-amber-500 hover:bg-amber-600 text-black px-3 text-xs font-semibold cursor-pointer"
                    >
                      <span>Aceitar acionamento</span>
                    </button>
                  )}

                  {item.status === 'Aceito' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(item.id, 'Em deslocamento')}
                      className="inline-flex h-8 items-center gap-1 rounded bg-primary hover:bg-primary/90 text-primary-foreground px-3 text-xs font-medium cursor-pointer"
                    >
                      <Navigation className="size-3.5" />
                      <span>Iniciar deslocamento</span>
                    </button>
                  )}

                  {item.status === 'Em deslocamento' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(item.id, 'No local')}
                      className="inline-flex h-8 items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white px-3 text-xs font-medium cursor-pointer"
                    >
                      <MapPin className="size-3.5" />
                      <span>Chegada no local</span>
                    </button>
                  )}

                  {(item.status === 'No local' || item.status === 'Pausado') && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(item.id, 'Em atendimento')}
                      className="inline-flex h-8 items-center gap-1 rounded bg-purple-600 hover:bg-purple-500 text-white px-3 text-xs font-medium cursor-pointer"
                    >
                      <span>Iniciar atendimento</span>
                    </button>
                  )}

                  {item.status === 'Em atendimento' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(item.id, 'Concluído')}
                      className="inline-flex h-8 items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white px-3 text-xs font-medium cursor-pointer"
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>Finalizar atendimento</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedAcionamento(item)}
                    className="inline-flex h-8 items-center justify-center rounded border border-input bg-background px-3 text-xs font-medium text-foreground hover:bg-accent cursor-pointer"
                  >
                    Ver detalhes e checklist
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onOpenChatWithDispatcher(
                      item.dispatcher.responsibleId,
                      item.protocol
                    )
                  }
                  className="inline-flex h-8 items-center gap-1.5 rounded border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 px-3 text-xs font-medium cursor-pointer"
                >
                  <MessageSquare className="size-3.5" />
                  <span>Falar com {item.dispatcher.name}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Detalhes do Acionamento & Histórico de Notas */}
      {selectedAcionamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setSelectedAcionamento(null)}
          />
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-md border border-border bg-sidebar p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-foreground tabular-nums">
                    {selectedAcionamento.protocol}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground font-semibold">
                    {selectedAcionamento.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Solicitado em {selectedAcionamento.requestedAt} · Limite {selectedAcionamento.slaLimit}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAcionamento(null)}
                aria-label="Fechar modal"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-md border border-border bg-background p-3 space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {selectedAcionamento.client}
                </p>
                <p className="text-muted-foreground">{selectedAcionamento.unit}</p>
                <p className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3 text-primary" />
                  <span>{selectedAcionamento.address}</span>
                </p>
                <p className="text-muted-foreground pt-1">
                  Contato local: <strong className="text-foreground">{selectedAcionamento.contactName}</strong> — {selectedAcionamento.contactPhone}
                </p>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-1">
                  Descrição detalhada do problema
                </p>
                <div className="rounded-md border border-border bg-background p-3 leading-relaxed text-foreground/90">
                  {selectedAcionamento.problemDescription}
                </div>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-1">
                  Equipamento / Sistema envolvido
                </p>
                <p className="text-muted-foreground bg-muted/30 p-2 rounded border border-border">
                  {selectedAcionamento.systemEquipment}
                </p>
              </div>

              {/* Notas e histórico */}
              <div>
                <p className="font-semibold text-foreground mb-1">
                  Histórico e atualizações de campo
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto rounded-md border border-border bg-background p-3">
                  {selectedAcionamento.notes.map((note, idx) => (
                    <p key={idx} className="text-muted-foreground text-[11px] leading-relaxed">
                      • {note}
                    </p>
                  ))}
                </div>

                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Adicionar nota técnica (ex: cheguei na portaria, retirando credencial)..."
                    className="h-8 flex-1 rounded border border-input bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={handleAddNoteToSelected}
                    className="h-8 rounded bg-secondary px-3 text-xs font-medium text-secondary-foreground hover:bg-accent cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-border pt-3">
              <button
                type="button"
                onClick={() => {
                  onOpenChatWithDispatcher(
                    selectedAcionamento.dispatcher.responsibleId,
                    selectedAcionamento.protocol
                  );
                  setSelectedAcionamento(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline cursor-pointer"
              >
                <MessageSquare className="size-3.5" />
                <span>Conversar com {selectedAcionamento.dispatcher.name}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAcionamento(null)}
                className="h-8 rounded-md bg-secondary px-4 text-xs font-medium text-secondary-foreground hover:bg-accent cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar Novo Acionamento */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setIsNewModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-md border border-border bg-sidebar p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-semibold text-foreground">
                Registrar Novo Acionamento
              </h2>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAcionamento} className="space-y-3 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-muted-foreground mb-1">Cliente *</label>
                  <input
                    type="text"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    placeholder="Ex: Grupo Atlântico Engenharia"
                    required
                    className="h-8 w-full rounded border border-input bg-background px-2.5 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Unidade / Setor</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Ex: Sede Paulista · Sala Técnica"
                    className="h-8 w-full rounded border border-input bg-background px-2.5 text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Endereço de Atendimento</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Av. Paulista, 1000 - Bela Vista, SP"
                  className="h-8 w-full rounded border border-input bg-background px-2.5 text-foreground"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-muted-foreground mb-1">Contato no Local</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ex: Eng. Roberto"
                    className="h-8 w-full rounded border border-input bg-background px-2.5 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Telefone de Contato</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Ex: (11) 99999-8888"
                    className="h-8 w-full rounded border border-input bg-background px-2.5 text-foreground"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-muted-foreground mb-1">Prioridade</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as AcionamentoPriority)}
                    className="h-8 w-full rounded border border-input bg-background px-2 text-foreground"
                  >
                    <option value="Crítica">Crítica (SLA 1h30)</option>
                    <option value="Alta">Alta (SLA 2h)</option>
                    <option value="Média">Média (SLA 4h)</option>
                    <option value="Normal">Normal (SLA 8h)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Tipo de Acionamento</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AcionamentoType)}
                    className="h-8 w-full rounded border border-input bg-background px-2 text-foreground"
                  >
                    <option value="Emergencial">Emergencial</option>
                    <option value="Corretiva">Corretiva</option>
                    <option value="Preventiva">Preventiva</option>
                    <option value="Suporte VIP">Suporte VIP</option>
                    <option value="Ronda Técnica">Ronda Técnica</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Equipamentos Envolvidos</label>
                <input
                  type="text"
                  value={systemEquipment}
                  onChange={(e) => setSystemEquipment(e.target.value)}
                  placeholder="Ex: Roteador BGP Cisco + Nobreak 5kVA"
                  className="h-8 w-full rounded border border-input bg-background px-2.5 text-foreground"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Descrição da Falha / Solicitação *</label>
                <textarea
                  rows={3}
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Detalhe o sintoma relatado pelo cliente ou NOC..."
                  required
                  className="w-full rounded border border-input bg-background p-2.5 text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="h-8 rounded border border-input px-3 font-medium text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-8 rounded bg-primary hover:bg-primary/90 text-primary-foreground px-4 font-medium cursor-pointer"
                >
                  Salvar e Notificar Despacho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
