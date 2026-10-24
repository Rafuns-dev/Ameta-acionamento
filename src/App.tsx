import React, { useEffect, useState } from 'react';
import {
  Acionamento,
  AgendaItem,
  AppNotification,
  ChatConversation,
  ChatMessage,
  IntegrationConfig,
  NavSection,
  ReportItem,
  ResponsiblePerson,
} from './types';
import {
  INITIAL_ACIONAMENTOS,
  INITIAL_AGENDA,
  INITIAL_CHATS,
  INITIAL_INTEGRATION_CONFIG,
  INITIAL_NOTIFICATIONS,
  INITIAL_REPORTS,
  INITIAL_RESPONSIBLES,
  USER_PROFILE,
} from './data/initialData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardHome } from './components/DashboardHome';
import { AcionamentosView } from './components/AcionamentosView';
import { AgendaView } from './components/AgendaView';
import { ChatResponsaveisView } from './components/ChatResponsaveisView';
import {
  AgendaDetailModal,
  ReportEditorModal,
  ReportsView,
} from './components/ReportsAndOthers';
import { HtmlExportModal } from './components/HtmlExportModal';
import { IntegrationModal } from './components/IntegrationModal';

export default function App() {
  const [theme, setTheme] = useState<'escuro' | 'claro'>(() => {
    try {
      const saved = localStorage.getItem('ameta:tema');
      if (saved === 'claro' || saved === 'escuro') return saved;
    } catch {
      // default dark
    }
    return 'escuro';
  });

  const [activeSection, setActiveSection] = useState<NavSection>(NavSection.INICIO);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data States
  const [acionamentos, setAcionamentos] = useState<Acionamento[]>(INITIAL_ACIONAMENTOS);
  const [agenda, setAgenda] = useState<AgendaItem[]>(INITIAL_AGENDA);
  const [responsibles] = useState<ResponsiblePerson[]>(INITIAL_RESPONSIBLES);
  const [chats, setChats] = useState<Record<string, ChatConversation>>(INITIAL_CHATS);
  const [activeResponsibleId, setActiveResponsibleId] = useState<string>('resp-fernanda');
  const [chatPrefillDraft, setChatPrefillDraft] = useState<string>('');
  const [reports, setReports] = useState<ReportItem[]>(INITIAL_REPORTS);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [selectedAgendaItem, setSelectedAgendaItem] = useState<AgendaItem | null>(null);
  const [editingReport, setEditingReport] = useState<ReportItem | null>(null);
  const [htmlModalOpen, setHtmlModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Integration with Central System (REST / Webhook / postMessage)
  const [integrationConfig, setIntegrationConfig] = useState<IntegrationConfig>(INITIAL_INTEGRATION_CONFIG);
  const [integrationModalOpen, setIntegrationModalOpen] = useState(false);

  // Listen for real postMessage demands from external iframe parent systems
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.tipo === 'NOVA_DEMANDA' && event.data?.demanda) {
        const d = event.data.demanda;
        handleAddAcionamento({
          protocol: `AC-2026-00${1060 + acionamentos.length}`,
          externalId: d.id_externo || 'EXT-SYNC',
          externalSystem: integrationConfig.systemName,
          syncedAt: 'Agora (via postMessage)',
          client: d.cliente || 'Cliente Sincronizado',
          unit: d.unidade || 'Unidade Principal',
          address: d.endereco || 'São Paulo - SP',
          contactName: d.contato_nome || 'Recepção',
          contactPhone: d.contato_telefone || '(11) 98000-0000',
          priority: d.prioridade || 'Alta',
          type: d.tipo || 'Emergencial',
          status: 'Aguardando aceite',
          requestedAt: 'Hoje · Agora',
          slaLimit: '2h00 (SLA Externo)',
          slaRemainingMinutes: 120,
          problemDescription: d.descricao || 'Demanda recebida via integração postMessage.',
          systemEquipment: d.equipamento || 'Infraestrutura Geral',
          dispatcher: {
            responsibleId: 'resp-fernanda',
            name: 'Fernanda Costa (Despacho Central)',
            role: 'Coordenação de Operações',
          },
        });
        showToast(`Demanda ${d.id_externo || ''} recebida do sistema central!`);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [acionamentos.length, integrationConfig.systemName]);

  const handleManualSync = () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    setIntegrationConfig((prev) => ({
      ...prev,
      lastSyncTime: `Hoje às ${timeStr}`,
      syncLogs: [
        {
          id: `sync-${Date.now()}`,
          time: timeStr,
          direction: 'outbound',
          event: 'Sincronização manual executada',
          status: 'sucesso',
          details: `${acionamentos.length} demandas conferidas. Conexão com ${prev.systemName} ativa (200 OK).`,
          payloadSummary: 'Status sincronizados com sucesso.',
        },
        ...prev.syncLogs,
      ],
    }));
    showToast('Sincronização com o sistema central concluída (200 OK)!');
  };

  const handleSimulateInboundDemand = () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const nextProtocol = `AC-2026-00${1060 + acionamentos.length}`;
    const externalTkt = `TKT-2026-${Math.floor(9000 + Math.random() * 999)}`;

    const newDemand: Acionamento = {
      id: `ac-${Date.now()}`,
      protocol: nextProtocol,
      externalId: externalTkt,
      externalSystem: integrationConfig.systemName,
      syncedAt: `Hoje · ${timeStr}`,
      client: 'Rede Drogaria São Paulo',
      unit: 'Loja 142 · Faria Lima',
      address: 'Av. Brig. Faria Lima, 2232 - Itaim Bibi, São Paulo - SP',
      contactName: 'Julio Cezar (Gerente Operacional)',
      contactPhone: '(11) 98111-2233',
      priority: 'Crítica',
      type: 'Emergencial',
      status: 'Aguardando aceite',
      requestedAt: `Hoje · ${timeStr}`,
      slaLimit: '2h00 (SLA Crítico)',
      slaRemainingMinutes: 120,
      problemDescription: 'Queda total no switch PoE das câmeras e terminais de caixa PDV. Clientes sem atendimento no balcão.',
      systemEquipment: 'Switch Cisco SG350-28P + Nobreak APC Smart-UPS 1500VA',
      dispatcher: {
        responsibleId: 'resp-fernanda',
        name: 'Fernanda Costa',
        role: 'Coordenadora de Operações',
      },
      notes: [
        `${timeStr} - Demanda despachada automaticamente pelo ${integrationConfig.systemName}.`,
        `${timeStr} - Notificação enviada ao técnico Rafael.`,
      ],
    };

    setAcionamentos((prev) => [newDemand, ...prev]);

    setIntegrationConfig((prev) => ({
      ...prev,
      lastSyncTime: `Hoje às ${timeStr}`,
      syncLogs: [
        {
          id: `sync-${Date.now()}`,
          time: `${timeStr}:00`,
          direction: 'inbound',
          event: 'Nova demanda despachada via API',
          status: 'sucesso',
          details: `Demanda ${externalTkt} recebida de ${prev.systemName}.`,
          payloadSummary: `${nextProtocol} · Rede Drogaria SP · SLA 2h`,
        },
        ...prev.syncLogs,
      ],
    }));

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: `🚨 Demanda urgente: ${externalTkt}`,
        detail: `Rede Drogaria SP · Despachada pelo ${integrationConfig.systemName}`,
        time: 'Agora mesmo',
        read: false,
        actionUrl: NavSection.ACIONAMENTOS,
      },
      ...prev,
    ]);

    showToast(`Nova demanda recebida do ${integrationConfig.systemName}!`);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'escuro');
    root.dataset.tema = theme;
    try {
      localStorage.setItem('ameta:tema', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2800);
  };

  const activeAcionamentosCount = acionamentos.filter((a) => a.status !== 'Concluído').length;
  const unreadChatCount = Object.values(chats).reduce((acc, c) => acc + (c.unread || 0), 0);
  const racDraftCount = reports.filter((r) => r.type === 'RAC' && r.status === 'Rascunho').length;
  const ratDraftCount = reports.filter((r) => r.type === 'RAT' && r.status === 'Rascunho').length;

  /* ==========================================================================
     HANDLERS: ACIONAMENTOS
  ========================================================================== */
  const handleUpdateAcionamentoStatus = (
    id: string,
    status: Acionamento['status']
  ) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    setAcionamentos((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updatedNotes = [...item.notes];
        if (status === 'Aceito') {
          updatedNotes.push(`${timeStr} - Acionamento aceito pelo técnico ${USER_PROFILE.shortName}.`);
        } else if (status === 'Em deslocamento') {
          updatedNotes.push(`${timeStr} - Deslocamento iniciado via app operacional.`);
        } else if (status === 'No local') {
          updatedNotes.push(`${timeStr} - Chegada e check-in no cliente confirmados.`);
        } else if (status === 'Concluído') {
          updatedNotes.push(`${timeStr} - Atendimento finalizado e testado.`);
        }

        return {
          ...item,
          status,
          notes: updatedNotes,
          checkinTime: status === 'No local' ? timeStr : item.checkinTime,
          checkoutTime: status === 'Concluído' ? timeStr : item.checkoutTime,
        };
      })
    );

    showToast(`Acionamento atualizado para "${status}".`);
  };

  const handleAddAcionamento = (newItem: Omit<Acionamento, 'id' | 'notes'>) => {
    const created: Acionamento = {
      ...newItem,
      id: `ac-${Date.now()}`,
      notes: [
        `Agora - Acionamento ${newItem.protocol} registrado no sistema Ameta.`,
      ],
    };
    setAcionamentos((prev) => [created, ...prev]);

    // Also notify
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: `Novo acionamento ${created.protocol}`,
        detail: `${created.client} · Prioridade ${created.priority}`,
        time: 'Agora',
        read: false,
        actionUrl: NavSection.ACIONAMENTOS,
      },
      ...prev,
    ]);

    showToast(`Acionamento ${created.protocol} registrado com sucesso.`);
  };

  /* ==========================================================================
     HANDLERS: AGENDA
  ========================================================================== */
  const handleAddAgendaItem = (newItem: Omit<AgendaItem, 'id'>) => {
    const created: AgendaItem = {
      ...newItem,
      id: `ag-${Date.now()}`,
    };
    setAgenda((prev) => [...prev, created]);
    showToast(`Agendamento ${created.code} incluído na sua agenda.`);
  };

  const handleUpdateAgendaStatus = (id: string, status: AgendaItem['status']) => {
    setAgenda((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
    setSelectedAgendaItem((prev) =>
      prev && prev.id === id ? { ...prev, status } : prev
    );
    showToast(`Status da agenda alterado para "${status}".`);
  };

  /* ==========================================================================
     HANDLERS: CHAT COM RESPONSÁVEIS
  ========================================================================== */
  const handleStartChatWith = (responsibleId: string, prefillMessage: string = '') => {
    setActiveResponsibleId(responsibleId);
    setChatPrefillDraft(prefillMessage);
    // Clear unread for this responsible
    setChats((prev) => {
      const cur = prev[responsibleId];
      if (!cur) return prev;
      return {
        ...prev,
        [responsibleId]: {
          ...cur,
          unread: 0,
        },
      };
    });
    setActiveSection(NavSection.CHAT_RESPONSAVEIS);
  };

  const handleSendMessage = (
    responsibleId: string,
    text: string,
    relatedAcionamento?: string
  ) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'user-rafael',
      senderName: USER_PROFILE.shortName,
      role: 'Técnico',
      text,
      time: timeStr,
      fromMe: true,
      relatedAcionamentoProtocol: relatedAcionamento,
    };

    setChats((prev) => {
      const cur = prev[responsibleId] || {
        responsibleId,
        unread: 0,
        lastMessage: '',
        lastMessageTime: '',
        messages: [],
      };
      return {
        ...prev,
        [responsibleId]: {
          ...cur,
          lastMessage: text,
          lastMessageTime: timeStr,
          messages: [...cur.messages, newMsg],
        },
      };
    });

    // Realistic automated reply from the responsible person
    setTimeout(() => {
      const resp = responsibles.find((r) => r.id === responsibleId);
      if (!resp) return;

      const replyTime = `${String(new Date().getHours()).padStart(2, '0')}:${String(
        new Date().getMinutes()
      ).padStart(2, '0')}`;

      let replyText = `Ciente, Rafael! Mensagem registrada pelo plantão. Qualquer novidade no local me chame imediatamente.`;

      if (text.includes('chegar no local') || text.includes('Cheguei')) {
        replyText = `Ótimo, Rafael! Check-in registrado no sistema da Ameta. Lembre-se de coletar o nome do responsável predial antes de iniciar.`;
      } else if (text.includes('N3') || text.includes('apoio')) {
        replyText = `Recebido! Já estou abrindo a telemetria do switch e conferindo a potência óptica no Zabbix aqui pelo NOC.`;
      } else if (text.includes('trânsito')) {
        replyText = `Sem problemas, já informei o cliente sobre a previsão de 15 minutos. Dirija com calma e em segurança.`;
      } else if (text.includes('finalizado')) {
        replyText = `Excelente trabalho! Pode preencher o RAC e RAT para formalizarmos a baixa técnica do chamado.`;
      }

      const autoMsg: ChatMessage = {
        id: `msg-resp-${Date.now()}`,
        senderId: resp.id,
        senderName: resp.name,
        role: resp.role,
        text: replyText,
        time: replyTime,
        fromMe: false,
        relatedAcionamentoProtocol: relatedAcionamento,
      };

      setChats((prev) => {
        const cur = prev[responsibleId];
        if (!cur) return prev;
        return {
          ...prev,
          [responsibleId]: {
            ...cur,
            lastMessage: replyText,
            lastMessageTime: replyTime,
            messages: [...cur.messages, autoMsg],
          },
        };
      });

      showToast(`Nova resposta de ${resp.name}.`);
    }, 1300);
  };

  /* ==========================================================================
     HANDLERS: RELATÓRIOS
  ========================================================================== */
  const handleContinueReport = (type: 'RAC' | 'RAT') => {
    const firstDraft = reports.find((r) => r.type === type && r.status === 'Rascunho');
    if (firstDraft) {
      setEditingReport(firstDraft);
    } else {
      showToast(`Todos os relatórios ${type} estão finalizados.`);
    }
  };

  const handleSaveReport = (id: string, summary: string, finalize: boolean) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              summary,
              status: finalize ? 'Enviado' : 'Rascunho',
              updatedAt: 'Agora mesmo',
            }
          : r
      )
    );
    setEditingReport(null);
    showToast(finalize ? 'Relatório concluído e enviado!' : 'Rascunho salvo.');
  };

  return (
    <div className="flex h-svh min-h-0 w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar with Acionamentos, Agenda, and Chat com responsáveis */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        activeAcionamentosCount={activeAcionamentosCount}
        unreadChatCount={unreadChatCount}
      />

      {/* Main Area */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <Header
          activeSection={activeSection}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'escuro' ? 'claro' : 'escuro'))}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          notifications={notifications}
          onMarkAllNotificationsRead={() =>
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
          }
          onOpenHtmlModal={() => setHtmlModalOpen(true)}
          onOpenIntegrationModal={() => setIntegrationModalOpen(true)}
          onNavigate={setActiveSection}
        />

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
          {activeSection === NavSection.INICIO && (
            <DashboardHome
              agenda={agenda}
              acionamentos={acionamentos}
              responsibles={responsibles}
              reports={reports}
              unreadMessagesCount={unreadChatCount}
              onNavigate={setActiveSection}
              onOpenAcionamentoDetail={(item) => {
                setActiveSection(NavSection.ACIONAMENTOS);
              }}
              onOpenAgendaDetail={(item) => setSelectedAgendaItem(item)}
              onStartChatWith={handleStartChatWith}
              onUpdateAcionamentoStatus={handleUpdateAcionamentoStatus}
              onContinueReport={handleContinueReport}
            />
          )}

          {activeSection === NavSection.ACIONAMENTOS && (
            <AcionamentosView
              acionamentos={acionamentos}
              onUpdateStatus={handleUpdateAcionamentoStatus}
              onAddAcionamento={handleAddAcionamento}
              onOpenChatWithDispatcher={(respId, protocol) =>
                handleStartChatWith(
                  respId,
                  `Olá, sobre o acionamento ${protocol}: `
                )
              }
              onBackHome={() => setActiveSection(NavSection.INICIO)}
            />
          )}

          {activeSection === NavSection.AGENDA && (
            <AgendaView
              agenda={agenda}
              onOpenDetail={(item) => setSelectedAgendaItem(item)}
              onAddAgendaItem={handleAddAgendaItem}
              onUpdateStatus={handleUpdateAgendaStatus}
              onNavigateToAcionamento={(protocol) => {
                setActiveSection(NavSection.ACIONAMENTOS);
              }}
              onBackHome={() => setActiveSection(NavSection.INICIO)}
            />
          )}

          {activeSection === NavSection.CHAT_RESPONSAVEIS && (
            <ChatResponsaveisView
              responsibles={responsibles}
              chats={chats}
              activeResponsibleId={activeResponsibleId}
              onSelectResponsible={(id) => {
                setActiveResponsibleId(id);
                setChats((prev) => {
                  const cur = prev[id];
                  if (!cur) return prev;
                  return { ...prev, [id]: { ...cur, unread: 0 } };
                });
              }}
              onSendMessage={handleSendMessage}
              prefillDraft={chatPrefillDraft}
              onBackHome={() => setActiveSection(NavSection.INICIO)}
            />
          )}

        </main>

        {/* Discreet Footer */}
        <footer className="shrink-0 border-t border-border bg-background px-4 py-3 text-center text-xs text-muted-foreground">
          © Ameta 2026
        </footer>

        {/* Feedback Toast */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-12 right-5 z-50 rounded-md border border-border bg-sidebar px-3.5 py-2.5 text-xs font-medium text-foreground shadow-lg animate-in fade-in"
          >
            {toastMessage}
          </div>
        )}
      </div>

      {/* Modals */}
      <AgendaDetailModal
        item={selectedAgendaItem}
        onClose={() => setSelectedAgendaItem(null)}
        onUpdateStatus={handleUpdateAgendaStatus}
        onOpenAcionamento={(protocol) => setActiveSection(NavSection.ACIONAMENTOS)}
      />

      <ReportEditorModal
        report={editingReport}
        onClose={() => setEditingReport(null)}
        onSaveReport={handleSaveReport}
      />

      <HtmlExportModal
        open={htmlModalOpen}
        onClose={() => setHtmlModalOpen(false)}
      />

      <IntegrationModal
        open={integrationModalOpen}
        onClose={() => setIntegrationModalOpen(false)}
        config={integrationConfig}
        onUpdateConfig={(updates) => setIntegrationConfig((prev) => ({ ...prev, ...updates }))}
        onManualSync={handleManualSync}
        onSimulateInboundDemand={handleSimulateInboundDemand}
      />
    </div>
  );
}
