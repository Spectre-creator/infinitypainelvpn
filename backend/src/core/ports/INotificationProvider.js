
/**
 * CONTRACT: INotificationProvider
 * Abstrai o envio de mensagens (Email/WhatsApp).
 */
class INotificationProvider {
    async sendEmail(to, subject, body) { throw new Error('Method not implemented'); }
    async sendWhatsApp(instanceId, phone, message) { throw new Error('Method not implemented'); }
}

module.exports = INotificationProvider;
