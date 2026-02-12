
import { Client, Plan } from '../../types';

export class MessageTemplateService {
  
  /**
   * Substitui variáveis no template
   * Variáveis suportadas: {{nome}}, {{login}}, {{vencimento}}, {{plano}}
   */
  render(template: string, client: Client, planPrice?: number): string {
    if (!template) return '';

    const expiryDate = new Date(client.expiryDate).toLocaleDateString('pt-BR');
    const price = planPrice ? `R$ ${planPrice.toFixed(2)}` : 'Consulte';

    return template
      .replace(/{{nome}}/g, client.login) // Usando login como nome por enquanto
      .replace(/{{login}}/g, client.login)
      .replace(/{{vencimento}}/g, expiryDate)
      .replace(/{{plano}}/g, client.planName)
      .replace(/{{valor}}/g, price);
  }

  getDefaultTemplate(event: string): string {
    switch (event) {
      case 'pre_2d': return 'Olá {{nome}}, seu plano {{plano}} vence em 2 dias ({{vencimento}}). Evite o bloqueio!';
      case 'pre_1d': return 'Oi {{nome}}, amanhã é o vencimento do seu plano. Valor: {{valor}}.';
      case 'expire_day': return 'Olá {{nome}}! Seu plano vence hoje. Renove agora para continuar conectado.';
      case 'post_3d': return 'Aviso: {{nome}}, seu serviço foi suspenso há 3 dias. Regularize para reativar.';
      case 'post_7d': return 'Oi {{nome}}, sentimos sua falta! Temos uma oferta especial para você voltar.';
      case 'post_15d': return '{{nome}}, seu acesso pode ser deletado em breve. Reative agora!';
      case 'post_30d': return 'Última chance de recuperar sua conta {{login}}. Entre em contato.';
      case 'post_60d': return 'Conta {{login}} programada para exclusão definitiva.';
      default: return '';
    }
  }
}
