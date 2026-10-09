import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showRoleBadge?: boolean;
  onNotificationPress?: () => void;
}

export function Header({
  title = 'FixMate',
  subtitle,
  showRoleBadge = true,
  onNotificationPress,
}: HeaderProps) {
  const { profile, role, isMockMode } = useAuth();

  return (
    <View style={styles.container}>
      {isMockMode && (
        <View style={styles.mockBanner}>
          <Ionicons name="information-circle-outline" size={16} color="#B45309" />
          <Text style={styles.mockBannerText}>
            Local preview mode. Configure .env with Supabase keys for production.
          </Text>
        </View>
      )}

      <View style={styles.headerRow}>
        <View style={styles.titleArea}>
          <View style={styles.brandRow}>
            <Text style={styles.appName}>FixMate</Text>
            {showRoleBadge && role && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: role === 'provider' ? Colors.accentLight : '#DCFCE7' },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: role === 'provider' ? Colors.accent : '#15803D' },
                  ]}
                >
                  {role === 'provider' ? 'Provider' : 'Customer'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>
            {subtitle || (profile?.full_name ? `Welcome, ${profile.full_name}` : 'Home Services Marketplace')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.bellButton}
          onPress={onNotificationPress}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color={Colors.text} />
          <View style={styles.badgeDot} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  mockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  mockBannerText: {
    fontSize: 11,
    color: '#92400E',
    marginLeft: 6,
    flex: 1,
    fontWeight: '500',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleArea: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  badge: {
    marginLeft: Spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
});
