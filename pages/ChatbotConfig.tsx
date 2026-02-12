
import React, { useState, useEffect } from 'react';
import { Bot, Save, Plus, Trash2, Edit, MessageSquare, PlayCircle, ToggleLeft, ToggleRight, Users, X, Link as LinkIcon, Copy, Timer } from 'lucide-react';
import { ChatbotConfig, KeywordRule } from '../types';
import { apiRequest } from '../services/api';

export default function ChatbotConfigPage() {
    const [config, setConfig] = useState<ChatbotConfig | null>(null);
    const [activeTab, setActiveTab] = useState<'flows' | 'custom'>('flows');
    const [newRule, setNewRule] = useState<Partial<KeywordRule>>({ keywords: [], response: '', isActive: true });
    const [keywordInput, setKeywordInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const webhookUrl = `${window.location.origin}/api/webhooks/whatsapp`;

    useEffect(() => { loadConfig(); }, []);

    const loadConfig = async () => {
        setIsLoading(true);
        try {
            const data = await apiRequest('/chatbot/config');
            setConfig(data);
        } catch (error) {
            triggerToast('Falha ao carregar configuração', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const triggerToast = (message: string, type: 'success' | 'error' = 'success') => { window.dispatchEvent(new CustomEvent('sys_toast', { detail: { message, type } })); };
    const handleSave = async () => { if (config) { try { await apiRequest('/chatbot/config', 'POST', config); triggerToast('Configurações salvas!'); } catch (error) { triggerToast('Erro ao salvar.', 'error'); } } };
    const handleAddRule = () => { if (config && newRule.response && newRule.keywords && newRule.keywords.length > 0) { const rule: KeywordRule = { id: Date.now().toString(), keywords: newRule.keywords, response: newRule.response, isActive: true }; setConfig({ ...config, customRules: [...(config.customRules || []), rule] }); setNewRule({ keywords: [], response: '', isActive: true }); setKeywordInput(''); triggerToast('Regra adicionada!'); } };
    const handleAddKeyword = () => { if (keywordInput.trim()) { setNewRule({ ...newRule, keywords: [...(newRule.keywords || []), keywordInput.trim()] }); setKeywordInput(''); } };
    const handleDeleteRule = (id: string) => { if (config) { setConfig({ ...config, customRules: config.customRules.filter(r => r.id !== id) }); } };

    if (isLoading || !config) return <div className="text-muted text-center p-10">Carregando...</div>;

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-text flex items-center"><Bot className="w-6 h-6 mr-3 text-primary" /> Configurar Chatbot</h2><button onClick={handleSave} className="bg-grad-violet hover:shadow-glow-hover text-white px-6 py-2.5 rounded-xl font-bold flex items-center shadow-glow transition-colors"><Save className="w-4 h-4 mr-2" /> Salvar</button></div>
            
            <div className="glass-card p-4 rounded-2xl"><h4 className="text-lg font-bold text-text mb-2 flex items-center"><LinkIcon className="w-5 h-5 mr-2 text-success"/> Webhook URL</h4><p className="text-sm text-muted mb-3">Configure esta URL no seu provedor de API do WhatsApp.</p><div className="bg-bg-main p-3 rounded-lg font-mono text-sm text-success select-all border border-white/10 flex items-center justify-between"><span>{webhookUrl}</span><button onClick={() => { navigator.clipboard.writeText(webhookUrl); triggerToast('Copiado!'); }} className="text-muted hover:text-white"><Copy className="w-4 h-4" /></button></div></div>

            <div className="flex space-x-2 border-b border-white/10 pb-1"><button onClick={() => setActiveTab('flows')} className={`px-4 py-2 font-medium flex items-center rounded-t-lg transition-colors ${activeTab === 'flows' ? 'bg-bg-card text-text border-b-2 border-primary' : 'text-muted hover:text-text'}`}><PlayCircle className="w-4 h-4 mr-2" /> Fluxos</button><button onClick={() => setActiveTab('custom')} className={`px-4 py-2 font-medium flex items-center rounded-t-lg transition-colors ${activeTab === 'custom' ? 'bg-bg-card text-text border-b-2 border-primary' : 'text-muted hover:text-text'}`}><MessageSquare className="w-4 h-4 mr-2" /> Respostas</button></div>

            {activeTab === 'flows' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                    <div className="glass-card p-6 rounded-2xl"><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-text flex items-center"><Timer className="w-5 h-5 mr-2 text-warning" /> Gerar Teste</h3><button onClick={() => setConfig({...config, flows: {...config.flows, testFlow: {...config.flows.testFlow, active: !config.flows.testFlow.active}}})}>{config.flows.testFlow.active ? <ToggleRight className="w-8 h-8 text-success"/> : <ToggleLeft className="w-8 h-8 text-muted"/>}</button></div><div className="space-y-4"><div><label className="text-xs text-muted uppercase font-bold">Palavras-Chave</label><input type="text" value={config.flows.testFlow.keywords.join(', ')} onChange={e => setConfig({...config, flows: {...config.flows, testFlow: {...config.flows.testFlow, keywords: e.target.value.split(',').map(s => s.trim())}}})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text text-sm" /></div><div className="grid grid-cols-2 gap-4"><div><label className="text-xs text-muted uppercase font-bold">Duração (min)</label><input type="number" value={config.flows.testFlow.duration} onChange={e => setConfig({...config, flows: {...config.flows, testFlow: {...config.flows.testFlow, duration: parseInt(e.target.value)}}})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text text-sm" /></div><div><label className="text-xs text-muted uppercase font-bold">Senha Padrão</label><input type="text" value={config.flows.testFlow.defaultPassword || ''} onChange={e => setConfig({...config, flows: {...config.flows, testFlow: {...config.flows.testFlow, defaultPassword: e.target.value}}})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text text-sm" /></div></div><div><label className="text-xs text-muted uppercase font-bold">Mensagem Sucesso</label><textarea rows={4} value={config.flows.testFlow.messages.success} onChange={e => setConfig({...config, flows: {...config.flows, testFlow: {...config.flows.testFlow, messages: {...config.flows.testFlow.messages, success: e.target.value}}}})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text text-sm font-mono" /></div></div></div>
                    <div className="glass-card p-6 rounded-2xl opacity-60"><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-text flex items-center"><Users className="w-5 h-5 mr-2 text-blue-400" /> Criar Usuário</h3><ToggleLeft className="w-8 h-8 text-muted"/></div><div className="space-y-4"><div><label className="text-xs text-muted uppercase font-bold">Senha Padrão</label><input type="text" value={config.flows.userFlow.defaultPassword || ''} onChange={e => setConfig({...config, flows: {...config.flows, userFlow: {...config.flows.userFlow, defaultPassword: e.target.value}}})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text text-sm" placeholder="Ex: 102030"/></div><p className="text-sm text-muted text-center py-6">Outras configurações em breve...</p></div></div>
                </div>
            )}

            {activeTab === 'custom' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="glass-card p-6 rounded-2xl"><h3 className="font-bold text-text mb-4">Nova Resposta Rápida</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><div><label className="text-xs text-muted uppercase font-bold mb-1 block">Palavras-chave</label><div className="flex gap-2"><input placeholder="Ex: pix" value={keywordInput} onChange={e => setKeywordInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddKeyword()} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text text-sm" /><button onClick={handleAddKeyword} className="bg-white/5 text-text px-4 rounded-xl"><Plus className="w-4 h-4"/></button></div><div className="flex flex-wrap gap-2 mt-2">{newRule.keywords?.map(k => (<span key={k} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md border border-primary/20 flex items-center">{k} <button onClick={() => setNewRule({...newRule, keywords: newRule.keywords?.filter(w => w !== k)})} className="ml-1 hover:text-white"><X className="w-3 h-3"/></button></span>))}</div></div><div><label className="text-xs text-muted uppercase font-bold mb-1 block">Resposta Automática</label><textarea rows={3} placeholder="Digite a resposta do bot..." value={newRule.response} onChange={e => setNewRule({...newRule, response: e.target.value})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text text-sm" /></div></div><button onClick={handleAddRule} className="w-full bg-primary hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors">Adicionar Regra</button></div>
                    <div className="glass-card rounded-2xl overflow-hidden"><table className="w-full text-left text-sm text-muted">
                        <thead className="bg-bg-main/50 text-muted text-xs uppercase"><tr><th className="p-4">Palavras-Chave</th><th className="p-4">Resposta</th><th className="p-4 text-right">Ação</th></tr></thead>
                        <tbody className="divide-y divide-white/10">
                            {(config.customRules || []).map(rule => (<tr key={rule.id}><td className="p-4"><div className="flex flex-wrap gap-1">{rule.keywords.map(k => <span key={k} className="bg-bg-main px-2 py-0.5 rounded-md text-xs border border-white/10">{k}</span>)}</div></td><td className="p-4 text-text truncate max-w-md">{rule.response}</td><td className="p-4 text-right"><button onClick={() => handleDeleteRule(rule.id)} className="text-error hover:bg-error/20 p-2 rounded-lg"><Trash2 className="w-4 h-4"/></button></td></tr>))}
                            {(!config.customRules || config.customRules.length === 0) && <tr><td colSpan={3} className="p-6 text-center text-muted">Nenhuma regra.</td></tr>}
                        </tbody>
                    </table></div>
                </div>
            )}
        </div>
    );
}
