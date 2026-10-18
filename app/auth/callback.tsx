import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Colors } from '@/constants/Theme';

export default function AuthCallback() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState('Verifying your Google account...');

  useEffect(() => {
    let isMounted = true;

    async function processUrl(urlToParse: string) {
      if (!urlToParse || !isSupabaseConfigured) {
        if (isMounted) router.replace('/(auth)/welcome');
        return;
      }

      try {
        const cleanUrl = urlToParse;
        const hashIdx = cleanUrl.indexOf('#');
        const queryIdx = cleanUrl.indexOf('?');

        const searchParams = new URLSearchParams(
          queryIdx !== -1
            ? cleanUrl.substring(queryIdx + 1, hashIdx !== -1 && hashIdx > queryIdx ? hashIdx : undefined)
            : ''
        );
        const hashParams = new URLSearchParams(
          hashIdx !== -1 ? cleanUrl.substring(hashIdx + 1) : ''
        );

        const errorDesc = searchParams.get('error_description') || hashParams.get('error_description');
        if (errorDesc) {
          console.warn('OAuth callback error:', errorDesc);
          if (isMounted) {
            setStatusMessage(`Sign-in error: ${decodeURIComponent(errorDesc)}`);
            setTimeout(() => {
              if (isMounted) router.replace('/(auth)/login');
            }, 2000);
          }
          return;
        }

        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
        const type = hashParams.get('type') || searchParams.get('type');
        const code = searchParams.get('code') || hashParams.get('code');

        let authenticatedUser: any = null;

        if (accessToken && refreshToken) {
          const { data: sData, error: sErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!sErr && sData?.user) {
            authenticatedUser = sData.user;
          }
          if (type === 'recovery') {
            if (isMounted) router.replace('/(auth)/login?reset_mode=direct');
            return;
          }
        } else if (code) {
          const { data: cData, error: cErr } = await supabase.auth.exchangeCodeForSession(code);
          if (!cErr && cData?.user) {
            authenticatedUser = cData.user;
          }
          if (!cErr && type === 'recovery') {
            if (isMounted) router.replace('/(auth)/login?reset_mode=direct');
            return;
          }
        } else {
          // Check if session is already restored
          const { data: currentSession } = await supabase.auth.getSession();
          if (currentSession?.session?.user) {
            authenticatedUser = currentSession.session.user;
          }
        }

        if (authenticatedUser) {
          if (isMounted) setStatusMessage('Setting up your dashboard...');

          // Read pending role if this was a Google Sign-Up
          let assignedRole = 'customer';
          try {
            const pendingRole = await AsyncStorage.getItem('@fixmate_pending_role');
            if (pendingRole) {
              await AsyncStorage.removeItem('@fixmate_pending_role');
            }

            const { data: prof } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', authenticatedUser.id)
              .maybeSingle();

            if (prof?.role) {
              assignedRole = prof.role;
              if (pendingRole === 'provider' && assignedRole === 'customer') {
                assignedRole = 'provider';
                await supabase.from('profiles').update({ role: 'provider' }).eq('id', authenticatedUser.id);
                // Also ensure service_providers record exists
                await supabase.from('service_providers').upsert({
                  id: authenticatedUser.id,
                  trade: 'Plumbing',
                  experience_years: 2,
                  bio: 'Skilled service professional on FixMate',
                  is_available: true,
                  approval_status: 'approved',
                });
              }
            } else if (pendingRole === 'provider') {
              assignedRole = 'provider';
            }
          } catch (rErr) {
            console.warn('Error reading profile role:', rErr);
          }

          if (isMounted) {
            if (assignedRole === 'provider' || assignedRole === 'admin') {
              router.replace('/(provider)');
            } else {
              router.replace('/(customer)');
            }
          }
          return;
        }
      } catch (pErr) {
        console.warn('URL parsing error in AuthCallback:', pErr);
      }

      if (isMounted) {
        router.replace('/(auth)/welcome');
      }
    }

    async function handleAuthRedirect() {
      try {
        const initialUrl = await Linking.getInitialURL();
        const currentUrl =
          initialUrl || (typeof window !== 'undefined' ? window.location?.href : '');
        if (currentUrl) {
          await processUrl(currentUrl);
        } else {
          if (isMounted) router.replace('/(auth)/welcome');
        }
      } catch (err) {
        console.warn('Error handling deep link callback:', err);
        if (isMounted) router.replace('/(auth)/welcome');
      }
    }

    handleAuthRedirect();

    const subscription = Linking.addEventListener('url', (event) => {
      if (event.url) {
        processUrl(event.url);
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.text}>{statusMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  text: {
    marginTop: 16,
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
});
