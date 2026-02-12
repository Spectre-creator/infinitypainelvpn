
import React, { useEffect, useState } from 'react';
import { Backend } from '../services/mockBackend';
import { Log } from '../types';
import { FileText } from 'lucide-react';

export default function Logs() {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    setLogs(Backend.getLogs());
    
    // Atualizar se houver novas ações
    const interval = setInterval(() => {
        setLogs(Backend.getLogs());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-text flex items-center">
        <FileText className="w-6 h-6 mr-3 text-primary" />
        Logs do Sistema
      </h2>
      
      <div className="glass-card rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                <tr className="bg-bg-main/50 border-b border-white/10 text-muted text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold">Data/Hora</th>
                    <th className="p-4 font-semibold">Usuário</th>
                    <th className="p-4 font-semibold">Ação</th>
                    <th className="p-4 font-semibold text-right">IP</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-muted whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-4 font-medium text-text">
                        {log.username}
                    </td>
                    <td className="p-4 text-gray-300">
                        <span className="font-bold text-primary mr-1">{log.action}:</span> {log.message}
                    </td>
                    <td className="p-4 text-right">
                        <span className="font-mono text-xs bg-bg-main px-2 py-1 rounded text-primary-400 border border-primary/20">
                            {log.ip}
                        </span>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
