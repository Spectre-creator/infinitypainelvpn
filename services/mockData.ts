
import { Client, Plan, Reseller, Server, Stats, TestAccount, Log, User, UserRole, ClientLimit } from '../types';

export const MOCK_USER: User = {
  id: '1',
  username: 'Admin',
  role: UserRole.ADMIN,
  category: 'TODAS',
  expiration: 'Vitalício',
  revenueType: 'Administrador',
  avatar: 'https://ui-avatars.com/api/?name=Admin&background=6366f1&color=fff',
};

export const MOCK_LIMITS: ClientLimit = {
  total: 'Ilimitado',
  used: 707,
  available: 'Ilimitado'
};

export const MOCK_PLANS: Plan[] = [
  { 
    id: '1', 
    name: 'Mensal VIP', 
    duration: 30, 
    price: 15.00, 
    currency: 'BRL', 
    maxConnections: 1, 
    type: 'client', 
    creditsGenerated: 0, 
    active: true, 
    isFeatured: false 
  },
  { 
    id: '2', 
    name: 'Trimestral Gold', 
    duration: 90, 
    price: 40.00, 
    currency: 'BRL', 
    maxConnections: 2, 
    type: 'client', 
    creditsGenerated: 0, 
    active: true, 
    isFeatured: true 
  },
  { 
    id: '3', 
    name: 'Semestral Pro', 
    duration: 180, 
    price: 70.00, 
    currency: 'BRL', 
    maxConnections: 3, 
    type: 'client', 
    creditsGenerated: 0, 
    active: true, 
    isFeatured: false 
  },
];

export const MOCK_SERVERS: Server[] = [
  { 
    id: '1', 
    name: 'PREMIUM', 
    category: 'PREMIUM',
    flag: '🇧🇷', 
    ip: '104.234.237.120', 
    status: 'online', 
    load: 13, 
    connections: 122,
    user: 'root',
    password: '***',
    port: 22,
    stats: {
      cpu: 13.2,
      ram: 36.5,
      ramUsed: '8.51 GB',
      ramTotal: '23.47 GB',
      disk: '7.1',
      diskUsed: '4.17 GB',
      diskTotal: '58.97 GB',
      uptime: '100%',
      processor: 'Intel Xeon E5-2680 v4',
      openPorts: [7100, 1085, 7200, 7300, 7400, 22, 7100, 7301]
    }
  }
];

export const MOCK_RESELLERS: Reseller[] = [
  { id: '1', name: 'JhonisSSH', email: 'jhonis@vpn.com', credits: 50, activeClients: 120, status: 'active', category: 'PREMIUM', whatsapp: 'Sem Whatsapp', validity: '14/02/2026', canUseN8n: true },
  { id: '2', name: 'Maria Net', email: 'maria@vpn.com', credits: 10, activeClients: 45, status: 'active', category: 'BASIC', whatsapp: '11999999999', validity: '10/10/2025', canUseN8n: false },
  { id: '3', name: 'revendedor_teste', email: 'teste@vpn.com', credits: 100, activeClients: 10, status: 'active', category: 'PREMIUM', whatsapp: '11987654321', validity: '31/12/2025', canUseN8n: true, balance: 75.0, pixKey: 'teste@pix.com', pixKeyType: 'email' },
];

export const MOCK_CLIENTS: Client[] = [
  { id: '1', login: 'cliente01', planId: '1', planName: 'Mensal VIP', expiryDate: '2023-12-30T00:00:00Z', status: 'active', isOnline: true, connections: 1, limit: 1, resellerId: '3' },
  { id: '2', login: 'gamer_pro', planId: '2', planName: 'Trimestral Gold', expiryDate: '2023-11-15T00:00:00Z', status: 'expired', isOnline: false, connections: 0, limit: 2, resellerId: '1' },
  { id: '3', login: 'tv_sala', planId: '1', planName: 'Mensal VIP', expiryDate: '2024-01-20T00:00:00Z', status: 'active', isOnline: true, connections: 1, limit: 1, resellerId: '3' },
  { id: '4', login: 'mobile_x', planId: '1', planName: 'Mensal VIP', expiryDate: '2023-12-05T00:00:00Z', status: 'blocked', isOnline: false, connections: 0, limit: 1, resellerId: '1' },
  { id: '5', login: 'ana_souza', planId: '3', planName: 'Semestral Pro', expiryDate: '2024-05-10T00:00:00Z', status: 'active', isOnline: false, connections: 0, limit: 3, resellerId: '2' },
];

export const MOCK_TESTS: TestAccount[] = [
  { id: '1', login: 'teste_123', createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString(), status: 'active' },
  { id: '2', login: 'teste_456', createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() - 3600000).toISOString(), status: 'expired' },
];

export const MOCK_LOGS: Log[] = [
  { id: '1', userId: '1', username: 'johssh', message: 'obteve sucesso ao editar o cliente Carolina no dia 30/01', timeAgo: '1 min atrás', timestamp: new Date().toISOString(), success: true, action: 'Editar Cliente', ip: '192.168.1.10' },
  { id: '2', userId: '1', username: 'Admin', message: 'obteve sucesso ao criar o cliente Milton no dia 30/01', timeAgo: '1 hora atrás', timestamp: new Date().toISOString(), success: true, action: 'Criar Cliente', ip: '192.168.1.12' },
  { id: '3', userId: '1', username: 'Admin', message: 'obteve sucesso ao renovar o cliente PedroRV no dia 30/01', timeAgo: '2 horas atrás', timestamp: new Date().toISOString(), success: true, action: 'Renovar Cliente', ip: '10.0.0.5' },
  { id: '4', userId: '1', username: 'Admin', message: 'obteve sucesso ao renovar o cliente RayaneST no dia 30/01', timeAgo: '2 horas atrás', timestamp: new Date().toISOString(), success: true, action: 'Renovar Cliente', ip: '10.0.0.5' },
];

export const MOCK_STATS: Stats = {
  totalClients: 837,
  activeTests: 16,
  resellers: 4,
  onlineConnections: 131,
  activityData: [],
};
