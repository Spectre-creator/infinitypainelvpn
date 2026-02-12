
// services/api.ts

const API_BASE = '/api';

export async function apiRequest(endpoint: string, method: string = 'GET', body?: any) {
    const token = localStorage.getItem('token');
    
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        // Interceptor: Sessão Expirada
        if (response.status === 401) {
            console.warn('[API] Sessão expirada ou inválida.');
            localStorage.removeItem('token');
            localStorage.removeItem('vpn_current_user');
            
            // Redirecionar apenas se não estiver já no login
            if (!window.location.hash.includes('/login')) {
                window.location.href = '/#/login';
            }
            throw new Error('Sessão expirada. Faça login novamente.');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || 'Erro desconhecido na API');
        }

        return data;
    } catch (error: any) {
        console.error(`[API ERROR] ${method} ${endpoint}:`, error);
        throw error;
    }
}
