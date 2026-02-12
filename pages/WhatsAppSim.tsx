
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { handleMessage } from '../services/ai/aiRouter';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot' | 'system';
}

export default function WhatsAppSim() {
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: "Olá! Este é um simulador de atendimento via WhatsApp. Digite uma mensagem contendo uma palavra-chave como 'teste', 'valor' ou 'instalar' para ver o chatbot em ação.", sender: 'system' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (input.trim() === '' || isLoading) return;

        const userMessage: Message = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const aiResponse = await handleMessage(userMessage.text);

        if (aiResponse) {
            const botMessage: Message = { id: Date.now() + 1, text: aiResponse, sender: 'bot' };
            setMessages(prev => [...prev, botMessage]);
        }
        
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] max-w-3xl mx-auto glass-card rounded-2xl shadow-2xl overflow-hidden">
            <header className="bg-bg-main/50 p-4 border-b border-white/10 flex items-center">
                <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center mr-3 border border-success/30">
                    <Bot className="w-6 h-6 text-success"/>
                </div>
                <div>
                    <h2 className="font-bold text-text">VPN Nexus - Atendimento IA</h2>
                    <p className="text-xs text-success flex items-center">
                        <span className="w-2 h-2 bg-success rounded-full mr-1.5 animate-pulse"></span>
                        Online
                    </p>
                </div>
            </header>

            <main className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'bot' && <Bot className="w-6 h-6 text-primary self-start shrink-0"/>}
                        
                        <div className={`max-w-md p-3 rounded-lg text-text ${
                            msg.sender === 'user' ? 'bg-success/20' :
                            msg.sender === 'bot' ? 'bg-bg-main' :
                            'bg-warning/10 text-warning border border-warning/20 text-sm italic w-full'
                        }`}>
                            {msg.text.split('\\n').map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                        
                        {msg.sender === 'user' && <User className="w-6 h-6 text-muted self-start shrink-0"/>}
                    </div>
                ))}
                {isLoading && (
                     <div className="flex items-end gap-2 justify-start">
                        <Bot className="w-6 h-6 text-primary self-start shrink-0"/>
                        <div className="max-w-md p-3 rounded-lg text-text bg-bg-main flex items-center">
                             <Loader2 className="w-4 h-4 mr-2 animate-spin text-muted"/>
                             <span>Digitando...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            <footer className="bg-bg-main/50 p-4 border-t border-white/10">
                <div className="flex items-center bg-bg-main rounded-xl p-1 border border-white/10 focus-within:border-primary/50 transition-colors">
                    <input 
                        type="text" 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSend()}
                        placeholder="Digite sua mensagem aqui..."
                        className="flex-1 bg-transparent px-3 py-2 text-text placeholder-muted focus:outline-none"
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={isLoading || input.trim() === ''} className="bg-success hover:bg-emerald-600 text-white p-2 rounded-lg disabled:opacity-50 transition-colors">
                        <Send className="w-5 h-5"/>
                    </button>
                </div>
            </footer>
        </div>
    );
}
