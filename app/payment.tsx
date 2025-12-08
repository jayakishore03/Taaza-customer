import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { ChevronLeft, ShieldCheck, CreditCard, SmartphoneNfc, Wallet } from 'lucide-react-native';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ordersApi } from '../lib/api/orders';
import { paymentsApi } from '../lib/api/payments';
import { getAuthToken } from '../lib/auth/helper';
import { DELIVERY_CHARGE } from '../data/dummyData';
import RazorpayCheckout from '../components/RazorpayCheckout';

type PaymentMethod = 'upi' | 'card' | 'cod';

const METHOD_CONFIG: Record<
  PaymentMethod,
  {
    title: string;
    description: string;
    icon: React.ReactNode;
    accent: string;
  }
> = {
  upi: {
    title: 'UPI',
    description: 'Pay using UPI apps like PhonePe, Google Pay, Paytm',
    icon: <SmartphoneNfc size={22} color="#2563EB" strokeWidth={2} />,
    accent: '#DBEAFE',
  },
  card: {
    title: 'Credit / Debit Card',
    description: 'Visa, Mastercard, Rupay cards supported',
    icon: <CreditCard size={22} color="#059669" strokeWidth={2} />,
    accent: '#DCFCE7',
  },
  cod: {
    title: 'Cash on Delivery',
    description: 'Pay with cash when the order arrives',
    icon: <Wallet size={22} color="#F97316" strokeWidth={2} />,
    accent: '#FFEDD5',
  },
};

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { total = '0', subtotal = '0', discount = '0', addressId = '' } = useLocalSearchParams<{
    total?: string;
    subtotal?: string;
    discount?: string;
    addressId?: string;
  }>();

  const { cartItems, clearCart, selectedShop } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [razorpayOrder, setRazorpayOrder] = useState<{
    orderId: string;
    amount: number;
  } | null>(null);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [userCoordinates, setUserCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Razorpay Key ID (from environment or use test key)
  const RAZORPAY_KEY_ID = 'rzp_test_RkgC2RZSP1gZNW';

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

  const handleConfirmPayment = async () => {
    // Address is already collected in checkout page
    // Check if we have addressId or can create one from user data
    let finalAddressId = addressId || user?.address?.id || '';
    
    // Ensure we have a valid address ID (not empty string)
    if (!finalAddressId || finalAddressId === '') {
      console.error('No valid address ID found');
      console.error('addressId from params:', addressId);
      console.error('user.address:', user?.address);
      Alert.alert(
        'Address Required', 
        'Please go back to checkout and set a delivery address before placing your order.',
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      );
      return;
    }
    
    console.log('Using address ID:', finalAddressId);
    
    const isCod = selectedMethod === 'cod';
    const title = isCod ? 'Confirm Cash on Delivery' : 'Confirm Payment';
    const message = isCod
      ? `Place this order with Cash on Delivery?\nAmount due: ₹${total}`
      : `Pay ₹${total} using ${METHOD_CONFIG[selectedMethod].title}?`;
    const confirmText = isCod ? 'Confirm' : 'Pay Now';

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: confirmText,
        onPress: async () => {
          setIsProcessing(true);
          try {
            // Set auth token
            await getAuthToken();

            // For Cash on Delivery, create order directly
            if (isCod) {
              console.log('Creating COD order with address:', finalAddressId);
              const order = await ordersApi.create({
                shopId: selectedShop?.id || undefined,
                addressId: finalAddressId,
                items: cartItems.map((item) => {
                  const weightInKg = item.product.weightInKg || 1.0;
                  const pricePerKg = item.product.pricePerKg || item.product.price;
                  const itemPrice = pricePerKg * weightInKg * item.quantity;

                  return {
                    productId: item.product.id,
                    name: item.product.name,
                    quantity: item.quantity,
                    weight: item.product.weight || '',
                    weightInKg: weightInKg,
                    price: itemPrice,
                    pricePerKg: pricePerKg,
                    imageUrl: typeof item.product.image === 'string' ? item.product.image : '',
                  };
                }),
                subtotal: parseFloat(subtotal),
                deliveryCharge: deliveryCharge,
                discount: parseFloat(discount),
                paymentMethodText: 'Cash on Delivery',
              });

              clearCart();
              Alert.alert('Order Confirmed', 'Your order has been placed with Cash on Delivery. Please keep the amount ready.', [
                {
                  text: 'View Orders',
                  onPress: () => router.replace('/(tabs)/orders'),
                },
              ]);
              return;
            }

            // For online payments (UPI/Card), create Razorpay order and open checkout
            const totalAmount = parseFloat(total);
            const razorpayOrderData = await paymentsApi.createOrder({
              amount: totalAmount,
              currency: 'INR',
              receipt: `order_${Date.now()}`,
              notes: {
                userId: user?.id || '',
                addressId: finalAddressId || '',
                shopId: selectedShop?.id || '',
              },
            });

            // Store order data and open Razorpay checkout
            setRazorpayOrder({
              orderId: razorpayOrderData.orderId,
              amount: totalAmount,
            });
            setShowRazorpay(true);
          } catch (error: any) {
            console.error('Error processing payment:', error);
            Alert.alert('Payment Failed', error.message || 'Failed to process payment. Please try again.');
          } finally {
            setIsProcessing(false);
          }
        },
      },
    ]);
  };

  // Handle Razorpay payment success
  const handleRazorpaySuccess = async (paymentId: string, orderId: string, signature: string) => {
    try {
      setIsProcessing(true);
      setShowRazorpay(false);

      // Verify payment on backend
      await paymentsApi.verifyPayment({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });

      const finalAddressId = addressId || user?.address?.id || '';

      console.log('Creating order after payment with address:', finalAddressId);
      
      // Create order after successful payment verification
      await ordersApi.create({
        shopId: selectedShop?.id || undefined,
        addressId: finalAddressId,
        items: cartItems.map((item) => {
          const weightInKg = item.product.weightInKg || 1.0;
          const pricePerKg = item.product.pricePerKg || item.product.price;
          const itemPrice = pricePerKg * weightInKg * item.quantity;

          return {
            productId: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            weight: item.product.weight || '',
            weightInKg: weightInKg,
            price: itemPrice,
            pricePerKg: pricePerKg,
            imageUrl: typeof item.product.image === 'string' ? item.product.image : '',
          };
        }),
        subtotal: parseFloat(subtotal),
        deliveryCharge: deliveryCharge,
        discount: parseFloat(discount),
        paymentMethodText: `${METHOD_CONFIG[selectedMethod].title} • Razorpay`,
      });

      clearCart();
      Alert.alert('Payment Successful', 'Your payment was successful and the order has been placed.', [
        {
          text: 'View Orders',
          onPress: () => router.replace('/(tabs)/orders'),
        },
      ]);
    } catch (error: any) {
      console.error('Error processing payment:', error);
      Alert.alert('Payment Verification Failed', error.message || 'Failed to verify payment. Please contact support.');
    } finally {
      setIsProcessing(false);
      setRazorpayOrder(null);
    }
  };

  // Handle Razorpay payment failure
  const handleRazorpayFailure = (error: any) => {
    setShowRazorpay(false);
    setRazorpayOrder(null);
    Alert.alert('Payment Failed', error?.description || 'Payment was cancelled or failed. Please try again.');
  };

  // Handle Razorpay close
  const handleRazorpayClose = () => {
    setShowRazorpay(false);
    setRazorpayOrder(null);
  };

  const renderMethodCard = (method: PaymentMethod) => {
    const config = METHOD_CONFIG[method];
    const isSelected = selectedMethod === method;

    return (
      <TouchableOpacity
        key={method}
        style={[
          styles.methodCard,
          isSelected && { borderColor: '#DC2626', backgroundColor: config.accent },
        ]}
        onPress={() => setSelectedMethod(method)}
        activeOpacity={0.9}
      >
        <View style={styles.methodIcon}>{config.icon}</View>
        <View style={styles.methodInfo}>
          <Text style={styles.methodTitle}>{config.title}</Text>
          <Text style={styles.methodDescription}>{config.description}</Text>
        </View>
        {isSelected && (
          <ShieldCheck size={20} color="#DC2626" strokeWidth={2.5} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Amount Payable</Text>
          <Text style={styles.totalValue}>₹{total}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose payment method</Text>
          <View style={styles.methodList}>
            {renderMethodCard('upi')}
            {renderMethodCard('card')}
            {renderMethodCard('cod')}
          </View>
        </View>

        {selectedMethod === 'upi' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>UPI details</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter UPI ID (e.g., username@bank)"
              placeholderTextColor="#9CA3AF"
              value={upiId}
              onChangeText={setUpiId}
              autoCapitalize="none"
            />
            <Text style={styles.helperText}>We will request payment on the UPI app you select.</Text>
          </View>
        )}

        {selectedMethod === 'card' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Card details</Text>
            <TextInput
              style={styles.input}
              placeholder="Card number"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              value={cardNumber}
              onChangeText={setCardNumber}
              maxLength={16}
            />
            <View style={styles.cardRow}>
              <TextInput
                style={[styles.input, styles.cardHalf]}
                placeholder="MM/YY"
                placeholderTextColor="#9CA3AF"
                value={cardExpiry}
                onChangeText={setCardExpiry}
                maxLength={5}
              />
              <TextInput
                style={[styles.input, styles.cardHalf]}
                placeholder="CVV"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                value={cardCvv}
                onChangeText={setCardCvv}
                maxLength={3}
                secureTextEntry
              />
            </View>
            <Text style={styles.helperText}>Your card details are encrypted and secure.</Text>
          </View>
        )}

        {selectedMethod === 'cod' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cash on delivery</Text>
            <Text style={styles.helperText}>
              Please keep the exact amount ready. Our delivery partner will carry limited change.
            </Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Razorpay Checkout Modal */}
      <Modal
        visible={showRazorpay}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleRazorpayClose}
      >
        {razorpayOrder && (
          <RazorpayCheckout
            orderId={razorpayOrder.orderId}
            amount={razorpayOrder.amount}
            keyId={RAZORPAY_KEY_ID}
            name="Taza"
            description={`Order payment - ₹${razorpayOrder.amount}`}
            prefill={{
              email: user?.email || undefined,
              contact: user?.phone || undefined,
            }}
            onSuccess={handleRazorpaySuccess}
            onFailure={handleRazorpayFailure}
            onClose={handleRazorpayClose}
          />
        )}
      </Modal>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          onPress={handleConfirmPayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.payButtonText}>
              {selectedMethod === 'cod' ? 'Place Order' : 'Pay Securely'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },
  header: {
    backgroundColor: '#DC2626',
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  totalCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 6,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  methodList: {
    gap: 12,
  },
  methodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
    gap: 4,
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  methodDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardHalf: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  payButton: {
    marginTop: 16,
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
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
});

