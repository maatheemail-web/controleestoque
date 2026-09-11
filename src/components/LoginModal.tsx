import React, { useState } from 'react';
import { Lock, User, KeyRound, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { User as UserType } from '../types.ts';

interface LoginModalProps {
  isOpen: boolean;
  onLogin: (username: string, pass: string) => Promise<void>;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onLogin, onClose }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onLogin(username, password);
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação. Verifique usuário e senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="text-center space-y-1 pb-3 border-b border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">Controle de Estoque Pro</h3>
          <p className="text-xs text-slate-400">Acesse com suas credenciais de operador ou gestor</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-lg text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Usuário</label>
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 focus-within:border-amber-400 rounded-lg px-3 py-2">
              <User className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: admin"
                className="bg-transparent text-slate-100 placeholder-slate-500 w-full outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Senha</label>
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 focus-within:border-amber-400 rounded-lg px-3 py-2">
              <KeyRound className="w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-transparent text-slate-100 placeholder-slate-500 w-full outline-none"
              />
            </div>
          </div>

          {/* Quick Click Credentials */}
          <div className="pt-2">
            <span className="text-[11px] text-slate-400 block mb-2 font-medium">Atalhos de Acesso Rápido para Avaliação:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 rounded-lg text-left transition"
              >
                <span className="font-bold text-amber-400 block text-xs">Matheus (Admin)</span>
                <span className="text-[10px] text-slate-400">admin / admin123</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('operador', 'operador123')}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 rounded-lg text-left transition"
              >
                <span className="font-bold text-blue-400 block text-xs">Carlos (Operador)</span>
                <span className="text-[10px] text-slate-400">operador / operador123</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span>Autenticando...</span>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Entrar no Sistema</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
