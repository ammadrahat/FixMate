import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Colors } from '@/constants/Theme';

export default function AuthCallback() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState('Verifying your account...');

  useEffect(() => {
    let isMounted = true;

    async function processUrl(urlToParse: string) {
      if (!urlToParse || !isSupabaseConfigured) {
        if (isMounted) router.replace('/');
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
        console.warn('URL parsing error in AuthCallback:', pErr);
      }

      if (isMounted) {
        router.replace('/');
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
          if (isMounted) router.replace('/');
        }
      } catch (err) {
        console.warn('Error handling deep link callback:', err);
        if (isMounted) router.replace('/');
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
