import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { updateAcionamentoStatusInFirestore } from './lib/acionamentosService';
import {
  Acionamento,
  AcionamentoStatus,
  AppNotification,
  AuthUser,
  NavSection,
} from './types';
import { formatDateTime, toDate } from './utils/dateUtils';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardHome } from './components/DashboardHome';
import { AcionamentosView } from './components/AcionamentosView';
import { AgendaView } from './components/AgendaView';
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

  // Notifications (Real session notifications only)
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Modals
  const [deslocamentoModalOpen, setDeslocamentoModalOpen] = useState(false);
  const [selectedDeslocamentoSite, setSelectedDeslocamentoSite] = useState<Acionamento | null>(null);
  const [acionamentosInitialFilter, setAcionamentosInitialFilter] = useState<
    'todos' | 'restantes' | 'em_deslocamento' | 'em_curso' | 'concluidos'
  >('todos');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
        const email = fbUser.email.toLowerCase();
        const emailPrefix = email.split('@')[0];
        const formattedName = emailPrefix
          .split(/[._-]/)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ');

        const fullName = fbUser.displayName || formattedName;
        const shortName = fullName.split(' ')[0] || formattedName;
        const initialsParts = fullName.split(' ');
        const initials = (
          (initialsParts[0]?.charAt(0) || '') +
          (initialsParts[1]?.charAt(0) || '')
        ).toUpperCase() || 'AM';

        const isCoord = email.includes('coord') || email.includes('admin') || email.includes('gerente') || email.includes('gestao') || email.includes('dono') || email.includes('operacao') || email.includes('telecom') || email.includes('ameta');
        const roleBadge = isCoord ? 'Coordenador / Gestor' : 'Técnico de Campo';
        const roleLabel = isCoord ? 'Coordenação & Donos (Permissão de Alteração)' : 'Equipe de Vistoria';

        const userFromAuth: AuthUser = {
          id: fbUser.uid,
          email: fbUser.email,
          shortName,
          fullName,
          initials,
          roleBadge,
          roleLabel,
          avatarColor: isCoord ? 'bg-amber-600' : 'bg-emerald-600',
        };
        setCurrentUser(userFromAuth);
      } else {
        setCurrentUser(null);
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore real-time collection "acionamentos" for logged-in user
  useEffect(() => {
    if (!currentUser?.email) {
      setAcionamentos([]);
      setIsLoadingFirestore(false);
      return;
    }

    const emailLower = currentUser.email.trim().toLowerCase();
    const isCoord = emailLower.includes('coord') || emailLower.includes('admin') || emailLower.includes('gerente') || emailLower.includes('gestao') || emailLower.includes('dono') || emailLower.includes('operacao') || emailLower.includes('telecom') || emailLower.includes('ameta');
    setIsLoadingFirestore(true);

    const q = isCoord
      ? query(collection(db, 'acionamentos'))
      : query(
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

          const siteId = data.siteId || docId;
          const siteNome = data.siteNome || data.siteName || '';
          const protocolo = data.protocolo || data.protocol || docId;
          const endereco = data.endereco || data.address || '';

          return {
            id: docId,
            protocolo,
            protocol: protocolo,
            origem: data.origem,
            vendor: data.vendor,
            siteId,
            siteNome,
            siteName: siteNome,
            endereco,
            address: endereco,
            cidade: data.cidade,
            uf: data.uf,
            tipoDestinatario: data.tipoDestinatario,
            equipe: data.equipe,
            destinatariosEmails: data.destinatariosEmails || [],
            status,
            demandadoPorNome: data.demandadoPorNome,
            demandadoPorEmail: data.demandadoPorEmail,
            demandadoEm: data.demandadoEm,
            observacao: data.observacao,
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
            planilhaAtualizadaEm: data.planilhaAtualizadaEm,
            planilhaResumo: data.planilhaResumo,

            // Optional fields if present
            towerType: data.towerType,
            towerHeightMeters: data.towerHeightMeters,
            operator: data.operator,
            coordinates: data.coordinates,
            accessKeyProtocol: data.accessKeyProtocol,
            contactName: data.contactName,
            contactPhone: data.contactPhone,
            priority: data.priority,
            type: data.type,
            requestedAt: data.requestedAt,
            slaLimit: data.slaLimit,
            slaRemainingMinutes: data.slaRemainingMinutes,
            problemDescription: data.problemDescription,
            systemEquipment: data.systemEquipment,
            dispatcher: data.dispatcher,
            notes: data.notes,
            checklistItems: data.checklistItems,
            displacement: data.displacement,
          };
        });

        // Order by demandadoEm (or atualizadoEm fallback) descending using toDate()
        loaded.sort((a, b) => {
          const dateA = toDate(a.demandadoEm || a.atualizadoEm)?.getTime() || 0;
          const dateB = toDate(b.demandadoEm || b.atualizadoEm)?.getTime() || 0;
          return dateB - dateA;
        });

        // Alert user if new pending items in 'Aguardando aceite' arrive and create real notification
        const currentPending = loaded.filter((item) => item.status === 'Aguardando aceite');
        const currentPendingIds = new Set(currentPending.map((item) => item.id));

        const newlyAdded = currentPending.filter((item) => !previousPendingIds.has(item.id));
        if (newlyAdded.length > 0 && previousPendingIds.size > 0) {
          const item = newlyAdded[0];
          showToast(`NOVA VISTORIA DEMANDADA! Protocolo ${item.protocolo} no Site ${item.siteId}`);
          const newNotif: AppNotification = {
            id: `notif-${Date.now()}-${item.id}`,
            title: 'Nova Vistoria Demandada',
            detail: `Protocolo ${item.protocolo} no Site ${item.siteId}`,
            time: formatDateTime(new Date()),
            read: false,
            actionUrl: NavSection.ACIONAMENTOS,
          };
          setNotifications((prev) => [newNotif, ...prev]);
        }

        previousPendingIds = currentPendingIds;
        setAcionamentos(loaded);
        setIsLoadingFirestore(false);
      },
      (err: any) => {
        console.error('Firestore subscription error:', err);
        setIsLoadingFirestore(false);
        if (err?.code === 'permission-denied') {
          showToast('Sem permissão para ler os acionamentos');
        } else {
          showToast('Não foi possível carregar suas vistorias. Fale com a coordenação.');
        }
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

  // Update status in Firestore
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
      vendor: targetItem.vendor,
      existingDestinatariosEmails: targetItem.destinatariosEmails || [],
      existingHistorico: targetItem.historico || [],
      ...extraFields,
    });
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
          onNavigate={setActiveSection}
        />

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
          {activeSection === NavSection.INICIO && (
            <DashboardHome
              currentUser={currentUser}
              acionamentos={acionamentos}
              onNavigate={(section) => {
                setAcionamentosInitialFilter('todos');
                setActiveSection(section);
              }}
              onOpenDeslocamentoModal={(site) => {
                setSelectedDeslocamentoSite(site || null);
                setDeslocamentoModalOpen(true);
              }}
              onUpdateAcionamentoStatus={async (id, status) => {
                await handleUpdateStatusWithPayload(id, status);
              }}
              onToast={showToast}
            />
          )}

          {activeSection === NavSection.ACIONAMENTOS && (
            <AcionamentosView
              acionamentos={acionamentos}
              currentUser={currentUser}
              initialFilter={acionamentosInitialFilter}
              onUpdateStatusWithPayload={handleUpdateStatusWithPayload}
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
              acionamentos={acionamentos}
              onUpdateStatusWithPayload={handleUpdateStatusWithPayload}
              onNavigateToAcionamentoDetail={() => {
                setAcionamentosInitialFilter('todos');
                setActiveSection(NavSection.ACIONAMENTOS);
              }}
              onBackHome={() => setActiveSection(NavSection.INICIO)}
              onToast={showToast}
            />
          )}
        </main>

        {/* Footer */}
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
        onOpenSiteDetail={() => {
          setAcionamentosInitialFilter('todos');
          setActiveSection(NavSection.ACIONAMENTOS);
        }}
        onToast={showToast}
      />
    </div>
  );
}
