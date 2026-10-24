import React from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  MessagesSquare,
  Radio,
  X,
} from 'lucide-react';
import { NavSection } from '../types';
import { AmetaLogo } from './AmetaLogo';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  activeAcionamentosCount: number;
  unreadChatCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  activeAcionamentosCount,
  unreadChatCount,
}) => {
  const handleNavigate = (section: NavSection) => {
    onSelectSection(section);
    onCloseMobile();
  };

  const renderSidebarContent = (isMobileDrawer: boolean) => {
    const isIconOnly = !isMobileDrawer && collapsed;

    return (
      <div
        data-sidebar="sidebar"
        className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground"
      >
        {/* Brand Header */}
        <div
          data-sidebar="header"
          className="flex items-center justify-between gap-2 border-b border-sidebar-border bg-sidebar p-2 min-h-[68px]"
        >
          <button
            type="button"
            onClick={() => handleNavigate(NavSection.INICIO)}
            aria-label="Ameta — ir para o início"
            className="flex flex-1 items-center justify-center rounded-md py-1.5 px-2 outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            <AmetaLogo collapsed={isIconOnly} />
          </button>

          {isMobileDrawer && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Fechar menu de navegação"
              className="inline-flex size-8 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Navigation Links: Início, Acionamentos, Agenda, Chat interno com responsáveis */}
        <div
          data-sidebar="content"
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2"
        >
          {!isIconOnly && (
            <div
              data-sidebar="group-label"
              className="flex h-8 shrink-0 items-center px-2 text-xs font-medium text-sidebar-foreground/70"
            >
              Navegação
            </div>
          )}

          <ul data-sidebar="menu" className="flex w-full min-w-0 flex-col gap-1 text-sm">
            {/* 1. Início */}
            <li>
              <button
                type="button"
                onClick={() => handleNavigate(NavSection.INICIO)}
                title={isIconOnly ? 'Início' : undefined}
                className={`flex w-full items-center gap-2.5 overflow-hidden rounded-md px-2.5 h-9 text-left text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring whitespace-nowrap ${
                  isIconOnly ? 'justify-center px-0' : ''
                } ${
                  activeSection === NavSection.INICIO
                    ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                }`}
              >
                <LayoutDashboard
                  className={`size-4 shrink-0 ${
                    activeSection === NavSection.INICIO ? 'text-primary' : ''
                  }`}
                />
                {!isIconOnly && <span className="truncate">Início</span>}
              </button>
            </li>

            {/* 2. Acionamentos */}
            <li>
              <button
                type="button"
                onClick={() => handleNavigate(NavSection.ACIONAMENTOS)}
                title={isIconOnly ? 'Acionamentos' : undefined}
                className={`flex w-full items-center gap-2.5 overflow-hidden rounded-md px-2.5 h-9 text-left text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring whitespace-nowrap ${
                  isIconOnly ? 'justify-center px-0' : ''
                } ${
                  activeSection === NavSection.ACIONAMENTOS
                    ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                }`}
              >
                <div className="relative shrink-0">
                  <Radio
                    className={`size-4 shrink-0 ${
                      activeSection === NavSection.ACIONAMENTOS
                        ? 'text-primary'
                        : 'text-amber-400'
                    }`}
                  />
                  {activeAcionamentosCount > 0 && isIconOnly && (
                    <span className="absolute -top-1 -right-1 size-2 rounded-full bg-amber-400" />
                  )}
                </div>
                {!isIconOnly && (
                  <>
                    <span className="truncate">Acionamentos</span>
                    {activeAcionamentosCount > 0 && (
                      <span className="ml-auto inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-400 tabular-nums">
                        {activeAcionamentosCount}
                      </span>
                    )}
                  </>
                )}
              </button>
            </li>

            {/* 3. Agenda */}
            <li>
              <button
                type="button"
                onClick={() => handleNavigate(NavSection.AGENDA)}
                title={isIconOnly ? 'Agenda' : undefined}
                className={`flex w-full items-center gap-2.5 overflow-hidden rounded-md px-2.5 h-9 text-left text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring whitespace-nowrap ${
                  isIconOnly ? 'justify-center px-0' : ''
                } ${
                  activeSection === NavSection.AGENDA
                    ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                }`}
              >
                <CalendarDays
                  className={`size-4 shrink-0 ${
                    activeSection === NavSection.AGENDA ? 'text-primary' : ''
                  }`}
                />
                {!isIconOnly && <span className="truncate">Agenda</span>}
              </button>
            </li>

            {/* 4. Chat interno com responsáveis */}
            <li>
              <button
                type="button"
                onClick={() => handleNavigate(NavSection.CHAT_RESPONSAVEIS)}
                title={isIconOnly ? 'Chat interno com responsáveis' : undefined}
                className={`flex w-full items-center gap-2.5 overflow-hidden rounded-md px-2.5 h-9 text-left text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring whitespace-nowrap ${
                  isIconOnly ? 'justify-center px-0' : ''
                } ${
                  activeSection === NavSection.CHAT_RESPONSAVEIS
                    ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                }`}
              >
                <div className="relative shrink-0">
                  <MessagesSquare
                    className={`size-4 shrink-0 ${
                      activeSection === NavSection.CHAT_RESPONSAVEIS
                        ? 'text-primary'
                        : ''
                    }`}
                  />
                  {unreadChatCount > 0 && isIconOnly && (
                    <span className="absolute -top-1 -right-1 size-2 rounded-full bg-primary" />
                  )}
                </div>
                {!isIconOnly && (
                  <>
                    <span className="truncate">Chat interno com responsáveis</span>
                    {unreadChatCount > 0 && (
                      <span className="ml-auto inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-semibold bg-primary/20 text-primary tabular-nums">
                        {unreadChatCount}
                      </span>
                    )}
                  </>
                )}
              </button>
            </li>
          </ul>
        </div>

        {/* Desktop Collapse Footer */}
        {!isMobileDrawer && (
          <div
            data-sidebar="footer"
            className="hidden md:flex items-center justify-center border-t border-sidebar-border bg-sidebar py-2 px-2"
          >
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
              title={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
              className="grid size-10 place-items-center rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-md outline-none transition-transform duration-150 hover:scale-105 hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              {collapsed ? (
                <ChevronRight className="size-5" />
              ) : (
                <ChevronLeft className="size-5" />
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out ${
          collapsed ? 'w-14' : 'w-64'
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/65 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 flex h-full w-64 max-w-[82vw] flex-col border-r border-sidebar-border bg-sidebar shadow-xl">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
