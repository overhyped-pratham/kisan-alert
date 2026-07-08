import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Camera, Mic, Bell, User, Languages, MapPin } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { language, setLanguage, userProfile } = useAppStore();
  
  const currentPath = location.pathname;

  // Language translation helper
  const t = {
    hi: {
      home: 'होम',
      scan: 'स्कैन',
      askAi: 'पूछें AI',
      alerts: 'अलर्ट',
      profile: 'प्रोफाइल',
    },
    en: {
      home: 'Home',
      scan: 'Scan',
      askAi: 'Ask AI',
      alerts: 'Alerts',
      profile: 'Profile',
    },
    mr: {
      home: 'होम',
      scan: 'स्कैन',
      askAi: 'विचारा AI',
      alerts: 'अलर्ट',
      profile: 'प्रोफाइल',
    }
  }[language] || {
    home: 'Home',
    scan: 'Scan',
    askAi: 'Ask AI',
    alerts: 'Alerts',
    profile: 'Profile',
  };

  const getGreeting = () => {
    const name = userProfile?.name;
    if (language === 'hi') {
      return name ? `नमस्ते, ${name}` : 'नमस्ते, रमेश';
    }
    if (language === 'mr') {
      return name ? `नमस्कार, ${name}` : 'नमस्कार, रमेश';
    }
    return name ? `Namaste, ${name}` : 'Namaste, Ramesh';
  };

  const getLocation = () => {
    if (userProfile?.districtState) {
      return userProfile.village 
        ? `${userProfile.village}, ${userProfile.districtState}`
        : userProfile.districtState;
    }
    if (language === 'hi') {
      return 'इन्दौर, मध्य प्रदेश';
    }
    if (language === 'mr') {
      return 'इन्दौर, महाराष्ट्र';
    }
    return 'Indore, MP';
  };

  const toggleLanguage = () => {
    if (language === 'hi') setLanguage('en');
    else if (language === 'en') setLanguage('mr');
    else setLanguage('hi');
  };

  const navItems = [
    { path: '/dashboard', label: t.home, icon: Home },
    { path: '/crop-disease', label: t.scan, icon: Camera },
    { path: '/ask-ai', label: t.askAi, icon: Mic, isSpecial: true },
    { path: '/alerts', label: t.alerts, icon: Bell },
    { path: '/profile', label: t.profile, icon: User },
  ];

  return (
    <div className="min-h-screen w-full bg-surface-container-low flex justify-center items-start sm:items-center">
      {/* 430px Mobile-viewport container */}
      <div className="w-full max-w-[430px] h-[100dvh] sm:h-[800px] sm:max-h-[100dvh] bg-background sm:rounded-xl sm:shadow-m3-1 flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <header className="bg-background px-5 py-4 flex items-center justify-between border-b border-surface-container-high rounded-b-lg">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold font-outfit text-on-surface flex items-center gap-1">
              <span className="text-xl">👋</span> {getGreeting()}
            </h1>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-outline font-outfit">
              <MapPin size={12} className="text-secondary" />
              <span>{getLocation()}</span>
            </div>
          </div>
          
          {/* Language Toggle Circle Button */}
          <button 
            onClick={toggleLanguage}
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high active:scale-95 transition-all text-on-surface"
            aria-label="Toggle Language"
            id="lang-toggle-btn"
          >
            <Languages size={18} />
          </button>
        </header>

        {/* Dynamic page content */}
        <main className="flex-1 overflow-y-auto px-5 pt-4 pb-[calc(72px+1rem+env(safe-area-inset-bottom,0px))]">
          <Outlet />
        </main>

        {/* Bottom Tab Bar Navigation */}
        <nav className="absolute bottom-0 left-0 right-0 h-[calc(72px+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] bg-surface-container-lowest border-t border-surface-container-high flex justify-around items-center px-2 z-50">
          {navItems.map((item) => {
            const isActive = currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path));
            const Icon = item.icon;

            if (item.isSpecial) {
              return (
                <div key={item.path} className="relative flex flex-col items-center -mt-8">
                  {/* Floating Action Button */}
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-16 h-16 rounded-full flex items-center justify-center shadow-m3-2 transition-all active:scale-90 ${
                      isActive 
                        ? 'bg-primary text-on-primary ring-4 ring-primary/20' 
                        : 'bg-primary text-on-primary hover:bg-primary-container'
                    }`}
                    aria-label={item.label}
                    id="nav-ask-ai-btn"
                  >
                    <Icon size={32} />
                  </button>
                  <span className={`text-[10px] font-outfit mt-1 font-semibold ${isActive ? 'text-primary font-bold' : 'text-outline'}`}>
                    {item.label}
                  </span>
                </div>
              );
            }

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center flex-1 py-1"
                aria-label={item.label}
                id={`nav-${item.label.toLowerCase()}-btn`}
              >
                <div className={`p-1 px-3 rounded-full mb-1 transition-all ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-outline hover:text-on-surface'
                }`}>
                  <Icon size={20} />
                </div>
                <span className={`text-[10px] font-outfit ${isActive ? 'text-primary font-semibold' : 'text-outline'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
