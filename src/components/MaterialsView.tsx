import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  PlusCircle, 
  MinusCircle, 
  AlertTriangle, 
  CheckCircle2, 
  FileDown, 
  Boxes,
  MapPin,
  X
} from 'lucide-react';
import { Material } from '../types.ts';
import { formatCurrency, generateCurrentStockPDF } from '../lib/pdfGenerator.ts';

interface MaterialsViewProps {
  materials: Material[];
  onSaveMaterial: (material: Partial<Material>) => Promise<void>;
  onDeleteMaterial: (id: number) => Promise<void>;
  onOpenQuickEntry: (material: Material) => void;
  onOpenQuickExit: (material: Material) => void;
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({
  materials,
  onSaveMaterial,
  onDeleteMaterial,
  onOpenQuickEntry,
  onOpenQuickExit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('UN');
  const [minQuantity, setMinQuantity] = useState<number | ''>(10);
  const [unitPrice, setUnitPrice] = useState<number | ''>(0);
  const [initialStock, setInitialStock] = useState<number | ''>(0);
  const [category, setCategory] = useState('Mecânica');
  const [location, setLocation] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Categories list
  const categories = Array.from(new Set(materials.map(m => m.category || 'Geral'))).filter(Boolean);

  const openCreateModal = () => {
    setEditingMaterial(null);
    setCode(`MAT-${String(materials.length + 1).padStart(3, '0')}`);
    setName('');
    setUnit('UN');
    setMinQuantity(10);
    setUnitPrice(0);
    setInitialStock(0);
    setCategory('Geral');
    setLocation('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (mat: Material) => {
    setEditingMaterial(mat);
    setCode(mat.code);
    setName(mat.name);
    setUnit(mat.unit);
    setMinQuantity(mat.min_quantity);
    setUnitPrice(mat.unit_price);
    setInitialStock(mat.current_stock);
    setCategory(mat.category || 'Geral');
    setLocation(mat.location || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!code.trim() || !name.trim() || !unit.trim()) {
      setFormError('Código, nome do material e unidade de medida são obrigatórios.');
      return;
    }

    try {
      setSaving(true);
      if (editingMaterial) {
        await onSaveMaterial({
          id: editingMaterial.id,
          code: code.trim(),
          name: name.trim(),
          unit: unit.trim(),
          min_quantity: Number(minQuantity) || 0,
          unit_price: Number(unitPrice) || 0,
          category: category.trim(),
          location: location.trim(),
        });
      } else {
        await onSaveMaterial({
          code: code.trim(),
          name: name.trim(),
          unit: unit.trim(),
          min_quantity: Number(minQuantity) || 0,
          unit_price: Number(unitPrice) || 0,
          current_stock: Number(initialStock) || 0,
          category: category.trim(),
          location: location.trim(),
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar material.');
    } finally {
      setSaving(false);
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.location && m.location.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || m.category === categoryFilter;

    let matchesStatus = true;
    if (statusFilter === 'OUT_OF_STOCK') matchesStatus = m.current_stock <= 0;
    else if (statusFilter === 'LOW') matchesStatus = m.current_stock > 0 && m.current_stock <= m.min_quantity;
    else if (statusFilter === 'NORMAL') matchesStatus = m.current_stock > m.min_quantity;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalFilteredValue = filteredMaterials.reduce((acc, m) => acc + (m.current_stock * m.unit_price), 0);

  return (
    <div className="space-y-5">
      {/* Header & Filter Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Catálogo e Cadastro de Materiais</h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {materials.length} cadastrados
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Controle individual de SKUs, unidades de medida, quantidades mínimas e valorização contábil.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => generateCurrentStockPDF(filteredMaterials)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition shadow-sm"
          >
            <FileDown className="w-4 h-4 text-amber-400" />
            <span>Exportar PDF</span>
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cadastrar Material</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-1 min-w-[260px] items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, nome do material ou prateleira..."
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

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-400">Categoria:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-slate-200 outline-none font-medium text-xs cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Todas as Categorias</option>
              {categories.map((c) => (
                <option key={c} value={c} className="bg-slate-900">{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 outline-none font-medium text-xs cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Todos os Status</option>
              <option value="NORMAL" className="bg-slate-900">Estoque Normal</option>
              <option value="LOW" className="bg-slate-900">Abaixo do Mínimo</option>
              <option value="OUT_OF_STOCK" className="bg-slate-900">Ruptura / Zerado</option>
            </select>
          </div>

          <div className="text-slate-400 pl-2">
            Mostrando <strong className="text-slate-200">{filteredMaterials.length}</strong> de {materials.length} itens | Total: <strong className="text-amber-400">{formatCurrency(totalFilteredValue)}</strong>
          </div>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase font-bold text-slate-400">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Descrição do Material</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Localização</th>
                <th className="py-3 px-4 text-right">Estq. Atual</th>
                <th className="py-3 px-4 text-right">Mínimo</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Preço Unit.</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4 text-center">Ações Operacionais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <Boxes className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="font-semibold text-slate-400">Nenhum material encontrado com os filtros selecionados.</p>
                    <button
                      onClick={openCreateModal}
                      className="mt-3 text-xs text-amber-400 hover:underline font-medium"
                    >
                      Cadastrar novo material agora
                    </button>
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((m) => {
                  const isZero = m.current_stock <= 0;
                  const isLow = m.current_stock > 0 && m.current_stock <= m.min_quantity;
                  const totalValue = m.current_stock * m.unit_price;

                  return (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {m.code}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-100">{m.name}</div>
                        <div className="text-[11px] text-slate-400">Unidade: {m.unit}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                          {m.category || 'Geral'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {m.location ? (
                          <span className="flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {m.location}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-100">
                        <span className={isZero ? 'text-rose-400 font-extrabold' : isLow ? 'text-amber-400 font-extrabold' : 'text-slate-100'}>
                          {m.current_stock.toLocaleString('pt-BR')} {m.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400">
                        {m.min_quantity.toLocaleString('pt-BR')} {m.unit}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isZero ? (
                          <span className="bg-rose-950/80 text-rose-300 border border-rose-700/60 px-2 py-0.5 rounded text-[10px] font-bold">
                            RUPTURA
                          </span>
                        ) : isLow ? (
                          <span className="bg-amber-950/80 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded text-[10px] font-bold">
                            ABAIXO DO MÍN.
                          </span>
                        ) : (
                          <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded text-[10px] font-semibold">
                            NORMAL
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {formatCurrency(m.unit_price)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100">
                        {formatCurrency(totalValue)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onOpenQuickEntry(m)}
                            title="Entrada rápida de estoque"
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50 rounded transition"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenQuickExit(m)}
                            title="Saída / Baixa rápida"
                            disabled={m.current_stock <= 0}
                            className={`p-1.5 rounded transition ${
                              m.current_stock <= 0
                                ? 'text-slate-600 cursor-not-allowed'
                                : 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/50'
                            }`}
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(m)}
                            title="Editar cadastro"
                            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteMaterial(m.id)}
                            title="Excluir material"
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Cadastro / Edição de Material */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-amber-400" />
                <span>{editingMaterial ? 'Editar Material' : 'Cadastrar Novo Material'}</span>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Código do Material (SKU) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: MAT-015"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Unidade de Medida <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 outline-none"
                  >
                    <option value="UN">UN - Unidade</option>
                    <option value="KG">KG - Quilograma</option>
                    <option value="M">M - Metro</option>
                    <option value="CX">CX - Caixa</option>
                    <option value="L">L - Litro</option>
                    <option value="PC">PC - Peça</option>
                    <option value="PAR">PAR - Par</option>
                    <option value="RL">RL - Rolo</option>
                    <option value="BD">BD - Balde</option>
                    <option value="CT">CT - Cento</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nome / Descrição Completa <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Rolamento de Esferas 6204-2RSH"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Quantidade Mínima (Alerta)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Ex: 15"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 font-mono outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Dispara alerta visual quando o saldo for menor ou igual.</p>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Preço Unitário (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex: 38.50"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 font-mono outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Custo unitário base para valorização do estoque.</p>
                </div>
              </div>

              {!editingMaterial && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Estoque Inicial de Implantação
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Ex: 50"
                    value={initialStock}
                    onChange={(e) => setInitialStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 font-mono outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Se maior que zero, registrará automaticamente a entrada inicial no histórico.</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Categoria
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Mecânica, Elétrica, EPI..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Localização no Almoxarifado
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Corredor B - Prateleira 03"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 outline-none"
                  />
                </div>
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
                      <span>{editingMaterial ? 'Salvar Alterações' : 'Confirmar Cadastro'}</span>
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
