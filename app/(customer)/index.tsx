import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Theme';
import { Header } from '@/components/Header';
import { CategoryCard } from '@/components/CategoryCard';
import { SERVICE_CATEGORIES } from '@/constants/Categories';

export default function CustomerHomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = SERVICE_CATEGORIES.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.popularServices.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search plumber, electrician, carpenter..."
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

        {/* Emergency / Fast Booking Banner */}
        <View style={styles.promoBanner}>
          <View style={styles.promoTextContainer}>
            <View style={styles.promoBadge}>
              <Text style={styles.promoBadgeText}>URGENT SERVICE</Text>
            </View>
            <Text style={styles.promoTitle}>Need an Emergency Fix?</Text>
            <Text style={styles.promoSubtitle}>
              Get a verified technician at your doorstep within 45 minutes in Lahore, Karachi & Islamabad.
            </Text>
            <TouchableOpacity
              style={styles.promoButton}
              onPress={() => router.push('/(customer)/services')}
              activeOpacity={0.8}
            >
              <Text style={styles.promoButtonText}>Book Fast Fix</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.promoIconBox}>
            <Ionicons name="speedometer" size={48} color={Colors.accent} />
          </View>
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Service Categories</Text>
          <TouchableOpacity onPress={() => router.push('/(customer)/services')}>
            <Text style={styles.seeAllText}>View Catalog</Text>
          </TouchableOpacity>
        </View>

        {/* Categories List */}
        {filteredCategories.length === 0 ? (
          <View style={styles.noResults}>
            <Ionicons name="search-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.noResultsText}>No services match your search.</Text>
          </View>
        ) : (
          filteredCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onPress={() => router.push('/(customer)/services')}
            />
          ))
        )}

        {/* Trust Badges */}
        <View style={styles.trustSection}>
          <Text style={styles.trustTitle}>The FixMate Guarantee</Text>
          <View style={styles.trustGrid}>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
              <Text style={styles.trustItemTitle}>Background Checked</Text>
              <Text style={styles.trustItemDesc}>100% verified CNIC & skill checks</Text>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="cash-outline" size={24} color={Colors.success} />
              <Text style={styles.trustItemTitle}>Standard Pricing</Text>
              <Text style={styles.trustItemDesc}>Pre-approved rate card, no haggling</Text>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="refresh-outline" size={24} color={Colors.warning} />
              <Text style={styles.trustItemTitle}>7-Day Warranty</Text>
              <Text style={styles.trustItemDesc}>Re-work guaranteed if not satisfied</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  promoBanner: {
    backgroundColor: '#0F172A',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.raised,
  },
  promoTextContainer: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  promoBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  promoBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  promoTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  promoSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  promoButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
  },
  promoButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  promoIconBox: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  noResults: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  noResultsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  trustSection: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trustTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  trustGrid: {
    gap: 12,
  },
  trustItem: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trustItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 4,
  },
  trustItemDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
});
