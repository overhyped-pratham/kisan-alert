import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  ThumbsUp, 
  Camera, 
  Bell, 
  Languages, 
  Map, 
  Sprout, 
  Users, 
  AlertCircle, 
  HelpCircle, 
  BookOpen, 
  Phone, 
  ChevronRight, 
  ExternalLink 
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { profileService } from '../services/profile.service';
import { authService } from '../services/auth.service';
import { UserProfile } from '../types';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLoggedIn, setUserProfile } = useAppStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editVillage, setEditVillage] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLang, setEditLang] = useState<'en' | 'hi' | 'mr'>('hi');
  const [editFarmSize, setEditFarmSize] = useState('');
  const [editCropType, setEditCropType] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  // Dynamic header override (Hide AppLayout default header, show page-specific custom header)
  useEffect(() => {
    const parentHeader = document.querySelector('header');
    if (parentHeader) {
      parentHeader.style.display = 'none';
    }
    return () => {
      if (parentHeader) {
        parentHeader.style.display = 'flex';
      }
    };
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await profileService.getProfile();
      setProfile(data);
      setEditName(data.name || '');
      setEditVillage(data.village || '');
      setEditDistrict(data.districtState || '');
      setEditPhone(data.phoneNumber || '');
      setEditLang((data.preferredLanguage || 'hi') as 'en' | 'hi' | 'mr');
      setEditFarmSize(data.farmSize || '5 Acres');
      setEditCropType(data.cropType || 'Wheat');
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const updated = await profileService.updateProfile({
        name: editName,
        village: editVillage,
        districtState: editDistrict,
        phoneNumber: editPhone,
        preferredLanguage: editLang,
        farmSize: editFarmSize,
        cropType: editCropType,
      });
      setProfile(updated);
      setUserProfile(updated);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save profile changes", err);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Even if logout API fails, clear local state
    }
    setLoggedIn(false);
    navigate('/login');
  };

  return (
    <div className="flex flex-col gap-4.5 font-outfit pb-10">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-on-surface text-surface text-xs font-bold px-5 py-3 rounded-2xl shadow-m3-2 animate-fade-in">
          {toast}
        </div>
      )}
      
      {/* Custom Header with Back button and Avatar */}
      <div className="flex items-center justify-between -mx-5 -mt-4 px-5 py-4 border-b border-surface-container-high bg-background sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container active:scale-95 transition-all text-on-surface"
            aria-label="Back to Dashboard"
            id="profile-header-back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-1.5 font-outfit">
              Profile
            </h2>
            <span className="text-[11px] text-outline font-outfit font-medium">
              Your farming account
            </span>
          </div>
        </div>
        
        {/* Profile Avatar in Header */}
        <div className="w-10 h-10 rounded-full border border-surface-container-high overflow-hidden shrink-0">
          <img 
            src="/designs/assets/icon.png" 
            alt="Farmer Profile" 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80';
            }}
          />
        </div>
      </div>

      {/* Main Farmer Profile Card */}
      {isEditing ? (
        <div className="bg-white rounded-2xl p-5 shadow-m3-1 border border-surface-container-high border-l-4 border-primary flex flex-col gap-4.5">
          <h3 className="text-lg font-bold text-on-surface font-outfit">Edit Profile Details</h3>
          
          <div className="flex flex-col gap-3.5 text-xs font-bold text-[#7a5649]">
            <div className="flex flex-col gap-1.5">
              <label className="uppercase tracking-wider">Farmer Name</label>
              <input 
                type="text" 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)} 
                className="w-full h-12 px-4 border border-outline-variant rounded-xl bg-surface-container-lowest outline-none text-sm text-on-surface font-semibold font-outfit"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="uppercase tracking-wider">Phone Number</label>
              <input 
                type="text" 
                value={editPhone} 
                onChange={(e) => setEditPhone(e.target.value)} 
                className="w-full h-12 px-4 border border-outline-variant rounded-xl bg-surface-container-lowest outline-none text-sm text-on-surface font-semibold font-outfit"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="uppercase tracking-wider">District / State</label>
                <input 
                  type="text" 
                  value={editDistrict} 
                  onChange={(e) => setEditDistrict(e.target.value)} 
                  className="w-full h-12 px-4 border border-outline-variant rounded-xl bg-surface-container-lowest outline-none text-sm text-on-surface font-semibold font-outfit"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="uppercase tracking-wider">Village</label>
                <input 
                  type="text" 
                  value={editVillage} 
                  onChange={(e) => setEditVillage(e.target.value)} 
                  className="w-full h-12 px-4 border border-outline-variant rounded-xl bg-surface-container-lowest outline-none text-sm text-on-surface font-semibold font-outfit"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="uppercase tracking-wider">Farm Size</label>
                <input 
                  type="text" 
                  value={editFarmSize} 
                  onChange={(e) => setEditFarmSize(e.target.value)} 
                  placeholder="e.g. 5 Acres"
                  className="w-full h-12 px-4 border border-outline-variant rounded-xl bg-surface-container-lowest outline-none text-sm text-on-surface font-semibold font-outfit"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="uppercase tracking-wider">Crop Type</label>
                <input 
                  type="text" 
                  value={editCropType} 
                  onChange={(e) => setEditCropType(e.target.value)} 
                  placeholder="e.g. Wheat"
                  className="w-full h-12 px-4 border border-outline-variant rounded-xl bg-surface-container-lowest outline-none text-sm text-on-surface font-semibold font-outfit"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="uppercase tracking-wider">Preferred Language</label>
              <select 
                value={editLang} 
                onChange={(e) => setEditLang(e.target.value as 'en' | 'hi' | 'mr')} 
                className="w-full h-12 px-4 border border-outline-variant rounded-xl bg-surface-container-lowest outline-none text-sm text-on-surface font-semibold font-outfit"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3.5 pt-3.5 border-t border-surface-container-high">
            <button 
              onClick={() => setIsEditing(false)} 
              className="w-full h-12 border border-outline bg-[#f5f3f3] text-outline font-bold rounded-2xl flex items-center justify-center transition-all hover:bg-surface-container active:scale-95 text-xs"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              className="m3-btn-primary flex items-center justify-center text-xs h-12 font-bold"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-5 shadow-m3-1 border border-surface-container-high border-l-4 border-primary flex flex-col gap-4.5">
          
          {/* Farmer Bio Details */}
          <div className="flex gap-4 items-center">
            <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden shrink-0 shadow-sm border border-surface-container-high">
              <img 
                src="/designs/assets/icon.png" 
                alt={profile?.name || "Farmer Profile"} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80';
                }}
              />
            </div>
            <div className="flex flex-col">
              <h3 className="text-xl font-bold text-on-surface leading-tight font-outfit">
                {profile?.name || "Ramesh Patel"}
              </h3>
              <div className="flex items-center gap-1 mt-1 text-xs text-outline font-outfit font-medium">
                <MapPin size={13} className="text-secondary" />
                <span>
                  {profile?.village ? `${profile.village}, ` : ''}{profile?.districtState || "Bhopal, Madhya Pradesh"}
                </span>
              </div>
            </div>
          </div>

          {/* 2x2 Details Grid */}
          <div className="grid grid-cols-2 gap-3.5 pt-3.5 border-t border-surface-container-high text-xs">
            {/* Farm Size */}
            <div className="bg-surface-container-lowest rounded-xl p-3 flex flex-col gap-0.5 border border-surface-container">
              <span className="font-bold text-outline uppercase tracking-wider text-[9px]">FARM SIZE</span>
              <span className="text-sm font-bold text-primary font-outfit mt-0.5">{profile?.farmSize || '—'}</span>
            </div>

            {/* Crop Type */}
            <div className="bg-surface-container-lowest rounded-xl p-3 flex flex-col gap-0.5 border border-surface-container">
              <span className="font-bold text-outline uppercase tracking-wider text-[9px]">CROP TYPE</span>
              <span className="text-sm font-bold text-primary font-outfit mt-0.5">{profile?.cropType || '—'}</span>
            </div>

            {/* Language */}
            <div className="bg-surface-container-lowest rounded-xl p-3 flex flex-col gap-0.5 border border-surface-container">
              <span className="font-bold text-outline uppercase tracking-wider text-[9px]">LANGUAGE</span>
              <span className="text-sm font-bold text-primary font-outfit mt-0.5">
                {profile?.preferredLanguage === 'hi' ? 'Hindi' : profile?.preferredLanguage === 'mr' ? 'Marathi' : 'English'}
              </span>
            </div>

            {/* Phone Number */}
            <div className="bg-surface-container-lowest rounded-xl p-3 flex flex-col gap-0.5 border border-surface-container">
              <span className="font-bold text-outline uppercase tracking-wider text-[9px]">PHONE NUMBER</span>
              <span className="text-sm font-bold text-primary font-outfit mt-0.5">{profile?.phoneNumber || "N/A"}</span>
            </div>
          </div>

        </div>
      )}

      {/* Farm Activity section */}
      <div className="flex flex-col gap-3 mt-1">
        <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider pl-1">
          Farm Activity
        </h4>
        
        <div className="grid grid-cols-2 gap-3.5">
          {/* Left card: Recommendations count */}
          <div className="bg-[#f5f3f3] rounded-2xl p-4.5 shadow-m3-1 flex flex-col justify-between border border-surface-container min-h-[120px]">
            <div className="w-9 h-9 rounded-full bg-[#cbffc2]/50 text-[#0d631b] flex items-center justify-center shrink-0">
              <ThumbsUp size={18} className="fill-current" />
            </div>
            <div className="flex flex-col mt-3">
              <span className="text-2xl font-black text-on-surface font-outfit leading-none">12</span>
              <span className="text-[11px] text-outline font-bold mt-1 leading-none">Recommendations</span>
            </div>
          </div>

          {/* Right card: Scans and Alerts vertical split */}
          <div className="flex flex-col gap-3">
            {/* Top Subcard: Scans */}
            <div className="bg-[#f5f3f3] rounded-xl p-3.5 flex items-center justify-between border border-surface-container shadow-m3-1 flex-1">
              <div className="flex flex-col">
                <span className="text-lg font-black text-on-surface font-outfit leading-none">8</span>
                <span className="text-[9px] text-outline font-bold uppercase tracking-wider mt-1.5 leading-none">Scans</span>
              </div>
              <Camera size={18} className="text-secondary shrink-0" />
            </div>

            {/* Bottom Subcard: Alerts */}
            <div className="bg-[#cbffc2]/35 rounded-xl p-3.5 flex items-center justify-between border border-[#0d631b]/10 shadow-m3-1 flex-1">
              <div className="flex flex-col">
                <span className="text-lg font-black text-primary font-outfit leading-none">15</span>
                <span className="text-[9px] text-primary/80 font-bold uppercase tracking-wider mt-1.5 leading-none">Alerts</span>
              </div>
              <Bell size={18} className="text-primary shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings List */}
      <div className="flex flex-col gap-2 mt-2">
        <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider pl-1">
          Account Settings
        </h4>
        
        <div className="bg-white rounded-2xl overflow-hidden border border-surface-container shadow-m3-1 divide-y divide-surface-container-low">
          {/* Language selection link */}
          <div 
            onClick={() => navigate('/language')}
            className="m3-list-item justify-between cursor-pointer hover:bg-surface-container-lowest" 
            id="profile-settings-lang"
          >
            <div className="flex items-center gap-3">
              <Languages size={18} className="text-secondary" />
              <span className="text-sm font-semibold text-on-surface">Language</span>
            </div>
            <ChevronRight size={16} className="text-outline-variant" />
          </div>

          {/* Notification Settings */}
          <div
            onClick={() => navigate('/alerts')}
            className="m3-list-item justify-between cursor-pointer hover:bg-surface-container-lowest"
            id="profile-settings-notif"
          >
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-secondary" />
              <span className="text-sm font-semibold text-on-surface">Notification Settings</span>
            </div>
            <ChevronRight size={16} className="text-outline-variant" />
          </div>

          {/* Farm Location */}
          <div
            onClick={() => { setIsEditing(true); showToast('Edit your District/Village in the form above'); }}
            className="m3-list-item justify-between cursor-pointer hover:bg-surface-container-lowest"
            id="profile-settings-loc"
          >
            <div className="flex items-center gap-3">
              <Map size={18} className="text-secondary" />
              <span className="text-sm font-semibold text-on-surface">Farm Location</span>
            </div>
            <ChevronRight size={16} className="text-outline-variant" />
          </div>

          {/* Preferred Crops */}
          <div
            onClick={() => { setIsEditing(true); showToast('Edit your Crop Type in the form above'); }}
            className="m3-list-item justify-between cursor-pointer hover:bg-surface-container-lowest"
            id="profile-settings-crops"
          >
            <div className="flex items-center gap-3">
              <Sprout size={18} className="text-secondary" />
              <span className="text-sm font-semibold text-on-surface">Preferred Crops</span>
            </div>
            <ChevronRight size={16} className="text-outline-variant" />
          </div>

          {/* Linked Family Member */}
          <div
            onClick={() => showToast('Family member linking coming soon!')}
            className="m3-list-item justify-between cursor-pointer hover:bg-surface-container-lowest"
            id="profile-settings-family"
          >
            <div className="flex items-center gap-3">
              <Users size={18} className="text-secondary" />
              <span className="text-sm font-semibold text-on-surface">Linked Family Member</span>
            </div>
            <ChevronRight size={16} className="text-outline-variant" />
          </div>

          {/* Emergency Contact */}
          <div
            onClick={() => window.open('tel:18001801551')}
            className="m3-list-item justify-between cursor-pointer hover:bg-surface-container-lowest"
            id="profile-settings-emergency"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={18} className="text-error" />
              <span className="text-sm font-semibold text-on-surface">Emergency Contact</span>
            </div>
            <ChevronRight size={16} className="text-outline-variant" />
          </div>
        </div>
      </div>

      {/* Help & Support List */}
      <div className="flex flex-col gap-2 mt-2">
        <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider pl-1">
          Help & Support
        </h4>
        
        <div className="bg-white rounded-2xl overflow-hidden border border-surface-container shadow-m3-1 divide-y divide-surface-container-low">
          {/* Help Center */}
          <div
            onClick={() => window.open('https://farmer.gov.in', '_blank')}
            className="m3-list-item justify-between cursor-pointer hover:bg-surface-container-lowest"
            id="profile-support-center"
          >
            <div className="flex items-center gap-3">
              <HelpCircle size={18} className="text-secondary" />
              <span className="text-sm font-semibold text-on-surface">Help Center</span>
            </div>
            <ExternalLink size={14} className="text-outline-variant" />
          </div>

          {/* Farming Guide */}
          <div
            onClick={() => window.open('https://icar.org.in', '_blank')}
            className="m3-list-item justify-between cursor-pointer hover:bg-surface-container-lowest"
            id="profile-support-guide"
          >
            <div className="flex items-center gap-3">
              <BookOpen size={18} className="text-secondary" />
              <span className="text-sm font-semibold text-on-surface">Farming Guide</span>
            </div>
            <ExternalLink size={14} className="text-outline-variant" />
          </div>

          {/* Contact Support */}
          <div 
            onClick={() => window.open('tel:18001801551')}
            className="m3-list-item justify-between cursor-pointer hover:bg-surface-container-lowest" 
            id="profile-support-contact"
          >
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-secondary" />
              <span className="text-sm font-semibold text-on-surface">Contact Support</span>
            </div>
            <ExternalLink size={14} className="text-outline-variant" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!isEditing && (
        <div className="flex flex-col gap-3 mt-4">
          <button 
            onClick={() => setIsEditing(true)}
            className="m3-btn-primary"
            id="profile-edit-btn"
          >
            Edit Profile
          </button>
          <button 
            onClick={handleLogout}
            className="m3-btn-secondary"
            id="profile-logout-btn"
          >
            Logout
          </button>
        </div>
      )}

    </div>
  );
};
