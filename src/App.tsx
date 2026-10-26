import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { Activity, LogOut, ShieldAlert } from 'lucide-react';
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
import { DiagnosticsModal, UserDocDiagnosticData } from './components/DiagnosticsModal';
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
  const [userDocData, setUserDocData] = useState<UserDocDiagnosticData | null>(null);
  const [accessBlocked, setAccessBlocked] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  const [activeSection, setActiveSection] = useState<NavSection>(NavSection.INICIO);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Live Firestore Acionamentos
  const [acionamentos, setAcionamentos] = useState<Acionamento[]>([]);
  const [isLoadingFirestore, setIsLoadingFirestore] = useState(false);
  const [acionamentosError, setAcionamentosError] = useState<string | null>(null);

  // Notifications (Real session notifications only)
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Modals
  const [deslocamentoModalOpen, setDeslocamentoModalOpen] = useState(false);
  const [selectedDeslocamentoSite, setSelectedDeslocamentoSite] = useState<Acionamento | null>(null);
  const [acionamentosInitialFilter, setAcionamentosInitialFilter] = useState<
    'todos' | 'restantes' | 'em_deslocamento' | 'em_curso' | 'concluidos'
  >('todos');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [diagnosticsModalOpen, setDiagnosticsModalOpen] = useState(false);

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
  // 1 & 2) Após o login, leia o documento do próprio usuário com getDoc(doc(db, 'usuarios', uid)), usando o uid do Firebase Auth.
  // Guarde: name, role, situacao, accessReleased, tipo, plataforma, assignedPlatform e equipe.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setAuthChecking(true);
      if (fbUser && fbUser.email) {
        const uid = fbUser.uid;
        const email = fbUser.email.toLowerCase();
        const emailPrefix = email.split('@')[0];
        const formattedName = emailPrefix
          .split(/[._-]/)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ');

        let userDocSnap = null;
        let readError: string | null = null;

        try {
          userDocSnap = await getDoc(doc(db, 'usuarios', uid));
        } catch (err: any) {
          console.error('Erro ao ler documento de usuário no Firestore:', err);
          readError = err?.code ? `${err.code}: ${err.message}` : String(err);
        }

        const docExists = Boolean(userDocSnap && userDocSnap.exists());
        const data = docExists ? (userDocSnap!.data() as Record<string, any>) : {};

        const name = (data.name ?? '').toString();
        const role = (data.role ?? '').toString();
        const situacao = (data.situacao ?? '').toString();
        const accessReleased = Boolean(data.accessReleased);
        const tipo = (data.tipo ?? '').toString();
        const plataforma = (data.plataforma ?? '').toString();
        const assignedPlatform = (data.assignedPlatform ?? '').toString();
        const equipe = (data.equipe ?? '').toString();

        // 3) É coordenação (isCoord = true) SOMENTE se role for exatamente 'Coordenador Geral',
        // 'Coordenador Engenharia' ou 'ADM', ou situacao for 'dono', ou tipo for 'admin'. Nenhuma outra regra.
        const isCoord =
          role === 'Coordenador Geral' ||
          role === 'Coordenador Engenharia' ||
          role === 'ADM' ||
          situacao === 'dono' ||
          tipo === 'admin';

        // 5) Se o documento do usuário não existir, ou se situacao não for 'ativo' nem 'dono' e accessReleased não for true,
        // mostre "Seu acesso ainda não foi liberado no Telecom. Fale com a coordenação." com botão Sair, sem carregar acionamentos.
        const hasAccess =
          docExists && (situacao === 'ativo' || situacao === 'dono' || accessReleased === true);

        const diagnosticInfo: UserDocDiagnosticData = {
          exists: docExists,
          error: readError,
          name,
          role,
          situacao,
          accessReleased,
          tipo,
          plataforma,
          assignedPlatform,
          equipe,
          raw: data,
        };
        setUserDocData(diagnosticInfo);
        setAccessBlocked(!hasAccess);

        const fullName = name || fbUser.displayName || formattedName;
        const shortName = fullName.split(' ')[0] || formattedName;
        const initialsParts = fullName.split(' ');
        const initials = (
          (initialsParts[0]?.charAt(0) || '') +
          (initialsParts[1]?.charAt(0) || '')
        ).toUpperCase() || 'AM';

        const userFromAuth: AuthUser = {
          id: uid,
          email: fbUser.email,
          shortName,
          fullName,
          initials,
          isCoord,
          name,
          role,
          situacao,
          accessReleased,
          tipo,
          plataforma,
          assignedPlatform,
          equipe,
          roleBadge: role || (isCoord ? 'Coordenação' : undefined),
          roleLabel: role || (isCoord ? 'Coordenação' : 'Vistoriador'),
          avatarColor: isCoord ? 'bg-amber-600' : 'bg-emerald-600',
        };
        setCurrentUser(userFromAuth);
      } else {
        setCurrentUser(null);
        setUserDocData(null);
        setAccessBlocked(false);
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // 4) O listener de "acionamentos" usa o isCoord do usuário (calculado a partir do cadastro):
  // coordenação ouve a coleção inteira; qualquer outro perfil ouve apenas com where('destinatariosEmails', 'array-contains', email em minúsculas).
  // Não recalcule isCoord pelo e-mail no listener.
  useEffect(() => {
    setAcionamentosError(null);

    // Se não há usuário logado ou o acesso está bloqueado, não carrega acionamentos!
    if (!currentUser?.email || accessBlocked) {
      setAcionamentos([]);
      setIsLoadingFirestore(false);
      return;
    }

    const emailLower = currentUser.email.trim().toLowerCase();
    const isCoord = currentUser.isCoord;
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
        setAcionamentosError(null);
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
        const errStr = err?.code ? `${err.code}: ${err.message}` : String(err);
        setAcionamentosError(errStr);
        if (err?.code === 'permission-denied') {
          showToast('Sem permissão para ler os acionamentos');
        } else {
          showToast('Não foi possível carregar suas vistorias. Fale com a coordenação.');
        }
      }
    );

    return () => unsubscribe();
  }, [currentUser?.email, currentUser?.isCoord, accessBlocked]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Logout error:', e);
    }
    setCurrentUser(null);
    setUserDocData(null);
    setAccessBlocked(false);
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
      userName: currentUser.name || currentUser.fullName || currentUser.shortName,
      vendor: targetItem.vendor,
      isCoord: currentUser.isCoord,
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

  // 5) Se o documento do usuário não existir, ou se situacao não for 'ativo' nem 'dono' e accessReleased não for true,
  // mostre "Seu acesso ainda não foi liberado no Telecom. Fale com a coordenação." com botão Sair, sem carregar acionamentos.
  if (accessBlocked) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-8 text-foreground">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl text-center space-y-4 animate-in fade-in">
          <div className="mx-auto size-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldAlert className="size-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              Acesso Não Liberado
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Seu acesso ainda não foi liberado no Telecom. Fale com a coordenação.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background/50 p-3 text-left text-xs font-mono space-y-1">
            <div className="text-muted-foreground truncate">
              E-mail: <span className="text-foreground font-semibold">{currentUser.email}</span>
            </div>
            <div className="text-muted-foreground text-[11px] truncate">
              UID: <span className="text-foreground">{currentUser.id}</span>
            </div>
            {userDocData?.situacao && (
              <div className="text-muted-foreground text-[11px]">
                Situação: <span className="text-foreground">{userDocData.situacao}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDiagnosticsModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-sidebar hover:bg-accent px-4 py-2 text-xs font-medium text-foreground cursor-pointer transition-colors"
            >
              <Activity className="size-3.5 text-primary" />
              <span>Ver Diagnóstico</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground px-5 py-2 text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            >
              <LogOut className="size-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        <DiagnosticsModal
          open={diagnosticsModalOpen}
          onClose={() => setDiagnosticsModalOpen(false)}
          currentUser={currentUser}
          userDocData={userDocData}
          acionamentosCount={acionamentos.length}
          acionamentosError={acionamentosError}
          onToast={showToast}
        />
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
          onOpenDiagnostics={() => setDiagnosticsModalOpen(true)}
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

      <DiagnosticsModal
        open={diagnosticsModalOpen}
        onClose={() => setDiagnosticsModalOpen(false)}
        currentUser={currentUser}
        userDocData={userDocData}
        acionamentosCount={acionamentos.length}
        acionamentosError={acionamentosError}
        onToast={showToast}
      />
    </div>
  );
}
