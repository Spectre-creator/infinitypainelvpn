
import { Gateway, Coupon, StoreConfig, Plan, GatewayType, Transaction, User, FinancialConfig } from '../types';
import { Backend } from './mockBackend';

const KEYS = {
  GATEWAYS: 'fin_gateways',
  COUPONS: 'fin_coupons',
  STORE: 'fin_store',
  PLANS: 'vpn_plans', 
  TRANSACTIONS: 'fin_transactions',
  FIN_CONFIG: 'fin_general_config'
};

// --- BASE SERVICE HELPER ---
class BaseService<T> {
  protected key: string;

  constructor(key: string) {
    this.key = key;
  }

  protected getAll(): T[] {
    return JSON.parse(localStorage.getItem(this.key) || '[]');
  }

  protected save(data: T[]) {
    localStorage.setItem(this.key, JSON.stringify(data));
    window.dispatchEvent(new Event('financial_update'));
  }
}

// --- GATEWAY SERVICE ---
export class GatewayService extends BaseService<Gateway> {
  constructor() { super(KEYS.GATEWAYS); }

  getGateways(): Gateway[] {
    return this.getAll();
  }

  saveGateway(gateway: Gateway) {
    const list = this.getAll();
    if (gateway.isActive) {
      // Regra: Apenas 1 gateway ativo por vez
      list.forEach(g => g.isActive = false);
    }
    
    const index = list.findIndex(g => g.id === gateway.id);
    if (index >= 0) {
      list[index] = gateway;
    } else {
      list.push({ ...gateway, id: Date.now().toString() });
    }
    this.save(list);
  }

  deleteGateway(id: string) {
    const list = this.getAll().filter(g => g.id !== id);
    this.save(list);
  }

  getActiveGateway(): Gateway | undefined {
    return this.getAll().find(g => g.isActive);
  }

  async testConnection(gateway: Gateway): Promise<boolean> {
    // Mock de conexão
    return new Promise(resolve => setTimeout(() => resolve(true), 1500));
  }
}

// --- COUPON SERVICE ---
export class CouponService extends BaseService<Coupon> {
  constructor() { super(KEYS.COUPONS); }

  getCoupons(): Coupon[] {
    return this.getAll();
  }

  saveCoupon(coupon: Coupon) {
    const list = this.getAll();
    const index = list.findIndex(c => c.id === coupon.id);
    if (index >= 0) {
      list[index] = coupon;
    } else {
      list.push({ ...coupon, id: Date.now().toString(), usedCount: 0 });
    }
    this.save(list);
  }

  deleteCoupon(id: string) {
    const list = this.getAll().filter(c => c.id !== id);
    this.save(list);
  }

  validateCoupon(code: string): { valid: boolean; coupon?: Coupon; error?: string } {
    const coupon = this.getAll().find(c => c.code === code && c.isActive);
    if (!coupon) return { valid: false, error: 'Cupom inválido' };
    
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, error: 'Limite de uso excedido' };
    }
    
    if (new Date(coupon.expiryDate) < new Date()) {
      return { valid: false, error: 'Cupom expirado' };
    }

    return { valid: true, coupon };
  }

  incrementUsage(id: string) {
    const list = this.getAll();
    const index = list.findIndex(c => c.id === id);
    if (index >= 0) {
      list[index].usedCount += 1;
      this.save(list);
    }
  }
}

// --- STORE SERVICE ---
export class StoreService {
  getConfig(): StoreConfig {
    const stored = localStorage.getItem(KEYS.STORE);
    return stored ? JSON.parse(stored) : {
      storeName: 'VPN Nexus Store',
      logoUrl: '',
      domain: 'vpn-nexus.com',
      primaryColor: '#4f46e5',
      whatsapp: '',
      email: '',
      termsUrl: ''
    };
  }

  saveConfig(config: StoreConfig) {
    localStorage.setItem(KEYS.STORE, JSON.stringify(config));
  }
}

// --- PRICING SERVICE ---
export class PricingService extends BaseService<Plan> {
  constructor() { super(KEYS.PLANS); }

  getPlans(): Plan[] {
    return this.getAll().sort((a, b) => a.price - b.price);
  }

  savePlan(plan: Plan) {
    const list = this.getAll();
    const index = list.findIndex(p => p.id === plan.id);
    if (index >= 0) {
      list[index] = plan;
    } else {
      list.push({ ...plan, id: Date.now().toString() });
    }
    this.save(list);
  }

  deletePlan(id: string) {
    const list = this.getAll().filter(p => p.id !== id);
    this.save(list);
  }

  toggleActive(id: string) {
    const list = this.getAll();
    const plan = list.find(p => p.id === id);
    if (plan) {
      plan.active = !plan.active;
      this.save(list);
    }
  }

  // --- NOVOS MÉTODOS PARA CONFIGURAÇÃO DE VALORES DE CRÉDITO ---
  getFinancialConfig(): FinancialConfig {
      const stored = localStorage.getItem(KEYS.FIN_CONFIG);
      const defaults: FinancialConfig = {
          creditPrice: 5.0,
          minRechargeAmount: 10.0,
          adminStoreFeePercent: 15.0,
          loyaltyProgram: {
              enabled: true,
              renewalsNeeded: 3,
              discountType: 'free_renewal'
          }
      };
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
  }

  saveFinancialConfig(config: FinancialConfig) {
      localStorage.setItem(KEYS.FIN_CONFIG, JSON.stringify(config));
      window.dispatchEvent(new Event('financial_update'));
  }
}

// --- CHECKOUT SERVICE ---
export class CheckoutService {
  private gatewayService = new GatewayService();
  private couponService = new CouponService();
  private pricingService = new PricingService();

  async processPurchase(user: User, planId: string, couponCode?: string): Promise<{ success: boolean; message: string }> {
    // 1. Validar Gateway
    const gateway = this.gatewayService.getActiveGateway();
    if (!gateway) return { success: false, message: 'Nenhum gateway de pagamento ativo.' };

    // 2. Validar Plano
    const plan = this.pricingService.getPlans().find(p => p.id === planId);
    if (!plan || !plan.active) return { success: false, message: 'Plano inválido ou inativo.' };

    // 3. Validar Cupom e Calcular Preço
    let finalPrice = plan.price;
    if (couponCode) {
      const { valid, coupon } = this.couponService.validateCoupon(couponCode);
      if (valid && coupon) {
        if (coupon.type === 'percent') {
          finalPrice -= (finalPrice * coupon.value / 100);
        } else {
          finalPrice -= coupon.value;
        }
        if (finalPrice < 0) finalPrice = 0;
        this.couponService.incrementUsage(coupon.id);
      }
    }

    // 4. Mock Transação (Gateway)
    // Aqui simularia a chamada para Stripe/MercadoPago
    const transactionSuccess = Math.random() > 0.1; // 90% chance sucesso

    if (!transactionSuccess) return { success: false, message: 'Pagamento recusado pelo gateway.' };

    // 5. Entregar Produto (Lógica de Negócio)
    if (plan.type === 'reseller') {
        // Adicionar Créditos
        const users = JSON.parse(localStorage.getItem('vpn_users') || '[]');
        const uIndex = users.findIndex((u: User) => u.id === user.id);
        if (uIndex >= 0) {
            users[uIndex].credits = (users[uIndex].credits || 0) + plan.creditsGenerated;
            localStorage.setItem('vpn_users', JSON.stringify(users));
        }
    } else {
        console.log(`[CHECKOUT] Plano ${plan.name} ativado para usuário ${user.username}`);
    }

    // 6. Registrar Transação
    this.logTransaction(user.id, plan.id, finalPrice, gateway.type);

    return { success: true, message: 'Compra realizada com sucesso!' };
  }

  private logTransaction(userId: string, planId: string, amount: number, gateway: GatewayType) {
    const transactions = JSON.parse(localStorage.getItem(KEYS.TRANSACTIONS) || '[]');
    const newTx: Transaction = {
      id: Date.now().toString(),
      userId,
      planId,
      amount,
      gateway,
      status: 'paid',
      type: 'credit_purchase',
      date: new Date().toISOString(),
      description: 'Compra de plano'
    };
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([newTx, ...transactions]));
  }
}

// Singleton Instances
export const GatewaySvc = new GatewayService();
export const CouponSvc = new CouponService();
export const StoreSvc = new StoreService();
export const PricingSvc = new PricingService();
export const CheckoutSvc = new CheckoutService();