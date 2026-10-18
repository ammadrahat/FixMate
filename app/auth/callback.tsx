import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Colors } from '@/constants/Theme';

export default function AuthCallback() {
  const router = useRouter();
  const [statusMessage] = useState('Verifying your account...');

  useEffect(() => {
    let isMounted = true;

    async function handleAuthRedirect() {
      try {
        const initialUrl = await Linking.getInitialURL();
        const urlToParse = initialUrl || (typeof window !== 'undefined' ? window.location?.href : '');

        if (urlToParse && isSupabaseConfigured) {
          try {
            const urlObj = new URL(urlToParse);
            const hashParams = new URLSearchParams(urlObj.hash.replace(/^#/, ''));
            const queryParams = urlObj.searchParams;

            const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
            const type = hashParams.get('type') || queryParams.get('type');
            const code = queryParams.get('code');

            if (accessToken && refreshToken) {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (type === 'recovery') {
                if (isMounted) router.replace('/(auth)/login?reset_mode=direct');
                return;
              }
            } else if (code) {
              const { error } = await supabase.auth.exchangeCodeForSession(code);
              if (!error && type === 'recovery') {
                if (isMounted) router.replace('/(auth)/login?reset_mode=direct');
                return;
              }
            }
          } catch (pErr) {
            console.warn('URL parsing error:', pErr);
          }
        }

        if (isMounted) {
          router.replace('/');
        }
      } catch (err) {
        console.warn('Error handling deep link callback:', err);
        if (isMounted) {
          router.replace('/');
        }
      }
    }

    handleAuthRedirect();

    return () => {
      isMounted = false;
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
  },
});
