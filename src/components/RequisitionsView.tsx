import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Printer, 
  FileDown, 
  Search, 
  Calendar, 
  Building2, 
  User, 
  X, 
  Trash2, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle,
  Eye
} from 'lucide-react';
import { Requisition, Material, Department } from '../types.ts';
import { formatCurrency, formatDate, generateRequisitionPDF } from '../lib/pdfGenerator.ts';

interface RequisitionsViewProps {
  requisitions: Requisition[];
  materials: Material[];
  departments: Department[];
  onCreateRequisition: (data: any) => Promise<void>;
}

interface NewItemRow {
  material_id: number;
  quantity: number;
}

export const RequisitionsView: React.FC<RequisitionsViewProps> = ({
  requisitions,
  materials,
  departments,
  onCreateRequisition,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingReq, setViewingReq] = useState<Requisition | null>(null);

  // Form states for new requisition
  const [deptId, setDeptId] = useState<number | ''>(departments[0]?.id || '');
  const [requestedBy, setRequestedBy] = useState('');
  const [authorizedBy, setAuthorizedBy] = useState('Matheus (Almoxarife Chefe)');
  const [reason, setReason] = useState('Consumo de rotina e manutenção');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<NewItemRow[]>([
    { material_id: materials[0]?.id || 0, quantity: 1 }
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openCreateModal = () => {
    setDeptId(departments[0]?.id || '');
    setRequestedBy('');
    setAuthorizedBy('Matheus (Almoxarife Chefe)');
    setReason('Consumo operacional e reparos');
    setNotes('');
    setItems([{ material_id: materials[0]?.id || 0, quantity: 1 }]);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const addItemRow = () => {
    const nextMat = materials.find(m => !items.some(i => i.material_id === m.id && m.current_stock > 0)) || materials[0];
    if (nextMat) {
      setItems([...items, { material_id: nextMat.id, quantity: 1 }]);
    }
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, field: keyof NewItemRow, val: any) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: val };
    setItems(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!deptId || !requestedBy.trim() || items.length === 0) {
      setFormError('Preencha o setor, solicitante e ao menos 1 item com quantidade válida.');
      return;
    }

    // Validate quantities against stock
    for (const item of items) {
      const mat = materials.find(m => m.id === item.material_id);
      if (!mat) {
        setFormError('Item inválido selecionado.');
        return;
      }
      if (item.quantity <= 0) {
        setFormError(`Quantidade inválida para o item ${mat.name}.`);
        return;
      }
      if (item.quantity > mat.current_stock) {
        setFormError(`Saldo insuficiente para o item "${mat.name}". Disponível em estoque: ${mat.current_stock} ${mat.unit}.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      await onCreateRequisition({
        department_id: Number(deptId),
        requested_by: requestedBy.trim(),
        authorized_by: authorizedBy.trim() || undefined,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
        items: items.map(i => ({ material_id: i.material_id, quantity: i.quantity })),
      });
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao gerar requisição.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequisitions = requisitions.filter(r => 
    r.req_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.requested_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.department_name && r.department_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.department_code && r.department_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Requisições de Saída de Material</h2>
            <span className="text-xs bg-amber-400/10 text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded-full font-mono font-bold">
              Layout PDF / Impressão A4
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Geração de requisições formais com protocolo, rastreabilidade e layout pronto para impressão e assinatura física.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition shadow-md shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nova Requisição de Materiais</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
        <div className="flex flex-1 max-w-md items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por número da requisição, setor ou solicitante..."
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
          Total de requisições emitidas: <strong className="text-slate-200">{requisitions.length}</strong>
        </div>
      </div>

      {/* Requisitions List Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase font-bold text-slate-400">
              <tr>
                <th className="py-3 px-4">Protocolo / Nº</th>
                <th className="py-3 px-4">Data de Emissão</th>
                <th className="py-3 px-4">Setor Solicitante</th>
                <th className="py-3 px-4">Solicitado Por</th>
                <th className="py-3 px-4 text-center">Itens</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Ações & Impressão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRequisitions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="font-semibold text-slate-400">Nenhuma requisição encontrada.</p>
                  </td>
                </tr>
              ) : (
                filteredRequisitions.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      {req.req_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                      {formatDate(req.date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-200">{req.department_code}</span>
                      <span className="text-slate-400 text-[11px] block">{req.department_name}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-300">
                      {req.requested_by}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
                        {req.items?.length || 0} itens
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-400">
                      {formatCurrency(req.total_value)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewingReq(req)}
                          title="Visualizar documento pronto para impressão A4"
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium transition flex items-center gap-1 border border-slate-700"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>Visualizar</span>
                        </button>
                        <button
                          onClick={() => generateRequisitionPDF(req)}
                          title="Baixar arquivo PDF diretamente"
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[11px] font-medium transition flex items-center gap-1"
                        >
                          <FileDown className="w-3.5 h-3.5 text-amber-400" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nova Requisição Multi-Itens */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Emitir Nova Requisição de Materiais</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-lg text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Setor Solicitante <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={deptId}
                    onChange={(e) => setDeptId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 outline-none"
                  >
                    {departments.filter(d => d.active).map((d) => (
                      <option key={d.id} value={d.id} className="bg-slate-900">
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nome do Solicitante <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Oliveira (Encarregado)"
                    value={requestedBy}
                    onChange={(e) => setRequestedBy(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Autorizado Por (Almoxarifado)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Matheus (Almoxarife Chefe)"
                    value={authorizedBy}
                    onChange={(e) => setAuthorizedBy(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Motivo / Finalidade da Requisição
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Manutenção preventiva e reposição de bancada"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 outline-none"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-200">Itens Solicitados (Multi-Materiais):</span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-950/50 px-2 py-1 rounded border border-amber-800/60"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Mais Itens</span>
                  </button>
                </div>

                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60 divide-y divide-slate-800">
                  {items.map((row, idx) => {
                    const selectedMat = materials.find(m => m.id === row.material_id);
                    const subtotal = selectedMat ? selectedMat.unit_price * (row.quantity || 0) : 0;
                    const isExceeding = selectedMat && row.quantity > selectedMat.current_stock;

                    return (
                      <div key={idx} className="p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <span className="text-slate-500 font-mono text-xs w-6">{idx + 1}.</span>

                        {/* Material Selector */}
                        <div className="flex-1 w-full">
                          <select
                            value={row.material_id}
                            onChange={(e) => updateItemRow(idx, 'material_id', Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-xs outline-none"
                          >
                            {materials.map((m) => (
                              <option key={m.id} value={m.id} disabled={m.current_stock <= 0}>
                                {m.code} - {m.name} ({m.current_stock > 0 ? `Estoque: ${m.current_stock} ${m.unit}` : 'ZERADO'})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity input */}
                        <div className="w-28 flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max={selectedMat ? selectedMat.current_stock : 999}
                            value={row.quantity}
                            onChange={(e) => updateItemRow(idx, 'quantity', Number(e.target.value))}
                            className={`w-full bg-slate-900 border rounded px-2 py-1 text-slate-100 font-mono text-xs outline-none text-right font-bold ${
                              isExceeding ? 'border-rose-500 text-rose-300' : 'border-slate-700'
                            }`}
                          />
                          <span className="text-slate-400 text-[11px] font-mono w-8">{selectedMat?.unit}</span>
                        </div>

                        {/* Subtotal */}
                        <div className="w-24 text-right font-mono font-bold text-slate-200 text-xs">
                          {formatCurrency(subtotal)}
                        </div>

                        {/* Remove item button */}
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          disabled={items.length <= 1}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded transition disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between mt-3 px-2">
                  <span className="text-slate-400 text-xs">
                    * Ao confirmar a emissão, o saldo dos materiais sofrerá baixa automática com histórico auditável.
                  </span>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 mr-2">Valor Estimado Total:</span>
                    <span className="text-sm font-mono font-extrabold text-amber-400">
                      {formatCurrency(
                        items.reduce((acc, row) => {
                          const mat = materials.find(m => m.id === row.material_id);
                          return acc + (mat ? mat.unit_price * (row.quantity || 0) : 0);
                        }, 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Observações Adicionais
                </label>
                <textarea
                  rows={2}
                  placeholder="Número de Ordem de Serviço, máquina de aplicação ou detalhes específicos..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Emitindo e baixando estoque...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Emitir Requisição Formal</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Visualizador Pronto para Impressão Formal A4 */}
      {viewingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[96vh] overflow-y-auto">
            {/* Top Toolbar in modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 no-print">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Visualização de Requisição Pronta para Impressão</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold transition flex items-center gap-1.5 text-xs shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir (Ctrl + P)</span>
                </button>
                <button
                  onClick={() => generateRequisitionPDF(viewingReq)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition flex items-center gap-1.5 text-xs border border-slate-700"
                >
                  <FileDown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Baixar Arquivo PDF</span>
                </button>
                <button
                  onClick={() => setViewingReq(null)}
                  className="text-slate-400 hover:text-slate-200 p-1.5 rounded hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Paper Simulation */}
            <div className="bg-white text-slate-900 p-8 rounded-lg shadow-2xl print-container border border-slate-200 font-sans text-xs">
              {/* Header Box */}
              <div className="border-b-4 border-amber-500 pb-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-900 text-white font-extrabold px-2.5 py-1 text-sm rounded">CEP</span>
                    <h1 className="text-lg font-bold text-slate-900 tracking-tight">CONTROLE DE ESTOQUE PRO</h1>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 font-semibold">REQUISIÇÃO OFICIAL DE SAÍDA DE MATERIAL DE ALMOXARIFADO</p>
                  <p className="text-[10px] text-slate-500">Responsável Técnico: Matheus | Almoxarifado Central e Logística</p>
                </div>

                <div className="text-right border border-slate-300 rounded p-2.5 bg-slate-50">
                  <div className="font-mono text-sm font-extrabold text-amber-600">{viewingReq.req_number}</div>
                  <div className="text-[10px] uppercase font-bold text-emerald-700">STATUS: {viewingReq.status}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{formatDate(viewingReq.date)}</div>
                </div>
              </div>

              {/* Protocol Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 my-4 p-3 bg-slate-50 rounded border border-slate-200 text-xs">
                <div>
                  <p><strong className="text-slate-700">Setor Solicitante:</strong> {viewingReq.department_code} - {viewingReq.department_name}</p>
                  <p className="mt-1"><strong className="text-slate-700">Solicitado Por:</strong> {viewingReq.requested_by}</p>
                </div>
                <div>
                  <p><strong className="text-slate-700">Autorizado Por:</strong> {viewingReq.authorized_by || 'Almoxarifado'}</p>
                  <p className="mt-1"><strong className="text-slate-700">Motivo / Aplicação:</strong> {viewingReq.reason}</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs border border-slate-300 mt-4">
                <thead className="bg-slate-900 text-white font-bold text-[10px] uppercase">
                  <tr>
                    <th className="py-2 px-3 border border-slate-700 text-center w-8">#</th>
                    <th className="py-2 px-3 border border-slate-700 w-24">Código</th>
                    <th className="py-2 px-3 border border-slate-700">Descrição do Material</th>
                    <th className="py-2 px-3 border border-slate-700 text-center w-12">UN</th>
                    <th className="py-2 px-3 border border-slate-700 text-right w-16">Qtd.</th>
                    <th className="py-2 px-3 border border-slate-700 text-right w-24">Vlr. Unitário</th>
                    <th className="py-2 px-3 border border-slate-700 text-right w-28">Vlr. Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {viewingReq.items.map((item, idx) => (
                    <tr key={idx} className="even:bg-slate-50">
                      <td className="py-2 px-3 border border-slate-200 text-center font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 border border-slate-200 font-mono font-bold text-slate-800">{item.material_code}</td>
                      <td className="py-2 px-3 border border-slate-200 font-medium text-slate-900">{item.material_name}</td>
                      <td className="py-2 px-3 border border-slate-200 text-center">{item.unit}</td>
                      <td className="py-2 px-3 border border-slate-200 text-right font-bold font-mono">{item.quantity}</td>
                      <td className="py-2 px-3 border border-slate-200 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                      <td className="py-2 px-3 border border-slate-200 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total Box */}
              <div className="flex justify-end mt-4">
                <div className="bg-slate-100 border border-slate-300 rounded p-3 text-right w-64">
                  <span className="text-[11px] text-slate-600 font-semibold block">VALOR TOTAL DA REQUISIÇÃO</span>
                  <span className="text-base font-extrabold text-amber-600 font-mono">{formatCurrency(viewingReq.total_value)}</span>
                </div>
              </div>

              {viewingReq.notes && (
                <div className="mt-4 p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 italic">
                  <strong>Observações:</strong> {viewingReq.notes}
                </div>
              )}

              {/* Formal Signatures Blocks */}
              <div className="grid grid-cols-3 gap-6 mt-16 pt-4 border-t border-slate-300 text-center text-xs">
                <div>
                  <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">
                    {viewingReq.requested_by}
                  </div>
                  <div className="text-[10px] text-slate-500">Assinatura do Requisitante</div>
                </div>

                <div>
                  <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">
                    {viewingReq.authorized_by || 'Almoxarife Responsável'}
                  </div>
                  <div className="text-[10px] text-slate-500">Expedição / Almoxarifado</div>
                </div>

                <div>
                  <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">
                    Data: ____/____/2026
                  </div>
                  <div className="text-[10px] text-slate-500">Recebido em Conformidade</div>
                </div>
              </div>

              <div className="text-center text-[9px] text-slate-400 mt-8 pt-4 border-t border-slate-200">
                Documento emitido eletronicamente pelo Sistema Controle de Estoque Pro. Protocolo auditável nº {viewingReq.req_number}.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
