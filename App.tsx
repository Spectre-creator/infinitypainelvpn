
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Tests from './pages/Tests';
import Resellers from './pages/Resellers';
import Servers from './pages/Servers';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Remarketing from './pages/Remarketing'; 
import Financial from './pages/Financial';
import Application from './pages/Application'; 
import WhatsAppSim from './pages/WhatsAppSim';
import ResellerSales from './pages/ResellerSales'; // Checkout Revendedor
import Checkout from './pages/Checkout'; // Página Pública
import WhatsAppInstances from './pages/WhatsAppInstances'; // Multi-Device WA
import Affiliates from './pages/Affiliates'; 
import ChatbotConfigPage from './pages/ChatbotConfig'; // [NOVO]
import ResellerRegister from './pages/ResellerRegister'; // [NOVO]

// Higher order component for layout wrapping
const AppRoute = ({ component: Component }: { component: React.ComponentType }) => (
  <Layout children={<Component />} />
);

function App() {

  useEffect(() => {
    // Inicialização da lógica de backend já ocorre no import
    const applyTheme = () => {
        const storedSettings = localStorage.getItem('appSettings');
        if (storedSettings) {
            const data = JSON.parse(storedSettings);
            const root = document.documentElement;
            
            // Branding Colors
            if(data.primary_color) root.style.setProperty('--primary-color', data.primary_color);
            if(data.secondary_color) root.style.setProperty('--secondary-color', data.secondary_color);
            
            // Layout Colors (Customização Profunda)
            if(data.background_color) root.style.setProperty('--bg-color', data.background_color);
            if(data.card_color) root.style.setProperty('--card-bg-color', data.card_color);
            if(data.text_color) root.style.setProperty('--text-color', data.text_color);
            if(data.sidebar_text_color) root.style.setProperty('--sidebar-text-color', data.sidebar_text_color);

            if(data.app_name) document.title = data.app_name;

            // Apply Favicon
            if (data.favicon_url) {
                let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
                if (!link) {
                    link = document.createElement('link');
                    link.rel = 'icon';
                    document.getElementsByTagName('head')[0].appendChild(link);
                }
                link.href = data.favicon_url;
            }
        } else {
            // Defaults (Caso não tenha config salva)
            const root = document.documentElement;
            root.style.setProperty('--bg-color', '#0a0a0f');
            root.style.setProperty('--card-bg-color', '#11111e');
            root.style.setProperty('--text-color', '#fafafc');
            root.style.setProperty('--sidebar-text-color', '#9ca3af');
            root.style.setProperty('--primary-color', '#8b5cf6');
            root.style.setProperty('--secondary-color', '#6366f1');
        }
    };

    applyTheme();
    window.addEventListener('settingsUpdated', applyTheme);
    
    // A lógica de interceptação de afiliados foi removida do frontend.
    // Ela será implementada no backend para garantir a execução confiável das comissões.

    return () => {
        window.removeEventListener('settingsUpdated', applyTheme);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/checkout/:publicId" element={<Checkout />} />
        <Route path="/register" element={<ResellerRegister />} /> {/* Rota Pública */}
        
        {/* Protected Routes */}
        <Route path="/" element={<AppRoute component={Dashboard} />} />
        <Route path="/clients" element={<AppRoute component={Clients} />} />
        <Route path="/tests" element={<AppRoute component={Tests} />} />
        <Route path="/resellers" element={<AppRoute component={Resellers} />} />
        <Route path="/affiliates" element={<AppRoute component={Affiliates} />} />
        <Route path="/servers" element={<AppRoute component={Servers} />} />
        <Route path="/application" element={<AppRoute component={Application} />} />
        <Route path="/logs" element={<AppRoute component={Logs} />} />
        <Route path="/settings" element={<AppRoute component={Settings} />} />
        <Route path="/remarketing" element={<AppRoute component={Remarketing} />} />
        <Route path="/financial" element={<AppRoute component={Financial} />} />
        <Route path="/whatsapp-sim" element={<AppRoute component={WhatsAppSim} />} />
        <Route path="/reseller-sales" element={<AppRoute component={ResellerSales} />} />
        <Route path="/whatsapp-instances" element={<AppRoute component={WhatsAppInstances} />} />
        <Route path="/chatbot-config" element={<AppRoute component={ChatbotConfigPage} />} />
        
        {/* Rota Padrão */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
