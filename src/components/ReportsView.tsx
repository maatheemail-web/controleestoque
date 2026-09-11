import React, { useState } from 'react';
import { 
  BarChart3, 
  Boxes, 
  ArrowLeftRight, 
  FileDown, 
  Printer, 
  Calendar, 
  Filter, 
  Search, 
  DollarSign, 
  AlertTriangle,
  CheckCircle2,
  Table
} from 'lucide-react';
import { Material, Movement, Department } from '../types.ts';
import { formatCurrency, formatDate, generateCurrentStockPDF, generateMovementsPDF } from '../lib/pdfGenerator.ts';

interface ReportsViewProps {
  materials: Material[];
  movements: Movement[];
  departments: Department[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  materials,
  movements,
  departments,
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'STOCK' | 'MOVEMENTS'>('STOCK');

  // Stock Report Filters
  const [stockCategory, setStockCategory] = useState('ALL');
  const [stockStatus, setStockStatus] = useState('ALL');

  // Movements Report Filters
  const [movType, setMovType] = useState('ALL');
  const [movDept, setMovDept] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const categories = Array.from(new Set(materials.map(m => m.category || 'Geral'))).filter(Boolean);

  // Filtered Stock Data
  const filteredMaterials = materials.filter(m => {
    const matchCat = stockCategory === 'ALL' || m.category === stockCategory;
    let matchStatus = true;
    if (stockStatus === 'ZERO') matchStatus = m.current_stock <= 0;
    else if (stockStatus === 'LOW') matchStatus = m.current_stock > 0 && m.current_stock <= m.min_quantity;
    else if (stockStatus === 'NORMAL') matchStatus = m.current_stock > m.min_quantity;
    return matchCat && matchStatus;
  });

  const totalStockValue = filteredMaterials.reduce((acc, m) => acc + (m.current_stock * m.unit_price), 0);
  const totalStockItems = filteredMaterials.reduce((acc, m) => acc + m.current_stock, 0);
  const outOfStockCount = filteredMaterials.filter(m => m.current_stock <= 0).length;
  const lowStockCount = filteredMaterials.filter(m => m.current_stock > 0 && m.current_stock <= m.min_quantity).length;

  // Filtered Movements Data
  const filteredMovements = movements.filter(m => {
    const matchType = movType === 'ALL' || m.type === movType;
    const matchDept = movDept === 'ALL' || String(m.department_id) === movDept;
    let matchDate = true;
    if (startDate) {
      matchDate = matchDate && m.date.substring(0, 10) >= startDate;
    }
    if (endDate) {
      matchDate = matchDate && m.date.substring(0, 10) <= endDate;
    }
    return matchType && matchDept && matchDate;
  });

  const totalMovEntries = filteredMovements.filter(m => m.type === 'IN').reduce((acc, m) => acc + m.total_price, 0);
  const totalMovExits = filteredMovements.filter(m => m.type === 'OUT').reduce((acc, m) => acc + m.total_price, 0);

  // CSV Exporters
  const exportStockCSV = () => {
    const headers = ['Código', 'Material', 'Categoria', 'UN', 'Localização', 'Estoque Atual', 'Estoque Mínimo', 'Preço Unitário', 'Valor Total', 'Status'];
    const rows = filteredMaterials.map(m => [
      m.code,
      `"${m.name.replace(/"/g, '""')}"`,
      m.category || 'Geral',
      m.unit,
      m.location || '',
      m.current_stock,
      m.min_quantity,
      m.unit_price.toFixed(2),
      (m.current_stock * m.unit_price).toFixed(2),
      m.current_stock <= 0 ? 'Ruptura' : m.current_stock <= m.min_quantity ? 'Abaixo do Mínimo' : 'Normal',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Posicao_Estoque_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportMovementsCSV = () => {
    const headers = ['Data', 'Tipo', 'Código', 'Material', 'Quantidade', 'UN', 'Valor Unitário', 'Valor Total', 'Saldo Anterior', 'Saldo Posterior', 'Origem/Destino', 'Documento/Motivo', 'Operador'];
    const rows = filteredMovements.map(m => [
      m.date,
      m.type === 'IN' ? 'Entrada' : 'Saída',
      m.material_code,
      `"${m.material_name.replace(/"/g, '""')}"`,
      m.quantity,
      m.material_unit || '',
      m.unit_price.toFixed(2),
      m.total_price.toFixed(2),
      m.stock_before,
      m.stock_after,
      `"${(m.type === 'IN' ? m.supplier : m.department_name) || ''}"`,
      `"${(m.type === 'IN' ? m.invoice_number : m.reason) || ''}"`,
      m.user_name || '',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Movimentacoes_Estoque_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Centro de Relatórios & Auditoria</h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              Emissão Contábil & Operacional
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Geração de relatórios de inventário físico, posição financeira e movimentações com filtros por período.
          </p>
        </div>

        {/* Report Tabs */}
        <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveReportTab('STOCK')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md transition ${
              activeReportTab === 'STOCK'
                ? 'bg-amber-400 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>1. Posição Atual do Estoque</span>
          </button>
          <button
            onClick={() => setActiveReportTab('MOVEMENTS')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md transition ${
              activeReportTab === 'MOVEMENTS'
                ? 'bg-amber-400 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>2. Movimentações por Período</span>
          </button>
        </div>
      </div>

      {/* REPORT 1: Posição Atual do Estoque */}
      {activeReportTab === 'STOCK' && (
        <div className="space-y-5">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 uppercase font-semibold">Valor Total Imobilizado</span>
              <div className="text-xl font-bold text-amber-400 mt-1">{formatCurrency(totalStockValue)}</div>
              <span className="text-[11px] text-slate-400">{filteredMaterials.length} SKUs considerados</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 uppercase font-semibold">Volume Físico em Unidades</span>
              <div className="text-xl font-bold text-slate-100 mt-1">{totalStockItems.toLocaleString('pt-BR')} un.</div>
              <span className="text-[11px] text-slate-400">Total somado no almoxarifado</span>
            </div>

            <div className="bg-slate-900/80 border border-rose-900/40 rounded-xl p-4">
              <span className="text-xs text-slate-400 uppercase font-semibold">Itens com Estoque Zerado</span>
              <div className="text-xl font-bold text-rose-400 mt-1">{outOfStockCount}</div>
              <span className="text-[11px] text-slate-400">Ruptura de estoque imediata</span>
            </div>

            <div className="bg-slate-900/80 border border-amber-900/40 rounded-xl p-4">
              <span className="text-xs text-slate-400 uppercase font-semibold">Abaixo da Qtd. Mínima</span>
              <div className="text-xl font-bold text-amber-300 mt-1">{lowStockCount}</div>
              <span className="text-[11px] text-slate-400">Necessitam pedido de compra</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
                <span className="text-slate-400">Categoria:</span>
                <select
                  value={stockCategory}
                  onChange={(e) => setStockCategory(e.target.value)}
                  className="bg-transparent text-slate-200 outline-none text-xs cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-900">Todas as Categorias</option>
                  {categories.map((c) => (
                    <option key={c} value={c} className="bg-slate-900">{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
                <span className="text-slate-400">Condição do Estoque:</span>
                <select
                  value={stockStatus}
                  onChange={(e) => setStockStatus(e.target.value)}
                  className="bg-transparent text-slate-200 outline-none text-xs cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-900">Todos os Itens</option>
                  <option value="NORMAL" className="bg-slate-900">Estoque Suficiente (&gt; Mínimo)</option>
                  <option value="LOW" className="bg-slate-900">Abaixo do Mínimo</option>
                  <option value="ZERO" className="bg-slate-900">Zerado / Ruptura Total</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportStockCSV}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition border border-slate-700 flex items-center gap-1.5"
              >
                <Table className="w-3.5 h-3.5 text-slate-400" />
                <span>Exportar CSV</span>
              </button>
              <button
                onClick={() => generateCurrentStockPDF(filteredMaterials)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <FileDown className="w-3.5 h-3.5 text-slate-950" />
                <span>Exportar PDF Oficial</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase font-bold text-slate-400">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Descrição do Material</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Local</th>
                    <th className="py-3 px-4 text-right">Estq. Atual</th>
                    <th className="py-3 px-4 text-right">Estq. Mín.</th>
                    <th className="py-3 px-4 text-right">Preço Unit.</th>
                    <th className="py-3 px-4 text-right">Valor Imobilizado</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredMaterials.map((m, idx) => {
                    const isZero = m.current_stock <= 0;
                    const isLow = m.current_stock > 0 && m.current_stock <= m.min_quantity;
                    return (
                      <tr key={m.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">{m.code}</td>
                        <td className="py-3 px-4 font-medium text-slate-100">{m.name}</td>
                        <td className="py-3 px-4 text-slate-300">{m.category}</td>
                        <td className="py-3 px-4 text-slate-400">{m.location || '-'}</td>
                        <td className="py-3 px-4 text-right font-bold font-mono">
                          <span className={isZero ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-slate-100'}>
                            {m.current_stock.toLocaleString('pt-BR')} {m.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-400">
                          {m.min_quantity} {m.unit}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-300">
                          {formatCurrency(m.unit_price)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                          {formatCurrency(m.current_stock * m.unit_price)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isZero ? (
                            <span className="bg-rose-950 text-rose-300 border border-rose-800/60 px-2 py-0.5 rounded text-[10px] font-bold">
                              RUPTURA
                            </span>
                          ) : isLow ? (
                            <span className="bg-amber-950 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded text-[10px] font-bold">
                              ABAIXO DO MÍNIMO
                            </span>
                          ) : (
                            <span className="bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded text-[10px] font-semibold">
                              NORMAL
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: Movimentações por Período */}
      {activeReportTab === 'MOVEMENTS' && (
        <div className="space-y-5">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 uppercase font-semibold">Transações Filtradas</span>
              <div className="text-xl font-bold text-slate-100 mt-1">{filteredMovements.length}</div>
              <span className="text-[11px] text-slate-400">Entradas e saídas no período</span>
            </div>

            <div className="bg-slate-900/80 border border-emerald-900/40 rounded-xl p-4">
              <span className="text-xs text-slate-400 uppercase font-semibold">Total Compras (Entradas)</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(totalMovEntries)}</div>
              <span className="text-[11px] text-slate-400">Ressuprimento de estoque</span>
            </div>

            <div className="bg-slate-900/80 border border-rose-900/40 rounded-xl p-4">
              <span className="text-xs text-slate-400 uppercase font-semibold">Total Consumo (Saídas)</span>
              <div className="text-xl font-bold text-rose-400 mt-1">{formatCurrency(totalMovExits)}</div>
              <span className="text-[11px] text-slate-400">Atendimento aos setores</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 uppercase font-semibold">Saldo Financeiro Líquido</span>
              <div className="text-xl font-bold text-amber-400 mt-1">{formatCurrency(totalMovEntries - totalMovExits)}</div>
              <span className="text-[11px] text-slate-400">Variação no período</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Type filter */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
                <span className="text-slate-400">Tipo:</span>
                <select
                  value={movType}
                  onChange={(e) => setMovType(e.target.value)}
                  className="bg-transparent text-slate-200 outline-none text-xs cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-900">Todas (Entradas e Saídas)</option>
                  <option value="IN" className="bg-slate-900">Apenas Entradas (Recebimentos)</option>
                  <option value="OUT" className="bg-slate-900">Apenas Saídas (Consumo)</option>
                </select>
              </div>

              {/* Department filter */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
                <span className="text-slate-400">Setor Solicitante:</span>
                <select
                  value={movDept}
                  onChange={(e) => setMovDept(e.target.value)}
                  className="bg-transparent text-slate-200 outline-none text-xs cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-900">Todos os Setores</option>
                  {departments.map((d) => (
                    <option key={d.id} value={String(d.id)} className="bg-slate-900">{d.code} - {d.name}</option>
                  ))}
                </select>
              </div>

              {/* Date filters */}
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
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportMovementsCSV}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition border border-slate-700 flex items-center gap-1.5"
              >
                <Table className="w-3.5 h-3.5 text-slate-400" />
                <span>Exportar CSV</span>
              </button>
              <button
                onClick={() => generateMovementsPDF(filteredMovements, { startDate, endDate })}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <FileDown className="w-3.5 h-3.5 text-slate-950" />
                <span>Exportar PDF Oficial</span>
              </button>
            </div>
          </div>

          {/* Movements table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase font-bold text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Data / Hora</th>
                    <th className="py-3 px-4 text-center">Tipo</th>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Descrição do Material</th>
                    <th className="py-3 px-4 text-right">Qtd.</th>
                    <th className="py-3 px-4 text-right">Preço Unit.</th>
                    <th className="py-3 px-4 text-right">Total Financeiro</th>
                    <th className="py-3 px-4 text-center">Saldo Rastreável</th>
                    <th className="py-3 px-4">Origem / Destino</th>
                    <th className="py-3 px-4">Motivo / Documento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredMovements.map((m) => {
                    const isEntry = m.type === 'IN';
                    return (
                      <tr key={m.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-300 text-[11px]">
                          {formatDate(m.date)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isEntry ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                          }`}>
                            {isEntry ? 'ENTRADA' : 'SAÍDA'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">{m.material_code}</td>
                        <td className="py-3 px-4 font-medium text-slate-100">{m.material_name}</td>
                        <td className="py-3 px-4 text-right font-bold font-mono">
                          <span className={isEntry ? 'text-emerald-400' : 'text-rose-400'}>
                            {isEntry ? `+${m.quantity}` : `-${m.quantity}`} {m.material_unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-300">{formatCurrency(m.unit_price)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">{formatCurrency(m.total_price)}</td>
                        <td className="py-3 px-4 text-center font-mono text-[11px]">
                          <span className="text-slate-400">{m.stock_before}</span>
                          <span className="text-slate-600 mx-1">→</span>
                          <span className="font-bold text-slate-200">{m.stock_after}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {isEntry ? m.supplier || 'Fornecedor' : `${m.department_code} - ${m.department_name}`}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {isEntry ? (m.invoice_number ? `NF: ${m.invoice_number}` : 'Aquisição') : m.reason}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
