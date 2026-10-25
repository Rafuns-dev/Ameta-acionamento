export enum NavSection {
  INICIO = 'inicio',
  ACIONAMENTOS = 'acionamentos', // Vistorias & Demandas em Sites
  AGENDA = 'agenda',
  CHAT_RESPONSAVEIS = 'chat_responsaveis',
}

export type AcionamentoPriority = 'Crítica' | 'Alta' | 'Média' | 'Normal';

export type TowerType =
  | 'Autoportante'
  | 'Estaiada'
  | 'Rooftop (Topo de Prédio)'
  | 'Monopolo'
  | 'Greenfield (Solo Rural)';

export type SurveyType =
  | 'Vistoria Estrutural'
  | 'Vistoria de Infra & Energia'
  | 'Compartilhamento (Colocation)'
  | 'Auditoria Preventiva'
  | 'Emergencial / Vandalismo';

export type AcionamentoStatus =
  | 'Aguardando aceite'
  | 'Aceito'
  | 'Recusado'
  | 'Em deslocamento'
  | 'No local'
  | 'Em atendimento'
  | 'Pausado'
  | 'Concluído'
  | 'Cancelado';

export interface AcionamentoHistoryItem {
  data?: string;
  autor?: string;
  email?: string;
  acao?: string;
  status: string;
  detalhes?: string;

  // Legacy fallback fields for reading old records
  por?: string;
  em?: string;
}

export interface SiteDocument {
  id: string;
  code: string;
  name: string;
  category: 'Técnico / Vistoria' | 'Acesso & Autorização' | 'Fotos & Evidências';
  status: 'Válido' | 'Pendente' | 'Em conferência';
  uploadedAt?: string;
  fileSize?: string;
  fileType?: string;
  notes?: string;
}

export interface Executor {
  id: string;
  name: string;
  role:
    | 'Vistoriador Líder'
    | 'Vistoriador de Campo'
    | 'Escalador / Alpinista Industrial'
    | 'Eletricista de Telecom'
    | 'Técnico de Infraestrutura';
  cpfMasked: string;
  company: string;
  phone: string;
  status: 'Liberado' | 'Em campo' | 'Disponível';
}

export interface DisplacementInfo {
  origin: string;
  destination: string;
  vehicle: string;
  driver: string;
  departureTime: string;
  estimatedArrival: string;
  estimatedDistanceKm: number;
  trafficCondition: string;
  routeSummary: string;
  wazeUrl?: string;
  mapsUrl?: string;
}

export interface Acionamento {
  id: string;

  // Real Telecom Firestore Fields
  protocolo: string;
  protocol?: string;
  origem?: string;
  vendor?: 'NOKIA' | 'ERICSSON' | string;
  siteId: string;
  siteNome: string;
  siteName?: string;
  endereco: string;
  address?: string;
  cidade?: string;
  uf?: string;
  tipoDestinatario?: string;
  equipe?: string;
  destinatariosEmails?: string[];
  status: AcionamentoStatus;
  demandadoPorNome?: string;
  demandadoPorEmail?: string;
  demandadoEm?: string;
  observacao?: string;
  aceitoPorEmail?: string;
  aceitoPorNome?: string;
  aceitoEm?: string;
  atualizadoEm?: string;
  historico?: AcionamentoHistoryItem[];

  recusadoPorEmail?: string;
  recusadoPorNome?: string;
  recusadoEm?: string;
  motivoRecusa?: string;
  checkinEm?: string;
  checkinLocal?: string;
  checkoutEm?: string;
  checkoutLocal?: string;
  concluidoEm?: string;
  resumoConclusao?: string;
  pendencias?: string;

  // UI Fallbacks
  externalId?: string;
  externalSystem?: string;
  syncedAt?: string;
  towerType?: TowerType | string;
  towerHeightMeters?: number;
  operator?: string;
  coordinates?: string;
  accessKeyProtocol?: string;
  contactName?: string;
  contactPhone?: string;
  priority?: AcionamentoPriority;
  type?: SurveyType | string;
  requestedAt?: string;
  slaLimit?: string;
  slaRemainingMinutes?: number;
  problemDescription?: string;
  systemEquipment?: string;
  dispatcher?: {
    responsibleId: string;
    name: string;
    role: string;
  };
  notes?: string[];
  executors?: Executor[];
  documents?: SiteDocument[];
  checklistItems?: { id: string; title: string; checked: boolean }[];
  checkinTime?: string;
  checkoutTime?: string;
  displacement?: DisplacementInfo;
}

export interface AgendaItem {
  id: string;
  code: string;
  externalId?: string;
  time: string;
  date: string;
  client: string;
  siteId?: string;
  towerType?: string;
  location: string;
  title: string;
  status: 'Concluído' | 'Em andamento' | 'Confirmado' | 'Pendente';
  acionamentoRef?: string;
  responsible: string;
  notes: string;
}

export interface ResponsiblePerson {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'online' | 'ausente' | 'em_atendimento' | 'offline';
  phone: string;
  email: string;
  shift: string;
  badge: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  role: string;
  text: string;
  time: string;
  fromMe: boolean;
  relatedAcionamentoProtocol?: string;
}

export interface ChatConversation {
  responsibleId: string;
  unread: number;
  lastMessage: string;
  lastMessageTime: string;
  messages: ChatMessage[];
}

export interface ReportItem {
  id: string;
  code: string;
  type: 'RAC' | 'RAT';
  ticketProtocol: string;
  client: string;
  title: string;
  status: 'Rascunho' | 'Ajuste solicitado' | 'Enviado';
  overdue: boolean;
  updatedAt: string;
  summary: string;
}

export interface AppNotification {
  id: string;
  title: string;
  detail: string;
  time: string;
  read: boolean;
  actionUrl?: NavSection;
}

export interface SyncLogEntry {
  id: string;
  time: string;
  direction: 'inbound' | 'outbound';
  event: string;
  status: 'sucesso' | 'pendente' | 'erro';
  details: string;
  payloadSummary?: string;
}

export interface IntegrationConfig {
  systemName: string;
  apiUrl: string;
  apiKey: string;
  webhookCallbackUrl: string;
  autoSync: boolean;
  enablePostMessage: boolean;
  isConnected: boolean;
  lastSyncTime: string;
  syncLogs: SyncLogEntry[];
}

export interface AuthUser {
  id: string;
  email: string;
  password?: string;
  shortName: string;
  fullName: string;
  roleBadge: string;
  roleLabel: string;
  company: string;
  companyFull: string;
  registration: string;
  base: string;
  initials: string;
  avatarColor: string;
  specialties?: string[];
  phone?: string;
}

