
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Timer, Briefcase, Server, FileText, Settings, LogOut, Bell, Megaphone,
  DollarSign, Smartphone, CheckCircle, XCircle, Info, ShieldCheck, Menu, X, AlertTriangle,
  MessageCircle, ShoppingBag, Network, Share2, Bot, ChevronRight, LogIn
} from 'lucide-react';
import { Backend } from '../services/mockBackend';
import { UserRole, Notification, User } from '../types';
import { MockEnv } from '../config/mockEnv';
import { Features } from '../config/features';

interface LayoutProps {
  children: React.ReactNode;
}

const MENU_ITEMS = [
  { title: 'Dashboard', path: '/', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.RESELLER] },
  { title: 'Gerar Vendas', path: '/reseller-sales', icon: ShoppingBag, roles: [UserRole.RESELLER, UserRole.ADMIN] },
  { title: 'Clientes', path: '/clients', icon: Users, roles: [UserRole.ADMIN, UserRole.RESELLER] },
  { title: 'Testes', path: '/tests', icon: Timer, roles: [UserRole.ADMIN, UserRole.RESELLER] },
  { title: 'Revendedores', path: '/resellers', icon: Briefcase, roles: [UserRole.ADMIN] }, 
  { title: 'Rede Afiliados', path: '/affiliates', icon: Share2, roles: [UserRole.ADMIN, UserRole.RESELLER], feature: Features.ENABLE_SUB_RESELLING },
  { title: 'Servidores', path: '/servers', icon: Server, roles: [UserRole.ADMIN] }, 
  { title: 'Aplicativo', path: '/application', icon: Smartphone, roles: [UserRole.ADMIN] }, 
  { title: 'Financeiro', path: '/financial', icon: DollarSign, roles: [UserRole.ADMIN, UserRole.RESELLER] }, 
  { title: 'Configurar Bot', path: '/chatbot-config', icon: Bot, roles: [UserRole.ADMIN], feature: Features.ENABLE_CHATBOT_V2 },
  { title: 'Atendimento IA', path: '/whatsapp-sim', icon: MessageCircle, roles: [UserRole.ADMIN, UserRole.RESELLER] },
  { title: 'Instâncias WA', path: '/whatsapp-instances', icon: Network, roles: [UserRole.ADMIN] },
  { title: 'Remarketing', path: '/remarketing', icon: Megaphone, roles: [UserRole.ADMIN, UserRole.RESELLER] },
  { title: 'Logs', path: '/logs', icon: FileText, roles: [UserRole.ADMIN, UserRole.RESELLER] },
  { title: 'Configurações', path: '/settings', icon: Settings, roles: [UserRole.ADMIN, UserRole.RESELLER] },
];

interface ToastMsg {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

export default function Layout({ children }: LayoutProps) {
  const [appName, setAppName] = useState('Infinity SSH');
  const [logoUrl, setLogoUrl] = useState('');
  const [user, setUser] = useState(Backend.getCurrentUser());
  const [impersonator, setImpersonator] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { setIsSidebarOpen(false); }, [location]);

  useEffect(() => {
    const updateBranding = () => {
        const stored = localStorage.getItem('appSettings');
        if (stored) {
            const data = JSON.parse(stored);
            setAppName(data.app_name);
            setLogoUrl(data.logo_url);
        }
    };
    const checkImpersonation = () => {
        const impersonatorData = localStorage.getItem('vpn_impersonator');
        setImpersonator(impersonatorData ? JSON.parse(impersonatorData) : null);
    };

    updateBranding();
    checkImpersonation();
    setUser(Backend.getCurrentUser());
    window.addEventListener('settingsUpdated', updateBranding);
    return () => window.removeEventListener('settingsUpdated', updateBranding);
  }, []);

  useEffect(() => {
      const handleSysToast = (event: any) => {
          const { message, type } = event.detail;
          const id = Date.now();
          setToasts(prev => [...prev, { id, message, type }]);
          setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
      };
      window.addEventListener('sys_toast', handleSysToast);
      return () => window.removeEventListener('sys_toast', handleSysToast);
  }, []);

  useEffect(() => {
      const fetchNotifications = () => {
          if (user) {
              const all = Backend.getNotifications(user.id);
              setNotifications(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          }
      };
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 5000); 
      window.addEventListener('db_update', fetchNotifications); 
      const handleClickOutside = (event: MouseEvent) => {
          if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
              setShowNotifications(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
          clearInterval(interval);
          window.removeEventListener('db_update', fetchNotifications);
          document.removeEventListener('mousedown', handleClickOutside);
      };
  }, [user]);

  const handleLogout = () => { Backend.logout(); navigate('/login'); };
  const handleStopImpersonation = () => {
    Backend.stopImpersonation();
    navigate('/resellers');
    window.location.reload(); // Forçar recarga completa para limpar estados
  };
  const handleMarkAsRead = (id: string) => {
      Backend.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  const handleMarkAllRead = () => {
      if(user) {
          Backend.markAllNotificationsAsRead(user.id);
          setNotifications(prev => prev.map(n => ({...n, read: true})));
      }
  };

  const userRole = user?.role || UserRole.CLIENT;
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen bg-bg-main text-text font-sans selection:bg-primary-500/30 selection:text-white pb-20 md:pb-0 ${impersonator ? 'pt-10' : ''}`}>
      
      {/* IMPERSONATION BANNER */}
      {impersonator && (
          <div className="fixed top-0 inset-x-0 h-10 bg-yellow-500 text-black flex items-center justify-center z-[9999] text-sm font-bold shadow-lg">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Você está visualizando como <span className="mx-1 px-2 py-0.5 bg-black/10 rounded">{user?.username}</span>.
              <button onClick={handleStopImpersonation} className="ml-4 text-xs font-bold uppercase bg-white/30 hover:bg-white/50 px-3 py-1 rounded-full transition-colors">
                  Voltar para Admin
              </button>
          </div>
      )}

      {/* WATERMARK HUD */}
      {MockEnv.IS_MOCK && (
          <div className={`fixed top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 z-[9998] opacity-70 ${impersonator ? 'top-10' : 'top-0'}`}></div>
      )}

      {/* TOAST NOTIFICATIONS */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
          {toasts.map(toast => (
              <div 
                  key={toast.id} 
                  className={`glass-card pointer-events-auto flex items-center p-4 rounded-2xl shadow-glow w-[90vw] md:w-96 animate-in slide-in-from-right duration-300 ${
                      toast.type === 'success' ? 'border-success/30 text-success' : 
                      toast.type === 'error' ? 'border-error/30 text-error' : 
                      'border-info/30 text-info'
                  }`}
              >
                  {toast.type === 'success' && <CheckCircle className="w-5 h-5 mr-3 shrink-0" />}
                  {toast.type === 'error' && <XCircle className="w-5 h-5 mr-3 shrink-0" />}
                  {toast.type === 'info' && <Info className="w-5 h-5 mr-3 shrink-0" />}
                  <span className="font-medium text-sm text-text">{toast.message}</span>
              </div>
          ))}
      </div>

      {/* MOBILE OVERLAY */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* SIDEBAR */}
      <aside 
        className={`fixed left-0 bottom-0 z-50 w-72 bg-bg-card border-r border-white/5 transition-transform duration-300 ease-out md:translate-x-0 flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${impersonator ? 'top-10' : 'top-0'}`}
      >
        {/* Brand Area */}
        <div className="h-20 flex items-center px-6 border-b border-white/5 bg-bg-card/50 backdrop-blur-md">
          {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-8 w-auto mr-3" />
          ) : (
              <div className="w-10 h-10 rounded-xl bg-grad-violet flex items-center justify-center mr-3 shadow-glow">
                  <span className="font-bold text-white text-xl">∞</span>
              </div>
          )}
          <span className="text-xl font-bold tracking-tight text-white">{appName}</span>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden ml-auto text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto no-scrollbar">
          {MENU_ITEMS
            .filter(item => item.roles.includes(userRole))
            .filter(item => item.feature === undefined || item.feature === true)
            .map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative ${
                  isActive 
                    ? 'text-white shadow-glow bg-grad-violet' 
                    : 'text-sidebar-text-color hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className={`w-5 h-5 mr-3 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-primary-400'}`} />
                <span>{item.title}</span>
                {isActive && <ChevronRight className="w-5 h-5 ml-auto opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-bg-card">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-sidebar-text-color rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" /> Sair do Painel
          </button>
        </div>
      </aside>

      {/* TOPBAR (Desktop) */}
      <header className={`fixed right-0 left-0 md:left-72 h-20 z-30 px-4 md:px-8 flex items-center justify-between glass border-b border-white/5 ${impersonator ? 'top-10' : 'top-0'}`}>
          <div className="flex items-center">
             <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-gray-400 hover:text-white mr-2">
                <Menu className="w-6 h-6" />
             </button>
             <h2 className="text-2xl font-bold text-white hidden md:block tracking-tight">
                 {MENU_ITEMS.find(i => i.path === location.pathname)?.title || 'Painel'}
             </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all relative"
                >
                   <Bell className="w-5 h-5" />
                   {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-bg-card animate-pulse"></span>}
                </button>

                {showNotifications && (
                    <div className="absolute right-0 top-14 w-80 bg-bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <span className="text-xs font-bold uppercase text-gray-400">Notificações</span>
                            {unreadCount > 0 && <button onClick={handleMarkAllRead} className="text-xs text-primary-400 hover:text-primary-300">Marcar lidas</button>}
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">Nada por aqui.</div>
                            ) : (
                                notifications.map(notif => (
                                    <div key={notif.id} onClick={() => handleMarkAsRead(notif.id)} className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${notif.read ? 'opacity-50' : 'bg-primary-500/5'}`}>
                                        <div className="flex gap-3">
                                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notif.read ? 'bg-gray-600' : 'bg-primary-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]'}`}></div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white mb-1">{notif.title}</h4>
                                                <p className="text-xs text-gray-400 leading-relaxed">{notif.message}</p>
                                                <span className="text-[10px] text-gray-600 mt-2 block">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {/* User Profile */}
            <div className="flex items-center pl-4 md:border-l border-white/10">
               <div className="hidden md:flex flex-col items-end mr-3">
                  <span className="text-sm font-bold text-white">{user?.username}</span>
                  <span className="text-[10px] uppercase font-bold text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded">{userRole}</span>
               </div>
               <div className="w-10 h-10 rounded-full p-[2px] bg-grad-violet">
                   <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}&background=11111e&color=fff`} className="w-full h-full rounded-full object-cover border-2 border-bg-card" alt="Avatar" />
               </div>
            </div>
          </div>
      </header>

      {/* CONTENT WRAPPER */}
      <main className="md:pl-72 pt-24 px-4 md:px-8 max-w-[1600px] mx-auto min-h-screen">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
      </main>

    </div>
  );
}
