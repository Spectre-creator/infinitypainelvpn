
import { Backend } from '../mockBackend';
import { AffiliateConfig, AffiliateRelationship, CommissionLog, ResellerSale, User } from '../../types';
import { Features } from '../../config/features';
import { FinancialRules } from '../../domain/rules.mock';
import { PricingSvc } from '../financial';

export class AffiliateService {
    
    // --- GESTÃO DE RELACIONAMENTOS ---

    /**
     * Registra um revendedor pai para um usuário filho.
     * Inclui validação de loops (A -> B -> A).
     */
    public registerParent(childId: string, parentId: string): { success: boolean, message: string } {
        if (!Features.ENABLE_SUB_RESELLING) return { success: false, message: 'Função desativada.' };
        if (childId === parentId) return { success: false, message: 'Usuário não pode indicar a si mesmo.' };

        // 1. Verificar se já tem pai
        const allRels = Backend.getAffiliateRelationships();
        const existing = allRels.find(r => r.childId === childId && r.status === 'active');
        if (existing) return { success: false, message: 'Usuário já possui um revendedor pai.' };

        // 2. Prevenção de Loop (DFS Check)
        if (this.detectLoop(childId, parentId, allRels)) {
            return { success: false, message: 'Loop detectado na hierarquia. Ação bloqueada.' };
        }

        // 3. Salvar
        const newRel: AffiliateRelationship = {
            id: Date.now().toString(),
            childId,
            parentId,
            createdAt: new Date().toISOString(),
            status: 'active'
        };
        Backend.saveAffiliateRelationship(newRel);
        
        return { success: true, message: 'Afiliação registrada com sucesso.' };
    }

    private detectLoop(startNode: string, targetNode: string, edges: AffiliateRelationship[]): boolean {
        // Verifica se 'targetNode' (quem eu quero adicionar como pai) já é um descendente de 'startNode'
        // Se targetNode descende de startNode, adicionar targetNode como pai de startNode fecha um ciclo.
        
        const descendants = new Set<string>();
        const queue = [startNode];

        while (queue.length > 0) {
            const current = queue.shift()!;
            const children = edges.filter(e => e.parentId === current && e.status === 'active').map(e => e.childId);
            
            for (const child of children) {
                if (child === targetNode) return true; // Loop encontrado
                if (!descendants.has(child)) {
                    descendants.add(child);
                    queue.push(child);
                }
            }
        }
        return false;
    }

    // --- CÁLCULO DE COMISSÕES (ENGINE) ---

    /**
     * Processa comissões de uma venda realizada.
     * Chamado assincronamente pelo Orchestrator.
     */
    public async processCommissionsForSale(sale: ResellerSale) {
        if (!Features.ENABLE_SUB_RESELLING) return;

        const config = Backend.getAffiliateConfig();
        if (!config.enabled) return;

        const sellerId = sale.resellerId;
        const saleAmount = sale.amount;
        const allRels = Backend.getAffiliateRelationships();

        // Travessia Ascendente (Seller -> Parent -> Grandparent)
        let currentChildId = sellerId;
        
        console.log(`[AFFILIATE] Processando venda ${sale.id} de ${sale.resellerName} (R$ ${saleAmount})`);

        for (let level = 0; level < config.levels; level++) {
            // Acha o pai do atual
            const rel = allRels.find(r => r.childId === currentChildId && r.status === 'active');
            if (!rel) break; // Chegou no topo ou sem pai

            const parentId = rel.parentId;
            const percentage = config.levelPercentage[level] || 0;
            
            if (percentage > 0) {
                await this.payCommission(parentId, sale, percentage, level + 1, config.commissionType);
            }

            // Sobe um nível
            currentChildId = parentId;
        }
    }

    private async payCommission(
        beneficiaryId: string, 
        sale: ResellerSale, 
        percentage: number, 
        level: number, 
        type: 'credits' | 'balance' | 'both'
    ) {
        const commissionValueBRL = sale.amount * (percentage / 100);
        
        // Conversão para Créditos
        const finConfig = PricingSvc.getFinancialConfig();
        const creditsToAdd = FinancialRules.calculateCreditsFromAmount(commissionValueBRL, finConfig.creditPrice);

        // Se o valor for muito baixo para gerar 1 crédito, e o tipo for 'credits', não paga ou acumula (simplificação: ignora < 1 crédito)
        if (type === 'credits' && creditsToAdd < 1) {
            console.log(`[AFFILIATE] Comissão ignorada para ${beneficiaryId}: Valor insuficiente para 1 crédito.`);
            return;
        }

        // Executar Pagamento
        if (type === 'credits' || type === 'both') {
            await Backend.addCreditsToReseller(beneficiaryId, creditsToAdd);
        }
        
        // Log de Auditoria
        const log: CommissionLog = {
            id: Date.now().toString() + Math.random().toString().slice(2,5),
            transactionId: sale.id,
            beneficiaryId,
            sourceUserId: sale.resellerId,
            level,
            amount: type === 'credits' ? creditsToAdd : commissionValueBRL,
            currency: type === 'credits' ? 'credits' : 'balance',
            createdAt: new Date().toISOString()
        };
        
        Backend.logCommission(log);
        console.log(`[AFFILIATE] Comissão paga para ${beneficiaryId}: +${creditsToAdd} Créditos (Nível ${level})`);
        
        // Notificação (Simulada)
        const notifs = Backend.getNotifications(beneficiaryId);
        notifs.unshift({
            id: Date.now().toString(),
            userId: beneficiaryId,
            title: 'Comissão Recebida! 💰',
            message: `Você ganhou ${creditsToAdd} créditos por uma venda na sua rede (Nível ${level}).`,
            type: 'success',
            read: false,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('cache_notifications', JSON.stringify(notifs));
    }

    // --- HELPERS PARA UI ---
    public getMyNetwork(userId: string): { direct: number, total: number, depth: number } {
        const allRels = Backend.getAffiliateRelationships();
        const direct = allRels.filter(r => r.parentId === userId && r.status === 'active').length;
        
        // BFS para total
        let total = 0;
        let maxDepth = 0;
        const queue = [{ id: userId, depth: 0 }];
        
        while(queue.length > 0) {
            const current = queue.shift()!;
            if (current.depth > maxDepth) maxDepth = current.depth;
            
            const children = allRels.filter(r => r.parentId === current.id && r.status === 'active');
            total += children.length;
            
            children.forEach(c => queue.push({ id: c.childId, depth: current.depth + 1 }));
        }

        return { direct, total, depth: maxDepth };
    }
}

export const AffiliateSvc = new AffiliateService();
