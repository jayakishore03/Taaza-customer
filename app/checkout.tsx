import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft, MapPin, ChevronRight, Plus, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import {
  dummyAddOns,
  dummyAddress,
  DELIVERY_CHARGE,
  COUPON_CODES,
  type Address,
} from '../data/dummyData';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { ordersApi, usersApi } from '../lib/api';
import { getAuthToken } from '../lib/auth/helper';

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0.0);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [userCoordinates, setUserCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const { user, isAuthenticated, updateAddress } = useAuth();

  const defaultAddress = useMemo<Address>(
    () => (user?.address ? { ...user.address } : { ...dummyAddress }),
    [user]
  );

  const [address, setAddress] = useState<Address>(defaultAddress);
  const [addressForm, setAddressForm] = useState<Address>(defaultAddress);
  const { cartItems, getTotalPrice, selectedShop } = useCart();

  const addOns = dummyAddOns;

  // Get user location
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return;
        }

        const locationData = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setUserCoordinates({
          latitude: locationData.coords.latitude,
          longitude: locationData.coords.longitude,
        });
      } catch (error) {
        // Silently fail - location is optional
      }
    };

    getCurrentLocation();
  }, []);

  // Fetch user's order count to determine delivery charge
  useEffect(() => {
    const fetchOrderCount = async () => {
      if (!isAuthenticated || !user) {
        setOrderCount(0);
        return;
      }

      try {
        await getAuthToken();
        const orders = await ordersApi.getAll();
        setOrderCount(orders.length);
      } catch (error) {
        // If error, assume 0 orders (new user gets free delivery)
        setOrderCount(0);
      }
    };

    fetchOrderCount();
  }, [isAuthenticated, user]);

  // Calculate distance-based delivery charge
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate delivery charge based on distance (₹10 per km)
  const calculatedDeliveryCharge = useMemo(() => {
    if (!userCoordinates || !selectedShop?.latitude || !selectedShop?.longitude) {
      return DELIVERY_CHARGE; // Default charge if location unavailable
    }

    const distanceInKm = calculateDistance(
      userCoordinates.latitude,
      userCoordinates.longitude,
      selectedShop.latitude,
      selectedShop.longitude
    );

    // ₹10 per km, minimum ₹10
    return Math.max(10, Math.round(distanceInKm * 10));
  }, [userCoordinates, selectedShop]);

  // Apply free delivery for first 3 orders
  const deliveryCharge = useMemo(() => {
    if (orderCount === null) return calculatedDeliveryCharge; // Still loading
    return orderCount < 3 ? 0 : calculatedDeliveryCharge;
  }, [orderCount, calculatedDeliveryCharge]);

  // Calculate free delivery discount amount
  const freeDeliveryDiscount = useMemo(() => {
    if (orderCount === null) return 0;
    return orderCount < 3 ? calculatedDeliveryCharge : 0;
  }, [orderCount, calculatedDeliveryCharge]);

  const subtotal = getTotalPrice();
  const total = subtotal + deliveryCharge - discount;

  useEffect(() => {
    setAddress(defaultAddress);
    setAddressForm(defaultAddress);
  }, [defaultAddress]);

  const handleChangeAddress = () => {
    setAddressForm(address);
    setShowAddressModal(true);
  };

  const handleAddressFieldChange = (field: keyof Address, value: string) => {
    setAddressForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveAddress = () => {
    const requiredFields: Array<keyof Address> = [
      'contactName',
      'phone',
      'street',
      'city',
      'state',
      'postalCode',
    ];

    const missingField = requiredFields.find((field) => {
      const value = addressForm[field];
      if (typeof value === 'string') {
        return value.trim().length === 0;
      }
      return !value;
    });

    if (missingField) {
      Alert.alert('Incomplete Address', 'Please fill in all required address fields.');
      return;
    }

    const sanitizedAddress: Address = {
      ...addressForm,
      contactName: addressForm.contactName.trim() || (user?.name ?? dummyAddress.contactName),
      phone: addressForm.phone.trim(),
      street: addressForm.street.trim(),
      city: addressForm.city.trim(),
      state: addressForm.state.trim(),
      postalCode: addressForm.postalCode.trim(),
      landmark: addressForm.landmark?.trim() || '',
    };

    setAddress(sanitizedAddress);
    setAddressForm(sanitizedAddress);
    if (isAuthenticated) {
      updateAddress(sanitizedAddress);
    }
    setShowAddressModal(false);
  };

  const handleAddMoreItems = () => {
    router.push('/(tabs)');
  };

  const handleApplyCoupon = () => {
    if (couponCode.trim() === '') {
      Alert.alert('Error', 'Please enter a coupon code');
      return;
    }
    
    // Simulate coupon validation
    const upperCode = couponCode.toUpperCase();
    if (upperCode in COUPON_CODES) {
      const discountAmount = COUPON_CODES[upperCode as keyof typeof COUPON_CODES];
      setDiscount(discountAmount);
      Alert.alert('Success', `Coupon applied! You saved ₹${discountAmount}`);
    } else {
      Alert.alert('Invalid Coupon', `The coupon code you entered is invalid. Try "${Object.keys(COUPON_CODES).join('" or "')}"`);
    }
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before checkout.');
      return;
    }

    let finalAddressId = user?.address?.id || '';

    // Ensure address is saved before proceeding to payment
    if (isAuthenticated && address) {
      try {
        // Save address to user profile if authenticated
        await updateAddress(address);
        // After saving, fetch fresh user profile to get the real address ID
        const freshProfile = await usersApi.getProfile();
        finalAddressId = freshProfile.address?.id || '';
      } catch (error) {
        console.error('Error saving address:', error);
        Alert.alert('Address Error', 'Failed to save delivery address. Please try again.');
        return;
      }
    }

    // Pass order data to payment page
    router.push({
      pathname: '/payment',
      params: {
        total: total.toString(),
        subtotal: subtotal.toString(),
        discount: discount.toString(),
        addressId: finalAddressId,
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerCard}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 200 }]}>
        <View>
          <View style={styles.deliverySection}>
            <View style={styles.deliverySectionHeader}>
              <MapPin size={20} color="#DC2626" strokeWidth={2} />
              <Text style={styles.deliverySectionTitle}>Deliver to Home</Text>
            </View>
            <Text style={styles.deliveryAddress}>
            {address.contactName}
            {'\n'}
            {address.phone}
            {'\n'}
            {address.street}
            {'\n'}
            {address.city}, {address.state} {address.postalCode}
            {address.landmark ? `\nLandmark: ${address.landmark}` : ''}
            </Text>
            <TouchableOpacity style={styles.changeButton} onPress={handleChangeAddress}>
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Details</Text>
            {cartItems.map((cartItem, index) => {
              const weightInKg = cartItem.product.weightInKg || 1.0;
              const pricePerKg = cartItem.product.pricePerKg || cartItem.product.price;
              const itemPrice = pricePerKg * weightInKg;
              const itemTotal = itemPrice * cartItem.quantity;

              return (
                <View key={index} style={styles.orderItem}>
                  <View style={styles.orderItemInfo}>
                    <Text style={styles.orderItemName}>{cartItem.product.name}</Text>
                    <Text style={styles.orderItemWeight}>
                      {cartItem.product.weight || `${weightInKg} kg`}
                    </Text>
                    <Text style={styles.orderItemPrice}>
                      ₹{itemPrice.toFixed(2)} × {cartItem.quantity}
                    </Text>
                  </View>
                  <Text style={styles.orderItemTotal}>₹{itemTotal.toFixed(2)}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add More Item</Text>
            <TouchableOpacity style={styles.addMoreButton} onPress={handleAddMoreItems}>
              <Plus size={20} color="#DC2626" strokeWidth={2} />
              <Text style={styles.addMoreText}>Add items from menu</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.couponSection}>
              <Text style={styles.sectionTitle}>Apply Coupon Code</Text>
              <View style={styles.couponInputContainer}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="Enter coupon code"
                  placeholderTextColor="#9CA3AF"
                  value={couponCode}
                  onChangeText={setCouponCode}
                />
                <TouchableOpacity style={styles.applyButton} onPress={handleApplyCoupon}>
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.billSummary}>
            <Text style={styles.billTitle}>BILL SUMMARY</Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Sub Total</Text>
              <Text style={styles.billValue}>₹{subtotal}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Restaurant charge</Text>
              <Text style={styles.billValue}>₹0</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Partner charge</Text>
              <Text style={styles.billValue}>₹{calculatedDeliveryCharge}</Text>
            </View>
            {freeDeliveryDiscount > 0 && (
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: '#22C55E' }]}>
                  🎉 Free delivery offer (First 3 orders)
                </Text>
                <Text style={[styles.billValue, { color: '#22C55E' }]}>-₹{freeDeliveryDiscount}</Text>
              </View>
            )}
            {discount > 0 && (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Discount</Text>
                <Text style={[styles.billValue, { color: '#22C55E' }]}>-₹{discount}</Text>
              </View>
            )}
            <View style={styles.billDivider} />
            <View style={styles.billRow}>
              <Text style={styles.billTotalLabel}>Total</Text>
              <Text style={styles.billTotalValue}>₹{total}</Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 40 }]}>
        <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
          <Text style={styles.placeOrderText}>Place Order</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showAddressModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.modalOverlayContent}>
            <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Update Delivery Address</Text>
                <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                  <X size={24} color="#1F2937" strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <ScrollView 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.modalScrollContent}
              >
                <View style={styles.inputContainer}>
                  <Text style={[styles.modalFieldLabel, styles.modalFieldLabelFirst]}>
                    Contact Name*
                  </Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="Enter recipient name"
                    placeholderTextColor="#9CA3AF"
                    value={addressForm.contactName}
                    onChangeText={(value) => handleAddressFieldChange('contactName', value)}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.modalFieldLabel}>Mobile Number*</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="10-digit mobile number"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={addressForm.phone}
                    onChangeText={(value) => handleAddressFieldChange('phone', value)}
                    maxLength={15}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.modalFieldLabel}>Street & House No.*</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="House number, street name"
                    placeholderTextColor="#9CA3AF"
                    value={addressForm.street}
                    onChangeText={(value) => handleAddressFieldChange('street', value)}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.modalRow}>
                  <View style={[styles.modalHalfField, styles.inputContainer]}>
                    <Text style={styles.modalFieldLabel}>City*</Text>
                    <TextInput
                      style={styles.modalTextInput}
                      placeholder="City"
                      placeholderTextColor="#9CA3AF"
                      value={addressForm.city}
                      onChangeText={(value) => handleAddressFieldChange('city', value)}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={[styles.modalHalfField, styles.inputContainer]}>
                    <Text style={styles.modalFieldLabel}>State*</Text>
                    <TextInput
                      style={styles.modalTextInput}
                      placeholder="State"
                      placeholderTextColor="#9CA3AF"
                      value={addressForm.state}
                      onChangeText={(value) => handleAddressFieldChange('state', value)}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.modalFieldLabel}>Postal Code*</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="PIN / ZIP code"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    value={addressForm.postalCode}
                    onChangeText={(value) => handleAddressFieldChange('postalCode', value)}
                    maxLength={10}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.modalFieldLabel}>Landmark (optional)</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="Nearby landmark to help locate you"
                    placeholderTextColor="#9CA3AF"
                    value={addressForm.landmark}
                    onChangeText={(value) => handleAddressFieldChange('landmark', value)}
                    autoCapitalize="words"
                  />
                </View>
              </ScrollView>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowAddressModal(false);
                  }}
                >
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSave]}
                  onPress={handleSaveAddress}
                >
                  <Text style={styles.modalButtonSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 80,
  },
  deliverySection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  deliverySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  deliverySectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  deliveryAddress: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  changeButton: {
    alignSelf: 'flex-start',
  },
  changeButtonText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  orderItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  orderItemWeight: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  orderItemPrice: {
    fontSize: 13,
    color: '#6B7280',
  },
  orderItemTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  addMoreButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderStyle: 'dashed',
  },
  addMoreText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
  },
  couponSection: {
    marginBottom: 4,
  },
  couponInputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  couponInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    fontSize: 14,
    color: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  applyButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  billSummary: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  billTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  billLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  billValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  billTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  billTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  placeOrderButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  placeOrderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalOverlayContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalScrollContent: {
    paddingBottom: 10,
  },
  inputContainer: {
    marginBottom: 20,
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
  modalFieldLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 0,
    letterSpacing: 0.2,
  },
  modalFieldLabelFirst: {
    marginTop: 0,
  },
  modalRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalHalfField: {
    flex: 1,
  },
  modalTextInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 48,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
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
