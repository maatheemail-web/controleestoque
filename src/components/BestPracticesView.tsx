import React, { useState } from 'react';
import { 
  BookOpen, 
  RotateCw, 
  ShieldCheck, 
  BarChart, 
  CheckSquare, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  Sparkles,
  ArrowRight,
  Calculator,
  Compass
} from 'lucide-react';

export const BestPracticesView: React.FC = () => {
  // Interactive Calculator for Safety Stock / Minimum Quantity
  const [dailyConsumption, setDailyConsumption] = useState<number>(10);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(7);
  const [safetyDays, setSafetyDays] = useState<number>(5);

  const calculatedSafetyStock = dailyConsumption * safetyDays;
  const calculatedReorderPoint = (dailyConsumption * leadTimeDays) + calculatedSafetyStock;

  // Interactive 5S Audit Checklist state
  const [checklist, setChecklist] = useState<{ id: string; text: string; done: boolean; sense: string }[]>([
    { id: '1', sense: '1S - Seiri (Descarte)', text: 'Identificar e separar materiais obsoletos, avariados ou sem giro há mais de 180 dias.', done: true },
    { id: '2', sense: '2S - Seiton (Organização)', text: 'Todos os materiais possuem código SKU visível e etiquetas de identificação nas prateleiras.', done: true },
    { id: '3', sense: '2S - Seiton (Organização)', text: 'Itens com maior giro (Curva A) alocados nas prateleiras de acesso intermediário (ergonomia).', done: false },
    { id: '4', sense: '3S - Seiso (Limpeza)', text: 'Corredores e pisos do almoxarifado livres de pallets avariados, óleos ou poeira excessiva.', done: true },
    { id: '5', sense: '4S - Seiketsu (Padronização)', text: 'Registro imediato no sistema de qualquer entrada física antes da guarda na prateleira.', done: true },
    { id: '6', sense: '4S - Seiketsu (Padronização)', text: 'Proibir baixas verbais; toda saída deve ter requisição assinada ou protocolo.', done: true },
    { id: '7', sense: '5S - Shitsuke (Disciplina)', text: 'Inventário cíclico semanal executado com acuracidade contábil apurada.', done: false },
  ]);

  const toggleCheck = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const completedCount = checklist.filter(c => c.done).length;
  const auditScore = Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Manual de Boas Práticas em Gestão de Estoques</h2>
              <span className="text-xs bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-extrabold uppercase">
                Guia Operacional
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1">
              Princípios essenciais de logística interna, acuracidade, giro FIFO e padronização para almoxarifados de alta performance.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pillar 1: Método FIFO (PEPS) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2.5 text-amber-400 pb-2 border-b border-slate-800">
            <RotateCw className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">1. Rotatividade FIFO / PEPS</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong>First-In, First-Out (Primeiro que Entra, Primeiro que Sai):</strong> Garante que os lotes mais antigos sejam consumidos prioritariamente, evitando obsolescência de produtos, ressecamento de borrachas/vedações e perda de prazo de validade técnica de químicos e lubrificantes.
          </p>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
            <span className="font-semibold text-amber-300 block">Regras Práticas de Almoxarifado:</span>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              <li>Ao receber nova remessa, guarde atrás ou abaixo do estoque existente ("Abastecer por trás, retirar pela frente").</li>
              <li>Sinalize caixas com fitas coloridas ou etiquetas de data de recebimento para identificação visual imediata.</li>
              <li>Inspecione periodicamente materiais sujeitos a degradação (ex: cabos, baterias, graxas e selantes).</li>
            </ul>
          </div>
        </div>

        {/* Pillar 2: Controle de Estoque Mínimo & Ponto de Pedido */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2.5 text-amber-400 pb-2 border-b border-slate-800">
            <Calculator className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">2. Dimensionamento de Estoque Mínimo</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            O <strong>Estoque Mínimo (Segurança)</strong> protege as operações fabris e de manutenção contra variações imprevisíveis no consumo ou atrasos do fornecedor (Lead Time). O <strong>Ponto de Pedido</strong> indica o momento exato de emitir nova compra.
          </p>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
            <div className="text-emerald-400">Estoque de Segurança = Consumo Médio Diário × Dias de Segurança</div>
            <div className="text-amber-400">Ponto de Pedido = (Consumo Diário × Prazo de Entrega) + Estq. Segurança</div>
          </div>
        </div>

        {/* Pillar 3: Auditoria Periódica & Curva ABC */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2.5 text-amber-400 pb-2 border-b border-slate-800">
            <BarChart className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">3. Auditoria & Classificação ABC</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Priorize a contagem e o controle com base no Princípio de Pareto (80/20):
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-950 p-2.5 rounded border border-rose-900/50">
              <span className="block font-bold text-rose-400">Classe A (Críticos)</span>
              <span className="text-[11px] text-slate-400 block mt-1">20% dos itens representam 80% do valor imobilizado. Contagem semanal.</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-amber-900/50">
              <span className="block font-bold text-amber-400">Classe B (Médios)</span>
              <span className="text-[11px] text-slate-400 block mt-1">30% dos itens representam 15% do valor. Contagem mensal.</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-blue-900/50">
              <span className="block font-bold text-blue-400">Classe C (Rotineiros)</span>
              <span className="text-[11px] text-slate-400 block mt-1">50% dos itens representam 5% do valor. Contagem trimestral.</span>
            </div>
          </div>
        </div>

        {/* Pillar 4: Metodologia 5S no Almoxarifado */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2.5 text-amber-400 pb-2 border-b border-slate-800">
            <Layers className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">4. Metodologia 5S no Almoxarifado</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Os 5 Sensos garantem agilidade na separação de pedidos, reduzem o tempo de busca e eliminam perdas físicas:
          </p>
          <ul className="text-xs space-y-1.5 text-slate-300">
            <li><strong className="text-amber-400">Seiri (Utilização):</strong> Elimine do estoque sucatas, peças defeituosas e materiais obsoletos.</li>
            <li><strong className="text-amber-400">Seiton (Organização):</strong> "Um lugar para cada coisa e cada coisa em seu lugar". Código e endereço visíveis.</li>
            <li><strong className="text-amber-400">Seiso (Limpeza):</strong> Manter armários e pisos limpos evita contaminação de componentes.</li>
            <li><strong className="text-amber-400">Seiketsu (Padronização):</strong> Regras claras para requisição e conferência de notas fiscais.</li>
            <li><strong className="text-amber-400">Shitsuke (Disciplina):</strong> Cumprimento diário dos procedimentos sem atalhos.</li>
          </ul>
        </div>
      </div>

      {/* Interactive Tool 1: Simulador de Ponto de Pedido & Estoque de Segurança */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Simulador Interativo: Ponto de Pedido & Estoque Mínimo</h3>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
            Cálculo Logístico Oficial
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Consumo Médio Diário (unidades/dia)
            </label>
            <input
              type="number"
              min="1"
              value={dailyConsumption}
              onChange={(e) => setDailyConsumption(Math.max(1, Number(e.target.value)))}
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm font-bold outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">Média de saídas diárias nos últimos 30 dias.</p>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Prazo de Entrega do Fornecedor (Lead Time em dias)
            </label>
            <input
              type="number"
              min="1"
              value={leadTimeDays}
              onChange={(e) => setLeadTimeDays(Math.max(1, Number(e.target.value)))}
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm font-bold outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">Tempo entre o pedido e o produto chegar fisicamente.</p>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Margem de Segurança (Dias de Cobertura)
            </label>
            <input
              type="number"
              min="1"
              value={safetyDays}
              onChange={(e) => setSafetyDays(Math.max(1, Number(e.target.value)))}
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm font-bold outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">Dias adicionais para contingência e atrasos.</p>
          </div>
        </div>

        {/* Calculation Result Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-800">
          <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30">
            <span className="text-xs font-semibold text-amber-400 uppercase">Estoque Mínimo Recomendado</span>
            <div className="text-2xl font-extrabold text-white mt-1 font-mono">
              {calculatedSafetyStock} <span className="text-xs font-normal text-slate-400">unidades</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Cadastre este valor como "Quantidade Mínima" no cadastro do material para disparar os alertas visuais.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30">
            <span className="text-xs font-semibold text-emerald-400 uppercase">Ponto de Pedido (Gatilho de Compra)</span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">
              {calculatedReorderPoint} <span className="text-xs font-normal text-slate-400">unidades</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Quando o saldo do material atingir este patamar, a ordem de compra deve ser gerada imediatamente.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Tool 2: Checklist de Auditoria Operacional 5S */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-amber-400" />
              <span>Checklist Interativo de Auditoria Operacional (5S & Controle)</span>
            </h3>
            <p className="text-xs text-slate-400">Auditoria prática para garantia de conformidade física e sistêmica.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Conformidade Atual:</span>
              <span className={`text-base font-mono font-extrabold ${auditScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {auditScore}% ({completedCount}/{checklist.length})
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          {checklist.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition select-none ${
                item.done 
                  ? 'bg-emerald-950/20 border-emerald-900/40 text-slate-200' 
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => {}} // handled by parent div
                className="w-4 h-4 rounded text-amber-500 mt-0.5 cursor-pointer"
              />
              <div className="text-xs flex-1">
                <span className="font-semibold text-amber-400 block mb-0.5">{item.sense}</span>
                <span className={item.done ? 'text-slate-200' : 'text-slate-400'}>{item.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
