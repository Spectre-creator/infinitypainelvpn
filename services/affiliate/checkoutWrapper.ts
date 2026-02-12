
import { Backend } from '../mockBackend';
import { AffiliateSvc } from './affiliateService';

/**
 * SERVICE WORKER (INTERCEPTOR)
 * Observa eventos de venda do sistema e despacha para o motor de afiliados.
 * Garante que a lógica principal de checkout não seja contaminada.
 */
export const AffiliateInterceptor = {
    init: () => {
        window.addEventListener('sys_sale_completed', async (event: any) => {
            const sale = event.detail?.sale;
            if (sale) {
                console.log('🔗 [AFFILIATE INTERCEPTOR] Venda detectada. Disparando motor de comissão...');
                await AffiliateSvc.processCommissionsForSale(sale);
            }
        });
        console.log('✅ [AFFILIATE INTERCEPTOR] Listening for sales events.');
    }
};
