import React from 'react';

export type TipoAcionamento = 'VISTORIA' | 'EXECUTOR';
export type TipoUsuario = 'VISTORIA' | 'EXECUTOR' | 'AMBOS' | 'TODOS';

/**
 * 1) getTipoAcionamento(a):
 * - retorna 'EXECUTOR' se a.tipoDestinatario for 'EXECUTOR'
 * - retorna 'VISTORIA' se for 'VISTORIA'
 * - se o campo estiver vazio, use o final do id do documento ('_EXECUTOR' ou '_VISTORIA')
 * - se ainda assim não der, retorne 'VISTORIA'
 */
export function getTipoAcionamento(
  a: { tipoDestinatario?: string; id?: string } | null | undefined
): TipoAcionamento {
  if (!a) return 'VISTORIA';

  const tipo = (a.tipoDestinatario || '').trim().toUpperCase();
  if (tipo === 'EXECUTOR') return 'EXECUTOR';
  if (tipo === 'VISTORIA') return 'VISTORIA';

  const id = (a.id || '').trim().toUpperCase();
  if (id.endsWith('_EXECUTOR')) return 'EXECUTOR';
  if (id.endsWith('_VISTORIA')) return 'VISTORIA';

  return 'VISTORIA';
}

/**
 * 2) getTipoUsuario(role, isCoord):
 * A partir do campo role do documento usuarios/{uid}:
 * - role contendo 'Vistoriador' (sem 'Executor'): tipoUsuario = 'VISTORIA'
 * - role contendo 'Executor' (sem 'Vistoriador'): tipoUsuario = 'EXECUTOR'
 * - role contendo os dois: tipoUsuario = 'AMBOS'
 * - coordenação (isCoord): tipoUsuario = 'TODOS'
 */
export function getTipoUsuario(role: string = '', isCoord: boolean = false): TipoUsuario {
  if (isCoord) return 'TODOS';

  const r = (role || '').toLowerCase();
  const hasVistoriador = r.includes('vistoriador');
  const hasExecutor = r.includes('executor');

  if (hasVistoriador && hasExecutor) return 'AMBOS';
  if (hasExecutor && !hasVistoriador) return 'EXECUTOR';
  if (hasVistoriador && !hasExecutor) return 'VISTORIA';

  // Fallback caso role não contenha explicitamente nenhuma das palavras
  return 'VISTORIA';
}

/**
 * 3) Verifica se um acionamento deve ser visível para um dado tipoUsuario:
 * Para 'VISTORIA', mostre só acionamentos de tipo VISTORIA.
 * Para 'EXECUTOR', só EXECUTOR.
 * Para 'AMBOS' e 'TODOS', mostre tudo.
 */
export function matchesTipoUsuario(
  item: { tipoDestinatario?: string; id?: string },
  tipoUsuario: TipoUsuario
): boolean {
  if (tipoUsuario === 'TODOS' || tipoUsuario === 'AMBOS') return true;
  return getTipoAcionamento(item) === tipoUsuario;
}

/**
 * 5) Etiqueta clara em cada card: "VISTORIA" (azul) ou "EXECUTOR" (laranja).
 */
export const TipoBadge: React.FC<{
  tipoOrItem: TipoAcionamento | { tipoDestinatario?: string; id?: string };
  className?: string;
}> = ({ tipoOrItem, className = '' }) => {
  const tipo: TipoAcionamento =
    typeof tipoOrItem === 'string' ? tipoOrItem : getTipoAcionamento(tipoOrItem);

  if (tipo === 'EXECUTOR') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/35 shadow-2xs ${className}`}
      >
        EXECUTOR
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/35 shadow-2xs ${className}`}
    >
      VISTORIA
    </span>
  );
};
