import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Theme';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { SERVICE_CATEGORIES } from '@/constants/Categories';
import { useAuth } from '@/context/AuthContext';
import { useSyncedOrders, useSyncedServices } from '@/context/SyncContext';
import { JobOrder } from '@/types';

interface ServiceDetail {
  id: string;
  category: string;
  title: string;
  price: string;
  duration: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  provider_id?: string;
  provider_name?: string;
  isProviderAd?: boolean;
}

function getCategoryIcon(cat: string): keyof typeof Ionicons.glyphMap {
  const lower = (cat || '').toLowerCase();
  if (lower.includes('plumb')) return 'water';
  if (lower.includes('electr')) return 'flash';
  if (lower.includes('carp')) return 'hammer';
  if (lower.includes('paint')) return 'color-palette';
  if (lower.includes('appliance') || lower.includes('ac') || lower.includes('inverter')) return 'snow';
  if (lower.includes('mason') || lower.includes('tile')) return 'grid';
  return 'construct';
}

const ALL_SERVICES: ServiceDetail[] = [
  // Plumbing
  {
    id: 'plumb-1',
    category: 'Plumbing',
    title: 'Water Leak & Tap Repair',
    price: 'Rs. 800',
    duration: '45 mins',
    description: 'Fix leaking faucets, wash basin pipes, angle valves, and mixers.',
    icon: 'water',
  },
  {
    id: 'plumb-2',
    category: 'Plumbing',
    title: 'Water Tank & Motor Repair',
    price: 'Rs. 1,500',
    duration: '1 - 2 hrs',
    description: 'Water pump servicing, automatic float valve, and overhead tank piping.',
    icon: 'speedometer',
  },
  {
    id: 'plumb-3',
    category: 'Plumbing',
    title: 'Bathroom Sanitary Installation',
    price: 'Rs. 2,000',
    duration: '2 - 3 hrs',
    description: 'Complete commode, wash basin, shower set, and Muslim shower fitting.',
    icon: 'construct',
  },

  // Electrical Work
  {
    id: 'elec-1',
    category: 'Electrical Work',
    title: 'Ceiling Fan & Light Installation',
    price: 'Rs. 600',
    duration: '30 mins',
    description: 'Hang ceiling fans, false-ceiling cob lights, fancy chandeliers.',
    icon: 'flash',
  },
  {
    id: 'elec-2',
    category: 'Electrical Work',
    title: 'Short Circuit & Breaker Repair',
    price: 'Rs. 1,200',
    duration: '1 hr',
    description: 'Troubleshoot tripping circuit breakers, burning smells, and sparks.',
    icon: 'warning',
  },
  {
    id: 'elec-3',
    category: 'Electrical Work',
    title: 'UPS & Inverter Wiring',
    price: 'Rs. 2,500',
    duration: '2 hrs',
    description: 'Complete home UPS backup circuit distribution and battery cabling.',
    icon: 'hardware-chip',
  },

  // Masonry
  {
    id: 'mas-1',
    category: 'Masonry',
    title: 'Floor & Wall Tile Repair',
    price: 'Rs. 1,800',
    duration: '2 hrs',
    description: 'Fix cracked or loose ceramic and porcelain tiles with fresh cement mortar.',
    icon: 'grid',
  },
  {
    id: 'mas-2',
    category: 'Masonry',
    title: 'Wall Plaster & Crack Filling',
    price: 'Rs. 1,500',
    duration: '2 - 3 hrs',
    description: 'Repair damaged plaster walls, damp patches, and structural crack filling.',
    icon: 'layers',
  },

  // Carpentry
  {
    id: 'carp-1',
    category: 'Carpentry',
    title: 'Door Lock & Latch Replacement',
    price: 'Rs. 700',
    duration: '30 mins',
    description: 'Install cylindrical locks, mortise handles, deadbolts, and door stoppers.',
    icon: 'lock-closed',
  },
  {
    id: 'carp-2',
    category: 'Carpentry',
    title: 'Furniture Repair & Polish',
    price: 'Rs. 1,400',
    duration: '1 - 2 hrs',
    description: 'Reinforce wobbly dining chairs, beds, drawer slides, and touch-up wood polish.',
    icon: 'hammer',
  },

  // Painting
  {
    id: 'paint-1',
    category: 'Painting',
    title: 'Room Wall Painting (Per Room)',
    price: 'Rs. 4,500',
    duration: '1 day',
    description: 'Double coat premium plastic emulsion paint with putty preparation.',
    icon: 'color-palette',
  },
  {
    id: 'paint-2',
    category: 'Painting',
    title: 'Waterproofing & Seepage Barrier',
    price: 'Rs. 5,500',
    duration: '1 day',
    description: 'Chemical elastomeric coating on roofs and bathroom walls against seepage.',
    icon: 'shield-checkmark',
  },

  // Appliance Repair
  {
    id: 'app-1',
    category: 'Appliance Repair',
    title: 'Inverter AC Service & Gas Top-up',
    price: 'Rs. 2,800',
    duration: '1 hr',
    description: 'Indoor/outdoor coil jet wash, pressure testing, and R410A/R32 gas refill.',
    icon: 'snow',
  },
  {
    id: 'app-2',
    category: 'Appliance Repair',
    title: 'Washing Machine & Fridge Repair',
    price: 'Rs. 1,800',
    duration: '1 - 2 hrs',
    description: 'Repair automatic spinner, pump drain valve, thermostat, and compressor.',
    icon: 'cube',
  },
];

export default function CustomerServicesScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const { user, profile } = useAuth();
  const { createOrder } = useSyncedOrders();
  const { allServices } = useSyncedServices();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bookedServiceIds, setBookedServiceIds] = useState<Set<string>>(new Set());

  // Modal State
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<ServiceDetail | null>(null);
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('Lahore');
  const [preferredDateTime, setPreferredDateTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (params?.category && typeof params.category === 'string') {
      setSelectedCategory(params.category);
    }
  }, [params?.category]);

  const categories = ['All', ...SERVICE_CATEGORIES.map((c) => c.name)];

  // Live provider marketplace services combined with default catalog
  const liveProviderAds: ServiceDetail[] = (allServices || [])
    .filter((s) => s.is_active !== false)
    .map((s) => ({
      id: s.id,
      category: s.category,
      title: s.title,
      price: `Rs. ${s.price.toLocaleString()}`,
      duration: s.duration || '1-2 hrs',
      description: s.description,
      icon: getCategoryIcon(s.category),
      provider_id: s.provider_id,
      provider_name: s.provider_name || 'FixMate Verified Pro',
      isProviderAd: true,
    }));

  const allAvailableServices = [...liveProviderAds, ...ALL_SERVICES];

  const filtered = allAvailableServices.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    const matchesQuery =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      Boolean(item.provider_name && item.provider_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  const handleOpenBookingModal = (service: ServiceDetail) => {
    setSelectedService(service);
    setAddress('');
    setCity('Lahore');
    setPreferredDateTime('');
    setNotes('');
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setModalVisible(false);
    setSelectedService(null);
  };

  const handleConfirmBooking = async () => {
    if (!selectedService) return;

    if (!address.trim()) {
      Alert.alert('Required Field', 'Please enter your service address.');
      return;
    }

    try {
      setIsSubmitting(true);

      const parsedAmount =
        parseInt(selectedService.price.replace(/[^0-9]/g, ''), 10) || 1000;

      const orderData: Partial<JobOrder> = {
        customer_id: user?.id || profile?.id || 'cust-1',
        customer_name: profile?.full_name || 'Valued Customer',
        customer_phone: profile?.phone || '',
        provider_id: selectedService.provider_id || null,
        provider_name: selectedService.provider_name || 'FixMate Verified Pro',
        service_title: selectedService.title,
        category: selectedService.category,
        status: 'pending',
        description: notes.trim()
          ? `${selectedService.description} - Note: ${notes.trim()}`
          : selectedService.description,
        scheduled_date: preferredDateTime.trim() || 'Today, Flexible',
        address: address.trim(),
        city: city.trim() || 'Lahore',
        amount: parsedAmount,
        created_at: new Date().toISOString(),
      };

      const result = await createOrder(orderData);

      // Track booked status in local session state
      setBookedServiceIds((prev) => new Set(prev).add(selectedService.id));

      setModalVisible(false);

      const isOfflineBooking = result?.isOffline;
      Alert.alert(
        'Booking Confirmed! 🎉',
        isOfflineBooking
          ? `Your booking for "${selectedService.title}" was saved offline and will automatically sync once connected. A verified technician will be assigned shortly.`
          : `Your booking for "${selectedService.title}" has been successfully scheduled. A verified technician will reach out to confirm arrival.`,
        [{ text: 'Great', style: 'default' }]
      );
    } catch (err: any) {
      Alert.alert(
        'Booking Failed',
        err?.message || 'Could not complete the booking request. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="FixMate Services" subtitle="Browse and book verified home trades" />
      <View style={styles.container}>
        {/* Search Input */}
        <View style={styles.searchBox}>
          <Ionicons
            name="search"
            size={18}
            color={Colors.textSecondary}
            style={{ marginRight: 8 }}
          />
          <TextInput
            placeholder="Search specific service or task..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {Boolean(searchQuery) && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Tabs */}
        <View style={styles.categoryScrollWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryTabs}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryTab,
                  selectedCategory === cat && styles.categoryTabActive,
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    selectedCategory === cat && styles.categoryTabTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Service Cards List */}
        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="No services found"
              description="We couldn't find any services matching your filter criteria. Try resetting your search or choosing another category."
              actionTitle="Show All Services"
              onActionPress={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
            />
          ) : (
            filtered.map((service) => {
              const isBooked = bookedServiceIds.has(service.id);

              return (
                <View key={service.id} style={[styles.serviceCard, Shadows.card]}>
                  <View style={styles.serviceHeader}>
                    <View style={styles.serviceIconCircle}>
                      <Ionicons name={service.icon} size={22} color={Colors.primary} />
                    </View>
                    <View style={styles.serviceMeta}>
                      <Text style={styles.serviceTitle}>{service.title}</Text>
                      <View style={styles.tagRow}>
                        <View style={styles.categoryPill}>
                          <Text style={styles.categoryPillText}>{service.category}</Text>
                        </View>
                        <View style={styles.durationPill}>
                          <Ionicons
                            name="time-outline"
                            size={12}
                            color={Colors.textSecondary}
                          />
                          <Text style={styles.durationText}>{service.duration}</Text>
                        </View>
                        {service.isProviderAd && (
                          <View style={styles.providerBadge}>
                            <Ionicons
                              name="shield-checkmark"
                              size={11}
                              color="#15803D"
                            />
                            <Text style={styles.providerBadgeText} numberOfLines={1}>
                              {service.provider_name || 'Verified Pro'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  <Text style={styles.serviceDesc}>{service.description}</Text>

                  <View style={styles.serviceFooter}>
                    <View>
                      <Text style={styles.priceLabel}>Starting from</Text>
                      <Text style={styles.priceValue}>{service.price}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.bookButton,
                        isBooked && styles.bookedButton,
                      ]}
                      onPress={() => {
                        if (isBooked) {
                          Alert.alert(
                            'Already Booked',
                            `You have already placed a booking for "${service.title}". You can view its progress in the My Orders tab.`,
                            [
                              { text: 'Book Another', onPress: () => handleOpenBookingModal(service) },
                              { text: 'OK', style: 'cancel' },
                            ]
                          );
                        } else {
                          handleOpenBookingModal(service);
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.bookButtonText}>
                        {isBooked ? '✓ Booked' : 'Book Now'}
                      </Text>
                      <Ionicons
                        name={isBooked ? 'checkmark-circle' : 'calendar-outline'}
                        size={15}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* Booking Form Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={handleCloseModal}
              disabled={isSubmitting}
            />
            <View style={[styles.modalContent, Shadows.modal]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalHeaderTitle}>Book Service</Text>
                  {selectedService && (
                    <Text style={styles.modalHeaderSubtitle} numberOfLines={1}>
                      {selectedService.title} ({selectedService.price})
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  disabled={isSubmitting}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={22} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollBody}
              >
                {/* Selected Service Badge */}
                {selectedService && (
                  <View style={styles.selectedServiceBanner}>
                    <View style={styles.bannerIconBox}>
                      <Ionicons
                        name={selectedService.icon}
                        size={20}
                        color={Colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bannerCategory}>
                        {selectedService.category} • {selectedService.duration}
                      </Text>
                      <Text style={styles.bannerTitle}>
                        {selectedService.title}
                      </Text>
                      <Text style={styles.bannerPrice}>
                        Standard Base: {selectedService.price}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Field: Address */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Service Address <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. House 42, Block B, DHA Phase 5"
                    placeholderTextColor={Colors.textMuted}
                    value={address}
                    onChangeText={setAddress}
                  />
                </View>

                {/* Field: City */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>City</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Lahore"
                    placeholderTextColor={Colors.textMuted}
                    value={city}
                    onChangeText={setCity}
                  />
                </View>

                {/* Field: Preferred Date & Time */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Preferred Date & Time</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Today 3:00 PM"
                    placeholderTextColor={Colors.textMuted}
                    value={preferredDateTime}
                    onChangeText={setPreferredDateTime}
                  />
                </View>

                {/* Field: Optional Notes */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Optional Notes</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="Mention specific issues, gate instructions, or details..."
                    placeholderTextColor={Colors.textMuted}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelModalButton}
                    onPress={handleCloseModal}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.cancelModalButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.confirmModalButton,
                      isSubmitting && { opacity: 0.7 },
                    ]}
                    onPress={handleConfirmBooking}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.confirmModalButtonText}>
                          Confirm Booking
                        </Text>
                        <Ionicons
                          name="arrow-forward"
                          size={16}
                          color="#FFFFFF"
                        />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  categoryScrollWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.sm,
  },
  categoryTabs: {
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  serviceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  serviceMeta: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  categoryPill: {
    backgroundColor: Colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  categoryPillText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  durationText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  providerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
    maxWidth: 120,
  },
  serviceDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginVertical: Spacing.sm,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  priceLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  bookButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
  },
  bookedButton: {
    backgroundColor: Colors.success,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  modalHeaderSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
  },
  modalScrollBody: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  selectedServiceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: 12,
  },
  bannerIconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent,
    textTransform: 'uppercase',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  bannerPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  requiredStar: {
    color: Colors.danger,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  textArea: {
    height: 72,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: Spacing.sm,
  },
  cancelModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  cancelModalButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  confirmModalButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  confirmModalButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
