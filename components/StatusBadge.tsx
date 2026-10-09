import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BorderRadius } from '@/constants/Theme';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  let bg = '#F1F5F9';
  let text = '#475569';

  switch (normalized) {
    case 'approved':
    case 'completed':
    case 'available':
      bg = '#DCFCE7';
      text = '#15803D';
      break;
    case 'pending':
    case 'busy':
      bg = '#FEF3C7';
      text = '#B45309';
      break;
    case 'in_progress':
    case 'accepted':
      bg = '#E0F2FE';
      text = '#0369A1';
      break;
    case 'cancelled':
    case 'rejected':
      bg = '#FEE2E2';
      text = '#B91C1C';
      break;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: text }]}>
        {status.replace('_', ' ').toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
