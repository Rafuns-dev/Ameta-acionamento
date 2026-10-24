import React, { useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Plus,
  Radio,
  Search,
  User,
  X,
} from 'lucide-react';
import { AgendaItem } from '../types';

interface AgendaViewProps {
  agenda: AgendaItem[];
  onOpenDetail: (item: AgendaItem) => void;
  onAddAgendaItem: (item: Omit<AgendaItem, 'id'>) => void;
  onUpdateStatus: (id: string, status: AgendaItem['status']) => void;
  onNavigateToAcionamento?: (protocol: string) => void;
  onBackHome: () => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  agenda,
  onOpenDetail,
  onAddAgendaItem,
  onUpdateStatus,
  onNavigateToAcionamento,
  onBackHome,
}) => {
  const [filter, setFilter] = useState<'todos' | 'hoje' | 'concluidos'>('hoje');
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [time, setTime] = useState('14:30');
  const [date, setDate] = useState('Hoje');
  const [client, setClient] = useState('');
  const [location, setLocation] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [acionamentoRef, setAcionamentoRef] = useState('');

  const filtered = agenda.filter((item) => {
    const matchesSearch =
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.client.toLowerCase().includes(search.toLowerCase()) ||
      item.title.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'concluidos') return item.status === 'Concluído';
    if (filter === 'hoje') return item.date === 'Hoje';
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.trim() || !title.trim()) return;

    const nextNum = 300 + agenda.length;
    onAddAgendaItem({
      code: `AG-2026-000${nextNum}`,
      time,
      date,
      client: client.trim(),
      location: location.trim() || 'São Paulo - SP',
      title: title.trim(),
      status: 'Confirmado',
      acionamentoRef: acionamentoRef.trim() || undefined,
      responsible: 'Rafael De Lima Araujo (Técnico)',
      notes: notes.trim() || 'Agendamento adicionado ao cronograma técnico.',
    });

    setIsAddModalOpen(false);
    setClient('');
    setLocation('');
    setTitle('');
    setNotes('');
    setAcionamentoRef('');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="size-5 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">
              Agenda Técnica
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Programação de visitas, manutenções preventivas e janelas de atendimento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground px-3 text-xs font-medium cursor-pointer shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Novo agendamento</span>
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

      {/* Filters and Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, cliente ou serviço..."
            className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="inline-flex items-center gap-1 rounded-md border border-border bg-muted p-1">
          {(
            [
              { key: 'hoje', label: 'Hoje' },
              { key: 'todos', label: 'Todos os agendamentos' },
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

      {/* Timeline items */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-md border border-border p-8 text-center text-sm text-muted-foreground">
            Nenhum agendamento encontrado para o filtro selecionado.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-md border border-border bg-background p-4 sm:p-5 hover:border-primary/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-sm text-foreground tabular-nums">
                    {item.time}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {item.code}
                  </span>
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                      item.status === 'Concluído'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : item.status === 'Confirmado'
                        ? 'bg-primary/15 text-primary'
                        : 'bg-amber-500/15 text-amber-400'
                    }`}
                  >
                    {item.status}
                  </span>
                  {item.acionamentoRef && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      <Radio className="size-3" />
                      <span>{item.acionamentoRef}</span>
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-foreground">
                  {item.title}
                </p>

                <p className="text-xs text-muted-foreground">
                  {item.client}
                </p>

                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 text-primary shrink-0" />
                  <span>{item.location}</span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2 shrink-0 border-t sm:border-t-0 border-border/70 pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={() => onOpenDetail(item)}
                  className="inline-flex h-8 items-center gap-1.5 rounded border border-input bg-background px-3 text-xs font-medium text-foreground hover:bg-accent cursor-pointer"
                >
                  <span>Ver detalhes</span>
                </button>

                {item.status !== 'Concluído' ? (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(item.id, 'Concluído')}
                    className="inline-flex h-8 items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white px-3 text-xs font-medium cursor-pointer"
                  >
                    <CheckCircle2 className="size-3.5" />
                    <span>Concluir visita</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" />
                    <span>Check-out realizado</span>
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Novo Agendamento */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-md border border-border bg-sidebar p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-semibold text-foreground">
                Agendar Novo Atendimento
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-muted-foreground mb-1">Horário *</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="h-8 w-full rounded border border-input bg-background px-2.5 text-foreground tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Data</label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="Ex: Hoje ou 24/10/2026"
                    className="h-8 w-full rounded border border-input bg-background px-2.5 text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Cliente / Unidade *</label>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Ex: Hospital Santa Helena — Ala Norte"
                  required
                  className="h-8 w-full rounded border border-input bg-background px-2.5 text-foreground"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Título do Serviço *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Manutenção periódica de gerador e nobreak"
                  required
                  className="h-8 w-full rounded border border-input bg-background px-2.5 text-foreground"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Endereço Completo</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Rua Maestro Cardim, 769 - Bela Vista, SP"
                  className="h-8 w-full rounded border border-input bg-background px-2.5 text-foreground"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Vincular a Acionamento (opcional)</label>
                <input
                  type="text"
                  value={acionamentoRef}
                  onChange={(e) => setAcionamentoRef(e.target.value)}
                  placeholder="Ex: AC-2026-001055"
                  className="h-8 w-full rounded border border-input bg-background px-2.5 text-foreground"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Observações do Agendamento</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Orientações para portaria, crachá, ferramentas necessárias..."
                  className="w-full rounded border border-input bg-background p-2.5 text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="h-8 rounded border border-input px-3 font-medium text-muted-foreground hover:bg-accent cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-8 rounded bg-primary hover:bg-primary/90 text-primary-foreground px-4 font-medium cursor-pointer"
                >
                  Salvar na Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
