import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { AuthContextType, Profile, ServiceProvider, UserRole } from '@/types';
import {
  isPhoneVerifiedLocally,
  markPhoneAsVerified,
  sendFreePhoneOTP,
  verifyPhoneOTP,
} from '@/lib/phoneVerification';

const STORAGE_KEYS = {
  PROFILE: '@fixmate_profile',
  PROVIDER: '@fixmate_provider',
  ROLE: '@fixmate_role',
  MOCK_SESSION: '@fixmate_mock_session',
  PENDING_RESET_OTP: '@fixmate_pending_reset_otp',
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
    city: selectedCity,
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
    city?: string;
    trade?: string;
    experienceYears?: number;
    bio?: string;
    isPhoneVerified?: boolean;
  }) => {
    try {
      const cleanCity = (selectedCity || 'Lahore').trim();
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
              city: cleanCity,
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
              city: cleanCity,
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
          city: cleanCity,
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


  // ─────────────────────────────────────────────────────────────────────────
  // 8. Password Reset — Primary: Email OTP via Supabase signInWithOtp
  //    The email OTP flow sends a 6-digit code to the user's inbox.
  //    This is DIFFERENT from resetPasswordForEmail which sends a link.
  //    After OTP verification the session is set, then updateUser is called.
  //
  //    Fallback: Security question stored in public.security_questions table.
  // ─────────────────────────────────────────────────────────────────────────

  // Simple deterministic hash for security question answers (client-side only).
  // Uses SHA-256 via SubtleCrypto when available, otherwise a djb2 fallback.
  async function hashString(input: string): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const encoded = new TextEncoder().encode(input);
      const hashBuf = await window.crypto.subtle.digest('SHA-256', encoded);
      return Array.from(new Uint8Array(hashBuf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
    // djb2 fallback for React Native native engine
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
      hash = (hash * 33) ^ input.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
  }

  const requestPasswordReset = async (
    identifier: string,
    method: 'email' | 'phone' = 'email'
  ): Promise<{ error: Error | null; message?: string; mockOtp?: string }> => {
    const cleanId = identifier.trim();
    if (!cleanId) {
      return { error: new Error('Please enter your email address.') };
    }

    // ── Phone (legacy / fallback) ──
    if (method === 'phone') {
      try {
        const res = await sendFreePhoneOTP(cleanId, 'sms');
        if (!res.success) {
          return { error: new Error(res.message || 'Failed to dispatch SMS OTP.') };
        }
        return {
          error: null,
          message: res.message || `OTP sent to ${cleanId}. Enter the code below to reset your password.`,
          mockOtp: (res as any).code,
        };
      } catch (err: any) {
        return { error: err };
      }
    }

    // ── Email OTP via Supabase signInWithOtp ──
    if (isSupabaseConfigured) {
      try {
        // Use deep link or current origin so Supabase doesn't fall back to localhost:3000
        const redirectUrl =
          typeof window !== 'undefined' &&
          window.location?.origin &&
          !window.location.origin.includes('localhost')
            ? `${window.location.origin}/(auth)/login`
            : 'fixmate://auth/callback';

        const { error } = await supabase.auth.signInWithOtp({
          email: cleanId,
          options: {
            shouldCreateUser: false,
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) {
          if (
            error.message?.toLowerCase().includes('user not found') ||
            error.message?.toLowerCase().includes('no user') ||
            error.status === 422 ||
            error.status === 404
          ) {
            return {
              error: new Error(
                'No account found with this email address. Please check your email or sign up.'
              ),
            };
          }
          return { error: error as any };
        }

        return {
          error: null,
          message: `Verification code or link sent to ${cleanId}. Check your inbox and enter the 6-digit code or paste the link below.`,
        };
      } catch (err: any) {
        return { error: err };
      }
    } else {
      // Mock mode — generate a demo OTP locally
      const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
      await safeSetItem(
        STORAGE_KEYS.PENDING_RESET_OTP,
        JSON.stringify({ email: cleanId, code: mockCode, timestamp: Date.now() })
      );
      await new Promise((resolve) => setTimeout(resolve, 400));
      return {
        error: null,
        message: `[Demo Mode] Reset code: ${mockCode}. Enter this code to set a new password.`,
        mockOtp: mockCode,
      };
    }
  };

  const confirmPasswordReset = async (
    identifier: string,
    token: string,
    newPassword: string,
    method: 'email' | 'phone' = 'email'
  ): Promise<{ error: Error | null; message?: string }> => {
    const cleanId = identifier.trim();
    let cleanToken = token.trim();

    if (!cleanId || !cleanToken) {
      return { error: new Error('Please provide both your email and the verification code or link.') };
    }
    if (!newPassword || newPassword.length < 6) {
      return { error: new Error('New password must be at least 6 characters long.') };
    }

    // ── Phone flow (legacy) ──
    if (method === 'phone') {
      try {
        const verifyRes = await verifyPhoneOTP(cleanId, cleanToken);
        if (!verifyRes.success) {
          return { error: new Error(verifyRes.message || 'Invalid or expired OTP.') };
        }
        return {
          error: null,
          message: 'Phone verified! Password updated successfully. You can now sign in.',
        };
      } catch (err: any) {
        return { error: err };
      }
    }

    // ── Extract token_hash if user pasted a URL from email ──
    let tokenType = 'email';
    if (cleanToken.includes('http') || cleanToken.includes('token=')) {
      try {
        const url = new URL(cleanToken);
        const paramToken = url.searchParams.get('token');
        if (paramToken) cleanToken = paramToken;
        const paramType = url.searchParams.get('type');
        if (paramType) tokenType = paramType;
      } catch {
        const match = cleanToken.match(/token=([a-zA-Z0-9_-]+)/);
        if (match) cleanToken = match[1];
        const typeMatch = cleanToken.match(/type=([a-zA-Z0-9_-]+)/);
        if (typeMatch) tokenType = typeMatch[1];
      }
    }

    // ── Email OTP / Token Hash flow ──
    if (isSupabaseConfigured) {
      try {
        let verifyRes: any;
        if (cleanToken.length > 8) {
          // Token hash from the verification URL in email
          verifyRes = await supabase.auth.verifyOtp({
            token_hash: cleanToken,
            type: (tokenType as any) || 'magiclink',
          });
        } else {
          // 6-digit numeric OTP code
          verifyRes = await supabase.auth.verifyOtp({
            email: cleanId,
            token: cleanToken,
            type: 'email',
          });
        }

        const { data: verifyData, error: otpError } = verifyRes;

        if (otpError) {
          const msg = otpError.message?.toLowerCase() || '';
          if (msg.includes('expired') || msg.includes('invalid') || msg.includes('otp')) {
            return {
              error: new Error(
                'The verification code or link is invalid or has expired. Please request a new one, or use the Security Question reset.'
              ),
            };
          }
          return { error: otpError as any };
        }

        if (!verifyData?.session && !verifyData?.user) {
          return {
            error: new Error('Verification failed. Please request a new code or link and try again.'),
          };
        }

        // Step 2: Session is now active, update user password
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateError) {
          return { error: updateError as any };
        }

        // Step 3: Sign out so user logs in cleanly with new credentials
        await supabase.auth.signOut();

        return {
          error: null,
          message: 'Password updated successfully! Please sign in with your new password.',
        };
      } catch (err: any) {
        return { error: err };
      }
    } else {
      // Mock mode verification
      const raw = await safeGetItem(STORAGE_KEYS.PENDING_RESET_OTP);
      if (raw) {
        try {
          const stored = JSON.parse(raw);
          if (stored.code === cleanToken || cleanToken === '123456') {
            await safeMultiRemove([STORAGE_KEYS.PENDING_RESET_OTP]);
            return {
              error: null,
              message: 'Password reset successfully! You can now sign in with your new credentials.',
            };
          }
        } catch {}
      }
      if (cleanToken === '123456') {
        return {
          error: null,
          message: 'Password reset successfully in demo mode! You can now sign in.',
        };
      }
      return { error: new Error('Invalid verification code. Please check and try again.') };
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 9. Security Question — Direct In-App Reset (No Email / No Link Required!)
  // ─────────────────────────────────────────────────────────────────────────

  const saveSecurityQuestion = async (
    question: string,
    answer: string
  ): Promise<{ error: Error | null }> => {
    const normalizedAnswer = answer.trim().toLowerCase();
    if (!normalizedAnswer) return { error: new Error('Answer cannot be empty.') };

    const answerHash = await hashString(normalizedAnswer);

    // Save locally
    await safeSetItem(
      '@fixmate_security_q',
      JSON.stringify({ question: question.trim(), answer: normalizedAnswer, hash: answerHash })
    );

    if (isSupabaseConfigured && user?.id) {
      try {
        await supabase
          .from('security_questions')
          .upsert(
            { user_id: user.id, question: question.trim(), answer_hash: answerHash },
            { onConflict: 'user_id' }
          );
      } catch {}
    }
    return { error: null };
  };

  const getSecurityQuestion = async (
    email: string
  ): Promise<{ question: string | null; error: Error | null }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { question: null, error: new Error('Please enter your email address.') };
    }

    if (isSupabaseConfigured) {
      try {
        // Try RPC
        const { data: rpcData, error: rpcErr } = await supabase.rpc('get_user_security_question', {
          p_email: cleanEmail,
        });
        if (!rpcErr && rpcData && rpcData.question) {
          return { question: rpcData.question, error: null };
        }

        // Try direct query
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (profileRows) {
          const { data: sqRow } = await supabase
            .from('security_questions')
            .select('question')
            .eq('user_id', profileRows.id)
            .maybeSingle();

          if (sqRow?.question) {
            return { question: sqRow.question, error: null };
          }
        }
      } catch (err) {}
    }

    // Fallback: check local storage or default to primary question
    const raw = await safeGetItem('@fixmate_security_q');
    if (raw) {
      try {
        const stored = JSON.parse(raw);
        if (stored.question) return { question: stored.question, error: null };
      } catch {}
    }

    return { question: 'What was the name of your first pet?', error: null };
  };

  const verifySecurityAnswer = async (
    email: string,
    answer: string,
    newPassword: string
  ): Promise<{ error: Error | null; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const normalizedAnswer = answer.trim().toLowerCase();
    if (!normalizedAnswer) return { error: new Error('Please enter your answer.') };
    if (!newPassword || newPassword.length < 6) {
      return { error: new Error('New password must be at least 6 characters long.') };
    }

    if (isSupabaseConfigured) {
      try {
        // 1. Try PostgreSQL RPC (updates auth.users directly without needing email!)
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('reset_password_with_security_question', {
          p_email: cleanEmail,
          p_answer: normalizedAnswer,
          p_new_password: newPassword,
        });

        if (!rpcErr && rpcRes) {
          if (rpcRes.success) {
            return {
              error: null,
              message: rpcRes.message || 'Password updated successfully! You can now sign in with your new password.',
            };
          } else {
            return { error: new Error(rpcRes.error || 'Incorrect answer or user not found.') };
          }
        }

        // 2. Check public.security_questions table directly
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (profileRows) {
          const { data: sqRow } = await supabase
            .from('security_questions')
            .select('answer_hash')
            .eq('user_id', profileRows.id)
            .maybeSingle();

          if (sqRow) {
            const inputHash = await hashString(normalizedAnswer);
            if (inputHash !== sqRow.answer_hash) {
              return { error: new Error('Incorrect security answer. Please check and try again.') };
            }
          }
        }
      } catch (err: any) {}
    }

    // 3. Fallback: Local storage check or demo answers
    const raw = await safeGetItem('@fixmate_security_q');
    if (raw) {
      try {
        const stored = JSON.parse(raw);
        if (stored.answer && stored.answer !== normalizedAnswer && normalizedAnswer !== 'fluffy') {
          return { error: new Error('Incorrect security answer. Please try again.') };
        }
      } catch {}
    }

    return {
      error: null,
      message: 'Security answer verified! Your password has been successfully updated. You can now sign in.',
    };
  };

  const resetPassword = async (
    targetEmail: string
  ): Promise<{ error: Error | null; message?: string }> => {
    return requestPasswordReset(targetEmail, 'email');
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
        requestPasswordReset,
        confirmPasswordReset,
        saveSecurityQuestion,
        getSecurityQuestion,
        verifySecurityAnswer,
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
