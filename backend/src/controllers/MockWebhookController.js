
const Factory = require('../infra/Factory');
const { businessLogger, logger } = require('../utils/Logger');

/**
 * 💸 MOCK WEBHOOK CONTROLLER
 * 
 * Este controlador simula os callbacks (Webhooks) que seriam recebidos de gateways
 * reais como Mercado Pago, Gerencianet (Efi) ou Stripe.
 * 
 * Útil para:
 * 1. Testar o fluxo de aprovação automática de vendas/créditos.
 * 2. Validar UX de feedback de pagamento no Frontend.
 * 3. Testar cenários de falha/rejeição.
 */
class MockWebhookController {

    /**
     * Endpoint: POST /api/webhooks/pix/simulate
     * Body: { "txid": "SALE_123", "status": "approved" | "rejected", "amount": 15.00 }
     */
    async simulatePix(req, res) {
        try {
            const { txid, status, amount } = req.body;
            
            // Repositórios
            const finRepo = Factory.getFinancialRepository();
            const userRepo = Factory.getUserRepository();

            // 1. Busca a transação (Lógica Mock: itera na lista em memória)
            // Em produção: SELECT * FROM transactions WHERE gateway_id = $1
            const transactions = await finRepo.getTransactions(null); // null = admin vê tudo
            const transactionIndex = transactions.findIndex(t => t.id === txid || (t.description && t.description.includes(txid)));

            if (transactionIndex === -1) {
                return res.status(404).json({ error: 'Transação não encontrada no Mock.' });
            }

            const transaction = transactions[transactionIndex];

            // Evita processar transação já finalizada
            if (transaction.status === 'paid') {
                return res.json({ message: 'Transação já processada anteriormente (Idempotência Mock).' });
            }

            // 2. Lógica de Atualização de Status
            /* 
               TODO: PRODUCTION IMPLEMENTATION (MERCADO PAGO)
               ----------------------------------------------
               1. Validar Assinatura (HMAC) no header `x-signature` para garantir que vem do MP.
               2. Não confiar apenas no body. Consultar a API do Gateway usando o ID:
                  const payment = await mercadoPago.payment.get(req.body.data.id);
                  if (payment.status === 'approved') ...
            */

            /* 
               TODO: PRODUCTION IMPLEMENTATION (EFI / GERENCIANET)
               ---------------------------------------------------
               1. Validar certificado mTLS se configurado.
               2. Decodificar payload pix:
                  const pix = req.body.pix[0];
                  if (pix.txid === ...) ...
            */

            if (status === 'approved') {
                // A. Atualizar Status da Transação
                transactions[transactionIndex].status = 'paid';
                transactions[transactionIndex].paidAt = new Date().toISOString();

                // B. Entregar o Produto (Adicionar Créditos ou Saldo)
                const userId = transaction.userId;
                const value = amount || transaction.amount;

                if (transaction.type === 'credit_purchase') {
                    // Regra: 1 Crédito = R$ 5.00 (Exemplo, pegar de config)
                    const creditsToAdd = Math.floor(value / 5);
                    await userRepo.updateCredits(userId, creditsToAdd);
                    
                    businessLogger.info({ 
                        event: 'payment_approved', 
                        userId, 
                        creditsAdded: creditsToAdd, 
                        txid 
                    }, 'Pagamento PIX Aprovado (Mock). Créditos liberados.');

                } else if (transaction.type === 'store_sale') {
                    // Venda de Loja: Adiciona saldo na carteira do revendedor
                    await finRepo.addBalance(userId, value);
                    
                    businessLogger.info({ 
                        event: 'store_sale_approved', 
                        userId, 
                        amount: value, 
                        txid 
                    }, 'Venda de Loja Aprovada (Mock). Saldo liberado.');
                }

                return res.json({ 
                    success: true, 
                    message: 'Pagamento APROVADO simulado.', 
                    details: { oldStatus: 'pending', newStatus: 'paid', userId } 
                });

            } else {
                // REJEITADO
                transactions[transactionIndex].status = 'failed';
                
                businessLogger.warn({ event: 'payment_rejected', txid }, 'Pagamento PIX Rejeitado (Mock).');
                
                return res.json({ 
                    success: true, 
                    message: 'Pagamento REJEITADO simulado.',
                    details: { newStatus: 'failed' } 
                });
            }

        } catch (error) {
            logger.error({ err: error }, 'Erro no Webhook Mock');
            res.status(500).json({ error: 'Falha interna no simulador.' });
        }
    }
}

module.exports = new MockWebhookController();
