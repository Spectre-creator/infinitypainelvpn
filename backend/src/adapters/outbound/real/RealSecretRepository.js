
const ISecretRepository = require('../../../core/ports/ISecretRepository');

/**
 * 🔐 REAL SECRET REPOSITORY (FALLBACK MODE)
 * 
 * Atualmente opera em modo "Local Vault" (Memória + Variáveis de Ambiente).
 * Isso permite que o sistema funcione em ambientes de Staging/Produção inicial
 * sem depender de infraestrutura complexa externa, mas mantendo a interface correta.
 */
class RealSecretRepository extends ISecretRepository {
    constructor() {
        super();
        this.memoryVault = new Map();
        
        // Carrega segredos iniciais baseados em ENV ou Defaults seguros
        this._seedDefaults();
        
        console.warn('⚠️ [INFRA] RealSecretRepository operando em modo "In-Memory/Env".');
        console.warn('   |-- Segredos não persistem após reinício do processo.');
        console.warn('   |-- Para persistência real, configure o conector do Vault (ver código).');
    }

    _seedDefaults() {
        // Popula com dados do .env ou valores placeholder para garantir funcionamento imediato
        this.memoryVault.set('smtp_pass', process.env.SMTP_PASS || 'senha_smtp_mock_segura');
        this.memoryVault.set('whatsapp_token', process.env.WA_TOKEN || 'token_wa_mock_123');
        this.memoryVault.set('pix_key_default', process.env.PIX_KEY || '00020126580014BR.GOV.BCB.PIX0114+5511999999999');
    }

    /**
     * Recupera um segredo.
     * Ordem de precedência:
     * 1. Memória (definido via API/Sistema)
     * 2. Variável de Ambiente (definido na infra)
     * 3. Null
     */
    async getSecret(key) {
        /*
         TODO: INFRASTRUCTURE - AWS SECRETS MANAGER
         ------------------------------------------
         const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
         const client = new SecretsManagerClient({ region: "us-east-1" });
         
         try {
            const response = await client.send(new GetSecretValueCommand({ SecretId: key }));
            return response.SecretString;
         } catch (error) {
            console.error('Falha ao buscar segredo na AWS:', error);
            throw error;
         }
        */

        /*
         TODO: INFRASTRUCTURE - HASHICORP VAULT
         ----------------------------------------
         const vault = require("node-vault")({ apiVersion: "v1", endpoint: "http://127.0.0.1:8200" });
         const result = await vault.read(`secret/data/${key}`);
         return result.data.data.value;
        */

        // --- IMPLEMENTAÇÃO ATUAL (FALLBACK) ---
        if (this.memoryVault.has(key)) {
            return this.memoryVault.get(key);
        }

        // Tenta buscar do environment convertendo a chave (ex: smtp_pass -> SMTP_PASS)
        const envKey = key.toUpperCase();
        if (process.env[envKey]) {
            return process.env[envKey];
        }

        return null;
    }

    async saveSecret(key, value) {
        /* 
         TODO: AWS/VAULT - Implementar update/put
         await client.send(new PutSecretValueCommand({ SecretId: key, SecretString: value }));
        */
        
        console.log(`🔐 [VAULT] Segredo '${key}' atualizado na memória segura.`);
        this.memoryVault.set(key, value);
        return true;
    }

    async deleteSecret(key) {
        /* 
         TODO: AWS/VAULT - Implementar delete
         await client.send(new DeleteSecretCommand({ SecretId: key }));
        */

        console.log(`🔐 [VAULT] Segredo '${key}' removido da memória.`);
        return this.memoryVault.delete(key);
    }
}

module.exports = RealSecretRepository;
