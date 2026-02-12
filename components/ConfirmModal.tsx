
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Excluir',
    cancelText = 'Cancelar'
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[99] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div 
                className="glass-card border border-error/30 p-6 rounded-2xl w-full max-w-sm relative shadow-2xl animate-in zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-error/10 border border-error/20 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-error" />
                    </div>
                    <h3 className="text-xl font-bold text-text mb-2">{title}</h3>
                    <p className="text-sm text-muted mb-6">{message}</p>
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-muted font-bold py-3 rounded-xl transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 bg-error hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-900/30 transition-colors"
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
