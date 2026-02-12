
import React, { useState, useEffect } from 'react';
import { Megaphone, Mail, MessageSquare, Save, Play, Square, Settings, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { RemarketingSvc } from '../services/remarketing/remarketingService';
import { RemarketingConfig, RemarketingEvent, RemarketingLog } from '../types';

export default function Remarketing() {
  const [config, setConfig] = useState<RemarketingConfig | null>(null);
  const [logs, setLogs] = useState<RemarketingLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedTemplateEvent, setSelectedTemplateEvent] = useState<RemarketingEvent>('pre_2d');

  useEffect(() => {
    loadData();
    const logInterval = setInterval(() => { setLogs(RemarketingSvc.getLogs()); }, 10000);
    return () => clearInterval(logInterval);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const conf = await RemarketingSvc.getConfig();
    setConfig(conf);
    setLogs(RemarketingSvc.getLogs());
    setIsLoading(false);
  };
  
  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      window.dispatchEvent(new CustomEvent('sys_toast', { detail: { message, type } }));
  };

  const handleSave = async () => {
    if (config) {
        await RemarketingSvc.saveConfig(config);
        triggerToast('✅ Configurações de Remarketing salvas!');
    }
  };
  
  const handleRunEngine = async () => {
      triggerToast('⚙️ Motor de Remarketing acionado...', 'info');
      await RemarketingSvc.runEngine();
      setTimeout(() => {
          setLogs(RemarketingSvc.getLogs());
          triggerToast('✅ Ciclo de Remarketing finalizado!');
      }, 1500);
  };
  
  if (isLoading || !config) {
    return <div className="p-10 text-center text-muted">Carregando...</div>;
  }
  
  const EVENT_LABELS: Record<RemarketingEvent, string> = {
      'pre_2d': 'Aviso: 2 Dias Antes', 'pre_1d': 'Aviso: 1 Dia Antes', 'expire_day': 'Aviso: Dia do Vencimento',
      'post_3d': 'Cobrança: 3 Dias Após', 'post_7d': 'Reativação: 7 Dias Após', 'post_15d': 'Reativação: 15 Dias Após',
      'post_30d': 'Reativação: 30 Dias Após', 'post_60d': 'Última Chamada: 60 Dias'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-2xl font-bold text-text flex items-center"><Megaphone className="w-6 h-6 mr-3 text-primary" /> Automação de Remarketing</h2>
          <button onClick={handleRunEngine} className="bg-grad-violet hover:shadow-glow-hover text-white font-bold px-5 py-2.5 rounded-xl flex items-center shadow-glow transition-all">
              <Play className="w-4 h-4 mr-2" /> Executar Agora
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl">
                  <h3 className="text-lg font-bold text-text mb-4 flex items-center"><Settings className="w-5 h-5 mr-2 text-muted" /> Canais de Envio</h3>
                  <div className="flex space-x-6">
                      <label className="flex items-center text-muted cursor-pointer"><input type="checkbox" checked={config.channels.whatsapp} onChange={e => setConfig({...config, channels: {...config.channels, whatsapp: e.target.checked}})} className="w-4 h-4 accent-success mr-2" /><MessageSquare className="w-5 h-5 mr-2 text-success" /> WhatsApp</label>
                      <label className="flex items-center text-muted cursor-pointer"><input type="checkbox" checked={config.channels.email} onChange={e => setConfig({...config, channels: {...config.channels, email: e.target.checked}})} className="w-4 h-4 accent-blue-500 mr-2" /><Mail className="w-5 h-5 mr-2 text-blue-500" /> Email</label>
                  </div>
                  <p className="text-xs text-muted mt-4">A configuração das instâncias de WhatsApp foi movida para a página <a href="#/whatsapp-instances" className="text-primary-400 underline">Instâncias WA</a>.</p>
              </div>
          </div>
          <div className="glass-card rounded-2xl flex flex-col">
               <h3 className="text-lg font-bold text-text p-4 border-b border-white/10 flex items-center"><Send className="w-5 h-5 mr-2 text-muted" /> Envios Recentes</h3>
               <div className="flex-1 overflow-y-auto max-h-96 p-4 space-y-3">
                   {logs.length === 0 ? (<div className="text-center text-muted py-10">Nenhum envio registrado.</div>) : (logs.map(log => (
                       <div key={log.id} className="flex items-start text-sm">
                           {log.status === 'sent' ? <CheckCircle className="w-4 h-4 text-success mr-3 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 text-error mr-3 mt-0.5 shrink-0" />}
                           <div>
                               <p className="text-text"><span className={`font-bold ${log.channel === 'whatsapp' ? 'text-success' : 'text-blue-400'}`}>{log.channel.toUpperCase()}</span> para <span className="font-bold">{log.clientName}</span></p>
                               <p className="text-xs text-muted">Gatilho: {EVENT_LABELS[log.event]}<span className="mx-1">·</span>{new Date(log.timestamp).toLocaleTimeString()}</p>
                           </div>
                       </div>
                   )))}
               </div>
          </div>
      </div>
      
      <div className="glass-card rounded-2xl p-6">
           <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                <h3 className="text-lg font-bold text-text">Editor de Mensagens</h3>
                <select value={selectedTemplateEvent} onChange={e => setSelectedTemplateEvent(e.target.value as RemarketingEvent)} className="w-full md:w-auto bg-bg-main border border-white/10 rounded-xl p-3 text-text focus:border-primary/50 outline-none">
                    {Object.entries(EVENT_LABELS).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                </select>
           </div>
           <textarea rows={5} value={config.templates[selectedTemplateEvent]} onChange={e => setConfig({...config, templates: { ...config.templates, [selectedTemplateEvent]: e.target.value }})} className="w-full bg-bg-main p-3 rounded-xl border border-white/10 text-text font-mono text-sm focus:border-primary-500/50 outline-none" />
            <div className="text-xs text-muted mt-2">
                Variáveis: <code className="text-primary-400">{`{{nome}}`}</code>, <code className="text-primary-400">{`{{vencimento}}`}</code>, <code className="text-primary-400">{`{{plano}}`}</code>, <code className="text-primary-400">{`{{valor}}`}</code>
            </div>
      </div>

      <div className="pt-4 flex justify-end">
          <button onClick={handleSave} className="bg-grad-violet hover:shadow-glow-hover text-white font-bold px-6 py-2.5 rounded-xl flex items-center shadow-glow transition-colors">
              <Save className="w-4 h-4 mr-2" /> Salvar Configurações
          </button>
      </div>
    </div>
  );
}
