
import React, { useState, useEffect } from 'react';
import { Server } from '../types';
import { Backend } from '../services/mockBackend';
import { 
  Server as ServerIcon, 
  Terminal, 
  RefreshCw, 
  Edit,
  Plus,
  ArrowLeft
} from 'lucide-react';

const ServerCard: React.FC<{ server: Server; onSelect: () => void }> = ({ server, onSelect }) => (
  <div onClick={onSelect} className="glass-card rounded-2xl p-5 cursor-pointer hover:border-primary/50 transition-all group hover:-translate-y-1 duration-300">
      <div className="flex justify-between items-start mb-4">
          <div>
              <h3 className="font-bold text-text text-lg">{server.name}</h3>
              <span className="text-xs text-muted font-mono">{server.ip}</span>
          </div>
          <div className="flex flex-col items-end">
             {server.status === 'online' && (
                 <span className="flex items-center text-xs text-success font-bold bg-success/10 px-2 py-1 rounded-full border border-success/20">
                     <span className="w-2 h-2 rounded-full bg-success mr-1.5 animate-pulse"></span>
                     Online
                 </span>
             )}
          </div>
      </div>
      <div className="space-y-3">
          <div>
              <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted">RAM</span>
                  <span className="text-text">{server.stats?.ramUsed} / {server.stats?.ramTotal}</span>
              </div>
              <div className="h-2 bg-bg-main rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-grad-violet" style={{ width: `${server.stats?.ram}%` }}></div>
              </div>
          </div>
          <div>
              <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted">CPU</span>
                  <span className="text-text">{server.stats?.cpu}%</span>
              </div>
              <div className="h-2 bg-bg-main rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-grad-violet" style={{ width: `${server.stats?.cpu}%` }}></div>
              </div>
          </div>
      </div>
  </div>
);

const AddServerForm = ({ onClose }: { onClose: () => void }) => {
  const [formData, setFormData] = useState({
      category: 'PREMIUM',
      name: '',
      ip: '',
      user: '',
      password: '',
      port: 22
  });

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
      window.dispatchEvent(new CustomEvent('sys_toast', { detail: { message, type } }));
  };

  const handleCreate = () => {
      if(!formData.name || !formData.ip || !formData.user) {
          triggerToast('Preencha os campos obrigatórios!', 'error');
          return;
      }
      Backend.createServer(formData);
      triggerToast('✅ Servidor adicionado com sucesso!');
      onClose();
  };

  return (
      <div className="glass-card rounded-2xl p-6">
          <h3 className="text-xl font-bold text-text mb-1">Adicionar Servidor</h3>
          <p className="text-sm text-muted mb-6">Preencha o formulário completo abaixo.</p>

          <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="text-xs font-bold text-muted uppercase block mb-2">Categoria:</label>
                      <select 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-bg-main border border-white/10 rounded-lg p-3 text-text focus:border-primary outline-none"
                      >
                          <option value="PREMIUM">PREMIUM</option>
                          <option value="BASIC">BASIC</option>
                      </select>
                  </div>
                  <div>
                      <label className="text-xs font-bold text-muted uppercase block mb-2">Nome:</label>
                      <input 
                        type="text" 
                        placeholder="Nome do Servidor" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-bg-main border border-white/10 rounded-lg p-3 text-text focus:border-primary outline-none" 
                      />
                  </div>
              </div>
               <div>
                  <label className="text-xs font-bold text-muted uppercase block mb-2">Endereço de IP:</label>
                  <input 
                    type="text" 
                    placeholder="192.168.1.1" 
                    value={formData.ip}
                    onChange={e => setFormData({...formData, ip: e.target.value})}
                    className="w-full bg-bg-main border border-white/10 rounded-lg p-3 text-text focus:border-primary outline-none" 
                  />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                      <label className="text-xs font-bold text-muted uppercase block mb-2">Usuário:</label>
                      <input 
                        type="text" 
                        placeholder="root" 
                        value={formData.user}
                        onChange={e => setFormData({...formData, user: e.target.value})}
                        className="w-full bg-bg-main border border-white/10 rounded-lg p-3 text-text focus:border-primary outline-none" 
                      />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-muted uppercase block mb-2">Senha:</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className="w-full bg-bg-main border border-white/10 rounded-lg p-3 text-text focus:border-primary outline-none" 
                      />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-muted uppercase block mb-2">Porta:</label>
                      <input 
                        type="number" 
                        value={formData.port} 
                        onChange={e => setFormData({...formData, port: parseInt(e.target.value)})}
                        className="w-full bg-bg-main border border-white/10 rounded-lg p-3 text-text focus:border-primary outline-none" 
                      />
                  </div>
              </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-white/10">
              <button onClick={onClose} className="px-6 py-2.5 rounded-lg text-muted hover:text-white font-medium bg-white/5 hover:bg-white/10 transition-colors">Cancelar</button>
              <button onClick={handleCreate} className="px-6 py-2.5 rounded-lg bg-grad-violet hover:shadow-glow text-white font-bold shadow-lg transition-all">Adicionar Servidor</button>
          </div>
      </div>
  );
};

const ServerDetails = ({ server, onBack }: { server: Server; onBack: () => void }) => (
    <div className="space-y-6">
        <button onClick={onBack} className="text-sm text-muted hover:text-white flex items-center mb-2">
            <ArrowLeft className="w-4 h-4 mr-2"/> Voltar para lista
        </button>

        <div className="glass-card rounded-2xl p-6">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mr-4 border border-primary/20">
                        <ServerIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                         <h2 className="text-xl font-bold text-text mb-1">{server.name}</h2>
                         <div className="flex items-center space-x-2">
                             <span className="text-muted text-sm">Status:</span>
                             <span className="text-success text-sm font-bold">Online</span>
                         </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                    <div className="text-muted mb-1">Endereço de IP:</div>
                    <div className="text-text font-mono bg-bg-main px-2 py-1 rounded-lg border border-white/10 inline-block">{server.ip}</div>
                </div>
                <div>
                     <div className="text-muted mb-1">RAM/CPU:</div>
                     <div className="text-text">{server.stats?.ramTotal} / 6 CPUs</div>
                </div>
                <div>
                     <div className="text-muted mb-1">Processador:</div>
                     <div className="text-text">{server.stats?.processor}</div>
                </div>
                <div>
                     <div className="text-muted mb-1">Portas Abertas:</div>
                     <div className="flex flex-wrap gap-1">
                         {server.stats?.openPorts.map(p => (
                             <span key={p} className="bg-bg-main text-muted px-1.5 py-0.5 rounded text-xs border border-white/10">{p}</span>
                         ))}
                     </div>
                </div>
            </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-bold text-text mb-4">Ferramentas do Servidor</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-bg-main/50 rounded-lg border border-white/10">
                    <div className="flex items-center">
                        <RefreshCw className="w-5 h-5 text-muted mr-3" />
                        <div>
                            <div className="font-bold text-text">Restaurar Clientes</div>
                            <div className="text-xs text-muted">Restaure todos os clientes criados na categoria.</div>
                        </div>
                    </div>
                    <button className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors">
                        Restaurar
                    </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-bg-main/50 rounded-lg border border-white/10">
                    <div className="flex items-center">
                        <Terminal className="w-5 h-5 text-muted mr-3" />
                        <div>
                            <div className="font-bold text-text">Reinstalar API</div>
                            <div className="text-xs text-muted">Reinstale todos os recursos necessários.</div>
                        </div>
                    </div>
                    <button className="bg-secondary/10 text-secondary hover:bg-secondary hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors">
                        Reinstalar
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export default function Servers() {
  const [view, setView] = useState<'list' | 'add' | 'details'>('list');
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [servers, setServers] = useState<Server[]>([]);

  useEffect(() => {
    const updateServers = () => {
        setServers(Backend.getServers());
    };
    updateServers();
    
    const interval = setInterval(updateServers, 3000);
    window.addEventListener('db_update', updateServers);

    return () => {
        clearInterval(interval);
        window.removeEventListener('db_update', updateServers);
    };
  }, []);

  const handleSelectServer = (server: Server) => {
      setSelectedServer(server);
      setView('details');
  };

  return (
    <div className="space-y-6">
      {view === 'list' && (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                   <h2 className="text-2xl font-bold text-text">Gerenciar Servidores</h2>
                   <p className="text-sm text-muted">Adicione e gerencie suas VPS de conexão.</p>
                </div>
                <button 
                  onClick={() => setView('add')}
                  className="bg-grad-violet text-white font-bold px-5 py-2.5 rounded-xl shadow-glow hover:shadow-glow-hover transition-all flex items-center"
              >
                  <Plus className="w-4 h-4 mr-2"/> Adicionar Servidor
              </button>
            </div>

            <div className="glass-card rounded-xl p-4 flex justify-between items-center">
                <div className="text-sm text-muted">Servidores Adicionados:</div>
                <div className="text-2xl font-bold text-success">{servers.length} <span className="text-muted text-lg">/ 20</span></div>
            </div>

            <h3 className="text-xl font-bold text-text pt-4">Meus Servidores</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {servers.map(srv => (
                    <ServerCard key={srv.id} server={srv} onSelect={() => handleSelectServer(srv)} />
                ))}
            </div>
        </div>
      )}

      {view === 'add' && <AddServerForm onClose={() => setView('list')} />}
      
      {view === 'details' && selectedServer && (
          <ServerDetails server={selectedServer} onBack={() => setView('list')} />
      )}
    </div>
  );
}
