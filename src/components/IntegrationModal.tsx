import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  ExternalLink,
  Globe,
  Key,
  Layers,
  Play,
  RefreshCw,
  Send,
  Terminal,
  Wifi,
  X,
} from 'lucide-react';
import { IntegrationConfig, SyncLogEntry } from '../types';

interface IntegrationModalProps {
  open: boolean;
  onClose: () => void;
  config: IntegrationConfig;
  onUpdateConfig: (updated: Partial<IntegrationConfig>) => void;
  onManualSync: () => void;
  onSimulateInboundDemand: () => void;
}

export const IntegrationModal: React.FC<IntegrationModalProps> = ({
  open,
  onClose,
  config,
  onUpdateConfig,
  onManualSync,
  onSimulateInboundDemand,
}) => {
  const [activeTab, setActiveTab] = useState<'api' | 'postmessage' | 'simulador' | 'logs'>('api');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPayloadIn, setCopiedPayloadIn] = useState(false);
  const [copiedPayloadOut, setCopiedPayloadOut] = useState(false);
  const [copiedPostMessage, setCopiedPostMessage] = useState(false);

  if (!open) return null;

  const sampleInboundPayload = `{
  "evento": "NOVA_DEMANDA_TECNICA",
  "origem": "${config.systemName}",
  "demanda": {
    "id_externo": "TKT-2026-9950",
    "cliente": "Rede Drogaria São Paulo",
    "unidade": "Loja 142 - Faria Lima",
    "endereco": "Av. Brig. Faria Lima, 2232 - SP",
    "contato_nome": "Julio Cezar (Gerente)",
    "contato_telefone": "(11) 98111-2233",
    "prioridade": "Alta",
    "tipo": "Emergencial",
    "sla_horas": 2,
    "descricao": "Queda total no switch PoE das câmeras e terminais de caixa",
    "equipamento": "Switch Cisco SG350-28P + Nobreak APC 1500VA",
    "despachante": "Fernanda Costa"
  }
}`;

  const sampleOutboundCallback = `{
  "evento": "STATUS_DEMANDA_ATUALIZADO",
  "tecnico": {
    "nome": "Rafael De Lima Araujo",
    "registro": "TEC-0418",
    "empresa": "Ameta"
  },
  "demanda": {
    "protocolo_ameta": "AC-2026-001052",
    "id_externo": "TKT-2026-8812",
    "status": "Em deslocamento",
    "horario": "10:24",
    "previsao_chegada": "10:45",
    "geolocalizacao": {
      "latitude": -23.6012,
      "longitude": -46.6974
    }
  }
}`;

  const samplePostMessageCode = `// No seu outro projeto (aplicação central / ERP / Desk):
// 1. Escutando quando o técnico atualiza o status neste painel:
window.addEventListener('message', (event) => {
  if (event.data?.origem === 'AMETA_PAINEL_TECNICO') {
    const { tipo, demanda } = event.data;
    console.log('Status do técnico atualizado:', demanda.status);
    // Atualize o seu banco de dados ou tela central aqui!
  }
});

// 2. Enviando uma nova demanda para a tela do técnico via iframe:
const iframeEl = document.getElementById('painel-tecnico-ameta');
iframeEl.contentWindow.postMessage({
  tipo: 'NOVA_DEMANDA',
  demanda: {
    id_externo: 'TKT-10492',
    cliente: 'Hospital Santa Helena',
    prioridade: 'Crítica',
    descricao: 'Verificar nobreak CPD'
  }
}, '*');`;

  const copyToClipboard = async (text: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col rounded-lg border border-border bg-sidebar shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5 bg-sidebar">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">
                Integração com Outro Sistema
              </h2>
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Conexão Pronta
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Conecte este painel ao seu outro sistema para os técnicos receberem demandas e devolverem status em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onManualSync}
              className="inline-flex h-8 items-center gap-1.5 rounded border border-input bg-background px-3 text-xs font-medium text-foreground hover:bg-accent cursor-pointer"
            >
              <RefreshCw className="size-3.5 text-primary" />
              <span>Sincronizar agora</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar modal"
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-border bg-muted/40 px-5 gap-4 overflow-x-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className={`py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'api'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            1. REST API & Webhooks
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('postmessage')}
            className={`py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'postmessage'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            2. Integração iframe (postMessage)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('simulador')}
            className={`py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'simulador'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            3. Testar Envio de Demanda
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'logs'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            4. Histórico de Sincronização ({config.syncLogs.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {activeTab === 'api' && (
            <div className="space-y-4">
              {/* Credentials / Config Box */}
              <div className="rounded-md border border-border bg-background p-4 space-y-3">
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <Key className="size-4 text-primary" />
                  <span>Configuração de Chave de Acesso e URLs</span>
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-muted-foreground mb-1">
                      Nome do Seu Outro Sistema
                    </label>
                    <input
                      type="text"
                      value={config.systemName}
                      onChange={(e) => onUpdateConfig({ systemName: e.target.value })}
                      className="h-8 w-full rounded border border-input bg-sidebar px-2.5 text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-muted-foreground mb-1">
                      Chave de Autenticação (Bearer Token)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={config.apiKey}
                        className="h-8 flex-1 rounded border border-input bg-sidebar px-2.5 font-mono text-[11px] text-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(config.apiKey, setCopiedKey)}
                        className="h-8 px-2.5 rounded border border-input bg-secondary hover:bg-accent text-foreground flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
                        <span>{copiedKey ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-muted-foreground mb-1">
                    URL de Retorno (Webhook Callback) no Seu Outro Sistema
                  </label>
                  <input
                    type="text"
                    value={config.webhookCallbackUrl}
                    onChange={(e) => onUpdateConfig({ webhookCallbackUrl: e.target.value })}
                    placeholder="https://seu-sistema.com/api/webhooks/status-tecnicos"
                    className="h-8 w-full rounded border border-input bg-sidebar px-2.5 font-mono text-[11px] text-foreground"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Quando o técnico clicar em "Aceitar", "Iniciar Deslocamento", "Chegada no local" ou "Concluir", este painel dispara um POST para esta URL com o status atualizado.
                  </p>
                </div>
              </div>

              {/* Inbound JSON */}
              <div className="rounded-md border border-border bg-background p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <ArrowDownLeft className="size-4 text-emerald-400" />
                    <span>Como Enviar Demandas para Este Painel (JSON de Entrada)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(sampleInboundPayload, setCopiedPayloadIn)}
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer"
                  >
                    {copiedPayloadIn ? <Check className="size-3" /> : <Copy className="size-3" />}
                    <span>{copiedPayloadIn ? 'Copiado!' : 'Copiar JSON de Exemplo'}</span>
                  </button>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Envie um <code className="text-foreground font-mono">POST /api/demandas</code> com o cabeçalho <code className="text-foreground font-mono">Authorization: Bearer {config.apiKey}</code>:
                </p>
                <pre className="rounded border border-border bg-sidebar p-3 font-mono text-[11px] overflow-x-auto text-foreground/90">
                  {sampleInboundPayload}
                </pre>
              </div>

              {/* Outbound Callback */}
              <div className="rounded-md border border-border bg-background p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <ArrowUpRight className="size-4 text-amber-400" />
                    <span>O Que Este Painel Devolve para Seu Sistema (Callback de Status)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(sampleOutboundCallback, setCopiedPayloadOut)}
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer"
                  >
                    {copiedPayloadOut ? <Check className="size-3" /> : <Copy className="size-3" />}
                    <span>{copiedPayloadOut ? 'Copiado!' : 'Copiar Exemplo'}</span>
                  </button>
                </div>
                <pre className="rounded border border-border bg-sidebar p-3 font-mono text-[11px] overflow-x-auto text-foreground/90">
                  {sampleOutboundCallback}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'postmessage' && (
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-background p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-primary" />
                  <h3 className="font-semibold text-foreground text-sm">
                    Integração Direta no Frontend (via iframe e postMessage)
                  </h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Se você já tem um outro sistema web (ex: painel administrativo) e quer apenas <strong>embutir este painel de técnicos dentro de uma aba ou modal</strong>, você não precisa nem de backend intermediário! Os dois sistemas podem conversar direto pelo navegador usando <code className="text-primary font-mono">window.postMessage</code>.
                </p>

                <div className="flex justify-between items-center pt-2">
                  <span className="font-semibold text-foreground">Código JavaScript pronto para o seu outro projeto:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(samplePostMessageCode, setCopiedPostMessage)}
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer"
                  >
                    {copiedPostMessage ? <Check className="size-3" /> : <Copy className="size-3" />}
                    <span>{copiedPostMessage ? 'Copiado!' : 'Copiar Código'}</span>
                  </button>
                </div>

                <pre className="rounded border border-border bg-sidebar p-3 font-mono text-[11px] overflow-x-auto text-foreground/90">
                  {samplePostMessageCode}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'simulador' && (
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-background p-4 space-y-3">
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <Play className="size-4 text-emerald-400" />
                  <span>Simulador de Despacho em Tempo Real</span>
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Clique no botão abaixo para simular que o seu <strong>outro sistema acabou de enviar uma nova demanda urgente</strong> para o técnico Rafael. Isso vai criar um acionamento com ID externo, atualizar os contadores e registrar o evento de sincronização.
                </p>

                <div className="p-3 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300">
                  <p className="font-semibold">Demanda simulada:</p>
                  <p className="mt-0.5">
                    <strong>TKT-2026-9950</strong> · Rede Drogaria SP · Faria Lima · Queda de Switch PoE · SLA 2h
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSimulateInboundDemand();
                    onClose();
                  }}
                  className="inline-flex h-9 items-center gap-2 rounded bg-primary hover:bg-primary/90 text-primary-foreground px-4 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Send className="size-3.5" />
                  <span>Disparar Demanda do Outro Sistema Agora</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-foreground">
                  Eventos de Comunicação Recentes
                </span>
                <span className="text-muted-foreground text-[11px]">
                  {config.lastSyncTime}
                </span>
              </div>

              <div className="rounded-md border border-border divide-y divide-border">
                {config.syncLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-background hover:bg-accent/40 transition-colors space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {log.direction === 'inbound' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                            <ArrowDownLeft className="size-3" />
                            <span>Recebido</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded">
                            <ArrowUpRight className="size-3" />
                            <span>Enviado</span>
                          </span>
                        )}
                        <span className="font-semibold text-foreground">{log.event}</span>
                      </div>
                      <span className="text-muted-foreground text-[11px] tabular-nums">{log.time}</span>
                    </div>
                    <p className="text-muted-foreground">{log.details}</p>
                    {log.payloadSummary && (
                      <p className="text-[11px] font-mono text-primary truncate">
                        Payload: {log.payloadSummary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3 bg-sidebar">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wifi className="size-3.5 text-emerald-400" />
            <span>Status: Sincronização pronta para operar com o outro projeto.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded bg-secondary px-4 text-xs font-medium text-secondary-foreground hover:bg-accent cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
