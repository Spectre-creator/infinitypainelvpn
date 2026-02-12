
import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Plus, X, CheckCircle, Copy, Link as LinkIcon, ExternalLink, Phone, AlertTriangle } from 'lucide-react';
import { Backend } from '../services/mockBackend';
import { ResellerSale, User } from '../types';
import { FinancialRules, DateRules } from '../domain/rules.mock';
import { Features } from '../config/features';

export default function ResellerSales() {
    const [sales, setSales] = useState<ResellerSale[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [newSale, setNewSale] = useState<Partial<ResellerSale>>({ customerName: '', planName: 'Mensal 30 Dias', amount: 15.00, operator: 'vivo', phoneNumber: '' });
    const [generatedSale, setGeneratedSale] = useState<ResellerSale | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const hasPixKeyConfigured = useMemo(() => !!(user as any)?.pixKey, [user]);

    useEffect(() => {
        if (!Features.ENABLE_RESELLER_CHECKOUT) return;
        const loadData = () => {
            const currentUser = Backend.getCurrentUser();
            setUser(currentUser);
            if (currentUser) setSales(Backend.getResellerSales(currentUser.id));
        };
        loadData();
        window.addEventListener('db_update', loadData);
        return () => window.removeEventListener('db_update', loadData);
    }, []);
    
    const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
        window.dispatchEvent(new CustomEvent('sys_toast', { detail: { message, type } }));
    };

    const handleGenerateSale = async () => {
        if (!user || !newSale.customerName || !newSale.amount || !newSale.phoneNumber) return triggerToast('Preencha os campos obrigatórios.', 'error');
        setIsLoading(true);
        const result = await Backend.generateResellerSale(user, newSale as any);
        if (result.success && result.sale) {
            setGeneratedSale(result.sale);
            setIsModalOpen(false);
            setShowSuccessModal(true);
            setNewSale({ customerName: '', planName: 'Mensal 30 Dias', amount: 15.00, operator: 'vivo', phoneNumber: '' });
            triggerToast('✅ Venda gerada!');
        }
        setIsLoading(false);
    };

    const handleMarkAsPaid = async (saleId: string) => {
        if (confirm('Confirmar pagamento?')) {
            const result = await Backend.markSaleAsPaid(saleId);
            if (result.success) triggerToast('💰 Pagamento confirmado!');
        }
    };

    const copyLink = (publicId: string, saleId: string) => {
        const url = `${window.location.origin}/#/checkout/${publicId}`;
        navigator.clipboard.writeText(url);
        setCopiedId(saleId);
        setTimeout(() => setCopiedId(null), 2000);
        triggerToast('🔗 Link copiado!');
    };

    if (!Features.ENABLE_RESELLER_CHECKOUT) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-white flex items-center">
                    <ShoppingBag className="w-6 h-6 mr-3 text-primary-400" /> Minhas Vendas
                </h2>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    disabled={!hasPixKeyConfigured}
                    className="bg-grad-violet hover:shadow-glow text-white px-5 py-2.5 rounded-xl flex items-center font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto justify-center shadow-lg transition-all"
                >
                    <Plus className="w-4 h-4 mr-2" /> Gerar Nova Venda
                </button>
            </div>

            {!hasPixKeyConfigured && (
                <div className="glass-card border-l-4 border-l-yellow-500 p-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 mr-3" />
                    <span className="text-sm text-gray-300">Configure sua chave PIX no menu Financeiro para receber pagamentos.</span>
                </div>
            )}

            {/* CARD GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {sales.map(sale => (
                    <div key={sale.id} className="glass-card rounded-[20px] p-5 hover:border-primary-500/30 transition-all duration-300 group hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-white text-lg">{sale.customerName}</h3>
                                <div className="flex items-center text-xs text-muted mt-1">
                                    <Phone className="w-3 h-3 mr-1" /> {sale.phoneNumber || 'N/A'}
                                </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${sale.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                                {sale.status === 'paid' ? 'Pago' : 'Pendente'}
                            </span>
                        </div>

                        <div className="space-y-3 mb-5">
                            <div className="bg-bg-sec/50 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                                <span className="text-xs text-gray-400 font-bold uppercase">Valor</span>
                                <span className="text-lg font-bold text-green-400">{FinancialRules.formatBRL(sale.amount)}</span>
                            </div>
                            <div className="flex justify-between text-sm px-1">
                                <span className="text-gray-500">Plano</span>
                                <span className="text-white font-medium">{sale.planName}</span>
                            </div>
                            <div className="flex justify-between text-sm px-1">
                                <span className="text-gray-500">Operadora</span>
                                <span className="uppercase text-white font-bold bg-white/5 px-2 rounded-lg text-xs border border-white/5">{sale.operator}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5">
                            <button onClick={() => copyLink(sale.publicId, sale.id)} className="col-span-2 bg-white/5 hover:bg-primary-500/20 text-gray-300 hover:text-white border border-white/5 hover:border-primary-500/20 rounded-xl py-2 text-xs font-bold flex items-center justify-center transition-colors">
                                {copiedId === sale.id ? <CheckCircle className="w-3 h-3 mr-1.5 text-green-400" /> : <Copy className="w-3 h-3 mr-1.5" />}
                                {copiedId === sale.id ? 'Copiado' : 'Copiar Link'}
                            </button>
                            <a href={`#/checkout/${sale.publicId}`} target="_blank" className="col-span-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 rounded-xl flex items-center justify-center transition-colors">
                                <ExternalLink className="w-4 h-4"/>
                            </a>
                            {sale.status === 'pending' && (
                                <button onClick={() => handleMarkAsPaid(sale.id)} className="col-span-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl py-2.5 text-xs font-bold transition-colors">
                                    Marcar como Pago Manualmente
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Criação */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-card border border-white/10 p-6 rounded-2xl w-full max-w-md relative animate-in zoom-in-95">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X/></button>
                        <h3 className="text-xl font-bold text-white mb-6">Nova Venda</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="Nome do Cliente" value={newSale.customerName} onChange={e => setNewSale({...newSale, customerName: e.target.value})} className="w-full bg-bg-sec border border-white/10 rounded-xl p-3 text-white focus:border-primary-500/50 outline-none" />
                            <input type="text" placeholder="WhatsApp (11999...)" value={newSale.phoneNumber} onChange={e => setNewSale({...newSale, phoneNumber: e.target.value})} className="w-full bg-bg-sec border border-white/10 rounded-xl p-3 text-white focus:border-primary-500/50 outline-none" />
                            <div className="grid grid-cols-2 gap-4">
                                <select value={newSale.operator} onChange={e => setNewSale({...newSale, operator: e.target.value as any})} className="w-full bg-bg-sec border border-white/10 rounded-xl p-3 text-white outline-none"><option value="vivo">Vivo</option><option value="tim">Tim</option><option value="claro">Claro</option></select>
                                <input type="number" placeholder="Valor" value={newSale.amount} onChange={e => setNewSale({...newSale, amount: parseFloat(e.target.value)})} className="w-full bg-bg-sec border border-white/10 rounded-xl p-3 text-white focus:border-primary-500/50 outline-none" />
                            </div>
                            <button onClick={handleGenerateSale} disabled={isLoading} className="w-full bg-grad-violet hover:shadow-glow text-white font-bold py-3.5 rounded-xl shadow-lg mt-2 transition-all">
                                {isLoading ? 'Gerando...' : 'Criar Link de Pagamento'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
