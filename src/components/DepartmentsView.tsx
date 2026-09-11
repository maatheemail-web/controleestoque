import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  UserCheck, 
  ShieldCheck,
  Search
} from 'lucide-react';
import { Department } from '../types.ts';

interface DepartmentsViewProps {
  departments: Department[];
  onSaveDepartment: (department: Partial<Department>) => Promise<void>;
  onDeleteDepartment: (id: number) => Promise<void>;
}

export const DepartmentsView: React.FC<DepartmentsViewProps> = ({
  departments,
  onSaveDepartment,
  onDeleteDepartment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [manager, setManager] = useState('');
  const [active, setActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreateModal = () => {
    setEditingDept(null);
    setCode('');
    setName('');
    setManager('');
    setActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (d: Department) => {
    setEditingDept(d);
    setCode(d.code);
    setName(d.name);
    setManager(d.manager);
    setActive(Boolean(d.active));
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!code.trim() || !name.trim() || !manager.trim()) {
      setFormError('Sigla, nome do setor e responsável são campos obrigatórios.');
      return;
    }

    try {
      setSaving(true);
      if (editingDept) {
        await onSaveDepartment({
          id: editingDept.id,
          code: code.trim().toUpperCase(),
          name: name.trim(),
          manager: manager.trim(),
          active: active ? 1 : 0,
        });
      } else {
        await onSaveDepartment({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          manager: manager.trim(),
          active: active ? 1 : 0,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar setor.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = departments.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.manager.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Cadastro de Setores & Departamentos</h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {departments.length} centros de custo
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Gestão dos departamentos solicitantes para rastreabilidade de requisições e saídas de materiais.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition shadow-md shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>+ Cadastrar Setor</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
        <div className="flex flex-1 max-w-md items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por sigla, nome do departamento ou responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-slate-100 placeholder-slate-500 w-full outline-none text-xs"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-slate-500 hover:text-slate-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="text-slate-400">
          Total de setores ativos: <strong className="text-emerald-400">{departments.filter(d => d.active).length}</strong>
        </div>
      </div>

      {/* Grid of Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((dept) => (
          <div 
            key={dept.id}
            className={`bg-slate-900/90 border rounded-xl p-5 shadow-lg transition flex flex-col justify-between ${
              dept.active ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/60 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {dept.code}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  dept.active ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' : 'bg-slate-800 text-slate-400'
                }`}>
                  {dept.active ? 'ATIVO' : 'INATIVO'}
                </span>
              </div>

              <h3 className="text-base font-bold text-white mt-3">{dept.name}</h3>
              
              <div className="mt-4 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Responsável: <strong className="text-slate-100">{dept.manager}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Movimentações vinculadas: <strong className="text-amber-300 font-mono">{dept.materials_count || 0}</strong></span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => openEditModal(dept)}
                className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Editar</span>
              </button>
              <button
                onClick={() => onDeleteDepartment(dept.id)}
                className="px-2.5 py-1 text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-950/80 border border-rose-800/40 rounded transition flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Cadastro / Edição de Setor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <span>{editingDept ? 'Editar Departamento' : 'Cadastrar Novo Setor'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-lg text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Sigla / Código do Setor <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: MANUT, PROD, TI, ADM..."
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nome Completo do Setor <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Manutenção Industrial & Predial"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Responsável / Gestor <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Eng. Roberto Santos"
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="deptActive"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700 cursor-pointer"
                />
                <label htmlFor="deptActive" className="text-slate-300 font-medium cursor-pointer">
                  Setor ativo (habilitado para requisições e baixas)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {saving ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingDept ? 'Salvar Alterações' : 'Cadastrar Setor'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
