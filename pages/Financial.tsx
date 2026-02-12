import React, { useState, useEffect } from 'react';
import { 
  Wallet, ShoppingBag, ArrowRightCircle, Package, 
  CreditCard, Settings, QrCode, CheckCircle, 
  Plus, Trash2, Save, AlertTriangle, 
  DollarSign, FileText, Upload, Image as ImageIcon, Link as LinkIcon, Tag, Zap, XCircle, ExternalLink
} from 'lucide-react';
import { GatewaySvc, CouponSvc, StoreSvc, PricingSvc } from '../services/financial';
import { Gateway, Coupon, StoreConfig, UserRole, PixConfig, RechargeRequest, FinancialConfig, Product, WithdrawalRequest, Transaction } from '../types';
import { Backend } from '../services/mockBackend';
import { FinancialRules, DateRules } from '../domain/rules.mock';
import { gerarPayloadPix } from '../services/utils/pixGenerator';

type Tab = 'wallet' | 'transactions' | 'buy_credits' | 'store_products' | 'my_store' | 'withdrawals' | 'recharges' | 'gateways' | 'coupons' | 'store_settings';

export default function Financial() {
  const [activeTab, setActiveTab] = useState<Tab>('wallet');
  const user = Backend.getCurrentUser();
  const isAdmin = user?.role === UserRole.ADMIN;
  
  // States
  const [balance, setBalance] = useState(0.0);
  const [credits, setCredits] = useState(0);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [rechargeRequests, setRechargeRequests] = useState<RechargeRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  
  // Pix Config State (Shared for Admin/Reseller Logic)
  const [pixConfig, setPixConfig] = useState<PixConfig>({ keyType: 'email', key: '', merchantName: '', merchantCity: '', isActive: false });
  const [pixPreviewPayload, setPixPreviewPayload] = useState(''); // State para o Preview

  const [storeConfig, setStoreConfig] = useState<StoreConfig>(StoreSvc.getConfig());
  const [finConfig, setFinConfig] = useState<FinancialConfig>(PricingSvc.getFinancialConfig());

  // Forms States
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [withdrawPixKey, setWithdrawPixKey] = useState('');
  const [withdrawPixType, setWithdrawPixType] = useState('cpf');
  
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ name: '', price: 0, stock: 999, imageUrl: '', active: true, category: 'Digital', description: '', deliveryContent: '' });
  const [newGateway, setNewGateway] = useState<Partial<Gateway>>({ name: '', type: 'mercadopago', publicKey: '', secretKey: '', isActive: true });
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({ code: '', type: 'percent', value: 10, usageLimit: 100, expiryDate: '', isActive: true });
  
  const [rechargeAmount, setRechargeAmount] = useState<number>(10);

  useEffect(() => {
    loadData();
    window.addEventListener('db_update', loadData);
    window.addEventListener('financial_update', loadData);
    return () => {
        window.removeEventListener('db_update', loadData);
        window.removeEventListener('financial_update', loadData);
    };
  }, []);

  // Effect para atualizar o QR Code de Preview sempre que a config mudar
  useEffect(() => {
      if (pixConfig.key && user) {
          try {
              const payload = gerarPayloadPix({
                  nome: pixConfig.merchantName || user.username,
                  chave: pixConfig.key,
                  valor: 15.00, // Valor exemplo para preview
                  cidade: pixConfig.merchantCity || 'BRASIL',
                  txid: 'PREVIEW'
              });
              setPixPreviewPayload(payload);
          } catch (e) {
              setPixPreviewPayload('');
          }
      } else {
          setPixPreviewPayload('');
      }
  }, [pixConfig, user]);

  const loadData = () => {
    setBalance(Backend.getUserBalance());
    setCredits(Backend.getUserCredits());
    setProducts(Backend.getProducts());
    setRechargeRequests(Backend.getRechargeRequests());
    
    // Carregar Configuração de Pix dependendo do Papel
    if (isAdmin) {
        setPixConfig(Backend.getPixConfig());
    } else if (user) {
        // Mapeia perfil do revendedor para estrutura de PixConfig
        const u = Backend.getCurrentUser() as any; // Refetch para garantir dados frescos
        if (u) {
            setPixConfig({
                key: u.pixKey || '',
                keyType: u.pixKeyType || 'email',
                merchantName: u.username, // Nome padrão
                merchantCity: 'BRASIL',   // Cidade padrão
                isActive: true
            });
        }
    }
    
    const txs = Backend.getTransactions(isAdmin ? undefined : user?.id);
    setTransactions(txs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    setGateways(GatewaySvc.getGateways());
    setCoupons(CouponSvc.getCoupons());
    setStoreConfig(StoreSvc.getConfig());
    setFinConfig(PricingSvc.getFinancialConfig());

    const allWithdrawals = Backend.getWithdrawals();
    setWithdrawals(isAdmin ? allWithdrawals : allWithdrawals.filter(w => w.userId === user?.id));
  };

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
      window.dispatchEvent(new CustomEvent('sys_toast', { detail: { message, type } }));
  };

  const handleRequestWithdrawal = async () => {
    if(!user) return;
    const result = await Backend.requestWithdrawal(user.id, withdrawAmount, withdrawPixKey, withdrawPixType);
    if(result.success) {
        triggerToast('✅ Saque solicitado com sucesso!', 'success');
        setWithdrawAmount(0);
        setWithdrawPixKey('');
        loadData();
    } else {
        triggerToast('❌ Erro: ' + result.message, 'error');
    }
  };

  const handleApproveWithdrawal = async (id: string) => {
      if(confirm('Confirmar transferência PIX realizada?')) {
          await Backend.approveWithdrawal(id);
          triggerToast('✅ Saque aprovado e registrado.', 'success');
          loadData();
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setNewProduct(prev => ({ ...prev, imageUrl: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveProduct = () => {
      if(!newProduct.name || !newProduct.price) return triggerToast('❌ Preencha nome e preço!', 'error');
      Backend.saveProduct({ ...newProduct, id: newProduct.id || Date.now().toString(), ownerId: 'admin', variations: [], reviews: [], salesCount: newProduct.salesCount || 0 } as Product);
      setNewProduct({ name: '', price: 0, stock: 999, imageUrl: '', active: true, category: 'Digital', description: '', deliveryContent: '' });
      triggerToast('💾 Produto Digital Salvo!', 'success');
      loadData();
  };

  const handleDeleteProduct = (id: string) => {
      if(window.confirm('Tem certeza que deseja excluir este produto?')) {
          Backend.deleteProduct(id);
          setTimeout(() => {
              loadData();
              triggerToast('🗑️ Produto excluído com sucesso!', 'success');
          }, 100);
      }
  };

  const handleSimulateSale = async (product: Product) => {
      if(!user) return;
      
      const customerWhatsapp = prompt(`Digite o WhatsApp do cliente para a entrega do produto "${product.name}":`);

      if (customerWhatsapp && customerWhatsapp.trim() !== '') {
        if(confirm(`Confirmar venda e envio para ${customerWhatsapp}?`)) {
            const res = await Backend.processStoreSale(user.id, product.id, customerWhatsapp);
            triggerToast(res.message, res.success ? 'success' : 'error');
            loadData();
        }
      } else {
          triggerToast('Venda cancelada. Número de WhatsApp não fornecido.', 'error');
      }
  };

  const handleSaveGateway = () => {
      GatewaySvc.saveGateway(newGateway as Gateway);
      setNewGateway({ name: '', type: 'mercadopago', publicKey: '', secretKey: '', isActive: true });
      triggerToast('✅ Gateway salvo com sucesso!', 'success');
      loadData();
  };
  const handleDeleteGateway = (id: string) => { GatewaySvc.deleteGateway(id); loadData(); triggerToast('🗑️ Gateway removido.', 'success'); };

  const handleSaveCoupon = () => {
      CouponSvc.saveCoupon(newCoupon as Coupon);
      setNewCoupon({ code: '', type: 'percent', value: 10, usageLimit: 100, expiryDate: '', isActive: true });
      triggerToast('🏷️ Cupom criado com sucesso!', 'success');
      loadData();
  };
  const handleDeleteCoupon = (id: string) => { CouponSvc.deleteCoupon(id); loadData(); triggerToast('🗑️ Cupom removido.', 'success'); };

  const handleRequestRechargePix = () => {
      // FIX: Ensure user is available before proceeding.
      if (!user) {
          triggerToast('Usuário não encontrado', 'error');
          return;
      }
      const creditsToReceive = FinancialRules.calculateCreditsFromAmount(rechargeAmount, finConfig.creditPrice);
      try {
          // FIX: Provide the missing 'resellerName' argument.
          Backend.generateRechargeRequest(rechargeAmount, creditsToReceive, user.username);
          triggerToast(`✅ Pedido de ${creditsToReceive} créditos gerado!`, 'success');
          loadData();
      } catch (e: any) { triggerToast(e.message, 'error'); }
  };

  const handleRequestRechargeBalance = async () => {
      if(!user) return;
      if(!confirm(`Deseja usar ${FinancialRules.formatBRL(rechargeAmount)} do seu saldo para comprar créditos?`)) return;
      
      const result = await Backend.buyCreditsWithBalance(user.id, rechargeAmount);
      if (result.success) {
          triggerToast(result.message, 'success');
          loadData();
      } else {
          triggerToast('❌ Erro: ' + result.message, 'error');
      }
  };

  const handleApproveRecharge = async (id: string) => {
      await Backend.approveRecharge(id);
      triggerToast('✅ Recarga Aprovada!', 'success');
      loadData();
  };

  const handleSaveStoreConfig = () => {
      StoreSvc.saveConfig(storeConfig);
      PricingSvc.saveFinancialConfig(finConfig);
      triggerToast('⚙️ Configurações da loja salvas!', 'success');
  };

  // --- LÓGICA DE SALVAMENTO DE PIX ---
  const handleSavePixConfig = () => {
      if (isAdmin) {
          Backend.savePixConfig(pixConfig);
          triggerToast('✅ Configuração Global de Pix Salva!');
      } else if (user) {
          // Salva no perfil do revendedor
          const success = Backend.updateUserProfile(user.id, {
              pixKey: pixConfig.key,
              pixKeyType: pixConfig.keyType
          });
          if (success) {
              triggerToast('✅ Sua Chave Pix foi salva!');
              // Dispara evento para que a tela ResellerSales saiba que a chave foi configurada
              window.dispatchEvent(new Event('db_update'));
          } else {
              triggerToast('❌ Erro ao salvar chave Pix', 'error');
          }
      }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-2xl font-bold text-white flex items-center">
             <DollarSign className="w-6 h-6 mr-2 text-green-500" />
             Painel Financeiro
          </h2>
          <div className="text-sm flex flex-col sm:flex-row w-full sm:w-auto">
             <span className="bg-gray-800 px-3 py-2 sm:py-1 rounded-t sm:rounded-l border-b sm:border-b-0 sm:border-r border-gray-700 text-gray-400 text-center sm:text-left">Saldo: <b className="text-green-400">{FinancialRules.formatBRL(balance)}</b></span>
             <span className="bg-gray-800 px-3 py-2 sm:py-1 rounded-b sm:rounded-r text-gray-400 text-center sm:text-left">Créditos: <b className="text-blue-400">{credits}</b></span>
          </div>
      </div>

      <div className="flex space-x-2 border-b border-gray-700 pb-1 overflow-x-auto select-none no-scrollbar">
          <button onClick={() => setActiveTab('wallet')} className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'wallet' ? 'border-green-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800/50'}`}>
              <Wallet className="w-4 h-4 mr-2" /> Carteira
          </button>
          
          <button onClick={() => setActiveTab('transactions')} className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'transactions' ? 'border-orange-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800/50'}`}>
              <FileText className="w-4 h-4 mr-2" /> Extrato
          </button>
          
          {/* BOTÃO GATEWAYS DISPONÍVEL PARA TODOS */}
          <button onClick={() => setActiveTab('gateways')} className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'gateways' ? 'border-cyan-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800/50'}`}>
                <CreditCard className="w-4 h-4 mr-2" /> Gateways
          </button>
          
          {!isAdmin && (
              <>
                <button onClick={() => setActiveTab('my_store')} className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'my_store' ? 'border-purple-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800/50'}`}>
                    <ShoppingBag className="w-4 h-4 mr-2" /> Loja
                </button>
                <button onClick={() => setActiveTab('buy_credits')} className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'buy_credits' ? 'border-blue-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800/50'}`}>
                    <Plus className="w-4 h-4 mr-2" /> Recarga
                </button>
              </>
          )}

          {isAdmin && (
              <>
                <button onClick={() => setActiveTab('recharges')} className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'recharges' ? 'border-yellow-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800/50'}`}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Pedidos
                </button>
                <button onClick={() => setActiveTab('withdrawals')} className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'withdrawals' ? 'border-red-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800/50'}`}>
                    <ArrowRightCircle className="w-4 h-4 mr-2" /> Saques
                </button>
                <button onClick={() => setActiveTab('store_products')} className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'store_products' ? 'border-blue-400 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800/50'}`}>
                    <Package className="w-4 h-4 mr-2" /> Produtos
                </button>
                <button onClick={() => setActiveTab('coupons')} className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'coupons' ? 'border-pink-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800/50'}`}>
                    <Tag className="w-4 h-4 mr-2" /> Cupons
                </button>
                <button onClick={() => setActiveTab('store_settings')} className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'store_settings' ? 'border-gray-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800/50'}`}>
                    <Settings className="w-4 h-4 mr-2" /> Config
                </button>
              </>
          )}
      </div>

      {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
               <div className="bg-gradient-to-br from-green-600 to-emerald-800 rounded-xl p-6 text-white relative shadow-lg overflow-hidden">
                   <div className="relative z-10">
                       <h3 className="opacity-90 text-sm font-bold uppercase mb-1">{isAdmin ? 'Faturamento Total (Loja)' : 'Saldo Disponível'}</h3>
                       <div className="text-4xl font-bold mb-4">{FinancialRules.formatBRL(balance)}</div>
                       <p className="text-xs opacity-75 max-w-[80%]">
                           {isAdmin 
                                ? 'Este valor representa o total de vendas processadas pela sua plataforma.' 
                                : 'Este valor provém das suas vendas na Loja Virtual. Solicite o saque a qualquer momento.'}
                       </p>
                   </div>
                   <Wallet className="absolute right-[-20px] bottom-[-20px] w-40 h-40 opacity-10" />
               </div>

               {!isAdmin && (
                   <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                       <h3 className="text-lg font-bold text-white mb-1">Solicitar Retirada</h3>
                       <p className="text-xs text-gray-500 mb-4">Saque mínimo: <span className="text-green-400 font-bold">R$ 15,00</span></p>
                       <div className="space-y-3">
                           <div className="grid grid-cols-2 gap-3">
                               <input type="number" placeholder="Valor R$" value={withdrawAmount} onChange={e => setWithdrawAmount(parseFloat(e.target.value))} className="bg-gray-900 border border-gray-600 rounded p-2 text-white w-full" />
                               <select value={withdrawPixType} onChange={e => setWithdrawPixType(e.target.value)} className="bg-gray-900 border border-gray-600 rounded p-2 text-white w-full">
                                   <option value="cpf">CPF</option><option value="email">Email</option><option value="phone">Telefone</option><option value="random">Aleatória</option>
                               </select>
                           </div>
                           <input type="text" placeholder="Chave PIX" value={withdrawPixKey} onChange={e => setWithdrawPixKey(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" />
                           <button onClick={handleRequestWithdrawal} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded shadow">Solicitar PIX</button>
                       </div>
                   </div>
               )}

               {isAdmin && (
                   <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col justify-center">
                       <h3 className="text-lg font-bold text-white mb-2">Painel do Administrador</h3>
                       <p className="text-sm text-gray-400">Como administrador, você gerencia os fundos diretamente pelos gateways de pagamento configurados. Utilize a aba <b>Gerir Saques</b> para processar as solicitações dos revendedores.</p>
                   </div>
               )}

               <div className="md:col-span-2 bg-gray-800 border border-gray-700 rounded-xl p-6">
                   <h3 className="text-lg font-bold text-white mb-4">Histórico de Saques {isAdmin ? '(Revendedores)' : '(Meus Saques)'}</h3>
                   <div className="overflow-x-auto">
                       <table className="w-full text-left text-sm text-gray-300 min-w-[500px]">
                           <thead className="text-xs uppercase bg-gray-900 text-gray-500"><tr><th className="p-3">Data</th><th className="p-3">Valor</th><th className="p-3">Chave</th><th className="p-3 text-right">Status</th></tr></thead>
                           <tbody className="divide-y divide-gray-700">
                               {withdrawals.map(w => (
                                   <tr key={w.id}>
                                       <td className="p-3">{DateRules.format(w.createdAt)}</td>
                                       <td className="p-3 text-white font-bold">{FinancialRules.formatBRL(w.amount)}</td>
                                       <td className="p-3 font-mono text-xs">{w.pixKey}</td>
                                       <td className="p-3 text-right">
                                           <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${FinancialRules.getStatusColor(w.status)}`}>{w.status}</span>
                                       </td>
                                   </tr>
                               ))}
                               {withdrawals.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">Sem saques registrados.</td></tr>}
                           </tbody>
                       </table>
                   </div>
               </div>
          </div>
      )}

      {activeTab === 'transactions' && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden animate-in fade-in">
              <h3 className="p-4 font-bold text-white border-b border-gray-700 bg-gray-800">Extrato Financeiro Completo</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300 min-w-[700px]">
                    <thead className="bg-gray-900 text-gray-500 text-xs uppercase">
                        <tr><th className="p-4">Data</th><th className="p-4">Descrição</th><th className="p-4">Tipo</th><th className="p-4">Status</th><th className="p-4 text-right">Valor</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {transactions.map(t => (
                            <tr key={t.id} className="hover:bg-gray-700/50">
                                <td className="p-4">{new Date(t.date).toLocaleString()}</td>
                                <td className="p-4 font-medium text-white">{t.description || 'Sem descrição'}</td>
                                <td className="p-4"><span className="text-xs px-2 py-1 rounded uppercase font-bold bg-gray-700 text-gray-300">{FinancialRules.getTypeLabel(t.type)}</span></td>
                                <td className="p-4"><span className={`text-xs px-2 py-1 rounded font-bold uppercase ${FinancialRules.getStatusColor(t.status)}`}>{t.status}</span></td>
                                <td className={`p-4 text-right font-bold ${t.type === 'withdrawal' || t.type === 'credit_purchase' ? 'text-red-400' : 'text-green-400'}`}>{t.type === 'withdrawal' || t.type === 'credit_purchase' ? '-' : '+'} {FinancialRules.formatBRL(t.amount)}</td>
                            </tr>
                        ))}
                        {transactions.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-500">Nenhuma transação registrada.</td></tr>}
                    </tbody>
                </table>
              </div>
          </div>
      )}

      {activeTab === 'my_store' && !isAdmin && (
           <div className="animate-in fade-in">
               <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-xl mb-6 flex items-start">
                   <AlertTriangle className="w-5 h-5 text-purple-400 mr-3 mt-0.5" />
                   <div><h4 className="text-purple-400 font-bold">Modo Revenda de Produtos</h4><p className="text-sm text-purple-200">Venda produtos digitais para seus clientes. O admin cuida da entrega, você recebe a comissão de {finConfig.adminStoreFeePercent}%.</p></div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {products.filter(p => p.active).map(product => {
                       const commission = FinancialRules.calculateCommission(product.price, finConfig.adminStoreFeePercent);
                       return (
                           <div key={product.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden group hover:border-blue-500/50 transition-all">
                               <div className="h-40 bg-gray-900 relative">
                                   <img src={product.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                   <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">Estoque: {product.stock}</span>
                               </div>
                               <div className="p-4">
                                   <h4 className="font-bold text-white text-lg">{product.name}</h4>
                                   <p className="text-xs text-gray-400 mb-3 line-clamp-2">{product.description}</p>
                                   <div className="flex justify-between items-end">
                                       <div><div className="text-xs text-gray-500">Preço Cliente</div><div className="text-xl font-bold text-green-400">{FinancialRules.formatBRL(product.price)}</div></div>
                                       <div className="text-right"><div className="text-xs text-gray-500">Sua Comissão</div><div className="text-sm font-bold text-blue-400">{FinancialRules.formatBRL(commission)}</div></div>
                                   </div>
                                   <button onClick={() => handleSimulateSale(product)} className="w-full mt-4 bg-gray-700 hover:bg-green-600 hover:text-white text-gray-300 py-2 rounded font-bold transition-colors flex justify-center items-center"><ShoppingBag className="w-4 h-4 mr-2" /> Vender Agora</button>
                               </div>
                           </div>
                       );
                   })}
               </div>
           </div>
      )}

      {activeTab === 'buy_credits' && !isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Comprar Créditos VPN</h3>
                  <div className="space-y-4">
                      <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
                          <div className="flex justify-between mb-2 text-sm text-gray-300">
                              <span>Valor Unitário</span>
                              <span className="font-bold text-white">{FinancialRules.formatBRL(finConfig.creditPrice)}</span>
                          </div>
                          <input type="range" min="10" max="500" step="10" value={rechargeAmount} onChange={e => setRechargeAmount(parseInt(e.target.value))} className="w-full accent-blue-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                          <div className="mt-4 text-center">
                              <span className="text-sm text-gray-400">Valor a Pagar:</span>
                              <div className="text-3xl font-bold text-green-400">{FinancialRules.formatBRL(rechargeAmount)}</div>
                              <span className="text-xs text-blue-300 font-bold bg-blue-900/50 px-2 py-1 rounded">
                                  Você recebe: {FinancialRules.calculateCreditsFromAmount(rechargeAmount, finConfig.creditPrice)} Créditos
                              </span>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                          <button onClick={handleRequestRechargeBalance} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg border border-gray-600 flex flex-col items-center justify-center">
                              <Wallet className="w-5 h-5 mb-1" />
                              <span>Usar Saldo</span>
                          </button>
                          <button onClick={handleRequestRechargePix} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex flex-col items-center justify-center shadow-lg">
                              <QrCode className="w-5 h-5 mb-1" />
                              <span>Pagar com Pix</span>
                          </button>
                      </div>
                  </div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Histórico de Pedidos</h3>
                  <div className="overflow-y-auto max-h-[300px] space-y-3">
                      {rechargeRequests.map(req => (
                          <div key={req.id} className="flex justify-between items-center p-3 bg-gray-900/50 rounded border border-gray-700">
                              <div>
                                  <div className="font-bold text-white">{FinancialRules.formatBRL(req.amount)}</div>
                                  <div className="text-xs text-gray-500">{DateRules.format(req.createdAt)}</div>
                              </div>
                              <div className="text-right">
                                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${FinancialRules.getStatusColor(req.status)}`}>{req.status}</span>
                                  {req.status === 'pending' && <div className="text-[10px] text-blue-400 mt-1 cursor-pointer hover:underline">Ver QR Code</div>}
                              </div>
                          </div>
                      ))}
                      {rechargeRequests.length === 0 && <p className="text-center text-gray-500 text-sm py-4">Nenhum pedido recente.</p>}
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'store_products' && isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 h-fit">
                  <h3 className="font-bold text-white mb-4">Adicionar Produto Digital</h3>
                  <div className="space-y-3">
                      <input type="text" placeholder="Nome do Produto" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" />
                      <div className="border border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-900 transition-colors relative">
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          {newProduct.imageUrl ? <img src={newProduct.imageUrl} alt="Preview" className="h-32 mx-auto object-contain rounded" /> : <div className="flex flex-col items-center justify-center text-gray-400"><Upload className="w-8 h-8 mb-2" /><span className="text-xs">Clique para enviar imagem</span></div>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                          <input type="number" placeholder="Preço R$" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" />
                          <input type="number" placeholder="Estoque" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" />
                      </div>
                      <textarea placeholder="Descrição do Produto" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white h-20" />
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center"><LinkIcon className="w-3 h-3 mr-1" /> Conteúdo de Entrega</label>
                        <textarea 
                            placeholder="Ex: Link de download, chave de licença..." 
                            value={newProduct.deliveryContent} 
                            onChange={e => setNewProduct({...newProduct, deliveryContent: e.target.value})}
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white h-20" 
                        />
                      </div>
                      <button onClick={handleSaveProduct} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded">Salvar Produto</button>
                  </div>
              </div>
              <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300 min-w-[600px]">
                        <thead className="bg-gray-900 text-gray-500 text-xs uppercase"><tr><th className="p-3">Imagem</th><th className="p-3">Produto</th><th className="p-3">Preço</th><th className="p-3">Estoque</th><th className="p-3 text-right">Ação</th></tr></thead>
                        <tbody className="divide-y divide-gray-700">
                            {products.map(p => (
                                <tr key={p.id}>
                                    <td className="p-3"><div className="w-10 h-10 bg-gray-900 rounded overflow-hidden">{p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 m-auto mt-2 text-gray-500"/>}</div></td>
                                    <td className="p-3 font-bold text-white">{p.name}</td>
                                    <td className="p-3 text-green-400">{FinancialRules.formatBRL(p.price)}</td>
                                    <td className="p-3">{p.stock}</td>
                                    <td className="p-3 text-right"><button onClick={() => handleDeleteProduct(p.id)} className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
              </div>
          </div>
      )}
      
      {activeTab === 'gateways' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
              {/* CONFIGURAÇÃO PIX (Comum a Admin e Revendedor) */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 h-fit relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><QrCode className="w-32 h-32 text-green-500"/></div>
                  <h3 className="font-bold text-white mb-4 text-lg flex items-center relative z-10">
                      <QrCode className="w-5 h-5 mr-2 text-green-500"/> 
                      Configuração Pix (Recebimento)
                  </h3>
                  <div className="space-y-4 relative z-10">
                      <p className="text-xs text-gray-400 mb-2">
                          {isAdmin 
                            ? 'Configure a chave PIX principal do sistema para receber pagamentos de créditos.' 
                            : 'Configure sua chave PIX pessoal para receber pagamentos dos seus clientes via "Gerar Venda".'}
                      </p>

                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1">Chave Pix</label>
                          <input type="text" placeholder="Ex: email@pix.com ou 12345678900" value={pixConfig.key} onChange={e => setPixConfig({...pixConfig, key: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded p-2.5 text-white" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Chave</label>
                              <select value={pixConfig.keyType} onChange={e => setPixConfig({...pixConfig, keyType: e.target.value as any})} className="w-full bg-gray-900 border border-gray-600 rounded p-2.5 text-white">
                                  <option value="cpf">CPF / CNPJ</option>
                                  <option value="email">E-mail</option>
                                  <option value="phone">Telefone</option>
                                  <option value="random">Aleatória</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase mb-1">Cidade</label>
                              <input type="text" value={pixConfig.merchantCity} onChange={e => setPixConfig({...pixConfig, merchantCity: e.target.value.toUpperCase()})} className="w-full bg-gray-900 border border-gray-600 rounded p-2.5 text-white uppercase" />
                          </div>
                      </div>
                      
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1">Nome Beneficiário</label>
                          <input type="text" value={pixConfig.merchantName} onChange={e => setPixConfig({...pixConfig, merchantName: e.target.value.toUpperCase()})} className="w-full bg-gray-900 border border-gray-600 rounded p-2.5 text-white uppercase" />
                      </div>

                      {/* CARD PREVIEW */}
                      <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-4 flex items-center mt-2">
                          {pixPreviewPayload ? (
                              <>
                                <div className="bg-white p-1 rounded mr-4 shrink-0">
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(pixPreviewPayload)}`} alt="Preview" className="w-20 h-20" />
                                </div>
                                <div>
                                    <div className="text-xs text-green-400 font-bold uppercase mb-1">Pré-visualização do Cliente</div>
                                    <p className="text-xs text-gray-400 mb-2">Assim será gerado o QR Code para seus clientes.</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] bg-gray-800 px-2 py-1 rounded text-gray-300 font-mono truncate max-w-[150px]">{pixPreviewPayload}</span>
                                    </div>
                                </div>
                              </>
                          ) : (
                              <div className="w-full text-center py-4 text-xs text-gray-500">
                                  Preencha a chave para ver o preview.
                              </div>
                          )}
                      </div>

                      <button onClick={handleSavePixConfig} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-lg mt-2">
                          Salvar Dados Pix
                      </button>
                  </div>
              </div>

              {/* API GATEWAYS (ADMIN ONLY) */}
              {isAdmin && (
                  <div className="space-y-6">
                      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 h-fit">
                          <h3 className="font-bold text-white mb-4 text-lg flex items-center"><CreditCard className="w-5 h-5 mr-2 text-blue-500"/> Gateways de Pagamento (APIs)</h3>
                          <div className="space-y-3">
                              <input type="text" placeholder="Nome (Ex: MercadoPago)" value={newGateway.name} onChange={e => setNewGateway({...newGateway, name: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" />
                              <select value={newGateway.type} onChange={e => setNewGateway({...newGateway, type: e.target.value as any})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"><option value="mercadopago">MercadoPago</option><option value="stripe">Stripe</option><option value="stone">Stone</option></select>
                              <input type="text" placeholder="Public Key" value={newGateway.publicKey} onChange={e => setNewGateway({...newGateway, publicKey: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" />
                              <input type="text" placeholder="Secret Key" value={newGateway.secretKey} onChange={e => setNewGateway({...newGateway, secretKey: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" />
                              <button onClick={handleSaveGateway} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded">Adicionar Gateway</button>
                          </div>
                      </div>
                      <div className="space-y-3">
                          <h4 className="text-xs font-bold text-gray-500 uppercase px-1">Gateways Configurados</h4>
                          {gateways.length === 0 && <p className="text-sm text-gray-500 px-1">Nenhum gateway externo configurado.</p>}
                          {gateways.map(gw => (
                              <div key={gw.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex justify-between items-center"><div className="flex items-center"><div className={`w-3 h-3 rounded-full mr-3 ${gw.isActive ? 'bg-green-500' : 'bg-gray-500'}`}></div><div><h4 className="font-bold text-white">{gw.name}</h4><div className="text-xs text-gray-400 uppercase">{gw.type}</div></div></div><button onClick={() => handleDeleteGateway(gw.id)} className="text-red-400 p-2 hover:bg-red-900/20 rounded"><Trash2 className="w-4 h-4" /></button></div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      )}

      {activeTab === 'recharges' && isAdmin && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden animate-in fade-in">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center"><h3 className="font-bold text-white">Pedidos de Recarga (Revendedores)</h3></div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-300 min-w-[700px]">
                      <thead className="bg-gray-900 text-gray-500 text-xs uppercase"><tr><th className="p-3">Data</th><th className="p-3">Revendedor</th><th className="p-3">Valor</th><th className="p-3">Créditos</th><th className="p-3">Status</th><th className="p-3 text-right">Ação</th></tr></thead>
                      <tbody className="divide-y divide-gray-700">
                          {rechargeRequests.map(req => (
                              <tr key={req.id}>
                                  <td className="p-3">{DateRules.format(req.createdAt)}</td>
                                  <td className="p-3 font-bold text-white">{req.resellerName}</td>
                                  <td className="p-3">{FinancialRules.formatBRL(req.amount)}</td>
                                  <td className="p-3 text-blue-400 font-bold">+{req.credits}</td>
                                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded uppercase ${FinancialRules.getStatusColor(req.status)}`}>{req.status}</span></td>
                                  <td className="p-3 text-right">
                                      {req.status === 'pending' && <button onClick={() => handleApproveRecharge(req.id)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-bold">Aprovar</button>}
                                  </td>
                              </tr>
                          ))}
                          {rechargeRequests.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-gray-500">Nenhum pedido pendente.</td></tr>}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {activeTab === 'withdrawals' && isAdmin && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden animate-in fade-in">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center"><h3 className="font-bold text-white">Gerenciar Solicitações de Saque</h3></div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-300 min-w-[700px]">
                      <thead className="bg-gray-900 text-gray-500 text-xs uppercase"><tr><th className="p-3">Data</th><th className="p-3">Usuário</th><th className="p-3">Valor</th><th className="p-3">Chave Pix</th><th className="p-3">Status</th><th className="p-3 text-right">Ação</th></tr></thead>
                      <tbody className="divide-y divide-gray-700">
                          {withdrawals.map(w => (
                              <tr key={w.id}>
                                  <td className="p-3">{DateRules.format(w.createdAt)}</td>
                                  <td className="p-3 font-bold text-white">{w.username}</td>
                                  <td className="p-3">{FinancialRules.formatBRL(w.amount)}</td>
                                  <td className="p-3 font-mono text-xs"><span className="text-gray-500 mr-1 uppercase">{w.pixKeyType}:</span>{w.pixKey}</td>
                                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded uppercase ${FinancialRules.getStatusColor(w.status)}`}>{w.status}</span></td>
                                  <td className="p-3 text-right">
                                      {w.status === 'pending' && <button onClick={() => handleApproveWithdrawal(w.id)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-bold">Realizar Pagamento</button>}
                                  </td>
                              </tr>
                          ))}
                          {withdrawals.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-gray-500">Nenhum pedido de saque.</td></tr>}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {activeTab === 'coupons' && isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 h-fit">
                  <h3 className="font-bold text-white mb-4">Criar Cupom de Desconto</h3>
                  <div className="space-y-3">
                      <input type="text" placeholder="Código (Ex: WELCOME10)" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white uppercase font-bold tracking-wider" />
                      <div className="grid grid-cols-2 gap-3">
                          <select value={newCoupon.type} onChange={e => setNewCoupon({...newCoupon, type: e.target.value as any})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white">
                              <option value="percent">% Porcentagem</option>
                              <option value="fixed">R$ Fixo</option>
                          </select>
                          <input type="number" placeholder="Valor" value={newCoupon.value} onChange={e => setNewCoupon({...newCoupon, value: parseFloat(e.target.value)})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" />
                      </div>
                      <input type="number" placeholder="Limite de Uso" value={newCoupon.usageLimit} onChange={e => setNewCoupon({...newCoupon, usageLimit: parseInt(e.target.value)})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" />
                      <button onClick={handleSaveCoupon} className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 rounded shadow-lg">Criar Cupom</button>
                  </div>
              </div>
              <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300 min-w-[600px]">
                        <thead className="bg-gray-900 text-gray-500 text-xs uppercase"><tr><th className="p-3">Código</th><th className="p-3">Desconto</th><th className="p-3">Usos</th><th className="p-3 text-right">Ação</th></tr></thead>
                        <tbody className="divide-y divide-gray-700">
                            {coupons.map(c => (
                                <tr key={c.id}>
                                    <td className="p-3 font-bold text-white tracking-wider">{c.code}</td>
                                    <td className="p-3 text-green-400 font-bold">{c.type === 'percent' ? `${c.value}%` : `R$ ${c.value}`}</td>
                                    <td className="p-3">{c.usedCount} / {c.usageLimit}</td>
                                    <td className="p-3 text-right"><button onClick={() => handleDeleteCoupon(c.id)} className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                                </tr>
                            ))}
                            {coupons.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-500">Nenhum cupom ativo.</td></tr>}
                        </tbody>
                    </table>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'store_settings' && isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <h3 className="font-bold text-white mb-4 flex items-center"><ShoppingBag className="w-5 h-5 mr-2 text-blue-500"/> Configurações da Loja</h3>
                  <div className="space-y-4">
                      <div><label className="text-xs font-bold text-gray-500 uppercase mb-1">Nome da Loja</label><input type="text" value={storeConfig.storeName} onChange={e => setStoreConfig({...storeConfig, storeName: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" /></div>
                      <div><label className="text-xs font-bold text-gray-500 uppercase mb-1">Slug (URL)</label><input type="text" value={storeConfig.storeSlug} onChange={e => setStoreConfig({...storeConfig, storeSlug: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" /></div>
                      <div><label className="text-xs font-bold text-gray-500 uppercase mb-1">WhatsApp de Suporte</label><input type="text" value={storeConfig.whatsapp} onChange={e => setStoreConfig({...storeConfig, whatsapp: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" /></div>
                      <button onClick={handleSaveStoreConfig} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded shadow">Salvar Loja</button>
                  </div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <h3 className="font-bold text-white mb-4 flex items-center"><DollarSign className="w-5 h-5 mr-2 text-green-500"/> Financeiro Global</h3>
                  <div className="space-y-4">
                      <div><label className="text-xs font-bold text-gray-500 uppercase mb-1">Preço do Crédito (R$)</label><input type="number" step="0.50" value={finConfig.creditPrice} onChange={e => setFinConfig({...finConfig, creditPrice: parseFloat(e.target.value)})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white font-bold text-lg" /></div>
                      <div><label className="text-xs font-bold text-gray-500 uppercase mb-1">Taxa Admin na Loja (%)</label><input type="number" step="0.1" value={finConfig.adminStoreFeePercent} onChange={e => setFinConfig({...finConfig, adminStoreFeePercent: parseFloat(e.target.value)})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" /></div>
                      <div><label className="text-xs font-bold text-gray-500 uppercase mb-1">Recarga Mínima (R$)</label><input type="number" value={finConfig.minRechargeAmount} onChange={e => setFinConfig({...finConfig, minRechargeAmount: parseFloat(e.target.value)})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" /></div>
                      <button onClick={handleSaveStoreConfig} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded shadow">Atualizar Taxas</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}