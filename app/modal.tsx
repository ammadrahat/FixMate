import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/Theme';

export default function ModalScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="construct" size={36} color="#FFFFFF" />
      </View>
      <Text style={styles.title}>About FixMate</Text>
      <Text style={styles.version}>Milestone 1 — Version 1.0.0</Text>

      <Text style={styles.body}>
        FixMate is Pakistan's premier home services marketplace connecting residential and commercial customers with certified plumbers, electricians, masons, carpenters, painters, and appliance technicians.
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.cardHeader}>Role-Based Access Control</Text>
        <Text style={styles.cardText}>
          • Customers can browse categories, review upfront pricing, and book technicians.
        </Text>
        <Text style={styles.cardText}>
          • Service Providers receive incoming job leads, track ongoing tasks, and update availability status in real-time.
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.cardHeader}>Database & Auth Setup</Text>
        <Text style={styles.cardText}>
          Backed by Supabase Auth and PostgreSQL with Row Level Security (RLS) enforcing customer and provider permissions.
        </Text>
      </View>

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    flexGrow: 1,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  version: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  body: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  infoCard: {
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 6,
  },
  cardText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
    marginVertical: 2,
  },
});
