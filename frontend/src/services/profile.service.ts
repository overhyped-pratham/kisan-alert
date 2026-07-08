import { get, post } from './api';
import { UserProfile } from '../types';

type BackendUser = {
  name: string;
  village: string;
  district: string;
  preferredLanguage: string;
  phone: string;
  farmSize: string;
  cropType: string;
};

function mapUser(user: BackendUser): UserProfile {
  return {
    name: user.name,
    village: user.village,
    districtState: user.district,
    farmSize: user.farmSize || '5 Acres',
    cropType: user.cropType || 'Wheat',
    preferredLanguage: user.preferredLanguage as UserProfile['preferredLanguage'],
    phoneNumber: user.phone,
  };
}

export const profileService = {
  async getProfile(): Promise<UserProfile> {
    const data = await get<{ user: BackendUser }>('/api/profile');
    return mapUser(data.user);
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const data = await post<{ success: boolean; user: BackendUser }>('/api/profile/update', {
      name: profile.name,
      phone: profile.phoneNumber,
      preferredLanguage: profile.preferredLanguage,
      district: profile.districtState,
      village: profile.village,
      farmSize: profile.farmSize,
      cropType: profile.cropType,
    });
    return mapUser(data.user);
  },
};
