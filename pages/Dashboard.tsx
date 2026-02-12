
import React, { useEffect, useState } from 'react';
import { Users, Timer, Briefcase, Wifi, Activity, ArrowUpRight, FileText, Plus } from 'lucide-react';
import { MOCK_USER, MOCK_LIMITS } from '../services/mockData';
import { Backend } from '../services/mockBackend';
import { Stats } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Seg', users: 400 },
  { name: 'Ter', users: 300 },
  { name: 'Qua', users: 550 },
  { name: 'Qui', users: 480 },
  { name: 'Sex', users: 690 },
  { name: 'Sab', users: 800 },
  { name: 'Dom', users: 750 },
];

const StatCard = ({ title, value, icon: Icon, colorClass, gradient }: any) => (
  <div className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
    <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${gradient}`}></div>
    
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`p-3 rounded-xl bg-bg-main border border-white/5 ${colorClass} shadow-lg`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    
    <div className="relative z-10">
      <h3 className="text-3xl font-bold text-text mb-1 tracking-tight">{value}</h3>
      <p className="text-muted text-sm font-medium">{title}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const user = Backend.getCurrentUser() || MOCK_USER;

  useEffect(() => {
    const loadStats = () => setStats(Backend.getStats());
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <div className="p-10 text-white flex justify-center"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-8">
      {/* Welcome Hero */}
      <div className="w-full rounded-2xl glass-card p-6 md:p-8 flex flex-col md:flex-row items-center justify-between">
          <div>
              <h1 className="text-3xl font-bold text-text mb-1">Bem-vindo, {user.username}!</h1>
              <p className="text-muted">Aqui está o que está acontecendo na sua rede hoje.</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
              <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-text text-sm font-bold transition-colors flex items-center">
                <FileText className="w-4 h-4 mr-2"/> Ver Relatórios
              </button>
              <button className="px-5 py-2.5 bg-grad-violet hover:shadow-glow-hover rounded-xl text-white text-sm font-bold shadow-glow transition-all flex items-center">
                <Plus className="w-4 h-4 mr-2"/> Gerar Teste
              </button>
          </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="Clientes Ativos" 
            value={stats.totalClients} 
            icon={Users} 
            colorClass="text-blue-400"
            gradient="from-blue-600 to-cyan-500" 
        />
        <StatCard 
            title="Testes Online" 
            value={stats.activeTests} 
            icon={Timer} 
            colorClass="text-warning"
            gradient="from-yellow-500 to-orange-500"
        />
        <StatCard 
            title="Revendedores" 
            value={stats.resellers} 
            icon={Briefcase} 
            colorClass="text-primary-400"
            gradient="from-primary to-secondary"
        />
        <StatCard 
            title="Conexões Reais" 
            value={stats.onlineConnections} 
            icon={Wifi} 
            colorClass="text-success"
            gradient="from-emerald-500 to-green-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 md:p-8">
           <div className="flex justify-between items-center mb-8">
               <div>
                   <h3 className="text-lg font-bold text-text">Atividade de Conexões</h3>
                   <p className="text-xs text-muted">Novos usuários nos últimos 7 dias</p>
               </div>
               <div className="flex items-center gap-2">
                   <span className="text-xs text-muted">Downloads</span>
                   <div className="w-3 h-3 rounded-full bg-grad-violet"></div>
               </div>
           </div>
           
           <div className="h-72 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={data}>
                 <defs>
                   <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.4}/>
                     <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                 <XAxis dataKey="name" stroke="var(--sidebar-text-color)" axisLine={false} tickLine={false} dy={10} fontSize={12} />
                 <YAxis stroke="var(--sidebar-text-color)" axisLine={false} tickLine={false} dx={-10} fontSize={12} />
                 <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card-bg-color)', borderColor: 'rgba(139, 92, 246, 0.1)', color: 'var(--text-color)', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: 'var(--text-color)' }}
                    cursor={{ stroke: 'var(--primary-color)', strokeWidth: 2, strokeDasharray: '5 5' }}
                 />
                 <Area type="monotone" dataKey="users" stroke="var(--primary-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* User Card */}
        <div className="glass-card rounded-2xl p-6 flex flex-col relative overflow-hidden">
           <div className="absolute top-0 inset-x-0 h-32 bg-grad-dark pointer-events-none"></div>
           
           <div className="relative z-10 flex flex-col items-center mt-4">
              <div className="w-28 h-28 rounded-full p-1 bg-grad-violet shadow-glow mb-4">
                  <img alt="User Avatar" src={user.avatar} className="w-full h-full rounded-full bg-bg-main object-cover border-4 border-bg-card" />
              </div>
              <h3 className="text-xl font-bold text-text">{user.username}</h3>
              <span className="text-xs font-bold uppercase tracking-wider text-primary-400 bg-primary-500/10 px-3 py-1 rounded-full mt-2 border border-primary-500/20">
                  {user.role === 'admin' ? 'Administrador' : 'Revendedor'}
              </span>
           </div>

           <div className="mt-auto pt-8 space-y-5">
               <div>
                   <div className="flex justify-between text-xs font-bold text-muted uppercase mb-2">
                       <span>Uso de Licenças</span>
                       <span className="text-text">{MOCK_LIMITS.used} / {MOCK_LIMITS.total}</span>
                   </div>
                   <div className="h-2 bg-bg-main rounded-full overflow-hidden border border-white/5">
                       <div className="h-full bg-grad-cyan rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" style={{width: '65%'}}></div>
                   </div>
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                   <div className="bg-bg-main rounded-xl p-3 border border-white/5 text-center">
                       <p className="text-xs text-muted">Status</p>
                       <p className="text-sm font-bold text-success flex justify-center items-center gap-1.5">
                           <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span> Ativo
                       </p>
                   </div>
                   <div className="bg-bg-main rounded-xl p-3 border border-white/5 text-center">
                       <p className="text-xs text-muted">Vencimento</p>
                       <p className="text-sm font-bold text-text">{user.expiration}</p>
                   </div>
               </div>
           </div>
        </div>
      </div>
    </div>
  );
}
