import React, { useEffect, useState } from 'react';
import {
  Acionamento,
  AgendaItem,
  AppNotification,
  ChatConversation,
  ChatMessage,
  Executor,
  IntegrationConfig,
  NavSection,
  ReportItem,
  ResponsiblePerson,
  SiteDocument,
} from './types';
import {
  INITIAL_ACIONAMENTOS,
  INITIAL_AGENDA,
  INITIAL_CHATS,
  INITIAL_EXECUTORS_POOL,
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
import { DeslocamentoModal } from './components/DeslocamentoModal';

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

  // Core Data States - Telecom Sites, Towers, and Field Teams
  const [acionamentos, setAcionamentos] = useState<Acionamento[]>(INITIAL_ACIONAMENTOS);
  const [agenda, setAgenda] = useState<AgendaItem[]>(INITIAL_AGENDA);
  const [responsibles] = useState<ResponsiblePerson[]>(INITIAL_RESPONSIBLES);
  const [executors, setExecutors] = useState<Executor[]>(INITIAL_EXECUTORS_POOL);
  const [chats, setChats] = useState<Record<string, ChatConversation>>(INITIAL_CHATS);
  const [activeResponsibleId, setActiveResponsibleId] = useState<string>('resp-fernanda');
  const [chatPrefillDraft, setChatPrefillDraft] = useState<string>('');
  const [reports, setReports] = useState<ReportItem[]>(INITIAL_REPORTS);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  // Modals
  const [selectedAgendaItem, setSelectedAgendaItem] = useState<AgendaItem | null>(null);
  const [editingReport, setEditingReport] = useState<ReportItem | null>(null);
  const [htmlModalOpen, setHtmlModalOpen] = useState(false);
  const [deslocamentoModalOpen, setDeslocamentoModalOpen] = useState(false);
  const [selectedDeslocamentoSite, setSelectedDeslocamentoSite] = useState<Acionamento | null>(null);
  const [acionamentosInitialFilter, setAcionamentosInitialFilter] = useState<
    'todos' | 'restantes' | 'em_deslocamento' | 'em_curso' | 'concluidos'
  >('todos');
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
          externalId: d.id_externo || 'SITE-EXT-SYNC',
          externalSystem: integrationConfig.systemName,
          syncedAt: 'Agora (via postMessage)',
          siteId: d.site_id || `SP-SPO-${Math.floor(1000 + Math.random() * 9000)}`,
          siteName: d.site_nome || d.torre || 'Torre Telecom Sincronizada',
          towerType: d.tipo_torre || 'Autoportante',
          towerHeightMeters: d.altura_metros || 50,
          operator: d.operadora || 'American Tower / Vivo',
          coordinates: d.coordenadas || '-23.5505, -46.6333',
          address: d.endereco || 'São Paulo - SP',
          accessKeyProtocol: d.chave_acesso || 'Cadeado segredo 8820',
          contactName: d.contato_nome || 'NOC Central',
          contactPhone: d.contato_telefone || '(11) 98000-0000',
          priority: d.prioridade || 'Alta',
          type: d.tipo_vistoria || 'Vistoria Estrutural',
          status: 'Aguardando aceite',
          requestedAt: 'Hoje · Agora',
          slaLimit: '2h00 (SLA Externo)',
          slaRemainingMinutes: 120,
          problemDescription: d.descricao || 'Demanda de vistoria recebida via integração postMessage.',
          systemEquipment: d.equipamento || 'Torre Telecom + Infra de Energia',
          dispatcher: {
            responsibleId: 'resp-fernanda',
            name: 'Fernanda Costa (Despacho Central)',
            role: 'Coordenação de Vistorias e Rotas',
          },
          executors: [executors[0]],
          documents: [],
        });
        showToast(`Nova demanda de torre ${d.site_id || ''} recebida do sistema central!`);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [acionamentos.length, integrationConfig.systemName, executors]);

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
          event: 'Sincronização manual de vistorias em sites',
          status: 'sucesso',
          details: `${acionamentos.length} sites conferidos. Conexão com ${prev.systemName} ativa (200 OK).`,
          payloadSummary: 'Status dos sites e vistorias transmitidos com sucesso.',
        },
        ...prev.syncLogs,
      ],
    }));
    showToast('Sincronização de sites com o sistema central concluída (200 OK)!');
  };

  const handleSimulateInboundDemand = () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const nextProtocol = `AC-2026-00${1060 + acionamentos.length}`;
    const externalTkt = `SITE-SP-${Math.floor(9000 + Math.random() * 999)}`;

    const newDemand: Acionamento = {
      id: `ac-${Date.now()}`,
      protocol: nextProtocol,
      externalId: externalTkt,
      externalSystem: integrationConfig.systemName,
      syncedAt: `Hoje · ${timeStr}`,
      siteId: 'SP-SAN-0420',
      siteName: 'Torre Santos Ponta da Praia (ERB 0420)',
      towerType: 'Autoportante',
      towerHeightMeters: 60,
      operator: 'American Tower / Vivo',
      coordinates: '-23.9820, -46.3080',
      address: 'Av. Saldanha da Gama, 140 - Ponta da Praia, Santos - SP',
      accessKeyProtocol: 'Cadeado Papaiz segredo 9110 (Portão da Marina)',
      contactName: 'Luciano Prado (Supervisão Regional Litoral)',
      contactPhone: '(13) 98111-2233',
      priority: 'Crítica',
      type: 'Vistoria Estrutural',
      status: 'Aguardando aceite',
      requestedAt: `Hoje · ${timeStr}`,
      slaLimit: '2h00 (SLA Crítico Vento Forte)',
      slaRemainingMinutes: 120,
      problemDescription:
        'Alerta meteorológico da Defesa Civil (rajadas > 70 km/h). Vistoriar imediatamente esticadores de antenas 5G, integridade da esteira de cabos de RF e malha de aterramento da torre de 60m.',
      systemEquipment: 'Torre Autoportante 60m + Antenas Painel Kathrein + QGBT 200A',
      dispatcher: {
        responsibleId: 'resp-fernanda',
        name: 'Fernanda Costa',
        role: 'Coordenadora de Campo & Despacho',
      },
      notes: [
        `${timeStr} - Demanda despachada automaticamente pelo ${integrationConfig.systemName}.`,
        `${timeStr} - Notificação de emergência enviada ao vistoriador ${USER_PROFILE.shortName}.`,
      ],
      executors: [executors[0], executors[1]],
      documents: [],
      checklistItems: [
        { id: 'c1', title: 'Inspeção visual da fundação e chumbadores da base', checked: false },
        { id: 'c2', title: 'Medição da malha de aterramento (TMGB < 5 ohms)', checked: false },
        { id: 'c3', title: 'Inspeção do esteiramento vertical e horizontal', checked: false },
        { id: 'c4', title: 'Aperto e torqueamento dos parafusos nos patamares 30m e 50m', checked: false },
        { id: 'c5', title: 'Verificação do balizamento noturno e fiação', checked: false },
        { id: 'c6', title: 'Registro fotográfico 360° para laudo RAT', checked: false },
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
          event: 'Nova demanda de site despachada via API',
          status: 'sucesso',
          details: `Demanda ${externalTkt} recebida de ${prev.systemName}.`,
          payloadSummary: `${nextProtocol} · Torre Santos 60m · SLA 2h`,
        },
        ...prev.syncLogs,
      ],
    }));

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: `🚨 Vistoria urgente na Torre: ${externalTkt}`,
        detail: `Torre Santos Ponta da Praia 60m · Despachada pelo ${integrationConfig.systemName}`,
        time: 'Agora mesmo',
        read: false,
        actionUrl: NavSection.ACIONAMENTOS,
      },
      ...prev,
    ]);

    showToast(`Nova demanda de torre (${newDemand.siteId}) despachada pelo sistema central!`);
  };

  // Sync theme with html element
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
      setToastMessage((cur: string | null) => (cur === msg ? null : cur));
    }, 2800);
  };

  const activeAcionamentosCount = acionamentos.filter((a) => a.status !== 'Concluído').length;
  const unreadChatCount = Object.values(chats).reduce((acc, c) => acc + (c.unread || 0), 0);

  /* ==========================================================================
     HANDLERS: ACIONAMENTOS / SITES
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
        let updatedDisplacement = item.displacement;

        if (status === 'Aceito') {
          updatedNotes.push(`${timeStr} - Vistoria no site aceita pelo vistoriador ${USER_PROFILE.shortName}.`);
        } else if (status === 'Em deslocamento') {
          updatedNotes.push(`${timeStr} - Deslocamento iniciado rumo à torre.`);
          if (!updatedDisplacement) {
            updatedDisplacement = {
              origin: 'Base Operacional Berrini (Av. Eng. Luís Carlos Berrini, 105)',
              destination: item.address,
              vehicle: 'Fiat Strada Freedom 1.3 · Placa BRA-2E19 · Frota Ameta #04',
              driver: USER_PROFILE.fullName,
              departureTime: timeStr,
              estimatedArrival: `${String(now.getHours()).padStart(2, '0')}:${String(
                (now.getMinutes() + 25) % 60
              ).padStart(2, '0')} (~25 min restantes)`,
              estimatedDistanceKm: 18.4,
              trafficCondition: 'Trânsito moderado nas vias de acesso',
              routeSummary: `Via Corredor Norte-Sul → ${item.address.split(',')[0]}`,
              wazeUrl: `https://waze.com/ul?ll=${encodeURIComponent(item.coordinates)}&navigate=yes`,
              mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.coordinates)}`,
            };
          }
        } else if (status === 'No local') {
          updatedNotes.push(`${timeStr} - Chegada ao site e check-in GPS confirmados.`);
        } else if (status === 'Em atendimento') {
          updatedNotes.push(`${timeStr} - Subida na torre iniciada com check-in e segurança confirmados.`);
        } else if (status === 'Concluído') {
          updatedNotes.push(`${timeStr} - Vistoria concluída. Checklist e laudo fotográfico RAT gerados.`);
        }

        return {
          ...item,
          status,
          displacement: updatedDisplacement,
          notes: updatedNotes,
          checkinTime: status === 'No local' ? timeStr : item.checkinTime,
          checkoutTime: status === 'Concluído' ? timeStr : item.checkoutTime,
        };
      })
    );

    showToast(`Status do site alterado para "${status}".`);
  };

  const handleAddAcionamento = (newItem: Omit<Acionamento, 'id' | 'notes'>) => {
    const created: Acionamento = {
      ...newItem,
      id: `ac-${Date.now()}`,
      notes: [
        `Agora - Demanda de vistoria no site ${newItem.siteId} registrada no sistema Ameta Telecom.`,
      ],
      executors: newItem.executors || [executors[0]],
      documents: newItem.documents || [],
      checklistItems: newItem.checklistItems || [
        { id: 'c1', title: 'Inspeção visual da fundação e chumbadores da base', checked: false },
        { id: 'c2', title: 'Medição da malha de aterramento (TMGB < 5 ohms)', checked: false },
        { id: 'c3', title: 'Inspeção do esteiramento vertical e horizontal', checked: false },
        { id: 'c4', title: 'Aperto e torqueamento dos parafusos e tirantes', checked: false },
        { id: 'c5', title: 'Verificação do balizamento noturno e fiação', checked: false },
        { id: 'c6', title: 'Registro fotográfico 360° para laudo RAT', checked: false },
      ],
    };
    setAcionamentos((prev) => [created, ...prev]);

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: `Novo site para vistoria: ${created.siteId}`,
        detail: `${created.siteName} (${created.towerType}) · ${created.operator}`,
        time: 'Agora mesmo',
        read: false,
        actionUrl: NavSection.ACIONAMENTOS,
      },
      ...prev,
    ]);

    showToast(`Demanda para o site ${created.siteId} criada e despachada!`);
  };

  /* ==========================================================================
     HANDLERS: AGENDA
  ========================================================================== */
  const handleAddAgendaItem = (item: Omit<AgendaItem, 'id'>) => {
    const created: AgendaItem = {
      ...item,
      id: `ag-${Date.now()}`,
    };
    setAgenda((prev) => [...prev, created]);
    showToast(`Agendamento de vistoria ${created.code} incluído na sua agenda.`);
  };

  const handleUpdateAgendaStatus = (id: string, status: AgendaItem['status']) => {
    setAgenda((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
    setSelectedAgendaItem((prev: AgendaItem | null) =>
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
      role: USER_PROFILE.roleLabel,
      text,
      time: timeStr,
      fromMe: true,
      relatedAcionamentoProtocol: relatedAcionamento,
    };

    setChats((prev) => {
      const existing = prev[responsibleId] || {
        responsibleId,
        unread: 0,
        lastMessage: '',
        lastMessageTime: '',
        messages: [],
      };
      return {
        ...prev,
        [responsibleId]: {
          ...existing,
          lastMessage: text,
          lastMessageTime: timeStr,
          messages: [...existing.messages, newMsg],
        },
      };
    });

    // Simulated reply from Dispatcher / NOC / Engineer
    setTimeout(() => {
      const resp = responsibles.find((r) => r.id === responsibleId);
      const replyMsg: ChatMessage = {
        id: `reply-${Date.now()}`,
        senderId: responsibleId,
        senderName: resp?.name || 'Coordenação',
        role: resp?.role || 'Despacho',
        text: `Recebido, ${USER_PROFILE.shortName}. Dados do site e protocolo de subida atualizados no NOC. Qualquer divergência de acesso me chame aqui.`,
        time: `${String(now.getHours()).padStart(2, '0')}:${String(
          now.getMinutes() + 1
        ).padStart(2, '0')}`,
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
            unread: activeResponsibleId === responsibleId ? 0 : cur.unread + 1,
            lastMessage: replyMsg.text,
            lastMessageTime: replyMsg.time,
            messages: [...cur.messages, replyMsg],
          },
        };
      });
    }, 1200);
  };

  /* ==========================================================================
     HANDLERS: LAUDOS RAC E RAT
  ========================================================================== */
  const handleContinueReport = (type: 'RAC' | 'RAT') => {
    const existing = reports.find((r) => r.type === type && r.status === 'Rascunho');
    if (existing) {
      setEditingReport(existing);
    } else {
      setEditingReport({
        id: `rep-${Date.now()}`,
        code: `${type}-2026-0842`,
        type,
        ticketProtocol: 'AC-2026-001052',
        client: 'American Tower / Vivo (Torre Morumbi Sul)',
        title:
          type === 'RAT'
            ? 'Relatório Fotográfico de Vistoria de Torre 55m'
            : 'Relatório de Atendimento de Campo & Subida em Torre',
        status: 'Rascunho',
        overdue: false,
        updatedAt: 'Hoje · Agora',
        summary: 'Vistoria pós-vendaval realizada. Fundação, aterramento e esteiramento inspecionados.',
      });
    }
  };

  const handleSaveReport = (id: string, summary: string, finalize: boolean) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              summary,
              status: finalize ? ('Enviado' as const) : ('Rascunho' as const),
              updatedAt: 'Hoje · Agora',
            }
          : r
      )
    );
    setEditingReport(null);
    showToast(finalize ? 'Laudo finalizado e transmitido ao NOC!' : 'Rascunho do laudo salvo com sucesso!');
  };

  return (
    <div className="flex h-svh min-h-0 w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar with the strictly requested 4 links */}
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
              executors={executors}
              unreadMessagesCount={unreadChatCount}
              onNavigate={(section) => {
                setAcionamentosInitialFilter('todos');
                setActiveSection(section);
              }}
              onOpenAcionamentoDetail={(item) => {
                setAcionamentosInitialFilter('todos');
                setActiveSection(NavSection.ACIONAMENTOS);
              }}
              onOpenAgendaDetail={(item) => setSelectedAgendaItem(item)}
              onOpenDeslocamentoModal={(site) => {
                setSelectedDeslocamentoSite(site || null);
                setDeslocamentoModalOpen(true);
              }}
              onStartChatWith={handleStartChatWith}
              onUpdateAcionamentoStatus={handleUpdateAcionamentoStatus}
              onContinueReport={handleContinueReport}
              onToast={showToast}
            />
          )}

          {activeSection === NavSection.ACIONAMENTOS && (
            <AcionamentosView
              acionamentos={acionamentos}
              initialFilter={acionamentosInitialFilter}
              onUpdateStatus={handleUpdateAcionamentoStatus}
              onAddAcionamento={handleAddAcionamento}
              onOpenChatWithDispatcher={(respId, protocol) =>
                handleStartChatWith(
                  respId,
                  `Olá, sobre o site/torre ${protocol}: `
                )
              }
              onOpenDeslocamentoModal={(site) => {
                setSelectedDeslocamentoSite(site || null);
                setDeslocamentoModalOpen(true);
              }}
              onBackHome={() => setActiveSection(NavSection.INICIO)}
              onToast={showToast}
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
          © Ameta Telecom 2026 · Gestão Integrada de Sites & Vistorias em Campo
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

      <DeslocamentoModal
        open={deslocamentoModalOpen}
        onClose={() => setDeslocamentoModalOpen(false)}
        sitesEmDeslocamento={
          selectedDeslocamentoSite
            ? [
                selectedDeslocamentoSite,
                ...acionamentos.filter(
                  (a) =>
                    a.status === 'Em deslocamento' &&
                    a.id !== selectedDeslocamentoSite.id
                ),
              ]
            : acionamentos.filter((a) => a.status === 'Em deslocamento')
        }
        onConfirmArrival={(siteId) => {
          handleUpdateAcionamentoStatus(siteId, 'No local');
          showToast(
            'Chegada ao site confirmada! Check-in GPS registrado com sucesso.'
          );
        }}
        onOpenChatWithDispatcher={handleStartChatWith}
        onOpenSiteDetail={(site) => {
          setAcionamentosInitialFilter('todos');
          setActiveSection(NavSection.ACIONAMENTOS);
        }}
        onToast={showToast}
      />
    </div>
  );
}
