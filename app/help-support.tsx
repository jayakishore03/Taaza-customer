import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ChevronLeft, HelpCircle, Package } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { dummyOrders, type OrderSummary } from '../data/dummyData';

export default function HelpSupportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // Get user's orders (in real app, filter by user ID)
  const userOrders = isAuthenticated ? dummyOrders : [];

  const handleOrderHelp = (order: OrderSummary) => {
    Alert.alert(
      `Help with ${order.orderNumber}`,
      `What do you need help with for this order?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Track Order',
          onPress: () => {
            router.push({
              pathname: '/orders/[orderId]/tracking',
              params: { orderId: order.id },
            });
          },
        },
        {
          text: 'View Details',
          onPress: () => {
            router.push({
              pathname: '/orders/[orderId]',
              params: { orderId: order.id },
            });
          },
        },
        {
          text: 'Report Issue',
          onPress: () => {
            Alert.alert(
              'Report Issue',
              'Please describe the issue with your order',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Submit',
                  onPress: () => {
                    Alert.alert('Thank You', 'Your issue has been reported. Our team will contact you soon.');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerCard}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        {isAuthenticated && userOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Help with Your Orders</Text>
            <Text style={styles.sectionSubtitle}>Select an order to get help</Text>

            <View style={styles.ordersList}>
              {userOrders.map((order) => (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderCard}
                  onPress={() => handleOrderHelp(order)}
                >
                  <View style={styles.orderCardLeft}>
                    <View style={styles.orderIconContainer}>
                      <Package size={20} color="#DC2626" strokeWidth={2} />
                    </View>
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                      <Text style={styles.orderDate}>{order.placedOn}</Text>
                      <Text style={styles.orderStatus}>{order.status}</Text>
                    </View>
                  </View>
                  <ChevronLeft size={20} color="#9CA3AF" strokeWidth={2} style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {isAuthenticated && userOrders.length === 0 && (
          <View style={styles.emptySection}>
            <Package size={64} color="#E5E7EB" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptyText}>Once you place an order, you can get help with it here</Text>
          </View>
        )}

        {!isAuthenticated && (
          <View style={styles.emptySection}>
            <HelpCircle size={64} color="#E5E7EB" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Sign In Required</Text>
            <Text style={styles.emptyText}>Please sign in to view order-specific help options</Text>
          </View>
        )}
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  ordersList: {
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  orderCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  orderIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  orderStatus: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  emptySection: {
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
    paddingHorizontal: 40,
  },
});

