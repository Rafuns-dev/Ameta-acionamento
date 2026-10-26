export enum NavSection {
  INICIO = 'inicio',
  ACIONAMENTOS = 'acionamentos',
  AGENDA = 'agenda',
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
  planilhaAtualizadaEm?: string;
  planilhaResumo?: string;

  // UI optional fields if passed
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
  checklistItems?: { id: string; title: string; checked: boolean }[];
  checkinTime?: string;
  checkoutTime?: string;
  displacement?: DisplacementInfo;
}

export interface AppNotification {
  id: string;
  title: string;
  detail: string;
  time: string;
  read: boolean;
  actionUrl?: NavSection;
}

export interface AuthUser {
  id: string;
  email: string;
  shortName: string;
  fullName: string;
  roleBadge?: string;
  roleLabel?: string;
  isCoord: boolean;
  name?: string;
  role?: string;
  situacao?: string;
  accessReleased?: boolean;
  tipo?: string;
  plataforma?: string;
  assignedPlatform?: string;
  equipe?: string;
  company?: string;
  companyFull?: string;
  registration?: string;
  base?: string;
  initials?: string;
  avatarColor?: string;
  tipoUsuario?: 'VISTORIA' | 'EXECUTOR' | 'AMBOS' | 'TODOS';
  specialties?: string[];
  phone?: string;
}
