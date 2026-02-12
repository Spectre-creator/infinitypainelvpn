
import { WhatsappInstance } from '../../../types';
import { Backend } from '../../mockBackend';

export class WhatsappProvider {

  /**
   * Tenta enviar uma mensagem através de uma instância específica.
   * Simula falha se o token for 'fail'.
   */
  private async _attemptSend(instance: WhatsappInstance, phone: string, message: string): Promise<boolean> {
    const cleanPhone = phone.replace(/\D/g, '');

    console.log(`[WHATSAPP PROVIDER] Tentando enviar via Instância: ${instance.name} (Prioridade ${instance.priority})`);
    console.log(`  |-- API URL: ${instance.apiUrl}`);
    console.log(`  |-- Token: ${instance.apiToken.substring(0, 5)}***`);
    console.log(`  |-- Enviando para: ${cleanPhone}`);
    
    await new Promise(resolve => setTimeout(resolve, 300));

    if (instance.apiToken.toLowerCase() === 'fail') {
        console.warn(`  |-- ❌ FALHA SIMULADA na instância ${instance.name}.`);
        return false;
    }

    console.log(`  |-- ✅ SUCESSO no envio com a instância ${instance.name}.`);
    return true; 
  }

  /**
   * Envia uma mensagem de WhatsApp usando o sistema de fallback.
   * Busca todas as instâncias conectadas, ordena por prioridade e tenta enviar.
   */
  async send(phone: string, message: string): Promise<boolean> {
    // 1. Obter todas as instâncias do backend
    const allInstances = await Backend.getWhatsappInstances();

    // 2. Filtrar apenas as conectadas e ordenar por prioridade
    const availableInstances = allInstances
      .filter(inst => inst.status === 'CONNECTED')
      .sort((a, b) => a.priority - b.priority);

    if (availableInstances.length === 0) {
      console.warn('[WHATSAPP PROVIDER] Nenhuma instância de WhatsApp conectada e disponível para envio.');
      return false;
    }

    // 3. Tentar enviar em ordem de prioridade (loop de fallback)
    for (const instance of availableInstances) {
      const success = await this._attemptSend(instance, phone, message);
      if (success) {
        return true; // Mensagem enviada com sucesso, interrompe o loop
      }
      // Se falhou, o loop continua para a próxima instância
    }

    // 4. Se o loop terminar, significa que todas as instâncias falharam
    console.error('[WHATSAPP PROVIDER] Todas as instâncias disponíveis falharam ao tentar enviar a mensagem.');
    return false;
  }
}
