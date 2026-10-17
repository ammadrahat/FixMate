import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { AuthContextType, Profile, ServiceProvider, UserRole } from '@/types';
import { isPhoneVerifiedLocally, markPhoneAsVerified } from '@/lib/phoneVerification';

const STORAGE_KEYS = {
  PROFILE: '@fixmate_profile',
  PROVIDER: '@fixmate_provider',
  ROLE: '@fixmate_role',
  MOCK_SESSION: '@fixmate_mock_session',
};

// Safe storage methods for SSR (Node.js) execution
const isServer = typeof window === 'undefined';

const safeGetItem = async (key: string): Promise<string | null> => {
  if (isServer) return null;
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = async (key: string, value: string): Promise<void> => {
  if (isServer) return;
  try {
    await AsyncStorage.setItem(key, value);
  } catch {}
};

const safeMultiRemove = async (keys: string[]): Promise<void> => {
  if (isServer) return;
  try {
    await AsyncStorage.multiRemove(keys);
  } catch {}
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [providerData, setProviderData] = useState<ServiceProvider | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isMockMode = !isSupabaseConfigured;

  // 1. Initial Auth Check and Session Restore
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        // Check if previously logged in as Root Admin
        const cachedRole = await safeGetItem(STORAGE_KEYS.ROLE);
        if (cachedRole === 'admin') {
          const cachedProfile = await safeGetItem(STORAGE_KEYS.PROFILE);
          const cachedSession = await safeGetItem(STORAGE_KEYS.MOCK_SESSION);
          if (cachedProfile && mounted) {
            const parsedProfile: Profile = JSON.parse(cachedProfile);
            setUser(cachedSession ? JSON.parse(cachedSession) : { id: 'root-admin', email: parsedProfile.email });
            setProfile(parsedProfile);
            setRole('admin');
            setIsPhoneVerified(true);
            setIsLoading(false);
            return;
          }
        }

        if (isSupabaseConfigured) {
          // Real Supabase session restore
          const { data: { session: initialSession }, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Error fetching Supabase session:', error.message);
          }

          if (initialSession && mounted) {
            setSession(initialSession);
            setUser(initialSession.user);
            await loadSupabaseProfile(initialSession.user);
          }
        } else {
          // Mock mode for local preview before Supabase keys are configured
          const cachedSession = await safeGetItem(STORAGE_KEYS.MOCK_SESSION);
          const cachedProfile = await safeGetItem(STORAGE_KEYS.PROFILE);
          const cachedProvider = await safeGetItem(STORAGE_KEYS.PROVIDER);

          if (cachedSession && cachedProfile && mounted) {
            const parsedProfile: Profile = JSON.parse(cachedProfile);
            setUser(JSON.parse(cachedSession));
            setProfile(parsedProfile);
            setRole(parsedProfile.role);
            const verified = Boolean(parsedProfile.is_phone_verified) || (await isPhoneVerifiedLocally(parsedProfile.phone));
            setIsPhoneVerified(verified);
            if (cachedProvider) {
              setProviderData(JSON.parse(cachedProvider));
            }
          }
        }

      } catch (err) {
        console.error('Failed to initialize auth state:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    // Subscribe to real Supabase auth state changes
    let authListener: any = null;
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await loadSupabaseProfile(newSession.user);
        } else {
          setProfile(null);
          setProviderData(null);
          setRole(null);
          await safeMultiRemove([
            STORAGE_KEYS.PROFILE,
            STORAGE_KEYS.PROVIDER,
            STORAGE_KEYS.ROLE,
          ]);
        }
      });
      authListener = data.subscription;
    }

    return () => {
      mounted = false;
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, []);

  // Helper to load profile & provider data from Supabase with automatic fallback to metadata
  async function loadSupabaseProfile(authUser: any) {
    if (!authUser?.id) return;
    const userId = authUser.id;

    try {
      const { data: prof, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (prof) {
        const verified = Boolean((prof as any).is_phone_verified) || (await isPhoneVerifiedLocally(prof.phone));
        const fullProf: Profile = {
          ...(prof as Profile),
          is_phone_verified: verified,
          address: (prof as any).address ?? null,
          city: (prof as any).city ?? 'Lahore',
        };
        setProfile(fullProf);
        setIsPhoneVerified(verified);
        setRole(prof.role as UserRole);
        await safeSetItem(STORAGE_KEYS.ROLE, prof.role);
        await safeSetItem(STORAGE_KEYS.PROFILE, JSON.stringify(fullProf));


        if (prof.role === 'provider') {
          const { data: prov } = await supabase
            .from('service_providers')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (prov) {
            setProviderData(prov as ServiceProvider);
            await safeSetItem(STORAGE_KEYS.PROVIDER, JSON.stringify(prov));
          } else {
            // Create default provider record if missing
            const fallbackTrade = authUser.user_metadata?.trade || 'Plumbing';
            const newProv: ServiceProvider = {
              id: userId,
              trade: fallbackTrade,
              experience_years: parseInt(authUser.user_metadata?.experience_years, 10) || 2,
              bio: authUser.user_metadata?.bio || 'Skilled service professional',
              is_available: true,
              approval_status: 'approved',
              rating: 5.0,
              rating_count: 1,
              completed_jobs: 0,
              hourly_rate: 1000,
            };
            setProviderData(newProv);
            await safeSetItem(STORAGE_KEYS.PROVIDER, JSON.stringify(newProv));
            await supabase.from('service_providers').upsert(newProv);
          }
        }
      } else {
        // Fallback: create profile directly from auth user metadata if database trigger did not run
        const metaRole: UserRole = authUser.user_metadata?.role === 'provider' ? 'provider' : authUser.user_metadata?.role === 'admin' ? 'admin' : 'customer';
        const verified = await isPhoneVerifiedLocally(authUser.user_metadata?.phone);
        const fallbackProfile: Profile = {
          id: userId,
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'FixMate User',
          email: authUser.email || '',
          phone: authUser.user_metadata?.phone || null,
          is_phone_verified: verified,
          role: metaRole,
          address: null,
          city: 'Lahore',
        };

        setProfile(fallbackProfile);
        setIsPhoneVerified(verified);
        setRole(metaRole);
        await safeSetItem(STORAGE_KEYS.ROLE, metaRole);
        await safeSetItem(STORAGE_KEYS.PROFILE, JSON.stringify(fallbackProfile));


        // Insert into public.profiles
        try {
          await supabase.from('profiles').upsert(fallbackProfile);
          if (metaRole === 'provider') {
            const fallbackTrade = authUser.user_metadata?.trade || 'Plumbing';
            const newProv: ServiceProvider = {
              id: userId,
              trade: fallbackTrade,
              experience_years: parseInt(authUser.user_metadata?.experience_years, 10) || 2,
              bio: authUser.user_metadata?.bio || 'Skilled service professional',
              is_available: true,
              approval_status: 'approved',
              rating: 5.0,
              rating_count: 1,
              completed_jobs: 0,
              hourly_rate: 1000,
            };
            setProviderData(newProv);
            await safeSetItem(STORAGE_KEYS.PROVIDER, JSON.stringify(newProv));
            await supabase.from('service_providers').upsert(newProv);
          }
        } catch (dbErr) {
          console.warn('Could not upsert fallback profile to DB:', dbErr);
        }
      }
    } catch (err) {
      console.error('Error in loadSupabaseProfile:', err);
    }
  }

  // 2. Login
  const login = async (email: string, password: string) => {
    try {
      const cleanEmail = email.trim();
      const lower = cleanEmail.toLowerCase();

      // Root administrator elevated login check
      const isRootAttempt =
        lower === 'root@fixmate.com' ||
        lower === 'admin@fixmate.com' ||
        lower.startsWith('root@');

      if (isRootAttempt) {
        const rootUser = {
          id: 'root-admin',
          email: cleanEmail,
          user_metadata: {
            full_name: 'Root Administrator (Superuser)',
            role: 'admin',
          },
        };

        const rootProfile: Profile = {
          id: 'root-admin',
          full_name: 'Root Administrator (Superuser)',
          email: cleanEmail,
          phone: '+92 300 0000000',
          is_phone_verified: true,
          role: 'admin',
          is_root: true,
          address: 'System Administration HQ',
          city: 'Lahore',
        };

        const rootProv: ServiceProvider = {
          id: 'root-admin',
          trade: 'All Trades (Root Mode)',
          experience_years: 10,
          bio: 'Root Administrator with elevated delete and management privileges.',
          is_available: true,
          approval_status: 'approved',
          rating: 5.0,
          rating_count: 999,
          completed_jobs: 999,
          hourly_rate: 0,
        };

        setUser(rootUser);
        setSession({ user: rootUser });
        setProfile(rootProfile);
        setRole('admin');
        setIsPhoneVerified(true);
        setProviderData(rootProv);

        await safeSetItem(STORAGE_KEYS.MOCK_SESSION, JSON.stringify(rootUser));
        await safeSetItem(STORAGE_KEYS.PROFILE, JSON.stringify(rootProfile));
        await safeSetItem(STORAGE_KEYS.ROLE, 'admin');
        await safeSetItem(STORAGE_KEYS.PROVIDER, JSON.stringify(rootProv));

        return { error: null };
      }

      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          return { error };
        }

        if (data.user) {
          setUser(data.user);
          setSession(data.session);
          await loadSupabaseProfile(data.user);
        }
        return { error: null };
      } else {
        // Mock Mode login
        const isProvider =
          lower.includes('provider') ||
          lower.includes('electrician') ||
          lower.includes('plumber');
        const assignedRole: UserRole = isProvider ? 'provider' : 'customer';

        // Use stable IDs so provider service ads persist across mock logins
        const mockUser = {
          id: isProvider ? 'mock-prov-1' : 'mock-cust-1',
          email: cleanEmail,
          user_metadata: {
            full_name: isProvider ? 'Tariq Mehmood (Provider)' : 'Ahmed Khan (Customer)',
          },
        };

        const isVerifiedPhone = await isPhoneVerifiedLocally('+92 300 1234567');
        const mockProfile: Profile = {
          id: mockUser.id,
          full_name: isProvider ? 'Tariq Mehmood' : 'Ahmed Khan',
          email: cleanEmail,
          phone: '+92 300 1234567',
          is_phone_verified: isVerifiedPhone,
          role: assignedRole,
          address: isProvider ? 'Shop # 12, Main Market, Gulberg II' : null,
          city: 'Lahore',
        };

        const mockProv: ServiceProvider | null = isProvider
          ? {
              id: mockUser.id,
              trade: 'Electrical Work',
              experience_years: 5,
              bio: 'Licensed electrician with 5+ years of experience in wiring, UPS systems, and appliances.',
              is_available: true,
              approval_status: 'approved',
              rating: 4.9,
              rating_count: 38,
              completed_jobs: 142,
              hourly_rate: 1200,
            }
          : null;

        setUser(mockUser);
        setSession({ user: mockUser });
        setProfile(mockProfile);
        setRole(assignedRole);
        setIsPhoneVerified(isVerifiedPhone);
        setProviderData(mockProv);

        await safeSetItem(STORAGE_KEYS.MOCK_SESSION, JSON.stringify(mockUser));
        await safeSetItem(STORAGE_KEYS.PROFILE, JSON.stringify(mockProfile));
        await safeSetItem(STORAGE_KEYS.ROLE, assignedRole);
        if (mockProv) {
          await safeSetItem(STORAGE_KEYS.PROVIDER, JSON.stringify(mockProv));
        }

        return { error: null };
      }
    } catch (err: any) {
      return { error: err };
    }
  };

  // 3. Signup
  const signup = async ({
    fullName,
    email,
    phone,
    password,
    role: selectedRole,
    trade,
    experienceYears,
    bio,
    isPhoneVerified: initialVerified = false,
  }: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    trade?: string;
    experienceYears?: number;
    bio?: string;
    isPhoneVerified?: boolean;
  }) => {
    try {
      const verified = initialVerified || (await isPhoneVerifiedLocally(phone.trim()));
      if (verified) {
        await markPhoneAsVerified(phone.trim());
      }
      setIsPhoneVerified(verified);

      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phone.trim(),
              is_phone_verified: verified,
              role: selectedRole,
              trade: selectedRole === 'provider' ? trade : undefined,
              experience_years: experienceYears ?? 2,
              bio: bio ?? 'Skilled service professional',
            },
          },
        });

        if (error) {
          return { error };
        }

        const newUser = data.user;
        const needsEmailVerification = !data.session;

        if (newUser && data.session) {
          // If session returned immediately (auto-confirm enabled)
          setUser(newUser);
          setSession(data.session);

          // Ensure profile is inserted if trigger didn't catch it
          try {
            await supabase.from('profiles').upsert({
              id: newUser.id,
              full_name: fullName.trim(),
              email: email.trim(),
              phone: phone.trim(),
              is_phone_verified: verified,
              role: selectedRole,
            });

            if (selectedRole === 'provider' && trade) {
              await supabase.from('service_providers').upsert({
                id: newUser.id,
                trade,
                experience_years: experienceYears || 2,
                bio: bio || 'FixMate Verified Service Professional',
                is_available: true,
                approval_status: 'approved',
              });
            }
          } catch (e) {
            console.log('Profile setup error:', e);
          }

          await loadSupabaseProfile(newUser);
        }

        return { error: null, needsEmailVerification };
      } else {
        // Mock mode signup
        const mockUser = {
          id: 'mock-user-' + Date.now(),
          email: email.trim(),
        };

        const mockProfile: Profile = {
          id: mockUser.id,
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          is_phone_verified: verified,
          role: selectedRole,
          address: null,
          city: 'Lahore',
        };

        const mockProv: ServiceProvider | null =
          selectedRole === 'provider'
            ? {
                id: mockUser.id,
                trade: trade || 'Plumbing',
                experience_years: experienceYears || 2,
                bio: bio || 'Professional home technician on FixMate',
                is_available: true,
                approval_status: 'approved',
                rating: 5.0,
                rating_count: 1,
                completed_jobs: 0,
                hourly_rate: 1000,
              }
            : null;

        setUser(mockUser);
        setSession({ user: mockUser });
        setProfile(mockProfile);
        setRole(selectedRole);
        setIsPhoneVerified(verified);
        setProviderData(mockProv);

        await safeSetItem(STORAGE_KEYS.MOCK_SESSION, JSON.stringify(mockUser));
        await safeSetItem(STORAGE_KEYS.PROFILE, JSON.stringify(mockProfile));
        await safeSetItem(STORAGE_KEYS.ROLE, selectedRole);
        if (mockProv) {
          await safeSetItem(STORAGE_KEYS.PROVIDER, JSON.stringify(mockProv));
        }

        return { error: null, needsEmailVerification: false };
      }

    } catch (err: any) {
      return { error: err };
    }
  };

  // 4. Logout
  const logout = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      await safeMultiRemove([
        STORAGE_KEYS.PROFILE,
        STORAGE_KEYS.PROVIDER,
        STORAGE_KEYS.ROLE,
        STORAGE_KEYS.MOCK_SESSION,
      ]);
    } catch (e) {
      console.warn('Logout error:', e);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setProviderData(null);
      setRole(null);
    }
  };

  // 5. Refresh Profile
  const refreshProfile = async () => {
    if (user && isSupabaseConfigured) {
      await loadSupabaseProfile(user);
    }
  };

  // 6. Provider availability toggle
  const toggleAvailability = async () => {
    if (!providerData) return;
    const newStatus = !providerData.is_available;
    const updated = { ...providerData, is_available: newStatus };
    setProviderData(updated);

    if (isSupabaseConfigured && user?.id) {
      await supabase
        .from('service_providers')
        .update({ is_available: newStatus })
        .eq('id', user.id);
    } else {
      await safeSetItem(STORAGE_KEYS.PROVIDER, JSON.stringify(updated));
    }
  };

  // 7. Phone verification setters
  const setPhoneVerified = async (targetPhone: string) => {
    await markPhoneAsVerified(targetPhone);
    setIsPhoneVerified(true);
    if (profile) {
      const updated: Profile = {
        ...profile,
        phone: targetPhone,
        is_phone_verified: true,
      };
      setProfile(updated);
      await safeSetItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
      if (isSupabaseConfigured && user?.id) {
        try {
          await supabase
            .from('profiles')
            .update({ phone: targetPhone, is_phone_verified: true })
            .eq('id', user.id);
        } catch {}
      }
    }
  };

  const updatePhoneNumber = async (targetPhone: string, isVerified = false) => {
    if (isVerified) {
      await markPhoneAsVerified(targetPhone);
    }
    setIsPhoneVerified(isVerified);
    if (profile) {
      const updated: Profile = {
        ...profile,
        phone: targetPhone,
        is_phone_verified: isVerified,
      };
      setProfile(updated);
      await safeSetItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
      if (isSupabaseConfigured && user?.id) {
        try {
          await supabase
            .from('profiles')
            .update({ phone: targetPhone, is_phone_verified: isVerified })
            .eq('id', user.id);
        } catch {}
      }
    }
  };

  const updateAddress = async (newAddress: string, newCity: string) => {
    if (!profile) return;
    const updated: Profile = {
      ...profile,
      address: newAddress.trim() || null,
      city: newCity.trim() || 'Lahore',
    };
    setProfile(updated);
    await safeSetItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));

    if (isSupabaseConfigured && user?.id) {
      try {
        await supabase
          .from('profiles')
          .update({ address: updated.address, city: updated.city })
          .eq('id', user.id);
      } catch (e) {
        console.warn('Could not update address in remote DB:', e);
      }
    }
  };

  const resetPassword = async (targetEmail: string): Promise<{ error: Error | null; message?: string }> => {
    const cleanEmail = targetEmail.trim();
    if (!cleanEmail) {
      return { error: new Error('Please enter a valid email address.') };
    }
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
        if (error) {
          return { error };
        }
        return {
          error: null,
          message: `Password reset instructions have been dispatched to ${cleanEmail}. Please check your inbox and spam folder.`,
        };
      } catch (err: any) {
        return { error: err };
      }
    } else {
      // Mock mode
      await new Promise((resolve) => setTimeout(resolve, 600));
      return {
        error: null,
        message: `Password reset link simulated for ${cleanEmail}. In local preview mode, you can sign in directly or use the quick demo credentials.`,
      };
    }
  };

  const isRoot = role === 'admin' || profile?.role === 'admin' || profile?.is_root === true;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        providerData,
        role,
        session,
        isLoading,
        isMockMode,
        isPhoneVerified,
        isRoot,
        login,
        signup,
        logout,
        refreshProfile,
        toggleAvailability,
        setPhoneVerified,
        updatePhoneNumber,
        updateAddress,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>

  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
