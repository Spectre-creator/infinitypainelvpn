
import { RemarketingConfig } from '../../../types';

export class EmailProvider {
  async send(
    config: RemarketingConfig['smtp'],
    to: string,
    subject: string,
    htmlBody: string
  ): Promise<boolean> {
    // 🔒 Production-Ready Logic:
    // Aqui entraria a chamada para nodemailer ou API de email (SendGrid/AWS SES)
    
    console.log(`[SMTP MOCK] Conectando a ${config.host}:${config.port}`);
    console.log(`[SMTP MOCK] Autenticando usuário: ${config.user}`);
    console.log(`[SMTP MOCK] Enviando para: ${to}`);
    console.log(`[SMTP MOCK] Assunto: ${subject}`);
    
    // Simulating network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (!config.host || !config.user) {
      console.warn('[SMTP MOCK] Configuração incompleta. Falha no envio.');
      return false;
    }

    return true; // Sucesso simulado
  }
}
