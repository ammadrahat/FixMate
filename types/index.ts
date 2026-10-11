export type UserRole = 'customer' | 'provider';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type JobStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';

export interface ProviderService {
  id: string;
  provider_id: string;
  title: string;
  category: string;
  description: string;
  price: number;
  duration: string;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceProvider {
  id: string;
  trade: string;
  experience_years: number;
  bio?: string | null;
  is_available: boolean;
  approval_status: ApprovalStatus;
  rating: number;
  rating_count: number;
  completed_jobs: number;
  hourly_rate?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  popularServices: string[];
  color: string;
  bgLight: string;
}

export interface ServiceItem {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: string;
  base_price: number;
  is_active: boolean;
}

export interface JobOrder {
  id: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  provider_id?: string | null;
  provider_name?: string;
  service_title: string;
  category: string;
  status: JobStatus;
  description?: string;
  scheduled_date: string;
  address: string;
  city: string;
  amount: number;
  created_at: string;
}

export interface AuthContextType {
  user: any;
  profile: Profile | null;
  providerData: ServiceProvider | null;
  role: UserRole | null;
  session: any;
  isLoading: boolean;
  isMockMode: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signup: (params: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    trade?: string;
    experienceYears?: number;
    bio?: string;
  }) => Promise<{ error: Error | null; needsEmailVerification?: boolean }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  toggleAvailability: () => Promise<void>;
}
