
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Backend } from '../services/mockBackend';
import { MockEnv } from '../config/mockEnv';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
      if (MockEnv.SHOW_DEV_HINTS) {
          setUsername(MockEnv.MOCK_AUTH_USER);
          setPassword(MockEnv.MOCK_AUTH_PASS);
      }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if(!username || !password) {
        setError('Preencha todos os campos.');
        return;
    }

    setIsLoading(true);

    try {
        const user = await Backend.login(username, password);
        
        if (user) {
            navigate('/');
        } else {
            setError('Credenciais inválidas.');
            await Backend.logSecurityEvent('bad_password', { username });
        }
    } catch (err) {
        setError('Erro ao processar login.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-4 relative overflow-hidden font-sans">
       
       {/* Background Ambience */}
       <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
       <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] pointer-events-none"></div>

       <div className="glass-card w-full max-w-md p-8 rounded-2xl shadow-card relative z-10 animate-in fade-in zoom-in-95 duration-500">
          
          <div className="text-center mb-10">
            <div className="w-16 h-16 mx-auto mb-4 bg-grad-violet rounded-2xl flex items-center justify-center shadow-glow">
                <span className="text-3xl font-bold text-white">∞</span>
            </div>
            <h1 className="text-3xl font-bold text-text tracking-tight">VPN Nexus Panel</h1>
            <p className="text-muted mt-2 text-sm">Acesse o painel de controle seguro</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
             {error && (
                 <div className="bg-error/10 border border-error/20 rounded-xl p-3 flex items-center text-error text-sm animate-in slide-in-from-top-2">
                     <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                     {error}
                 </div>
             )}

             <div className="space-y-2 group">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">Usuário</label>
                <div className="relative">
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-bg-main border border-white/10 rounded-xl py-3 pl-11 pr-4 text-text placeholder-gray-600 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                        placeholder="Seu nome de usuário"
                        disabled={isLoading}
                    />
                    <User className="w-5 h-5 text-gray-500 absolute left-4 top-3.5 group-focus-within:text-primary transition-colors" />
                </div>
             </div>

             <div className="space-y-2 group">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider ml-1 group-focus-within:text-secondary transition-colors">Senha</label>
                <div className="relative">
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-bg-main border border-white/10 rounded-xl py-3 pl-11 pr-4 text-text placeholder-gray-600 focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 outline-none transition-all"
                        placeholder="••••••••"
                        disabled={isLoading}
                    />
                    <Lock className="w-5 h-5 text-gray-500 absolute left-4 top-3.5 group-focus-within:text-secondary transition-colors" />
                </div>
             </div>

             <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-grad-violet hover:brightness-110 text-white font-bold py-3.5 rounded-xl shadow-glow hover:shadow-glow-hover transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center group"
             >
                {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                    <>Entrar no Painel <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" /></>
                )}
             </button>
             
             {MockEnv.SHOW_DEV_HINTS && (
                 <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center">
                     <div className="flex items-center text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full mb-3 border border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3 mr-1.5" />
                        AMBIENTE SEGURO (MOCK)
                     </div>
                     <p className="text-xs text-gray-600 font-mono">
                        user: <span className="text-muted">{MockEnv.MOCK_AUTH_USER}</span> • pass: <span className="text-muted">{MockEnv.MOCK_AUTH_PASS}</span>
                     </p>
                 </div>
             )}
          </form>
       </div>
    </div>
  );
}
