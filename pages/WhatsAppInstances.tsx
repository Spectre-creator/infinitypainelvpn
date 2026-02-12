
import React, { useState, useEffect } from 'react';
import { Network, Plus, MoreHorizontal, QrCode, Wifi, WifiOff, Trash2, Edit, Save, X, Power, PowerOff, Star, Send } from 'lucide-react';
import { WhatsappInstance } from '../types';
import { Backend } from '../services/mockBackend';

export default function WhatsAppInstances() {
    const [instances, setInstances] = useState<WhatsappInstance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingInstance, setEditingInstance] = useState<Partial<WhatsappInstance> | null>(null);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [qrInstance, setQrInstance] = useState<WhatsappInstance | null>(null);

    useEffect(() => {
        loadInstances();
        window.addEventListener('db_update', loadInstances);
        return () => window.removeEventListener('db_update', loadInstances);
    }, []);

    const loadInstances = async () => {
        setIsLoading(true);
        const data = await Backend.getWhatsappInstances();
        setInstances(data.sort((a, b) => a.priority - b.priority));
        setIsLoading(false);
    };

    const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        window.dispatchEvent(new CustomEvent('sys_toast', { detail: { message, type } }));
    };

    const openEditModal = (instance: Partial<WhatsappInstance> | null = null) => {
        setEditingInstance(instance ? { ...instance } : { name: '', apiUrl: '', apiToken: '', instanceId: '', priority: 10, isDefault: false });
        setIsEditModalOpen(true);
    };

    const handleSaveInstance = async () => {
        if (!editingInstance || !editingInstance.name) {
            return triggerToast('O nome da instância é obrigatório!', 'error');
        }
        await Backend.saveWhatsappInstance(editingInstance);
        triggerToast('✅ Instância salva com sucesso!');
        setIsEditModalOpen(false);
        setEditingInstance(null);
    };

    const handleDeleteInstance = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta instância?')) {
            await Backend.deleteWhatsappInstance(id);
            triggerToast('🗑️ Instância removida.');
        }
    };

    const handleGenerateQr = async (id: string) => {
        triggerToast('Gerando QR Code...', 'info');
        const instance = await Backend.generateInstanceQr(id);
        setQrInstance(instance);
        setIsQrModalOpen(true);
        setTimeout(async () => {
            if (instance.status === 'QRCODE') {
                await Backend.connectInstance(id);
                setIsQrModalOpen(false); setQrInstance(null);
                triggerToast(`📱 Instância "${instance.name}" conectada!`, 'success');
            }
        }, 6000);
    };

    const handleDisconnect = async (id: string) => { await Backend.disconnectInstance(id); triggerToast('🔌 Instância desconectada.'); };

    const getStatusChip = (status: WhatsappInstance['status']) => {
        const styles = { CONNECTED: 'bg-success/20 text-success', DISCONNECTED: 'bg-white/10 text-muted', QRCODE: 'bg-warning/20 text-warning animate-pulse', ERROR: 'bg-error/20 text-error' };
        const icons = { CONNECTED: <Wifi className="w-3 h-3 mr-1.5" />, DISCONNECTED: <WifiOff className="w-3 h-3 mr-1.5" />, QRCODE: <QrCode className="w-3 h-3 mr-1.5" />, ERROR: <WifiOff className="w-3 h-3 mr-1.5" /> };
        return (<span className={`flex items-center text-xs font-bold uppercase px-2 py-1 rounded-lg ${styles[status]}`}>{icons[status]} {status}</span>);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text flex items-center"><Network className="w-6 h-6 mr-3 text-success" /> Instâncias de WhatsApp</h2>
                <button onClick={() => openEditModal()} className="bg-success/20 hover:bg-success/30 text-success border border-success/30 px-5 py-2.5 rounded-xl flex items-center shadow-lg font-bold text-sm">
                    <Plus className="w-4 h-4 mr-2" /> Adicionar
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {instances.map(instance => (
                    <div key={instance.id} className="glass-card rounded-2xl p-4 flex flex-col justify-between hover:border-success/30 transition-colors">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-text text-lg">{instance.name}</h3>
                                {getStatusChip(instance.status)}
                            </div>
                            <div className="text-xs text-muted font-mono bg-bg-main p-2 rounded-lg border border-white/10 mb-4">
                                <p>API: {instance.apiUrl}</p><p>ID: {instance.instanceId}</p>
                            </div>
                            <div className="flex items-center justify-between text-sm mb-4">
                                <span className="text-muted flex items-center"><Star className="w-4 h-4 mr-2 text-warning"/>Prioridade</span>
                                <span className="font-bold text-text bg-bg-main px-2 py-0.5 rounded-lg border border-white/10">{instance.priority}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 border-t border-white/10 pt-3">
                            {instance.status === 'DISCONNECTED' && (<button onClick={() => handleGenerateQr(instance.id)} className="flex-1 px-3 py-2 bg-success/20 hover:bg-success text-success hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center"><Power className="w-4 h-4 mr-2"/>Conectar</button>)}
                            {instance.status === 'CONNECTED' && (<button onClick={() => handleDisconnect(instance.id)} className="flex-1 px-3 py-2 bg-error/20 hover:bg-error text-error hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center"><PowerOff className="w-4 h-4 mr-2"/>Desconectar</button>)}
                            <button onClick={() => openEditModal(instance)} className="p-2 bg-white/5 hover:bg-primary/20 rounded-lg text-muted hover:text-primary transition-colors"><Edit className="w-4 h-4"/></button>
                            <button onClick={() => handleDeleteInstance(instance.id)} className="p-2 bg-white/5 hover:bg-error/20 rounded-lg text-muted hover:text-error transition-colors"><Trash2 className="w-4 h-4"/></button>
                        </div>
                    </div>
                ))}
            </div>

            {isEditModalOpen && editingInstance && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-card p-6 rounded-2xl w-full max-w-lg relative animate-in zoom-in-95">
                        <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 text-muted"><X/></button>
                        <h3 className="text-xl font-bold text-text mb-4">{editingInstance.id ? 'Editar' : 'Nova'} Instância</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="Nome (Ex: Principal)" value={editingInstance.name} onChange={e => setEditingInstance({...editingInstance, name: e.target.value})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text" />
                            <input type="text" placeholder="URL da API" value={editingInstance.apiUrl} onChange={e => setEditingInstance({...editingInstance, apiUrl: e.target.value})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text" />
                            <input type="text" placeholder="ID da Instância" value={editingInstance.instanceId} onChange={e => setEditingInstance({...editingInstance, instanceId: e.target.value})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text" />
                            <input type="password" placeholder="API Token (********)" value={editingInstance.apiToken} onChange={e => setEditingInstance({...editingInstance, apiToken: e.target.value})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text" />
                            <div><label className="text-xs text-muted">Prioridade</label><input type="number" value={editingInstance.priority} onChange={e => setEditingInstance({...editingInstance, priority: parseInt(e.target.value)})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text" /></div>
                            <button onClick={handleSaveInstance} className="w-full bg-grad-violet text-white font-bold py-3.5 rounded-xl"><Save className="w-4 h-4 mr-2 inline-block"/>Salvar</button>
                        </div>
                    </div>
                </div>
            )}
            
            {isQrModalOpen && qrInstance && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                     <div className="glass-card p-6 rounded-2xl text-center">
                         <h3 className="text-xl font-bold text-text mb-2">Conectar: {qrInstance.name}</h3>
                         <p className="text-muted text-sm mb-4">Escaneie o QR Code com seu WhatsApp.</p>
                         <div className="bg-white p-2 rounded-lg inline-block">{qrInstance.qrCode ? <img src={qrInstance.qrCode} alt="QR Code"/> : <p>Gerando...</p>}</div>
                         <p className="text-warning text-xs mt-4 animate-pulse">Aguardando leitura... O sistema conectará automaticamente.</p>
                     </div>
                 </div>
            )}
        </div>
    );
}
