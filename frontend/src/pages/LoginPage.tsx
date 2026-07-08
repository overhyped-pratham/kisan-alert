import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mic, ArrowRight, Check, Mail, Lock, UserPlus, Phone, MapPin } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { authService, AuthUser } from '../services/auth.service';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setLoggedIn, setUserProfile } = useAppStore();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('hi');
  const [farmSize, setFarmSize] = useState('5 Acres');
  const [cropType, setCropType] = useState('Wheat');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const res = isSignUp
        ? await authService.signup(name, email, password, phone, district, village, preferredLanguage, farmSize, cropType)
        : await authService.login(email, password);

      if (res.success && res.user) {
        setLoggedIn(true);
        setUserProfile({
          name: res.user.name,
          village: res.user.village,
          districtState: res.user.district,
          farmSize: res.user.farmSize || '5 Acres',
          cropType: res.user.cropType || 'Wheat',
          preferredLanguage: (res.user.preferredLanguage || 'hi') as 'en' | 'hi' | 'mr',
          phoneNumber: res.user.phone || '',
        });
        navigate('/permissions');
      } else {
        setError(res.error || 'Authentication failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceLogin = async () => {
    // Voice login shortcut — login with a demo account or skip to dashboard
    setError('');
    setLoading(true);
    try {
      // Try to check existing session first
      const res = await authService.me();
      if (res.user) {
        setLoggedIn(true);
        setUserProfile({
          name: res.user.name,
          village: res.user.village,
          districtState: res.user.district,
          farmSize: res.user.farmSize || '5 Acres',
          cropType: res.user.cropType || 'Wheat',
          preferredLanguage: (res.user.preferredLanguage || 'hi') as 'en' | 'hi' | 'mr',
          phoneNumber: res.user.phone || '',
        });
        navigate('/dashboard');
      }
    } catch {
      // No active session — show error
      setError('Please log in with email and password first.');
    } finally {
      setLoading(false);
    }
  };

  const isValid = isSignUp
    ? name.trim() && email.includes('@') && password.length >= 4 && district.trim() && village.trim()
    : email.includes('@') && password.length >= 4;

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between py-5 px-5 font-outfit select-none bg-background">
      
      {/* Top Logo Pin */}
      <div className="flex justify-center py-2 shrink-0">
        <svg width="24" height="32" viewBox="0 0 84 108" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M42 0C18.8 0 0 18.8 0 42C0 73.5 35.7 104.7 40.2 108C41.3 108.8 42.7 108.8 43.8 108C48.3 104.7 84 73.5 84 42C84 18.8 65.2 0 42 0Z" fill="#1b6d24" />
          <path d="M42 8C23.2 8 8 23.2 8 42C8 63.8 34.6 91.2 42 97.5C49.4 91.2 76 63.8 76 42C76 23.2 60.8 8 42 8Z" fill="#88d982" />
          <path d="M42 22C32.1 22 24 30.1 24 40C24 53.6 42 74 42 74C42 74 60 53.6 60 40C60 30.1 51.9 22 42 22Z" fill="#0073b2" />
        </svg>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center gap-4.5 overflow-y-auto max-w-md mx-auto w-full">
        {/* Headings */}
        <div className="text-center">
          <h2 className="text-[28px] font-bold text-on-surface tracking-tight leading-8 font-outfit">
            {isSignUp ? 'Create Account 🌱' : 'Welcome Back 👋'}
          </h2>
          <p className="text-[14px] text-outline mt-1 font-outfit font-medium">
            {isSignUp ? 'Sign up to get started with Kisan Alert.' : 'Login using your email and password.'}
          </p>
        </div>

        {/* Hero Image */}
        <div className="w-full flex justify-center rounded-2xl overflow-hidden shadow-m3-1 border border-surface-container-high shrink-0">
          <img 
            src="/designs/assets/loginpage-hero pic.png" 
            alt="Farmer using Mobile Phone" 
            className="w-full h-[180px] object-cover"
            id="login-hero-img"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-4 py-2.5 rounded-xl">
            {error}
          </div>
        )}

        {/* Input area */}
        <div className="flex flex-col gap-3.5">
          {isSignUp && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#7a5649] pl-1 font-outfit uppercase tracking-wider">
                  Full Name
                </label>
                <div className="m3-input flex items-center p-0 h-14 border border-outline-variant rounded-xl bg-surface-container-lowest">
                  <span className="px-4 text-on-surface-variant"><UserPlus size={18} /></span>
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-transparent flex-1 h-full px-3 text-base text-on-surface font-outfit font-semibold outline-none placeholder:text-outline-variant"
                    id="signup-name-input"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#7a5649] pl-1 font-outfit uppercase tracking-wider">
                  Phone Number
                </label>
                <div className="m3-input flex items-center p-0 h-14 border border-outline-variant rounded-xl bg-surface-container-lowest">
                  <span className="px-4 text-on-surface-variant"><Phone size={18} /></span>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-transparent flex-1 h-full px-3 text-base text-on-surface font-outfit font-semibold outline-none placeholder:text-outline-variant"
                    id="signup-phone-input"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#7a5649] pl-1 font-outfit uppercase tracking-wider">
                  District / State
                </label>
                <div className="m3-input flex items-center p-0 h-14 border border-outline-variant rounded-xl bg-surface-container-lowest">
                  <span className="px-4 text-on-surface-variant"><MapPin size={18} /></span>
                  <input
                    type="text"
                    placeholder="e.g. Indore, Madhya Pradesh"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="bg-transparent flex-1 h-full px-3 text-base text-on-surface font-outfit font-semibold outline-none placeholder:text-outline-variant"
                    id="signup-district-input"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#7a5649] pl-1 font-outfit uppercase tracking-wider">
                  Village
                </label>
                <div className="m3-input flex items-center p-0 h-14 border border-outline-variant rounded-xl bg-surface-container-lowest">
                  <span className="px-4 text-on-surface-variant"><MapPin size={18} /></span>
                  <input
                    type="text"
                    placeholder="e.g. Depalpur"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="bg-transparent flex-1 h-full px-3 text-base text-on-surface font-outfit font-semibold outline-none placeholder:text-outline-variant"
                    id="signup-village-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#7a5649] pl-1 font-outfit uppercase tracking-wider">
                    Farm Size
                  </label>
                  <div className="m3-input flex items-center p-0 h-14 border border-outline-variant rounded-xl bg-surface-container-lowest">
                    <input
                      type="text"
                      placeholder="e.g. 5 Acres"
                      value={farmSize}
                      onChange={(e) => setFarmSize(e.target.value)}
                      className="bg-transparent flex-1 h-full px-4 text-base text-on-surface font-outfit font-semibold outline-none placeholder:text-outline-variant"
                      id="signup-farmsize-input"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#7a5649] pl-1 font-outfit uppercase tracking-wider">
                    Crop Type
                  </label>
                  <div className="m3-input flex items-center p-0 h-14 border border-outline-variant rounded-xl bg-surface-container-lowest">
                    <input
                      type="text"
                      placeholder="e.g. Wheat"
                      value={cropType}
                      onChange={(e) => setCropType(e.target.value)}
                      className="bg-transparent flex-1 h-full px-4 text-base text-on-surface font-outfit font-semibold outline-none placeholder:text-outline-variant"
                      id="signup-croptype-input"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#7a5649] pl-1 font-outfit uppercase tracking-wider">
                  Preferred Language
                </label>
                <div className="m3-input flex items-center p-0 h-14 border border-outline-variant rounded-xl bg-surface-container-lowest">
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="bg-transparent flex-1 h-full px-4 text-base text-on-surface font-outfit font-semibold outline-none cursor-pointer"
                    id="signup-language-select"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="mr">मराठी (Marathi)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#7a5649] pl-1 font-outfit uppercase tracking-wider">
              Email
            </label>
            <div className="m3-input flex items-center p-0 h-14 border border-outline-variant rounded-xl bg-surface-container-lowest">
              <span className="px-4 text-on-surface-variant"><Mail size={18} /></span>
              <input
                type="email"
                placeholder="farmer@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent flex-1 h-full px-3 text-base text-on-surface font-outfit font-semibold outline-none placeholder:text-outline-variant"
                id="email-input"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#7a5649] pl-1 font-outfit uppercase tracking-wider">
              Password
            </label>
            <div className="m3-input flex items-center p-0 h-14 border border-outline-variant rounded-xl bg-surface-container-lowest">
              <span className="px-4 text-on-surface-variant"><Lock size={18} /></span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && isValid && handleSubmit()}
                className="bg-transparent flex-1 h-full px-3 text-base text-on-surface font-outfit font-semibold outline-none placeholder:text-outline-variant"
                id="password-input"
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className={`w-full h-14 rounded-2xl font-bold font-outfit flex items-center justify-center gap-2 transition-all active:scale-95 text-base mt-2 shadow-m3-1 ${
              isValid
                ? 'bg-[#0d631b] hover:bg-[#0d631b]/95 text-white' 
                : 'bg-[#cbffc2]/40 text-[#0d631b]/50 border border-[#cbffc2]/10 cursor-not-allowed shadow-none'
            }`}
            id={isSignUp ? 'signup-btn' : 'login-btn'}
          >
            <span>{loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Login'}</span>
            {!loading && <ArrowRight size={18} />}
          </button>

          {/* Toggle Sign Up / Login */}
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-xs text-secondary font-bold text-center mt-1 hover:underline"
            id="toggle-auth-mode-btn"
          >
            {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
          </button>
        </div>

        {/* Secondary Voice Button */}
        <button
          onClick={handleVoiceLogin}
          className="w-full h-14 bg-[#eae8e7] text-primary font-bold rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-surface-container active:scale-95 text-[15px] border border-surface-container-high"
          id="voice-login-btn"
        >
          <Mic size={18} className="text-[#0d631b]" />
          <span>Continue using Voice</span>
        </button>
      </div>

      {/* Footer Protection */}
      <div className="flex flex-col items-center mt-5 shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-[#0d631b] font-semibold font-outfit">
          <ShieldCheck size={16} />
          <span>Your data is safe and protected.</span>
        </div>
        
        <div className="text-[9px] text-outline font-bold tracking-widest uppercase mt-3">
          MADE FOR BHARAT • KISAN ALERT
        </div>
      </div>
      
    </div>
  );
};
