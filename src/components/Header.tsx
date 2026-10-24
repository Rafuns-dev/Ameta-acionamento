import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Code2, Globe, Menu, Moon, Sun, UserCheck } from 'lucide-react';
import { AppNotification, NavSection } from '../types';
import { USER_PROFILE } from '../data/initialData';

interface HeaderProps {
  activeSection: NavSection;
  theme: 'escuro' | 'claro';
  onToggleTheme: () => void;
  onOpenMobileMenu: () => void;
  notifications: AppNotification[];
  onMarkAllNotificationsRead: () => void;
  onOpenHtmlModal: () => void;
  onOpenIntegrationModal: () => void;
  onNavigate: (section: NavSection) => void;
}

const SECTION_TITLES: Record<NavSection, string> = {
  [NavSection.INICIO]: 'Início',
  [NavSection.ACIONAMENTOS]: 'Acionamentos',
  [NavSection.AGENDA]: 'Agenda',
  [NavSection.CHAT_RESPONSAVEIS]: 'Chat interno com responsáveis',
};

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  theme,
  onToggleTheme,
  onOpenMobileMenu,
  notifications,
  onMarkAllNotificationsRead,
  onOpenHtmlModal,
  onOpenIntegrationModal,
  onNavigate,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4">
      {/* Mobile menu trigger */}
      <button
        type="button"
        onClick={onOpenMobileMenu}
        aria-label="Abrir menu de navegação"
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-primary/40 bg-primary/15 text-primary transition-colors hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden cursor-pointer"
      >
        <Menu className="size-5" />
      </button>

      {/* Page Title & Authenticated Subtitle */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {SECTION_TITLES[activeSection]}
        </p>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground truncate">
          <span>Ameta · Área autenticada</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-400"></span>
            Disponível em campo
          </span>
        </div>
      </div>

      {/* Conectar com Outro Sistema Trigger */}
      <button
        type="button"
        onClick={onOpenIntegrationModal}
        title="Configurar integração com o outro sistema (API REST, Webhooks e sincronização de demandas)"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring whitespace-nowrap shrink-0 cursor-pointer"
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
        </span>
        <Globe className="size-3.5" />
        <span className="hidden sm:inline">Conectar Outro Sistema</span>
        <span className="sm:hidden">Integrar</span>
      </button>

      {/* Standalone Single-File HTML Export Trigger */}
      <button
        type="button"
        onClick={onOpenHtmlModal}
        title="Ver ou baixar código HTML único com Tailwind CDN"
        className="hidden md:inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Code2 className="size-3.5 text-primary" />
        <span>HTML Único</span>
      </button>

      {/* Theme Toggle */}
      <button
        type="button"
        onClick={onToggleTheme}
        aria-label={theme === 'escuro' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        title={theme === 'escuro' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
      >
        {theme === 'escuro' ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </button>

      {/* Notifications Popover */}
      <div className="relative" ref={notifRef}>
        <button
          type="button"
          onClick={() => {
            setNotifOpen((prev) => !prev);
            setProfileOpen(false);
          }}
          aria-label="Abrir notificações"
          title="Notificações"
          className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
        >
          <Bell className="size-5" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 flex size-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping"></span>
              <span className="relative inline-flex size-2 rounded-full bg-amber-500"></span>
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-md border border-border bg-sidebar p-3 shadow-xl z-50">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-semibold text-foreground">
                Notificações de Campo
              </span>
              <button
                type="button"
                onClick={onMarkAllNotificationsRead}
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer whitespace-nowrap"
              >
                <CheckCheck className="size-3.5" />
                <span>Marcar como lidas</span>
              </button>
            </div>
            <ul className="mt-2 divide-y divide-border max-h-64 overflow-y-auto">
              {notifications.map((item) => (
                <li
                  key={item.id}
                  onClick={() => {
                    if (item.actionUrl) onNavigate(item.actionUrl);
                    setNotifOpen(false);
                  }}
                  className={`py-2.5 text-xs cursor-pointer hover:bg-accent/40 rounded px-1 transition-colors ${
                    !item.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {item.time}
                    </span>
                  </div>
                  <p className="mt-0.5 text-muted-foreground leading-relaxed">
                    {item.detail}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* User Profile Button & Menu */}
      <div className="relative" ref={profileRef}>
        <button
          type="button"
          onClick={() => {
            setProfileOpen((prev) => !prev);
            setNotifOpen(false);
          }}
          aria-haspopup="menu"
          aria-expanded={profileOpen}
          className="inline-flex h-9 items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
        >
          <span className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary text-secondary-foreground font-semibold text-xs">
            RL
          </span>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-semibold leading-tight text-foreground">
              {USER_PROFILE.shortName}
            </p>
            <p className="text-[10px] leading-tight text-muted-foreground">
              {USER_PROFILE.roleLabel}
            </p>
          </div>
        </button>

        {profileOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-md border border-border bg-sidebar p-3 shadow-xl z-50">
            <div className="border-b border-border pb-2.5">
              <p className="text-xs font-semibold text-foreground">
                {USER_PROFILE.fullName}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {USER_PROFILE.email}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {USER_PROFILE.roleBadge} · {USER_PROFILE.company} · {USER_PROFILE.registration}
              </p>
            </div>

            <div className="mt-2 flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  onNavigate(NavSection.ACIONAMENTOS);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-foreground hover:bg-accent cursor-pointer whitespace-nowrap"
              >
                <UserCheck className="size-3.5 text-primary" />
                <span>Meus acionamentos</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  onNavigate(NavSection.CHAT_RESPONSAVEIS);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-foreground hover:bg-accent cursor-pointer whitespace-nowrap"
              >
                <UserCheck className="size-3.5 text-primary" />
                <span>Falar com responsáveis</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  onOpenHtmlModal();
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-foreground hover:bg-accent cursor-pointer whitespace-nowrap"
              >
                <Code2 className="size-3.5 text-primary" />
                <span>Exportar HTML Único (CDN)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
