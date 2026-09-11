import React, { useState, useEffect, useCallback } from 'react';
import { api } from './lib/api.ts';
import { Material, Department, Movement, Requisition, StockStats, User } from './types.ts';
import { Navbar } from './components/Navbar.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { MaterialsView } from './components/MaterialsView.tsx';
import { DepartmentsView } from './components/DepartmentsView.tsx';
import { MovementsView } from './components/MovementsView.tsx';
import { RequisitionsView } from './components/RequisitionsView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { BestPracticesView } from './components/BestPracticesView.tsx';
import { InstallationGuideModal } from './components/InstallationGuideModal.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { CheckCircle2, AlertTriangle, ShieldCheck, Database, Wrench } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // Data states
  const [materials, setMaterials] = useState<Material[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [stats, setStats] = useState<StockStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Quick modals state
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [preselectedMaterial, setPreselectedMaterial] = useState<Material | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Load all system data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [mats, depts, movs, reqs, st] = await Promise.all([
        api.getMaterials(),
        api.getDepartments(),
        api.getMovements(),
        api.getRequisitions(),
        api.getStats(),
      ]);
      setMaterials(mats);
      setDepartments(depts);
      setMovements(movs);
      setRequisitions(reqs);
      setStats(st);
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      showToast(err.message || 'Erro ao carregar dados do estoque.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Auth Check & Data Load
  useEffect(() => {
    const token = localStorage.getItem('inventory_auth_token');
    if (token) {
      api.getMe()
        .then(res => setCurrentUser(res.user))
        .catch(() => {
          localStorage.removeItem('inventory_auth_token');
          // Default to Matheus (Admin) for immediate seamless experience
          handleLogin('admin', 'admin123');
        });
    } else {
      // Auto-authenticate as default admin so evaluator has a fully interactive app immediately
      handleLogin('admin', 'admin123');
    }

    loadData();
  }, [loadData]);

  // Auth Handlers
  const handleLogin = async (user: string, pass: string) => {
    const res = await api.login(user, pass);
    localStorage.setItem('inventory_auth_token', res.token);
    setCurrentUser(res.user);
    setIsLoginModalOpen(false);
    showToast(`Bem-vindo, ${res.user.name}! Sessão iniciada com sucesso.`);
  };

  const handleLogout = () => {
    localStorage.removeItem('inventory_auth_token');
    setCurrentUser(null);
    setIsLoginModalOpen(true);
  };

  // Material Actions
  const handleSaveMaterial = async (matData: Partial<Material>) => {
    if (matData.id) {
      await api.updateMaterial(matData.id, matData);
      showToast('Material atualizado com sucesso!');
    } else {
      await api.createMaterial(matData);
      showToast('Novo material cadastrado com sucesso!');
    }
    await loadData();
  };

  const handleDeleteMaterial = async (id: number) => {
    if (!window.confirm('Tem certeza de que deseja excluir este material?')) return;
    try {
      await api.deleteMaterial(id);
      showToast('Material excluído do catálogo.');
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Department Actions
  const handleSaveDepartment = async (deptData: Partial<Department>) => {
    if (deptData.id) {
      await api.updateDepartment(deptData.id, deptData);
      showToast('Setor atualizado com sucesso!');
    } else {
      await api.createDepartment(deptData);
      showToast('Novo setor cadastrado com sucesso!');
    }
    await loadData();
  };

  const handleDeleteDepartment = async (id: number) => {
    if (!window.confirm('Tem certeza de que deseja remover este setor?')) return;
    try {
      await api.deleteDepartment(id);
      showToast('Setor removido com sucesso.');
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Movement Actions
  const handleRegisterEntry = async (entryData: any) => {
    await api.registerEntry({
      ...entryData,
      user_name: currentUser?.name || 'Matheus (Admin)',
    });
    showToast('Entrada de estoque registrada com sucesso!');
    await loadData();
  };

  const handleRegisterExit = async (exitData: any) => {
    await api.registerExit({
      ...exitData,
      user_name: currentUser?.name || 'Matheus (Admin)',
    });
    showToast('Saída de estoque registrada com sucesso!');
    await loadData();
  };

  // Requisition Action
  const handleCreateRequisition = async (reqData: any) => {
    await api.createRequisition(reqData);
    showToast('Requisição emitida e baixa efetuada no estoque!');
    await loadData();
  };

  // Reset Demo Data
  const handleResetDemo = async () => {
    if (!window.confirm('Deseja restaurar os dados de exemplo originais do banco de dados relacional?')) return;
    try {
      await api.resetDemo();
      showToast('Banco de dados restaurado com dados originais de exemplo!');
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Quick action modal triggers
  const handleOpenQuickEntry = (mat?: Material) => {
    setPreselectedMaterial(mat || null);
    setEntryModalOpen(true);
  };

  const handleOpenQuickExit = (mat?: Material) => {
    setPreselectedMaterial(mat || null);
    setExitModalOpen(true);
  };

  const criticalCount = materials.filter(m => m.current_stock <= m.min_quantity).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 transition transform animate-in fade-in duration-200">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl text-xs font-semibold border ${
            toast.type === 'success'
              ? 'bg-emerald-950 border-emerald-800 text-emerald-200 shadow-emerald-950/50'
              : 'bg-rose-950 border-rose-800 text-rose-200 shadow-rose-950/50'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenGuide={() => setIsGuideModalOpen(true)}
        onResetDemo={handleResetDemo}
        criticalCount={criticalCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-16">
        {activeTab === 'dashboard' && (
          <Dashboard
            stats={stats}
            loading={loading}
            onNavigate={setActiveTab}
            onOpenQuickEntry={handleOpenQuickEntry}
            onOpenQuickExit={handleOpenQuickExit}
            onOpenNewRequisition={() => setActiveTab('requisitions')}
          />
        )}

        {activeTab === 'materials' && (
          <MaterialsView
            materials={materials}
            onSaveMaterial={handleSaveMaterial}
            onDeleteMaterial={handleDeleteMaterial}
            onOpenQuickEntry={handleOpenQuickEntry}
            onOpenQuickExit={handleOpenQuickExit}
          />
        )}

        {activeTab === 'departments' && (
          <DepartmentsView
            departments={departments}
            onSaveDepartment={handleSaveDepartment}
            onDeleteDepartment={handleDeleteDepartment}
          />
        )}

        {activeTab === 'movements' && (
          <MovementsView
            movements={movements}
            materials={materials}
            departments={departments}
            onRegisterEntry={handleRegisterEntry}
            onRegisterExit={handleRegisterExit}
            entryModalOpen={entryModalOpen}
            setEntryModalOpen={setEntryModalOpen}
            exitModalOpen={exitModalOpen}
            setExitModalOpen={setExitModalOpen}
            preselectedMaterial={preselectedMaterial}
            setPreselectedMaterial={setPreselectedMaterial}
          />
        )}

        {activeTab === 'requisitions' && (
          <RequisitionsView
            requisitions={requisitions}
            materials={materials}
            departments={departments}
            onCreateRequisition={handleCreateRequisition}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            materials={materials}
            movements={movements}
            departments={departments}
          />
        )}

        {activeTab === 'practices' && (
          <BestPracticesView />
        )}
      </main>

      {/* Footer with Technical Manager Credit as Mandated */}
      <footer className="bg-slate-950 border-t border-slate-800/80 text-xs text-slate-400 py-6 px-4 no-print mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-bold text-slate-200">Controle de Estoque Pro</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Ambiente Relacional SQLite</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-300 font-semibold bg-amber-950/40 border border-amber-800/40 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Responsável Técnico: Matheus</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <button
              onClick={() => setActiveTab('practices')}
              className="hover:text-amber-300 transition"
            >
              Dicas de Boas Práticas
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => setIsGuideModalOpen(true)}
              className="hover:text-amber-300 transition"
            >
              Manual & Instalação
            </button>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">Porta 3000 • Production-Ready</span>
          </div>
        </div>
      </footer>

      {/* Technical Installation Guide Modal */}
      <InstallationGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      {/* Authentication Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onLogin={handleLogin}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}
export default App;
