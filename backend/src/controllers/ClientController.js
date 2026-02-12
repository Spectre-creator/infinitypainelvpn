const ClientService = require('../services/ClientService');

class ClientController {
    
    async index(req, res, next) {
        try {
            const ownerId = req.user ? req.user.id : '1'; 
            const clients = await ClientService.listAll(ownerId);
            res.json(clients);
        } catch (error) { next(error); }
    }

    async create(req, res, next) {
        try {
            const owner = req.user || { id: '1', role: 'admin', credits: 999 };
            const client = await ClientService.createClient(req.body, owner);
            res.status(201).json({ success: true, data: client });
        } catch (error) { next(error); }
    }

    async getOwnDetails(req, res, next) {
        try {
            const { clientId } = req.client;
            const client = await ClientService.findById(clientId);
            if (!client) {
                return res.status(404).json({ error: 'Client not found' });
            }
            res.json({
                username: client.login,
                deviceId: client.uuid || null,
                expiry: new Date(client.expiryDate).getTime()
            });
        } catch(error) { next(error); }
    }

    async renew(req, res, next) {
        try {
            const owner = req.user || { id: '1', role: 'admin' };
            const { id, days } = req.body;
            const result = await ClientService.renewClient(id, days, owner);
            res.json({ success: true, data: result });
        } catch (error) { next(error); }
    }

    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await ClientService.deleteClient(id);
            res.json({ success: true });
        } catch (error) { next(error); }
    }

    async toggleStatus(req, res, next) {
        try {
            const { id } = req.body;
            const result = await ClientService.toggleStatus(id);
            res.json({ success: true, data: result });
        } catch (error) { next(error); }
    }
}

module.exports = new ClientController();