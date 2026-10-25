import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { updateAcionamentoStatusInFirestore } from './lib/acionamentosService';
import {
  Acionamento,
  AcionamentoStatus,
  AgendaItem,
  AppNotification,
  AuthUser,
  ChatConversation,
  ChatMessage,
  Executor,
  IntegrationConfig,
  NavSection,
  ReportItem,
  ResponsiblePerson,
} from './types';
import {
  INITIAL_AGENDA,
  INITIAL_CHATS,
  INITIAL_EXECUTORS_POOL,
  INITIAL_INTEGRATION_CONFIG,
  INITIAL_NOTIFICATIONS,
  INITIAL_REPORTS,
  INITIAL_RESPONSIBLES,
  SYSTEM_ACCOUNTS,
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
} from './components/ReportsAndOthers';
import { HtmlExportModal } from './components/HtmlExportModal';
import { IntegrationModal } from './components/IntegrationModal';
import { DeslocamentoModal } from './components/DeslocamentoModal';
import { LoginView } from './components/LoginView';

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

  // Current authenticated user state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [activeSection, setActiveSection] = useState<NavSection>(NavSection.INICIO);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Live Firestore Acionamentos
  const [acionamentos, setAcionamentos] = useState<Acionamento[]>([]);
  const [isLoadingFirestore, setIsLoadingFirestore] = useState(false);

  // Other App Data States
  const [agenda, setAgenda] = useState<AgendaItem[]>(INITIAL_AGENDA);
  const [responsibles] = useState<ResponsiblePerson[]>(INITIAL_RESPONSIBLES);
  const [executors] = useState<Executor[]>(INITIAL_EXECUTORS_POOL);
  const [chats, setChats] = useState<Record<string, ChatConversation>>(INITIAL_CHATS);
  const [activeResponsibleId, setActiveResponsibleId] = useState<string>('resp-fernanda');
  const [chatPrefillDraft] = useState<string>('');
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

  // Integration Modal
  const [integrationConfig, setIntegrationConfig] = useState<IntegrationConfig>(INITIAL_INTEGRATION_CONFIG);
  const [integrationModalOpen, setIntegrationModalOpen] = useState(false);

  const activeUser = currentUser || USER_PROFILE;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
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

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser && fbUser.email) {
        const emailLower = fbUser.email.toLowerCase();
        const known = SYSTEM_ACCOUNTS.find(
          (acc) => acc.email.toLowerCase() === emailLower
        );

        if (known) {
          setCurrentUser(known);
        } else {
          const namePart = fbUser.displayName || fbUser.email.split('@')[0];
          const dynamicUser: AuthUser = {
            id: fbUser.uid,
            email: fbUser.email,
            shortName: namePart,
            fullName: fbUser.displayName || namePart,
            roleBadge: 'TÉCNICO',
            roleLabel: 'Técnico de Vistoria de Telecom',
            company: 'Ameta',
            companyFull: 'Ameta Telecomunicações & Infraestrutura',
            registration: `TEC-${fbUser.uid.slice(0, 4).toUpperCase()}`,
            base: 'Base Operacional Telecom',
            initials: namePart.slice(0, 2).toUpperCase(),
            avatarColor: 'bg-emerald-600',
            phone: fbUser.phoneNumber || '',
          };
          setCurrentUser(dynamicUser);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore real-time collection "acionamentos" for the logged in user
  useEffect(() => {
    if (!currentUser?.email) {
      setAcionamentos([]);
      setIsLoadingFirestore(false);
      return;
    }

    const emailLower = currentUser.email.trim().toLowerCase();
    setIsLoadingFirestore(true);

    const q = query(
      collection(db, 'acionamentos'),
      where('destinatariosEmails', 'array-contains', emailLower)
    );

    let previousPendingIds = new Set<string>();

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: Acionamento[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const docId = docSnap.id;
          const status = (data.status || 'Aguardando aceite') as AcionamentoStatus;

          const siteId = data.siteId || 'SITE-TELECOM';
          const siteNome = data.siteNome || data.siteName || `Site ${siteId}`;
          const protocolo = data.protocolo || data.protocol || docId;
          const endereco = data.endereco || data.address || 'Endereço não informado';

          return {
            id: docId,
            protocolo,
            protocol: protocolo,
            origem: data.origem || 'telecom',
            vendor: data.vendor || 'NOKIA',
            siteId,
            siteNome,
            siteName: siteNome,
            endereco,
            address: endereco,
            cidade: data.cidade || '',
            uf: data.uf || '',
            tipoDestinatario: data.tipoDestinatario || 'Vistoriador',
            equipe: data.equipe || '',
            destinatariosEmails: data.destinatariosEmails || [],
            status,
            demandadoPorNome: data.demandadoPorNome || 'Sistema Telecom',
            demandadoPorEmail: data.demandadoPorEmail || '',
            demandadoEm: data.demandadoEm || 'Hoje',
            observacao: data.observacao || data.problemDescription || '',
            aceitoPorEmail: data.aceitoPorEmail,
            aceitoPorNome: data.aceitoPorNome,
            aceitoEm: data.aceitoEm,
            atualizadoEm: data.atualizadoEm,
            historico: data.historico || [],

            recusadoPorEmail: data.recusadoPorEmail,
            recusadoPorNome: data.recusadoPorNome,
            recusadoEm: data.recusadoEm,
            motivoRecusa: data.motivoRecusa,
            checkinEm: data.checkinEm,
            checkinLocal: data.checkinLocal,
            checkoutEm: data.checkoutEm,
            checkoutLocal: data.checkoutLocal,
            concluidoEm: data.concluidoEm,
            resumoConclusao: data.resumoConclusao,
            pendencias: data.pendencias,

            // UI compatibility fallbacks
            towerType: data.towerType || 'Autoportante',
            towerHeightMeters: data.towerHeightMeters || 50,
            operator: data.operator || data.vendor || 'Telecom',
            coordinates: data.coordinates || '-23.5505, -46.6333',
            accessKeyProtocol: data.accessKeyProtocol || 'Cadeado segredo 8820',
            contactName: data.demandadoPorNome || 'Central NOC',
            contactPhone: '(11) 98000-1122',
            priority: data.priority || 'Alta',
            type: data.type || 'Vistoria Estrutural',
            requestedAt: data.demandadoEm || 'Hoje',
            slaLimit: '2h00 (SLA Padrão)',
            slaRemainingMinutes: 120,
            problemDescription: data.observacao || 'Vistoria em site demandada pelo Telecom',
            systemEquipment: data.systemEquipment || `Equipamentos do Site ${siteId}`,
            dispatcher: {
              responsibleId: 'resp-fernanda',
              name: data.demandadoPorNome || 'Despacho Telecom',
              role: 'Coordenadora de Campo',
            },
            notes: data.notes || [],
            executors: data.executors || [],
            documents: data.documents || [],
            checklistItems: data.checklistItems || [
              { id: 'c1', title: 'Inspeção visual da fundação e chumbadores da base', checked: false },
              { id: 'c2', title: 'Medição da malha de aterramento (TMGB < 5 ohms)', checked: false },
              { id: 'c3', title: 'Inspeção do esteiramento vertical e horizontal', checked: false },
              { id: 'c4', title: 'Aperto e torqueamento dos parafusos e tirantes', checked: false },
            ],
          };
        });

        // Order by demandadoEm or atualizadoEm descending
        loaded.sort((a, b) => {
          const dateA = a.demandadoEm || a.atualizadoEm || '';
          const dateB = b.demandadoEm || b.atualizadoEm || '';
          return dateB.localeCompare(dateA);
        });

        // Alert user if new pending items in 'Aguardando aceite' arrive
        const currentPending = loaded.filter((item) => item.status === 'Aguardando aceite');
        const currentPendingIds = new Set(currentPending.map((item) => item.id));

        const newlyAdded = currentPending.filter((item) => !previousPendingIds.has(item.id));
        if (newlyAdded.length > 0 && previousPendingIds.size > 0) {
          showToast(`NOVA VISTORIA DEMANDADA! Protocolo ${newlyAdded[0].protocolo} no Site ${newlyAdded[0].siteId}`);
        }

        previousPendingIds = currentPendingIds;
        setAcionamentos(loaded);
        setIsLoadingFirestore(false);
      },
      (err) => {
        console.error('Firestore subscription error:', err);
        setIsLoadingFirestore(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.email]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Logout error:', e);
    }
    setCurrentUser(null);
    showToast('Sessão encerrada com sucesso.');
  };

  // Update status in Firestore strictly obeying Requirement 6
  const handleUpdateStatusWithPayload = async (
    docId: string,
    newStatus: AcionamentoStatus,
    extraFields?: {
      motivoRecusa?: string;
      checkinEm?: string;
      checkinLocal?: string;
      checkoutEm?: string;
      checkoutLocal?: string;
      concluidoEm?: string;
      resumoConclusao?: string;
      pendencias?: string;
    }
  ) => {
    if (!currentUser) return;
    const targetItem = acionamentos.find((a) => a.id === docId);
    if (!targetItem) return;

    await updateAcionamentoStatusInFirestore({
      docId,
      status: newStatus,
      userEmail: currentUser.email.toLowerCase(),
      userName: currentUser.fullName || currentUser.shortName,
      existingHistorico: targetItem.historico || [],
      ...extraFields,
    });
  };

  const handleStartChatWith = (responsibleId: string, prefillMessage?: string) => {
    setActiveResponsibleId(responsibleId);
    setActiveSection(NavSection.CHAT_RESPONSAVEIS);
    setChats((prev) => {
      const cur = prev[responsibleId];
      if (!cur) return prev;
      return { ...prev, [responsibleId]: { ...cur, unread: 0 } };
    });
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
      senderId: activeUser.id,
      senderName: activeUser.shortName,
      role: activeUser.roleLabel,
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

    setTimeout(() => {
      const resp = responsibles.find((r) => r.id === responsibleId);
      const replyMsg: ChatMessage = {
        id: `reply-${Date.now()}`,
        senderId: responsibleId,
        senderName: resp?.name || 'Coordenação',
        role: resp?.role || 'Despacho',
        text: `Recebido, ${activeUser.shortName}. Dados do site e protocolo de subida atualizados no NOC. Qualquer divergência de acesso me chame aqui.`,
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
            lastMessage: replyMsg.text,
            lastMessageTime: replyMsg.time,
            messages: [...cur.messages, replyMsg],
          },
        };
      });
    }, 1200);
  };

  const handleUpdateAgendaStatus = (
    id: string,
    newStatus: 'Concluído' | 'Em andamento' | 'Confirmado' | 'Pendente'
  ) => {
    setAgenda((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    showToast(`Status do agendamento atualizado para "${newStatus}".`);
  };

  const handleSaveReport = (id: string, summary: string, finalize: boolean) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              summary: summary || 'Laudo de vistoria em campo preenchido.',
              status: finalize ? ('Enviado' as const) : ('Rascunho' as const),
              updatedAt: 'Hoje · Agora',
            }
          : r
      )
    );
    setEditingReport(null);
    showToast(finalize ? 'Laudo finalizado e transmitido ao NOC!' : 'Rascunho do laudo salvo com sucesso!');
  };

  if (authChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <span className="size-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-muted-foreground">
            Conectando ao Firebase Auth...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground">
        <LoginView
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'escuro' ? 'claro' : 'escuro'))}
          onLogin={() => {}}
        />
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 right-5 z-50 rounded-md border border-border bg-sidebar px-3.5 py-2.5 text-xs font-medium text-foreground shadow-lg animate-in fade-in"
          >
            {toastMessage}
          </div>
        )}
      </div>
    );
  }

  const activeAcionamentosCount = acionamentos.filter(
    (a) => a.status !== 'Concluído' && a.status !== 'Cancelado' && a.status !== 'Recusado'
  ).length;

  const unreadChatCount = Object.values(chats).reduce(
    (acc, curr) => acc + (curr.unread || 0),
    0
  );

  return (
    <div className="flex h-svh min-h-0 w-full overflow-hidden bg-background text-foreground">
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
          currentUser={currentUser}
          onLogout={handleLogout}
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
              currentUser={currentUser}
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
              onOpenAcionamentoDetail={() => {
                setAcionamentosInitialFilter('todos');
                setActiveSection(NavSection.ACIONAMENTOS);
              }}
              onOpenAgendaDetail={(item) => setSelectedAgendaItem(item)}
              onOpenDeslocamentoModal={(site) => {
                setSelectedDeslocamentoSite(site || null);
                setDeslocamentoModalOpen(true);
              }}
              onStartChatWith={handleStartChatWith}
              onUpdateAcionamentoStatus={async (id, status) => {
                await handleUpdateStatusWithPayload(id, status);
              }}
              onContinueReport={() => setActiveSection(NavSection.INICIO)}
              onToast={showToast}
            />
          )}

          {activeSection === NavSection.ACIONAMENTOS && (
            <AcionamentosView
              acionamentos={acionamentos}
              currentUser={currentUser}
              initialFilter={acionamentosInitialFilter}
              onUpdateStatusWithPayload={handleUpdateStatusWithPayload}
              onOpenChatWithDispatcher={(respId, protocol) =>
                handleStartChatWith(
                  respId,
                  `Olá, sobre a vistoria ${protocol}: `
                )
              }
              onOpenDeslocamentoModal={(site) => {
                setSelectedDeslocamentoSite(site || null);
                setDeslocamentoModalOpen(true);
              }}
              onBackHome={() => setActiveSection(NavSection.INICIO)}
              onToast={showToast}
              isLoadingFirestore={isLoadingFirestore}
            />
          )}

          {activeSection === NavSection.AGENDA && (
            <AgendaView
              agenda={agenda}
              onOpenDetail={(item) => setSelectedAgendaItem(item)}
              onAddAgendaItem={(item) => setAgenda((prev) => [{ ...item, id: `agenda-${Date.now()}` }, ...prev])}
              onUpdateStatus={handleUpdateAgendaStatus}
              onNavigateToAcionamento={() => {
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
          © Ameta Telecom 2026 · Gestão Integrada de Sites & Vistorias em Campo · Conectado ao Firebase (ameta-sistema-teste)
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
        onOpenAcionamento={() => setActiveSection(NavSection.ACIONAMENTOS)}
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
        onManualSync={() => showToast('Sincronização com Firebase Firestore é automática e em tempo real!')}
        onSimulateInboundDemand={() => showToast('As vistorias são enviadas em tempo real pelo sistema Telecom.')}
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
          handleUpdateStatusWithPayload(siteId, 'No local');
          showToast(
            'Chegada ao site confirmada! Check-in registrado com sucesso.'
          );
        }}
        onOpenChatWithDispatcher={handleStartChatWith}
        onOpenSiteDetail={() => {
          setAcionamentosInitialFilter('todos');
          setActiveSection(NavSection.ACIONAMENTOS);
        }}
        onToast={showToast}
      />
    </div>
  );
}
