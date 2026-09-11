import React from 'react';
import { 
  LayoutDashboard, 
  Boxes, 
  Building2, 
  ArrowLeftRight, 
  FileText, 
  BarChart3, 
  BookOpen, 
  HelpCircle, 
  LogOut, 
  User, 
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { User as UserType } from '../types.ts';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserType | null;
  onLogout: () => void;
  onOpenGuide: () => void;
  onResetDemo: () => void;
  criticalCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  onOpenGuide,
  onResetDemo,
  criticalCount,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Indicadores', icon: LayoutDashboard },
    { id: 'materials', label: 'Materiais', icon: Boxes, badge: criticalCount > 0 ? criticalCount : undefined },
    { id: 'departments', label: 'Setores', icon: Building2 },
    { id: 'movements', label: 'Movimentações', icon: ArrowLeftRight },
    { id: 'requisitions', label: 'Requisições', icon: FileText },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'practices', label: 'Boas Práticas', icon: BookOpen, highlight: true },
  ];

  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 no-print">
      {/* Top Utility Ribbon */}
      <div className="bg-slate-900/80 px-4 py-1.5 border-b border-slate-800/80 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold tracking-wide">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Sistema Operacional de Almoxarifado v2.4</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <div className="text-slate-300 flex items-center gap-1">
            <span className="text-slate-400">Responsável Técnico:</span>
            <span className="font-semibold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
              Matheus
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetDemo}
            title="Restaura os dados originais do banco de dados relacional"
            className="text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 transition text-[11px]"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Restaurar Dados Demo</span>
          </button>
          <span className="text-slate-700">|</span>
          <button
            onClick={onOpenGuide}
            className="text-amber-400 hover:text-amber-300 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-amber-950/40 border border-amber-500/30 transition text-[11px] font-medium"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Guia de Instalação & Uso</span>
          </button>
          <span className="text-slate-700">|</span>
          {currentUser && (
            <div className="flex items-center gap-2 pl-1">
              <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/70 px-2 py-0.5 rounded border border-slate-700">
                <User className="w-3 h-3 text-amber-400" />
                <span className="font-medium">{currentUser.name}</span>
                <span className="text-[10px] text-slate-400 bg-slate-900 px-1 py-0.2 rounded uppercase">
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Encerrar sessão"
                className="text-slate-400 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-extrabold text-xl">
              <Boxes className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight leading-none">
                  Controle de Estoque <span className="text-amber-400">Pro</span>
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-950/80 text-blue-300 border border-blue-800/60 px-1.5 py-0.5 rounded">
                  Relacional
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Gestão Operacional, Entradas, Saídas & PDF</p>
            </div>
          </div>

          {/* Desktop Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                      : tab.highlight
                      ? 'text-amber-400 hover:bg-amber-950/30 hover:text-amber-300 border border-amber-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : tab.highlight ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-slate-950 text-amber-400' : 'bg-rose-500 text-white'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile / Tablet Horizontal Scroll Navigation */}
        <div className="lg:hidden flex items-center gap-1 pb-3 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'text-slate-300 bg-slate-900/60 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="text-[10px] bg-rose-500 text-white px-1.5 rounded-full font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
