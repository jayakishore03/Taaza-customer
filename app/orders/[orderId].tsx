import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, PackageCheck } from 'lucide-react-native';
import {
  getImageSource,
  type OrderSummary,
  type OrderStatus,
} from '../../data/dummyData';
import { ordersApi } from '../../lib/api/orders';
import { getAuthToken } from '../../lib/auth/helper';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { ActivityIndicator, Alert } from 'react-native';

const statusStyles: Record<
  OrderStatus,
  { labelColor: string; pillColor: string }
> = {
  'Out for Delivery': {
    labelColor: '#1D4ED8',
    pillColor: '#DBEAFE',
  },
  Preparing: {
    labelColor: '#D97706',
    pillColor: '#FEF3C7',
  },
  Delivered: {
    labelColor: '#059669',
    pillColor: '#D1FAE5',
  },
  Cancelled: {
    labelColor: '#DC2626',
    pillColor: '#FEE2E2',
  },
};

export default function OrderDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || !user) {
        setIsLoading(false);
        return;
      }

      try {
        // Set API token (Supabase auth only)
        await getAuthToken();

        // Fetch order from backend API
        const orderData = await ordersApi.getById(orderId);
        setOrder(orderData);
      } catch (error) {
        console.error('Error fetching order:', error);
        Alert.alert('Error', 'Failed to load order details', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, user, router]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerCard}>
            <View style={styles.headerContent}>
              <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
                <ChevronLeft size={22} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
              <View style={styles.headerTextBlock}>
                <Text style={styles.headerTitle}>Order details</Text>
                <Text style={styles.headerSubtitle}>Loading...</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>Loading order...</Text>
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
        <Text style={styles.missingTitle}>Order not found</Text>
        <Text style={styles.missingSubtitle}>
          We couldn&apos;t locate that order. Please go back and try again.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(tabs)/orders')}
        >
          <Text style={styles.backButtonText}>Return to Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const meta = statusStyles[order.status];

  const handleTrackOrder = () => {
    router.push({
      pathname: '/orders/[orderId]/tracking',
      params: { orderId: order.id },
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerCard}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
              <ChevronLeft size={22} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={styles.headerTextBlock}>
              <Text style={styles.headerTitle}>Order details</Text>
              <Text style={styles.headerSubtitle}>{order.orderNumber}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.statusCard}>
          <View
            style={[styles.statusPill, { backgroundColor: meta.pillColor }]}
          >
            <PackageCheck size={18} color={meta.labelColor} strokeWidth={2} />
            <Text style={[styles.statusLabel, { color: meta.labelColor }]}>
              {order.status}
            </Text>
          </View>
          <Text style={styles.statusNote}>{order.statusNote}</Text>
          {order.deliveryEta && (
            <Text style={styles.deliveryEta}>{order.deliveryEta}</Text>
          )}
          <TouchableOpacity style={styles.trackButton} onPress={handleTrackOrder}>
            <Text style={styles.trackButtonText}>Track order</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order summary</Text>
            <Text style={styles.sectionSubtitle}>{order.parentOrder}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Placed on</Text>
            <Text style={styles.value}>{order.placedOn}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment method</Text>
            <Text style={styles.value}>{order.paymentMethod}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total amount</Text>
            <Text style={styles.total}>{order.total}</Text>
          </View>
        </View>

        {order.specialInstructions && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Special Instructions</Text>
            </View>
            <Text style={styles.instructionsText}>{order.specialInstructions}</Text>
          </View>
        )}

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Items in this order</Text>
            <Text style={styles.sectionSubtitle}>{order.shopName}</Text>
          </View>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemBlock}>
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
              <View style={styles.itemInfo}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>{item.price}</Text>
                </View>
                <Text style={styles.itemMeta}>
                  {item.quantity} • {item.weight || (item.weightInKg ? `${item.weightInKg}kg` : '')}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Store & contact</Text>
            <Text style={styles.sectionSubtitle}>{order.shopName}</Text>
          </View>
          <Text style={styles.infoLine}>{order.shopAddress}</Text>
          <Text style={styles.infoLine}>Phone: {order.shopContact}</Text>
        </View>

        <View style={{ height: 32 }} />
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextBlock: {
    flex: 1,
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
    gap: 18,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusNote: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  deliveryEta: {
    fontSize: 12,
    color: '#6B7280',
  },
  trackButton: {
    marginTop: 4,
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  trackButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
  },
  value: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
  },
  total: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '700',
  },
  itemBlock: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    resizeMode: 'cover',
  },
  itemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImagePlaceholderText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  itemInfo: {
    flex: 1,
    gap: 6,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  itemMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  infoLine: {
    fontSize: 13,
    color: '#1F2937',
  },
  instructionsText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  missingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  missingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 24,
  },
  backButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});

