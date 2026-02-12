import { 
  Client, User, UserRole, Transaction, Stats, AppPayload, AppProxy, AppConfig,
  Reseller, Server, Product, PixConfig, RechargeRequest, WithdrawalRequest,
  TestAccount, Log, Notification, RemarketingConfig, ResellerSale, WhatsappInstance,
  AffiliateConfig, AffiliateRelationship, CommissionLog, ChatbotConfig, ChatbotSession,
  ResellerApplication, RemarketingEvent
} from '../types';
import { MOCK_CLIENTS, MOCK_RESELLERS, MOCK_SERVERS, MOCK_TESTS, MOCK_LOGS, MOCK_USER } from './mockData';
import { MockEnv } from '../config/mockEnv';
import { WhatsappProvider } from './remarketing/providers/whatsappProvider';
import { apiRequest } from './api';
// FIX: Import FinancialRules to resolve missing name error.
import { FinancialRules } from '../domain/rules.mock';
import { PricingSvc } from './financial';

// CONTROLE DE AMBIENTE HÍBRIDO
const USE_REAL_API = (import.meta as any).env?.VITE_USE_REAL_API === 'true';

class BackendService {
    
    private whatsappProvider = new WhatsappProvider();
    private fetchDebounce: Record<string, number> = {};
    
    // SEMÁFORO DE MUTAÇÃO (Race Condition Fix)
    // Impede que o syncData sobrescreva o cache enquanto o usuário está editando/criando algo
    private _isMutating = false;

    constructor() {
        this.initMockData();
    }

    /**
     * Wrapper para operações de escrita.
     * Pausa a sincronização automática temporariamente para proteger atualizações otimistas.
     */
    private async withMutation<T>(operation: () => Promise<T>): Promise<T> {
        this._isMutating = true;
        try {
            return await operation();
        } finally {
            // Mantém o bloqueio por um breve período extra para garantir que
            // a replicação do banco real tenha tempo de acontecer antes do próximo sync
            setTimeout(() => { this._isMutating = false; }, 2000);
        }
    }

    // --- DATA SYNC ENGINE (REAL MODE) ---
    // Atualiza o cache local com dados da API Real em background
    private async syncData(cacheKey: string, endpoint: string) {
        // Se não usar API real OU se estiver ocorrendo uma mutação local, aborta o sync
        if (!USE_REAL_API || this._isMutating) return;

        const now = Date.now();
        // Throttle de 5 segundos para evitar flood de requests em re-renders
        if (this.fetchDebounce[cacheKey] && (now - this.fetchDebounce[cacheKey] < 5000)) return;
        this.fetchDebounce[cacheKey] = now;

        try {
            const remoteData = await apiRequest(endpoint);
            const currentStr = localStorage.getItem(cacheKey);
            const freshStr = JSON.stringify(remoteData);
            
            // Smart Check: Só atualiza se a string JSON for realmente diferente
            // Isso evita disparar 'db_update' e re-renderizar componentes sem necessidade
            if (currentStr !== freshStr) {
                localStorage.setItem(cacheKey, freshStr);
                window.dispatchEvent(new Event('db_update'));
                // console.log(`[SYNC] ${cacheKey} atualizado via API Real.`);
            }
        } catch (e) {
            console.warn(`[SYNC] Falha ao sincronizar ${cacheKey}:`, e);
        }
    }

    private initMockData() {
        if (!localStorage.getItem('cache_clients')) {
            const clientsWithStreak = MOCK_CLIENTS.map(c => ({...c, renewalStreak: c.renewalStreak || 0 }));
            localStorage.setItem('cache_clients', JSON.stringify(clientsWithStreak));
        }
        if (!localStorage.getItem('cache_resellers')) {
            localStorage.setItem('cache_resellers', JSON.stringify(MOCK_RESELLERS));
        }
        if (!localStorage.getItem('cache_reseller_sales')) {
            localStorage.setItem('cache_reseller_sales', JSON.stringify([]));
        }
        if (!localStorage.getItem('wa_session_status')) {
            localStorage.setItem('wa_session_status', 'DISCONNECTED');
        }
        if (!localStorage.getItem('cache_logs')) {
            localStorage.setItem('cache_logs', JSON.stringify(MOCK_LOGS));
        }
         if (!localStorage.getItem('cache_notifications')) {
            localStorage.setItem('cache_notifications', JSON.stringify([]));
        }
        if (!localStorage.getItem('cache_reseller_applications')) {
            localStorage.setItem('cache_reseller_applications', JSON.stringify([]));
        }
        if (!localStorage.getItem('cache_products')) { 
            localStorage.setItem('cache_products', JSON.stringify([])); 
        }

        if (!localStorage.getItem('cache_whatsapp_instances')) {
            const MOCK_WA_INSTANCES: WhatsappInstance[] = [
                { id: '1', name: 'Principal', instanceId: 'wa_main', apiToken: 'token_1', apiUrl: 'http://localhost:8080', status: 'CONNECTED', priority: 1, isDefault: true },
                { id: '2', name: 'Backup Falha', instanceId: 'wa_backup_fail', apiToken: 'fail', apiUrl: 'http://localhost:8081', status: 'CONNECTED', priority: 2, isDefault: false },
                { id: '3', name: 'Secundária', instanceId: 'wa_secondary', apiToken: 'token_3', apiUrl: 'http://localhost:8082', status: 'DISCONNECTED', priority: 3, isDefault: false },
            ];
            localStorage.setItem('cache_whatsapp_instances', JSON.stringify(MOCK_WA_INSTANCES));
        }
        
        if (!localStorage.getItem('affiliate_config')) {
            const defaultConfig: AffiliateConfig = {
                enabled: true,
                levels: 2,
                commissionType: 'credits',
                levelPercentage: [10, 5]
            };
            localStorage.setItem('affiliate_config', JSON.stringify(defaultConfig));
        }
        if (!localStorage.getItem('affiliate_relationships')) {
            localStorage.setItem('affiliate_relationships', JSON.stringify([]));
        }
        if (!localStorage.getItem('affiliate_ledger')) {
            localStorage.setItem('affiliate_ledger', JSON.stringify([]));
        }

        if (!localStorage.getItem('chatbot_config')) {
            const defaultChatbot: ChatbotConfig = {
                flows: {
                    testFlow: {
                        active: true,
                        keywords: ['teste', 'testar', 'gratis'],
                        messages: { askOperator: 'Olá! Para gerar seu teste, por favor escolha a operadora:\n1. Vivo\n2. Tim\n3. Claro', success: '✅ Teste Gerado!\n\nLogin: {{login}}\nSenha: {{password}}\nValidade: {{expiry}}\n\nBaixe o app: link.com/app', error: 'Desculpe, não consegui gerar o teste. Tente novamente mais tarde.' },
                        duration: 60,
                        defaultPassword: '12345'
                    },
                    userFlow: {
                        active: true,
                        keywords: ['criar conta', 'comprar', 'acesso'],
                        messages: { askName: 'Vamos criar seu acesso! Primeiro, qual seu nome?', askOperator: 'Ótimo {{name}}. Qual a operadora? (Vivo, Tim, Claro)', askPlan: 'Qual plano deseja? (Mensal, Trimestral)', success: '🎉 Conta Criada!\n\nLogin: {{login}}\nSenha: {{password}}\nValidade: {{expiry}}'},
                        defaultPassword: '10203'
                    }
                },
                customRules: [
                    { id: '1', keywords: ['pix', 'pagamento'], response: 'Nossa chave PIX é: email@pix.com', isActive: true },
                    { id: '2', keywords: ['app', 'baixar'], response: 'Baixe aqui: http://loja.com/app', isActive: true }
                ]
            };
            localStorage.setItem('chatbot_config', JSON.stringify(defaultChatbot));
        }
        if (!localStorage.getItem('chatbot_sessions')) {
            localStorage.setItem('chatbot_sessions', JSON.stringify({}));
        }
        if (!localStorage.getItem('cache_app_payloads')) {
            localStorage.setItem('cache_app_payloads', JSON.stringify([]));
        }
        if (!localStorage.getItem('cache_app_proxies')) {
            localStorage.setItem('cache_app_proxies', JSON.stringify([]));
        }
        if (!localStorage.getItem('cache_app_config')) {
            localStorage.setItem('cache_app_config', JSON.stringify({ updateUrl: '', updateMessage: '', maintenanceMode: false }));
        }
         // --- NOVO: RECARGAS E PIX CONFIG ---
        if (!localStorage.getItem('cache_recharge_requests')) {
            localStorage.setItem('cache_recharge_requests', JSON.stringify([]));
        }
        if (!localStorage.getItem('cache_pix_config')) {
            const MOCK_PIX_CONFIG: PixConfig = {
                key: 'seu.email@pix.com',
                keyType: 'email',
                merchantName: 'Admin do Painel',
                merchantCity: 'SAO PAULO',
                isActive: true
            };
            localStorage.setItem('cache_pix_config', JSON.stringify(MOCK_PIX_CONFIG));
        }
    }

    // --- AUTH ---
    public async login(login: string, pass: string): Promise<User | null> {
        // MODO REAL: Chama API
        if (USE_REAL_API) {
            try {
                const response = await apiRequest('/login', 'POST', { username: login, password: pass });
                if (response.success && response.user) {
                    localStorage.setItem('token', response.accessToken);
                    localStorage.setItem('vpn_current_user', JSON.stringify(response.user));
                    
                    this.syncData('cache_clients', '/clients');
                    this.syncData('cache_resellers', '/resellers');
                    
                    return response.user;
                }
                return null;
            } catch (e) {
                console.error("Erro no login real:", e);
                throw e; 
            }
        }

        // MODO MOCK (Fallback Seguro)
        try {
            if (MockEnv.BLOCK_EXTERNAL_CONNECTIONS) {
                if (login === MockEnv.MOCK_AUTH_USER && pass === MockEnv.MOCK_AUTH_PASS) {
                    const mockUser = { ...MOCK_USER, username: MockEnv.MOCK_AUTH_USER };
                    localStorage.setItem('vpn_current_user', JSON.stringify(mockUser));
                    return mockUser;
                }
                if (login === 'reseller' && pass === 'reseller') {
                    const resellerUser = {
                        id: 'revendedor_mock_id',
                        username: 'Revendedor Teste', role: UserRole.RESELLER, category: 'PREMIUM',
                        expiration: 'Vitalício', revenueType: 'Revendedor', pixKey: 'mock.pix@key.com',
                        pixKeyType: 'email', credits: 100, balance: 50.0
                    };
                    localStorage.setItem('vpn_current_user', JSON.stringify(resellerUser));
                    return resellerUser;
                }
                if (login === 'revendedor' && pass === 'revendedor') {
                    const resellerUser: User = {
                        id: '3',
                        username: 'revendedor_teste',
                        role: UserRole.RESELLER,
                        category: 'PREMIUM',
                        expiration: '31/12/2025',
                        revenueType: 'Revendedor',
                        avatar: 'https://ui-avatars.com/api/?name=RT&background=ec4899&color=fff',
                        credits: 100,
                        balance: 75.0,
                        canUseN8n: true,
                    };
                    localStorage.setItem('vpn_current_user', JSON.stringify(resellerUser));
                    return resellerUser;
                }
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    public getCurrentUser(): User | null {
        const stored = localStorage.getItem('vpn_current_user');
        return stored ? JSON.parse(stored) : null; 
    }

    public logout() {
        localStorage.removeItem('vpn_current_user');
        localStorage.removeItem('token');
        localStorage.removeItem('vpn_impersonator');
        if (USE_REAL_API) apiRequest('/logout', 'POST').catch(() => {});
    }

    public updateUserProfile(id: string, data: any): boolean {
        const user = this.getCurrentUser();
        if(user && user.id === id) {
            const updated = { ...user, ...data };
            localStorage.setItem('vpn_current_user', JSON.stringify(updated));
            return true;
        }
        return false;
    }
    
    // --- IMPERSONATION ---
    public impersonateUser(targetResellerId: string): boolean {
        const adminUser = this.getCurrentUser();
        if (!adminUser || adminUser.role !== UserRole.ADMIN) return false;

        const targetReseller = this.getResellers().find(r => r.id === targetResellerId);
        if (!targetReseller) return false;
        
        localStorage.setItem('vpn_impersonator', JSON.stringify(adminUser));

        const resellerUser: User = {
            id: targetReseller.id,
            username: targetReseller.name,
            role: UserRole.RESELLER,
            category: targetReseller.category,
            expiration: targetReseller.validity,
            revenueType: 'Revendedor',
            credits: targetReseller.credits,
            balance: targetReseller.balance,
            canUseN8n: targetReseller.canUseN8n,
            avatar: `https://ui-avatars.com/api/?name=${targetReseller.name.charAt(0)}&background=eab308&color=fff`
        };

        localStorage.setItem('vpn_current_user', JSON.stringify(resellerUser));
        return true;
    }

    public stopImpersonation(): boolean {
        const adminUser = localStorage.getItem('vpn_impersonator');
        if (!adminUser) return false;

        localStorage.setItem('vpn_current_user', adminUser);
        localStorage.removeItem('vpn_impersonator');
        return true;
    }

    // --- CLIENTS ---
    public getClients(): Client[] { 
        if (USE_REAL_API) this.syncData('cache_clients', '/clients');
        const allClients: Client[] = JSON.parse(localStorage.getItem('cache_clients') || '[]');
        
        const currentUser = this.getCurrentUser();
        if (!currentUser) return [];

        if (currentUser.role === UserRole.ADMIN) {
            return allClients;
        } else {
            return allClients.filter(c => c.resellerId === currentUser.id);
        }
    }

    public async createClient(data: any): Promise<{ success: boolean, message?: string, error?: string, client?: Client }> {
        return this.withMutation(async () => {
            const owner = this.getCurrentUser();
            if (!owner) return { success: false, error: 'Usuário não autenticado.' };

            try {
                 const clients = JSON.parse(localStorage.getItem('cache_clients') || '[]');
                 const newClient: Client = { 
                    id: Date.now().toString(),
                    login: data.login,
                    password: data.password,
                    expiryDate: new Date(Date.now() + (data.isTest ? data.days * 60 * 1000 : data.days * 86400000)).toISOString(),
                    status: data.isTest ? 'test' : 'active', 
                    connections: 0, 
                    renewalStreak: 0,
                    planId: 'mock-plan',
                    planName: data.days === 30 ? 'Mensal' : 'Personalizado',
                    isOnline: false,
                    limit: data.limit,
                    isV2Ray: data.isV2Ray,
                    v2rayString: data.isV2Ray ? `vless://${Date.now().toString()}@mock.server:443?security=tls&sni=mock.server#${data.login}` : undefined,
                    whatsapp: data.whatsapp,
                    email: data.email,
                    resellerId: owner.id,
                };
                clients.push(newClient);
                localStorage.setItem('cache_clients', JSON.stringify(clients));
                return { success: true, client: newClient };
            } catch(e: any) {
                return { success: false, error: 'Erro no Mock' };
            }
        });
    }

    public async updateClient(id: string, data: Partial<Client>): Promise<{ success: boolean, message?: string }> {
         return this.withMutation(async () => {
             const clients = JSON.parse(localStorage.getItem('cache_clients') || '[]');
             const idx = clients.findIndex(c => c.id === id);
             if (idx >= 0) {
                 clients[idx] = { ...clients[idx], ...data };
                 localStorage.setItem('cache_clients', JSON.stringify(clients));
                 return { success: true };
             }
             return { success: false, message: 'Client not found' };
         });
    }

    public async renewClient(id: string, days: number): Promise<boolean> {
        return this.withMutation(async () => {
            const clients = JSON.parse(localStorage.getItem('cache_clients') || '[]');
            const idx = clients.findIndex(c => c.id === id);
            if (idx >= 0) {
                const client = clients[idx];
                const current = new Date(client.expiryDate);
                const now = new Date();

                client.renewalStreak = current > now ? (client.renewalStreak || 0) + 1 : 1;
                const base = current > now ? current : now;
                base.setDate(base.getDate() + days);
                client.expiryDate = base.toISOString();
                client.status = 'active';

                localStorage.setItem('cache_clients', JSON.stringify(clients));
                return true;
            }
            return false;
        });
    }

    public async deleteClient(id: string): Promise<boolean> {
        return this.withMutation(async () => {
            let data = JSON.parse(localStorage.getItem('cache_clients') || '[]');
            data = data.filter((c: Client) => c.id !== id);
            localStorage.setItem('cache_clients', JSON.stringify(data));
            return true;
        });
    }

    // --- TESTS ---
    public getTests(): TestAccount[] { 
        const allClients: Client[] = JSON.parse(localStorage.getItem('cache_clients') || '[]');
        const currentUser = this.getCurrentUser();
        
        let relevantClients = allClients;
        if (currentUser && currentUser.role === UserRole.RESELLER) {
            relevantClients = allClients.filter(c => c.resellerId === currentUser.id);
        }

        return relevantClients
            .filter(c => c.status === 'test' || c.login.startsWith('teste_'))
            .map(c => ({
                id: c.id,
                login: c.login,
                password: c.password,
                createdAt: c.lastOnline || new Date(new Date(c.expiryDate).getTime() - 60*60*1000).toISOString(),
                expiresAt: c.expiryDate,
                status: new Date(c.expiryDate) < new Date() ? 'expired' : 'active',
                isV2Ray: c.isV2Ray
            }));
    }
    public getNextTestLogin(): string { return `teste_${Math.floor(Date.now() / 1000)}`; }

    // --- RESELLERS ---
    public getResellers(): Reseller[] { 
        if (USE_REAL_API) this.syncData('cache_resellers', '/resellers');
        return JSON.parse(localStorage.getItem('cache_resellers') || '[]'); 
    }
    
    public async createReseller(data: any): Promise<{ success: boolean; message?: string }> {
        return this.withMutation(async () => {
            const resellers = this.getResellers();
            resellers.push({...data, name: data.username, id: Date.now().toString(), role: 'reseller', status: 'active', activeClients: 0, validity: 'N/A' });
            localStorage.setItem('cache_resellers', JSON.stringify(resellers));
            return { success: true }; 
        });
    }

    public async addCreditsToReseller(id: string, amount: number) {
        return this.withMutation(async () => {
            const currentUser = this.getCurrentUser();
            if(currentUser && (currentUser.id === id || (currentUser.role === 'admin' && (id === '1' || id ==='admin_simulacao')))) {
                currentUser.credits = (currentUser.credits || 0) + amount;
                localStorage.setItem('vpn_current_user', JSON.stringify(currentUser));
                window.dispatchEvent(new Event('financial_update'));
            }
            
            const resellers = this.getResellers();
            const idx = resellers.findIndex(r => r.id === id);
            if (idx >= 0) {
                resellers[idx].credits = (resellers[idx].credits || 0) + amount;
                localStorage.setItem('cache_resellers', JSON.stringify(resellers));
                window.dispatchEvent(new Event('db_update'));
                return { success: true };
            }
            return { success: false, message: 'Revendedor não encontrado' }; 
        });
    }
    public async deleteReseller(id: string) { return true; }
    public async updateReseller(id: string, data: any): Promise<{ success: boolean; message?: string }> { return { success: true }; } 

    // --- RESELLER APPLICATIONS ---
    public getResellerApplications(): ResellerApplication[] {
        return JSON.parse(localStorage.getItem('cache_reseller_applications') || '[]');
    }

    public async submitResellerApplication(data: { name: string, whatsapp: string, experience: string, referrerId: string }): Promise<{ success: boolean, message: string }> {
        const apps = this.getResellerApplications();
        const resellers = this.getResellers();
        const referrer = resellers.find(r => r.id === data.referrerId) || { name: 'Admin/Desconhecido' };

        const newApp: ResellerApplication = {
            id: Date.now().toString(),
            name: data.name,
            whatsapp: data.whatsapp,
            experience: data.experience,
            referrerId: data.referrerId,
            referrerName: referrer.name,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        apps.unshift(newApp);
        localStorage.setItem('cache_reseller_applications', JSON.stringify(apps));

        const notifs = JSON.parse(localStorage.getItem('cache_notifications') || '[]');
        notifs.unshift({
            id: Date.now().toString(),
            userId: '1',
            title: 'Nova Solicitação de Revenda',
            message: `${data.name} solicitou cadastro. Indicado por: ${referrer.name}`,
            type: 'info',
            read: false,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('cache_notifications', JSON.stringify(notifs));
        window.dispatchEvent(new Event('db_update'));

        return { success: true, message: 'Solicitação enviada com sucesso! Aguarde o contato do administrador.' };
    }

    public async processResellerApplication(appId: string, action: 'approved' | 'rejected'): Promise<{ success: boolean }> {
        const apps = this.getResellerApplications();
        const idx = apps.findIndex(a => a.id === appId);
        if (idx >= 0) {
            apps[idx].status = action;
            localStorage.setItem('cache_reseller_applications', JSON.stringify(apps));
            window.dispatchEvent(new Event('db_update'));
            return { success: true };
        }
        return { success: false };
    }

    // --- RESELLER SALES ---
    public getResellerSales(resellerId: string): ResellerSale[] {
        const allSales: ResellerSale[] = JSON.parse(localStorage.getItem('cache_reseller_sales') || '[]');
        return allSales.filter(sale => sale.resellerId === resellerId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    public async generateResellerSale(user: User, saleData: Partial<ResellerSale>): Promise<{ success: boolean, message?: string, sale?: ResellerSale }> {
        return this.withMutation(async () => {
            const resellerDetails = user as any;
            if (!resellerDetails.pixKey) {
                return { success: false, message: 'Configure sua chave PIX nas configurações.' };
            }
            const allSales: ResellerSale[] = JSON.parse(localStorage.getItem('cache_reseller_sales') || '[]');
            
            const newSale: ResellerSale = {
                id: `sale_${Date.now()}`,
                publicId: `pub_${Math.random().toString(36).substring(2, 11)}`,
                resellerId: user.id,
                resellerName: user.username,
                customerName: saleData.customerName || 'Cliente',
                phoneNumber: saleData.phoneNumber || '',
                operator: saleData.operator || 'geral',
                planName: saleData.planName || 'Plano Padrão',
                amount: saleData.amount || 0,
                status: 'pending',
                createdAt: new Date().toISOString(),
                pixKey: resellerDetails.pixKey,
                pixKeyType: resellerDetails.pixKeyType || 'random',
            };
            allSales.unshift(newSale);
            localStorage.setItem('cache_reseller_sales', JSON.stringify(allSales));
            window.dispatchEvent(new Event('db_update'));
            return { success: true, sale: newSale };
        });
    }

    public async markSaleAsPaid(saleId: string): Promise<{ success: boolean, message?: string }> {
        return this.withMutation(async () => {
            const allSales: ResellerSale[] = JSON.parse(localStorage.getItem('cache_reseller_sales') || '[]');
            const saleIndex = allSales.findIndex(s => s.id === saleId);
            
            if (saleIndex > -1) {
                const sale = allSales[saleIndex];
                sale.status = 'paid';
                allSales[saleIndex] = sale;
                
                localStorage.setItem('cache_reseller_sales', JSON.stringify(allSales));
                
                const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
                const webhookUrl = settings.n8nWebhookUrl;
                const reseller = this.getResellers().find(r => r.id === sale.resellerId);
                
                if(webhookUrl && reseller?.canUseN8n) {
                    console.log(`[N8N] Disparando webhook para ${webhookUrl}`);
                }

                window.dispatchEvent(new CustomEvent('sys_sale_completed', { 
                    detail: { sale: sale } 
                }));

                window.dispatchEvent(new Event('db_update'));
                return { success: true, message: 'Venda marcada como paga.' };
            }
            return { success: false, message: 'Venda não encontrada.' };
        });
    }

    public async getSaleByPublicId(publicId: string): Promise<ResellerSale | null> {
        const allSales: ResellerSale[] = JSON.parse(localStorage.getItem('cache_reseller_sales') || '[]');
        return Promise.resolve(allSales.find(s => s.publicId === publicId) || null);
    }

    // --- SERVERS ---
    public getServers(): Server[] { return MOCK_SERVERS; }
    public createServer(data: any) {
        const servers = this.getServers();
        servers.push({ ...data, id: Date.now().toString(), status: 'online', connections: 0, load: 0, flag: '🇧🇷', stats: { ramUsed: '0GB', ramTotal: '4GB', cpu: 0, ram: 0, disk: 0, diskUsed: '0GB', diskTotal: '20GB', uptime: '0d', processor: 'vCPU', openPorts: [] } });
    }

    // --- FINANCIAL ---
    public getUserCredits(): number { 
        return this.getCurrentUser()?.credits || 0;
    }
    public getUserBalance(): number { 
        return this.getCurrentUser()?.balance || 0;
    }
    
    public async buyCreditsWithBalance(userId: string, amount: number) {
        return this.withMutation(async () => {
            const user = this.getCurrentUser();
            if (user && user.balance && user.balance >= amount) {
                user.balance -= amount;
                user.credits = (user.credits || 0) + Math.floor(amount/5);
                localStorage.setItem('vpn_current_user', JSON.stringify(user));
                window.dispatchEvent(new Event('financial_update'));
                return { success: true, message: 'Compra realizada!' };
            }
            return { success: false, message: 'Saldo insuficiente.' };
        });
    }
    
    public getTransactions(userId?: string): Transaction[] { 
        return JSON.parse(localStorage.getItem('cache_transactions') || '[]'); 
    }
    
    // --- STUBS / LEGACY (CONTINUAÇÃO) ---
    public getProducts(): Product[] { 
        return JSON.parse(localStorage.getItem('cache_products') || '[]'); 
    }
    public saveProduct(p: any) {
        this.withMutation(async () => {
            const products = this.getProducts();
            const index = products.findIndex(prod => prod.id === p.id);
            if (index > -1) {
                products[index] = { ...products[index], ...p };
            } else {
                products.push({ ...p, id: Date.now().toString() });
            }
            localStorage.setItem('cache_products', JSON.stringify(products));
            window.dispatchEvent(new Event('db_update'));
        });
    }
    public deleteProduct(id: string) {
        this.withMutation(async () => {
            let products = this.getProducts();
            products = products.filter(p => p.id !== id);
            localStorage.setItem('cache_products', JSON.stringify(products));
            window.dispatchEvent(new Event('db_update'));
        });
    }

    public async processStoreSale(uid: string, pid: string, customerContact: string): Promise<{success: boolean, message: string}> { 
        return this.withMutation(async () => {
            const user = this.getCurrentUser();
            const products = this.getProducts();
            const product = products.find(p => p.id === pid);
            const finConfig = PricingSvc.getFinancialConfig();
            
            if (user && product) {
                const commission = FinancialRules.calculateCommission(product.price, finConfig.adminStoreFeePercent);
                user.balance = (user.balance || 0) + commission;
                localStorage.setItem('vpn_current_user', JSON.stringify(user));
                window.dispatchEvent(new Event('financial_update'));
                
                if (product.deliveryContent && customerContact) {
                    const deliveryMessage = `Olá! Segue o seu produto: ${product.name}\n\n${product.deliveryContent}`;
                    await this.whatsappProvider.send(customerContact, deliveryMessage);
                    
                    const notifs = JSON.parse(localStorage.getItem('cache_notifications') || '[]');
                    notifs.unshift({
                        id: Date.now().toString(),
                        userId: uid,
                        title: 'Produto Entregue!',
                        message: `O produto "${product.name}" foi entregue via WhatsApp para ${customerContact}.`,
                        type: 'success',
                        read: false,
                        createdAt: new Date().toISOString()
                    });
                    localStorage.setItem('cache_notifications', JSON.stringify(notifs));
                    window.dispatchEvent(new Event('db_update'));
                    
                    return {success:true, message:'Venda processada e produto entregue!'};
                }
                
                return {success:true, message:'Venda processada, mas produto sem conteúdo de entrega.'};
            }
            
            return {success:false, message:'Erro ao processar venda.'};
        });
    }
    
    public getPixConfig(): PixConfig { 
        const conf = localStorage.getItem('cache_pix_config');
        return conf ? JSON.parse(conf) : {} as PixConfig;
    }
    
    public savePixConfig(c: PixConfig) {
        localStorage.setItem('cache_pix_config', JSON.stringify(c));
    }
    
    public getRechargeRequests(): RechargeRequest[] { 
        const all = JSON.parse(localStorage.getItem('cache_recharge_requests') || '[]');
        const user = this.getCurrentUser();
        if (user?.role === 'admin') return all;
        return all.filter((r: RechargeRequest) => r.resellerId === user?.id);
    }

    public generateRechargeRequest(amount: number, credits: number, resellerName: string) {
        const user = this.getCurrentUser();
        if(!user) throw new Error("Usuário não logado");

        const requests: RechargeRequest[] = JSON.parse(localStorage.getItem('cache_recharge_requests') || '[]');
        const newReq: RechargeRequest = {
            id: Date.now().toString(),
            resellerId: user.id,
            resellerName: resellerName,
            amount,
            credits,
            status: 'pending',
            createdAt: new Date().toISOString(),
            pixPayload: '' // Payload é gerado na UI, não precisa salvar aqui
        };
        requests.unshift(newReq);
        localStorage.setItem('cache_recharge_requests', JSON.stringify(requests));
        
        // Notificar Admin
        const notifs = JSON.parse(localStorage.getItem('cache_notifications') || '[]');
        notifs.unshift({
            id: Date.now().toString(),
            userId: '1', // Admin ID
            title: 'Nova Recarga Solicitada',
            message: `${resellerName} pediu ${credits} créditos (${FinancialRules.formatBRL(amount)}).`,
            type: 'info',
            read: false,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('cache_notifications', JSON.stringify(notifs));
        window.dispatchEvent(new Event('db_update'));
    }

    public async approveRecharge(id: string) {
        const requests: RechargeRequest[] = JSON.parse(localStorage.getItem('cache_recharge_requests') || '[]');
        const index = requests.findIndex(r => r.id === id);
        if (index > -1) {
            const req = requests[index];
            req.status = 'approved';
            localStorage.setItem('cache_recharge_requests', JSON.stringify(requests));
            await this.addCreditsToReseller(req.resellerId, req.credits);
            
            // Notificar Revendedor
            const notifs = JSON.parse(localStorage.getItem('cache_notifications') || '[]');
            notifs.unshift({
                id: Date.now().toString(),
                userId: req.resellerId,
                title: 'Créditos Adicionados!',
                message: `Sua recarga de ${req.credits} créditos foi aprovada.`,
                type: 'success',
                read: false,
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('cache_notifications', JSON.stringify(notifs));
        }
    }

    public getWithdrawals() { return []; }
    public requestWithdrawal(uid: string, a: number, k: string, t: string) { return Promise.resolve({success:true, message:'ok'}); }
    public approveWithdrawal(id: string) {}
    public getPayloads(): AppPayload[] { return JSON.parse(localStorage.getItem('cache_app_payloads') || '[]'); }
    public savePayload(p: Partial<AppPayload>) {
        const payloads = this.getPayloads();
        const index = p.id ? payloads.findIndex(item => item.id === p.id) : -1;
        if (index > -1) {
            payloads[index] = { ...payloads[index], ...p } as AppPayload;
        } else {
            payloads.push({ ...p, id: Date.now().toString() } as AppPayload);
        }
        localStorage.setItem('cache_app_payloads', JSON.stringify(payloads));
        window.dispatchEvent(new Event('db_update'));
    }
    public deletePayload(id: string) {
        let payloads = this.getPayloads();
        payloads = payloads.filter(p => p.id !== id);
        localStorage.setItem('cache_app_payloads', JSON.stringify(payloads));
        window.dispatchEvent(new Event('db_update'));
    }
    public getProxies(): AppProxy[] {
        return JSON.parse(localStorage.getItem('cache_app_proxies') || '[]');
    }
    public saveProxy(p: Partial<AppProxy>) {
        const proxies = this.getProxies();
        const index = p.id ? proxies.findIndex(item => item.id === p.id) : -1;
        if (index > -1) {
            proxies[index] = { ...proxies[index], ...p } as AppProxy;
        } else {
            proxies.push({ ...p, id: Date.now().toString() } as AppProxy);
        }
        localStorage.setItem('cache_app_proxies', JSON.stringify(proxies));
        window.dispatchEvent(new Event('db_update'));
    }
    public deleteProxy(id: string) {
        let proxies = this.getProxies();
        proxies = proxies.filter(p => p.id !== id);
        localStorage.setItem('cache_app_proxies', JSON.stringify(proxies));
        window.dispatchEvent(new Event('db_update'));
    }
    public getAppConfig(): AppConfig {
        const stored = localStorage.getItem('cache_app_config');
        return stored ? JSON.parse(stored) : { updateUrl: '', updateMessage: '', maintenanceMode: false };
    }
    public saveAppConfig(c: AppConfig) {
        localStorage.setItem('cache_app_config', JSON.stringify(c));
        window.dispatchEvent(new Event('db_update'));
    }
    public getFullAppJson() {
        const config = this.getAppConfig();
        return {
            version: 1,
            releaseNotes: config.updateMessage,
            urlUpdate: config.updateUrl,
            isMaintenance: config.maintenanceMode,
            sms: "",
            urlTermos: "https://seusite.com/termos",
            checkUser: `${window.location.origin}/api/public/check-user`,
            proxies: this.getProxies(),
            payloads: this.getPayloads(),
        };
    }
    public getLogs() { 
        return JSON.parse(localStorage.getItem('cache_logs') || '[]'); 
    }
    public getStats() { 
        const clients = this.getClients();
        const tests = this.getTests();
        return { 
            totalClients: clients.filter(c => c.status === 'active').length, 
            activeTests: tests.filter(t => t.status === 'active').length, 
            resellers: this.getResellers().length, 
            onlineConnections: clients.filter(c => c.isOnline).reduce((acc, c) => acc + c.connections, 0), 
            activityData: [] 
        }; 
    }
    public getNotifications(id: string) { 
        const all = JSON.parse(localStorage.getItem('cache_notifications') || '[]');
        const user = this.getCurrentUser();
        // Admin vê tudo, revendedor vê apenas os seus
        if (user?.role === 'admin') return all;
        return all.filter((n: Notification) => n.userId === user?.id);
    }
    public markNotificationAsRead(id: string) {
        const notifs = JSON.parse(localStorage.getItem('cache_notifications') || '[]');
        const index = notifs.findIndex((n: Notification) => n.id === id);
        if (index > -1) {
            notifs[index].read = true;
            localStorage.setItem('cache_notifications', JSON.stringify(notifs));
        }
    }
    public markAllNotificationsAsRead(id: string) {
        const notifs = this.getNotifications(id).map(n => ({...n, read: true}));
        localStorage.setItem('cache_notifications', JSON.stringify(notifs));
    }
    // FIX: Implement missing methods
    public runAutoExpire() {
        const clients: Client[] = JSON.parse(localStorage.getItem('cache_clients') || '[]');
        const now = new Date();
        let updated = false;
        clients.forEach(c => {
            if (c.status === 'active' && new Date(c.expiryDate) < now) {
                c.status = 'expired';
                updated = true;
            }
        });
        if (updated) {
            localStorage.setItem('cache_clients', JSON.stringify(clients));
            window.dispatchEvent(new Event('db_update'));
        }
    }

    public async logSecurityEvent(event: string, details: any) {
        console.warn(`[SECURITY EVENT:${event}]`, details);
    }

    public async getRemarketingConfig(): Promise<RemarketingConfig> {
        const stored = localStorage.getItem('rmk_config');
        if (stored) {
            const config = JSON.parse(stored);
            if (config.smtp.pass) config.smtp.pass = '********';
            return config;
        }
        return {
            channels: { email: false, whatsapp: false },
            smtp: { host: '', port: '', user: '', pass: '', secure: false, fromName: '' },
            templates: {} as Record<RemarketingEvent, string>,
        };
    }

    public async saveRemarketingConfig(config: RemarketingConfig): Promise<void> {
        const currentConfigRaw = localStorage.getItem('rmk_config');
        const currentConfig = currentConfigRaw ? JSON.parse(currentConfigRaw) : {};
        if (config.smtp.pass === '********' && currentConfig.smtp?.pass) {
            config.smtp.pass = currentConfig.smtp.pass;
        }
        localStorage.setItem('rmk_config', JSON.stringify(config));
        window.dispatchEvent(new Event('db_update'));
    }

    public async getWhatsappInstances(): Promise<WhatsappInstance[]> {
        return JSON.parse(localStorage.getItem('cache_whatsapp_instances') || '[]');
    }

    public async saveWhatsappInstance(instance: Partial<WhatsappInstance>): Promise<void> {
        const instances = await this.getWhatsappInstances();
        const index = instance.id ? instances.findIndex(i => i.id === instance.id) : -1;
        if (index > -1) {
            instances[index] = { ...instances[index], ...instance } as WhatsappInstance;
        } else {
            instances.push({ ...instance, id: Date.now().toString(), status: 'DISCONNECTED' } as WhatsappInstance);
        }
        localStorage.setItem('cache_whatsapp_instances', JSON.stringify(instances));
        window.dispatchEvent(new Event('db_update'));
    }

    public async deleteWhatsappInstance(id: string): Promise<void> {
        let instances = await this.getWhatsappInstances();
        instances = instances.filter(i => i.id !== id);
        localStorage.setItem('cache_whatsapp_instances', JSON.stringify(instances));
        window.dispatchEvent(new Event('db_update'));
    }

    public async generateInstanceQr(id: string): Promise<WhatsappInstance> {
        const instances = await this.getWhatsappInstances();
        const instance = instances.find(i => i.id === id);
        if (instance) {
            instance.status = 'QRCODE';
            instance.qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=WACONNECT:${instance.id}:${Date.now()}`;
            await this.saveWhatsappInstance(instance);
            return instance;
        }
        throw new Error('Instance not found');
    }

    public async connectInstance(id: string): Promise<void> {
        const instances = await this.getWhatsappInstances();
        const instance = instances.find(i => i.id === id);
        if (instance) {
            instance.status = 'CONNECTED';
            instance.qrCode = undefined;
            await this.saveWhatsappInstance(instance);
        }
    }

    public async disconnectInstance(id: string): Promise<void> {
        const instances = await this.getWhatsappInstances();
        const instance = instances.find(i => i.id === id);
        if (instance) {
            instance.status = 'DISCONNECTED';
            await this.saveWhatsappInstance(instance);
        }
    }

    public getAffiliateConfig(): AffiliateConfig {
        return JSON.parse(localStorage.getItem('affiliate_config') || 'null');
    }

    public saveAffiliateConfig(config: AffiliateConfig) {
        localStorage.setItem('affiliate_config', JSON.stringify(config));
        window.dispatchEvent(new Event('db_update'));
    }

    public getAffiliateRelationships(): AffiliateRelationship[] {
        return JSON.parse(localStorage.getItem('affiliate_relationships') || '[]');
    }

    public saveAffiliateRelationship(rel: AffiliateRelationship) {
        const rels = this.getAffiliateRelationships();
        rels.push(rel);
        localStorage.setItem('affiliate_relationships', JSON.stringify(rels));
        window.dispatchEvent(new Event('db_update'));
    }

    public getCommissionLogs(): CommissionLog[] {
        return JSON.parse(localStorage.getItem('affiliate_ledger') || '[]');
    }

    public logCommission(log: CommissionLog) {
        const logs = this.getCommissionLogs();
        logs.unshift(log);
        localStorage.setItem('affiliate_ledger', JSON.stringify(logs));
        window.dispatchEvent(new Event('db_update'));
    }

    public getChatbotConfig(): ChatbotConfig {
        return JSON.parse(localStorage.getItem('chatbot_config') || 'null');
    }

    public saveChatbotConfig(config: ChatbotConfig) {
        localStorage.setItem('chatbot_config', JSON.stringify(config));
        window.dispatchEvent(new Event('db_update'));
    }

    public getChatbotSession(sessionId: string): ChatbotSession | null {
        const sessions = JSON.parse(localStorage.getItem('chatbot_sessions') || '{}');
        return sessions[sessionId] || null;
    }

    public saveChatbotSession(session: ChatbotSession) {
        const sessions = JSON.parse(localStorage.getItem('chatbot_sessions') || '{}');
        session.lastInteraction = new Date().toISOString();
        sessions[session.sessionId] = session;
        localStorage.setItem('chatbot_sessions', JSON.stringify(sessions));
    }

    public clearChatbotSession(sessionId: string) {
        const sessions = JSON.parse(localStorage.getItem('chatbot_sessions') || '{}');
        delete sessions[sessionId];
        localStorage.setItem('chatbot_sessions', JSON.stringify(sessions));
    }

    public runAutomaticBackup() {
        console.log('⚙️ [JOB] Executando backup automático simulado...');
        // Em um backend real, isso geraria um arquivo .sql ou .json e o enviaria para um S3.
        // No mock, apenas salvamos a data para a UI exibir.
        const backupDate = new Date().toISOString();
        localStorage.setItem('sys_last_auto_backup_date', backupDate);
        window.dispatchEvent(new Event('db_update')); // Notificar UI para atualizar a data
    }
}

export const Backend = new BackendService();