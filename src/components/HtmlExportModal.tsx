import React, { useState } from 'react';
import { Check, Copy, Download, X } from 'lucide-react';
import { STANDALONE_AMETA_HTML } from '../utils/standaloneHtml';

interface HtmlExportModalProps {
  open: boolean;
  onClose: () => void;
}

export const HtmlExportModal: React.FC<HtmlExportModalProps> = ({
  open,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(STANDALONE_AMETA_HTML);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = STANDALONE_AMETA_HTML;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([STANDALONE_AMETA_HTML], {
      type: 'text/html;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'painel-ameta.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col rounded-md border border-border bg-sidebar shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Código HTML Único — Ameta (Início, Acionamentos, Agenda, Chat)
            </h2>
            <p className="text-xs text-muted-foreground">
              Arquivo único com Tailwind CSS via CDN pronto para abrir no navegador.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground hover:bg-accent cursor-pointer whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-primary" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Copiar HTML</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90 cursor-pointer whitespace-nowrap"
            >
              <Download className="size-3.5" />
              <span>Baixar .html</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar janela"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          <pre className="rounded-md border border-border bg-background p-4 font-mono text-[11px] leading-relaxed text-foreground/90 overflow-x-auto">
            <code>{STANDALONE_AMETA_HTML}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
