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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Theme';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { JobOrder } from '@/types';

const INITIAL_ORDERS: JobOrder[] = [
  {
    id: 'ord-101',
    customer_id: 'cust-1',
    service_title: 'Bathroom Leakage & Angle Valve Repair',
    category: 'Plumbing',
    status: 'in_progress',
    provider_name: 'Usman Ghani (Plumber)',
    scheduled_date: 'Today, 2:30 PM',
    address: 'House # 42, Block B, DHA Phase 5',
    city: 'Lahore',
    amount: 1200,
    created_at: '2026-10-09',
  },
  {
    id: 'ord-102',
    customer_id: 'cust-1',
    service_title: 'Ceiling Fan & LED Chandelier Installation',
    category: 'Electrical Work',
    status: 'completed',
    provider_name: 'Tariq Mehmood (Electrician)',
    scheduled_date: 'Yesterday, 11:00 AM',
    address: 'House # 42, Block B, DHA Phase 5',
    city: 'Lahore',
    amount: 1800,
    created_at: '2026-10-08',
  },
];

export default function CustomerOrdersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'cancelled'>('active');
  const [orders, setOrders] = useState<JobOrder[]>(INITIAL_ORDERS);

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'active') return o.status === 'pending' || o.status === 'in_progress' || o.status === 'accepted';
    if (activeTab === 'completed') return o.status === 'completed';
    return o.status === 'cancelled';
  });

  const handleCancelOrder = (orderId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this service request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            setOrders((prev) =>
              prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o))
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="My Orders" subtitle="Track your service requests and past jobs" />
      <View style={styles.container}>
        {/* Filter Tabs */}
        <View style={styles.tabBar}>
          {(['active', 'completed', 'cancelled'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          {filteredOrders.length === 0 ? (
            <EmptyState
              icon={activeTab === 'active' ? 'receipt-outline' : 'checkmark-done-circle-outline'}
              title={
                activeTab === 'active'
                  ? 'No Active Orders'
                  : activeTab === 'completed'
                  ? 'No Completed Orders'
                  : 'No Cancelled Orders'
              }
              description={
                activeTab === 'active'
                  ? 'You do not have any ongoing service bookings right now. Book a trusted home pro today!'
                  : 'When your service requests are finished, you will find their receipts and ratings here.'
              }
              actionTitle="Book a Service"
              onActionPress={() => router.push('/(customer)/services')}
            />
          ) : (
            filteredOrders.map((order) => (
              <View key={order.id} style={[styles.orderCard, Shadows.card]}>
                <View style={styles.cardHeader}>
                  <View style={styles.orderIdBox}>
                    <Text style={styles.orderIdText}>#{order.id}</Text>
                    <Text style={styles.orderCategory}>{order.category}</Text>
                  </View>
                  <StatusBadge status={order.status} />
                </View>

                <Text style={styles.serviceTitle}>{order.service_title}</Text>

                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={15} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>{order.scheduled_date}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={15} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>
                    {order.address}, {order.city}
                  </Text>
                </View>

                {order.provider_name && (
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={15} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>Assigned Pro: {order.provider_name}</Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.amountLabel}>Total Amount</Text>
                    <Text style={styles.amountValue}>Rs. {order.amount.toLocaleString()}</Text>
                  </View>

                  {order.status === 'in_progress' || order.status === 'pending' ? (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleCancelOrder(order.id)}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.reorderBtn}
                      onPress={() => router.push('/(customer)/services')}
                    >
                      <Text style={styles.reorderBtnText}>Book Again</Text>
                    </TouchableOpacity>
                  )}
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  listContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  orderCard: {
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
  orderIdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  orderCategory: {
    fontSize: 11,
    color: Colors.textSecondary,
    backgroundColor: Colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginVertical: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  detailText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  amountLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  amountValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.danger,
  },
  reorderBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  reorderBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
