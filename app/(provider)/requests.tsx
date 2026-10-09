import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Theme';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/context/AuthContext';

interface JobRequestItem {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceTitle: string;
  location: string;
  scheduleTime: string;
  amount: number;
  notes: string;
}

const INITIAL_REQUESTS: JobRequestItem[] = [
  {
    id: 'req-01',
    customerName: 'Kamran Ashraf',
    customerPhone: '+92 321 9876543',
    serviceTitle: 'Main Distribution Breaker Tripping',
    location: 'Model Town, Block C, Lahore',
    scheduleTime: 'Today at 3:30 PM',
    amount: 1500,
    notes: 'The main 63A circuit breaker trips whenever AC turns on. Need urgent inspection.',
  },
  {
    id: 'req-02',
    customerName: 'Fatima Zahra',
    customerPhone: '+92 333 4567890',
    serviceTitle: 'Ceiling Fan Installation (2 Units)',
    location: 'Johar Town, Phase 1, Lahore',
    scheduleTime: 'Tomorrow at 11:00 AM',
    amount: 1200,
    notes: 'Brand new Pak Fan units in box. Hook and rod already installed in ceiling.',
  },
  {
    id: 'req-03',
    customerName: 'Shahid Hussain',
    customerPhone: '+92 300 8765432',
    serviceTitle: 'UPS Automatic Switch Troubleshooting',
    location: 'Faisal Town, Lahore',
    scheduleTime: 'Tomorrow at 4:00 PM',
    amount: 2000,
    notes: 'Inverter does not switch back to WAPDA mains automatically.',
  },
];

export default function ProviderRequestsScreen() {
  const { providerData } = useAuth();
  const [requests, setRequests] = useState<JobRequestItem[]>(INITIAL_REQUESTS);

  const handleAccept = (req: JobRequestItem) => {
    Alert.alert(
      'Job Accepted!',
      `You have accepted the job for ${req.customerName}. It has been moved to your "My Jobs" tab.`,
      [
        {
          text: 'Great',
          onPress: () => {
            setRequests((prev) => prev.filter((r) => r.id !== req.id));
          },
        },
      ]
    );
  };

  const handleDecline = (reqId: string) => {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to pass on this job request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            setRequests((prev) => prev.filter((r) => r.id !== reqId));
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Job Requests"
        subtitle={`Trade: ${providerData?.trade || 'Skilled Provider'}`}
      />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          {requests.length === 0 ? (
            <EmptyState
              icon="notifications-off-outline"
              title="No Pending Job Requests"
              description="You have responded to all current incoming job leads. Keep your status 'Available' to receive notifications as soon as a customer books in your trade!"
              actionTitle="Refresh Requests"
              onActionPress={() => setRequests(INITIAL_REQUESTS)}
            />
          ) : (
            requests.map((item) => (
              <View key={item.id} style={[styles.card, Shadows.card]}>
                <View style={styles.cardHeader}>
                  <View style={styles.customerBox}>
                    <Text style={styles.customerName}>{item.customerName}</Text>
                    <Text style={styles.customerPhone}>{item.customerPhone}</Text>
                  </View>
                  <View style={styles.amountPill}>
                    <Text style={styles.amountText}>Rs. {item.amount.toLocaleString()}</Text>
                  </View>
                </View>

                <Text style={styles.serviceTitle}>{item.serviceTitle}</Text>

                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={15} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{item.location}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={15} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{item.scheduleTime}</Text>
                </View>

                <View style={styles.notesBox}>
                  <Text style={styles.notesLabel}>Customer Note:</Text>
                  <Text style={styles.notesText}>{item.notes}</Text>
                </View>

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
                    onPress={() => handleAccept(item)}
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
  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 6,
    marginBottom: 6,
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
});
