import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Theme';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { useSyncedOrders, SyncStatusBadge } from '@/context/SyncContext';

export default function ProviderRequestsScreen() {
  const router = useRouter();
  const { user, profile, providerData } = useAuth();
  const currentProviderId = user?.id || profile?.id || 'prov-1';
  const { orders, acceptOrder, cancelOrder, refreshOrders } = useSyncedOrders();

  // Show pending requests: either assigned to this provider or unassigned open requests
  const pendingRequests = orders.filter((o) => {
    if (o.status !== 'pending') return false;
    if (o.provider_id && o.provider_id !== currentProviderId) return false;
    return true;
  });

  const handleAccept = async (orderId: string, customerName?: string) => {
    try {
      await acceptOrder(
        orderId,
        currentProviderId,
        profile?.full_name || 'Verified FixMate Pro'
      );
      Alert.alert(
        'Job Accepted! 🎉',
        `You have accepted the job for ${customerName || 'the customer'}. It is now active in your "My Jobs" tab.`,
        [
          { text: 'Great', onPress: () => router.push('/(provider)/jobs') },
          { text: 'Stay Here', style: 'cancel' },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to accept job.');
    }
  };

  const handleDecline = (orderId: string) => {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to pass on this job request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelOrder(orderId, 'Declined by provider');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to decline request.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Job Requests"
        subtitle={`Trade: ${providerData?.trade || 'Skilled Provider'} • ${pendingRequests.length} pending`}
      />
      <View style={styles.container}>
        <SyncStatusBadge />
        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          {pendingRequests.length === 0 ? (
            <EmptyState
              icon="notifications-off-outline"
              title="No Pending Job Requests"
              description="You have responded to all current incoming job leads. Keep your status 'Available' to receive notifications as soon as a customer books in your trade!"
              actionTitle="Refresh Requests"
              onActionPress={refreshOrders}
            />
          ) : (
            pendingRequests.map((item) => (
              <View key={item.id} style={[styles.card, Shadows.card]}>
                <View style={styles.cardHeader}>
                  <View style={styles.customerBox}>
                    <Text style={styles.customerName}>
                      {item.customer_name || 'Valued Customer'}
                    </Text>
                    <View style={styles.phoneVerifiedRow}>
                      <Text style={styles.customerPhone}>
                        {item.customer_phone || '+92 300 1234567'}
                      </Text>
                      {item.customer_phone_verified && (
                        <View style={styles.verifiedPhoneTag}>
                          <Ionicons name="shield-checkmark" size={10} color="#15803D" />
                          <Text style={styles.verifiedPhoneTagText}>Verified</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.amountPill}>

                    <Text style={styles.amountText}>
                      Rs. {item.amount.toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.titleRow}>
                  <Text style={styles.serviceTitle}>{item.service_title}</Text>
                  <StatusBadge status={item.status} />
                </View>

                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={15} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>
                    {item.address}{item.city ? `, ${item.city}` : ''}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={15} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{item.scheduled_date}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Ionicons name="pricetag-outline" size={15} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>Category: {item.category}</Text>
                </View>

                {Boolean(item.description) && (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>Customer Note:</Text>
                    <Text style={styles.notesText}>{item.description}</Text>
                  </View>
                )}

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.declineBtn}
                    onPress={() => handleDecline(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleAccept(item.id, item.customer_name)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.acceptBtnText}>Accept Job</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  customerBox: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  customerPhone: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  amountPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  amountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    flex: 1,
    marginRight: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  notesBox: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginVertical: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 2,
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.sm,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  phoneVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  verifiedPhoneTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.xs,
  },
  verifiedPhoneTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
});

