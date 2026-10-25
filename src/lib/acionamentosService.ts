import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { AcionamentoStatus } from '../types';

export interface UpdateAcionamentoParams {
  docId: string;
  status: AcionamentoStatus;
  userEmail: string;
  userName: string;
  existingHistorico?: Array<{ status: string; por: string; em: string }>;

  // Optional status-specific fields specified in Requirement 6
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
 * Updates an acionamento document in Firestore, strictly writing ONLY the fields allowed by Requirement 6:
 * status, aceitoPorEmail, aceitoPorNome, aceitoEm, atualizadoEm, historico,
 * recusadoPorEmail, recusadoPorNome, recusadoEm, motivoRecusa, checkinEm, checkinLocal,
 * checkoutEm, checkoutLocal, concluidoEm, resumoConclusao, pendencias.
 */
export async function updateAcionamentoStatusInFirestore(params: UpdateAcionamentoParams): Promise<void> {
  const {
    docId,
    status,
    userEmail,
    userName,
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

  const formattedTime = new Date().toLocaleString('pt-BR');

  const newHistoryItem = {
    status,
    por: userEmail,
    em: formattedTime,
  };

  const updatedHistorico = [...existingHistorico, newHistoryItem];

  const payload: Record<string, any> = {
    status,
    atualizadoEm: formattedTime,
    historico: updatedHistorico,
  };

  if (status === 'Aceito') {
    payload.aceitoPorEmail = userEmail;
    payload.aceitoPorNome = userName;
    payload.aceitoEm = aceitoEm || formattedTime;
  }

  if (status === 'Recusado') {
    payload.recusadoPorEmail = userEmail;
    payload.recusadoPorNome = userName;
    payload.recusadoEm = recusadoEm || formattedTime;
    if (motivoRecusa !== undefined) {
      payload.motivoRecusa = motivoRecusa;
    }
  }

  if (checkinEm !== undefined) payload.checkinEm = checkinEm;
  if (checkinLocal !== undefined) payload.checkinLocal = checkinLocal;
  if (checkoutEm !== undefined) payload.checkoutEm = checkoutEm;
  if (checkoutLocal !== undefined) payload.checkoutLocal = checkoutLocal;
  if (concluidoEm !== undefined) payload.concluidoEm = concluidoEm;
  if (resumoConclusao !== undefined) payload.resumoConclusao = resumoConclusao;
  if (pendencias !== undefined) payload.pendencias = pendencias;

  const docRef = doc(db, 'acionamentos', docId);
  await updateDoc(docRef, payload);
}
