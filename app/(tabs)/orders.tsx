import { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { Clock, PackageCheck, Truck } from 'lucide-react-native';
import { getImageSource, type OrderStatus, type OrderSummary } from '../../data/dummyData';
import { useAuth } from '../../contexts/AuthContext';
import { ordersApi } from '../../lib/api/orders';
import { getAuthToken } from '../../lib/auth/helper';

const statusStyles: Record<OrderStatus, { labelColor: string; pillColor: string; icon: React.ReactNode }> = {
  'Out for Delivery': {
    labelColor: '#1D4ED8',
    pillColor: '#DBEAFE',
    icon: <Truck size={16} color="#1D4ED8" strokeWidth={2} />,
  },
  Preparing: {
    labelColor: '#D97706',
    pillColor: '#FEF3C7',
    icon: <Clock size={16} color="#D97706" strokeWidth={2} />,
  },
  Delivered: {
    labelColor: '#059669',
    pillColor: '#D1FAE5',
    icon: <PackageCheck size={16} color="#059669" strokeWidth={2} />,
  },
  Cancelled: {
    labelColor: '#DC2626',
    pillColor: '#FEE2E2',
    icon: <Clock size={16} color="#DC2626" strokeWidth={2} />,
  },
};

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State to track which orders should show OTP
  const [showOtpForOrders, setShowOtpForOrders] = useState<Set<string>>(new Set());

  // Set API token and fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated || !user) {
        setIsLoading(false);
        return;
      }

      try {
        // Set API token (Supabase auth only)
        await getAuthToken();

        // Fetch orders from backend API
        const ordersData = await ordersApi.getAll();
        console.log('Fetched orders:', JSON.stringify(ordersData, null, 2));
        console.log('First order items:', ordersData[0]?.items);
        setOrders(ordersData);
      } catch (error) {
        console.error('Error fetching orders:', error);
        Alert.alert('Error', 'Failed to load orders. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, user]);

  const partitionedOrders = useMemo(() => {
    const active: OrderSummary[] = [];
    const past: OrderSummary[] = [];

    orders.forEach((order) => {
      if (order.status === 'Delivered' || order.status === 'Cancelled') {
        past.push(order);
      } else {
        active.push(order);
      }
    });

    return { active, past };
  }, [orders]);

  // Function to check if OTP should be shown for a delivered order
  const shouldShowOtp = (order: OrderSummary): boolean => {
    // Always show OTP for non-delivered orders
    if (order.status !== 'Delivered') {
      return true;
    }

    // For delivered orders, check if 2 minutes have passed
    if (order.deliveredAt) {
      const deliveredTime = new Date(order.deliveredAt).getTime();
      const currentTime = Date.now();
      const twoMinutesInMs = 2 * 60 * 1000;
      const timeSinceDelivery = currentTime - deliveredTime;
      
      return timeSinceDelivery < twoMinutesInMs;
    }

    // If no deliveredAt timestamp, show OTP (for backward compatibility)
    return true;
  };

  // Update OTP visibility every second for delivered orders
  useEffect(() => {
    if (orders.length === 0) return;

    const interval = setInterval(() => {
      const ordersToShowOtp = new Set<string>();
      orders.forEach((order) => {
        if (shouldShowOtp(order)) {
          ordersToShowOtp.add(order.id);
        }
      });
      setShowOtpForOrders(ordersToShowOtp);
    }, 1000); // Check every second

    // Initial check
    const ordersToShowOtp = new Set<string>();
    orders.forEach((order) => {
      if (shouldShowOtp(order)) {
        ordersToShowOtp.add(order.id);
      }
    });
    setShowOtpForOrders(ordersToShowOtp);

    return () => clearInterval(interval);
  }, [orders]);

  // Check authentication and redirect if not signed in
  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to view your orders.',
        [
          {
            text: 'Sign In',
            onPress: () => {
              router.replace({
                pathname: '/signin',
                params: { redirectPath: pathname },
              });
            },
          },
        ],
        { cancelable: false }
      );
    }
  }, [isAuthenticated, router, pathname]);

  const handleViewOrder = (orderId: string) => {
    router.push({
      pathname: '/orders/[orderId]',
      params: { orderId },
    });
  };

  const handleTrackOrder = (orderId: string) => {
    router.push({
      pathname: '/orders/[orderId]/tracking',
      params: { orderId },
    });
  };

  // Don't render content if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerCard}>
            <Text style={styles.headerTitle}>Orders</Text>
            <Text style={styles.headerSubtitle}>Please sign in to view your orders</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Sign in required to access orders</Text>
        </View>
      </View>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerCard}>
            <Text style={styles.headerTitle}>Orders</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.emptyText}>Loading orders...</Text>
        </View>
      </View>
    );
  }

  const renderOrderCard = (order: OrderSummary) => {
    const meta = statusStyles[order.status];
    const showOtp = showOtpForOrders.has(order.id);

    return (
      <View key={order.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
            <Text style={styles.parentOrder}>{order.parentOrder}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: meta.pillColor }]}>
            {meta.icon}
            <Text style={[styles.statusLabel, { color: meta.labelColor }]}>{order.status}</Text>
          </View>
        </View>

        {showOtp && (
          <View style={styles.otpContainer}>
            <Text style={styles.otpLabel}>Order OTP</Text>
            <View style={styles.otpBox}>
              <Text style={styles.otpText}>{order.otp}</Text>
            </View>
            <Text style={styles.otpNote}>Share this OTP with delivery agent</Text>
          </View>
        )}

        {/* Shop Information - Always show if available */}
        {(order.shopName || order.shopImage) && (
          <View style={styles.shopInfoContainer}>
            {order.shopImage && (
              <Image source={{ uri: order.shopImage }} style={styles.shopImage} />
            )}
            <View style={styles.shopDetails}>
              {order.shopName && (
                <Text style={styles.shopName}>{order.shopName}</Text>
              )}
              {order.shopAddress && (
                <Text style={styles.shopAddress}>{order.shopAddress}</Text>
              )}
              {order.shopContact && (
                <Text style={styles.shopContact}>{order.shopContact}</Text>
              )}
            </View>
          </View>
        )}
        <Text style={styles.placedOn}>{order.placedOn}</Text>

        {/* Order Items - Display all items with full details */}
        <View style={styles.itemsContainer}>
          {order.items && order.items.length > 0 ? (
            order.items.map((item, index) => (
              <View key={`${item.productId || index}-${index}`} style={styles.itemRow}>
                {item.image ? (
                  <Image 
                    source={typeof item.image === 'string' ? { uri: item.image } : getImageSource(item.image)} 
                    style={styles.itemImage} 
                  />
                ) : (
                  <View style={styles.itemImagePlaceholder}>
                    <Text style={styles.itemImagePlaceholderText}>No Image</Text>
                  </View>
                )}
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name || 'Unknown Product'}</Text>
                  <Text style={styles.itemMeta}>
                    Qty: {item.quantity || 1} {item.weight ? `• ${item.weight}` : ''} {item.weightInKg ? `(${item.weightInKg}kg)` : ''}
                  </Text>
                  {item.pricePerKg && (
                    <Text style={styles.itemPricePerKg}>{item.pricePerKg}</Text>
                  )}
                  <Text style={styles.itemPrice}>Total: {item.price || '₹0.00'}</Text>
                </View>
                <TouchableOpacity onPress={() => handleViewOrder(order.id)} style={styles.viewItemButton}>
                  <Text style={styles.itemAction}>View item</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.noItemsText}>No items found in this order</Text>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Order total</Text>
            <Text style={styles.totalAmount}>{order.total}</Text>
          </View>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => handleTrackOrder(order.id)}>
            <Text style={styles.secondaryButtonText}>Track order</Text>
          </TouchableOpacity>
        </View>

        {order.statusNote && (
          <Text style={[styles.statusNote, { color: '#D97706' }]}>{order.statusNote}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Orders</Text>
          <Text style={styles.headerSubtitle}>Track active deliveries and revisit past orders</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {partitionedOrders.active.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Orders</Text>
            <Text style={styles.sectionSubtitle}>These orders are still being processed</Text>
            {partitionedOrders.active.map(renderOrderCard)}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order History</Text>
          <Text style={styles.sectionSubtitle}>Delivered and cancelled orders for quick reference</Text>
          {partitionedOrders.past.map(renderOrderCard)}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#FEE2E2',
    marginTop: 6,
  },
  scrollContent: {
    padding: 20,
    gap: 28,
  },
  section: {
    gap: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  parentOrder: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  shopInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  shopImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    resizeMode: 'cover',
  },
  shopDetails: {
    flex: 1,
    gap: 4,
  },
  shopName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  shopAddress: {
    fontSize: 12,
    color: '#6B7280',
  },
  shopContact: {
    fontSize: 12,
    color: '#6B7280',
  },
  placedOn: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  itemsContainer: {
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  itemImage: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    resizeMode: 'cover',
  },
  itemImagePlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImagePlaceholderText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  itemDetails: {
    flex: 1,
    gap: 4,
    marginRight: 8,
  },
  viewItemButton: {
    alignSelf: 'flex-start',
    paddingTop: 2,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemPricePerKg: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
    marginTop: 2,
  },
  itemAction: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  noItemsText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    padding: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  statusNote: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  otpContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 8,
  },
  otpLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  otpBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#059669',
  },
  otpText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 4,
  },
  otpNote: {
    fontSize: 11,
    color: '#059669',
    textAlign: 'center',
  },
});

