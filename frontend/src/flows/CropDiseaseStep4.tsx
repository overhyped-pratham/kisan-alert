import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  MapPin,
  Calendar,
  Send,
  Mic,
  Home,
  Camera,
  Bell,
  User,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  Clock,
  Sprout,
  FlaskConical,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { diseaseService } from '../services/disease.service';
import { formatDiseaseName } from './CropDiseaseStep3';

export const CropDiseaseStep4: React.FC = () => {
  const navigate = useNavigate();
  const { diseaseResult, userProfile, setDiseaseResult } = useAppStore();
  const [escalating, setEscalating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Override FlowLayout header — hide it, render own header
  useEffect(() => {
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    return () => {
      if (header) header.style.display = 'flex';
    };
  }, []);

  const handleEscalate = async () => {
    setEscalating(true);
    setError(null);
    try {
      const res = await diseaseService.escalateDisease();
      if (res.success && diseaseResult) {
        setDiseaseResult({
          ...diseaseResult,
          ticketCreated: true,
          ticketId: res.ticketId,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Could not escalate request. Please try again.');
    } finally {
      setEscalating(false);
    }
  };

  const formattedDisease = diseaseResult
    ? formatDiseaseName(diseaseResult.disease)
    : 'Leaf Blight';

  const severity = diseaseResult?.severity || 'Medium';
  const isHighSeverity = severity === 'High';
  const severityBgColor = isHighSeverity ? 'bg-red-50 border-red-200 text-red-700' : 'bg-orange-50 border-orange-200 text-orange-700';

  const locationStr = userProfile?.districtState
    ? (userProfile.village ? `${userProfile.village}, ${userProfile.districtState}` : userProfile.districtState)
    : 'Indore, MP';

  const currentDateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 -mx-5 -mt-5 font-outfit bg-background">
      {/* ── Standard Kisan Alert App Header ── */}
      <header className="bg-background px-5 py-4 flex items-center justify-between border-b border-surface-container-high shrink-0">
        <div className="flex items-center gap-3">
          <Menu size={22} className="text-on-surface cursor-pointer" onClick={() => navigate('/dashboard')} />
          <h1 className="text-xl font-bold font-outfit text-primary">Kisan Alert</h1>
        </div>
        <div 
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full border border-surface-container-high overflow-hidden shrink-0 cursor-pointer"
        >
          <img
            src="/designs/assets/icon.png"
            alt="Farmer"
            className="w-full h-full object-cover"
          />
        </div>
      </header>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-5 py-6 pb-[calc(100px+env(safe-area-inset-bottom,0px))] flex flex-col gap-6">
        
        {/* Page headline */}
        <div className="flex flex-col gap-1">
          <h2 className="text-[28px] font-black text-on-surface tracking-tight leading-tight">
            Treatment & Guidance
          </h2>
          <p className="text-[14px] text-outline font-medium leading-snug">
            View detailed recommendations or request expert assistance.
          </p>
        </div>

        {/* Part 1: Disease Summary Card */}
        <div className="bg-white rounded-2xl border border-surface-container-high border-l-4 border-primary p-5 flex flex-col gap-4 shadow-m3-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-black text-outline tracking-widest uppercase">
              Diagnosed Crop & Disease
            </span>
            <span className={`text-[11px] font-black px-3 py-1 rounded-full tracking-wider uppercase shrink-0 ${severityBgColor}`}>
              {severity} Severity
            </span>
          </div>

          <h3 className="text-[22px] font-black text-on-surface leading-none -mt-1 font-outfit">
            {formattedDisease}
          </h3>

          <div className="h-px bg-surface-container-high w-full" />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[9px] font-black text-outline tracking-widest uppercase">
                <MapPin size={10} className="text-outline" />
                Farm Location
              </div>
              <span className="text-[13px] font-bold text-on-surface leading-tight">{locationStr}</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[9px] font-black text-outline tracking-widest uppercase">
                <Calendar size={10} className="text-outline" />
                Detection Date
              </div>
              <span className="text-[13px] font-bold text-on-surface leading-tight">{currentDateStr}</span>
            </div>
          </div>
        </div>

        {/* Part 2: Detailed Guide from Database */}
        {diseaseResult?.details && (
          <section className="flex flex-col gap-3">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
              <BookOpen size={18} className="text-primary" />
              <span>Full Agricultural Guide</span>
            </h3>
            
            <div className="bg-white rounded-2xl border border-surface-container p-5 shadow-m3-1 text-sm text-on-surface-variant font-medium leading-relaxed flex flex-col gap-4">
              <div 
                className="disease-html-details font-outfit prose prose-sm max-w-none text-[13px]"
                dangerouslySetInnerHTML={{ __html: diseaseResult.details }}
              />
            </div>
          </section>
        )}

        {/* Part 3: Treatment Details summary */}
        <section className="flex flex-col gap-3">
          <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
            <AlertTriangle size={18} className="text-primary" />
            <span>Recommended Remedies</span>
          </h3>

          <div className="flex flex-col gap-3">
            {diseaseResult?.treatment && (
              <div className="bg-white rounded-xl border border-surface-container p-4 shadow-m3-1 flex gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#cbffc2]/50 text-primary flex items-center justify-center shrink-0">
                  <span className="text-sm font-black">🧪</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-outline tracking-wider uppercase">Chemical Spray Control</span>
                  <span className="text-[13px] text-on-surface font-semibold mt-1 leading-snug">{diseaseResult.treatment}</span>
                </div>
              </div>
            )}

            {diseaseResult?.organicAlternatives && (
              <div className="bg-white rounded-xl border border-surface-container p-4 shadow-m3-1 flex gap-3.5">
                <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black">🌱</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-outline tracking-wider uppercase">Organic Remedy</span>
                  <span className="text-[13px] text-on-surface-variant font-medium mt-1 leading-snug">{diseaseResult.organicAlternatives}</span>
                </div>
              </div>
            )}

            {diseaseResult?.prevention && (
              <div className="bg-white rounded-xl border border-surface-container p-4 shadow-m3-1 flex gap-3.5">
                <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black">🛡️</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-outline tracking-wider uppercase">Prevention Advice</span>
                  <span className="text-[13px] text-on-surface-variant font-medium mt-1 leading-snug">{diseaseResult.prevention}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Part 4: Detailed Fertilizer Recommendation */}
        {diseaseResult?.fertilizer && (
          <section className="flex flex-col gap-3">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
              <Sprout size={18} className="text-primary" />
              <span>Fertilizer &amp; Soil Treatment</span>
            </h3>

            {/* Main fertilizer name card — green gradient */}
            <div className="bg-gradient-to-br from-[#0d631b] to-[#1a7a2a] rounded-2xl p-5 text-white shadow-m3-2 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <FlaskConical size={20} className="text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-white/70 tracking-widest uppercase">
                    Recommended Fertilizer
                  </span>
                  <span className="text-[16px] font-black text-white leading-tight mt-0.5">
                    {diseaseResult.fertilizer.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Details card — contextual weather-aware info */}
            <div className="bg-white rounded-2xl border border-surface-container p-4 shadow-m3-1 flex gap-3.5">
              <div className="w-9 h-9 rounded-full bg-[#cbffc2]/50 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-base">📋</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-outline tracking-wider uppercase">
                  Dosage &amp; Conditions
                </span>
                <p className="text-[13px] text-on-surface font-semibold leading-snug">
                  {diseaseResult.fertilizer.details}
                </p>
              </div>
            </div>

            {/* Application method — step-by-step */}
            <div className="bg-white rounded-2xl border border-surface-container p-4 shadow-m3-1 flex gap-3.5">
              <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-base">🚿</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-outline tracking-wider uppercase">
                  How To Apply
                </span>
                <p className="text-[13px] text-on-surface-variant font-medium leading-snug">
                  {diseaseResult.fertilizer.applicationMethod}
                </p>
              </div>
            </div>

            {/* Pro tip banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <span className="text-base shrink-0">💡</span>
              <p className="text-[12px] text-amber-800 font-semibold leading-snug">
                <span className="font-black">Pro Tip:</span> Apply fertilizer in the early morning or evening to
                avoid evaporation and maximise soil absorption. Avoid applying before heavy rain.
              </p>
            </div>
          </section>
        )}

        {/* Part 5: Expert Help / Escalation */}
        <section className="flex flex-col gap-3 mt-1">
          <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
            <HelpCircle size={18} className="text-[#ba1a1a]" />
            <span>Rythu Seva Kendra Connect</span>
          </h3>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          {diseaseResult?.ticketCreated ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col gap-3 shadow-m3-1">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <CheckCircle2 size={20} className="fill-current text-primary" />
                <span>Ticket Registered Successfully</span>
              </div>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                Your leaf sample is sent to the agricultural department. An expert will review it and call you.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-primary/10">
                <div className="flex flex-col">
                  <span className="text-outline font-bold text-[9px] uppercase tracking-wider">Ticket ID</span>
                  <span className="text-on-surface font-bold mt-0.5">#00{diseaseResult.ticketId || 102}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-outline font-bold text-[9px] uppercase tracking-wider">Assigned Center</span>
                  <span className="text-on-surface font-bold mt-0.5">RSK-{userProfile?.districtState || 'Pune'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-surface-container p-5 flex flex-col gap-4 shadow-m3-1">
              <div className="flex gap-3">
                <Clock size={20} className="text-secondary shrink-0 mt-0.5" />
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                  Still unsure? Escalate this diagnosis to government agricultural officers. They will reply with a professional solution.
                </p>
              </div>
              <button
                onClick={handleEscalate}
                disabled={escalating}
                className="m3-btn-primary flex items-center justify-center gap-2 h-12 text-sm shadow-m3-1"
                id="disease-send-expert"
              >
                <Send size={18} />
                <span>{escalating ? 'Registering Ticket...' : 'Send to Rythu Seva Kendra'}</span>
              </button>
            </div>
          )}
        </section>
      </div>

      {/* ── Floating Voice FAB ── */}
      <div className="absolute right-5 bottom-[calc(88px+env(safe-area-inset-bottom,0px))] z-40">
        <button
          onClick={() => navigate('/ask-ai')}
          className="m3-btn-voice shadow-m3-2 active:scale-95 transition-all"
          aria-label="Voice help"
          id="disease-expert-voice"
        >
          <Mic size={26} />
        </button>
      </div>

      {/* ── Bottom Navigation (Scan active) ── */}
      <nav className="absolute bottom-0 left-0 right-0 h-[calc(72px+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] bg-surface-container-lowest border-t border-surface-container-high flex justify-around items-center px-2 z-50">
        <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center justify-center flex-1 py-1 text-outline">
          <div className="p-1 px-3 rounded-full mb-1"><Home size={20} /></div>
          <span className="text-[10px] font-outfit">Home</span>
        </button>

        <button onClick={() => navigate('/crop-disease')} className="flex flex-col items-center justify-center flex-1 py-1 text-outline">
          <div className="p-1 px-3 rounded-full mb-1"><Camera size={20} /></div>
          <span className="text-[10px] font-outfit font-semibold">Scan</span>
        </button>

        <div className="relative flex flex-col items-center -mt-8">
          <button
            onClick={() => navigate('/ask-ai')}
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-m3-2 bg-primary text-on-primary"
          >
            <Mic size={32} />
          </button>
          <span className="text-[10px] font-outfit mt-1 font-semibold text-outline">Ask AI</span>
        </div>

        <button onClick={() => navigate('/alerts')} className="flex flex-col items-center justify-center flex-1 py-1 text-outline">
          <div className="p-1 px-3 rounded-full mb-1"><Bell size={20} /></div>
          <span className="text-[10px] font-outfit">Alerts</span>
        </button>

        {/* Expert tab — active (salmon bg) */}
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center justify-center flex-1 py-1">
          <div className="p-1 px-3 rounded-full mb-1 bg-[#fdcdbc] text-[#795548]">
            <User size={20} />
          </div>
          <span className="text-[10px] font-outfit font-semibold text-[#795548]">Expert</span>
        </button>
      </nav>
    </div>
  );
};
