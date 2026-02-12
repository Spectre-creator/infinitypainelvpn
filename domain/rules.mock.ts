
import { Client, Reseller, UserRole, FinancialConfig } from '../types';

/**
 * 🧠 DOMAIN RULES (MOCK IMPLEMENTATION)
 * Centraliza toda a lógica de negócio. O Frontend deve apenas renderizar o resultado destas funções.
 */

export const DateRules = {
    format: (dateStr: string): string => {
        if (!dateStr) return '--/--/----';
        try {
            return new Date(dateStr).toLocaleDateString('pt-BR');
        } catch { return dateStr; }
    },
    formatTime: (dateStr: string): string => {
        if (!dateStr) return '--:--';
        try {
            return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } catch { return dateStr; }
    },
    isExpired: (dateStr: string): boolean => {
        return new Date(dateStr) < new Date();
    },
    calculateExpiry: (days: number): string => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString();
    }
};

export const FinancialRules = {
    formatBRL: (value: number | undefined): string => {
        if (value === undefined || value === null) return 'R$ 0,00';
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },
    calculateCommission: (price: number, feePercent: number): number => {
        return price * (feePercent / 100);
    },
    calculateCreditsFromAmount: (amount: number, creditPrice: number): number => {
        if (creditPrice <= 0) return 0;
        return Math.floor(amount / creditPrice);
    },
    getStatusColor: (status: string) => {
        switch (status) {
            case 'paid': 
            case 'approved': return 'text-green-400 bg-green-500/20';
            case 'pending': return 'text-yellow-400 bg-yellow-500/20';
            case 'withdrawn': return 'text-blue-300 bg-blue-900/50';
            case 'failed':
            case 'rejected': return 'text-red-400 bg-red-500/20';
            default: return 'text-gray-400 bg-gray-700';
        }
    },
    getTypeLabel: (type: string) => {
        const map: Record<string, string> = {
            'credit_purchase': 'Compra de Créditos',
            'store_sale': 'Venda Loja',
            'withdrawal': 'Saque Pix'
        };
        return map[type] || type;
    }
};

export const ClientRules = {
    getStatusBadge: (status: string) => {
        const styles: Record<string, string> = {
            'active': 'bg-green-500/10 text-green-500 border-green-500/20',
            'expired': 'bg-red-500/10 text-red-500 border-red-500/20',
            'blocked': 'bg-gray-700 text-gray-400 border-gray-600',
            'test': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
        };
        const labels: Record<string, string> = {
            'active': 'Vigente',
            'expired': 'Vencido',
            'blocked': 'Bloqueado',
            'test': 'Teste'
        };
        return {
            className: `px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${styles[status] || styles['blocked']}`,
            label: labels[status] || status
        };
    },
    getConnectionStatus: (isOnline: boolean) => ({
        color: isOnline ? 'text-green-400' : 'text-gray-400',
        dotClass: isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500',
        text: isOnline ? 'Online' : 'Offline'
    }),
    formatV2RayProtocol: (isV2Ray: boolean | undefined) => {
        if (isV2Ray) return { label: 'V2RAY', bg: 'bg-purple-900/50', text: 'text-purple-300' };
        return { label: 'SSH', bg: 'bg-slate-700', text: 'text-slate-300' };
    }
};

export const ResellerRules = {
    canCreateReseller: (userRole: UserRole) => userRole === UserRole.ADMIN,
    formatCredits: (credits: number) => credits.toString(),
    getStatusColor: (status: string) => status === 'active' ? 'text-green-400' : 'text-red-400'
};
