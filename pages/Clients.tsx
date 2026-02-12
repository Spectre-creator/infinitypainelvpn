import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { Search, Plus, X, User, Copy, Calendar, Smartphone, Trash2, Edit, Save, AlertTriangle, Monitor, Wifi, WifiOff, MoreHorizontal, ChevronRight } from 'lucide-react';
import { Backend } from '../services/mockBackend';
import { ClientRules, DateRules } from '../domain/rules.mock';
import { PricingSvc } from '../services/financial';
import ConfirmModal from '../components/ConfirmModal';

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdClient, setCreatedClient] = useState<Client | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewingClient, setRenewingClient] = useState<Client | null>(null);
  const [renewalDays, setRenewalDays] = useState(30);
  
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState(0);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [clientToDeleteId, setClientToDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    login: '',
    password: '',
    days: 30,
    limit: 1,
    category: 'PREMIUM',
    isV2Ray: false,
    whatsapp: '',
    email: ''
  });

  useEffect(() => {
    fetchData();
    window.addEventListener('db_update', fetchData);
    window.addEventListener('financial_update', fetchData);
    return () => {
        window.removeEventListener('db_update', fetchData);
        window.removeEventListener('financial_update', fetchData);
    };
  }, []);

  const fetchData = () => {
      const allClients = Backend.getClients();
      const realClients = allClients.filter(c => !c.login.startsWith('teste') && c.status !== 'test');
      setClients(realClients);
      setCredits(Backend.getUserCredits());
  };

  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      window.dispatchEvent(new CustomEvent('sys_toast', { detail: { message, type } }));
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(async () => {
        const result = await Backend.createClient({ ...formData, isTest: false });
        if (result.success && result.client) {
            setCreatedClient(result.client);
            setIsModalOpen(false);
            setShowSuccessModal(true);
            setFormData({ login: '', password: '', days: 30, limit: 1, category: 'PREMIUM', isV2Ray: false, whatsapp: '', email: '' });
            triggerToast('✅ Cliente criado com sucesso!');
        } else {
            triggerToast('❌ Erro: ' + result.error, 'error');
        }
        setIsLoading(false);
    }, 600);
  };

  const handleCopyCreatedInfo = () => {
      if(!createdClient) return;
      const validade = DateRules.format(createdClient.expiryDate);
      let text = `Parabéns! Agora você pode se conectar.\n\n▪ Usuário: ${createdClient.login}\n▪ Senha: ${createdClient.password}\n▪ Validade: ${validade}\n▪ Limite: ${createdClient.limit} aparelho(s)\n`;
      if(createdClient.isV2Ray) text += `▪ V2Ray: ${createdClient.v2rayString}\n`;
      navigator.clipboard.writeText(text);
      triggerToast('📋 Informações copiadas com sucesso!');
  };

  const handleOpenEdit = (client: Client, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingClient({...client}); 
      setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!editingClient) return;
      setIsLoading(true);
      await new Promise(r => setTimeout(r, 500));
      const result = await Backend.updateClient(editingClient.id, editingClient);
      if(result.success) {
          triggerToast('✅ Dados atualizados com sucesso!', 'success');
          setIsEditModalOpen(false);
          setEditingClient(null);
      } else {
          triggerToast('Erro ao atualizar: ' + result.message, 'error');
      }
      setIsLoading(false);
  };
  
  const handleOpenRenewModal = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenewingClient(client);
    setRenewalDays(30);
    setIsRenewModalOpen(true);
  };

  const handleConfirmRenew = async () => {
    if (!renewingClient || renewalDays <= 0) return;
    setIsLoading(true);
    const success = await Backend.renewClient(renewingClient.id, renewalDays);
    if (success) {
        triggerToast(`✅ Cliente ${renewingClient.login} renovado por ${renewalDays} dias!`);
        setIsRenewModalOpen(false);
        setRenewingClient(null);
    } else {
        triggerToast('❌ Erro ao renovar cliente.', 'error');
    }
    setIsLoading(false);
  };

  const openDeleteConfirm = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setClientToDeleteId(id);
      setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
      if(clientToDeleteId) {
          await Backend.deleteClient(clientToDeleteId);
          triggerToast('🗑️ Cliente excluído.', 'success');
          setClientToDeleteId(null);
          setIsConfirmModalOpen(false);
      }
  };

  const handleCopyDetails = (client: Client, e: React.MouseEvent) => {
      e.stopPropagation();
      let text = '';
      if (client.isV2Ray && client.v2rayString) {
          text = client.v2rayString;
      } else {
          const validade = DateRules.format(client.expiryDate);
          text = `👤 *LOGIN:* ${client.login}\n🔑 *SENHA:* ${client.password}\n📅 *VALIDADE:* ${validade}\n\n🚀 *Baixe nosso app e conecte-se!*`;
      }
      navigator.clipboard.writeText(text);
      triggerToast('📋 Dados copiados!', 'success');
  };
  
  const handleSimulateLimitExceeded = async (client: Client, e: React.MouseEvent) => {
      e.stopPropagation();
      await Backend.logSecurityEvent('limit_exceeded', { clientId: client.id, login: client.login });
      triggerToast('Conexões resetadas (Simulação)', 'info');
  };

  const filteredClients = clients.filter(client => 
    client.login.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-text flex items-center">
                Gerenciar Clientes 
                <span className="ml-3 text-xs bg-primary/10 text-primary-400 px-2.5 py-1 rounded-full border border-primary/20 font-semibold">
                    {filteredClients.length}
                </span>
            </h2>
            <p className="text-muted text-sm mt-1">Gerencie acessos, renovações e validade.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="glass-card px-4 py-2.5 rounded-xl flex items-center justify-between min-w-[140px]">
                <span className="text-xs text-muted font-bold uppercase mr-2">Créditos</span>
                <span className="text-lg font-bold text-text">{credits}</span>
            </div>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-grad-violet hover:shadow-glow-hover transition-all text-white px-5 py-2.5 rounded-xl flex items-center justify-center font-bold text-sm shadow-glow"
            >
                <Plus className="w-4 h-4 mr-2" />
                Novo Cliente
            </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative group">
          <input 
            type="text" 
            placeholder="Buscar por login..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full bg-bg-card border border-white/10 rounded-xl py-3 pl-12 pr-4 text-text placeholder-gray-500 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all" 
          />
          <Search className="w-5 h-5 text-gray-500 absolute left-4 top-3.5 group-focus-within:text-primary transition-colors" />
      </div>

      {/* CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredClients.map((client) => {
            const isExpired = new Date(client.expiryDate) < new Date();
            const atLimit = client.connections >= client.limit;
            
            return (
                <div key={client.id} className="glass-card rounded-2xl p-5 hover:border-primary/30 transition-all duration-300 group relative flex flex-col hover:-translate-y-1">
                    {/* Status Line */}
                    {/* FIX: Replaced CSS variables with direct values to resolve TypeScript error and simplify code. */}
                    <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl transition-colors duration-300" 
                         style={{ backgroundColor: client.isOnline ? '#10b981' : isExpired ? '#ef4444' : '#6366f1' }}></div>

                    {/* Header */}
                    <div className="flex justify-between items-start mb-4 pl-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-bg-main flex items-center justify-center border border-white/5">
                                <User className="w-6 h-6 text-muted" />
                            </div>
                            <div>
                                <h3 className="font-bold text-text text-lg flex items-center tracking-tight">
                                    {client.login}
                                    {atLimit && <AlertTriangle className="w-4 h-4 text-warning ml-2 animate-pulse" />}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`w-2 h-2 rounded-full ${client.isOnline ? 'bg-success animate-pulse' : 'bg-muted'}`}></span>
                                    <span className="text-xs text-muted font-medium">{client.isOnline ? 'Conectado' : 'Desconectado'}</span>
                                </div>
                            </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                            isExpired 
                            ? 'bg-error/10 text-error border-error/20' 
                            : 'bg-success/10 text-success border-success/20'
                        }`}>
                            {isExpired ? 'Vencido' : 'Ativo'}
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 pl-3 mb-5">
                        <div className="bg-bg-main p-2.5 rounded-xl border border-white/5">
                            <span className="text-[10px] text-muted block uppercase font-bold mb-1">Validade</span>
                            <span className={`text-sm font-medium ${isExpired ? 'text-error' : 'text-text'}`}>
                                {DateRules.format(client.expiryDate)}
                            </span>
                        </div>
                        <div className="bg-bg-main p-2.5 rounded-xl border border-white/5">
                            <span className="text-[10px] text-muted block uppercase font-bold mb-1">Conexões</span>
                            <span className="text-sm font-medium text-text flex items-center">
                                <Monitor className="w-3 h-3 mr-1.5 text-primary"/>
                                {client.connections} / {client.limit}
                            </span>
                        </div>
                        <div className="bg-bg-main p-2.5 rounded-xl border border-white/5 col-span-2 flex justify-between items-center">
                            <div>
                                <span className="text-[10px] text-muted block uppercase font-bold mb-1">Protocolo</span>
                                <span className="text-xs font-bold text-text bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                    {client.isV2Ray ? 'V2RAY / XRAY' : 'SSH PROXY'}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-muted block uppercase font-bold mb-1">WhatsApp</span>
                                <span className="text-xs text-gray-300">{client.whatsapp || '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="mt-auto pl-3 pt-4 border-t border-white/5 grid grid-cols-5 gap-2">
                        <button onClick={(e) => handleOpenRenewModal(client, e)} className="col-span-1 bg-white/5 hover:bg-success/20 text-muted hover:text-success border border-transparent hover:border-success/30 rounded-lg py-2 flex items-center justify-center transition-all" title="Renovar">
                            <Calendar className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleSimulateLimitExceeded(client, e)} className="col-span-1 bg-white/5 hover:bg-warning/20 text-muted hover:text-warning border border-transparent hover:border-warning/30 rounded-lg py-2 flex items-center justify-center transition-all" title="Resetar">
                            <Smartphone className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleCopyDetails(client, e)} className="col-span-1 bg-white/5 hover:bg-blue-500/20 text-muted hover:text-blue-400 border border-transparent hover:border-blue-500/30 rounded-lg py-2 flex items-center justify-center transition-all" title="Copiar">
                            <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleOpenEdit(client, e)} className="col-span-1 bg-white/5 hover:bg-primary/20 text-muted hover:text-primary border border-transparent hover:border-primary/30 rounded-lg py-2 flex items-center justify-center transition-all" title="Editar">
                            <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => openDeleteConfirm(client.id, e)} className="col-span-1 bg-white/5 hover:bg-error/20 text-muted hover:text-error border border-transparent hover:border-error/30 rounded-lg py-2 flex items-center justify-center transition-all" title="Excluir">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            );
        })}
      </div>
      
      {filteredClients.length === 0 && (
          <div className="glass-card rounded-2xl p-10 text-center border-dashed border-2 border-white/10 flex flex-col items-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <User className="w-10 h-10 text-muted" />
              </div>
              <h3 className="text-xl font-bold text-text">Nenhum cliente encontrado</h3>
              <p className="text-muted text-sm mt-2 max-w-xs">Use o botão "Novo Cliente" para adicionar o primeiro acesso.</p>
          </div>
      )}
      
      {/* --- MODAIS --- */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja EXCLUIR este cliente? Esta ação é irreversível e removerá o acesso permanentemente."
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="glass-card p-6 rounded-2xl w-full max-w-md relative shadow-2xl animate-in zoom-in-95">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-muted hover:text-white transition-colors"><X/></button>
                <h3 className="text-xl font-bold text-text mb-6 flex items-center"><User className="w-5 h-5 mr-2 text-primary" /> Novo Cliente</h3>
                <form onSubmit={handleCreateClient} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-muted uppercase mb-1 block ml-1">Login</label>
                        <input required type="text" value={formData.login} onChange={e => setFormData({...formData, login: e.target.value})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text focus:border-primary/50 outline-none transition-colors" placeholder="Ex: usuario123" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted uppercase mb-1 block ml-1">Senha</label>
                        <input required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text focus:border-primary/50 outline-none transition-colors" placeholder="Senha segura" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-muted uppercase mb-1 block ml-1">Validade (Dias)</label>
                            <input type="number" value={formData.days} onChange={e => setFormData({...formData, days: parseInt(e.target.value)})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text focus:border-primary/50 outline-none transition-colors" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted uppercase mb-1 block ml-1">Limite Telas</label>
                            <input type="number" value={formData.limit} onChange={e => setFormData({...formData, limit: parseInt(e.target.value)})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text focus:border-primary/50 outline-none transition-colors" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted uppercase mb-1 block ml-1">WhatsApp (Opcional)</label>
                        <input type="text" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text focus:border-primary/50 outline-none transition-colors" placeholder="11999999999" />
                    </div>
                    
                    <div className="pt-2">
                        <label className="flex items-center cursor-pointer bg-bg-main p-3 rounded-xl border border-white/10 hover:border-primary/50 transition-colors">
                            <input type="checkbox" checked={formData.isV2Ray} onChange={e => setFormData({...formData, isV2Ray: e.target.checked})} className="w-5 h-5 accent-primary mr-3" />
                            <span className="text-sm font-medium text-text">Habilitar V2Ray / Xray</span>
                        </label>
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full bg-grad-violet hover:shadow-glow-hover text-white font-bold py-3.5 rounded-xl shadow-glow mt-2 flex justify-center items-center transform hover:-translate-y-0.5 transition-all">
                        {isLoading ? 'Processando...' : 'Criar Cliente'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* RENEW MODAL */}
      {isRenewModalOpen && renewingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="glass-card p-6 rounded-2xl w-full max-w-sm relative shadow-2xl animate-in zoom-in-95">
                <button onClick={() => setIsRenewModalOpen(false)} className="absolute top-4 right-4 text-muted hover:text-white transition-colors"><X/></button>
                <h3 className="text-xl font-bold text-text mb-2 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-success" />
                    Renovar Acesso
                </h3>
                <p className="text-sm text-muted mb-6">Cliente: <span className="font-bold text-text">{renewingClient.login}</span></p>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-muted uppercase mb-1 block ml-1">Período de Renovação (Dias)</label>
                        <input 
                            type="number" 
                            value={renewalDays} 
                            onChange={e => setRenewalDays(parseInt(e.target.value) || 0)} 
                            className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text text-center text-2xl font-bold focus:border-success/50 outline-none transition-colors"
                        />
                    </div>
                    <button 
                        onClick={handleConfirmRenew} 
                        disabled={isLoading} 
                        className="w-full bg-success hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg flex justify-center items-center transform hover:-translate-y-0.5 transition-all disabled:opacity-50"
                    >
                        {isLoading ? 'Renovando...' : `Confirmar Renovação (${renewalDays} dias)`}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="glass-card p-6 rounded-2xl w-full max-w-md relative shadow-2xl animate-in zoom-in-95">
                <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 text-muted hover:text-white transition-colors"><X/></button>
                <h3 className="text-xl font-bold text-text mb-6">Editar {editingClient.login}</h3>
                <form onSubmit={handleSaveEdit} className="space-y-4">
                    <div><label className="text-xs font-bold text-muted uppercase block mb-1 ml-1">Senha</label><input value={editingClient.password} onChange={e => setEditingClient({...editingClient, password: e.target.value})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text focus:border-primary/50 outline-none" /></div>
                    <div><label className="text-xs font-bold text-muted uppercase block mb-1 ml-1">Limite</label><input type="number" value={editingClient.limit} onChange={e => setEditingClient({...editingClient, limit: parseInt(e.target.value)})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text focus:border-primary/50 outline-none" /></div>
                    <button type="submit" className="w-full bg-grad-violet hover:shadow-glow-hover text-white font-bold py-3.5 rounded-xl shadow-glow mt-2">Salvar Alterações</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
