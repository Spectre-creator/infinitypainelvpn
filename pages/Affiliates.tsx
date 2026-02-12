
import React, { useState, useEffect } from 'react';
import { AffiliateSvc } from '../services/affiliate/affiliateService';
import { Backend } from '../services/mockBackend';
import { AffiliateConfig, CommissionLog, User, UserRole, ResellerApplication } from '../types';
import { Share2, Users, DollarSign, Settings, Save, AlertTriangle, Plus, Link as LinkIcon, TreeDeciduous, MessageSquare, Check, X, FileText } from 'lucide-react';
import { FinancialRules, DateRules } from '../domain/rules.mock';

export default function Affiliates() {
    const [user, setUser] = useState<User | null>(null);
    const [config, setConfig] = useState<AffiliateConfig | null>(null);
    const [logs, setLogs] = useState<CommissionLog[]>([]);
    const [networkStats, setNetworkStats] = useState({ direct: 0, total: 0, depth: 0 });
    const [inviteLink, setInviteLink] = useState('');
    
    const [isEditing, setIsEditing] = useState(false);
    const [editConfig, setEditConfig] = useState<AffiliateConfig | null>(null);
    const [applications, setApplications] = useState<ResellerApplication[]>([]);
    const [isAddParentOpen, setIsAddParentOpen] = useState(false);
    const [parentUsername, setParentUsername] = useState('');

    useEffect(() => { loadData(); window.addEventListener('db_update', loadData); return () => window.removeEventListener('db_update', loadData); }, []);

    const loadData = () => {
        const u = Backend.getCurrentUser(); setUser(u);
        const conf = Backend.getAffiliateConfig(); setConfig(conf); setEditConfig(conf);
        if (u) {
            setNetworkStats(AffiliateSvc.getMyNetwork(u.id));
            setLogs(Backend.getCommissionLogs().filter(l => l.beneficiaryId === u.id));
            setInviteLink(`${window.location.origin}/#/register?ref=${u.id}`);
            if (u.role === UserRole.ADMIN) setApplications(Backend.getResellerApplications());
        }
    };

    const triggerToast = (message: string, type: 'success' | 'error' = 'success') => { window.dispatchEvent(new CustomEvent('sys_toast', { detail: { message, type } })); };
    const handleSaveConfig = () => { if (editConfig) { Backend.saveAffiliateConfig(editConfig); setConfig(editConfig); setIsEditing(false); triggerToast('Configurações salvas!'); }};
    const handleAddParent = () => {
        let parentId = parentUsername === 'admin' ? '1' : (parentUsername === 'JhonisSSH' ? '1' : '');
        if (!parentId) return triggerToast('Usuário não encontrado (Mock: "admin")', 'error');
        if (user) {
            const res = AffiliateSvc.registerParent(user.id, parentId);
            triggerToast(res.message, res.success ? 'success' : 'error');
            if(res.success) setIsAddParentOpen(false);
        }
    };
    const handleProcessApp = async (appId: string, action: 'approved' | 'rejected') => { await Backend.processResellerApplication(appId, action); triggerToast(action === 'approved' ? 'Aprovado!' : 'Rejeitado.'); loadData(); };

    if (!user) return null;
    const isAdmin = user.role === UserRole.ADMIN;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-text flex items-center"><Share2 className="w-6 h-6 mr-3 text-pink-500" /> Rede de Afiliados</h2>{config?.enabled && (<div className="bg-pink-500/10 border border-pink-500/20 px-4 py-2 rounded-xl text-pink-300 text-sm flex items-center"><Users className="w-4 h-4 mr-2" />Minha Rede: <b>{networkStats.total}</b></div>)}</div>

            {!config?.enabled && (<div className="glass-card border-error/30 p-6 rounded-xl text-center"><AlertTriangle className="w-12 h-12 text-error mx-auto mb-3" /><h3 className="text-xl font-bold text-error">Sistema Desativado</h3><p className="text-error/70">O programa de afiliados está desabilitado.</p>{isAdmin && <button onClick={() => { if(editConfig) { setEditConfig({...editConfig, enabled: true}); handleSaveConfig(); } }} className="mt-4 bg-error hover:bg-red-700 text-white px-4 py-2 rounded font-bold">Reativar</button>}</div>)}

            {config?.enabled && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="glass-card p-6"><h3 className="text-lg font-bold text-text mb-4 flex items-center"><DollarSign className="w-5 h-5 mr-2 text-success"/> Ganhos Totais</h3><div className="text-3xl font-bold text-text mb-1">{logs.reduce((a, c) => a + (c.currency === 'credits' ? c.amount : 0), 0)} <span className="text-sm text-muted">Créditos</span></div><div className="text-sm text-muted">+ {FinancialRules.formatBRL(logs.reduce((a, c) => a + (c.currency === 'balance' ? c.amount : 0), 0))}</div></div>
                    <div className="glass-card p-6"><h3 className="text-lg font-bold text-text mb-4 flex items-center"><TreeDeciduous className="w-5 h-5 mr-2 text-primary"/> Estrutura</h3><div className="flex justify-between items-center mb-2"><span className="text-muted">Nível 1 (Diretos)</span><span className="text-text font-bold">{networkStats.direct}</span></div><div className="flex justify-between items-center mb-2"><span className="text-muted">Total na Rede</span><span className="text-text font-bold">{networkStats.total}</span></div><div className="flex justify-between items-center"><span className="text-muted">Profundidade</span><span className="text-text font-bold">{networkStats.depth} Níveis</span></div></div>
                    <div className="glass-card p-6 flex flex-col justify-between"><h3 className="text-lg font-bold text-text mb-2 flex items-center"><LinkIcon className="w-5 h-5 mr-2 text-warning"/> Link de Convite</h3><p className="text-xs text-muted mb-3">Envie este link. O candidato preencherá o formulário.</p><div className="bg-bg-main p-2 rounded-lg border border-white/10 flex items-center"><input readOnly value={inviteLink} className="bg-transparent text-muted text-xs w-full outline-none" /></div><div className="mt-4 pt-4 border-t border-white/10"><button onClick={() => setIsAddParentOpen(!isAddParentOpen)} className="text-xs text-primary-400 hover:text-primary-300 underline">Fui convidado? Vincular meu pai</button>{isAddParentOpen && (<div className="mt-2 flex gap-2"><input placeholder="Usuário do Pai" value={parentUsername} onChange={e => setParentUsername(e.target.value)} className="bg-bg-main border border-white/10 rounded-lg text-xs p-2 text-text flex-1" /><button onClick={handleAddParent} className="bg-success text-white px-3 rounded-lg text-xs">OK</button></div>)}</div></div>
                </div>
            )}

            {isAdmin && config?.enabled && (
                <div className="glass-card rounded-2xl overflow-hidden shadow-lg animate-in fade-in">
                    <div className="p-4 border-b border-white/10 bg-bg-main/50 flex justify-between items-center"><h3 className="font-bold text-text flex items-center"><FileText className="w-5 h-5 mr-2 text-warning" /> Solicitações</h3><span className="text-xs bg-warning/20 text-warning px-2 py-1 rounded-lg border border-warning/30">{applications.filter(a => a.status === 'pending').length} Pendentes</span></div>
                    <div className="overflow-x-auto"><table className="w-full text-left text-sm text-muted min-w-[800px]"><thead className="bg-bg-main text-muted text-xs uppercase"><tr><th className="p-4">Data</th><th className="p-4">Nome</th><th className="p-4">Experiência</th><th className="p-4">Indicado Por</th><th className="p-4">Contato</th><th className="p-4 text-center">Ação</th></tr></thead><tbody className="divide-y divide-white/10">{applications.map(app => (<tr key={app.id} className="hover:bg-white/5"><td className="p-4">{DateRules.format(app.createdAt)}</td><td className="p-4 font-bold text-text">{app.name}</td><td className="p-4"><span className="uppercase text-xs font-bold text-primary-300 bg-primary-500/10 px-2 py-1 rounded-lg border border-primary-500/20">{app.experience}</span></td><td className="p-4 text-blue-300">{app.referrerName}</td><td className="p-4"><a href={`https://wa.me/${app.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex items-center text-success hover:text-green-300"><MessageSquare className="w-4 h-4 mr-1.5" />Conversar</a></td><td className="p-4 text-center">{app.status === 'pending' ? (<div className="flex justify-center gap-2"><button onClick={() => handleProcessApp(app.id, 'approved')} className="p-2 bg-success/20 hover:bg-success text-success hover:text-white rounded-lg transition-colors"><Check className="w-4 h-4" /></button><button onClick={() => handleProcessApp(app.id, 'rejected')} className="p-2 bg-error/20 hover:bg-error text-error hover:text-white rounded-lg transition-colors"><X className="w-4 h-4" /></button></div>) : (<span className={`text-xs font-bold uppercase ${app.status === 'approved' ? 'text-success' : 'text-error'}`}>{app.status}</span>)}</td></tr>))}{applications.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted">Nenhuma solicitação.</td></tr>}</tbody></table></div>
                </div>
            )}

            {isAdmin && config && (<div className="glass-card p-6 animate-in fade-in"><div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-text flex items-center"><Settings className="w-5 h-5 mr-2 text-muted"/> Configuração Global</h3><button onClick={() => isEditing ? handleSaveConfig() : setIsEditing(true)} className={`px-4 py-2 rounded-xl font-bold flex items-center ${isEditing ? 'bg-success/20 text-success border border-success/30' : 'bg-white/5 text-muted border border-white/10'}`}>{isEditing ? <><Save className="w-4 h-4 mr-2"/> Salvar</> : <><Settings className="w-4 h-4 mr-2"/> Editar</>}</button></div><div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${!isEditing && 'opacity-60 pointer-events-none'}`}><div><label className="text-xs font-bold text-muted uppercase mb-1 block">Estado</label><select value={editConfig?.enabled ? 'true' : 'false'} onChange={e => setEditConfig({...editConfig!, enabled: e.target.value === 'true'})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text"><option value="true">Ativado</option><option value="false">Desativado</option></select></div><div><label className="text-xs font-bold text-muted uppercase mb-1 block">Pagamento</label><select value={editConfig?.commissionType} onChange={e => setEditConfig({...editConfig!, commissionType: e.target.value as any})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text"><option value="credits">Créditos</option><option value="balance">Saldo R$</option></select></div><div><label className="text-xs font-bold text-muted uppercase mb-1 block">Níveis</label><input type="number" value={editConfig?.levels} onChange={e => setEditConfig({...editConfig!, levels: parseInt(e.target.value)})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text" /></div></div>{isEditing && (<div className="mt-4 p-4 bg-bg-main/50 rounded-xl border border-white/10"><label className="text-xs font-bold text-muted uppercase mb-2 block">Porcentagens (%)</label><div className="flex gap-4">{Array.from({ length: editConfig?.levels || 0 }).map((_, idx) => (<div key={idx} className="flex-1"><span className="text-xs text-muted block mb-1">Nível {idx + 1}</span><input type="number" value={editConfig?.levelPercentage[idx] || 0} onChange={e => { const newPerc = [...(editConfig?.levelPercentage || [])]; newPerc[idx] = parseFloat(e.target.value); setEditConfig({...editConfig!, levelPercentage: newPerc}); }} className="w-full bg-bg-main border border-white/10 rounded-lg p-2 text-text text-center font-bold" /></div>))}</div></div>)}</div>)}
            
            {config?.enabled && (<div className="glass-card rounded-2xl overflow-hidden shadow-lg"><div className="p-4 border-b border-white/10 bg-bg-main/50"><h3 className="font-bold text-text">Extrato de Comissões</h3></div><div className="overflow-x-auto"><table className="w-full text-left text-sm text-muted min-w-[600px]"><thead className="bg-bg-main text-muted text-xs uppercase"><tr><th className="p-4">Data</th><th className="p-4">Origem</th><th className="p-4">Nível</th><th className="p-4 text-right">Valor</th></tr></thead><tbody className="divide-y divide-white/10">{logs.map(log => (<tr key={log.id} className="hover:bg-white/5"><td className="p-4">{DateRules.format(log.createdAt)}</td><td className="p-4 font-medium text-text flex items-center"><span className="w-2 h-2 rounded-full bg-success mr-2"></span>Venda #{log.transactionId.substring(0, 6)}</td><td className="p-4"><span className="bg-bg-main text-muted px-2 py-1 rounded-lg text-xs border border-white/10">Nível {log.level}</span></td><td className="p-4 text-right font-bold text-success">+ {log.currency === 'credits' ? `${log.amount} Créditos` : FinancialRules.formatBRL(log.amount)}</td></tr>))}{logs.length === 0 && (<tr><td colSpan={4} className="p-8 text-center text-muted">Nenhuma comissão registrada.</td></tr>)}</tbody></table></div></div>)}
        </div>
    );
}
