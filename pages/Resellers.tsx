
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Backend } from '../services/mockBackend';
import { Plus, User, DollarSign, X, Edit, Trash2, Save, Mail, Calendar, Users, Briefcase, LogIn } from 'lucide-react';
import { Reseller } from '../types';
import { ResellerRules } from '../domain/rules.mock';
import ConfirmModal from '../components/ConfirmModal';

export default function Resellers() {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', credits: 10, whatsapp: '' });
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [selectedReseller, setSelectedReseller] = useState<string | null>(null);
  const [creditsAmount, setCreditsAmount] = useState(10);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [resellerToDeleteId, setResellerToDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadResellers();
    window.addEventListener('db_update', loadResellers);
    return () => window.removeEventListener('db_update', loadResellers);
  }, []);

  const loadResellers = () => setResellers(Backend.getResellers());

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
      window.dispatchEvent(new CustomEvent('sys_toast', { detail: { message, type } }));
  };

  const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      const result = await Backend.createReseller(formData);
      if(result.success) {
          triggerToast('✅ Revendedor criado!');
          setIsModalOpen(false);
          setFormData({ username: '', password: '', credits: 10, whatsapp: '' });
      }
  };

  const handleAddCredits = async () => {
      if(!selectedReseller) return;
      await Backend.addCreditsToReseller(selectedReseller, creditsAmount);
      triggerToast('💰 Créditos adicionados!');
      setIsCreditsModalOpen(false);
  };
  
  const handleImpersonate = (resellerId: string) => {
    if (confirm(`Deseja visualizar o painel como este revendedor?`)) {
        Backend.impersonateUser(resellerId);
        navigate('/');
        window.location.reload(); // Força recarga completa para garantir que todo o estado seja atualizado
    }
  };

  const openDeleteConfirm = (id: string) => {
    setResellerToDeleteId(id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (resellerToDeleteId) {
        await Backend.deleteReseller(resellerToDeleteId);
        triggerToast('🗑️ Revendedor excluído.', 'success');
        setIsConfirmModalOpen(false);
        setResellerToDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-text flex items-center"><Briefcase className="w-6 h-6 mr-3 text-blue-400" /> Revendedores</h2>
            <button onClick={() => setIsModalOpen(true)} className="bg-grad-violet hover:shadow-glow-hover text-white px-5 py-2.5 rounded-xl flex items-center text-sm font-bold shadow-glow transition-all">
                <Plus className="w-4 h-4 mr-2" /> Novo Revendedor
            </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {resellers.map((reseller) => {
                const isActive = reseller.status === 'active';
                return (
                    <div key={reseller.id} className="glass-card rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300 group relative flex flex-col hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-bg-main border border-white/5 flex items-center justify-center">
                                    <User className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-text text-lg">{reseller.name}</h3>
                                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-muted border border-white/10 uppercase font-bold tracking-wider">{reseller.category}</span>
                                </div>
                            </div>
                            <span className={`w-2 h-2 rounded-full mt-1 ${isActive ? 'bg-success shadow-[0_0_10px_#10b981]' : 'bg-error'}`}></span>
                        </div>

                        <div className="space-y-3 mb-5">
                            <div className="bg-bg-main/50 p-3 rounded-xl border border-white/5">
                                <span className="text-xs text-muted uppercase font-bold">Saldo</span>
                                <span className="text-2xl font-bold text-primary block mt-1">{ResellerRules.formatCredits(reseller.credits)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-bg-main/30 p-2.5 rounded-xl border border-white/5">
                                    <span className="block text-[10px] text-muted uppercase font-bold mb-1">Clientes</span>
                                    <span className="text-text font-bold">{reseller.activeClients}</span>
                                </div>
                                <div className="bg-bg-main/30 p-2.5 rounded-xl border border-white/5">
                                    <span className="block text-[10px] text-muted uppercase font-bold mb-1">Validade</span>
                                    <span className="text-text font-bold">{reseller.validity}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-white/5 mt-auto">
                            <button onClick={() => { setSelectedReseller(reseller.id); setIsCreditsModalOpen(true); }} className="flex-1 bg-success/10 hover:bg-success/20 text-success border border-success/20 rounded-lg py-2 text-xs font-bold transition-colors flex items-center justify-center">
                                <DollarSign className="w-4 h-4 mr-1" /> Add Créditos
                            </button>
                            <button onClick={() => handleImpersonate(reseller.id)} className="p-2 bg-white/5 hover:bg-blue-500/20 text-muted hover:text-blue-400 rounded-lg transition-colors border border-white/10" title="Visualizar como revendedor">
                                <LogIn className="w-4 h-4" />
                            </button>
                            <button onClick={() => openDeleteConfirm(reseller.id)} className="p-2 bg-white/5 hover:bg-error/20 text-muted hover:text-error rounded-lg transition-colors border border-white/10">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                );
          })}
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja EXCLUIR este revendedor? Todos os clientes dele ficarão sem acesso."
      />

      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="glass-card p-6 rounded-2xl w-full max-w-md relative shadow-2xl animate-in zoom-in-95">
                  <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-muted hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-text mb-6">Novo Revendedor</h3>
                  <form onSubmit={handleCreate} className="space-y-4">
                      <input required type="text" placeholder="Usuário" className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text focus:border-primary/50 outline-none transition-colors" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                      <input required type="text" placeholder="Senha" className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text focus:border-primary/50 outline-none transition-colors" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                      <input required type="number" placeholder="Créditos Iniciais" className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text focus:border-primary/50 outline-none transition-colors" value={formData.credits} onChange={e => setFormData({...formData, credits: parseInt(e.target.value)})} />
                      <button type="submit" className="w-full bg-grad-violet hover:shadow-glow-hover text-white font-bold py-3.5 rounded-xl shadow-glow mt-2 transition-all">Criar Revendedor</button>
                  </form>
              </div>
          </div>
      )}

      {isCreditsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="glass-card p-6 rounded-2xl w-full max-w-sm relative shadow-2xl animate-in zoom-in-95">
                  <button onClick={() => setIsCreditsModalOpen(false)} className="absolute top-4 right-4 text-muted hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-text mb-6">Adicionar Créditos</h3>
                  <input required type="number" className="w-full bg-bg-main border border-white/10 rounded-xl p-4 text-text text-2xl font-bold text-center mb-4 focus:border-primary/50 outline-none" value={creditsAmount} onChange={e => setCreditsAmount(parseInt(e.target.value))} />
                  <button onClick={handleAddCredits} className="w-full bg-success hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all">Confirmar</button>
              </div>
          </div>
      )}
    </div>
  );
}
