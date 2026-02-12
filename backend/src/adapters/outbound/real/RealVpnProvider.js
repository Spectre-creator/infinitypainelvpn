
const { Client } = require('ssh2');
const IVpnProvider = require('../../../core/ports/IVpnProvider');
const config = require('../../../config/env');

class RealVpnProvider extends IVpnProvider {
    constructor() {
        super();
        this.sshConfig = {
            host: config.infra.sshHost || process.env.VPS_HOST,
            port: parseInt(config.infra.sshPort || process.env.VPS_PORT || '22'),
            username: config.infra.sshUser || process.env.VPS_USER,
            password: config.infra.sshPass || process.env.VPS_PASSWORD,
            readyTimeout: 10000, // 10 segundos timeout
            keepaliveInterval: 5000
        };
    }

    /**
     * Método auxiliar para executar comandos SSH de forma atômica (Conecta -> Executa -> Desconecta)
     * Em um ambiente de alta escala, isso deveria usar um Pool de conexões SSH.
     */
    async _exec(command) {
        return new Promise((resolve, reject) => {
            const conn = new Client();
            
            conn.on('ready', () => {
                conn.exec(command, (err, stream) => {
                    if (err) {
                        conn.end();
                        return reject(err);
                    }
                    
                    let stdout = '';
                    let stderr = '';

                    stream.on('close', (code, signal) => {
                        conn.end();
                        if (code !== 0) {
                            // Se o comando falhar (exit code != 0), rejeita com o stderr
                            reject(new Error(`SSH Command Error (Exit ${code}): ${stderr || 'Unknown error'}`));
                        } else {
                            resolve(stdout.trim());
                        }
                    }).on('data', (data) => {
                        stdout += data.toString();
                    }).stderr.on('data', (data) => {
                        stderr += data.toString();
                    });
                });
            }).on('error', (err) => {
                reject(new Error(`SSH Connection Failed: ${err.message}`));
            }).connect(this.sshConfig);
        });
    }

    /**
     * Cria ou atualiza usuário no Linux via SSH.
     * @param {object} user { username, password, expiry }
     */
    async createAccount(user) {
        const { username, password, expiry } = user;
        
        try {
            console.log(`📡 [SSH] Provisioning user: ${username} on ${this.sshConfig.host}`);

            // Comando composto:
            // 1. useradd: cria usuário sem diretório home (-M), sem shell (-s /bin/false).
            // 2. chpasswd: define a senha de forma segura via pipe.
            // 3. chage (opcional): define data de expiração se fornecida.
            
            let cmd = `useradd -M -s /bin/false ${username}`;
            
            // Tenta criar. Se falhar pq existe, o catch captura.
            await this._exec(`${cmd} && echo "${username}:${password}" | chpasswd`);
            
            // Se tiver data de validade, define no sistema operacional
            if (expiry) {
                // expiry deve estar no formato YYYY-MM-DD
                await this._exec(`chage -E ${expiry} ${username}`);
            }

            return { success: true, method: 'SSH_CREATE' };

        } catch (error) {
            // Tratamento: Se o usuário já existe, apenas atualizamos a senha
            if (error.message && error.message.includes('already exists')) {
                console.warn(`⚠️ [SSH] User ${username} already exists. Updating password and expiry...`);
                try {
                    await this._exec(`echo "${username}:${password}" | chpasswd`);
                    if (expiry) await this._exec(`chage -E ${expiry} ${username}`);
                    // Reativa o usuário caso esteja expirado/bloqueado pelo sistema
                    await this._exec(`usermod -e ${expiry || ''} -U ${username}`);
                    
                    return { success: true, method: 'SSH_UPDATE' };
                } catch (updateError) {
                    console.error('❌ [SSH] Failed to update existing user:', updateError);
                    throw updateError;
                }
            }

            console.error('❌ [SSH] Create Failed:', error);
            throw error;
        }
    }

    /**
     * Remove usuário da VPS.
     * @param {string} username 
     */
    async removeAccount(username) {
        try {
            console.log(`📡 [SSH] Removing user: ${username}`);
            // --force garante remoção mesmo se logado
            await this._exec(`userdel --force ${username}`);
            return { success: true };
        } catch (error) {
            if (error.message && error.message.includes('does not exist')) {
                return { success: true }; // Idempotência: já não existe, sucesso.
            }
            console.error('❌ [SSH] Remove Failed:', error);
            throw error;
        }
    }

    /**
     * Verifica conectividade com a VPS
     */
    async checkConnectivity() {
        try {
            const res = await this._exec('echo "pong"');
            return res === 'pong';
        } catch (e) {
            console.error('❌ [SSH] Healthcheck Failed:', e.message);
            return false;
        }
    }
}

module.exports = RealVpnProvider;
