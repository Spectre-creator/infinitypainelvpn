

export enum UserRole {
  ADMIN = 'admin',
  RESELLER = 'reseller',
  CLIENT = 'client',
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  category: string;
  expiration: string; 
  revenueType: string;
  avatar?: string;
  whatsapp?: string;
  credits?: number; // Moeda interna para criar contas VPN
  balance?: number; // Saldo em R$ (Real) proveniente de vendas
  canUseN8n?: boolean; // Permissão de automação
}

export interface ClientLimit {
  total: number | 'Ilimitado';
  used: number;
  available: number | 'Ilimitado';
}

export interface Client {
  id: string;
  login: string;
  password?: string;
  planId: string;
  planName: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'blocked' | 'suspended' | 'test';
  isOnline: boolean;
  resellerId?: string;
  category?: 'PREMIUM' | 'BASIC';
  isV2Ray?: boolean;
  uuid?: string;
  v2rayString?: string;
  whatsapp?: string;
  email?: string;
  lastOnline?: string;
  connections: number;
  limit: number;
  renewalStreak?: number; // Para programa de fidelidade
}

export interface TestAccount {
  id: string;
  login: string;
  password?: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'expired';
  isV2Ray?: boolean;
  uuid?: string;
  v2rayString?: string;
  limit?: number;
}

export interface Reseller {
  id: string;
  name: string;
  email: string;
  credits: number;
  activeClients: number;
  status: 'active' | 'blocked';
  category: 'PREMIUM' | 'BASIC';
  whatsapp: string;
  validity: string;
  balance?: number; // Saldo R$
  pixKey?: string;
  pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  canUseN8n?: boolean;
}

// --- NOVO: SOLICITAÇÃO DE REVENDA ---
export interface ResellerApplication {
  id: string;
  name: string;
  whatsapp: string;
  experience: string; // "Já revendo", "Iniciante", etc
  referrerId: string; // ID de quem indicou
  referrerName?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ServerStats {
  cpu: number;
  ram: number;
  ramTotal: string;
  ramUsed: string;
  disk: string;
  diskTotal: string;
  diskUsed: string;
  uptime: string;
  processor: string;
  openPorts: number[];
}

export interface Server {
  id: string;
  name: string;
  category: string;
  flag: string;
  ip: string;
  status: 'online' | 'offline' | 'maintenance';
  load: number;
  connections: number;
  stats?: ServerStats;
  user?: string;
  password?: string;
  port?: number;
}

export interface Plan {
  id: string;
  name: string;
  duration: number;
  price: number;
  currency: string;
  maxConnections: number;
  type: 'client' | 'reseller' | 'test';
  creditsGenerated: number;
  active: boolean;
  isFeatured: boolean;
}

export interface Log {
  id: string;
  userId: string;
  username: string;
  message: string;
  timeAgo: string;
  timestamp: string;
  success: boolean;
  action?: string;
  ip?: string;
}

export interface Stats {
  totalClients: number;
  activeTests: number;
  resellers: number;
  onlineConnections: number;
  activityData: Array<{ name: string; value: number }>;
}

export interface SystemSettings {
  app_name: string;
  logo_url: string;
  favicon_url: string; // Novo campo
  primary_color: string;
  secondary_color: string;
  background_color: string;
  card_color: string;
  text_color: string;
  sidebar_text_color: string;
  n8nWebhookUrl?: string;
}

// --- MÓDULO FINANCEIRO ---

export type GatewayType = 'mercadopago' | 'stone' | 'stripe' | 'pix_manual';

export interface Gateway {
  id: string;
  name: string;
  type: GatewayType;
  publicKey: string;
  secretKey: string;
  isActive: boolean;
}

export interface PixConfig {
  keyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  key: string;
  merchantName: string;
  merchantCity: string;
  isActive: boolean;
}

// Recarga de Créditos (Compra de saldo VPN)
export interface RechargeRequest {
  id: string;
  resellerId: string;
  resellerName: string;
  amount: number;
  credits: number;
  status: 'pending' | 'approved' | 'rejected';
  pixPayload: string;
  createdAt: string;
  proofUrl?: string;
}

// Solicitação de Saque (Retirada de saldo R$)
export interface WithdrawalRequest {
  id: string;
  userId: string;
  username: string;
  amount: number;
  pixKeyType: string;
  pixKey: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
}

export interface FinancialConfig {
  creditPrice: number;
  minRechargeAmount: number;
  adminStoreFeePercent: number; // Ex: 9.99
  loyaltyProgram: {
    enabled: boolean;
    renewalsNeeded: number; // Ex: 3
    discountType: 'free_renewal'; // Por enquanto, apenas 1 tipo
  };
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  usageLimit: number;
  usedCount: number;
  expiryDate: string;
  isActive: boolean;
}

export interface StoreConfig {
  storeName: string;
  storeSlug: string; // url da loja
  logoUrl: string;
  domain: string;
  primaryColor: string;
  whatsapp: string;
  email: string;
  termsUrl: string;
}

// --- MÓDULO LOJA (PRODUTOS) ---

export interface ProductVariant {
  name: string; // Ex: "Cor"
  options: string[]; // Ex: ["Azul", "Vermelho"]
}

export interface ProductReview {
  id: string;
  user: string;
  rating: number; // 1-5
  comment: string;
  date: string;
}

export interface Product {
  id: string;
  ownerId: string; // 'admin' ou ID do revendedor se ele criar produtos proprios
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  gallery?: string[]; // Arrays de URLs
  active: boolean;
  category: string;
  variations: ProductVariant[];
  reviews: ProductReview[];
  salesCount: number;
  deliveryContent: string;
}

export interface Transaction {
  id: string;
  userId: string;
  planId?: string;
  productId?: string;
  amount: number;
  fee?: number; // Taxa administrativa retida
  gateway: GatewayType | 'wallet_balance';
  status: 'pending' | 'paid' | 'failed' | 'withdrawn';
  type: 'credit_purchase' | 'store_sale' | 'withdrawal';
  date: string;
  description?: string;
}

// --- MÓDULO NOTIFICAÇÕES ---

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

// --- MÓDULO REMARKETING ---

export type RemarketingEvent = 
  | 'pre_2d' | 'pre_1d' | 'expire_day' 
  | 'post_3d' | 'post_7d' | 'post_15d' | 'post_30d' | 'post_60d';

export interface RemarketingConfig {
  channels: {
    email: boolean;
    whatsapp: boolean;
  };
  smtp: {
    host: string;
    port: string;
    user: string;
    pass: string;
    secure: boolean;
    fromName: string;
  };
  templates: Record<RemarketingEvent, string>;
}

export interface RemarketingLog {
  id: string;
  clientId: string;
  clientName: string;
  event: RemarketingEvent;
  channel: 'email' | 'whatsapp';
  status: 'sent' | 'failed';
  timestamp: string;
  messagePreview: string;
}

// --- MÓDULO APLICATIVO/PAYLOADS ---

export interface AppPayload {
  id: string;
  name: string;
  operator: 'vivo' | 'tim' | 'claro' | 'oi';
  type: 'ssl' | 'inject' | 'v2ray' | 'openvpn';
  payload: string;
  proxyId?: string;
  proxyString?: string;
  proxyPort?: number;
  sni?: string;
  isActive: boolean;
  color?: string;
}

export interface AppProxy {
  id: string;
  name: string;
  ip: string;
  port: number;
  isPublic: boolean;
  status: 'online' | 'offline';
}

export interface AppConfig {
  updateUrl: string;
  updateMessage: string;
  maintenanceMode: boolean;
}

// --- MÓDULO CHECKOUT REVENDEDOR ---
export interface ResellerSale {
  id: string;
  publicId: string; // Para URL pública
  resellerId: string;
  resellerName: string;
  customerName: string;
  phoneNumber?: string; // Novo Campo: Telefone do cliente
  operator: 'vivo' | 'tim' | 'claro' | 'oi' | 'geral';
  planName: string;
  amount: number;
  status: 'pending' | 'paid';
  createdAt: string;
  pixKey: string; // Chave do revendedor no momento da venda
  pixKeyType: string;
}

// --- MÓDULO WHATSAPP MULTI-DEVICE ---
export interface WhatsappInstance {
  id: string;
  name: string;
  instanceId: string;
  apiToken: string;
  apiUrl: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'QRCODE' | 'ERROR';
  priority: number; // 1 = mais alta
  isDefault: boolean;
  qrCode?: string; // Armazena o QR code quando gerado
}

// --- MÓDULO SUB-REVENDA ---

export interface AffiliateConfig {
  enabled: boolean;
  levels: number;
  commissionType: 'credits' | 'balance' | 'both';
  levelPercentage: number[];
}

export interface AffiliateRelationship {
  id: string;
  parentId: string;
  childId: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

export interface CommissionLog {
  id: string;
  transactionId: string;
  beneficiaryId: string;
  sourceUserId: string;
  level: number;
  amount: number;
  currency: 'credits' | 'balance';
  createdAt: string;
}

// --- MÓDULO CHATBOT V2 (NOVO) ---

export interface KeywordRule {
    id: string;
    keywords: string[]; // ['pix', 'pagamento']
    response: string;
    isActive: boolean;
}

export interface ChatbotFlowConfig {
    testFlow: {
        active: boolean;
        keywords: string[]; // ['teste', 'testar']
        messages: {
            askOperator: string;
            success: string;
            error: string;
        };
        duration: number; // minutos
        defaultPassword?: string;
    };
    userFlow: {
        active: boolean;
        keywords: string[]; // ['criar', 'acesso', 'comprar']
        messages: {
            askName: string;
            askOperator: string;
            askPlan: string;
            success: string;
        };
        defaultPassword?: string;
    };
}

export interface ChatbotConfig {
    flows: ChatbotFlowConfig;
    customRules: KeywordRule[];
}

export interface ChatbotSession {
    sessionId: string; // Phone number
    state: 'IDLE' | 'TEST_WAITING_OPERATOR' | 'USER_WAITING_NAME' | 'USER_WAITING_OPERATOR' | 'USER_WAITING_PLAN';
    tempData: any; // Armazena dados parciais (nome, operadora...)
    lastInteraction: string;
}