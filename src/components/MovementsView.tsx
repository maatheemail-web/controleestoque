import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  ArrowDownRight, 
  ArrowUpRight, 
  PlusCircle, 
  MinusCircle, 
  Search, 
  Filter, 
  FileDown, 
  Calendar, 
  Boxes, 
  Building2, 
  User, 
  X, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';
import { Movement, Material, Department } from '../types.ts';
import { formatCurrency, formatDate, generateMovementsPDF } from '../lib/pdfGenerator.ts';

interface MovementsViewProps {
  movements: Movement[];
  materials: Material[];
  departments: Department[];
  onRegisterEntry: (data: any) => Promise<void>;
  onRegisterExit: (data: any) => Promise<void>;
  entryModalOpen: boolean;
  setEntryModalOpen: (open: boolean) => void;
  exitModalOpen: boolean;
  setExitModalOpen: (open: boolean) => void;
  preselectedMaterial: Material | null;
  setPreselectedMaterial: (m: Material | null) => void;
}

export const MovementsView: React.FC<MovementsViewProps> = ({
  movements,
  materials,
  departments,
  onRegisterEntry,
  onRegisterExit,
  entryModalOpen,
  setEntryModalOpen,
  exitModalOpen,
  setExitModalOpen,
  preselectedMaterial,
  setPreselectedMaterial,
}) => {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [materialFilter, setMaterialFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form states - Entry
  const [entryMaterialId, setEntryMaterialId] = useState<number | ''>(preselectedMaterial?.id || '');
  const [entryQuantity, setEntryQuantity] = useState<number | ''>('');
  const [entryUnitPrice, setEntryUnitPrice] = useState<number | ''>('');
  const [entrySupplier, setEntrySupplier] = useState('');
  const [entryInvoice, setEntryInvoice] = useState('');
  const [entryNotes, setEntryNotes] = useState('');
  const [entryError, setEntryError] = useState<string | null>(null);
  const [entrySubmitting, setEntrySubmitting] = useState(false);

  // Form states - Exit
  const [exitMaterialId, setExitMaterialId] = useState<number | ''>(preselectedMaterial?.id || '');
  const [exitQuantity, setExitQuantity] = useState<number | ''>('');
  const [exitDepartmentId, setExitDepartmentId] = useState<number | ''>('');
  const [exitReason, setExitReason] = useState('');
  const [exitRequestedBy, setExitRequestedBy] = useState('');
  const [exitNotes, setExitNotes] = useState('');
  const [exitError, setExitError] = useState<string | null>(null);
  const [exitSubmitting, setExitSubmitting] = useState(false);

  const selectedMaterialForExit = materials.find(m => m.id === Number(exitMaterialId));
  const selectedMaterialForEntry = materials.find(m => m.id === Number(entryMaterialId));

  const handleOpenEntry = (mat?: Material) => {
    const target = mat || preselectedMaterial || materials[0];
    setEntryMaterialId(target ? target.id : '');
    setEntryQuantity('');
    setEntryUnitPrice(target ? target.unit_price : '');
    setEntrySupplier('');
    setEntryInvoice('');
    setEntryNotes('');
    setEntryError(null);
    setEntryModalOpen(true);
  };

  const handleOpenExit = (mat?: Material) => {
    const target = mat || preselectedMaterial || materials[0];
    setExitMaterialId(target ? target.id : '');
    setExitQuantity('');
    setExitDepartmentId(departments[0]?.id || '');
    setExitReason('Manutenção preventiva');
    setExitRequestedBy('');
    setExitNotes('');
    setExitError(null);
    setExitModalOpen(true);
  };

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setEntryError(null);

    if (!entryMaterialId || !entryQuantity || Number(entryQuantity) <= 0) {
      setEntryError('Selecione o material e informe uma quantidade válida maior que zero.');
      return;
    }

    try {
      setEntrySubmitting(true);
      await onRegisterEntry({
        material_id: Number(entryMaterialId),
        quantity: Number(entryQuantity),
        unit_price: entryUnitPrice !== '' ? Number(entryUnitPrice) : undefined,
        supplier: entrySupplier.trim() || undefined,
        invoice_number: entryInvoice.trim() || undefined,
        notes: entryNotes.trim() || undefined,
      });
      setEntryModalOpen(false);
      setPreselectedMaterial(null);
    } catch (err: any) {
      setEntryError(err.message || 'Erro ao registrar entrada.');
    } finally {
      setEntrySubmitting(false);
    }
  };

  const handleSubmitExit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExitError(null);

    if (!exitMaterialId || !exitQuantity || Number(exitQuantity) <= 0 || !exitDepartmentId) {
      setExitError('Selecione o material, o setor solicitante e informe uma quantidade maior que zero.');
      return;
    }

    if (selectedMaterialForExit && Number(exitQuantity) > selectedMaterialForExit.current_stock) {
      setExitError(`Saldo insuficiente em estoque! Disponível: ${selectedMaterialForExit.current_stock} ${selectedMaterialForExit.unit}.`);
      return;
    }

    try {
      setExitSubmitting(true);
      await onRegisterExit({
        material_id: Number(exitMaterialId),
        quantity: Number(exitQuantity),
        department_id: Number(exitDepartmentId),
        reason: exitReason.trim() || 'Consumo operacional',
        requested_by: exitRequestedBy.trim() || undefined,
        notes: exitNotes.trim() || undefined,
      });
      setExitModalOpen(false);
      setPreselectedMaterial(null);
    } catch (err: any) {
      setExitError(err.message || 'Erro ao registrar saída.');
    } finally {
      setExitSubmitting(false);
    }
  };

  // Filter logic
  const filteredMovements = movements.filter(m => {
    const matchesSearch = 
      m.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.material_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.supplier && m.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.department_name && m.department_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.invoice_number && m.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.reason && m.reason.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || m.type === typeFilter;
    const matchesDept = departmentFilter === 'ALL' || String(m.department_id) === departmentFilter;
    const matchesMat = materialFilter === 'ALL' || String(m.material_id) === materialFilter;

    let matchesDate = true;
    if (startDate) {
      const mDate = m.date.substring(0, 10);
      matchesDate = matchesDate && mDate >= startDate;
    }
    if (endDate) {
      const mDate = m.date.substring(0, 10);
      matchesDate = matchesDate && mDate <= endDate;
    }

    return matchesSearch && matchesType && matchesDept && matchesMat && matchesDate;
  });

  const totalInValue = filteredMovements.filter(m => m.type === 'IN').reduce((acc, m) => acc + m.total_price, 0);
  const totalOutValue = filteredMovements.filter(m => m.type === 'OUT').reduce((acc, m) => acc + m.total_price, 0);
  const totalInQty = filteredMovements.filter(m => m.type === 'IN').reduce((acc, m) => acc + m.quantity, 0);
  const totalOutQty = filteredMovements.filter(m => m.type === 'OUT').reduce((acc, m) => acc + m.quantity, 0);

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Registro e Histórico de Movimentações</h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {movements.length} transações
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Rastreabilidade completa de entradas de fornecedores e requisições/saídas para departamentos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenEntry()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-md shadow-emerald-900/30"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Nova Entrada (Fornecedor)</span>
          </button>
          <button
            onClick={() => handleOpenExit()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition shadow-md shadow-rose-900/30"
          >
            <MinusCircle className="w-4 h-4" />
            <span>- Nova Saída (Setor)</span>
          </button>
          <button
            onClick={() => generateMovementsPDF(filteredMovements, { startDate, endDate })}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition"
          >
            <FileDown className="w-4 h-4 text-amber-400" />
            <span>Exportar Relatório PDF</span>
          </button>
        </div>
      </div>

      {/* Movement Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-emerald-900/40 rounded-xl p-4 shadow flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Entradas (Filtro)</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(totalInValue)}</div>
            <span className="text-xs text-slate-400">{totalInQty} unidades recebidas</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-rose-900/40 rounded-xl p-4 shadow flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Saídas (Consumo)</span>
            <div className="text-xl font-bold text-rose-400 mt-1">{formatCurrency(totalOutValue)}</div>
            <span className="text-xs text-slate-400">{totalOutQty} unidades fornecidas</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Saldo Líquido Período</span>
            <div className="text-xl font-bold text-amber-400 mt-1">{formatCurrency(totalInValue - totalOutValue)}</div>
            <span className="text-xs text-slate-400">{filteredMovements.length} transações analisadas</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 min-w-[260px] items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por material, código, fornecedor, setor ou NF..."
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
            {/* Type selector */}
            <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setTypeFilter('ALL')}
                className={`px-3 py-1 rounded font-medium ${typeFilter === 'ALL' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Todas
              </button>
              <button
                onClick={() => setTypeFilter('IN')}
                className={`px-3 py-1 rounded font-medium flex items-center gap-1 ${typeFilter === 'IN' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <ArrowDownRight className="w-3 h-3" />
                <span>Entradas</span>
              </button>
              <button
                onClick={() => setTypeFilter('OUT')}
                className={`px-3 py-1 rounded font-medium flex items-center gap-1 ${typeFilter === 'OUT' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <ArrowUpRight className="w-3 h-3" />
                <span>Saídas</span>
              </button>
            </div>

            {/* Department selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
              <span className="text-slate-400">Setor:</span>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="bg-transparent text-slate-200 outline-none text-xs cursor-pointer max-w-[140px]"
              >
                <option value="ALL" className="bg-slate-900">Todos os Setores</option>
                {departments.map((d) => (
                  <option key={d.id} value={String(d.id)} className="bg-slate-900">{d.code} - {d.name}</option>
                ))}
              </select>
            </div>

            {/* Date range filters */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-slate-200 outline-none text-xs cursor-pointer"
                title="Data inicial"
              />
              <span className="text-slate-600">até</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-slate-200 outline-none text-xs cursor-pointer"
                title="Data final"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="text-slate-400 hover:text-slate-200 text-[10px]"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Movements Traceability Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase font-bold text-slate-400">
              <tr>
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4 text-center">Tipo</th>
                <th className="py-3 px-4">Material / SKU</th>
                <th className="py-3 px-4 text-right">Quantidade</th>
                <th className="py-3 px-4 text-right">Custo Unit.</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4 text-center">Saldo Rastreável</th>
                <th className="py-3 px-4">Origem / Destino</th>
                <th className="py-3 px-4">Motivo / Documento</th>
                <th className="py-3 px-4">Operador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="font-semibold text-slate-400">Nenhuma movimentação encontrada com os filtros atuais.</p>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isEntry = m.type === 'IN';
                  return (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-300 font-mono text-[11px]">
                        {formatDate(m.date)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isEntry ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                            <ArrowDownRight className="w-3 h-3 text-emerald-400" />
                            Entrada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-rose-950 text-rose-300 border border-rose-800/60 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                            <ArrowUpRight className="w-3 h-3 text-rose-400" />
                            Saída
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-100">{m.material_name}</div>
                        <div className="text-[11px] font-mono text-amber-400">{m.material_code}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        <span className={isEntry ? 'text-emerald-400' : 'text-rose-400'}>
                          {isEntry ? `+${m.quantity}` : `-${m.quantity}`} {m.material_unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        {formatCurrency(m.unit_price)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                        {formatCurrency(m.total_price)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[11px]">
                        <span className="text-slate-400">{m.stock_before}</span>
                        <span className="text-slate-600 mx-1">→</span>
                        <span className="font-bold text-slate-200">{m.stock_after}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {isEntry ? (
                          <div>
                            <span className="font-medium text-slate-200">{m.supplier || 'Fornecedor padrão'}</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-amber-400">{m.department_code}</span>
                            <span className="text-slate-400 text-[11px] block">{m.department_name}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {isEntry ? (
                          <span className="text-slate-400 font-mono text-[11px]">
                            {m.invoice_number ? `NF: ${m.invoice_number}` : 'Aquisição'}
                          </span>
                        ) : (
                          <div>
                            <span>{m.reason || 'Consumo operacional'}</span>
                            {m.requested_by && (
                              <span className="block text-[11px] text-slate-400">Solic: {m.requested_by}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {m.user_name || 'Almoxarife'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nova Entrada de Material */}
      {entryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowDownRight className="w-5 h-5 text-emerald-400" />
                <span>Registrar Entrada de Material (Recebimento)</span>
              </h3>
              <button
                onClick={() => setEntryModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {entryError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-lg text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{entryError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitEntry} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Selecione o Material <span className="text-rose-400">*</span>
                </label>
                <select
                  value={entryMaterialId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setEntryMaterialId(id);
                    const sel = materials.find(m => m.id === id);
                    if (sel) {
                      setEntryUnitPrice(sel.unit_price);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 outline-none"
                >
                  <option value="" disabled>Escolha o item no estoque...</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id} className="bg-slate-900">
                      {m.code} - {m.name} (Atual: {m.current_stock} {m.unit})
                    </option>
                  ))}
                </select>
                {selectedMaterialForEntry && (
                  <p className="text-[11px] text-amber-400 mt-1">
                    Saldo atual em estoque: <strong>{selectedMaterialForEntry.current_stock} {selectedMaterialForEntry.unit}</strong> | Estoque mínimo: {selectedMaterialForEntry.min_quantity} {selectedMaterialForEntry.unit}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Quantidade de Entrada <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    placeholder="Ex: 50"
                    value={entryQuantity}
                    onChange={(e) => setEntryQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 font-mono outline-none text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Custo Unitário de Entrada (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex: 45.90"
                    value={entryUnitPrice}
                    onChange={(e) => setEntryUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Fornecedor / Origem
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Distribuidora Eletro Peças Ltda"
                    value={entrySupplier}
                    onChange={(e) => setEntrySupplier(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nota Fiscal (NF-e)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: NF-e 089.412"
                    value={entryInvoice}
                    onChange={(e) => setEntryInvoice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Observações de Recebimento
                </label>
                <textarea
                  rows={2}
                  placeholder="Lote de fabricação, inspeção de qualidade ou observações..."
                  value={entryNotes}
                  onChange={(e) => setEntryNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 outline-none resize-none"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Novo saldo projetado:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {selectedMaterialForEntry ? (
                    `${selectedMaterialForEntry.current_stock + (Number(entryQuantity) || 0)} ${selectedMaterialForEntry.unit}`
                  ) : '-'}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEntryModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={entrySubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition flex items-center gap-1.5 shadow-md shadow-emerald-900/30 disabled:opacity-50"
                >
                  {entrySubmitting ? (
                    <span>Registrando...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar Entrada</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nova Saída de Material */}
      {exitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-rose-400" />
                <span>Registrar Saída de Material (Baixa de Estoque)</span>
              </h3>
              <button
                onClick={() => setExitModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {exitError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-lg text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{exitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitExit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Selecione o Material <span className="text-rose-400">*</span>
                </label>
                <select
                  value={exitMaterialId}
                  onChange={(e) => setExitMaterialId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 outline-none"
                >
                  <option value="" disabled>Escolha o item no estoque...</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id} className="bg-slate-900" disabled={m.current_stock <= 0}>
                      {m.code} - {m.name} ({m.current_stock > 0 ? `Disponível: ${m.current_stock} ${m.unit}` : 'ZERADO / INDISPONÍVEL'})
                    </option>
                  ))}
                </select>
                {selectedMaterialForExit && (
                  <p className={`text-[11px] mt-1 ${selectedMaterialForExit.current_stock <= selectedMaterialForExit.min_quantity ? 'text-amber-400' : 'text-slate-400'}`}>
                    Saldo disponível para baixa: <strong>{selectedMaterialForExit.current_stock} {selectedMaterialForExit.unit}</strong> | Preço: {formatCurrency(selectedMaterialForExit.unit_price)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Quantidade de Saída <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={selectedMaterialForExit ? selectedMaterialForExit.current_stock : 999999}
                    step="1"
                    placeholder="Ex: 5"
                    value={exitQuantity}
                    onChange={(e) => setExitQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 font-mono outline-none text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Setor Solicitante <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={exitDepartmentId}
                    onChange={(e) => setExitDepartmentId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 outline-none"
                  >
                    <option value="" disabled>Escolha o setor...</option>
                    {departments.filter(d => d.active).map((d) => (
                      <option key={d.id} value={d.id} className="bg-slate-900">
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Motivo / Finalidade <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Troca preventiva da Linha 2"
                    value={exitReason}
                    onChange={(e) => setExitReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nome do Solicitante
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Lucas Ferreira (Técnico)"
                    value={exitRequestedBy}
                    onChange={(e) => setExitRequestedBy(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Observações Adicionais
                </label>
                <textarea
                  rows={2}
                  placeholder="Número de ordem de serviço, equipamento ou centro de custo..."
                  value={exitNotes}
                  onChange={(e) => setExitNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 outline-none resize-none"
                />
              </div>

              {selectedMaterialForExit && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Saldo restante após a baixa:</span>
                  <span className={`font-mono font-bold ${
                    (selectedMaterialForExit.current_stock - (Number(exitQuantity) || 0)) <= selectedMaterialForExit.min_quantity
                      ? 'text-amber-400'
                      : 'text-slate-200'
                  }`}>
                    {selectedMaterialForExit.current_stock - (Number(exitQuantity) || 0)} {selectedMaterialForExit.unit}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setExitModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={exitSubmitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition flex items-center gap-1.5 shadow-md shadow-rose-900/30 disabled:opacity-50"
                >
                  {exitSubmitting ? (
                    <span>Registrando...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar Baixa de Estoque</span>
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
