import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  Info,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  Radio,
  Search,
  Send,
  ShieldAlert,
  User,
  Wrench,
} from 'lucide-react';
import { ChatConversation, ChatMessage, ResponsiblePerson } from '../types';

interface ChatResponsaveisViewProps {
  responsibles: ResponsiblePerson[];
  chats: Record<string, ChatConversation>;
  activeResponsibleId: string;
  onSelectResponsible: (id: string) => void;
  onSendMessage: (responsibleId: string, text: string, relatedAcionamento?: string) => void;
  prefillDraft?: string;
  onBackHome: () => void;
}

export const ChatResponsaveisView: React.FC<ChatResponsaveisViewProps> = ({
  responsibles,
  chats,
  activeResponsibleId,
  onSelectResponsible,
  onSendMessage,
  prefillDraft = '',
  onBackHome,
}) => {
  const [draft, setDraft] = useState(prefillDraft);
  const [search, setSearch] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState<string>('AC-2026-001052');

  const activeResponsible =
    responsibles.find((r) => r.id === activeResponsibleId) || responsibles[0];

  const currentChat = chats[activeResponsible.id] || {
    responsibleId: activeResponsible.id,
    unread: 0,
    lastMessage: '',
    lastMessageTime: '',
    messages: [],
  };

  const filteredResponsibles = responsibles.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.role.toLowerCase().includes(search.toLowerCase()) ||
    r.department.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!draft.trim()) return;
    onSendMessage(activeResponsible.id, draft.trim(), selectedProtocol || undefined);
    setDraft('');
  };

  const handleQuickAction = (quickText: string) => {
    onSendMessage(activeResponsible.id, quickText, selectedProtocol);
  };

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">
              Chat Interno com Responsáveis
            </h1>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Canal direto com coordenação de campo, supervisão técnica N3 e despacho NOC 24h.
          </p>
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

      {/* Main Chat Interface Split */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr] rounded-md border border-border bg-sidebar overflow-hidden min-h-[580px]">
        {/* Left Column: Responsáveis List */}
        <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-border bg-sidebar">
          {/* Search Box */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar responsável ou setor..."
                className="h-8 w-full rounded border border-input bg-background pl-8 pr-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 divide-y divide-border overflow-y-auto max-h-[220px] lg:max-h-[520px]">
            {filteredResponsibles.map((resp) => {
              const chat = chats[resp.id];
              const isSelected = resp.id === activeResponsible.id;
              const unread = chat?.unread || 0;

              return (
                <button
                  key={resp.id}
                  type="button"
                  onClick={() => onSelectResponsible(resp.id)}
                  className={`w-full p-3 text-left transition-colors flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'hover:bg-accent/50'
                  }`}
                >
                  {/* Avatar with status indicator */}
                  <div className="relative size-9 rounded-full bg-secondary text-foreground font-semibold text-xs flex items-center justify-center shrink-0">
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

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {resp.name}
                      </span>
                      {chat?.lastMessageTime && (
                        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                          {chat.lastMessageTime}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {resp.role}
                    </p>
                    {chat?.lastMessage && (
                      <p className="text-[11px] text-foreground/80 truncate mt-1">
                        {chat.lastMessage}
                      </p>
                    )}
                  </div>

                  {unread > 0 && (
                    <span className="shrink-0 size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center tabular-nums">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Conversation */}
        <div className="flex flex-col bg-background min-h-[460px]">
          {/* Header of active responsible */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-sidebar/50 p-3 sm:px-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative size-10 rounded-full bg-secondary flex items-center justify-center font-semibold text-sm text-foreground shrink-0">
                {activeResponsible.name.charAt(0)}
                <span
                  className={`absolute bottom-0 right-0 size-3 rounded-full border border-background ${
                    activeResponsible.status === 'online'
                      ? 'bg-emerald-500'
                      : activeResponsible.status === 'ausente'
                      ? 'bg-amber-500'
                      : 'bg-zinc-500'
                  }`}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-foreground truncate">
                    {activeResponsible.name}
                  </h2>
                  <span className="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/20 text-primary">
                    {activeResponsible.badge}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {activeResponsible.role} · {activeResponsible.shift}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="hidden sm:inline flex items-center gap-1">
                <Phone className="size-3 text-primary" />
                <span>{activeResponsible.phone}</span>
              </span>
            </div>
          </div>

          {/* Context Banner: Vinculação de Acionamento */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/40 px-3 py-1.5 border-b border-border text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Radio className="size-3.5 text-amber-400" />
              <span>Vincular acionamento nesta conversa:</span>
            </div>
            <select
              value={selectedProtocol}
              onChange={(e) => setSelectedProtocol(e.target.value)}
              className="h-6 rounded border border-input bg-background px-2 text-[11px] text-foreground"
            >
              <option value="AC-2026-001052">AC-2026-001052 · Centro Logístico Sul (Emergencial)</option>
              <option value="AC-2026-001055">AC-2026-001055 · Hospital Santa Helena (Crítico)</option>
              <option value="AC-2026-001048">AC-2026-001048 · Centro Logístico Sul (Preventiva)</option>
              <option value="">Nenhum (Mensagem geral)</option>
            </select>
          </div>

          {/* Message Stream */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4 max-h-[380px]">
            {currentChat.messages.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Inicie uma conversa direta com {activeResponsible.name}.
              </div>
            ) : (
              currentChat.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] sm:max-w-[70%] rounded-md border p-3 text-xs space-y-1 ${
                    msg.fromMe
                      ? 'ml-auto border-primary/30 bg-primary/10 text-foreground'
                      : 'mr-auto border-border bg-sidebar text-foreground'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3 text-[10px] text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {msg.senderName} {msg.fromMe ? '(Você)' : `· ${msg.role}`}
                    </span>
                    <span className="tabular-nums">{msg.time}</span>
                  </div>

                  {msg.relatedAcionamentoProtocol && (
                    <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded w-fit">
                      <Radio className="size-2.5" />
                      <span>Ref: {msg.relatedAcionamentoProtocol}</span>
                    </div>
                  )}

                  <p className="leading-relaxed text-foreground whitespace-pre-wrap">
                    {msg.text}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="border-t border-border bg-muted/20 px-3 py-2 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] text-muted-foreground font-medium mr-1">
              Ações rápidas:
            </span>
            <button
              type="button"
              onClick={() =>
                handleQuickAction(
                  `Confirmo que acabei de chegar no local para atendimento do acionamento ${selectedProtocol || 'de campo'}. Acessando a sala técnica agora.`
                )
              }
              className="inline-flex items-center gap-1 rounded bg-secondary hover:bg-accent px-2 py-1 text-[11px] text-secondary-foreground transition-colors cursor-pointer"
            >
              <MapPin className="size-3 text-emerald-400" />
              <span>Cheguei no local</span>
            </button>
            <button
              type="button"
              onClick={() =>
                handleQuickAction(
                  `Solicito apoio da Engenharia / N3 para conferência dos parâmetros ópticos do acionamento ${selectedProtocol || 'em andamento'}.`
                )
              }
              className="inline-flex items-center gap-1 rounded bg-secondary hover:bg-accent px-2 py-1 text-[11px] text-secondary-foreground transition-colors cursor-pointer"
            >
              <Wrench className="size-3 text-primary" />
              <span>Pedir apoio N3</span>
            </button>
            <button
              type="button"
              onClick={() =>
                handleQuickAction(
                  `Aviso operacional: estou retido no trânsito na Marginal Pinheiros. Previsão de chegada estimada em 15 minutos.`
                )
              }
              className="inline-flex items-center gap-1 rounded bg-secondary hover:bg-accent px-2 py-1 text-[11px] text-secondary-foreground transition-colors cursor-pointer"
            >
              <Clock className="size-3 text-amber-400" />
              <span>Avisar trânsito</span>
            </button>
            <button
              type="button"
              onClick={() =>
                handleQuickAction(
                  `Atendimento e testes finalizados com êxito. Sistema estabilizado, gerando relatório RAC/RAT.`
                )
              }
              className="inline-flex items-center gap-1 rounded bg-secondary hover:bg-accent px-2 py-1 text-[11px] text-secondary-foreground transition-colors cursor-pointer"
            >
              <Check className="size-3 text-emerald-400" />
              <span>Atendimento finalizado</span>
            </button>
          </div>

          {/* Input field */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-border p-3 bg-sidebar"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Escreva uma mensagem para ${activeResponsible.name}...`}
              className="h-9 flex-1 rounded border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="inline-flex h-9 items-center gap-1.5 rounded bg-primary hover:bg-primary/90 text-primary-foreground px-4 text-xs font-medium cursor-pointer disabled:opacity-50"
            >
              <Send className="size-3.5" />
              <span>Enviar</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
