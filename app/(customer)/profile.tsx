import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Theme';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { DropdownSelect } from '@/components/DropdownSelect';
import { PhoneVerificationModal } from '@/components/PhoneVerificationModal';
import { PAKISTAN_CITIES } from '@/constants/Cities';
import { useAuth } from '@/context/AuthContext';

export default function CustomerProfileScreen() {
  const router = useRouter();
  const { profile, logout, isMockMode, isPhoneVerified, setPhoneVerified, updateAddress } = useAuth();
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);

  // Address edit state
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [editAddress, setEditAddress] = useState(profile?.address || '');
  const [editCity, setEditCity] = useState(profile?.city || 'Lahore');
  const [addressError, setAddressError] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  const handleOpenAddressModal = () => {
    setEditAddress(profile?.address || '');
    setEditCity(profile?.city || 'Lahore');
    setAddressError('');
    setAddressModalVisible(true);
  };

  const handleSaveAddress = async () => {
    if (!editAddress.trim()) {
      setAddressError('Please enter your street address or house number.');
      return;
    }
    setSavingAddress(true);
    try {
      await updateAddress(editAddress.trim(), editCity);
      setAddressModalVisible(false);
      Alert.alert(
        'Address Saved 🎉',
        `Your primary service address has been updated to ${editAddress.trim()}, ${editCity}.`
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update address.');
    } finally {
      setSavingAddress(false);
    }
  };


  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of FixMate?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="My Profile" subtitle="Account settings and preferences" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={[styles.profileCard, Shadows.card]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>
              {profile?.full_name
                ? profile.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()
                : 'FM'}
            </Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{profile?.full_name || 'Customer'}</Text>
            <Text style={styles.userEmail}>{profile?.email || 'customer@fixmate.com'}</Text>
            <View style={styles.roleTag}>
              <Ionicons name="shield-checkmark" size={12} color="#15803D" />
              <Text style={styles.roleTagText}>Verified Customer</Text>
            </View>
          </View>
        </View>

        {/* Contact details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Contact Information</Text>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={Colors.textSecondary} />
            <View style={styles.infoCol}>
              <View style={styles.phoneLabelRow}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                {isPhoneVerified || profile?.is_phone_verified ? (
                  <View style={styles.verifiedTag}>
                    <Ionicons name="shield-checkmark" size={11} color="#15803D" />
                    <Text style={styles.verifiedTagText}>Verified</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.verifyBtn}
                    onPress={() => setPhoneModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="shield-outline" size={11} color={Colors.primary} />
                    <Text style={styles.verifyBtnText}>Verify Free</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.infoVal}>{profile?.phone || '+92 300 1234567'}</Text>
            </View>
          </View>


          <TouchableOpacity
            style={styles.infoRow}
            onPress={handleOpenAddressModal}
            activeOpacity={0.7}
          >
            <Ionicons name="location-outline" size={18} color={Colors.textSecondary} />
            <View style={styles.infoCol}>
              <View style={styles.phoneLabelRow}>
                <Text style={styles.infoLabel}>Primary Address</Text>
                <TouchableOpacity onPress={handleOpenAddressModal}>
                  <Text style={styles.editAddressActionText}>
                    {profile?.address ? 'Edit' : '+ Add Address'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text
                style={[
                  styles.infoVal,
                  !profile?.address && { color: Colors.textMuted, fontStyle: 'italic' },
                ]}
              >
                {profile?.address
                  ? `${profile.address}, ${profile.city || 'Lahore'}`
                  : 'No address set — Tap to set your location'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Quick Menu */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Preferences & Support</Text>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={handleOpenAddressModal}
            activeOpacity={0.7}
          >
            <Ionicons name="map-outline" size={20} color={Colors.primary} />
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text style={styles.menuRowText}>Saved Addresses & Locations</Text>
              <Text style={styles.menuRowSubtext}>
                {profile?.address
                  ? `${profile.address}, ${profile.city || 'Lahore'}`
                  : 'Manage your home & workplace addresses'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => Alert.alert('Customer Helpline', 'FixMate 24/7 Helpline: 042-111-FIXMATE\nEmail: support@fixmate.pk')}
          >
            <Ionicons name="headset-outline" size={20} color={Colors.accent} />
            <Text style={styles.menuRowText}>Customer Support & FAQ</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => Alert.alert('Privacy Policy', 'FixMate guarantees user privacy and data protection.')}
          >
            <Ionicons name="shield-outline" size={20} color={Colors.success} />
            <Text style={styles.menuRowText}>Terms & Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* System & Mode Info */}
        <View style={styles.systemBox}>
          <Text style={styles.systemText}>FixMate Version 1.0.0 (Milestone 1)</Text>
          <Text style={styles.systemSubtext}>
            Environment: {isMockMode ? 'Local Preview Mode' : 'Connected to Supabase Cloud'}
          </Text>
        </View>

        {/* Logout */}
        <Button
          title="Log Out of FixMate"
          variant="danger"
          size="lg"
          icon={<Ionicons name="log-out-outline" size={20} color="#FFFFFF" />}
          onPress={handleLogout}
          style={styles.logoutBtn}
        />
      </ScrollView>

      <PhoneVerificationModal
        visible={phoneModalVisible}
        initialPhone={profile?.phone || '+92 300 1234567'}
        onClose={() => setPhoneModalVisible(false)}
        onSuccess={(verifiedPhone) => {
          setPhoneVerified(verifiedPhone);
          Alert.alert(
            'Phone Verified! 🎉',
            `Your number ${verifiedPhone} has been verified and saved to your profile.`
          );
        }}
        title="Verify Profile Phone"
        description="Verify your phone number with free instant OTP to receive technician updates and dispatch tracking."
      />

      {/* Address Edit Modal */}
      <Modal
        visible={addressModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, Shadows.card]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBox}>
                <Ionicons name="location" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.modalTitle}>Set Primary Address</Text>
              <Text style={styles.modalSubtitle}>
                Technicians use this address for on-site dispatches and visits.
              </Text>
            </View>

            {Boolean(addressError) && (
              <View style={styles.modalErrorBox}>
                <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                <Text style={styles.modalErrorText}>{addressError}</Text>
              </View>
            )}

            <View style={styles.formGroup}>
              <DropdownSelect
                label="City"
                required
                value={editCity}
                onSelect={(c) => setEditCity(c)}
                placeholder="Select City"
                options={PAKISTAN_CITIES.map((c) => ({
                  id: c.id,
                  label: c.name,
                  sublabel: c.province,
                  badge: c.isPopular ? 'Popular' : undefined,
                }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Street / House / Apartment Address</Text>
              <TextInput
                style={styles.addressInput}
                placeholder="e.g. House # 14, Street 6, Sector G-11/3"
                placeholderTextColor={Colors.textMuted}
                value={editAddress}
                onChangeText={(t) => {
                  setEditAddress(t);
                  if (addressError) setAddressError('');
                }}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                onPress={() => setAddressModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Save Address"
                variant="primary"
                size="md"
                loading={savingAddress}
                onPress={handleSaveAddress}
                style={{ flex: 1 }}
              />
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
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginTop: 6,
    gap: 4,
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  infoVal: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
    marginTop: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    gap: 12,
  },
  menuRowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  systemBox: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  systemText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  systemSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  logoutBtn: {
    marginTop: Spacing.sm,
  },
  phoneLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  verifyBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  editAddressActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  menuRowSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 420,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  modalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.dangerLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  modalErrorText: {
    fontSize: 12,
    color: Colors.danger,
    flex: 1,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  addressInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.sm,
  },
});

