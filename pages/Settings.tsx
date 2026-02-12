
import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Megaphone, Server, Mail, MessageSquare, User, Lock, Camera, Upload, X, Palette, LayoutTemplate, Image as ImageIcon, QrCode, Wifi, WifiOff, Smartphone, LogOut, Send, CheckCircle, ExternalLink, Database, Download, UploadCloud } from 'lucide-react';
import { RemarketingSvc } from '../services/remarketing/remarketingService';
import { RemarketingConfig, RemarketingEvent, UserRole, SystemSettings } from '../types';
import { Backend } from '../services/mockBackend';

type Tab = 'visual' | 'remarketing' | 'profile' | 'backup';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [user, setUser] = useState(Backend.getCurrentUser());

  // Visual Settings (LocalStorage - Non sensitive)
  const [settings, setSettings] = useState<SystemSettings>({
    app_name: 'VPN Nexus Panel',
    logo_url: '',
    favicon_url: '',
    primary_color: '#8b5cf6',
    secondary_color: '#6366f1',
    background_color: '#0a0a0f',
    card_color: '#11111e',
    text_color: '#fafafc',
    sidebar_text_color: '#9ca3af'
  });

  const [profileData, setProfileData] = useState({ password: '', avatar: '' });
  
  // Remarketing Settings (Now Async from Backend)
  const [rmkConfig, setRmkConfig] = useState<RemarketingConfig | null>(null);
  const [selectedTemplateEvent, setSelectedTemplateEvent] = useState<RemarketingEvent>('pre_2d');
  const [isLoadingSecrets, setIsLoadingSecrets] = useState(false);

  // Backup State
  const [lastManualBackup, setLastManualBackup] = useState(localStorage.getItem('sys_last_manual_backup_date'));
  const [lastAutoBackup, setLastAutoBackup] = useState(localStorage.getItem('sys_last_auto_backup_date'));
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('appSettings');
    if (stored) {
        const parsed = JSON.parse(stored);
        setSettings(prev => ({ ...prev, ...parsed }));
    }
    
    // Load Secrets Securely
    const loadSecrets = async () => {
        setIsLoadingSecrets(true);
        const config = await RemarketingSvc.getConfig();
        setRmkConfig(config);
        setIsLoadingSecrets(false);
    };
    loadSecrets();
    
    const currentUser = Backend.getCurrentUser();
    setUser(currentUser);

    const updateBackupDates = () => {
        setLastManualBackup(localStorage.getItem('sys_last_manual_backup_date'));
        setLastAutoBackup(localStorage.getItem('sys_last_auto_backup_date'));
    };
    updateBackupDates();
    window.addEventListener('db_update', updateBackupDates);

    return () => {
        window.removeEventListener('db_update', updateBackupDates);
    };
  }, []);
  
  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
      window.dispatchEvent(new CustomEvent('sys_toast', { detail: { message, type } }));
  };

  const handleSaveVisual = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    window.dispatchEvent(new Event('settingsUpdated'));
    triggerToast('🎨 Aparência visual atualizada com sucesso!');
  };

  const handleSaveRemarketing = async () => {
    if (rmkConfig) {
        await RemarketingSvc.saveConfig(rmkConfig);
        triggerToast('📢 Configurações de Remarketing salvas com segurança!', 'success');
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setProfileData(prev => ({ ...prev, avatar: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setSettings(prev => ({ ...prev, logo_url: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setSettings(prev => ({ ...prev, favicon_url: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveProfile = async () => {
      if(user) {
          const updates: any = {};
          if(profileData.password) updates.password = profileData.password;
          if(profileData.avatar) updates.avatar = profileData.avatar;
          
          const success = Backend.updateUserProfile(user.id, updates);
          if(success) {
              triggerToast('✅ Perfil atualizado com sucesso!', 'success');
              setProfileData({ password: '', avatar: '' }); 
              setUser(Backend.getCurrentUser());
              window.dispatchEvent(new Event('db_update'));
          } else {
              triggerToast('❌ Erro ao atualizar perfil.', 'error');
          }
      }
  };
  
  const handleBackup = () => {
    try {
        const backupData: { [key: string]: any } = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                backupData[key] = localStorage.getItem(key);
            }
        }

        for (const key in backupData) {
            try { backupData[key] = JSON.parse(backupData[key]); } catch (e) { /* Not JSON */ }
        }
        
        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.href = url;
        a.download = `vpn_nexus_backup_${timestamp}.json`;
        a.click();
        URL.revokeObjectURL(url);

        const backupDate = new Date().toLocaleString('pt-BR');
        localStorage.setItem('sys_last_manual_backup_date', backupDate);
        setLastManualBackup(backupDate);
        triggerToast('Backup gerado com sucesso!', 'success');
    } catch (error) {
        triggerToast('Erro ao gerar backup.', 'error');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/json') {
        setRestoreFile(file);
    } else {
        setRestoreFile(null);
        if (file) triggerToast('Por favor, selecione um arquivo JSON válido.', 'error');
    }
  };

  const handleRestore = () => {
    if (!restoreFile) return;
    if (confirm('ATENÇÃO!\n\nRestaurar um backup substituirá TODOS os dados atuais do painel. Esta ação é irreversível.\n\nDeseja continuar?')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                localStorage.clear();
                for (const key in data) {
                    if (Object.prototype.hasOwnProperty.call(data, key)) {
                        const value = typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key];
                        localStorage.setItem(key, value);
                    }
                }
                triggerToast('Restauração concluída! O painel será recarregado.', 'success');
                setTimeout(() => window.location.reload(), 1500);
            } catch (error) {
                triggerToast('Arquivo de backup inválido ou corrompido.', 'error');
            }
        };
        reader.readAsText(restoreFile);
    }
  };

  const isAdmin = user?.role === UserRole.ADMIN;

  return (
    <div className="space-y-6 max-w-5xl">
      <h2 className="text-2xl font-bold text-text">Configurações</h2>
      
      {/* TABS HEADER */}
      <div className="flex space-x-2 mb-6 border-b border-white/10 pb-1 overflow-x-auto no-scrollbar">
           <button onClick={() => setActiveTab('profile')} className={`flex items-center px-4 py-2 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'profile' ? 'bg-bg-card text-text border-b-2 border-primary' : 'text-muted hover:text-text'}`}>
              <User className="w-4 h-4 mr-2" /> Meu Perfil
          </button>
          
          {isAdmin && (
            <>
                <button onClick={() => setActiveTab('visual')} className={`flex items-center px-4 py-2 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'visual' ? 'bg-bg-card text-text border-b-2 border-primary' : 'text-muted hover:text-text'}`}>
                    <Palette className="w-4 h-4 mr-2" /> Visual
                </button>
                <button onClick={() => setActiveTab('backup')} className={`flex items-center px-4 py-2 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'backup' ? 'bg-bg-card text-text border-b-2 border-primary' : 'text-muted hover:text-text'}`}>
                    <Database className="w-4 h-4 mr-2" /> Backup & Restore
                </button>
            </>
          )}

          <button onClick={() => setActiveTab('remarketing')} className={`flex items-center px-4 py-2 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'remarketing' ? 'bg-bg-card text-text border-b-2 border-primary' : 'text-muted hover:text-text'}`}>
              <Megaphone className="w-4 h-4 mr-2" /> API Remarketing
          </button>
      </div>
      
      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              
              <div className="glass-card rounded-2xl p-6">
                   <h3 className="text-lg font-bold text-text mb-4 pb-4 border-b border-white/10 flex items-center">
                        <User className="w-5 h-5 mr-2 text-primary" /> Dados de Acesso
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                         <div className="space-y-6">
                             <div><label className="block text-sm font-medium text-muted mb-2">Usuário</label><input disabled value={user?.username} className="w-full bg-bg-main border border-white/10 rounded-lg p-2.5 text-muted cursor-not-allowed" /></div>
                             <div><label className="block text-sm font-medium text-muted mb-2">Nova Senha</label><div className="relative"><input type="password" placeholder="Deixe em branco para manter a atual" value={profileData.password} onChange={(e) => setProfileData({...profileData, password: e.target.value})} className="w-full bg-bg-main border border-white/10 rounded-lg p-2.5 pl-10 text-text focus:border-primary/50 outline-none transition-colors" /><Lock className="w-5 h-5 text-muted absolute left-3 top-2.5" /></div></div>
                         </div>
                         <div className="bg-bg-main/50 p-4 rounded-xl border border-white/10">
                            <label className="block text-sm font-medium text-muted mb-3">Foto de Perfil</label>
                            <div className="flex items-center space-x-6">
                                <div className="relative group shrink-0">
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-bg-card shadow-lg group-hover:border-primary/50 transition-colors bg-bg-main">
                                        <img src={profileData.avatar || user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}`} alt="Profile" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <Camera className="w-8 h-8 text-white" />
                                    </div>
                                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Alterar foto" />
                                </div>
                            </div>
                         </div>
                    </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button onClick={handleSaveProfile} className="bg-grad-violet hover:shadow-glow-hover text-white px-6 py-2.5 rounded-lg font-bold flex items-center transition-all shadow-glow">
                    <Save className="w-4 h-4 mr-2" /> Salvar Alterações
                </button>
              </div>
          </div>
      )}

      {/* VISUAL TAB */}
      {activeTab === 'visual' && isAdmin && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-text mb-6 pb-4 border-b border-white/10 flex items-center">
                    <LayoutTemplate className="w-5 h-5 mr-2 text-primary" /> Identidade Visual
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-muted mb-2">Nome do Painel</label>
                            <input type="text" value={settings.app_name} onChange={(e) => setSettings({...settings, app_name: e.target.value})} className="w-full bg-bg-main border border-white/10 rounded-lg p-2.5 text-text focus:border-primary/50 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted mb-2">Logo do Sistema (URL ou Upload)</label>
                            <div className="flex gap-2">
                                <input type="text" placeholder="https://..." value={settings.logo_url} onChange={(e) => setSettings({...settings, logo_url: e.target.value})} className="flex-1 bg-bg-main border border-white/10 rounded-lg p-2.5 text-text text-sm" />
                                <label className="cursor-pointer bg-white/5 hover:bg-white/10 text-muted p-2.5 rounded-lg border border-white/10"><Upload className="w-5 h-5" /><input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} /></label>
                            </div>
                            {settings.logo_url && <img src={settings.logo_url} alt="Logo Preview" className="h-10 mt-2 object-contain bg-bg-main/50 p-1 rounded" />}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted mb-2">Favicon (Ícone da Aba)</label>
                            <div className="flex gap-2">
                                <input type="text" placeholder="https://..." value={settings.favicon_url} onChange={(e) => setSettings({...settings, favicon_url: e.target.value})} className="flex-1 bg-bg-main border border-white/10 rounded-lg p-2.5 text-text text-sm" />
                                <label className="cursor-pointer bg-white/5 hover:bg-white/10 text-muted p-2.5 rounded-lg border border-white/10"><ImageIcon className="w-5 h-5" /><input type="file" accept="image/*" className="hidden" onChange={handleFaviconUpload} /></label>
                            </div>
                            {settings.favicon_url && <img src={settings.favicon_url} alt="Favicon" className="w-8 h-8 mt-2 object-contain" />}
                        </div>
                    </div>
                    <div className="bg-bg-main/50 p-4 rounded-xl border border-white/10">
                        <h4 className="text-sm font-bold text-muted mb-4 flex items-center"><Palette className="w-4 h-4 mr-2" /> Cores do Tema</h4>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Cor Primária', key: 'primary_color' }, { label: 'Cor Secundária', key: 'secondary_color' },
                                { label: 'Fundo da Página', key: 'background_color' }, { label: 'Fundo dos Cards', key: 'card_color' },
                                { label: 'Texto Principal', key: 'text_color' }, { label: 'Texto Secundário', key: 'sidebar_text_color' }
                            ].map(item => (
                                <div key={item.key}>
                                    <label className="text-xs text-muted mb-1 block">{item.label}</label>
                                    <div className="flex items-center space-x-2">
                                        <input type="color" value={(settings as any)[item.key]} onChange={e => setSettings({...settings, [item.key]: e.target.value})} className="h-8 w-8 rounded cursor-pointer border-0 bg-transparent" />
                                        <input type="text" value={(settings as any)[item.key]} onChange={e => setSettings({...settings, [item.key]: e.target.value})} className="w-full bg-bg-main border border-white/10 rounded text-xs p-1.5 text-text font-mono" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="pt-4 flex justify-end">
                <button onClick={handleSaveVisual} className="bg-grad-violet hover:shadow-glow-hover text-white px-6 py-2.5 rounded-lg font-bold flex items-center transition-all shadow-glow">
                    <Save className="w-4 h-4 mr-2" /> Salvar Tema
                </button>
            </div>
        </div>
      )}

      {/* BACKUP TAB */}
      {activeTab === 'backup' && isAdmin && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="glass-card rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-text mb-2">Backup Manual</h3>
                  <p className="text-sm text-muted mb-4">Crie um backup completo do estado atual do painel.</p>
                  <button onClick={handleBackup} className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 font-bold py-2 px-4 rounded-lg flex items-center shadow-lg">
                      <Download className="w-4 h-4 mr-2"/> Fazer Backup Agora
                  </button>
                  {lastManualBackup && <p className="text-xs text-muted mt-2">Último backup: {lastManualBackup}</p>}
              </div>
              <div className="glass-card border-error/30 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-error mb-2">Restaurar Backup</h3>
                  <p className="text-sm text-muted mb-4">Selecione um arquivo de backup (.json) para restaurar. <b className="text-error">Atenção:</b> Esta ação é irreversível.</p>
                  <div className="flex items-center gap-4">
                      <label className="bg-white/5 hover:bg-white/10 text-muted font-bold py-2 px-4 rounded-lg cursor-pointer flex items-center border border-white/10">
                          <UploadCloud className="w-4 h-4 mr-2"/> Selecionar Arquivo
                          <input type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
                      </label>
                      {restoreFile && <span className="text-sm text-text">{restoreFile.name}</span>}
                  </div>
                   <button onClick={handleRestore} disabled={!restoreFile} className="mt-4 bg-error hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                      Restaurar Agora
                  </button>
              </div>
          </div>
      )}

      {/* REMARKETING TAB */}
      {activeTab === 'remarketing' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {isLoadingSecrets ? (
                <div className="p-10 text-center text-muted">Carregando cofre de senhas...</div>
            ) : rmkConfig && (
                <>
                <div className="glass-card p-4 rounded-lg text-sm text-muted flex items-center">
                    <Lock className="w-4 h-4 mr-2 text-success" />
                    Ambiente Seguro: Suas senhas são mascaradas e armazenadas no backend.
                </div>
                <div className="glass-card rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-text mb-4 pb-4 border-b border-white/10 flex items-center"><Mail className="w-5 h-5 mr-2 text-primary" /> Configuração SMTP</h3>
                    <div className="space-y-4">
                        <input type="text" placeholder="Host" value={rmkConfig.smtp.host} onChange={e => setRmkConfig({...rmkConfig, smtp: {...rmkConfig.smtp, host: e.target.value}})} className="w-full bg-bg-main border border-white/10 rounded-lg p-2.5 text-text outline-none focus:border-primary/50" />
                        <div className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="Porta" value={rmkConfig.smtp.port} onChange={e => setRmkConfig({...rmkConfig, smtp: {...rmkConfig.smtp, port: e.target.value}})} className="w-full bg-bg-main border border-white/10 rounded-lg p-2.5 text-text outline-none focus:border-primary/50" />
                            <input type="text" placeholder="De (Nome)" value={rmkConfig.smtp.fromName} onChange={e => setRmkConfig({...rmkConfig, smtp: {...rmkConfig.smtp, fromName: e.target.value}})} className="w-full bg-bg-main border border-white/10 rounded-lg p-2.5 text-text outline-none focus:border-primary/50" />
                        </div>
                        <input type="text" placeholder="Usuário" value={rmkConfig.smtp.user} onChange={e => setRmkConfig({...rmkConfig, smtp: {...rmkConfig.smtp, user: e.target.value}})} className="w-full bg-bg-main border border-white/10 rounded-lg p-2.5 text-text outline-none focus:border-primary/50" />
                        <input type="password" placeholder="Senha (********)" value={rmkConfig.smtp.pass} onChange={e => setRmkConfig({...rmkConfig, smtp: {...rmkConfig.smtp, pass: e.target.value}})} className="w-full bg-bg-main border border-white/10 rounded-lg p-2.5 text-text outline-none focus:border-primary/50" />
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button onClick={handleSaveRemarketing} className="bg-grad-violet hover:shadow-glow-hover text-white px-6 py-2.5 rounded-lg font-bold flex items-center transition-all shadow-glow"><Save className="w-4 h-4 mr-2" /> Salvar Configurações</button>
                </div>
                </>
            )}
        </div>
      )}
    </div>
  );
}
