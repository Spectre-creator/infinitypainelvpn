
import React, { useState, useEffect } from 'react';
import { TestAccount, Client } from '../types';
import { Plus, Clock, X, Play, Trash2, CheckCircle, Copy, Key } from 'lucide-react';
import { Backend } from '../services/mockBackend';

export default function Tests() {
  const [tests, setTests] = useState<TestAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdTest, setCreatedTest] = useState<Client | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [nextLogin, setNextLogin] = useState('');
  const [isV2Ray, setIsV2Ray] = useState(false);

  useEffect(() => {
    fetchTests();
    window.addEventListener('db_update', fetchTests);
    return () => window.removeEventListener('db_update', fetchTests);
  }, []);

  const fetchTests = () => setTests(Backend.getTests());

  const handleCreateTest = async () => {
    setIsLoading(true);
    setTimeout(async () => {
        const result = await Backend.createClient({ login: nextLogin, password: '123', days: selectedDuration, limit: 1, isTest: true, category: 'PREMIUM', isV2Ray: isV2Ray });
        if (result.success && result.client) {
            setCreatedTest(result.client);
            setIsModalOpen(false);
            setShowSuccessModal(true);
            fetchTests();
        }
        setIsLoading(false);
    }, 500);
  };

  const copyTestToClipboard = (test: TestAccount) => {
      const validade = new Date(test.expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const text = `TESTE RAPIDO\nUsuario: ${test.login}\nSenha: ${test.password}\nExpira: ${validade}`;
      navigator.clipboard.writeText(text);
      window.dispatchEvent(new CustomEvent('sys_toast', { detail: { message: 'Copiado!', type: 'success' } }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-text flex items-center">
                <Clock className="w-6 h-6 mr-3 text-warning" />
                Gerenciar Testes
            </h2>
            <p className="text-muted text-sm mt-1">Gere acessos temporários para novos clientes.</p>
        </div>
        <button onClick={() => { setNextLogin(Backend.getNextTestLogin()); setIsModalOpen(true); }} className="bg-grad-violet hover:shadow-glow-hover text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-glow transition-all flex items-center justify-center w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2 inline" /> Gerar Teste
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {tests.map((test) => {
              const isExpired = new Date(test.expiresAt) < new Date();
              return (
                  <div key={test.id} className="glass-card rounded-2xl p-5 hover:border-warning/30 transition-all flex flex-col group relative hover:-translate-y-1 duration-300">
                      <div className="flex justify-between items-start mb-4">
                          <div>
                              <h3 className="font-bold text-text text-lg">{test.login}</h3>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border mt-1 inline-block ${test.isV2Ray ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                  {test.isV2Ray ? 'V2RAY' : 'SSH'}
                              </span>
                          </div>
                          <span className={`w-2 h-2 rounded-full ${isExpired ? 'bg-error' : 'bg-success animate-pulse'}`}></span>
                      </div>

                      <div className="space-y-3 mb-4 flex-1">
                          <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                              <span className="text-muted">Senha</span>
                              <span className="font-mono text-text bg-bg-main px-2 py-0.5 rounded">{test.password}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                              <span className="text-muted">Expira</span>
                              <span className="text-warning font-bold">{new Date(test.expiresAt).toLocaleTimeString()}</span>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                          <button onClick={() => copyTestToClipboard(test)} className="bg-white/5 hover:bg-white/10 text-text rounded-xl py-2 text-xs font-bold transition-colors">Copiar</button>
                          <button onClick={() => Backend.deleteClient(test.id).then(fetchTests)} className="bg-white/5 hover:bg-error/20 text-error rounded-xl py-2 text-xs font-bold transition-colors">Excluir</button>
                      </div>
                  </div>
              );
          })}
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="glass-card p-6 rounded-2xl w-full max-w-sm relative shadow-2xl animate-in zoom-in-95">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-muted hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                <h3 className="text-xl font-bold text-text mb-6">Novo Teste</h3>
                <div className="bg-bg-main border border-white/5 p-3 rounded-xl mb-4 text-center">
                    <div className="text-xs text-muted uppercase font-bold mb-1">Login Automático</div>
                    <div className="text-lg font-mono text-text tracking-wider">{nextLogin}</div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {[60, 120, 240].map(m => (
                        <button key={m} onClick={() => setSelectedDuration(m)} className={`py-2 rounded-xl text-xs font-bold border transition-all ${selectedDuration === m ? 'bg-primary text-white border-primary-500 shadow-glow' : 'bg-transparent text-muted border-white/10 hover:border-white/30'}`}>{m/60}H</button>
                    ))}
                </div>
                <button onClick={handleCreateTest} disabled={isLoading} className="w-full bg-grad-violet hover:shadow-glow-hover text-white font-bold py-3 rounded-xl transition-all shadow-glow">
                    {isLoading ? 'Gerando...' : 'Iniciar Teste'}
                </button>
            </div>
          </div>
      )}
    </div>
  );
}
