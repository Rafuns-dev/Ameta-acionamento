export enum NavSection {
  INICIO = 'inicio',
  ACIONAMENTOS = 'acionamentos',
  AGENDA = 'agenda',
  CHAT_RESPONSAVEIS = 'chat_responsaveis',
}

export type AcionamentoPriority = 'Crítica' | 'Alta' | 'Média' | 'Normal';

export type AcionamentoType =
  | 'Emergencial'
  | 'Preventiva'
  | 'Corretiva'
  | 'Suporte VIP'
  | 'Ronda Técnica';

export type AcionamentoStatus =
  | 'Aguardando aceite'
  | 'Aceito'
  | 'Em deslocamento'
  | 'No local'
  | 'Em atendimento'
  | 'Pausado'
  | 'Concluído';

export interface Acionamento {
  id: string;
  protocol: string;
  externalId?: string;
  externalSystem?: string;
  syncedAt?: string;
  client: string;
  unit: string;
  address: string;
  contactName: string;
  contactPhone: string;
  priority: AcionamentoPriority;
  type: AcionamentoType;
  status: AcionamentoStatus;
  requestedAt: string;
  slaLimit: string;
  slaRemainingMinutes: number;
  problemDescription: string;
  systemEquipment: string;
  dispatcher: {
    responsibleId: string;
    name: string;
    role: string;
  };
  notes: string[];
  checkinTime?: string;
  checkoutTime?: string;
}

export interface AgendaItem {
  id: string;
  code: string;
  externalId?: string;
  time: string;
  date: string;
  client: string;
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
