import { get, post } from './api';
import { AlertItem, WeatherAdvisory } from '../types';

export interface RiskScores {
  overall: number;
  label: string;
  color: 'error' | 'warning' | 'success';
  weather: number;
  disease: number;
  water: number;
}

export interface UpcomingAlert {
  id: string;
  icon: 'rain' | 'plant' | 'thermometer' | 'sun';
  when: string;
  description: string;
}

export interface AlertsPayload {
  riskScores: RiskScores;
  activeAlerts: AlertItem[];
  upcomingAlerts: UpcomingAlert[];
  weather: {
    temp: number;
    humidity: number;
    location: string;
    forecast: string;
  };
}

export const alertsService = {
  /** Fetch full smart alerts data from the backend. */
  async getAlertsData(): Promise<AlertsPayload> {
    return get<AlertsPayload>('/api/alerts');
  },

  /** Legacy: get weather advisory only (public, no auth needed). */
  async getWeatherAdvisory(location: string): Promise<WeatherAdvisory> {
    return get<WeatherAdvisory>(`/api/weather/advisory?location=${encodeURIComponent(location)}`);
  },

  /** Legacy compat: derive AlertItem[] from advisory — used by dashboard. */
  async getAlertsList(): Promise<AlertItem[]> {
    try {
      const data = await this.getAlertsData();
      return data.activeAlerts;
    } catch {
      // Fallback to weather advisory if not authenticated
      const advisory = await this.getWeatherAdvisory('Pune');
      return advisory.alerts
        .filter(a => !a.includes('No active'))
        .map((text, i) => ({
          id: `alert-${i + 1}`,
          type: 'weather' as const,
          severity: (text.toLowerCase().includes('warning') || text.toLowerCase().includes('heavy'))
            ? 'danger' as const
            : 'warning' as const,
          title: text.split('—')[0]?.trim() || text,
          description: text,
          time: 'Today',
          advice: 'Check your fields and take appropriate action.',
        }));
    }
  },

  /** Dismiss an alert (server-side no-op for now). */
  async dismissAlert(alertId: string): Promise<void> {
    await post('/api/alerts/dismiss', { alertId });
  },

  /** Fetch SMS delivery logs for the current user. */
  async getSmsLogs(): Promise<any[]> {
    try {
      return await get<any[]>('/api/alerts/history');
    } catch {
      return get<any[]>('/api/sms/logs');
    }
  },

  /** Trigger a test SMS warning alert (to current user only). */
  async sendTestSms(message: string, alertType: string = 'custom'): Promise<any> {
    return post<any>('/api/sms/send-test', { message, alertType });
  },

  /** Broadcast an SMS alert to ALL registered users. */
  async broadcastAlert(message: string, alertType: string = 'manual'): Promise<any> {
    return post<any>('/api/alerts/send', { message, alert_type: alertType });
  },

  /** Get automatic scheduler status (next run times). */
  async getSchedulerStatus(): Promise<any> {
    return get<any>('/api/alerts/scheduler/status');
  },

  /** Manually trigger a scheduled job immediately. */
  async triggerSchedulerJob(jobId: string): Promise<any> {
    return post<any>(`/api/alerts/scheduler/trigger/${jobId}`, {});
  },
};
