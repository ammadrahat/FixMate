import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Theme';

export default function IndexGateway() {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.logoText}>FixMate</Text>
        <Text style={styles.tagline}>Home Services Marketplace</Text>
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      </View>
    );
  }

  // Not logged in -> Redirect to Welcome screen
  if (!user || !role) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Role-based routing
  if (role === 'provider') {
    return <Redirect href="/(provider)" />;
  }

  return <Redirect href="/(customer)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  loader: {
    marginTop: 24,
  },
});
