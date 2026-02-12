
import React, { useState, useEffect } from 'react';
import { Smartphone, Globe, Code, Save, Plus, Trash2, Copy, FileJson, Link as LinkIcon } from 'lucide-react';
import { Backend } from '../services/mockBackend';
import { AppPayload, AppProxy, AppConfig } from '../types';

type Tab = 'payloads' | 'proxies' | 'config' | 'api';

export default function Application() {
  const [activeTab, setActiveTab] = useState<Tab>('payloads');
  
  const [payloads, setPayloads] = useState<AppPayload[]>([]);
  const [proxies, setProxies] = useState<AppProxy[]>([]);
  const [config, setConfig] = useState<AppConfig>({ updateUrl: '', updateMessage: '', maintenanceMode: false });
  const [apiJson, setApiJson] = useState('');
  
  const apiUrl = `${window.location.origin}/api/public/config`;

  const [newPayload, setNewPayload] = useState<Partial<AppPayload>>({ 
      name: '', operator: 'vivo', type: 'ssl', payload: '', sni: '', isActive: true, 
      proxyString: '', proxyPort: 80, color: '#3b82f6'
  });
  const [newProxy, setNewProxy] = useState<Partial<AppProxy>>({ 
      name: '', ip: '', port: 80, isPublic: true, status: 'online' 
  });

  useEffect(() => {
    loadData();
    window.addEventListener('db_update', loadData);
    return () => window.removeEventListener('db_update', loadData);
  }, []);

  useEffect(() => {
     if(activeTab === 'api') {
         const data = Backend.getFullAppJson();
         setApiJson(JSON.stringify(data, null, 4));
     }
  }, [activeTab, payloads, proxies, config]);

  const loadData = () => {
    setPayloads(Backend.getPayloads());
    setProxies(Backend.getProxies());
    setConfig(Backend.getAppConfig());
  };

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
      window.dispatchEvent(new CustomEvent('sys_toast', { detail: { message, type } }));
  };

  const handleSavePayload = () => {
    if (!newPayload.name || !newPayload.payload) return triggerToast('Preencha nome e payload!', 'error');
    Backend.savePayload(newPayload as AppPayload);
    setNewPayload({ name: '', operator: 'vivo', type: 'ssl', payload: '', sni: '', isActive: true, proxyString: '', proxyPort: 80, color: '#3b82f6' });
    triggerToast('✅ Payload salvo com sucesso!');
  };
  const handleDeletePayload = (id: string) => { Backend.deletePayload(id); triggerToast('🗑️ Payload removido.', 'success'); };
  const handleSaveProxy = () => {
    if (!newProxy.name || !newProxy.ip) return triggerToast('Preencha nome e IP!', 'error');
    Backend.saveProxy(newProxy as AppProxy);
    setNewProxy({ name: '', ip: '', port: 80, isPublic: true, status: 'online' });
    triggerToast('✅ Proxy salvo com sucesso!');
  };
  const handleDeleteProxy = (id: string) => { Backend.deleteProxy(id); triggerToast('🗑️ Proxy removido.', 'success'); };
  const handleSaveConfig = () => { Backend.saveAppConfig(config); triggerToast('⚙️ Configurações do aplicativo atualizadas!', 'success'); };
  const copyJson = () => { navigator.clipboard.writeText(apiJson); triggerToast('📋 JSON copiado com sucesso!', 'success'); };
  const copyUrl = () => { navigator.clipboard.writeText(apiUrl); triggerToast('🔗 URL copiada!', 'success'); };

  return (
    <div className="space-y-6 max-w-6xl">
       <h2 className="text-2xl font-bold text-text flex items-center">
           <Smartphone className="w-6 h-6 mr-3 text-blue-500" />
           Gerenciar Aplicativo
       </h2>

       <div className="flex space-x-2 border-b border-white/10 pb-1 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('payloads')} className={`flex items-center px-4 py-2 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'payloads' ? 'bg-bg-card text-text border-b-2 border-primary' : 'text-muted hover:text-text'}`}><Code className="w-4 h-4 mr-2" /> Payloads</button>
          <button onClick={() => setActiveTab('proxies')} className={`flex items-center px-4 py-2 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'proxies' ? 'bg-bg-card text-text border-b-2 border-primary' : 'text-muted hover:text-text'}`}><Globe className="w-4 h-4 mr-2" /> Proxies</button>
          <button onClick={() => setActiveTab('config')} className={`flex items-center px-4 py-2 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'config' ? 'bg-bg-card text-text border-b-2 border-primary' : 'text-muted hover:text-text'}`}><Save className="w-4 h-4 mr-2" /> Configurações</button>
          <button onClick={() => setActiveTab('api')} className={`flex items-center px-4 py-2 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'api' ? 'bg-bg-card text-text border-b-2 border-primary' : 'text-muted hover:text-text'}`}><FileJson className="w-4 h-4 mr-2" /> Integração</button>
       </div>

       {activeTab === 'payloads' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
               <div className="glass-card p-6 rounded-2xl">
                   <h3 className="text-lg font-bold text-text mb-4">Novo Payload</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                       <input type="text" placeholder="Nome (Ex: Vivo Front)" value={newPayload.name} onChange={e => setNewPayload({...newPayload, name: e.target.value})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text focus:border-primary/50 outline-none" />
                       <select value={newPayload.operator} onChange={e => setNewPayload({...newPayload, operator: e.target.value as any})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text focus:border-primary/50 outline-none capitalize"><option value="vivo">Vivo</option><option value="tim">Tim</option><option value="claro">Claro</option><option value="oi">Oi</option></select>
                       <select value={newPayload.type} onChange={e => setNewPayload({...newPayload, type: e.target.value as any})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text focus:border-primary/50 outline-none uppercase"><option value="ssl">SSL / TLS</option><option value="inject">HTTP Inject</option><option value="v2ray">V2Ray / Xray</option><option value="openvpn">OpenVPN</option></select>
                       <input type="text" placeholder="Proxy Custom (IP:Porta ou Host)" value={newPayload.proxyString} onChange={e => setNewPayload({...newPayload, proxyString: e.target.value})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text focus:border-primary/50 outline-none" />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div><label className="text-xs font-bold text-muted uppercase mb-1 block ml-1">Porta do Proxy</label><input type="number" placeholder="80, 443, 8080..." value={newPayload.proxyPort} onChange={e => setNewPayload({...newPayload, proxyPort: parseInt(e.target.value)})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text focus:border-primary/50 outline-none" /></div>
                        <div><label className="text-xs font-bold text-muted uppercase mb-1 block ml-1">Cor do Botão (App)</label><div className="flex items-center space-x-2"><input type="color" value={newPayload.color} onChange={e => setNewPayload({...newPayload, color: e.target.value})} className="h-12 w-12 rounded-lg bg-transparent cursor-pointer border-0" /><input type="text" value={newPayload.color} onChange={e => setNewPayload({...newPayload, color: e.target.value})} className="flex-1 bg-bg-main border border-white/10 rounded-xl p-3 text-text uppercase" /></div></div>
                        {newPayload.type !== 'inject' && (<div><label className="text-xs font-bold text-muted uppercase mb-1 block ml-1">SNI (CDN / Host)</label><input type="text" placeholder="ex: cdn.seusite.com" value={newPayload.sni} onChange={e => setNewPayload({...newPayload, sni: e.target.value})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text" /></div>)}
                   </div>
                   <div className="mb-4"><textarea placeholder="Payload String (Ex: GET / HTTP/1.1...)" value={newPayload.payload} onChange={e => setNewPayload({...newPayload, payload: e.target.value})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text font-mono text-sm h-24" /></div>
                   <button onClick={handleSavePayload} className="bg-grad-violet hover:shadow-glow-hover text-white px-5 py-2.5 rounded-xl font-bold flex items-center shadow-glow transition-all"><Plus className="w-4 h-4 mr-2" /> Salvar Payload</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {payloads.map(payload => (<div key={payload.id} className="glass-card rounded-2xl p-4 hover:border-blue-500/50 transition-all relative overflow-hidden group"><div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: payload.color || '#3b82f6' }}></div><div className="pl-3"><div className="flex justify-between items-start mb-2"><h4 className="font-bold text-text text-lg">{payload.name}</h4><div className="flex space-x-2"><button onClick={() => handleDeletePayload(payload.id)} className="text-muted hover:text-error p-1"><Trash2 className="w-4 h-4" /></button></div></div><div className="text-xs text-muted mb-2 font-mono bg-bg-main p-2 rounded truncate border border-white/10">{payload.payload}</div><div className="flex justify-between items-center text-xs text-muted mt-3"><span className="uppercase bg-white/5 px-2 py-0.5 rounded text-muted font-bold border border-white/10">{payload.type}</span>{(payload.proxyString || payload.proxyId) && (<span className="flex items-center text-success truncate max-w-[120px]" title={payload.proxyString}><Globe className="w-3 h-3 mr-1"/> {payload.proxyString ? payload.proxyString : 'Proxy Vinculado'}</span>)}</div><div className="mt-3 pt-3 border-t border-white/5 flex items-center"><span className="text-[10px] text-muted mr-2 uppercase">Prévia:</span><div className="px-3 py-1 rounded text-xs font-bold text-white shadow-sm" style={{ backgroundColor: payload.color || '#3b82f6' }}>CONECTAR {payload.operator.toUpperCase()}</div></div></div></div>))}
               </div>
           </div>
       )}

       {activeTab === 'proxies' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
               <div className="glass-card p-6 rounded-2xl"><h3 className="text-lg font-bold text-text mb-4">Novo Proxy (Público/Geral)</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"><input type="text" placeholder="Nome (Ex: Proxy Principal)" value={newProxy.name} onChange={e => setNewProxy({...newProxy, name: e.target.value})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text" /><input type="text" placeholder="IP / Host" value={newProxy.ip} onChange={e => setNewProxy({...newProxy, ip: e.target.value})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text" /><input type="number" placeholder="Porta" value={newProxy.port} onChange={e => setNewProxy({...newProxy, port: parseInt(e.target.value)})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text" /></div><div className="flex items-center mb-4 space-x-6"><label className="flex items-center text-muted cursor-pointer"><input type="checkbox" checked={newProxy.isPublic} onChange={e => setNewProxy({...newProxy, isPublic: e.target.checked})} className="mr-2 w-4 h-4 accent-primary" />Público</label><label className="flex items-center text-muted cursor-pointer"><input type="checkbox" checked={newProxy.status === 'online'} onChange={e => setNewProxy({...newProxy, status: e.target.checked ? 'online' : 'offline'})} className="mr-2 w-4 h-4 accent-primary" />Online</label></div><button onClick={handleSaveProxy} className="bg-grad-violet hover:shadow-glow-hover text-white px-5 py-2.5 rounded-xl font-bold flex items-center shadow-glow"><Plus className="w-4 h-4 mr-2" /> Salvar Proxy</button></div>
               <div className="glass-card rounded-2xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left min-w-[600px]"><thead className="bg-bg-main/50 text-muted text-xs uppercase tracking-wider"><tr><th className="p-4 font-semibold">Nome</th><th className="p-4 font-semibold">Endereço</th><th className="p-4 font-semibold">Status</th><th className="p-4 font-semibold text-right">Ações</th></tr></thead><tbody className="divide-y divide-white/5 text-sm">{proxies.map(p => (<tr key={p.id}><td className="p-4 font-bold text-text">{p.name} {p.isPublic && <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-md ml-2 border border-blue-500/20">PUB</span>}</td><td className="p-4 font-mono text-muted">{p.ip}:{p.port}</td><td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${p.status === 'online' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>{p.status}</span></td><td className="p-4 text-right"><button onClick={() => handleDeleteProxy(p.id)} className="text-error hover:text-red-300 p-2"><Trash2 className="w-4 h-4" /></button></td></tr>))}</tbody></table></div></div>
           </div>
       )}

       {activeTab === 'config' && (
           <div className="glass-card p-6 rounded-2xl animate-in fade-in slide-in-from-bottom-4">
               <h3 className="text-lg font-bold text-text mb-6">Configurações Gerais do App</h3>
               <div className="space-y-4">
                   <div><label className="text-sm text-muted block mb-1">URL de Atualização (APK)</label><input type="text" value={config.updateUrl} onChange={e => setConfig({...config, updateUrl: e.target.value})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text" /></div>
                   <div><label className="text-sm text-muted block mb-1">Mensagem de Atualização</label><textarea value={config.updateMessage} onChange={e => setConfig({...config, updateMessage: e.target.value})} className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text h-24" /></div>
                   <div className="p-4 bg-bg-main/50 rounded-xl border border-white/10 flex justify-between items-center"><div><div className="font-bold text-text">Modo Manutenção</div><div className="text-xs text-muted">Bloqueia o acesso ao app com uma mensagem de aviso.</div></div><button onClick={() => setConfig({...config, maintenanceMode: !config.maintenanceMode})} className={`px-4 py-2 rounded-lg font-bold text-xs uppercase ${config.maintenanceMode ? 'bg-error text-white' : 'bg-white/5 text-muted'}`}>{config.maintenanceMode ? 'Ativado' : 'Desativado'}</button></div>
               </div>
               <div className="mt-6 flex justify-end"><button onClick={handleSaveConfig} className="bg-grad-violet hover:shadow-glow-hover text-white px-6 py-2.5 rounded-xl font-bold flex items-center shadow-glow"><Save className="w-4 h-4 mr-2" /> Salvar Alterações</button></div>
           </div>
       )}

       {activeTab === 'api' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
               <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                   <div>
                       <h3 className="text-lg font-bold text-text flex items-center"><LinkIcon className="w-5 h-5 mr-2 text-success"/> Endpoint de Produção</h3>
                       <p className="text-sm text-muted mb-2 max-w-lg">Cole esta URL nas configurações do seu aplicativo Android/iOS (DTunnel, Conecta4G, etc).</p>
                       <div className="bg-bg-main p-3 rounded-lg border border-white/10 font-mono text-sm text-success select-all">{apiUrl}</div>
                   </div>
                   <button onClick={copyUrl} className="bg-success/10 hover:bg-success/20 text-success font-bold px-5 py-2.5 rounded-xl ml-4 whitespace-nowrap w-full md:w-auto border border-success/20">Copiar URL</button>
               </div>
               <div className="glass-card p-6 rounded-2xl"><div className="flex justify-between items-center mb-4"><div><h3 className="text-lg font-bold text-text">JSON de Resposta (Preview)</h3><p className="text-sm text-muted">Estrutura exata que o aplicativo receberá.</p></div><button onClick={copyJson} className="bg-white/5 hover:bg-white/10 text-muted font-bold px-5 py-2.5 rounded-xl flex items-center border border-white/10"><Copy className="w-4 h-4 mr-2" /> Copiar JSON</button></div><div className="relative"><pre className="bg-bg-main p-4 rounded-lg border border-white/10 text-success font-mono text-sm overflow-auto max-h-[500px]">{apiJson}</pre></div></div>
           </div>
       )}
    </div>
  );
}
