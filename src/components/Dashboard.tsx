import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Boxes, 
  ArrowDownRight, 
  ArrowUpRight, 
  DollarSign, 
  Clock, 
  PlusCircle, 
  MinusCircle, 
  FilePlus, 
  ChevronRight,
  ShieldAlert,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie, 
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { StockStats, Material, Movement, Department } from '../types.ts';
import { formatCurrency } from '../lib/pdfGenerator.ts';
import { computeStatsFromData } from '../lib/statsHelper.ts';
import { INITIAL_STATS } from '../data/initialData.ts';

interface DashboardProps {
  stats: StockStats | null;
  loading: boolean;
  materials?: Material[];
  movements?: Movement[];
  departments?: Department[];
  onNavigate: (tab: string) => void;
  onOpenQuickEntry: (material?: Material) => void;
  onOpenQuickExit: (material?: Material) => void;
  onOpenNewRequisition: () => void;
  onReload?: () => void;
}

const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EC4899', '#8B5CF6', '#06B6D4'];

export const Dashboard: React.FC<DashboardProps> = ({
  stats: backendStats,
  loading,
  materials = [],
  movements = [],
  departments = [],
  onNavigate,
  onOpenQuickEntry,
  onOpenQuickExit,
  onOpenNewRequisition,
  onReload,
}) => {
  // Compute fallback stats if backend stats are missing or incomplete; guarantee non-null with INITIAL_STATS
  const effectiveStats = useMemo(() => {
    if (backendStats && typeof backendStats.total_materials === 'number' && backendStats.total_materials > 0) {
      return backendStats;
    }
    if (materials && materials.length > 0) {
      return computeStatsFromData(materials, movements, departments);
    }
    return backendStats || INITIAL_STATS;
  }, [backendStats, materials, movements, departments]);

  const stats = effectiveStats;
  const criticalMaterials = stats.critical_materials || [];
  const outOfStockItems = criticalMaterials.filter(m => (Number(m.current_stock) || 0) <= 0);
  const lowStockItems = criticalMaterials.filter(m => (Number(m.current_stock) || 0) > 0 && (Number(m.current_stock) || 0) <= (Number(m.min_quantity) || 0));

  const deptChartData = (stats.movements_by_department || []).map(d => ({
    name: d.department_code || (d.department_name ? d.department_name.substring(0, 10) : 'Setor'),
    fullName: d.department_name || 'Setor',
    valor: Number(d.total_value) || 0,
    quantidade: Number(d.total_quantity) || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Painel de Indicadores Operacionais</h2>
            <span className="text-xs bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
              {loading ? 'Atualizando...' : 'Tempo Real'}
            </span>
            {onReload && (
              <button
                onClick={onReload}
                title="Sincronizar indicadores com o banco de dados"
                className="p-1 text-slate-400 hover:text-amber-400 transition rounded hover:bg-slate-800/80"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Visão consolidada de inventário físico, valorização contábil, giro logístico e requisições setoriais.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => onOpenQuickEntry()}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-md shadow-emerald-900/30"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Registrar Entrada</span>
          </button>
          <button
            onClick={() => onOpenQuickExit()}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition shadow-md shadow-rose-900/30"
          >
            <MinusCircle className="w-4 h-4" />
            <span>- Registrar Saída</span>
          </button>
          <button
            onClick={onOpenNewRequisition}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition shadow-md shadow-amber-500/20"
          >
            <FilePlus className="w-4 h-4" />
            <span>Emitir Requisição</span>
          </button>
        </div>
      </div>

      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Custo Total do Estoque */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-xl p-5 shadow-lg transition relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Custo Total do Estoque</span>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {formatCurrency(stats.total_inventory_value)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">{stats.total_materials}</span>
              <span>materiais ativos no catálogo</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Valorização contábil</span>
            <span className="text-amber-400 font-medium">100% Auditado</span>
          </div>
        </div>

        {/* KPI 2: Taxa de Rotatividade / Giro */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 rounded-xl p-5 shadow-lg transition relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Taxa de Rotatividade</span>
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white tracking-tight flex items-baseline gap-1.5">
              <span>{stats.turnover_rate}x</span>
              <span className="text-xs font-normal text-slate-400">ao ano</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Permanência média: <strong className="text-slate-200">{stats.average_holding_days} dias</strong></span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Fórmula: Custo Saídas / Estq. Médio</span>
            <span className={stats.turnover_rate >= 1.5 ? 'text-emerald-400' : 'text-amber-400'}>
              {stats.turnover_rate >= 1.5 ? 'Giro Saudável' : 'Giro Moderado'}
            </span>
          </div>
        </div>

        {/* KPI 3: Materiais em Falta ou Abaixo do Mínimo */}
        <div className={`bg-slate-900/90 border rounded-xl p-5 shadow-lg transition relative overflow-hidden group ${
          (stats.items_low_stock_count + stats.items_out_of_stock_count) > 0
            ? 'border-rose-900/60 hover:border-rose-500/50'
            : 'border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Estoque Crítico / Mínimo</span>
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white tracking-tight flex items-baseline gap-2">
              <span className={stats.items_out_of_stock_count > 0 ? 'text-rose-400' : 'text-amber-400'}>
                {stats.items_low_stock_count + stats.items_out_of_stock_count}
              </span>
              <span className="text-xs font-normal text-slate-400">itens requerem reposição</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs">
              <span className="bg-rose-950/80 text-rose-300 border border-rose-800/60 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                {stats.items_out_of_stock_count} em falta (ruptura)
              </span>
              <span className="bg-amber-950/80 text-amber-300 border border-amber-800/60 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                {stats.items_low_stock_count} abaixo do mín.
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <button
              onClick={() => onNavigate('materials')}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
            >
              <span>Ver itens para reposição</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI 4: Movimentações do Período */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-5 shadow-lg transition relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Movimentações Registradas</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {stats.total_entries_count + stats.total_exits_count}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <span className="text-emerald-400 flex items-center gap-0.5">
                <ArrowDownRight className="w-3 h-3" />
                <span>{stats.total_entries_count} Entradas</span>
              </span>
              <span className="text-rose-400 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                <span>{stats.total_exits_count} Saídas</span>
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Total Saídas (Consumo)</span>
            <span className="font-semibold text-rose-300">{formatCurrency(stats.total_exits_value)}</span>
          </div>
        </div>
      </div>

      {/* Critical Items Alert & Action Section */}
      {criticalMaterials.length > 0 && (
        <div className="bg-slate-900/90 border border-rose-900/40 rounded-xl p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Alerta de Ressuprimento: Materiais com Estoque Crítico</span>
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {criticalMaterials.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Itens com saldo igual a zero ou inferior ao estoque mínimo de segurança.</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('materials')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <span>Gerenciar no Módulo de Materiais</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase font-bold text-slate-400 bg-slate-950/60 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Material</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3 text-right">Estq. Atual</th>
                  <th className="py-2.5 px-3 text-right">Estq. Mínimo</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Preço Unit.</th>
                  <th className="py-2.5 px-3 text-center">Ação Imediata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {criticalMaterials.slice(0, 5).map((mat) => {
                  const isZero = mat.current_stock <= 0;
                  return (
                    <tr key={mat.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">{mat.code}</td>
                      <td className="py-3 px-3 font-medium text-slate-100">{mat.name}</td>
                      <td className="py-3 px-3 text-slate-400">{mat.category}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-200">
                        <span className={isZero ? 'text-rose-400' : 'text-amber-400'}>
                          {mat.current_stock} {mat.unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400">
                        {mat.min_quantity} {mat.unit}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isZero ? (
                          <span className="bg-rose-950 text-rose-300 border border-rose-700/60 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
                            Ruptura / Zerado
                          </span>
                        ) : (
                          <span className="bg-amber-950 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
                            Abaixo do Mínimo
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {formatCurrency(mat.unit_price)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onOpenQuickEntry(mat)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold transition flex items-center gap-1 mx-auto shadow-sm"
                        >
                          <PlusCircle className="w-3 h-3" />
                          <span>Repor Estoque</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Movimentações / Consumo por Setor */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Consumo e Saídas por Setor / Departamento</h3>
              <p className="text-xs text-slate-400">Distribuição financeira (R$) das saídas para cada centro de custo</p>
            </div>
            <span className="text-[11px] text-amber-400 font-semibold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
              Almoxarifado
            </span>
          </div>

          <div className="w-full h-64 min-h-[256px] min-w-0 mt-4">
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false} 
                  tickFormatter={(val) => `R$${val}`} 
                />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Valor Total']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                  {deptChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Department breakdown table */}
          <div className="mt-3 pt-3 border-t border-slate-800 divide-y divide-slate-800/60 text-xs">
            {(stats.movements_by_department || []).map((dept, i) => (
              <div key={dept.department_id} className="py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                  <span className="text-slate-300 font-medium">{dept.department_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">{dept.total_quantity} un.</span>
                  <span className="font-mono font-bold text-slate-100">{formatCurrency(dept.total_value)}</span>
                  <span className="text-[10px] font-bold text-amber-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 w-12 text-center">
                    {dept.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Comparativo Mensal de Entradas vs Saídas */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Evolução Mensal de Movimentações</h3>
              <p className="text-xs text-slate-400">Comparativo financeiro entre entradas (compras) e saídas (consumo)</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Entradas
              </span>
              <span className="flex items-center gap-1 text-rose-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span> Saídas
              </span>
            </div>
          </div>

          <div className="w-full h-64 min-h-[256px] min-w-0 mt-4">
            <ResponsiveContainer width="100%" height={256}>
              <AreaChart data={stats.monthly_history || []} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(Number(value) || 0), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="entries_value" name="Entradas (R$)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIn)" />
                <Area type="monotone" dataKey="exits_value" name="Saídas (R$)" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorOut)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Practical tip banner inside dashboard */}
          <div className="mt-3 p-3 bg-amber-950/30 border border-amber-500/30 rounded-lg flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-amber-300">Dica Operacional de Estoque: </span>
              <span className="text-slate-300">
                Mantenha a acuracidade de estoque acima de 95% realizando inventários cíclicos semanais nos itens com maior volume de requisições.
              </span>
              <button 
                onClick={() => onNavigate('practices')}
                className="text-amber-400 hover:underline font-bold ml-1"
              >
                Ver Boas Práticas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
