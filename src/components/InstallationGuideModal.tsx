import React from 'react';
import { 
  X, 
  Terminal, 
  Server, 
  Database, 
  Layers, 
  CheckCircle2, 
  Copy, 
  Code, 
  BookOpen, 
  ShieldCheck 
} from 'lucide-react';

interface InstallationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallationGuideModal: React.FC<InstallationGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto text-xs text-slate-300">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Manual Técnico de Instalação, Arquitetura & Uso</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Banner */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-400 text-sm">Controle de Estoque Pro v2.4</span>
            <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded text-[11px] font-mono font-semibold">
              Full-Stack Production Ready
            </span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Aplicação desenvolvida com arquitetura full-stack integrada: <strong>React 18 + TypeScript + Tailwind CSS</strong> no front-end e <strong>Node.js + Express + SQLite (better-sqlite3)</strong> no back-end, garantindo persistência relacional ACID, consistência transacional de saldos e emissão nativa de PDF com <strong>jspdf</strong> e <strong>jspdf-autotable</strong>.
          </p>
          <div className="text-[11px] text-slate-500 pt-1">
            Responsável Técnico do Sistema: <strong className="text-slate-300">Matheus</strong>
          </div>
        </div>

        {/* Section 1: Instalação & Execução */}
        <div className="space-y-2">
          <h4 className="font-bold text-white flex items-center gap-1.5 text-sm">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>1. Como Instalar e Executar Localmente</span>
          </h4>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-slate-200 space-y-1">
            <p className="text-slate-500"># 1. Instalar as dependências do projeto</p>
            <p className="text-amber-400">npm install</p>
            <p className="text-slate-500 mt-2"># 2. Iniciar o servidor em modo de desenvolvimento (Porta 3000)</p>
            <p className="text-amber-400">npm run dev</p>
            <p className="text-slate-500 mt-2"># 3. Compilar para produção (Vite + esbuild bundle)</p>
            <p className="text-amber-400">npm run build</p>
            <p className="text-slate-500 mt-2"># 4. Iniciar em ambiente produtivo</p>
            <p className="text-amber-400">npm start</p>
          </div>
        </div>

        {/* Section 2: Modelo de Dados Relacional */}
        <div className="space-y-2">
          <h4 className="font-bold text-white flex items-center gap-1.5 text-sm">
            <Database className="w-4 h-4 text-amber-400" />
            <span>2. Esquema Relacional de Dados (SQLite)</span>
          </h4>
          <p className="text-slate-400">
            O banco de dados relacional foi modelado com integridade referencial e transações atômicas para garantir que o saldo de materiais jamais fique inconsistente:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <strong className="text-amber-400 block mb-1">Tabela materials</strong>
              <p className="text-slate-400">id, code (SKU único), name, unit, min_quantity, unit_price, current_stock, category, location</p>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <strong className="text-amber-400 block mb-1">Tabela departments</strong>
              <p className="text-slate-400">id, code (sigla única), name, manager, active</p>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <strong className="text-amber-400 block mb-1">Tabela movements</strong>
              <p className="text-slate-400">id, type (IN/OUT), material_id (FK), quantity, unit_price, total_price, stock_before, stock_after, supplier, department_id (FK), reason, requested_by, invoice_number, date</p>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <strong className="text-amber-400 block mb-1">Tabelas requisitions & items</strong>
              <p className="text-slate-400">Cabeçalho com protocolo sequencial (REQ-2026-XXX), status, assinaturas e itens com chave estrangeira e valorização.</p>
            </div>
          </div>
        </div>

        {/* Section 3: Endpoints da API REST */}
        <div className="space-y-2">
          <h4 className="font-bold text-white flex items-center gap-1.5 text-sm">
            <Code className="w-4 h-4 text-amber-400" />
            <span>3. Principais Endpoints da API REST</span>
          </h4>
          <div className="space-y-1 font-mono text-[11px]">
            <div className="bg-slate-950 p-2 rounded border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-emerald-400 font-bold mr-2">GET</span>
                <span className="text-slate-200">/api/materials</span>
              </div>
              <span className="text-slate-500 font-sans">Retorna todos os materiais com saldos</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-blue-400 font-bold mr-2">POST</span>
                <span className="text-slate-200">/api/movements/in</span>
              </div>
              <span className="text-slate-500 font-sans">Registra entrada e incrementa saldo atômico</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-rose-400 font-bold mr-2">POST</span>
                <span className="text-slate-200">/api/movements/out</span>
              </div>
              <span className="text-slate-500 font-sans">Valida disponibilidade e dá baixa no estoque</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-amber-400 font-bold mr-2">POST</span>
                <span className="text-slate-200">/api/requisitions</span>
              </div>
              <span className="text-slate-500 font-sans">Emite requisição multi-item com baixa automática</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-purple-400 font-bold mr-2">GET</span>
                <span className="text-slate-200">/api/stats</span>
              </div>
              <span className="text-slate-500 font-sans">Consolida KPIs, giro (turnover), alertas e setores</span>
            </div>
          </div>
        </div>

        {/* Section 4: Credenciais de Acesso */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <strong className="text-white block mb-1">Usuários e Permissões Pré-Cadastrados:</strong>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <p className="text-amber-400 font-semibold">Administrador / Responsável Técnico:</p>
              <p className="text-slate-300">Usuário: <code className="text-white">admin</code> | Senha: <code className="text-white">admin123</code></p>
            </div>
            <div>
              <p className="text-blue-400 font-semibold">Almoxarife / Operador:</p>
              <p className="text-slate-300">Usuário: <code className="text-white">operador</code> | Senha: <code className="text-white">operador123</code></p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition"
          >
            Entendido, Fechar Guia
          </button>
        </div>
      </div>
    </div>
  );
};
