
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QrCode, Copy, CheckCircle, Clock, ShieldCheck, FileText } from 'lucide-react';
import { Backend } from '../services/mockBackend';
import { ResellerSale } from '../types';
import { FinancialRules } from '../domain/rules.mock';
import { gerarPayloadPix } from '../services/utils/pixGenerator';

export default function Checkout() {
    const { publicId } = useParams<{ publicId: string }>();
    const [sale, setSale] = useState<ResellerSale | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [pixPayload, setPixPayload] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    useEffect(() => {
        const fetchSale = async () => {
            if (!publicId) { setError('Link de venda inválido.'); setIsLoading(false); return; }
            const saleData = await Backend.getSaleByPublicId(publicId);
            if (saleData) {
                setSale(saleData);
                const payload = gerarPayloadPix({ chave: saleData.pixKey, nome: saleData.resellerName, cidade: 'CIDADE', valor: saleData.amount, txid: `SALE${saleData.id}` });
                setPixPayload(payload);
                setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(payload)}`);
            } else { setError('Venda não encontrada ou expirada.'); }
            setIsLoading(false);
        };
        fetchSale();
    }, [publicId]);

    const handleCopy = () => { if (!termsAccepted) return; navigator.clipboard.writeText(pixPayload); setCopied(true); setTimeout(() => setCopied(false), 2000); };

    if (isLoading) return <div className="min-h-screen bg-bg-main flex items-center justify-center text-text">Carregando...</div>;
    if (error) return <div className="min-h-screen bg-bg-main flex items-center justify-center text-error">{error}</div>;
    if (!sale) return null;
    
    return (
        <div className="min-h-screen bg-bg-main flex items-center justify-center p-4 font-sans relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] pointer-events-none"></div>
            
            <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-card w-full max-w-md text-center relative z-10">
                
                <div className="flex justify-center mb-4"><div className="bg-success/10 p-3 rounded-full border border-success/20"><ShieldCheck className="w-8 h-8 text-success" /></div></div>
                <h1 className="text-xl font-bold text-text mb-2">Checkout Seguro</h1>
                <p className="text-muted text-sm mb-6">Pedido para {sale.customerName}</p>
                
                {sale.status === 'paid' ? (
                    <div className="bg-success/10 border border-success/20 rounded-lg p-8 flex flex-col items-center">
                        <CheckCircle className="w-16 h-16 text-success mb-4" /><h2 className="text-2xl font-bold text-success">Pagamento Confirmado!</h2>
                        <p className="text-green-200/80 mt-2">Obrigado! Seu acesso será liberado em breve.</p>
                        <p className="text-xs text-green-200/50 mt-4">ID: {sale.id}</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-bg-main/50 p-4 rounded-xl border border-white/10 mb-6 text-left">
                            <div className="flex justify-between items-center text-sm mb-2"><span className="text-muted">Produto:</span><span className="text-text font-medium">{sale.planName}</span></div>
                            <div className="flex justify-between items-center text-sm mb-2"><span className="text-muted">Operadora:</span><span className="text-text font-medium uppercase">{sale.operator}</span></div>
                            <div className="border-t border-white/10 my-2 pt-2 flex justify-between items-center"><span className="text-muted">Total:</span><span className="text-2xl font-bold text-success">{FinancialRules.formatBRL(sale.amount)}</span></div>
                        </div>
                        <div className="mb-6 text-left bg-primary/5 p-3 rounded-lg border border-primary/10 transition-all hover:bg-primary/10">
                            <label className="flex items-start cursor-pointer group"><div className="relative flex items-center pt-0.5"><input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-muted bg-bg-main transition-all checked:border-primary checked:bg-primary hover:border-primary-400 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-card" /><div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100"><svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg></div></div><span className="ml-3 text-xs text-muted select-none group-hover:text-text transition-colors leading-tight">Li e concordo com os <a href="#" className="text-primary-400 underline hover:text-primary-300 font-medium">Termos de Uso</a>.</span></label>
                        </div>
                        <div className={`transition-all duration-300 ${!termsAccepted ? 'opacity-50 grayscale pointer-events-none filter blur-[2px]' : 'opacity-100'}`}>
                            <div className="w-[200px] h-[200px] mx-auto bg-white p-2 rounded-lg mb-4 relative"><img src={qrCodeUrl} alt="PIX QR Code" className="w-full h-full" />{!termsAccepted && <div className="absolute inset-0 bg-bg-card/80 flex items-center justify-center rounded"><span className="text-xs text-text font-bold px-2 text-center">Aceite os termos</span></div>}</div>
                            <button onClick={handleCopy} disabled={!termsAccepted} className="w-full bg-grad-violet hover:brightness-110 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-glow flex items-center justify-center transition-all transform hover:scale-[1.02]">{copied ? <CheckCircle className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}{copied ? 'Copiado!' : 'Copiar Código PIX'}</button>
                        </div>
                        {!termsAccepted && (<div className="mt-4 text-xs text-warning flex items-center justify-center animate-pulse"><FileText className="w-3 h-3 mr-1.5" />Aceite os termos para prosseguir.</div>)}
                    </>
                )}
                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] text-muted"><span>Venda por: <b className="text-gray-400">{sale.resellerName}</b></span><span>Ambiente Seguro 🔒</span></div>
            </div>
        </div>
    );
}
