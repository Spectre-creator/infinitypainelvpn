
import { RemarketingConfig, RemarketingEvent, RemarketingLog, Client, Plan } from '../../types';
import { EmailProvider } from './providers/emailProvider';
import { WhatsappProvider } from './providers/whatsappProvider';
import { MessageTemplateService } from './messageTemplateService';
import { Backend } from '../mockBackend';

const KEYS = { LOGS: 'rmk_logs' };

class RemarketingService {
  private emailProvider = new EmailProvider();
  private whatsappProvider = new WhatsappProvider();
  private templateService = new MessageTemplateService();

  constructor() {}

  // Agora chama o Backend (API) ao invés do localStorage
  async getConfig(): Promise<RemarketingConfig> {
    return await Backend.getRemarketingConfig();
  }

  async saveConfig(config: RemarketingConfig) {
    await Backend.saveRemarketingConfig(config);
  }

  getLogs(): RemarketingLog[] {
    return JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]');
  }

  private saveLog(log: RemarketingLog) {
    const logs = this.getLogs();
    localStorage.setItem(KEYS.LOGS, JSON.stringify([log, ...logs].slice(0, 500)));
  }

  /**
   * Executa o Motor de Disparo (Client-Side Simulation)
   * Nota: Em produção real, este motor deve ser movido para backend/src/jobs
   */
  async runEngine() {
    console.log('[REMARKETING ENGINE] Buscando configurações seguras no Backend...');
    
    const config = await this.getConfig(); // Pega config (mascarada, mas o mock provider aceita)
    const clients = Backend.getClients();
    
    // Obter planos para saber o preço
    const plansRaw = localStorage.getItem('vpn_plans');
    const plans: Plan[] = plansRaw ? JSON.parse(plansRaw) : [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const client of clients) {
        if (client.login.startsWith('teste')) continue; 

        const expiryDate = new Date(client.expiryDate);
        const expiryDay = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());
        
        const diffTime = expiryDay.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let eventToTrigger: RemarketingEvent | null = null;

        if (diffDays === 2) eventToTrigger = 'pre_2d';
        else if (diffDays === 1) eventToTrigger = 'pre_1d';
        else if (diffDays === 0) eventToTrigger = 'expire_day';
        else if (diffDays === -3) eventToTrigger = 'post_3d';
        else if (diffDays === -7) eventToTrigger = 'post_7d';
        else if (diffDays === -15) eventToTrigger = 'post_15d';
        else if (diffDays === -30) eventToTrigger = 'post_30d';
        else if (diffDays === -60) eventToTrigger = 'post_60d';

        if (eventToTrigger) {
            await this.dispatch(client, eventToTrigger, config, plans);
        }
    }
  }

  private async dispatch(client: Client, event: RemarketingEvent, config: RemarketingConfig, plans: Plan[]) {
    const logs = this.getLogs();
    const todayStr = new Date().toISOString().split('T')[0];
    
    const alreadySent = logs.some(l => 
        l.clientId === client.id && 
        l.event === event && 
        l.timestamp.startsWith(todayStr)
    );

    if (alreadySent) return;

    // Se templates não vierem (config vazia), aborta
    if (!config.templates || !config.templates[event]) return;

    const template = config.templates[event];
    const plan = plans.find(p => p.name === client.planName);
    const message = this.templateService.render(template, client, plan?.price);

    // Envio WhatsApp com Fallback
    if (config.channels.whatsapp && client.whatsapp) {
        const success = await this.whatsappProvider.send(client.whatsapp, message);
        this.saveLog({
            id: Date.now().toString() + 'w',
            clientId: client.id,
            clientName: client.login,
            event,
            channel: 'whatsapp',
            status: success ? 'sent' : 'failed',
            timestamp: new Date().toISOString(),
            messagePreview: message
        });
    }

    // Envio Email
    if (config.channels.email && client.email) {
        const success = await this.emailProvider.send(config.smtp, client.email, 'Aviso Importante - VPN Nexus', message);
        this.saveLog({
            id: Date.now().toString() + 'e',
            clientId: client.id,
            clientName: client.login,
            event,
            channel: 'email',
            status: success ? 'sent' : 'failed',
            timestamp: new Date().toISOString(),
            messagePreview: message
        });
    }
  }
}

export const RemarketingSvc = new RemarketingService();