import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Theme';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { SERVICE_CATEGORIES } from '@/constants/Categories';

interface ServiceDetail {
  id: string;
  category: string;
  title: string;
  price: string;
  duration: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
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
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', ...SERVICE_CATEGORIES.map((c) => c.name)];

  const filtered = ALL_SERVICES.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    const matchesQuery =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleBookService = (service: ServiceDetail) => {
    Alert.alert(
      'Service Requested',
      `You selected "${service.title}" for ${service.price}. A verified ${service.category.toLowerCase()} technician will contact you to confirm the appointment.`,
      [{ text: 'Awesome', style: 'default' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="FixMate Services" subtitle="Browse and book verified home trades" />
      <View style={styles.container}>
        {/* Search Input */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
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
            filtered.map((service) => (
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
                        <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
                        <Text style={styles.durationText}>{service.duration}</Text>
                      </View>
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
                    style={styles.bookButton}
                    onPress={() => handleBookService(service)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.bookButtonText}>Book Now</Text>
                    <Ionicons name="calendar-outline" size={14} color="#FFFFFF" />
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
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
