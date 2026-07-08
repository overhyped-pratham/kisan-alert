import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  Camera,
  Mic,
  Users,
  CloudRain,
  Sun,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Thermometer,
  Activity,
  ShieldAlert,
  Sprout,
  RefreshCw,
} from 'lucide-react';
import { alertsService, AlertsPayload, RiskScores, UpcomingAlert } from '../services/alerts.service';
import { AlertItem } from '../types';

const UPCOMING_ICON_MAP: Record<string, React.ReactNode> = {
  rain: <CloudRain size={18} />,
  plant: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12M12 12c-2-2.5-6-3-6-3s1 4.5 6 3c2.5-2 3-6 3-6s-4.5 1-3 6" />
    </svg>
  ),
  thermometer: <Thermometer size={18} />,
  sun: <Sun size={18} />,
};

const UPCOMING_COLOR_MAP: Record<string, string> = {
  rain: 'bg-emerald-100 text-emerald-600',
  plant: 'bg-[#cbffc2] text-[#0d631b]',
  thermometer: 'bg-amber-100 text-amber-600',
  sun: 'bg-blue-50 text-blue-500',
};

function getAlertTheme(alert: AlertItem) {
  const type = alert.type;
  const severity = alert.severity;
  if (severity === 'danger') {
    return {
      border: 'border-l-4 border-error',
      iconBg: 'bg-red-50 text-error',
      badge: 'bg-error-container text-on-error-container',
      label: 'HIGH',
      Icon: type === 'weather' ? CloudRain : type === 'disease' ? Activity : ShieldAlert,
    };
  }
  if (severity === 'warning') {
    return {
      border: 'border-l-4 border-amber-500',
      iconBg: 'bg-amber-50 text-amber-500',
      badge: 'bg-amber-100 text-amber-800',
      label: 'MEDIUM',
      Icon: type === 'weather' ? CloudRain : type === 'disease' ? Sprout : ShieldAlert,
    };
  }
  return {
    border: 'border-l-4 border-primary',
    iconBg: 'bg-[#cbffc2]/50 text-primary',
    badge: 'bg-[#cbffc2] text-primary',
    label: 'INFO',
    Icon: type === 'disease' ? Sprout : Bell,
  };
}

export const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const [payload, setPayload] = useState<AlertsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    weather: true,
    disease: true,
    irrigation: false,
    emergency: true,
  });

  // SMS Alerts state
  const [smsLogs, setSmsLogs] = useState<any[]>([]);
  const [smsMessage, setSmsMessage] = useState('ArogyaKrishi Warning: Heavy rain expected in your village. Please postpone chemical spray.');
  const [smsAlertType, setSmsAlertType] = useState('weather');
  const [sendingSms, setSendingSms] = useState(false);
  const [smsResult, setSmsResult] = useState<{ success: boolean; message: string } | null>(null);

  // Broadcast to ALL users state
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastType, setBroadcastType] = useState('manual');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{ success: boolean; message: string } | null>(null);

  // Scheduler state
  const [schedulerStatus, setSchedulerStatus] = useState<{ running: boolean; jobs: any[] } | null>(null);
  const [triggeringJob, setTriggeringJob] = useState<string | null>(null);

  // Dynamic header override
  useEffect(() => {
    const parentHeader = document.querySelector('header');
    if (parentHeader) parentHeader.style.display = 'none';
    return () => {
      if (parentHeader) parentHeader.style.display = 'flex';
    };
  }, []);

  const fetchAlerts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await alertsService.getAlertsData();
      setPayload(data);
      if (data.activeAlerts.length > 0 && !expandedAlert) {
        setExpandedAlert(data.activeAlerts[0].id);
      }
      const logs = await alertsService.getSmsLogs();
      setSmsLogs(logs);
      // Load scheduler status
      try {
        const sched = await alertsService.getSchedulerStatus();
        setSchedulerStatus(sched);
      } catch { /* scheduler status is non-critical */ }
    } catch (err) {
      console.error('Failed to load alerts', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [expandedAlert]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsMessage.trim()) return;
    setSendingSms(true);
    setSmsResult(null);
    try {
      const res = await alertsService.sendTestSms(smsMessage, smsAlertType);
      if (res.success) {
        setSmsResult({ success: true, message: `✅ Sent to your number! Status: ${res.status}` });
        const logs = await alertsService.getSmsLogs();
        setSmsLogs(logs);
      } else {
        setSmsResult({ success: false, message: res.error || 'Failed to send SMS' });
      }
    } catch (err: any) {
      setSmsResult({
        success: false,
        message: err.response?.data?.error || err.message || 'Configure your phone number in Profile first!'
      });
    } finally {
      setSendingSms(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    setBroadcasting(true);
    setBroadcastResult(null);
    try {
      const res = await alertsService.broadcastAlert(broadcastMsg, broadcastType);
      if (res.success) {
        setBroadcastResult({ success: true, message: `📡 Broadcast complete! Sent: ${res.sent}, Failed: ${res.failed}` });
        const logs = await alertsService.getSmsLogs();
        setSmsLogs(logs);
      } else {
        setBroadcastResult({ success: false, message: res.error || 'Broadcast failed' });
      }
    } catch (err: any) {
      setBroadcastResult({ success: false, message: err.message || 'Server error' });
    } finally {
      setBroadcasting(false);
    }
  };

  const handleTriggerJob = async (jobId: string) => {
    setTriggeringJob(jobId);
    try {
      await alertsService.triggerSchedulerJob(jobId);
      setTimeout(async () => {
        try {
          const sched = await alertsService.getSchedulerStatus();
          setSchedulerStatus(sched);
        } catch {}
        setTriggeringJob(null);
      }, 2000);
    } catch {
      setTriggeringJob(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedAlert(expandedAlert === id ? null : id);
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const risk = payload?.riskScores;
  const activeAlerts = payload?.activeAlerts ?? [];
  const upcomingAlerts = payload?.upcomingAlerts ?? [];

  // Risk label color helper
  const riskTextColor = risk?.color === 'error' ? 'text-error'
    : risk?.color === 'warning' ? 'text-amber-500'
    : 'text-primary';

  const riskCircleColor = risk?.color === 'error' ? '#ba1a1a'
    : risk?.color === 'warning' ? '#f59e0b'
    : '#0d631b';

  return (
    <div className="flex flex-col gap-4.5 font-outfit pb-10">

      {/* Custom Header */}
      <div className="flex items-center justify-between -mx-5 -mt-4 px-5 py-4 border-b border-surface-container-high bg-background sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container active:scale-95 transition-all text-on-surface"
            aria-label="Back to Dashboard"
            id="alerts-header-back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-1.5 font-outfit">
              🔔 Smart Alerts
            </h2>
            <span className="text-[11px] text-outline font-outfit font-medium">
              {payload?.weather ? `${payload.weather.temp}°C · ${payload.weather.location}` : 'Important updates for your farm'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={() => fetchAlerts(true)}
            className={`w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container active:scale-95 transition-all text-outline ${refreshing ? 'animate-spin' : ''}`}
            aria-label="Refresh alerts"
            id="alerts-refresh-btn"
          >
            <RefreshCw size={16} />
          </button>

          {/* Profile Avatar */}
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
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="h-36 bg-surface-container-low rounded-2xl" />
          <div className="h-24 bg-surface-container-low rounded-2xl" />
          <div className="h-24 bg-surface-container-low rounded-2xl" />
        </div>
      )}

      {!loading && payload && (
        <>
          {/* Today's Risk Level Card */}
          <div className={`bg-white rounded-2xl p-5 shadow-m3-1 border border-surface-container-high border-l-4 ${
            risk?.color === 'error' ? 'border-error' : risk?.color === 'warning' ? 'border-amber-500' : 'border-primary'
          } flex flex-col gap-4`}>
            <div className="flex justify-between items-center w-full">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-outline uppercase tracking-wider">Today's Risk Level</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    risk?.color === 'error' ? 'bg-error' : risk?.color === 'warning' ? 'bg-amber-500' : 'bg-primary'
                  }`}>
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  </div>
                  <span className={`text-2xl font-black tracking-tight font-outfit ${riskTextColor}`}>
                    {risk?.label ?? 'Calculating…'}
                  </span>
                </div>
              </div>

              {/* Circular gauge */}
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-14 h-14 transform -rotate-90">
                  <circle cx="28" cy="28" r="22" stroke="#f5f3f3" strokeWidth="4" fill="transparent" />
                  <circle
                    cx="28" cy="28" r="22"
                    stroke={riskCircleColor}
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 22}
                    strokeDashoffset={2 * Math.PI * 22 * (1 - (risk?.overall ?? 0) / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xs font-bold text-on-surface font-outfit">{risk?.overall ?? 0}%</span>
              </div>
            </div>

            {/* Sub-metrics */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-surface-container-high text-xs font-bold">
              {/* Weather Risk */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-on-surface">
                  <span>Weather Risk</span>
                  <span className="text-error">{risk?.weather ?? 0}%</span>
                </div>
                <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full bg-error rounded-full transition-all duration-700" style={{ width: `${risk?.weather ?? 0}%` }} />
                </div>
              </div>

              {/* Disease Risk */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-on-surface">
                  <span>Disease Risk</span>
                  <span className="text-secondary">{risk?.disease ?? 0}%</span>
                </div>
                <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full transition-all duration-700" style={{ width: `${risk?.disease ?? 0}%` }} />
                </div>
              </div>

              {/* Water Risk */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-on-surface">
                  <span>Water Risk</span>
                  <span className="text-primary">{risk?.water ?? 0}%</span>
                </div>
                <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${risk?.water ?? 0}%` }} />
                </div>
              </div>
            </div>

            {/* Live weather advisory pill */}
            {payload.weather.forecast && (
              <div className="flex items-center gap-2 bg-surface-container-lowest rounded-xl px-3 py-2 border border-surface-container">
                <Activity size={13} className="text-secondary shrink-0" />
                <span className="text-[11px] font-medium text-outline leading-snug">{payload.weather.forecast}</span>
              </div>
            )}
          </div>

          {/* Emergency panel: My Crop Is Dying */}
          <div className="bg-error text-on-error rounded-2xl p-5 flex flex-col gap-4 shadow-m3-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={24} className="text-on-error animate-bounce shrink-0" />
              <h3 className="text-lg font-black tracking-tight font-outfit">My Crop Is Dying</h3>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-1">
              <button
                onClick={() => navigate('/crop-disease')}
                className="bg-white text-error rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 hover:bg-surface-container-low active:scale-95 transition-all text-[11px] font-bold"
                id="emergency-camera-btn"
              >
                <Camera size={18} />
                <span>Open Camera</span>
              </button>

              <button
                onClick={() => navigate('/ask-ai')}
                className="bg-transparent border-2 border-white text-white rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 hover:bg-white/10 active:scale-95 transition-all text-[11px] font-bold"
                id="emergency-voice-btn"
              >
                <Mic size={18} />
                <span>Voice</span>
              </button>

              <button
                onClick={() => navigate('/profile')}
                className="bg-transparent border-2 border-white text-white rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 hover:bg-white/10 active:scale-95 transition-all text-[11px] font-bold"
                id="emergency-expert-btn"
              >
                <Users size={18} />
                <span>Expert</span>
              </button>
            </div>
          </div>

          {/* Active Alerts List */}
          <div className="flex flex-col gap-3 mt-1">
            <div className="flex justify-between items-center w-full px-1">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                Active Alerts ({activeAlerts.length})
              </h3>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                activeAlerts.length > 0
                  ? 'bg-error-container text-on-error-container border-error/20'
                  : 'bg-[#cbffc2] text-primary border-primary/10'
              }`}>
                {activeAlerts.length > 0 ? `${activeAlerts.length} Active` : 'All Clear'}
              </span>
            </div>

            {activeAlerts.length === 0 ? (
              <div className="bg-white rounded-2xl p-5 border border-surface-container flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 rounded-full bg-[#cbffc2] flex items-center justify-center">
                  <Bell size={22} className="text-primary" />
                </div>
                <span className="text-sm font-bold text-on-surface">No active alerts</span>
                <span className="text-xs text-outline">Your farm is looking good today!</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activeAlerts.map((item) => {
                  const isExpanded = expandedAlert === item.id;
                  const { border, iconBg, badge, label, Icon } = getAlertTheme(item);

                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-2xl shadow-m3-1 border border-surface-container-high transition-all flex flex-col overflow-hidden ${border}`}
                    >
                      <div
                        onClick={() => toggleExpand(item.id)}
                        className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-container-lowest"
                        id={`alert-card-trigger-${item.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
                            <Icon size={20} />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[14px] font-bold text-on-surface leading-tight">{item.title}</span>
                              <span className={`text-[8px] font-black tracking-wide px-1.5 py-0.5 rounded ${badge}`}>{label}</span>
                            </div>
                            <span className="text-[11px] text-outline mt-1 font-medium leading-tight max-w-[210px]">
                              {item.description}
                            </span>
                            <span className="text-[10px] text-outline/60 font-bold mt-0.5">{item.time}</span>
                          </div>
                        </div>
                        <button className="text-outline shrink-0" aria-label="Toggle details">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>

                      {isExpanded && item.advice && (
                        <div className="px-4 pb-4 pt-2.5 border-t border-surface-container/50 bg-[#cbffc2]/5 text-xs text-on-surface font-medium leading-relaxed">
                          <span className="font-bold text-primary block mb-1">Recommended Action:</span>
                          {item.advice}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Alerts Timeline */}
          <div className="flex flex-col gap-3 mt-2">
            <h3 className="text-base font-bold text-on-surface px-1">Upcoming Alerts</h3>

            <div className="bg-white rounded-2xl p-5 shadow-m3-1 border border-surface-container-high flex flex-col gap-4 relative">
              {/* Vertical line */}
              {upcomingAlerts.length > 1 && (
                <div className="absolute left-[39px] top-7 bottom-7 w-[1.5px] bg-surface-container-high" />
              )}

              {upcomingAlerts.map((item: UpcomingAlert) => (
                <div key={item.id} className="flex items-center gap-4 relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-m3-1 ${UPCOMING_COLOR_MAP[item.icon] ?? 'bg-surface-container text-outline'}`}>
                    {UPCOMING_ICON_MAP[item.icon] ?? <Bell size={18} />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-on-surface leading-tight">{item.when}</span>
                    <span className="text-xs text-outline mt-0.5 font-medium leading-tight">{item.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alert Settings Toggles */}
          <div className="flex flex-col gap-3 mt-2">
            <h3 className="text-base font-bold text-on-surface px-1">Alert Settings</h3>

            <div className="grid grid-cols-2 gap-3.5">
              {(['weather', 'disease', 'irrigation', 'emergency'] as const).map((key) => (
                <div
                  key={key}
                  onClick={() => toggleSetting(key)}
                  className="bg-white rounded-xl p-3 px-4.5 border border-surface-container-high flex justify-between items-center shadow-m3-1 cursor-pointer select-none"
                  id={`toggle-setting-${key}`}
                >
                  <span className="text-xs font-bold text-on-surface capitalize">{key}</span>
                  <div className={`w-11 h-6 rounded-full flex items-center p-0.5 transition-all ${settings[key] ? 'bg-primary' : 'bg-surface-container-highest'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-all ${settings[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Auto Alert Scheduler Status */}
          <div className="flex flex-col gap-3 mt-4">
            <h3 className="text-base font-bold text-on-surface px-1">🤖 Auto-Alert Scheduler</h3>
            <div className="bg-white rounded-2xl p-4 shadow-m3-1 border border-surface-container-high flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${schedulerStatus?.running ? 'bg-primary animate-pulse' : 'bg-error'}`} />
                <span className="text-xs font-bold text-on-surface">
                  {schedulerStatus?.running ? 'Scheduler Running' : 'Scheduler Offline'}
                </span>
              </div>
              <span className="text-[11px] text-outline leading-relaxed">
                Automatically sends SMS to all farmers when weather is dangerous or every morning at 7 AM IST.
              </span>
              {schedulerStatus?.jobs?.map((job: any) => (
                <div key={job.id} className="flex justify-between items-center p-3 rounded-xl bg-surface-container-lowest border border-surface-container gap-3">
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="text-xs font-bold text-on-surface truncate">{job.name}</span>
                    <span className="text-[10px] text-outline">Next: {job.next_run}</span>
                  </div>
                  <button
                    onClick={() => handleTriggerJob(job.id)}
                    disabled={triggeringJob === job.id}
                    className="text-[10px] font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 active:scale-95 transition-all shrink-0 disabled:opacity-50"
                  >
                    {triggeringJob === job.id ? '⏳ Running…' : '▶ Run Now'}
                  </button>
                </div>
              ))}
              {!schedulerStatus?.jobs?.length && (
                <p className="text-[11px] text-outline text-center py-2">Loading scheduler info…</p>
              )}
            </div>
          </div>

          {/* Broadcast to ALL Farmers */}
          <div className="flex flex-col gap-3 mt-2">
            <h3 className="text-base font-bold text-on-surface px-1">📡 Broadcast to ALL Farmers</h3>
            <form onSubmit={handleBroadcast} className="bg-white rounded-2xl p-5 shadow-m3-1 border border-surface-container-high flex flex-col gap-3">
              <span className="text-[11px] text-outline leading-normal font-medium">
                Sends this SMS to <strong>every registered farmer</strong> in the system — use for real emergencies or important advisories.
              </span>
              <div className="flex flex-col gap-1.5 mt-1">
                <label className="text-[10px] font-bold text-[#7a5649] uppercase">Broadcast Message</label>
                <textarea
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-surface-container-high focus:outline-none focus:border-primary resize-none font-medium h-20 text-on-surface"
                  placeholder="Type emergency advisory for all farmers…"
                />
              </div>
              <div className="flex justify-between items-center gap-3">
                <select
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value)}
                  className="text-xs font-bold border border-surface-container-high rounded-xl p-2 bg-white text-on-surface cursor-pointer focus:outline-none"
                >
                  <option value="manual">📢 General Advisory</option>
                  <option value="weather">🌦️ Weather Warning</option>
                  <option value="disease">🦠 Disease Alert</option>
                  <option value="emergency">🚨 Emergency</option>
                </select>
                <button
                  type="submit"
                  disabled={broadcasting || !broadcastMsg.trim()}
                  className="bg-error text-white rounded-xl px-4 py-2 text-xs font-bold hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {broadcasting ? '📡 Broadcasting…' : '📡 Broadcast to All'}
                </button>
              </div>
              {broadcastResult && (
                <div className={`text-[11px] font-bold p-2.5 rounded-xl border ${
                  broadcastResult.success
                    ? 'bg-[#cbffc2]/50 text-primary border-primary/20'
                    : 'bg-error-container/30 text-error border-error/20'
                }`}>
                  {broadcastResult.message}
                </div>
              )}
            </form>
          </div>

          {/* Test SMS to my number */}
          <div className="flex flex-col gap-3 mt-2">
            <h3 className="text-base font-bold text-on-surface px-1">Broadcast SMS Warning Alert</h3>
            <form onSubmit={handleSendTestSms} className="bg-white rounded-2xl p-5 shadow-m3-1 border border-surface-container-high flex flex-col gap-3">
              <span className="text-[11px] text-outline leading-normal font-medium">
                Simulate a real-time hazard broadcast to the farmer's mobile. Ideal for demoing emergency/rain warnings to judges.
              </span>
              
              <div className="flex flex-col gap-1.5 mt-1">
                <label className="text-[10px] font-bold text-[#7a5649] uppercase">Alert Message</label>
                <textarea
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-surface-container-high focus:outline-none focus:border-primary resize-none font-medium h-20 text-on-surface"
                  placeholder="Type warning details..."
                />
              </div>

              <div className="flex justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <select
                    value={smsAlertType}
                    onChange={(e) => setSmsAlertType(e.target.value)}
                    className="text-xs font-bold border border-surface-container-high rounded-xl p-2 bg-white text-on-surface cursor-pointer focus:outline-none"
                  >
                    <option value="weather">🌦️ Weather Warning</option>
                    <option value="disease">🦠 Disease Warning</option>
                    <option value="expert">👨‍🌾 Expert Alert</option>
                    <option value="custom">⚠️ Hazard Warning</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={sendingSms}
                  className="bg-primary text-white rounded-xl px-4 py-2 text-xs font-bold hover:bg-primary-hover active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                >
                  {sendingSms ? 'Sending...' : 'Send SMS Warning'}
                </button>
              </div>

              {smsResult && (
                <div className={`text-[11px] font-bold p-2.5 rounded-xl border ${
                  smsResult.success 
                    ? 'bg-[#cbffc2]/50 text-primary border-primary/20' 
                    : 'bg-error-container/30 text-error border-error/20'
                }`}>
                  {smsResult.message}
                </div>
              )}
            </form>
          </div>

          {/* SMS Delivery & Status Logs */}
          <div className="flex flex-col gap-3 mt-4">
            <h3 className="text-base font-bold text-on-surface px-1">SMS Delivery & Status Logs</h3>
            <div className="bg-white rounded-2xl p-4 shadow-m3-1 border border-surface-container-high flex flex-col gap-3">
              {smsLogs.length === 0 ? (
                <div className="text-center py-4 text-xs text-outline font-medium">
                  No SMS alerts sent yet. Use the tool above to send your first alert warning!
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {smsLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex flex-col gap-1.5 p-3 rounded-xl bg-surface-container-lowest border border-surface-container">
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[10px] font-bold text-outline">To: +{log.phoneNumber}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                            log.alertType === 'weather' ? 'bg-blue-50 text-blue-600' :
                            log.alertType === 'disease' ? 'bg-amber-50 text-amber-600' :
                            'bg-[#cbffc2] text-[#0d631b]'
                          }`}>
                            {log.alertType}
                          </span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                            log.status.includes('Sent') ? 'bg-[#cbffc2] text-primary' :
                            log.status.includes('Simulated') ? 'bg-purple-50 text-purple-600' :
                            'bg-error-container text-on-error-container'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-on-surface font-medium leading-relaxed">
                        {log.message}
                      </p>
                      <span className="text-[9px] text-outline/50 font-bold font-outfit">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
