
import React, { useEffect, useState } from 'react';
import { PricingSvc } from '../services/financial';
import { Plan } from '../types';
import { Check, Star, ShoppingCart } from 'lucide-react';

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    // Carregar planos ativos do serviço
    const loadPlans = () => {
        const allPlans = PricingSvc.getPlans();
        // Filtrar apenas planos de cliente e ativos para exibição pública
        setPlans(allPlans.filter(p => p.active && p.type === 'client'));
    };
    loadPlans();
    window.addEventListener('financial_update', loadPlans);
    return () => window.removeEventListener('financial_update', loadPlans);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white text-center mb-8">Nossos Planos</h2>
      
      {plans.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
              Nenhum plano disponível no momento.
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => {
                const isFeatured = plan.isFeatured;
                return (
                    <div 
                        key={plan.id} 
                        className={`relative rounded-2xl p-6 flex flex-col ${
                            isFeatured 
                            ? 'bg-gradient-to-b from-primary-900 to-dark-800 border-2 border-primary-500 shadow-2xl shadow-primary-500/20 transform md:-translate-y-4' 
                            : 'bg-dark-800 border border-white/5'
                        }`}
                    >
                        {isFeatured && (
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                                Mais Popular
                            </div>
                        )}
                        
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                            <div className="flex items-baseline mt-4">
                                <span className="text-3xl font-bold text-white">R$ {plan.price.toFixed(2)}</span>
                                <span className="text-slate-400 ml-1">/{plan.duration} dias</span>
                            </div>
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                            <li className="flex items-center text-sm text-slate-300">
                                <Check className="w-5 h-5 text-emerald-400 mr-3" />
                                <span>{plan.maxConnections} Conexão(ões) Simultânea(s)</span>
                            </li>
                            <li className="flex items-center text-sm text-slate-300">
                                <Check className="w-5 h-5 text-emerald-400 mr-3" />
                                <span>Tráfego Ilimitado</span>
                            </li>
                            <li className="flex items-center text-sm text-slate-300">
                                <Check className="w-5 h-5 text-emerald-400 mr-3" />
                                <span>Servidores Premium BR/US</span>
                            </li>
                            <li className="flex items-center text-sm text-slate-300">
                                <Check className="w-5 h-5 text-emerald-400 mr-3" />
                                <span>Suporte 24/7</span>
                            </li>
                            {isFeatured && (
                                <li className="flex items-center text-sm text-slate-300">
                                    <Star className="w-5 h-5 text-amber-400 mr-3" />
                                    <span>Prioridade na Fila</span>
                                </li>
                            )}
                        </ul>

                        <button className={`w-full py-3 rounded-lg font-bold transition-all flex justify-center items-center ${
                            isFeatured
                            ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/30'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Contratar Agora
                        </button>
                    </div>
                );
            })}
        </div>
      )}
    </div>
  );
}
