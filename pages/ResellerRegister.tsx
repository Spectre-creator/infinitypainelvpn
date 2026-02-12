
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { UserPlus, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { Backend } from '../services/mockBackend';

export default function ResellerRegister() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const refId = searchParams.get('ref') || 'admin';
    
    const [formData, setFormData] = useState({ name: '', whatsapp: '', experience: 'iniciante' });
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        await new Promise(r => setTimeout(r, 1000));
        if (!formData.name || !formData.whatsapp) { setErrorMessage('Preencha todos os campos.'); setStatus('error'); return; }
        try { await Backend.submitResellerApplication({ name: formData.name, whatsapp: formData.whatsapp, experience: formData.experience, referrerId: refId }); setStatus('success');
        } catch (e) { setErrorMessage('Erro ao enviar. Tente novamente.'); setStatus('error'); }
    };

    return (
        <div className="min-h-screen bg-bg-main flex items-center justify-center p-4 relative overflow-hidden font-sans">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="glass-card p-8 rounded-2xl shadow-card w-full max-w-md relative z-10">
                {status === 'success' ? (
                    <div className="text-center py-10 animate-in zoom-in-95">
                        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-success/20"><CheckCircle className="w-10 h-10 text-success" /></div>
                        <h2 className="text-2xl font-bold text-text mb-2">Solicitação Enviada!</h2>
                        <p className="text-muted mb-6">Recebemos seus dados. Entraremos em contato pelo WhatsApp em breve.</p>
                        <button onClick={() => navigate('/login')} className="bg-white/5 hover:bg-white/10 text-text px-6 py-2.5 rounded-xl font-bold">Voltar</button>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-8"><div className="w-16 h-16 bg-grad-violet rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-glow"><UserPlus className="w-8 h-8 text-white" /></div><h1 className="text-2xl font-bold text-text">Quero ser Revendedor</h1><p className="text-muted mt-2 text-sm">Preencha o formulário para se candidatar.</p></div>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {status === 'error' && (<div className="bg-error/10 border border-error/20 text-error p-3 rounded-xl text-sm flex items-center"><AlertTriangle className="w-4 h-4 mr-2" />{errorMessage}</div>)}
                            <div><label className="block text-xs font-bold text-muted uppercase mb-1 ml-1">Nome Completo</label><input type="text" className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text focus:border-primary/50 outline-none" placeholder="Como gostaria de ser chamado?" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                            <div><label className="block text-xs font-bold text-muted uppercase mb-1 ml-1">WhatsApp (com DDD)</label><input type="text" className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text focus:border-primary/50 outline-none" placeholder="11999999999" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} /></div>
                            <div><label className="block text-xs font-bold text-muted uppercase mb-1 ml-1">Experiência</label><select className="w-full bg-bg-main border border-white/10 rounded-xl p-3 text-text focus:border-primary/50 outline-none" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})}><option value="iniciante">Sou Iniciante</option><option value="intermediario">Já revendo</option><option value="expert">Sou Expert</option></select></div>
                            <button type="submit" disabled={status === 'submitting'} className="w-full bg-grad-violet hover:brightness-110 text-white font-bold py-3.5 rounded-xl shadow-glow flex justify-center items-center transition-all transform hover:-translate-y-0.5">{status === 'submitting' ? 'Enviando...' : <><Send className="w-4 h-4 mr-2" /> Enviar Solicitação</>}</button>
                        </form>
                        <div className="mt-6 text-center"><a href="/#/login" className="text-xs text-muted hover:text-white transition-colors">Já tem conta? Faça Login</a></div>
                    </>
                )}
            </div>
        </div>
    );
}
