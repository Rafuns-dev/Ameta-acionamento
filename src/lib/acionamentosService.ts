import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { AcionamentoHistoryItem, AcionamentoStatus } from '../types';

export interface UpdateAcionamentoParams {
  docId: string;
  status: AcionamentoStatus;
  userEmail: string;
  userName: string;
  vendor?: string;
  isCoord?: boolean;
  existingDestinatariosEmails?: string[];
  existingHistorico?: AcionamentoHistoryItem[];

  // Optional status-specific fields
  aceitoEm?: string;
  recusadoEm?: string;
  motivoRecusa?: string;
  checkinEm?: string;
  checkinLocal?: string;
  checkoutEm?: string;
  checkoutLocal?: string;
  concluidoEm?: string;
  resumoConclusao?: string;
  pendencias?: string;
}

/**
 * Updates an acionamento document in Firestore:
 * - All dates written are ISO text strings (new Date().toISOString())
 * - History entries are written in the exact format:
 *   { data: ISO, autor: string, email: string, acao: string, status: string, detalhes?: string }
 *   without 'por' or 'em'
 * - Strictly updates only fields allowed by Requirement 6
 */
export async function updateAcionamentoStatusInFirestore(params: UpdateAcionamentoParams): Promise<void> {
  const {
    docId,
    status,
    userEmail,
    userName,
    vendor,
    isCoord = false,
    existingDestinatariosEmails = [],
    existingHistorico = [],
    aceitoEm,
    recusadoEm,
    motivoRecusa,
    checkinEm,
    checkinLocal,
    checkoutEm,
    checkoutLocal,
    concluidoEm,
    resumoConclusao,
    pendencias,
  } = params;

  const nowIso = new Date().toISOString();

  let acaoText = status as string;
  if (status === 'Aceito') acaoText = 'Aceito';
  else if (status === 'Recusado') acaoText = 'Recusado';
  else if (status === 'Em deslocamento') acaoText = 'Em deslocamento';
  else if (status === 'No local') acaoText = 'No local (Check-in)';
  else if (status === 'Em atendimento') acaoText = 'Em atendimento';
  else if (status === 'Pausado') acaoText = 'Pausado';
  else if (status === 'Concluído') acaoText = 'Concluído';

  let detalhesText: string | undefined = undefined;
  if (motivoRecusa) detalhesText = `Motivo: ${motivoRecusa}`;
  else if (resumoConclusao) detalhesText = `Resumo: ${resumoConclusao}`;
  else if (checkinLocal) detalhesText = `Check-in local: ${checkinLocal}`;

  const newHistoryItem: AcionamentoHistoryItem = {
    data: nowIso,
    autor: userName,
    email: userEmail.toLowerCase(),
    acao: acaoText,
    status: status,
    ...(detalhesText ? { detalhes: detalhesText } : {}),
  };

  const updatedHistorico = [...existingHistorico, newHistoryItem];

  const payload: Record<string, any> = {
    status,
    atualizadoEm: nowIso,
    historico: updatedHistorico,
  };

  if (vendor && String(vendor).toUpperCase() === 'NOKIA') {
    payload.nokiaStatus = status;
    payload.statusNokia = status;
    payload.planilhaStatus = status;
  }

  const emailLower = userEmail.toLowerCase();
  if (isCoord && existingDestinatariosEmails && !existingDestinatariosEmails.includes(emailLower)) {
    payload.destinatariosEmails = [...existingDestinatariosEmails, emailLower];
  }

  if (status === 'Aceito') {
    payload.aceitoPorEmail = userEmail.toLowerCase();
    payload.aceitoPorNome = userName;
    payload.aceitoEm = aceitoEm || nowIso;
  }

  if (status === 'Recusado') {
    payload.recusadoPorEmail = userEmail.toLowerCase();
    payload.recusadoPorNome = userName;
    payload.recusadoEm = recusadoEm || nowIso;
    if (motivoRecusa !== undefined) {
      payload.motivoRecusa = motivoRecusa;
    }
  }

  if (checkinEm !== undefined) payload.checkinEm = checkinEm || nowIso;
  if (checkinLocal !== undefined) payload.checkinLocal = checkinLocal;

  if (checkoutEm !== undefined) payload.checkoutEm = checkoutEm || nowIso;
  if (checkoutLocal !== undefined) payload.checkoutLocal = checkoutLocal;

  if (concluidoEm !== undefined) payload.concluidoEm = concluidoEm || nowIso;
  if (resumoConclusao !== undefined) payload.resumoConclusao = resumoConclusao;
  if (pendencias !== undefined) payload.pendencias = pendencias;

  const docRef = doc(db, 'acionamentos', docId);
  await updateDoc(docRef, payload);
}
