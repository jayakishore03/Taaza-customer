import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useState } from 'react';
import { ChevronLeft, Plus, MapPin, Home, Building2, X, Edit2, Trash2, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { type Address } from '../data/dummyData';

const addressLabels = ['Home', 'Office', 'Other'];

export default function DeliveryAddressesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, addAddress, updateUserAddress, deleteAddress, setDefaultAddress } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState<Omit<Address, 'id'>>({
    contactName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    landmark: '',
    label: 'Home',
    isDefault: false,
  });

  const getAddressesWithIds = (): Address[] => {
    if (!user) return [];
    const addresses = user.addresses || (user.address ? [user.address] : []);
    return addresses.map((addr, index) => ({
      ...addr,
      id: addr.id || `addr-${user.id}-${index}`,
    }));
  };

  const allAddresses = getAddressesWithIds();

  const resetForm = () => {
    setAddressForm({
      contactName: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      landmark: '',
      label: 'Home',
      isDefault: false,
    });
    setEditingAddress(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      contactName: address.contactName,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      landmark: address.landmark || '',
      label: address.label || 'Home',
      isDefault: address.isDefault || false,
    });
    setShowAddModal(true);
  };

  const handleDelete = (address: Address) => {
    if (allAddresses.length <= 1) {
      Alert.alert('Cannot Delete', 'You must have at least one address');
      return;
    }

    const addressId = address.id || `addr-${user?.id}-${allAddresses.indexOf(address)}`;
    Alert.alert(
      'Delete Address',
      `Are you sure you want to delete this ${address.label || 'address'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteAddress(addressId);
          },
        },
      ]
    );
  };

  const handleSave = () => {
    const requiredFields: Array<keyof typeof addressForm> = [
      'contactName',
      'phone',
      'street',
      'city',
      'state',
      'postalCode',
    ];

    const missingField = requiredFields.find((field) => {
      const value = addressForm[field];
      return !value || (typeof value === 'string' && value.trim().length === 0);
    });

    if (missingField) {
      Alert.alert('Incomplete Address', 'Please fill in all required fields.');
      return;
    }

    const newAddress: Address = {
      id: editingAddress?.id || `addr-${Date.now()}`,
      contactName: addressForm.contactName.trim(),
      phone: addressForm.phone.trim(),
      street: addressForm.street.trim(),
      city: addressForm.city.trim(),
      state: addressForm.state.trim(),
      postalCode: addressForm.postalCode.trim(),
      landmark: addressForm.landmark?.trim() || '',
      label: addressForm.label || 'Home',
      isDefault: addressForm.isDefault || false,
    };

    if (editingAddress) {
      const addressId = editingAddress.id || `addr-${user?.id}-${allAddresses.indexOf(editingAddress)}`;
      updateUserAddress(addressId, newAddress);
      if (newAddress.isDefault && newAddress.id) {
        setDefaultAddress(newAddress.id);
      }
    } else {
      addAddress(newAddress);
      if (newAddress.isDefault && newAddress.id) {
        setDefaultAddress(newAddress.id);
      }
    }

    setShowAddModal(false);
    resetForm();
  };

  const handleSetDefault = (address: Address) => {
    const addressId = address.id || `addr-${user?.id}-${allAddresses.indexOf(address)}`;
    setDefaultAddress(addressId);
  };

  const getLabelIcon = (label?: string) => {
    switch (label) {
      case 'Home':
        return <Home size={20} color="#10B981" strokeWidth={2} />;
      case 'Office':
        return <Building2 size={20} color="#3B82F6" strokeWidth={2} />;
      default:
        return <MapPin size={20} color="#6B7280" strokeWidth={2} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerCard}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delivery Addresses</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
        {allAddresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MapPin size={64} color="#E5E7EB" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No Addresses</Text>
            <Text style={styles.emptyText}>Add your first delivery address to get started</Text>
          </View>
        ) : (
          allAddresses.map((address) => (
            <View key={address.id} style={[styles.addressCard, address.isDefault && styles.defaultAddressCard]}>
              <View style={styles.addressHeader}>
                <View style={styles.addressLabelRow}>
                  {getLabelIcon(address.label)}
                  <Text style={styles.addressLabel}>{address.label || 'Address'}</Text>
                  {address.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>
                <View style={styles.addressActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEdit(address)}
                  >
                    <Edit2 size={18} color="#3B82F6" strokeWidth={2} />
                  </TouchableOpacity>
                  {allAddresses.length > 1 && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDelete(address)}
                    >
                      <Trash2 size={18} color="#DC2626" strokeWidth={2} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.addressDetails}>
                <Text style={styles.addressName}>{address.contactName}</Text>
                <Text style={styles.addressPhone}>{address.phone}</Text>
                <Text style={styles.addressStreet}>{address.street}</Text>
                <Text style={styles.addressCity}>
                  {address.city}, {address.state} {address.postalCode}
                </Text>
                {address.landmark && (
                  <Text style={styles.addressLandmark}>Landmark: {address.landmark}</Text>
                )}
              </View>

              {!address.isDefault && (
                <TouchableOpacity
                  style={styles.setDefaultButton}
                  onPress={() => handleSetDefault(address)}
                >
                  <Check size={16} color="#10B981" strokeWidth={2} />
                  <Text style={styles.setDefaultText}>Set as Default</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
          <Plus size={24} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.addButtonText}>Add New Address</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <X size={24} color="#1F2937" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Address Label*</Text>
                <View style={styles.labelButtons}>
                  {addressLabels.map((label) => (
                    <TouchableOpacity
                      key={label}
                      style={[
                        styles.labelButton,
                        addressForm.label === label && styles.labelButtonActive,
                      ]}
                      onPress={() => setAddressForm({ ...addressForm, label })}
                    >
                      <Text
                        style={[
                          styles.labelButtonText,
                          addressForm.label === label && styles.labelButtonTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Contact Name*</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter recipient name"
                  placeholderTextColor="#9CA3AF"
                  value={addressForm.contactName}
                  onChangeText={(value) => setAddressForm({ ...addressForm, contactName: value })}
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Mobile Number*</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={addressForm.phone}
                  onChangeText={(value) => setAddressForm({ ...addressForm, phone: value })}
                  maxLength={15}
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Street & House No.*</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="House number, street name"
                  placeholderTextColor="#9CA3AF"
                  value={addressForm.street}
                  onChangeText={(value) => setAddressForm({ ...addressForm, street: value })}
                />
              </View>

              <View style={styles.modalRow}>
                <View style={styles.modalHalfField}>
                  <Text style={styles.modalLabel}>City*</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="City"
                    placeholderTextColor="#9CA3AF"
                    value={addressForm.city}
                    onChangeText={(value) => setAddressForm({ ...addressForm, city: value })}
                  />
                </View>
                <View style={styles.modalHalfField}>
                  <Text style={styles.modalLabel}>State*</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="State"
                    placeholderTextColor="#9CA3AF"
                    value={addressForm.state}
                    onChangeText={(value) => setAddressForm({ ...addressForm, state: value })}
                  />
                </View>
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Postal Code*</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="PIN / ZIP code"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={addressForm.postalCode}
                  onChangeText={(value) => setAddressForm({ ...addressForm, postalCode: value })}
                  maxLength={10}
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Landmark (optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nearby landmark"
                  placeholderTextColor="#9CA3AF"
                  value={addressForm.landmark}
                  onChangeText={(value) => setAddressForm({ ...addressForm, landmark: value })}
                />
              </View>

              {allAddresses.length > 0 && (
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setAddressForm({ ...addressForm, isDefault: !addressForm.isDefault })}
                >
                  <View style={[styles.checkbox, addressForm.isDefault && styles.checkboxChecked]}>
                    {addressForm.isDefault && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                  <Text style={styles.checkboxLabel}>Set as default address</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSave}
              >
                <Text style={styles.modalButtonSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },
  header: {
    paddingHorizontal: 20,
  },
  headerCard: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  defaultAddressCard: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  defaultBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  addressDetails: {
    gap: 4,
  },
  addressName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  addressPhone: {
    fontSize: 13,
    color: '#6B7280',
  },
  addressStreet: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
  },
  addressCity: {
    fontSize: 14,
    color: '#4B5563',
  },
  addressLandmark: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  setDefaultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  setDefaultText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalField: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  labelButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  labelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  labelButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  labelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  labelButtonTextActive: {
    color: '#FFFFFF',
  },
  modalRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalHalfField: {
    flex: 1,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1F2937',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonSave: {
    backgroundColor: '#DC2626',
  },
  modalButtonCancelText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonSaveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

