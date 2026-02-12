
const SettingsService = require('../services/SettingsService');

class ChatbotController {
    
    async getConfig(req, res, next) {
        try {
            const settings = await SettingsService.getSettings();
            // Retorna apenas a chave de configuração do chatbot
            res.json(settings.chatbot_config || {});
        } catch (error) {
            next(error);
        }
    }

    async saveConfig(req, res, next) {
        try {
            const newChatbotConfig = req.body;
            // Busca as configurações atuais para mesclar
            const currentSettings = await SettingsService.getSettings();
            
            const updatedSettings = {
                ...currentSettings,
                chatbot_config: newChatbotConfig
            };

            await SettingsService.updateSettings(updatedSettings);
            res.json({ success: true, message: 'Configuração do Chatbot salva.' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ChatbotController();
