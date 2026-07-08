import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CloudSun, 
  Droplet, 
  CloudRain, 
  Sparkles, 
  Sprout, 
  Camera, 
  Mic, 
  CloudSunRain, 
  AlertTriangle, 
  ChevronRight, 
  TrendingUp 
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { alertsService } from '../services/alerts.service';
import { profileService } from '../services/profile.service';
import { WeatherAdvisory, UserProfile, AlertItem } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, setUserProfile } = useAppStore();
  
  const [weather, setWeather] = useState<WeatherAdvisory | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load mock data from services
    const loadData = async () => {
      try {
        const weatherData = await alertsService.getWeatherAdvisory('Indore');
        const alertList = await alertsService.getAlertsList();
        const farmerProfile = await profileService.getProfile();
        
        setWeather(weatherData);
        setAlerts(alertList);
        setProfile(farmerProfile);
        setUserProfile(farmerProfile);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [setUserProfile]);

  // Handle translations based on store language
  const t = {
    hi: {
      aiRec: 'AI द्वारा अनुशंसित',
      diseaseRisk: 'बीमारी का खतरा: कम',
      todayRec: 'आज की AI सलाह',
      waterAdvice: 'शाम ५ बजे से पहले फसलों को पानी दें',
      rainAdvice: 'कल बारिश की उम्मीद है',
      fertilizerAdvice: 'बारिश के बाद खाद डालने की सलाह दी जाती है',
      quickActions: 'त्वरित विकल्प',
      grow: 'क्या उगाएं?',
      growDesc: 'फसल की सलाह प्राप्त करें।',
      check: 'फसल जांचें',
      checkDesc: 'बीमारी का पता लगाएं।',
      ask: 'पूछें AI',
      askDesc: 'आवाज से प्रश्न पूछें।',
      weather: 'मौसम विवरण',
      weatherDesc: 'पूर्वानुमान और सलाह।',
      scanBtn: 'फसल स्कैन करें',
      farmHealth: 'खेत का स्वास्थ्य',
      healthy: 'स्वस्थ',
      lastUpdated: '२ घंटे पहले अपडेट किया गया',
      recentAlerts: 'हाल के अलर्ट',
      viewAll: 'सभी देखें',
      mandiTitle: 'मंडी भाव',
      mandiDesc: 'इन्दौर बाजार में गेहूं और सोयाबीन की कीमतें देखें।',
    },
    en: {
      aiRec: 'AI Recommended',
      diseaseRisk: 'Disease Risk: LOW',
      todayRec: "Today's AI Recommendation",
      waterAdvice: 'Water crops before 5 PM',
      rainAdvice: 'Rain expected tomorrow',
      fertilizerAdvice: 'Fertilizer application recommended after rainfall',
      quickActions: 'QUICK ACTIONS',
      grow: 'What Should I Grow?',
      growDesc: 'Get the best crop recommendation.',
      check: 'Check My Crop',
      checkDesc: 'Detect crop diseases using AI.',
      ask: 'Ask Kisan AI',
      askDesc: 'Ask farming questions using voice.',
      weather: 'Weather Details',
      weatherDesc: 'View forecast and advice.',
      scanBtn: 'Scan My Crop',
      farmHealth: 'FARM HEALTH',
      healthy: 'Healthy',
      lastUpdated: 'Last updated: 2 hours ago',
      recentAlerts: 'Recent Alerts',
      viewAll: 'View All',
      mandiTitle: 'Mandi Prices',
      mandiDesc: 'Check current rates for Wheat and Soy in Indore Market.',
    },
    mr: {
      aiRec: 'AI शिफारस केलेले',
      diseaseRisk: 'रोगाचा धोका: कमी',
      todayRec: 'आजची AI शिफारस',
      waterAdvice: 'संध्याकाळी ५ पूर्वी पिकांना पाणी द्या',
      rainAdvice: 'उद्या पावसाची शक्यता आहे',
      fertilizerAdvice: 'पावसानंतर खत घालण्याची शिफारस केली जाते',
      quickActions: 'जलद पर्याय',
      grow: 'काय उगवावे?',
      growDesc: 'पिकाचा सल्ला मिळवा.',
      check: 'पीक तपासा',
      checkDesc: 'रोगाचे निदान करा.',
      ask: 'विचारा AI',
      askDesc: 'आवाजाद्वारे प्रश्न विचारा.',
      weather: 'हवामान तपशील',
      weatherDesc: 'अंदाज आणि सल्ला.',
      scanBtn: 'पीक स्कॅन करा',
      farmHealth: 'शेतीचे आरोग्य',
      healthy: 'निरोगी',
      lastUpdated: '२ तासांपूर्वी अपडेट केले',
      recentAlerts: 'अलीकडील अलर्ट',
      viewAll: 'सर्व पहा',
      mandiTitle: 'मंडी भाव',
      mandiDesc: 'इंदूर बाजारातील गहू आणि सोयाबीनचे भाव तपासा.',
    }
  }[language] || {
    aiRec: 'AI Recommended',
    diseaseRisk: 'Disease Risk: LOW',
    todayRec: "Today's AI Recommendation",
    waterAdvice: 'Water crops before 5 PM',
    rainAdvice: 'Rain expected tomorrow',
    fertilizerAdvice: 'Fertilizer application recommended after rainfall',
    quickActions: 'QUICK ACTIONS',
    grow: 'What Should I Grow?',
    growDesc: 'Get the best crop recommendation.',
    check: 'Check My Crop',
    checkDesc: 'Detect crop diseases using AI.',
    ask: 'Ask Kisan AI',
    askDesc: 'Ask farming questions using voice.',
    weather: 'Weather Details',
    weatherDesc: 'View forecast and advice.',
    scanBtn: 'Scan My Crop',
    farmHealth: 'FARM HEALTH',
    healthy: 'Healthy',
    lastUpdated: 'Last updated: 2 hours ago',
    recentAlerts: 'Recent Alerts',
    viewAll: 'View All',
    mandiTitle: 'Mandi Prices',
    mandiDesc: 'Check current rates for Wheat and Soy in Indore Market.',
  };

  return (
    <div className="flex flex-col gap-4.5 pb-20 font-outfit">
      
      {/* Hero Image Card */}
      <div className="w-full h-[150px] rounded-xl overflow-hidden shadow-m3-1 border border-surface-container-high relative">
        <img 
          src="/designs/assets/dashboard-heropic.png" 
          alt="Lush green agricultural fields" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Weather Advisory Card */}
      <div className="m3-card flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center shrink-0">
            <CloudSun size={28} />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold leading-tight text-on-surface">
              {weather ? weather.forecast.split(' ')[0] : '32°C'}
            </span>
            <span className="text-sm font-semibold text-outline leading-tight">
              {weather ? weather.forecast.split(' ')[1] : 'Sunny'}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[10px] font-bold text-primary bg-[#e9f2ff] text-tertiary px-2 py-0.5 rounded-full">
            Rain Chance: 20%
          </span>
          <span className="text-[10px] font-bold text-primary bg-[#cbffc2]/50 text-primary px-2 py-0.5 rounded-full">
            Wind: Low
          </span>
          <span className="text-[10px] font-bold text-primary bg-[#cbffc2] text-primary px-2.5 py-1 rounded-full flex items-center gap-1 border border-primary/20">
            <Droplet size={10} className="fill-current" />
            <span>Irrigation Recommended</span>
          </span>
        </div>
      </div>

      {/* Today's AI Recommendation Box (Light Green Panel) */}
      <div className="bg-[#cbffc2]/35 border border-primary/10 rounded-2xl p-5 shadow-m3-1 flex flex-col gap-4">
        {/* Badges Row */}
        <div className="flex justify-between items-center w-full">
          <span className="text-[10px] font-bold bg-primary text-on-primary px-2.5 py-1 rounded-full flex items-center gap-1">
            <Sparkles size={10} className="fill-current" />
            <span>{t.aiRec}</span>
          </span>
          
          <span className="text-[10px] font-bold bg-white border border-[#0d631b]/20 text-[#0d631b] px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0d631b] inline-block" />
            <span>{t.diseaseRisk}</span>
          </span>
        </div>

        {/* Title */}
        <h3 className="text-[17px] font-bold text-on-surface flex items-center gap-1">
          ✨ {t.todayRec}
        </h3>

        {/* Advice Bullet List */}
        <div className="flex flex-col gap-3.5">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5 text-blue-500">
              <Droplet size={12} className="fill-current" />
            </div>
            <p className="text-[14px] text-on-surface-variant font-medium leading-tight">
              {t.waterAdvice}
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center shrink-0 mt-0.5 text-sky-500">
              <CloudRain size={12} />
            </div>
            <p className="text-[14px] text-on-surface-variant font-medium leading-tight">
              {t.rainAdvice}
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#fdcdbc]/40 flex items-center justify-center shrink-0 mt-0.5 text-secondary">
              <Sprout size={12} />
            </div>
            <p className="text-[14px] text-on-surface-variant font-medium leading-tight">
              {t.fertilizerAdvice}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions Title */}
      <div className="flex flex-col mt-1">
        <span className="text-xs font-bold tracking-wider text-outline uppercase">
          {t.quickActions}
        </span>
        
        {/* Grid 2x2 */}
        <div className="grid grid-cols-2 gap-3.5 mt-3">
          {/* Action 1: What should I grow */}
          <button 
            onClick={() => navigate('/crop-recommendation')}
            className="bg-white p-4 rounded-2xl shadow-m3-1 border border-surface-container-high text-left flex flex-col gap-2 hover:border-primary/20 active:scale-95 transition-all"
            id="qa-grow"
          >
            <div className="w-10 h-10 rounded-full bg-[#cbffc2]/50 text-primary flex items-center justify-center shrink-0">
              <Sprout size={20} />
            </div>
            <div className="flex flex-col mt-1">
              <span className="text-[14px] font-bold text-on-surface leading-snug">{t.grow}</span>
              <span className="text-[10px] text-outline mt-0.5 font-medium leading-tight">{t.growDesc}</span>
            </div>
          </button>

          {/* Action 2: Check My crop */}
          <button 
            onClick={() => navigate('/crop-disease')}
            className="bg-white p-4 rounded-2xl shadow-m3-1 border border-surface-container-high text-left flex flex-col gap-2 hover:border-primary/20 active:scale-95 transition-all"
            id="qa-check"
          >
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Camera size={20} />
            </div>
            <div className="flex flex-col mt-1">
              <span className="text-[14px] font-bold text-on-surface leading-snug">{t.check}</span>
              <span className="text-[10px] text-outline mt-0.5 font-medium leading-tight">{t.checkDesc}</span>
            </div>
          </button>

          {/* Action 3: Ask AI */}
          <button 
            onClick={() => navigate('/ask-ai')}
            className="bg-white p-4 rounded-2xl shadow-m3-1 border border-surface-container-high text-left flex flex-col gap-2 hover:border-primary/20 active:scale-95 transition-all"
            id="qa-ask"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Mic size={20} />
            </div>
            <div className="flex flex-col mt-1">
              <span className="text-[14px] font-bold text-on-surface leading-snug">{t.ask}</span>
              <span className="text-[10px] text-outline mt-0.5 font-medium leading-tight">{t.askDesc}</span>
            </div>
          </button>

          {/* Action 4: Weather Details */}
          <button 
            onClick={() => navigate('/alerts')}
            className="bg-white p-4 rounded-2xl shadow-m3-1 border border-surface-container-high text-left flex flex-col gap-2 hover:border-primary/20 active:scale-95 transition-all"
            id="qa-weather"
          >
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <CloudSunRain size={20} />
            </div>
            <div className="flex flex-col mt-1">
              <span className="text-[14px] font-bold text-on-surface leading-snug">{t.weather}</span>
              <span className="text-[10px] text-outline mt-0.5 font-medium leading-tight">{t.weatherDesc}</span>
            </div>
          </button>
        </div>

        {/* Large green Scan Button */}
        <button 
          onClick={() => navigate('/crop-disease')}
          className="m3-btn-primary mt-4 flex items-center justify-center gap-2"
          id="dashboard-scan-btn"
        >
          <Camera size={22} />
          <span>{t.scanBtn}</span>
        </button>
      </div>

      {/* Farm Health Gauge section */}
      <div className="m3-card flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs font-bold text-outline uppercase tracking-wider">
            <Sprout size={16} className="text-primary" />
            <span>{t.farmHealth}</span>
          </div>
          <span className="text-xl font-bold text-[#0d631b] mt-1.5 font-outfit">
            {t.healthy}
          </span>
          <span className="text-[10px] text-outline font-medium mt-0.5 leading-tight">
            {t.lastUpdated}
          </span>
        </div>

        {/* Circular progress bar 92% */}
        <div className="relative w-18 h-18 shrink-0 flex items-center justify-center">
          <svg className="w-16 h-16 transform -rotate-90">
            <circle 
              cx="32" 
              cy="32" 
              r="26" 
              stroke="#eae8e7" 
              strokeWidth="5" 
              fill="transparent" 
            />
            <circle 
              cx="32" 
              cy="32" 
              r="26" 
              stroke="#0d631b" 
              strokeWidth="5" 
              fill="transparent" 
              strokeDasharray={2 * Math.PI * 26}
              strokeDashoffset={2 * Math.PI * 26 * (1 - 0.92)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col justify-center items-center font-outfit">
            <span className="text-sm font-bold text-on-surface leading-none">92</span>
            <span className="text-[8px] text-outline font-bold leading-none mt-0.5">/100</span>
          </div>
        </div>
      </div>

      {/* Recent Alerts Section */}
      <div className="flex flex-col mt-1">
        <div className="flex justify-between items-center w-full">
          <h3 className="text-base font-bold text-on-surface">
            {t.recentAlerts}
          </h3>
          <button 
            onClick={() => navigate('/alerts')}
            className="text-xs font-bold text-[#0d631b] hover:underline"
            id="dashboard-alerts-viewall"
          >
            {t.viewAll}
          </button>
        </div>

        {/* Orange Warning Alert card */}
        <div 
          onClick={() => navigate('/alerts')}
          className="bg-white rounded-2xl shadow-m3-1 border border-surface-container-high border-l-4 border-amber-500 p-4 mt-3 flex items-center justify-between gap-3 cursor-pointer hover:border-amber-500/50 transition-all active:scale-98"
          id="dashboard-alert-card"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-on-surface leading-tight">Orange Alert</span>
              <span className="text-[11px] text-outline font-medium mt-0.5 leading-tight">
                High winds expected tonight.
              </span>
            </div>
          </div>
          <ChevronRight size={18} className="text-outline-variant shrink-0" />
        </div>
      </div>

      {/* Mandi Prices Banner */}
      <div
        onClick={() => window.open('https://agmarknet.gov.in', '_blank')}
        className="bg-[#fdcdbc] rounded-2xl p-4 flex items-center justify-between gap-4 border border-[#795548]/10 shadow-m3-1 cursor-pointer hover:brightness-95 active:scale-[0.98] transition-all"
      >
        <div className="flex flex-col">
          <span className="text-sm font-bold text-[#795548] leading-tight">
            {t.mandiTitle}
          </span>
          <span className="text-[11px] text-[#795548]/90 font-medium mt-1 leading-snug">
            {t.mandiDesc}
          </span>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center shrink-0 text-[#795548]">
          <TrendingUp size={20} />
        </div>
      </div>

    </div>
  );
};
