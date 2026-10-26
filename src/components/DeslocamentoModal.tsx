import React, { useState } from 'react';
import {
  Car,
  CheckCircle2,
  Compass,
  Copy,
  ExternalLink,
  Key,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Acionamento, DisplacementInfo } from '../types';
import { rotuloAtividade, rotuloAtividadeDe } from '../utils/tipoAcionamento';

interface DeslocamentoModalProps {
  open: boolean;
  onClose: () => void;
  sitesEmDeslocamento: Acionamento[];
  onConfirmArrival: (siteId: string) => void;
  onOpenSiteDetail?: (site: Acionamento) => void;
  onToast?: (msg: string) => void;
}

export const DeslocamentoModal: React.FC<DeslocamentoModalProps> = ({
  open,
  onClose,
  sitesEmDeslocamento,
  onConfirmArrival,
  onToast,
}) => {
  const [selectedSiteId, setSelectedSiteId] = useState<string>(() => {
    return sitesEmDeslocamento[0]?.id || '';
  });

  // Track pre-arrival verification checklist locally
  const [preChecklist, setPreChecklist] = useState<Record<string, boolean>>({
    epis: true,
    cracha: true,
    janela: true,
    portaria: false,
  });

  if (!open) return null;

  const currentSite =
    sitesEmDeslocamento.find((s) => s.id === selectedSiteId) ||
    sitesEmDeslocamento[0];

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    onToast?.(`${label} copiado com sucesso!`);
  };

  const displacement: DisplacementInfo = currentSite?.displacement || {
    origin: 'Origem da Rota',
    destination: currentSite?.endereco || currentSite?.address || currentSite?.siteNome || 'Site de Telecom',
    vehicle: 'Veículo da Equipe',
    driver: currentSite?.aceitoPorNome || (rotuloAtividade(currentSite) === 'Projeto' ? 'Executor' : 'Vistoriador'),
    departureTime: 'Em trânsito',
    estimatedArrival: 'Em deslocamento',
    estimatedDistanceKm: 0,
    trafficCondition: 'Em rota para o site',
    routeSummary: 'Trajeto em andamento',
    wazeUrl: currentSite ? `https://waze.com/ul?ll=${encodeURIComponent(currentSite.coordinates || currentSite.endereco || currentSite.siteNome || '')}&navigate=yes` : '',
    mapsUrl: currentSite ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentSite.coordinates || currentSite.endereco || currentSite.siteNome || '')}` : '',
  };

  const handleConfirmArrival = () => {
    if (!currentSite) return;
    onConfirmArrival(currentSite.id);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-lg border border-primary/40 bg-sidebar text-foreground shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-primary/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <Navigation className="size-4 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  Painel de Deslocamento Operacional
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  <span className="size-1.5 rounded-full bg-primary animate-ping" />
                  Em Trânsito ({sitesEmDeslocamento.length})
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                Acompanhamento de rota e check-in de chegada
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Multiple sites in displacement tabs */}
          {sitesEmDeslocamento.length > 1 && (
            <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
              <span className="text-xs text-muted-foreground shrink-0">
                Selecione a torre:
              </span>
              {sitesEmDeslocamento.map((site) => (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => setSelectedSiteId(site.id)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors ${
                    site.id === currentSite?.id
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'bg-background hover:bg-accent text-foreground border border-border'
                  }`}
                >
                  <Navigation className="size-3" />
                  <span>{site.siteId}</span>
                </button>
              ))}
            </div>
          )}

          {!currentSite ? (
            <div className="rounded-md border border-border bg-background p-8 text-center text-sm text-muted-foreground">
              Nenhum acionamento em deslocamento no momento.
            </div>
          ) : (
            <>
              {/* Site Target Card */}
              <div className="rounded-lg border border-primary/30 bg-background/90 p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border/80 pb-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                        {currentSite.siteId}
                      </span>
                      <h4 className="font-semibold text-base text-foreground">
                        {currentSite.siteNome || currentSite.siteName}
                      </h4>
                      {currentSite.towerType && (
                        <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                          {currentSite.towerType}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                      <MapPin className="size-3.5 text-primary shrink-0" />
                      <span>{currentSite.endereco || currentSite.address}</span>
                    </p>
                  </div>
                </div>

                {/* Pre-Arrival Access & Protocol */}
                {(currentSite.accessKeyProtocol || currentSite.contactName || currentSite.contactPhone) && (
                  <div className="grid gap-2 sm:grid-cols-2 text-xs">
                    {currentSite.accessKeyProtocol && (
                      <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-[10px] uppercase font-semibold text-amber-300 flex items-center gap-1">
                            <Key className="size-3" />
                            Chave & Protocolo:
                          </span>
                          <p className="font-medium text-foreground text-xs leading-snug">
                            {currentSite.accessKeyProtocol}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              currentSite.accessKeyProtocol!,
                              'Protocolo de acesso'
                            )
                          }
                          className="p-1 rounded hover:bg-amber-500/20 text-amber-300 cursor-pointer shrink-0"
                          title="Copiar Protocolo de Acesso"
                        >
                          <Copy className="size-3.5" />
                        </button>
                      </div>
                    )}

                    {(currentSite.contactName || currentSite.contactPhone) && (
                      <div className="rounded-md border border-border bg-sidebar p-2.5 flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
                            <Phone className="size-3 text-primary" />
                            Contato:
                          </span>
                          {currentSite.contactName && (
                            <p className="font-medium text-foreground text-xs">
                              {currentSite.contactName}
                            </p>
                          )}
                          {currentSite.contactPhone && (
                            <p className="text-[11px] text-muted-foreground">
                              {currentSite.contactPhone}
                            </p>
                          )}
                        </div>
                        {currentSite.contactPhone && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(currentSite.contactPhone!, 'Telefone de contato')
                            }
                            className="p-1 rounded hover:bg-accent text-primary cursor-pointer shrink-0"
                            title="Copiar Telefone"
                          >
                            <Copy className="size-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Rota */}
              <div className="rounded-lg border border-border bg-background p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <Car className="size-4 text-primary" />
                    <span>Navegação & Rota</span>
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-muted-foreground text-[11px]">
                        Destino:
                      </span>
                      <p className="font-medium text-foreground">
                        {displacement.destination}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {currentSite.coordinates && (
                      <div>
                        <span className="text-muted-foreground text-[11px]">
                          Coordenadas GPS:
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-primary">
                          <Compass className="size-3" />
                          <span>{currentSite.coordinates}</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                currentSite.coordinates!,
                                'Coordenadas GPS'
                              )
                            }
                            className="hover:underline cursor-pointer ml-1"
                          >
                            (Copiar)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Navigation Links */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/80">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                      currentSite.coordinates || currentSite.address || currentSite.endereco || ''
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-sidebar hover:bg-accent px-3 text-xs font-medium text-foreground cursor-pointer transition-colors"
                  >
                    <ExternalLink className="size-3 text-primary" />
                    <span>Google Maps</span>
                  </a>

                  <a
                    href={`https://waze.com/ul?ll=${encodeURIComponent(
                      currentSite.coordinates || currentSite.address || currentSite.endereco || ''
                    )}&navigate=yes`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-sidebar hover:bg-accent px-3 text-xs font-medium text-foreground cursor-pointer transition-colors"
                  >
                    <Navigation className="size-3 text-primary" />
                    <span>Waze</span>
                  </a>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(currentSite.address || currentSite.endereco || '', 'Endereço completo')
                    }
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-sidebar hover:bg-accent px-3 text-xs font-medium text-foreground cursor-pointer transition-colors"
                  >
                    <Copy className="size-3 text-muted-foreground" />
                    <span>Copiar Endereço</span>
                  </button>
                </div>
              </div>

              {/* Checklist Preliminar */}
              <div className="rounded-lg border border-border bg-sidebar p-3.5 space-y-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-emerald-400" />
                  <span>Checklist Pré-Acesso:</span>
                </span>
                <div className="grid gap-2 sm:grid-cols-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-foreground/90">
                    <input
                      type="checkbox"
                      checked={preChecklist.epis}
                      onChange={(e) =>
                        setPreChecklist((p) => ({ ...p, epis: e.target.checked }))
                      }
                      className="size-3.5 rounded border-border text-primary focus:ring-primary"
                    />
                    <span>EPIs no veículo (cinto, trava-quedas, capacete)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-foreground/90">
                    <input
                      type="checkbox"
                      checked={preChecklist.cracha}
                      onChange={(e) =>
                        setPreChecklist((p) => ({ ...p, cracha: e.target.checked }))
                      }
                      className="size-3.5 rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Crachá Ameta e identificação em dia</span>
                  </label>
                </div>
              </div>

              {/* Escopo da Demanda */}
              {(currentSite.observacao || currentSite.problemDescription) && (
                <div className="rounded-md border border-border bg-background p-3 text-xs space-y-1">
                  <span className="font-semibold text-foreground">
                    Escopo {rotuloAtividadeDe(currentSite)}:
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    {currentSite.observacao || currentSite.problemDescription}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Actions Footer */}
        {currentSite && (
          <div className="border-t border-border px-5 py-3.5 bg-muted/20 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground hover:bg-accent cursor-pointer"
            >
              Fechar
            </button>

            <button
              type="button"
              onClick={handleConfirmArrival}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white px-4 text-xs font-semibold cursor-pointer shadow-sm transition-all"
            >
              <CheckCircle2 className="size-4" />
              <span>Confirmar Chegada (No local)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
